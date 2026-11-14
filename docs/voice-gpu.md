# Run AgriX ASR on an Intel Xeon and NVIDIA GPU

These steps assume one NVIDIA GPU on a Linux x86-64 host with Python 3.11 or 3.12, Git and a working NVIDIA driver. On Windows, use Ubuntu in WSL2 with NVIDIA GPU support and run the Bash commands there. The Intel Xeon handles audio preprocessing, while CUDA runs model inference and training. Allow about 30 GiB of free disk for the environment, model cache and checkpoints. Start training with a GPU with at least 24 GiB VRAM if available. Check the exact GPU and driver using `nvidia-smi`. The default wheel targets CUDA 12.8. [PyTorch CUDA wheel matrix](https://pytorch.org/get-started/previous-versions/#v280)

## 1. Clone and install

```bash
git clone --branch darija-text-to-speech https://github.com/malakelassali/Nasa_hackathon.git
cd Nasa_hackathon
nvidia-smi
bash scripts/gpu-asr.sh setup
```

The setup checks that PyTorch can allocate and use a CUDA tensor. For a driver and GPU that support CUDA 12.6 only, install the matching wheel with `AGRIX_TORCH_INDEX=https://download.pytorch.org/whl/cu126 bash scripts/gpu-asr.sh setup`. A more recent GPU may require CUDA 12.8 or newer. On a multi-GPU server use `CUDA_VISIBLE_DEVICES=0` or change the index to select your assigned GPU. The runner uses one GPU.

## 2. Compare the pretrained models using the two existing speakers

Copy **the whole `data/darija-pilot` directory** from the original computer to the same relative path in the clone. It contains the 40 WAV files, review metadata and the script-aligned manifest. Use a private drive or authorized transfer. Use an access-controlled destination because result JSON files also contain transcripts.

```bash
bash scripts/gpu-asr.sh benchmark data/darija-pilot/pilot-arabic-script.jsonl runs/gpu-pilot
```

The first run downloads MoulSot v0.3, MaghrebVoice, and Whisper Large V3 Turbo from Hugging Face. Each runs in its own process. The final table reports normalized word and character error rates, exact term recall, warm latency, and peak allocated VRAM. Model choice can improve accuracy. Running the same weights on a GPU mainly improves speed. Save the three JSON files under `runs/gpu-pilot`.

### Compare MoulSot decoding settings

From the existing clone, update the branch and run the comparison on the same clips:

```bash
cd ~/Nasa_hackathon
git pull --ff-only origin darija-text-to-speech
bash scripts/gpu-asr.sh tune-moulsot data/darija-pilot/pilot-arabic-script.jsonl runs/moulsot-tuning
```

The runner reuses the installed environment and cached model. It compares forced Arabic and automatic language detection, each with and without the same farming glossary. The `arabic-plain` row reruns the original settings. The final table includes word error on clips tagged as code-switched and counts exact glossary terms that appear in a hypothesis but are absent from its reference. Check those differences against the original audio before treating them as insertion errors. Use the pilot to shortlist settings, then validate them on recordings from new speakers. Share the aggregate table. The JSON reports include clip transcripts.

## Talk to the assistant

From Ubuntu on the GPU computer, run the following after setup:

```bash
cd ~/Nasa_hackathon
git pull --ff-only origin darija-text-to-speech
bash scripts/gpu-asr.sh voice-demo
```

Leave the terminal running and open [localhost:8000](http://localhost:8000) in the Windows browser. Allow microphone access. Click the microphone, speak, and click it again to finish. Review the transcript and click **صيفط**. If the browser blocks autoplay, press Play. The first reply can take longer while SpeechT5 and the vocoder download and load.

Try «العام اللي فات زرعت القمح، ودابا بغيت نبدل شوية». When asked about irrigation, reply «غير الشتا، ما عنديش السقي». The demo uses MoulSot with the farming glossary, a rule-based farming dialogue and the public SpeechT5 demo voice. The crop options are development examples. Inference runs in the local process and the pilot dataset is optional. [SpeechT5 Darija model](https://huggingface.co/HAMMALE/speecht5-darija)

### Try the HADRA voice

On the original Windows project checkout, stop the earlier demo with Ctrl+C, then run `powershell -ExecutionPolicy Bypass -File .\scripts\voice-demo-windows.ps1` and open [localhost:8001](http://localhost:8001). This launcher also accepts `-Python` with the path to an environment that has the project and HADRA requirements. It uses CPU with four threads and detects the local model cache used for development. CPU synthesis of a new reply is slow. Repeated replies reuse the audio during the same session, and the text appears while the voice is generated.

On the GPU workstation, use the following commands after the existing GPU setup. Use the same CUDA wheel index that you used for PyTorch.

```bash
.venv-gpu/bin/python -m pip install 'torchaudio==2.8.0' --index-url "${AGRIX_TORCH_INDEX:-https://download.pytorch.org/whl/cu128}"
.venv-gpu/bin/python -m pip install -r requirements-tts-hadra.txt
AGRIX_TTS_BACKEND=hadra bash scripts/gpu-asr.sh voice-demo
```

HADRA takes Arabic-script Darija and uses a short Moroccan reference clip to guide accent and cadence. The default is the published F1 sample. To evaluate an agreed AgriX voice, set both `AGRIX_HADRA_REFERENCE_WAV` and `AGRIX_HADRA_REFERENCE_TEXT` to a clean WAV and exactly what was spoken. The app downloads public model artifacts on first use and performs speech generation locally. [HADRA model](https://huggingface.co/Jip7e/habibi-tts-doda-darija) · [F1 reference](https://huggingface.co/Sakuragaoka/amber-hadra-webgpu)

For quick playback on the Windows CPU, render the prototype's fixed replies on the GPU and copy the generated `data/voice/hadra-replies` directory to the same path in the Windows checkout. The Windows launcher detects that directory. Use a fresh output directory if you change voice or checkpoint, since the renderer skips replies that already have audio.

```bash
AGRIX_DEVICE=cuda HF_HOME="$PWD/.hf-cache" WANDB_MODE=disabled \
  .venv-gpu/bin/python -m evaluation.render_hadra_replies data/voice/hadra-replies
```

## 3. Fine-tune after collecting more consented speech

The current 40 clips are enough for the pilot comparison. To train with separate train, validation and test speakers, add at least one more consented speaker. Three speakers only give one speaker per split, so use more speakers and a separate held-out group for a meaningful accuracy claim. Use a consistent Arabic-script Darija reference for Darija words and preserve French words. Place consented per-clip WAV/JSON pairs in `data/incoming`. Follow the [recording guide](../evaluation/RECORDING_GUIDE.md) for additional clips. Preserve the current pilot as a separate evaluation set if you can collect an independent training corpus.

If you include the pilot clips in the training corpus, use their script-aligned annotation as the training text and retain the same speaker codes. The following command copies the existing WAVs and their aligned reference metadata without modifying the pilot:

```bash
.venv-gpu/bin/python - <<'PY'
import json
import shutil
from pathlib import Path

source = Path("data/darija-pilot")
destination = Path("data/incoming")
destination.mkdir(parents=True, exist_ok=True)
for line in (source / "pilot-arabic-script.jsonl").read_text(encoding="utf-8").splitlines():
    row = json.loads(line)
    if row.get("consent_training") is not True:
        continue
    shutil.copy2(source / row["audio"], destination / row["audio"])
    (destination / (row["id"] + ".json")).write_text(
        json.dumps(row, ensure_ascii=False), encoding="utf-8"
    )
PY
bash scripts/gpu-asr.sh train data/incoming runs/gpu-whisper
```

The runner prepares a fixed speaker-disjoint split, trains a Whisper Large V3 Turbo LoRA adapter, then compares the adapter, unchanged Whisper base checkpoint, and unchanged MoulSot on the same test split. Retain `runs/gpu-whisper/whisper/adapter`, `training.json` in its parent directory, and the three benchmark reports. Choose weights based on the held-out results. Once any pilot clips enter training, use the held-out split for accuracy claims.

To resume, use the same model, batch settings and run directory. Replace `N` with the number in an existing checkpoint directory.

```bash
bash scripts/gpu-asr.sh train data/incoming runs/gpu-whisper runs/gpu-whisper/whisper/checkpoint-N
```

If a fresh run runs out of GPU memory, use a new run directory and set `AGRIX_BATCH_SIZE=1 AGRIX_ACCUMULATE=16`. Use `AGRIX_TRAIN_MODEL=openai/whisper-small` to test a lower-memory model. The model remains local during training, and scripts do not push checkpoints or corpus files.
