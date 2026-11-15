# Run AgriX as a private voice server

The RTX workstation runs AgriX, MoulSot and HADRA. Your phone and other computer open the same web app in a browser. Each browser records audio and sends it to the workstation, then plays the response it gets back. Keep the workstation awake with the server terminal open. The app uses the RTX for both models with FP32 computation, forced Arabic and the farming glossary for MoulSot, and the same F1 voice and 16 synthesis steps for HADRA. GPU and CPU results can differ slightly.

## 1. Start the server in Ubuntu on the RTX workstation

Use the existing GPU checkout and setup. If you already have an AgriX server on port 8000 on that workstation, close its terminal command with Ctrl+C first.

```bash
cd ~/Nasa_hackathon
git pull --ff-only origin darija-text-to-speech
bash scripts/gpu-asr.sh setup-voice
bash scripts/gpu-asr.sh voice-server
```

The first start may download HADRA and prepare the fixed replies. Later starts reuse the WAVs in `data/voice/hadra-server-f1`. The server loads both models before accepting requests. Wait for Uvicorn to report that it is running. Fixed replies play from those WAVs. New replies are generated on the GPU with the same synthesis settings. Use a fresh `AGRIX_HADRA_REPLY_DIR` when changing voice or checkpoint.

### Fix a Python version error during setup

From the checkout, pull the branch and run `bash scripts/gpu-asr.sh setup`. It checks for Python 3.12 and 3.11 even when another environment provides the active `python3`. If neither is installed, install Python 3.12 with uv and pass its executable directly. [uv installation](https://docs.astral.sh/uv/getting-started/installation/) · [Manage Python versions with uv](https://docs.astral.sh/uv/concepts/python-versions/)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"
uv python install 3.12
AGRIX_PYTHON="$(uv python find --managed-python 3.12)" bash scripts/gpu-asr.sh setup
```

The launcher creates and uses `.venv-gpu`. After setup prints `OK`, run `bash scripts/gpu-asr.sh setup-voice` to install and verify HADRA in that same environment. It uses the CUDA wheel index from setup, which defaults to CUDA 12.8. If the server reports that `f5_tts` is missing, rerun `setup-voice`.

### RTX 5060 with 8 GB

Keep the CUDA 12.8 install commands above. Replace the server launch line with:

```bash
AGRIX_ASR_DTYPE=float16 bash scripts/gpu-asr.sh voice-server
```

This selects the FP16 MoulSot mode used in the earlier GPU benchmark, where MoulSot alone peaked at about 4 GiB of allocated VRAM. HADRA still runs in FP32 with the same F1 voice and 16 synthesis steps. Test the combined server on the card, since the display and other running programs also use GPU memory. [RTX 5060 specifications](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5060-family/) · [PyTorch CUDA 12.8 wheels](https://pytorch.org/get-started/previous-versions/#v280)

## 2. Give your phone and computer a private HTTPS address

Install Tailscale on the RTX workstation and the devices that will use the app. On native Linux, open a second terminal on the RTX workstation while AgriX is running. [Install Tailscale on Linux](https://tailscale.com/docs/install/linux)

```bash
curl -fsS http://127.0.0.1:8000/api/status
sudo tailscale serve --bg http://127.0.0.1:8000
```

For Windows with WSL, install Tailscale on the Windows side and run the equivalent commands in Administrator PowerShell:

```powershell
Invoke-RestMethod http://localhost:8000/api/status
tailscale serve --bg http://127.0.0.1:8000
```

The status check should show `synthesis_backend: hadra`. If Windows cannot reach localhost, check that the Ubuntu terminal is still running the app and that WSL localhost forwarding works before starting Serve. If Tailscale asks you to enable HTTPS certificates, follow its sign-in prompt, then repeat the Serve command. Serve prints a private `https://…ts.net` URL. Share the machine with the intended Tailscale account and send them that address. [Tailscale Serve](https://tailscale.com/docs/reference/examples/serve) · [Machine sharing](https://tailscale.com/docs/features/sharing) · [WSL localhost forwarding](https://learn.microsoft.com/en-us/windows/wsl/networking#accessing-linux-networking-apps-from-windows-localhost)

Open the printed HTTPS URL in Safari or Chrome on your phone, or in your current computer's browser. Allow microphone access when prompted. You can add the page to your home screen. HTTPS lets the browser offer microphone access from a different device. [Browser microphone requirements](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#privacy_and_security)

## 3. Check latency and voice quality

Try «العام اللي فات زرعت القمح، ودابا بغيت نبدل شوية» and «غير الشتا» from the phone. The prototype replies in text first. Its fixed replies should have little additional synthesis delay. To time fresh HADRA synthesis separately on the RTX, run:

```bash
AGRIX_DEVICE=cuda HF_HOME="$PWD/.hf-cache" WANDB_MODE=disabled \
  .venv-gpu/bin/python -m agrix_voice.benchmark tts evaluation/tts.jsonl \
  runs/hadra-rtx.json --backend hadra
```

Do the timing run with the live server stopped so the measurement reflects one model process. Listen to the generated WAVs alongside the Windows samples. The report records model load and per-reply generation times.
