from __future__ import annotations

import os

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.deps import require_internal_secret
from app.schemas.transcribe import TranscribeResponse
from app.services.whisper_transcribe import transcribe_file_bytes

router = APIRouter(dependencies=[Depends(require_internal_secret)])

MAX_UPLOAD_BYTES = int(os.getenv("TRANSCRIBE_MAX_BYTES", str(120 * 1024 * 1024)))


@router.post("/audio", response_model=TranscribeResponse)
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str | None = Form(None),
) -> TranscribeResponse:
    """
    Local speech-to-text via faster-whisper (no cloud STT bill).
    Accepts webm/wav/mp3/m4a etc. depending on ffmpeg in the environment.
    """
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large (max {MAX_UPLOAD_BYTES // (1024 * 1024)} MB)",
        )
    name = file.filename or "audio"
    suffix = ""
    if "." in name:
        suffix = "." + name.rsplit(".", 1)[-1].lower()[:8]
    try:
        text = transcribe_file_bytes(raw, suffix, language)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    if not text:
        raise HTTPException(status_code=422, detail="No speech detected in audio")
    return TranscribeResponse(text=text)
