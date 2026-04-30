from __future__ import annotations

from app.ai.gemini_client import GeminiClient


class EmbeddingService:
    def __init__(self) -> None:
        self._client = GeminiClient()

    def embed_document(self, text: str) -> list[float]:
        return self._client.embed_text(text)

    def embed_query(self, text: str) -> list[float]:
        return self._client.embed_query(text)

