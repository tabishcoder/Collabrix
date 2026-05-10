from __future__ import annotations

import os
import tempfile
import threading
from typing import TYPE_CHECKING

from app.core.config import settings

if TYPE_CHECKING:
    from faster_whisper import WhisperModel

_model_lock = threading.Lock()
_model: WhisperModel | None = None


def get_whisper_model():
    global _model
    with _model_lock:
        if _model is None:
            try:
                from faster_whisper import WhisperModel as _WM
            except ImportError as e:
                raise RuntimeError(
                    "faster-whisper is not installed. Run: pip install faster-whisper"
                ) from e
            _model = _WM(
                settings.whisper_model_size,
                device=settings.whisper_device,
                compute_type=settings.whisper_compute_type,
            )
        return _model


def transcribe_file_bytes(data: bytes, suffix: str, language: str | None) -> str:
    """Write bytes to a temp file and run faster-whisper. Returns plain text."""
    suf = suffix if suffix.startswith(".") else f".{suffix}"
    fd, path = tempfile.mkstemp(suffix=suf or ".webm")
    os.close(fd)
    try:
        with open(path, "wb") as f:
            f.write(data)
        model = get_whisper_model()
        lang = None
        if language and language in ("en", "ur"):
            lang = language
        segments, _info = model.transcribe(
            path,
            language=lang,
            vad_filter=True,
        )
        parts: list[str] = []
        for seg in segments:
            t = (seg.text or "").strip()
            if t:
                parts.append(t)
        return "\n".join(parts).strip()
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass
