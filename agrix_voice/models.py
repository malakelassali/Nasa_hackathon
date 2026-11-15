import hashlib
import importlib
import os
import re
import tempfile
import threading
from pathlib import Path

from .audio import SAMPLE_RATE, wav_bytes
from .hadra import HADRA_MODEL

MOULSOT = "atlasia/moulsot.v0.3"
KANDIR = "KandirResearch/DarijaTTS-v0.1-500M"
ATLAS_CHAT = "MBZUAI-Paris/Atlas-Chat-2B"
QWEN_CHAT = "Qwen/Qwen2.5-1.5B-Instruct"
FARM_GLOSSARY = (
    "القمح", "الشعير", "العدس", "الحمص", "السقي", "هكتار", "قنطار",
    "blé", "orge", "irrigation", "goutte-à-goutte", "pompe",
)
FARM_CONTEXT = (
    "Transcribe exactly what is spoken in Moroccan Darija and French. "
    "The recording may contain these agricultural terms: " + "، ".join(FARM_GLOSSARY)
    + ". Include a term only if the speaker says it."
)


def device(torch):
    requested = os.getenv("AGRIX_DEVICE", "auto")
    if requested == "auto":
        return "cuda" if torch.cuda.is_available() else "cpu"
    if requested == "cpu" or (requested == "cuda" and torch.cuda.is_available()):
        return requested
    raise ValueError("AGRIX_DEVICE must be auto, cpu or an available CUDA device")


class LazyModel:
    def __init__(self):
        self.lock = threading.Lock()
        self.model = None
        self.load_failed_at = None

    def run(self, load, inference):
        from time import monotonic

        with self.lock:
            if self.model is None:
                if self.load_failed_at is not None and monotonic() - self.load_failed_at < 60:
                    raise RuntimeError("Model load is cooling down")
                try:
                    self.model = load()
                except Exception:
                    self.load_failed_at = monotonic()
                    raise
            return inference(self.model)


class Recognizer(LazyModel):
    def __init__(self, model_id=None, backend=None, adapter=None, revision=None, *, use_env=True,
                 qwen_language="Arabic", qwen_context=""):
        super().__init__()
        self.model_id = model_id or (os.getenv("AGRIX_ASR_MODEL") if use_env else None) or MOULSOT
        default_backend = "qwen" if self.model_id.casefold() == MOULSOT else "whisper"
        self.backend = backend or (os.getenv("AGRIX_ASR_BACKEND") if use_env else None) or default_backend
        self.adapter = adapter or (os.getenv("AGRIX_ASR_ADAPTER") if use_env else None)
        self.revision = revision or (os.getenv("AGRIX_ASR_REVISION") if use_env else None)
        self.qwen_language = qwen_language
        self.qwen_context = qwen_context

    def load(self):
        import torch

        target = device(torch)
        dtype = torch.float32
        if target == "cuda" and os.getenv("AGRIX_ASR_DTYPE") != "float32":
            dtype = torch.float16
        if self.backend == "qwen" and not self.adapter:
            from qwen_asr import Qwen3ASRModel

            return Qwen3ASRModel.from_pretrained(
                self.model_id, revision=self.revision, dtype=dtype, device_map=target,
                max_inference_batch_size=1, max_new_tokens=256,
            )
        if self.backend != "whisper":
            raise ValueError("Expected Whisper or Qwen ASR")

        from transformers import WhisperForConditionalGeneration, WhisperProcessor

        processor = WhisperProcessor.from_pretrained(self.model_id, revision=self.revision)
        model = WhisperForConditionalGeneration.from_pretrained(
            self.model_id, revision=self.revision, dtype=dtype, use_safetensors=True,
        )
        if self.adapter:
            from peft import PeftModel

            model = PeftModel.from_pretrained(model, self.adapter)
        return processor, model.to(target).eval()

    def transcribe(self, audio):
        def inference(state):
            if self.backend == "qwen":
                return state.transcribe(
                    audio=(audio, SAMPLE_RATE), language=self.qwen_language, context=self.qwen_context,
                )[0].text

            import torch

            processor, model = state
            features = processor(
                audio, sampling_rate=SAMPLE_RATE, return_attention_mask=True, return_tensors="pt",
            )
            # PEFT wraps the Whisper model. Its base model already contains the active adapters.
            generator = model.get_base_model() if self.adapter else model
            with torch.inference_mode():
                tokens = generator.generate(
                    input_features=features.input_features.to(model.device, model.dtype),
                    attention_mask=features.attention_mask.to(model.device),
                    language="ar", task="transcribe", max_new_tokens=256,
                )
            return processor.batch_decode(tokens, skip_special_tokens=True)[0]

        return self.run(self.load, inference).strip()


