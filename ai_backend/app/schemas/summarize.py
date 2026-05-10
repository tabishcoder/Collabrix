from __future__ import annotations

from pydantic import BaseModel, Field


class MeetingSummarizeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Meeting transcript or notes to summarize.")
    language: str | None = Field(
        default=None,
        description="Optional hint: en, ur, or mixed",
    )


class MeetingSummarizeResponse(BaseModel):
    summary: str
    action_items: str = Field(
        ...,
        description="Plain text or bullet list of action items extracted from the meeting.",
    )
