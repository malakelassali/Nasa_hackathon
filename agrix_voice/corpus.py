import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

from .audio import MAX_BYTES, SAMPLE_RATE, read_recording, wav_bytes


class Clip(BaseModel):
    id: str = Field(pattern=r"^[A-Za-z0-9_-]{1,80}$")
    audio: str
    speaker: str = Field(pattern=r"^[A-Za-z0-9_-]{1,40}$")
    text: str = Field(min_length=1, max_length=800)
    consent_training: Literal[True]
    region: str = Field(default="", max_length=80)
    environment: Literal["indoors", "outdoors", "unknown"] = "unknown"
    terms: list[str] = Field(default_factory=list, max_length=50)
    code_switch: bool = False
    noisy: bool = False


def normalize_transcript(text):
    text = unicodedata.normalize("NFKC", text).casefold().replace("ـ", "")
    text = "".join(
        str(unicodedata.decimal(c)) if c.isdecimal() else
        " " if unicodedata.category(c).startswith("P") else c
        for c in text if not ("\u0600" <= c <= "\u06ff" and unicodedata.category(c) == "Mn")
    )
    return re.sub(r"\s+", " ", text).strip()


def manifest_rows(path):
    with path.open(encoding="utf-8-sig") as stream:
        for line in stream:
            if line.strip():
                yield json.loads(line)


def prepare(source: Path, output: Path, seed: int):
    clips = []
    rejected = []
    digests = set()
    ids = set()
    speaker_codes = set()
    for path in sorted(source.glob("*.json")):
        try:
            clip = Clip.model_validate_json(path.read_text(encoding="utf-8"))
            if Path(clip.audio).name != clip.audio or not clip.audio.lower().endswith(".wav"):
                raise ValueError("Expected a local WAV filename")
            audio_path = (path.parent / clip.audio).resolve()
            if audio_path.parent != source.resolve() or audio_path.stat().st_size > MAX_BYTES:
                raise ValueError("Clip is outside the corpus or exceeds the size limit")
            data, stats = read_recording(audio_path.read_bytes())
            if stats["clipped_fraction"] > 0.02 or stats["rms_dbfs"] < -55:
                raise ValueError("Excessively clipped or quiet audio")
            if not normalize_transcript(clip.text):
                raise ValueError("Empty verified transcription")
            if clip.id in ids:
                raise ValueError("Duplicate clip ID")
            encoded = wav_bytes(data, SAMPLE_RATE)
            digest = hashlib.sha256(encoded).hexdigest()
            if digest in digests:
                raise ValueError("Duplicate recording")
            digests.add(digest)
            ids.add(clip.id)
            speaker_codes.add(clip.speaker)
            clips.append((clip, encoded, stats))
        except (OSError, ValueError) as exc:
            rejected.append({"file": path.name, "reason": (
                type(exc).__name__ if type(exc).__name__ == "ValidationError" else str(exc)
            )})
    if len(speaker_codes) < 3:
        raise ValueError(f"Need clips from at least three distinct speakers. "
                         f"Accepted {len(clips)} clip(s), rejected {len(rejected)}.")
    order = sorted(speaker_codes, key=lambda s: hashlib.sha256(f"{seed}:{s}".encode()).digest())
    holdout = max(1, round(len(order) * 0.15))
    groups = {s: "test" if i < holdout else "validation" if i < 2 * holdout else "train"
              for i, s in enumerate(order)}
    output.mkdir(parents=True, exist_ok=False)
    (output / "audio").mkdir()
    splits = {"train": [], "validation": [], "test": []}
    for clip, encoded, stats in clips:
        destination = output / "audio" / f"{clip.id}.wav"
        destination.write_bytes(encoded)
        splits[groups[clip.speaker]].append({
            **clip.model_dump(), **stats, "audio": destination.relative_to(output).as_posix(),
            "normalized": normalize_transcript(clip.text),
        })
    for name, rows in splits.items():
        (output / f"{name}.jsonl").write_text(
            "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows), encoding="utf-8",
        )
    (output / "rejected.json").write_text(json.dumps(rejected, indent=2), encoding="utf-8")
    return {name: len(rows) for name, rows in splits.items()}


def main():
    parser = argparse.ArgumentParser(description="Validate consented recordings and split by speaker")
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--seed", type=int, default=19)
    args = parser.parse_args()
    print(prepare(args.source, args.output, args.seed))


if __name__ == "__main__":
    main()