class ChatModel(LazyModel):
    def __init__(self, model_id=None):
        super().__init__()
        self.model_id = model_id or os.getenv("AGRIX_CHAT_MODEL", QWEN_CHAT)

    def load(self):
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer

        target = device(torch)
        tokenizer = AutoTokenizer.from_pretrained(self.model_id)
        model = AutoModelForCausalLM.from_pretrained(
            self.model_id, use_safetensors=True,
            dtype=torch.float16 if target == "cuda" else torch.float32,
        ).to(target).eval()
        return tokenizer, model

    def complete(self, instruction, payload):
        import json

        def inference(state):
            import torch

            tokenizer, model = state
            prompt = [{"role": "user", "content": instruction + "\n\n" + json.dumps(payload, ensure_ascii=False)}]
            inputs = tokenizer.apply_chat_template(
                prompt, add_generation_prompt=True, tokenize=True, return_dict=True, return_tensors="pt",
            ).to(model.device)
            with torch.inference_mode():
                tokens = model.generate(**inputs, max_new_tokens=200, do_sample=False)
            return tokenizer.decode(tokens[0, inputs.input_ids.shape[1]:], skip_special_tokens=True)

        return self.run(self.load, inference)


def normalize_for_speech(text: str) -> str:
    text = text.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹", "01234567890123456789"))
    for unit, spoken in {"ha": "هكتار", "kg": "كيلو", "mm": "ميليمتر", "MAD": "درهم"}.items():
        text = re.sub(rf"(?<=\d)\s*{unit}\b", " " + spoken, text, flags=re.IGNORECASE)
    return " ".join(text.split())


# Written renditions for the fixed application replies. Dynamic AgriX summaries
# need a reviewed Latin rendition from the application adapter.
LATIN_REPLIES = {
    "راجع هاد المعلومات. واش بغيتي تسجّلها؟": "Raje3 had lma3lomat. Wach bghiti tsjjelha?",
    "آش بالضبط بغيتي تسجّل؟": "Ach beddebt bghiti tsjjel?",
    "آش زرعتي فهاد الأرض الموسم اللي فات؟": "Ach zr3ti f had lard lmoussem li fat?",
    "واخا، واش عندك السقي ولا كتعتمد غير على الشتا؟": "Wakha. Wach 3endek sseqi wla kat3tamed ghir 3la chta?",
    "سلام! نقدر نعاونك فاختيار الزرع للموسم الجاي. آش بغيتي تعرف على الأرض ديالك؟":
        "Salam! Nqder n3awnek f khtiyar zre3 lmoussem jay. Ach bghiti t3ref 3la lard dyalk?",
    "فهاد الديمو نقدر نعاونك فاختيار الزرع للموسم الجاي. واش بغيتي نقارنو شي اختيارات؟":
        "F had demo nqder n3awnek f khtiyar zre3 lmoussem jay. Wach bghiti nqarnou chi khtiyarat?",
    "فهاد المثال التجريبي، كاين العدس والحمص باش تقارن. خاصنا معطيات ديال الأرض قبل ما نعطيوك توصية.":
        "F had lmitel tejribi, kayn l3des w l7emmes bach t9aren. Khassna m3tiyat dyal lard qbel ma n3tiwk tawsiya.",
    "ما عنديش المعطيات الكافية على هاد الأرض دابا.": "Ma 3endich lm3tiyat lkafya 3la had lard daba.",
    "واخا، لغينا هاد الطلب.": "Wakha, lghina had ttalab.",
    "تسجّلات المعلومات.": "Tsjjlat lma3lomat.",
    "ما قدرناش نسجّلو المعلومات دابا.": "Ma qdernach nsjjlo lma3lomat daba.",
}


def hadra_reply_file(directory, text):
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return Path(directory) / f"{digest}.wav"


