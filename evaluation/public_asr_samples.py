"""Fetch three public evaluation clips from a fixed revision of MoulSot-Full."""

import argparse
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

ROW_IDS = ["@lballonbdarija_53_150", "@lballonbdarija_53_158", "@lballonbdarija_53_153"]
REVISION = "b819a9340c44f51f97938ad47ee96c97d89289b5"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    params = urlencode({"dataset": "atlasia/MoulSot-Full", "config": "default", "split": "test"})
    with urlopen(f"https://datasets-server.huggingface.co/first-rows?{params}", timeout=30) as response:
        rows = json.load(response)["rows"][:3]
    if [entry["row"]["id"] for entry in rows] != ROW_IDS:
        raise RuntimeError("Public test subset differs from the published smoke test")
    args.output.mkdir(parents=True, exist_ok=True)
    manifest = []
    for entry in rows:
        row = entry["row"]
        src = row["audio"][0]["src"]
        if f"/{REVISION}/" not in src:
            raise RuntimeError("Public dataset viewer revision changed")
        name = f"sample-{entry['row_idx']}.wav"
        with urlopen(src, timeout=30) as response:
            payload = response.read(5_000_001)
        if len(payload) > 5_000_000:
            raise RuntimeError("Unexpected audio size")
        (args.output / name).write_bytes(payload)
        manifest.append(dict(id=row["id"], audio=name, text=row["text"], channel=row["channel"],
                             row_index=entry["row_idx"]))
    (args.output / "test.jsonl").write_text(
        "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in manifest), encoding="utf-8",
    )


if __name__ == "__main__":
    main()
