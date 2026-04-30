from __future__ import annotations

from datetime import datetime

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import DateTime, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class KnowledgeItem(Base):
    __tablename__ = "knowledge_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    workspace_id: Mapped[str] = mapped_column(String(128), index=True)
    project_id: Mapped[str | None] = mapped_column(String(128), index=True, nullable=True)

    event_type: Mapped[str] = mapped_column(String(64), index=True)
    content_type: Mapped[str] = mapped_column(String(64), index=True)

    source_id: Mapped[str | None] = mapped_column(String(256), index=True, nullable=True)
    title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    content: Mapped[str] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    # Gemini embedding model currently used returns 3072-d vectors
    # Store as JSONB to avoid requiring pgvector extension in local dev.
    embedding: Mapped[list[float]] = mapped_column(JSONB)


Index(
    "ix_knowledge_items_workspace_project_created",
    KnowledgeItem.workspace_id,
    KnowledgeItem.project_id,
    KnowledgeItem.created_at,
)

