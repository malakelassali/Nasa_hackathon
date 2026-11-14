"""Render the prototype's fixed replies once for fast local playback."""

import argparse
from pathlib import Path

from agrix_voice.models import LATIN_REPLIES, Synthesizer, hadra_reply_file


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path)
    parser.add_argument("--model")
    args = parser.parse_args()

    args.output.mkdir(parents=True, exist_ok=True)
    synth = Synthesizer("hadra", args.model)
    for index, text in enumerate(LATIN_REPLIES, start=1):
        output = hadra_reply_file(args.output, text)
        if output.exists():
            continue
        wav = synth.speak(text)
        pending = output.with_suffix(".tmp")
        pending.write_bytes(wav)
        pending.replace(output)
        print(f"Rendered reply {index}/{len(LATIN_REPLIES)}", flush=True)


if __name__ == "__main__":
    main()
