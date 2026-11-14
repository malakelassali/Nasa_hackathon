import asyncio
import logging
import os
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, StringConstraints

from .audio import MAX_BYTES, InvalidAudio, read_recording
from .conversation import Assistant, SessionMissing
from .farm import DevelopmentFarmTools
from .models import FARM_CONTEXT, ChatModel, Recognizer, Synthesizer

LOG = logging.getLogger(__name__)
WEB = Path(__file__).resolve().parent / "web"
Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=800)]
Identifier = Annotated[str, StringConstraints(pattern=r"^[0-9a-f]{32}$")]


class Turn(BaseModel):
    text: Text
    session_id: Identifier | None = None


class Confirmation(BaseModel):
    session_id: Identifier
    confirmation_id: Identifier
    approved: bool


class Speech(BaseModel):
    text: Text


def create_app(*, tools=None, asr=None, synth=None, chat=None):
    app = FastAPI(title="AgriX Voice")
    demo = tools is None
    assistant = Assistant(tools if tools is not None else DevelopmentFarmTools(), chat)
    timeout = float(os.getenv("AGRIX_INFERENCE_TIMEOUT", "120"))
    speech_timeout = float(os.getenv("AGRIX_SPEECH_TIMEOUT", str(timeout)))
    # Keep timed-out work counted until the worker really finishes.
    slots = asyncio.Semaphore(2)
    tasks = set()

    async def run(operation, *args, deadline=timeout):
        if slots.locked():
            raise HTTPException(503, "Voice service is busy")
        await slots.acquire()
        task = asyncio.create_task(asyncio.to_thread(operation, *args))
        tasks.add(task)

        def finished(job):
            tasks.discard(job)
            slots.release()
            if not job.cancelled():
                job.exception()

        task.add_done_callback(finished)
        try:
            return await asyncio.wait_for(asyncio.shield(task), deadline)
        except TimeoutError as exc:
            raise HTTPException(504, "The request took too long") from exc
        except InvalidAudio as exc:
            raise HTTPException(422, str(exc)) from exc
        except SessionMissing as exc:
            raise HTTPException(409, str(exc)) from exc
        except Exception as exc:
            LOG.warning("Voice operation failed (%s)", type(exc).__name__)
            raise HTTPException(503, "Voice service unavailable") from exc

    @app.middleware("http")
    async def bound_requests(request, call_next):
        if request.method == "POST" and request.url.path.startswith("/api/"):
            limit = MAX_BYTES if request.url.path == "/api/transcribe" else 8192
            declared = request.headers.get("content-length")
            if declared is None and request.url.path != "/api/transcribe":
                return JSONResponse({"detail": "Content-Length is required"}, status_code=411)
            if declared is not None:
                if not declared.isascii() or not declared.isdecimal() or len(declared) > 8 or int(declared) > limit:
                    return JSONResponse({"detail": "Request exceeds the size limit"}, status_code=413)
        response = await call_next(request)
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/api/status")
    async def status():
        return {"development_data": demo, "speech": asr is not None, "audio_reply": synth is not None,
                "synthesis_backend": getattr(synth, "backend", None),
                "speech_timeout_ms": int(speech_timeout * 1000) + 10000}

    @app.post("/api/transcribe")
    async def transcribe(request: Request):
        if asr is None:
            raise HTTPException(503, "Speech recognition is disabled")
        if request.headers.get("content-type", "").split(";")[0] != "audio/wav":
            raise HTTPException(415, "Expected audio/wav")
        payload = bytearray()
        async for chunk in request.stream():
            if len(payload) + len(chunk) > MAX_BYTES:
                raise HTTPException(413, "Audio exceeds the size limit")
            payload.extend(chunk)

        def recognize():
            audio, _ = read_recording(payload)
            return asr.transcribe(audio)

        text = await run(recognize)
        if not text:
            raise HTTPException(422, "No speech was recognized")
        return {"text": text}

    @app.post("/api/chat")
    async def turn(body: Turn):
        return await run(assistant.turn, body.session_id, body.text)

    @app.post("/api/confirm")
    async def confirm(body: Confirmation):
        return await run(assistant.confirm, body.session_id, body.confirmation_id, body.approved)

    @app.post("/api/speech")
    async def speech(body: Speech):
        if synth is None:
            raise HTTPException(503, "Speech synthesis is disabled")
        return Response(await run(synth.speak, body.text, deadline=speech_timeout), media_type="audio/wav")

    app.mount("/", StaticFiles(directory=WEB, html=True), name="web")
    return app


def configured_app():
    mode = os.getenv("AGRIX_MODE", "local")
    if mode == "demo":
        return create_app()
    if mode != "local":
        raise ValueError("AGRIX_MODE must be local or demo")
    context = FARM_CONTEXT if os.getenv("AGRIX_ASR_FARM_GLOSSARY") == "1" else ""
    asr = Recognizer(qwen_context=context)
    synth = Synthesizer()
    if os.getenv("AGRIX_PRELOAD_VOICE") == "1":
        LOG.warning("Loading speech recognition and synthesis models before serving")
        asr.model = asr.load()
        synth.model = synth.load()
    return create_app(
        asr=asr, synth=synth,
        chat=ChatModel() if os.getenv("AGRIX_CHAT_MODEL", "local") != "rules" else None,
    )
