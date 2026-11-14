"""Local HADRA synthesis using F5-TTS and a fixed Moroccan reference voice."""

import os
from functools import lru_cache
from pathlib import Path

HADRA_MODEL = "Jip7e/habibi-tts-doda-darija"
HADRA_REFERENCE_REPO = "Sakuragaoka/amber-hadra-webgpu"
HADRA_REFERENCE_TEXT = "هوما مخبيين شي حاجة انا متيقن"


class HadraVoice:
    def __init__(self, model_id, device):
        import soundfile as sf
        import torch
        from f5_tts.infer.utils_infer import load_model, load_vocoder
        from f5_tts.model import DiT
        from huggingface_hub import hf_hub_download

        reference_wav = os.getenv("AGRIX_HADRA_REFERENCE_WAV")
        reference_text = os.getenv("AGRIX_HADRA_REFERENCE_TEXT")
        if bool(reference_wav) != bool(reference_text and reference_text.strip()):
            raise ValueError("Configure both the HADRA reference WAV and its verbatim transcript")

        assets = Path(model_id)
        if assets.is_dir():
            weights = str(assets / "model_ema.safetensors")
            vocab = str(assets / "vocab.txt")
            reference_wav = reference_wav or str(assets / "F1.wav")
        else:
            weights = hf_hub_download(model_id, "model_ema.safetensors")
            vocab = hf_hub_download(model_id, "vocab.txt")
            reference_wav = reference_wav or hf_hub_download(HADRA_REFERENCE_REPO, "F1.wav")

        samples, rate = sf.read(reference_wav, dtype="float32", always_2d=True)
        if not 1 <= len(samples) / rate <= 12 or not samples.any():
            raise ValueError("HADRA needs a clean reference clip of 1–12 seconds")
        self.reference_audio = (torch.from_numpy(samples.T.copy()), rate)
        self.reference_text = (reference_text or HADRA_REFERENCE_TEXT).strip().rstrip(".") + "."
        self.device = device
        architecture = dict(dim=1024, depth=22, heads=16, ff_mult=2, text_dim=512, conv_layers=4)
        self.model = load_model(DiT, architecture, weights, vocab_file=vocab, device=device).eval()
        vocoder_dir = os.getenv("AGRIX_HADRA_VOCODER_DIR")
        self.vocoder = load_vocoder(
            "vocos", is_local=bool(vocoder_dir), local_path=vocoder_dir or "", device=device,
        )

    @lru_cache(maxsize=16)
    def synthesize(self, text):
        import numpy as np
        from f5_tts.infer.utils_infer import chunk_text, infer_batch_process

        audio, rate = self.reference_audio
        reference_seconds = audio.shape[-1] / rate
        max_bytes = max(32, int(len(self.reference_text.encode("utf-8")) / reference_seconds * 12))
        chunks = chunk_text(text, max_chars=max_bytes)
        if not chunks:
            raise ValueError("HADRA needs text to synthesize")
        waveforms = []
        for chunk in chunks:
            waveform, output_rate, _ = next(infer_batch_process(
                self.reference_audio, self.reference_text, [chunk], self.model, self.vocoder,
                progress=None, nfe_step=16, cfg_strength=2.0, sway_sampling_coef=-1.0,
                speed=0.95, device=self.device,
            ))
            if waveforms:
                waveforms.append(np.zeros(output_rate // 10, dtype=waveform.dtype))
            waveforms.append(waveform)
        return np.concatenate(waveforms), output_rate
