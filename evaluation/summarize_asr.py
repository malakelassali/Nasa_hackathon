"""Print aggregate ASR results without displaying any transcripts."""

import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--moulsot-tuning", action="store_true")
    parser.add_argument("reports", nargs="+", type=Path)
    args = parser.parse_args()
    header = f"{'Report':<25} {'Clips':>5} {'WER':>8} {'CER':>8} {'Terms':>8} {'Median s':>9} {'VRAM MiB':>9}"
    if args.moulsot_tuning:
        header += f" {'Mixed WER':>10} {'Extra terms':>11}"
    print(header)
    for path in args.reports:
        report = json.loads(path.read_text(encoding="utf-8"))
        metrics = report["metrics"]
        recall = metrics["term_recall"]
        terms = "—" if recall is None else f"{recall:.1%}"
        vram = report.get("peak_cuda_allocated_mib")
        memory = "—" if vram is None else f"{vram:.0f}"
        line = (f"{path.stem:<25} {metrics['samples']:>5} {metrics['normalized_wer']:>8.1%} "
                f"{metrics['normalized_cer']:>8.1%} {terms:>8} {metrics['median_seconds']:>9.2f} {memory:>9}")
        if args.moulsot_tuning:
            mixed = report.get("slices", {}).get("code_switch=True", {}).get("normalized_wer")
            mixed_wer = "—" if mixed is None else f"{mixed:.1%}"
            extra = report.get("glossary_extra_terms")
            line += f" {mixed_wer:>10} {extra if extra is not None else '—':>11}"
        print(line)


if __name__ == "__main__":
    main()
