import io
import math
import wave

import numpy as np
from scipy.signal import resample_poly

SAMPLE_RATE = 16_000
MAX_SECONDS = 25
MAX_BYTES = 5_000_000


class InvalidAudio(ValueError):
    pass


def read_recording(payload: bytes) -> tuple[np.ndarray, dict]:
    """Read bounded PCM WAV from the browser or the corpus."""
    if not payload or len(payload) > MAX_BYTES:
        raise InvalidAudio("Audio exceeds the upload limit or is empty")
    try:
        with wave.open(io.BytesIO(payload), "rb") as wav:
            channels, width, rate, frames, _, _ = wav.getparams()
            if channels not in (1, 2) or width != 2 or not 8_000 <= rate <= 48_000:
                raise InvalidAudio("Use 16-bit PCM WAV at 8–48 kHz")
            if not rate * 0.25 <= frames <= rate * MAX_SECONDS:
                raise InvalidAudio("Record between 0.25 and 25 seconds")
            pcm = wav.readframes(frames)
            if len(pcm) != frames * channels * width:
                raise InvalidAudio("Incomplete WAV audio")
    except (EOFError, OSError, wave.Error) as exc:
        raise InvalidAudio("Invalid PCM WAV") from exc
    samples = np.frombuffer(pcm, dtype="<i2").reshape(-1, channels)
    audio = samples.astype(np.float32).mean(axis=1) / 32768
    rms = float(np.sqrt(np.mean(audio ** 2)))
    if rms < 0.0005:
        raise InvalidAudio("The recording is too quiet")
    divisor = math.gcd(rate, SAMPLE_RATE)
    return resample_poly(audio, SAMPLE_RATE // divisor, rate // divisor), {
        "seconds": frames / rate,
        "rms_dbfs": 20 * math.log10(rms),
        "clipped_fraction": float(np.mean(np.abs(samples.astype(np.int32)) >= 32760)),
    }


def wav_bytes(audio: np.ndarray, rate: int) -> bytes:
    if audio.ndim != 1 or not audio.size or not np.isfinite(audio).all():
        raise InvalidAudio("Invalid waveform")
    output = io.BytesIO()
    with wave.open(output, "wb") as wav:
        wav.setparams((1, 2, rate, 0, "NONE", "not compressed"))
        wav.writeframes((np.clip(audio, -1, 1) * 32767).astype("<i2").tobytes())
    return output.getvalue()