class Synthesizer(LazyModel):
    def __init__(self, backend=None, model_id=None):
        super().__init__()
        self.backend = backend or os.getenv("AGRIX_TTS_BACKEND", "kandir")
        self.model_id = model_id or os.getenv("AGRIX_TTS_MODEL") or {
            "kandir": KANDIR,
            "neutts": "Tilas/neutts-air-darija-v1",
            "speecht5": "HAMMALE/speecht5-darija",
            "hadra": HADRA_MODEL,
        }.get(self.backend)

    def load(self):
        if self.backend == "hadra":
            import torch

            from .hadra import HadraVoice

            return HadraVoice(self.model_id, device(torch))
        if self.backend == "kandir":
            import outetts
            from huggingface_hub import hf_hub_download

            gguf = hf_hub_download(self.model_id, "unsloth.Q8_0.gguf")
            if hasattr(outetts, "GGUFModelConfig_v2"):
                config = outetts.GGUFModelConfig_v2(model_path=gguf, tokenizer_path=self.model_id)
                return outetts.InterfaceGGUF(model_version="0.3", cfg=config), False
            config = outetts.ModelConfig(
                model_path=gguf, tokenizer_path=self.model_id,
                backend=outetts.Backend.LLAMACPP, interface_version=outetts.InterfaceVersion.V2,
            )
            return outetts.Interface(config=config), True
        if self.backend == "neutts":
            import soundfile as sf
            from neutts import NeuTTS

            importlib.import_module(os.environ["AGRIX_NEUTTS_G2P_MODULE"])
            ref_audio = os.environ["AGRIX_NEUTTS_REFERENCE_WAV"]
            ref_text = os.environ["AGRIX_NEUTTS_REFERENCE_TEXT"]
            sf.info(ref_audio)
            model = NeuTTS(backbone_repo=self.model_id, language="ar")
            return model, model.encode_reference(ref_audio), ref_text
        if self.backend == "speecht5":
            import numpy as np
            import torch
            from transformers import SpeechT5ForTextToSpeech, SpeechT5HifiGan, SpeechT5Processor

            target = device(torch)
            speaker = np.load(os.environ["AGRIX_SPEECHT5_EMBEDDING"], allow_pickle=False)
            if speaker.shape not in ((512,), (1, 512)) or not np.isfinite(speaker).all():
                raise ValueError("Invalid SpeechT5 speaker embedding")
            vocoder_id = os.getenv("AGRIX_SPEECHT5_VOCODER", "microsoft/speecht5_hifigan")
            return (
                SpeechT5Processor.from_pretrained(self.model_id),
                SpeechT5ForTextToSpeech.from_pretrained(self.model_id, use_safetensors=True).to(target).eval(),
                SpeechT5HifiGan.from_pretrained(vocoder_id).to(target).eval(),
                torch.tensor(speaker, dtype=torch.float32, device=target).reshape(1, 512),
            )
        raise ValueError("Unknown synthesis backend")

    def speak(self, text):
        if self.backend == "hadra" and text in LATIN_REPLIES:
            reply_dir = os.getenv("AGRIX_HADRA_REPLY_DIR")
            if reply_dir:
                try:
                    return hadra_reply_file(reply_dir, text).read_bytes()
                except FileNotFoundError:
                    pass
        if self.backend == "speecht5":
            text = LATIN_REPLIES.get(text, text)
            if not text.strip() or re.search(r"[\u0600-\u06ff]", text):
                raise ValueError("SpeechT5 needs a Latin-script Darija rendition")
        else:
            text = normalize_for_speech(text)

        def inference(state):
            import soundfile as sf

            if self.backend == "kandir":
                import outetts

                model, modern = state
                with tempfile.TemporaryDirectory() as directory:
                    output = Path(directory) / "speech.wav"
                    if modern:
                        config = outetts.GenerationConfig(
                            text=text, sampler_config=outetts.SamplerConfig(
                                temperature=0.3, repetition_penalty=1.1,
                            ),
                        )
                    else:
                        from outetts.models.config import GenerationConfig

                        config = GenerationConfig(
                            text=text, temperature=0.3, repetition_penalty=1.1, max_length=4096,
                        )
                    model.generate(config=config).save(str(output))
                    waveform, rate = sf.read(output, dtype="float32")
            elif self.backend == "neutts":
                model, ref_codes, ref_text = state
                waveform = model.infer(text, ref_codes=ref_codes, ref_text=ref_text)
                rate = 24_000
            elif self.backend == "hadra":
                waveform, rate = state.synthesize(text)
            else:
                import torch

                processor, model, vocoder, speaker = state
                ids = processor(text=text, return_tensors="pt").input_ids.to(model.device)
                with torch.inference_mode():
                    waveform = model.generate_speech(ids, speaker, vocoder=vocoder).cpu().numpy()
                rate = 16_000
            return wav_bytes(waveform, rate)

        return self.run(self.load, inference)
