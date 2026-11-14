import io
import wave
import unittest
from types import SimpleNamespace
from unittest.mock import Mock

import numpy as np
from fastapi.testclient import TestClient

from agrix_voice.app import create_app
from agrix_voice.audio import wav_bytes
from agrix_voice.benchmark import FARM_CONTEXT, glossary_extra_terms, metrics
from agrix_voice.farm import FarmResult
from agrix_voice.models import Recognizer, normalize_for_speech


class Transcriber:
    def transcribe(self, audio):
        assert len(audio) == 8000
        return "العام اللي فات زرعت القمح"


class Speaker:
    def speak(self, text):
        assert text
        return wav_bytes(np.full(8000, 0.1), 16000)


class FarmAdapter:
    def __init__(self):
        self.calls = []

    def call(self, session_id, operation, context, observation=None):
        self.calls.append((session_id, operation, context, observation))
        return FarmResult(source="retrieved", data={"saved": True})


class SavePlanner:
    def complete(self, instruction, payload):
        return '{"intent":"save_preferences","facts":{"irrigation":"rainfed"}}'


class VoiceTests(unittest.TestCase):
    def test_recording_to_spoken_reply_with_transcript_review(self):
        with TestClient(create_app(asr=Transcriber(), synth=Speaker())) as client:
            self.assertEqual(client.get("/").status_code, 200)
            self.assertEqual(client.get("/collect.html").status_code, 200)
            clip = wav_bytes(np.full(24000, 0.1), 48000)
            decoded = client.post("/api/transcribe", content=clip, headers={"Content-Type": "audio/wav"})
            self.assertEqual(decoded.status_code, 200)
            turn = client.post("/api/chat", json={"text": decoded.json()["text"] + " وبغيت نبدل"}).json()
            self.assertIn("السقي", turn["reply"])
            turn = client.post("/api/chat", json={"session_id": turn["session_id"],
                                                 "text": "غير الشتا، والما قليل هاد العام."}).json()
            self.assertEqual(turn["farm"]["previous_crop"], "القمح")
            self.assertEqual(turn["result"]["source"], "development_mock")
            speech = client.post("/api/speech", json={"text": turn["reply"]})
            self.assertEqual(speech.status_code, 200)
            self.assertEqual(speech.headers["content-type"], "audio/wav")
            with wave.open(io.BytesIO(speech.content)) as audio:
                self.assertEqual(audio.getframerate(), 16000)

    def test_mixed_language_and_correction(self):
        with TestClient(create_app()) as client:
            turn = client.post("/api/chat", json={"text": "عندي 2,5 hectares زرعت le blé و j'ai l'irrigation"}).json()
            self.assertEqual(turn["farm"]["area_ha"], 2.5)
            self.assertEqual(turn["farm"]["irrigation"], "available")
            result = client.post("/api/chat", json={"session_id": turn["session_id"],
                                                   "text": "غير واحد هكتار، en fait بلا سقي."}).json()
            self.assertEqual(result["farm"]["area_ha"], 1)
            self.assertEqual(result["farm"]["irrigation"], "rainfed")
            self.assertEqual(result["farm"]["previous_crop"], "القمح")

    def test_updates_require_matching_confirmation_and_are_consumed(self):
        adapter = FarmAdapter()
        with TestClient(create_app(tools=adapter, chat=SavePlanner())) as client:
            proposal = client.post("/api/chat", json={"text": "سجّل بلي ما عنديش السقي"}).json()
            data = {"session_id": proposal["session_id"], "confirmation_id": "f" * 32, "approved": True}
            self.assertEqual(client.post("/api/confirm", json=data).status_code, 409)
            self.assertEqual(adapter.calls, [])
            data["confirmation_id"] = proposal["confirmation"]["id"]
            self.assertEqual(client.post("/api/confirm", json=data).status_code, 200)
            self.assertEqual(client.post("/api/confirm", json=data).status_code, 409)
            self.assertEqual([call[1] for call in adapter.calls], ["update_farmer_preferences"])

    def test_invalid_audio_and_expired_session(self):
        with TestClient(create_app(asr=Transcriber())) as client:
            self.assertEqual(client.post("/api/transcribe", content=b"bad").status_code, 415)
            invalid = client.post("/api/transcribe", content=b"bad", headers={"Content-Type": "audio/wav"})
            self.assertEqual(invalid.status_code, 422)
            self.assertEqual(client.post("/api/chat", json={"text": "   "}).status_code, 422)
            self.assertEqual(client.post("/api/chat", json={"text": "hi", "session_id": "f" * 32}).status_code, 409)
            self.assertEqual(client.post("/api/speech", json={"text": "سلام"}).status_code, 503)

    def test_evaluation_normalizes_digits_and_preserves_raw_result(self):
        result = metrics([{"text": "٢ هكتار؟", "hypothesis": "2 هكتار",
                           "terms": ["٢ هكتار"], "seconds_inference": 0.4}])
        self.assertGreater(result["raw_wer"], 0)
        self.assertEqual(result["normalized_wer"], 0)
        self.assertEqual(result["term_recall"], 1)
        self.assertEqual(normalize_for_speech("٢,٥ha و 300 MAD"), "2,5 هكتار و 300 درهم")

    def test_qwen_language_and_glossary_are_forwarded(self):
        audio = np.full(8000, 0.1, dtype=np.float32)
        for language in ("Arabic", None):
            for context in ("", FARM_CONTEXT):
                with self.subTest(language=language, glossary=bool(context)):
                    asr = Recognizer(backend="qwen", qwen_language=language, qwen_context=context)
                    asr.model = Mock()
                    asr.model.transcribe.return_value = [SimpleNamespace(text=" القمح ")]
                    self.assertEqual(asr.transcribe(audio), "القمح")
                    asr.model.transcribe.assert_called_once_with(
                        audio=(audio, 16000), language=language, context=context,
                    )
        self.assertEqual(glossary_extra_terms([
            {"text": "القمح", "hypothesis": "القمح الشعير الشعير"},
            {"text": "goutte-à-goutte", "hypothesis": "goutte à goutte"},
        ]), 1)


if __name__ == "__main__":
    unittest.main()
