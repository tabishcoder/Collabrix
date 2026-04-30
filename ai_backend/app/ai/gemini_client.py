from __future__ import annotations

from typing import Any

import google.generativeai as genai

from app.core.config import settings


class GeminiClient:
    def __init__(self) -> None:
        if not settings.google_api_key:
            raise RuntimeError("GOOGLE_API_KEY is not set")
        genai.configure(api_key=settings.google_api_key)

    def embed_text(self, text: str) -> list[float]:
        res: Any = genai.embed_content(
            model=settings.gemini_embedding_model,
            content=text,
            task_type="retrieval_document",
        )
        emb = res.get("embedding")
        # Some versions return {"embedding": [...]}, others {"embedding": {"values": [...]} }
        values = emb.get("values") if isinstance(emb, dict) else emb
        if not isinstance(values, list):
            raise RuntimeError("Unexpected embedding response from Gemini")
        return [float(x) for x in values]

    def embed_query(self, text: str) -> list[float]:
        res: Any = genai.embed_content(
            model=settings.gemini_embedding_model,
            content=text,
            task_type="retrieval_query",
        )
        emb = res.get("embedding")
        values = emb.get("values") if isinstance(emb, dict) else emb
        if not isinstance(values, list):
            raise RuntimeError("Unexpected embedding response from Gemini")
        return [float(x) for x in values]

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            system_instruction=system_prompt,
        )
        resp = model.generate_content(user_prompt)
        return (getattr(resp, "text", None) or "").strip()

