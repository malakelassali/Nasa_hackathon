#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

usage() {
    cat <<'EOF'
Usage:
  bash scripts/gpu-asr.sh setup
  bash scripts/gpu-asr.sh benchmark MANIFEST OUTPUT_DIR
  bash scripts/gpu-asr.sh tune-moulsot MANIFEST OUTPUT_DIR
  bash scripts/gpu-asr.sh voice-demo
  bash scripts/gpu-asr.sh train ANNOTATION_DIR RUN_DIR [CHECKPOINT]

Training expects consented WAV/JSON pairs from at least three speakers.
Reuse RUN_DIR only when resuming from its checkpoint.
EOF
}

if [[ ${1:-} == setup && $# == 1 ]]; then
    if [[ $(uname -s) != Linux || $(uname -m) != x86_64 ]]; then
        echo "This runner expects Linux x86-64. On Windows use WSL2 with NVIDIA GPU support." >&2
        exit 1
    fi
    nvidia-smi
    python3 -c 'import sys; sys.exit(0 if sys.version_info[:2] in ((3, 11), (3, 12)) else "Use Python 3.11 or 3.12.")'
    python3 -m venv .venv-gpu
    py=.venv-gpu/bin/python
    "$py" -m pip install --upgrade pip
    "$py" -m pip install 'torch==2.8.0' --index-url "${AGRIX_TORCH_INDEX:-https://download.pytorch.org/whl/cu128}"
    "$py" -m pip install -r requirements-training.txt -r requirements-test.txt
    "$py" -m pip check
elif [[ ( ${1:-} == benchmark || ${1:-} == tune-moulsot ) && $# == 3 ]] \
    || [[ ${1:-} == train && ( $# == 3 || $# == 4 ) ]] \
    || [[ ${1:-} == voice-demo && $# == 1 ]]; then
    py=.venv-gpu/bin/python
    if [[ ! -x "$py" ]]; then
        echo "Run bash scripts/gpu-asr.sh setup first." >&2
        exit 1
    fi
else
    usage
    exit 2
fi

export AGRIX_DEVICE=cuda
export HF_HOME="${HF_HOME:-$PWD/.hf-cache}"
export HF_HUB_DISABLE_TELEMETRY=1
"$py" - <<'PY'
import torch

if not torch.cuda.is_available():
    raise SystemExit("CUDA is unavailable. Check nvidia-smi, the NVIDIA driver and the PyTorch wheel.")
print("GPU:", torch.cuda.get_device_name(), "| PyTorch CUDA:", torch.version.cuda, flush=True)
torch.zeros(1, device="cuda").add_(1).item()
PY

bench() {
    "$py" -m agrix_voice.benchmark asr "$1" "$2" --model "$3" --backend "$4" "${@:5}"
}

case "$1" in
    setup)
        "$py" -m unittest discover -s tests -v
        ;;
    benchmark)
        test -f "$2"
        bench "$2" "$3/moulsot.json" atlasia/moulsot.v0.3 qwen
        bench "$2" "$3/maghrebvoice.json" Ayoub-Laachir/MaghrebVoice whisper
        bench "$2" "$3/whisper-turbo.json" openai/whisper-large-v3-turbo whisper
        "$py" -m evaluation.summarize_asr "$3/moulsot.json" "$3/maghrebvoice.json" "$3/whisper-turbo.json"
        ;;
    tune-moulsot)
        test -f "$2"
        reports=()
        for language in arabic auto; do
            for glossary in plain glossary; do
                report="$3/$language-$glossary.json"
                options=()
                if [[ "$glossary" == glossary ]]; then
                    options+=(--farm-glossary)
                fi
                echo "Benchmarking MoulSot: $language, $glossary"
                bench "$2" "$report" atlasia/moulsot.v0.3 qwen --qwen-language "$language" "${options[@]}"
                reports+=("$report")
            done
        done
        "$py" -m evaluation.summarize_asr --moulsot-tuning "${reports[@]}"
        ;;
    voice-demo)
        export AGRIX_MODE=local AGRIX_CHAT_MODEL=rules
        export AGRIX_ASR_BACKEND=qwen AGRIX_ASR_MODEL=atlasia/moulsot.v0.3 AGRIX_ASR_FARM_GLOSSARY=1
        unset AGRIX_ASR_ADAPTER
        export AGRIX_TTS_BACKEND="${AGRIX_TTS_BACKEND:-speecht5}"
        export AGRIX_SPEECHT5_EMBEDDING="${AGRIX_SPEECHT5_EMBEDDING:-data/voice/public-demo-female.npy}"
        if [[ "$AGRIX_TTS_BACKEND" == hadra ]]; then
            export WANDB_MODE=disabled
            "$py" -c 'import f5_tts.infer.utils_infer'
        elif [[ "$AGRIX_TTS_BACKEND" == speecht5 && ! -f "$AGRIX_SPEECHT5_EMBEDDING" ]]; then
            "$py" - <<'PY'
import hashlib
import os
from pathlib import Path

import numpy as np
import torch
from huggingface_hub import hf_hub_download

source = Path(hf_hub_download(
    "HAMMALE/speecht5-darija", "female_embedding.pt", repo_type="space",
))
if hashlib.sha256(source.read_bytes()).hexdigest() != "9f87744b22b910652a6cc2645e99e9c2d6d63d4d8cb5e803dd0b8b520863ea0f":
    raise SystemExit("The SpeechT5 demo voice file changed. Supply a trusted .npy embedding via AGRIX_SPEECHT5_EMBEDDING.")
embedding = torch.load(source, map_location="cpu", weights_only=True)
destination = Path(os.environ["AGRIX_SPEECHT5_EMBEDDING"])
destination.parent.mkdir(parents=True, exist_ok=True)
with destination.open("wb") as output:
    np.save(output, embedding.numpy(), allow_pickle=False)
PY
        fi
        echo "Open http://localhost:8000 in your Windows browser."
        exec "$py" -m uvicorn agrix_voice.app:configured_app --factory --host 127.0.0.1 --port 8000
        ;;
    train)
        corpus="$3/corpus"
        model="${AGRIX_TRAIN_MODEL:-openai/whisper-large-v3-turbo}"
        options=()
        if [[ $# == 4 ]]; then
            options+=(--resume "$4")
            test -f "$corpus/test.jsonl"
        else
            if [[ -e "$3" ]]; then
                echo "Choose a new run directory or supply a checkpoint to resume." >&2
                exit 1
            fi
            "$py" -m agrix_voice.corpus "$2" "$corpus" --seed 19
        fi
        "$py" -m agrix_voice.train_asr "$corpus" "$3/whisper" --model "$model" \
            --epochs 3 --batch-size "${AGRIX_BATCH_SIZE:-2}" --accumulate "${AGRIX_ACCUMULATE:-8}" "${options[@]}"
        bench "$corpus/test.jsonl" "$3/baseline.json" "$model" whisper
        bench "$corpus/test.jsonl" "$3/finetuned.json" "$model" whisper --adapter "$3/whisper/adapter"
        bench "$corpus/test.jsonl" "$3/moulsot.json" atlasia/moulsot.v0.3 qwen
        "$py" -m evaluation.summarize_asr "$3/baseline.json" "$3/finetuned.json" "$3/moulsot.json"
        ;;
esac
