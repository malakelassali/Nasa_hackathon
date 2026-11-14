"""Cut speaker-reviewed segments from the local recording review."""

import argparse
import json
from pathlib import Path
from typing import Literal

import soundfile as sf
from pydantic import BaseModel, Field, StringConstraints
from typing_extensions import Annotated

from agrix_voice.audio import MAX_SECONDS, SAMPLE_RATE, read_recording, wav_bytes


class ReviewedClip(BaseModel):
    speaker: Annotated[str, StringConstraints(pattern=r"^[A-Za-z0-9_-]{1,40}$")]
    category: Literal["read", "own", "reply"]
    prompt: int = Field(ge=1, le=20)
    start: float = Field(ge=0, allow_inf_nan=False)
    end: float = Field(gt=0, allow_inf_nan=False)
    text: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=800)]
    environment: Literal["indoors", "outdoors", "unknown"] = "unknown"


def import_review(review, sources, output, training_consent):
    clips = []
    used = set()
    audio = {}
    for raw in json.loads(review.read_text(encoding="utf-8-sig")):
        clip = ReviewedClip.model_validate(raw)
        clip_id = f"{clip.speaker}_P{clip.prompt:02}"
        expected_category = "read" if clip.prompt <= 8 else "own" if clip.prompt <= 14 else "reply"
        if clip_id in used or clip.category != expected_category or not 0.25 <= clip.end - clip.start <= MAX_SECONDS:
            raise ValueError(f"Duplicate prompt, category mismatch or invalid duration for {clip_id}")
        used.add(clip_id)
        key = f"{clip.speaker}-{clip.category}"
        if key not in audio:
            audio[key], rate = sf.read(sources / f"{key}.wav", dtype="float32")
            if rate != SAMPLE_RATE or audio[key].ndim != 1:
                raise ValueError(f"Expected 16 kHz mono WAV for {key}")
        start, end = round(clip.start * SAMPLE_RATE), round(clip.end * SAMPLE_RATE)
        if end > len(audio[key]):
            raise ValueError(f"End time exceeds audio duration for {clip_id}")
        payload = wav_bytes(audio[key][start:end], SAMPLE_RATE)
        read_recording(payload)
        row = clip.model_dump(exclude={"start", "end"})
        row.update(id=clip_id, audio=f"{clip_id}.wav", consent_training=training_consent)
        clips.append((row, payload))
    if not clips:
        raise ValueError("No verified clips")
    output.mkdir(parents=True, exist_ok=False)
    for row, payload in clips:
        (output / row["audio"]).write_bytes(payload)
        if training_consent:
            (output / f"{row['id']}.json").write_text(json.dumps(row, ensure_ascii=False), encoding="utf-8")
    (output / "pilot.jsonl").write_text(
        "".join(json.dumps(row, ensure_ascii=False) + "\n" for row, _ in clips), encoding="utf-8",
    )
    return len(clips)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("review", type=Path)
    parser.add_argument("sources", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--training-consent", action="store_true")
    args = parser.parse_args()
    print(f"Imported {import_review(args.review, args.sources, args.output, args.training_consent)} clips")


if __name__ == "__main__":
    main()
