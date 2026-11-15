# Run AgriX as a private voice server

The RTX workstation runs AgriX, MoulSot and HADRA. Your phone and other computer open the same web app in a browser. Each browser records audio and sends it to the workstation, then plays the response it gets back. Keep the workstation awake with the server terminal open. The app uses the RTX for both models with FP32 computation, forced Arabic and the farming glossary for MoulSot, and the same F1 voice and 16 synthesis steps for HADRA. GPU and CPU results can differ slightly.

## 1. Start the server in Ubuntu on the RTX workstation

Use the existing GPU checkout and setup. If you already have an AgriX server on port 8000 on that workstation, close its terminal command with Ctrl+C first.

```bash
cd ~/Nasa_hackathon
git pull --ff-only origin darija-text-to-speech
.venv-gpu/bin/python -m pip install 'torchaudio==2.8.0' --index-url "${AGRIX_TORCH_INDEX:-https://download.pytorch.org/whl/cu128}"
.venv-gpu/bin/python -m pip install -r requirements-tts-hadra.txt
bash scripts/gpu-asr.sh voice-server
```

The first start may download HADRA and prepare the fixed replies. Later starts reuse the WAVs in `data/voice/hadra-server-f1`. The server loads both models before accepting requests. Wait for Uvicorn to report that it is running. Fixed replies play from those WAVs. New replies are generated on the GPU with the same synthesis settings. Use a fresh `AGRIX_HADRA_REPLY_DIR` when changing voice or checkpoint.

### RTX 5060 with 8 GB

Keep the CUDA 12.8 install commands above. Replace the server launch line with:

```bash
AGRIX_ASR_DTYPE=float16 bash scripts/gpu-asr.sh voice-server
```

This selects the FP16 MoulSot mode used in the earlier GPU benchmark, where MoulSot alone peaked at about 4 GiB of allocated VRAM. HADRA still runs in FP32 with the same F1 voice and 16 synthesis steps. Test the combined server on the card, since the display and other running programs also use GPU memory. [RTX 5060 specifications](https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5060-family/) · [PyTorch CUDA 12.8 wheels](https://pytorch.org/get-started/previous-versions/#v280)

## 2. Give your phone and computer a private HTTPS address

Install Tailscale on the **Windows side of the RTX workstation**, and on each phone or computer that will use the app. Sign in to the same private Tailscale network on all devices. In an Administrator PowerShell window on the RTX workstation, run:

```powershell
Invoke-RestMethod http://localhost:8000/api/status
tailscale serve --bg http://127.0.0.1:8000
```

The status check should show `synthesis_backend: hadra`. If Windows cannot reach localhost, check that the Ubuntu terminal is still running the app and that WSL localhost forwarding works before starting Serve. If Tailscale asks you to enable HTTPS certificates, follow its sign-in prompt, then repeat the Serve command. Serve prints a private `https://…ts.net` URL. Use Serve for private access. [Tailscale installation](https://tailscale.com/download) · [Tailscale Serve](https://tailscale.com/docs/reference/examples/serve) · [WSL localhost forwarding](https://learn.microsoft.com/en-us/windows/wsl/networking#accessing-linux-networking-apps-from-windows-localhost)

Open the printed HTTPS URL in Safari or Chrome on your phone, or in your current computer's browser. Allow microphone access when prompted. You can add the page to your home screen. HTTPS lets the browser offer microphone access from a different device. [Browser microphone requirements](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#privacy_and_security)

## 3. Check latency and voice quality

Try «العام اللي فات زرعت القمح، ودابا بغيت نبدل شوية» and «غير الشتا» from the phone. The prototype replies in text first. Its fixed replies should have little additional synthesis delay. To time fresh HADRA synthesis separately on the RTX, run:

```bash
AGRIX_DEVICE=cuda HF_HOME="$PWD/.hf-cache" WANDB_MODE=disabled \
  .venv-gpu/bin/python -m agrix_voice.benchmark tts evaluation/tts.jsonl \
  runs/hadra-rtx.json --backend hadra
```

Do the timing run with the live server stopped so the measurement reflects one model process. Listen to the generated WAVs alongside the Windows samples. The report records model load and per-reply generation times.
