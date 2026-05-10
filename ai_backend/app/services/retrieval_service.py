from __future__ import annotations

import math
from heapq import nlargest

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.knowledge import KnowledgeItem
from app.services.embedding_service import EmbeddingService


class RetrievalService:
    def __init__(self) -> None:
        self._embeddings = EmbeddingService()

    @staticmethod
    def _cosine_similarity(a: list[float], b: list[float]) -> float:
        # Pure-Python cosine similarity to keep deps minimal.
        dot = 0.0
        na = 0.0
        nb = 0.0
        for x, y in zip(a, b):
            dot += x * y
            na += x * x
            nb += y * y
        denom = math.sqrt(na) * math.sqrt(nb)
        return dot / denom if denom else 0.0

    def retrieve(
        self,
        db: Session,
        *,
        query: str,
        workspace_id: str,
        project_id: str | None,
        top_k: int | None = None,
    ) -> list[KnowledgeItem]:
        k = top_k or settings.retrieval_top_k
        qvec = self._embeddings.embed_query(query)

        stmt = select(KnowledgeItem).where(KnowledgeItem.workspace_id == workspace_id)
        if project_id is not None:
            stmt = stmt.where(KnowledgeItem.project_id == project_id)

        # Bounded candidate set — ranking is O(n) in Python; keep n modest for latency.
        cap = min(settings.retrieval_candidate_limit, max(32, k * 12))
        candidates = list(
            db.execute(stmt.order_by(KnowledgeItem.created_at.desc()).limit(cap)).scalars().all()
        )
        if not candidates:
            return []

        scored = [
            (self._cosine_similarity(item.embedding or [], qvec), item)
            for item in candidates
            if isinstance(item.embedding, list) and item.embedding
        ]
        return [item for _, item in nlargest(k, scored, key=lambda t: t[0])]

