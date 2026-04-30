from __future__ import annotations

from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    query: str = Field(..., description="User question to answer using workspace knowledge.")
    workspace_id: str
    project_id: str | None = None
    top_k: int | None = Field(default=None, ge=1, le=50)


class RetrievedContextItem(BaseModel):
    id: int
    content_type: str
    event_type: str
    source_id: str | None
    title: str | None
    content: str


class QueryResponse(BaseModel):
    answer: str
    used_context: list[RetrievedContextItem]

