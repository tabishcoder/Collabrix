from __future__ import annotations

from fastapi import Header, HTTPException

from app.core.config import settings


def require_internal_secret(x_internal_secret: str | None = Header(None, alias="X-Internal-Secret")) -> None:
    """When INTERNAL_API_SECRET is set, require matching header (Node → AI calls)."""
    expected = settings.internal_api_secret
    if not expected:
        return
    if not x_internal_secret or x_internal_secret != expected:
        raise HTTPException(status_code=403, detail="Invalid or missing internal secret")
