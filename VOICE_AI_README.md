# AgriX Darija voice assistant

This is a standalone AgriX prototype. The GitHub remote had no source branches when development began, so the app uses a labeled farm-data adapter with example crop options and no NASA measurements.

For an Intel Xeon workstation with an NVIDIA GPU, follow the [GPU runbook](docs/voice-gpu.md).

## Run locally

Use Python 3.11 or 3.12. These commands are for PowerShell.

```powershell
py -3.12 -m venv .venv
$python = ".\.venv\Scripts\python.exe"
& $python -m pip install -r requirements-test.txt
$env:AGRIX_MODE = "demo"
& $python -m uvicorn agrix_voice.app:configured_app --factory --host 127.0.0.1 --port 8000
```

Open [localhost:8000](http://localhost:8000). Try `العام اللي فات زرعت القمح، ودابا بغيت نبدل شوية` and then `غير الشتا`. The assistant asks about irrigation and carries the crop into the next turn. Demo mode supports text and lets the recording studio export clips with manually verified transcripts.

### Enable local voice models

Install `requirements-models.txt` for ASR and the local conversation parser. If using CUDA, install the PyTorch build for your driver before installing requirements. First model loads download weights to the Hugging Face cache. An NVIDIA GPU is useful for MoulSot and training. The CPU path uses float32 for PyTorch models. Run large models individually if available RAM is close to 16 GB. Keep Uvicorn at one worker. Run mobile browser tests over HTTPS for microphone access.

Use either of these local TTS configurations:

- **Kandir** accepts Arabic-script Darija. Install `requirements-tts-kandir.txt`. OuteTTS 0.3.3 and llama.cpp may need a C++ toolchain on Windows. Linux or WSL is the preferred setup for this backend.
- **SpeechT5** runs with `requirements-models.txt` and a reviewed 512-element `.npy` speaker embedding. Set `AGRIX_TTS_BACKEND=speecht5` and `AGRIX_SPEECHT5_EMBEDDING` to its path. Use an embedding from an explicitly permitted speaker or a licensed asset. SpeechT5 expects Latin Darija. The prototype supplies written Latin versions for its fixed replies and shows text if synthesis fails.

```powershell
& $python -m pip install -r requirements-models.txt
$env:AGRIX_MODE = "local"
$env:AGRIX_ASR_MODEL = "atlasia/moulsot.v0.3"
$env:AGRIX_TTS_BACKEND = "speecht5"
$env:AGRIX_SPEECHT5_EMBEDDING = "data/voice/consented-speaker.npy"
& $python -m uvicorn agrix_voice.app:configured_app --factory --host 127.0.0.1 --port 8000
```

`.env.example` lists the main variables. Set and export them in the shell or load the file through your process manager. Set `AGRIX_CHAT_MODEL=rules` to skip the chat model on a small machine. Switch ASR to a Whisper checkpoint by setting `AGRIX_ASR_BACKEND=whisper` and `AGRIX_ASR_MODEL`. `AGRIX_ASR_ADAPTER` attaches a trained Whisper LoRA. Set `HF_HOME` to choose the cache directory. Speak for up to 25 seconds per turn, review or edit the transcript, and send. The player lets you replay or stop the spoken reply.

## Connect AgriX

`agrix_voice.farm.FarmTools` is the integration contract. Create an adapter backed by authenticated AgriX services. Inject it along with the desired ASR, TTS and chat components into `create_app`. Bind the session to the authenticated user's farm or selected plot in the host app. Return `retrieved`, `estimate`, or `missing` with a concise Darija summary from the service when available. Write calls require a matching confirmation token. The prototype keeps conversation state in memory for up to one hour and discards speech payloads after local processing. For a shared deployment, add app authentication, use a per-user session store, and make confirmed mutations idempotent in the service adapter.

## Collect, train, and evaluate

Open [the local annotation studio](http://localhost:8000/collect.html). Follow [the recording guide](evaluation/RECORDING_GUIDE.md) and save both files from each clip under `data/incoming`. Use the same pseudonymous code for all clips by a speaker. Keep test and validation speakers separate from training.

```powershell
& $python -m pip install -r requirements-training.txt
& $python -m agrix_voice.corpus data/incoming data/prepared --seed 19
& $python -m agrix_voice.train_asr data/prepared runs/whisper-small --model openai/whisper-small
& $python -m agrix_voice.benchmark asr data/prepared/test.jsonl runs/whisper-small-base.json --model openai/whisper-small
& $python -m agrix_voice.benchmark asr data/prepared/test.jsonl runs/whisper-small-lora.json --model openai/whisper-small --adapter runs/whisper-small/adapter
& $python -m agrix_voice.benchmark asr data/prepared/test.jsonl runs/moulsot.json --model atlasia/moulsot.v0.3 --backend qwen
& $python -m agrix_voice.benchmark asr data/prepared/test.jsonl runs/maghrebvoice.json --model Ayoub-Laachir/MaghrebVoice
& $python -m agrix_voice.benchmark asr data/prepared/test.jsonl runs/turbo.json --model openai/whisper-large-v3-turbo
```

Preparation validates PCM audio, rejects silent and clipped files, deduplicates clips, and groups splits by speaker. Review noisy clips with headphones before accepting them. The training script adds gain and noise augmentation on the train split. It stores checkpoints, optimizer state, and a final adapter. Resume with `--resume runs/whisper-small/checkpoint-N` on the same corpus and settings. Keep the test split untouched until comparing adapters on the same base checkpoint and revision.

```powershell
& $python -m agrix_voice.benchmark tts evaluation/tts.jsonl runs/kandir.json --backend kandir
& $python -m agrix_voice.benchmark tts evaluation/tts.jsonl runs/speecht5.json --backend speecht5
& $python -m agrix_voice.benchmark chat evaluation/chat.jsonl runs/qwen-chat.json --model Qwen/Qwen2.5-1.5B-Instruct
& $python -m agrix_voice.benchmark chat evaluation/chat.jsonl runs/atlas-chat.json --model MBZUAI-Paris/Atlas-Chat-2B
& $python -m unittest discover -s tests -v
```

To benchmark NeuTTS, install the [NeuTTS runtime](https://github.com/neuphonic/neutts), install eSpeak NG, and make the model author's Darija phonemizer importable. Set `AGRIX_NEUTTS_G2P_MODULE`, `AGRIX_NEUTTS_REFERENCE_WAV`, and `AGRIX_NEUTTS_REFERENCE_TEXT` to the module and a consented matching reference. Run the TTS benchmark with `--backend neutts`. Record listener ratings using the guide. The benchmark output contains local transcripts and should stay within the study team.

Model results and readiness are tracked in [VOICE_AI_REPORT.md](VOICE_AI_REPORT.md).
