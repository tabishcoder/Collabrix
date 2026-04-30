from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.knowledge import KnowledgeItem
from app.schemas.ingest import IngestEvent
from app.services.embedding_service import EmbeddingService


class IngestionService:
    def __init__(self) -> None:
        self._embeddings = EmbeddingService()

    def ingest(self, db: Session, event: IngestEvent) -> int:
        embedding = self._embeddings.embed_document(event.content)

        item = KnowledgeItem(
            workspace_id=event.workspace_id,
            project_id=event.project_id,
            event_type=event.event_type,
            content_type=event.content_type,
            source_id=event.source_id,
            title=event.title,
            content=event.content,
            embedding=embedding,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return int(item.id)

