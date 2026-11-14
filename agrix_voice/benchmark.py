import argparse
import io
import json
import threading
import wave
from collections import defaultdict
from pathlib import Path
from statistics import median
from time import perf_counter

import psutil

from .audio import read_recording
from .conversation import Assistant
from .corpus import manifest_rows, normalize_transcript
from .farm import DevelopmentFarmTools
from .models import FARM_CONTEXT, FARM_GLOSSARY, ChatModel, Recognizer, Synthesizer, device


def distance(left, right):
    previous = list(range(len(right) + 1))
    for i, a in enumerate(left, 1):
        current = [i]
        for j, b in enumerate(right, 1):
            current.append(min(current[-1] + 1, previous[j] + 1, previous[j - 1] + (a != b)))
        previous = current
    return previous[-1]


def metrics(rows):
    result = {"samples": len(rows)}
    for key, transform in [("raw", lambda t: t), ("normalized", normalize_transcript)]:
        pairs = [(transform(row["text"]), transform(row["hypothesis"])) for row in rows]
        for name, tokenize in [("wer", str.split), ("cer", lambda text: list(text))]:
            tokenized = [(tokenize(a), tokenize(b)) for a, b in pairs]
            count = sum(len(a) for a, _ in tokenized)
            result[f"{key}_{name}"] = sum(distance(a, b) for a, b in tokenized) / count if count else None
    terms_hit = 0
    term_count = 0
    for row in rows:
        hypothesis = f" {normalize_transcript(row['hypothesis'])} "
        terms = {normalize_transcript(term) for term in row.get("terms", [])} - {""}
        term_count += len(terms)
        terms_hit += sum(f" {term} " in hypothesis for term in terms)
    result["term_recall"] = terms_hit / term_count if term_count else None
    result["term_count"] = term_count
    result["median_seconds"] = median(row["seconds_inference"] for row in rows)
    ordered = sorted(row["seconds_inference"] for row in rows)
    result["p95_seconds"] = ordered[min(len(ordered) - 1, (len(ordered) * 95 + 99) // 100 - 1)]
    return result


def glossary_extra_terms(rows):
    """Count unmatched exact glossary terms, once per term and clip."""
    glossary = {normalize_transcript(term) for term in FARM_GLOSSARY}
    count = 0
    for row in rows:
        reference = f" {normalize_transcript(row['text'])} "
        hypothesis = f" {normalize_transcript(row['hypothesis'])} "
        count += sum(f" {term} " in hypothesis and f" {term} " not in reference for term in glossary)
    return count


class PeakMemory:
    def __enter__(self):
        self.process = psutil.Process()
        self.peak = self.process.memory_info().rss
        self.stop = threading.Event()
        self.worker = threading.Thread(target=self.sample, daemon=True)
        self.worker.start()
        return self

    def sample(self):
        while not self.stop.wait(0.05):
            self.peak = max(self.peak, self.process.memory_info().rss)

    def __exit__(self, *_):
        self.stop.set()
        self.worker.join()
        self.peak = max(self.peak, self.process.memory_info().rss)


def asr(args):
    import torch

    rows = list(manifest_rows(args.input))
    if not rows:
        raise ValueError("Evaluation manifest is empty")
    recognizer = Recognizer(
        args.model, args.backend, args.adapter, args.revision, use_env=False,
        qwen_language=None if args.qwen_language == "auto" else "Arabic",
        qwen_context=FARM_CONTEXT if args.farm_glossary else "",
    )
    is_qwen = recognizer.backend == "qwen"
    if not is_qwen and (args.qwen_language == "auto" or args.farm_glossary):
        raise ValueError("Automatic language detection and the farm glossary require --backend qwen")
    target = device(torch)
    cuda = target == "cuda"
    if cuda:
        torch.cuda.reset_peak_memory_stats()
    predictions = []
    with PeakMemory() as memory:
        start = perf_counter()
        recognizer.model = recognizer.load()
        load_seconds = perf_counter() - start
        for row in rows:
            audio, audio_stats = read_recording((args.input.parent / row["audio"]).read_bytes())
            start = perf_counter()
            prediction = recognizer.transcribe(audio)
            if cuda:
                torch.cuda.synchronize()
            predictions.append({**row, "hypothesis": prediction, "seconds_inference": perf_counter() - start,
                                "seconds_audio": audio_stats["seconds"]})
    slices = defaultdict(list)
    for row in predictions:
        for field in ("speaker", "category", "region", "environment", "code_switch", "noisy"):
            if field in row:
                slices[f"{field}={row[field]}"].append(row)
    return {"model": recognizer.model_id, "revision": recognizer.revision, "adapter": recognizer.adapter,
            "qwen_language": args.qwen_language if is_qwen else None,
            "context": recognizer.qwen_context if is_qwen else None,
            "glossary_extra_terms": glossary_extra_terms(predictions) if is_qwen else None,
            "device": target, "gpu": torch.cuda.get_device_name() if cuda else None,
            "load_seconds": load_seconds, "peak_process_rss_mib": memory.peak / 2**20,
            "peak_cuda_allocated_mib": torch.cuda.max_memory_allocated() / 2**20 if cuda else None,
            "metrics": metrics(predictions), "slices": {key: metrics(group) for key, group in slices.items()},
            "clips": predictions}


def tts(args):
    synth = Synthesizer(args.backend, args.model)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    with PeakMemory() as memory:
        start = perf_counter()
        synth.model = synth.load()
        load_seconds = perf_counter() - start
        for i, case in enumerate(manifest_rows(args.input), 1):
            start = perf_counter()
            result = synth.speak(case["latin"] if args.backend == "speecht5" else case["text"])
            elapsed = perf_counter() - start
            with wave.open(io.BytesIO(result)) as audio:
                duration = audio.getnframes() / audio.getframerate()
            destination = args.output.with_suffix(f".{i:02}.wav")
            destination.write_bytes(result)
            rows.append({"id": case["id"], "seconds": elapsed, "audio_seconds": duration,
                         "real_time_factor": elapsed / duration, "audio": destination.name,
                         "native_listener_ratings": None})
    return {"model": synth.model_id, "load_seconds": load_seconds,
            "peak_process_rss_mib": memory.peak / 2**20, "clips": rows}


def chat(args):
    model = ChatModel(args.model)
    start = perf_counter()
    model.model = model.load()
    load_seconds = perf_counter() - start
    cases = []
    assistant = Assistant(DevelopmentFarmTools(), model)
    for case in manifest_rows(args.input):
        turns = []
        session = None
        for text in case["turns"]:
            start = perf_counter()
            result = assistant.turn(session, text)
            session = result["session_id"]
            turns.append({"text": text, "reply": result["reply"], "farm": result["farm"],
                          "planner": result["planner"],
                          "seconds": perf_counter() - start})
        expected = case.get("expected", {})
        actual = turns[-1]["farm"]
        matches = {key: actual.get(key) == value for key, value in expected.items()}
        cases.append({"id": case["id"], "turns": turns, "expected_slots": expected,
                      "slot_matches": matches, "native_listener_ratings": None})
    return {"model": model.model_id, "load_seconds": load_seconds, "cases": cases}


def main():
    parser = argparse.ArgumentParser(description="Run one model per process on a fixed evaluation set")
    parser.add_argument("task", choices=["asr", "tts", "chat"])
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--model")
    parser.add_argument("--backend")
    parser.add_argument("--adapter")
    parser.add_argument("--revision")
    parser.add_argument("--qwen-language", choices=("arabic", "auto"), default="arabic")
    parser.add_argument("--farm-glossary", action="store_true")
    args = parser.parse_args()
    result = {"asr": asr, "tts": tts, "chat": chat}[args.task](args)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
