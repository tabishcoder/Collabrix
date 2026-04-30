from __future__ import annotations

from app.ai.gemini_client import GeminiClient
from app.ai.prompts import SYSTEM_PROMPT, build_user_prompt
from app.core.config import settings
from app.models.knowledge import KnowledgeItem


class QAService:
    def __init__(self) -> None:
        self._client = GeminiClient()

    @staticmethod
    def _format_context(items: list[KnowledgeItem]) -> str:
        out: list[str] = []
        remaining = settings.max_context_chars
        for it in items:
            chunk = (
                f"- type={it.content_type} event={it.event_type} "
                f"source_id={it.source_id or 'n/a'} title={it.title or 'n/a'}\n"
                f"{it.content}\n"
            )
            if len(chunk) > remaining:
                break
            out.append(chunk)
            remaining -= len(chunk)
        return "\n".join(out).strip()

    def answer(self, question: str, retrieved: list[KnowledgeItem]) -> str:
        context = self._format_context(retrieved)
        user_prompt = build_user_prompt(question=question, context=context or "(no context retrieved)")
        return self._client.generate(system_prompt=SYSTEM_PROMPT, user_prompt=user_prompt)

