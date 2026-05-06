from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class IngestEvent(BaseModel):
    event_type: str = Field(..., examples=["TASK_CREATED"])
    workspace_id: str
    project_id: str | None = None

    content_type: str = Field(..., examples=["task", "meeting", "document", "board"])
    source_id: str | None = Field(default=None, description="ID of the source entity in main backend.")
    title: str | None = None
    content: str = Field(..., description="Textual content to be embedded and stored.")

    timestamp: datetime | None = Field(default=None, description="When the event happened (optional).")
    metadata: dict[str, Any] | None = Field(default=None, description="Extra non-authoritative metadata.")


class IngestResponse(BaseModel):
    stored: bool
    knowledge_item_id: int

