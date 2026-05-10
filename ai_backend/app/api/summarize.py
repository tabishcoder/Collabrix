from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from app.ai.gemini_client import GeminiClient
from app.ai.prompts import MEETING_SUMMARY_SYSTEM
from app.api.deps import require_internal_secret
from app.schemas.summarize import MeetingSummarizeRequest, MeetingSummarizeResponse
from app.services.meeting_summary_chunked import summarize_long_transcript

router = APIRouter(dependencies=[Depends(require_internal_secret)])


@router.post("/meeting", response_model=MeetingSummarizeResponse)
async def summarize_meeting(payload: MeetingSummarizeRequest) -> MeetingSummarizeResponse:
    try:
        client = GeminiClient()
        lang = payload.language or "unspecified"
        text = payload.text.strip()
        if not text:
            raise HTTPException(status_code=400, detail="text is required")

        if len(text) > 14000:
            summary_part, action_part = summarize_long_transcript(text, lang, client)
        else:
            user_prompt = f"Transcript language hint: {lang}\n\n---\n{text}\n---"
            raw = client.generate(MEETING_SUMMARY_SYSTEM, user_prompt)
            if not raw:
                raise HTTPException(status_code=502, detail="Empty summary from model")
            summary_part = raw
            action_part = ""
            if "## Action items" in raw:
                parts = raw.split("## Action items", 1)
                summary_part = parts[0].replace("## Summary", "").strip()
                action_part = parts[1].strip() if len(parts) > 1 else ""
            elif "## Action Items" in raw:
                parts = raw.split("## Action Items", 1)
                summary_part = parts[0].replace("## Summary", "").strip()
                action_part = parts[1].strip() if len(parts) > 1 else ""
            else:
                action_part = "(See summary above for any implied follow-ups.)"
        ap = (action_part or "").strip() or "(See summary above for any implied follow-ups.)"
        return MeetingSummarizeResponse(summary=summary_part or text, action_items=ap)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
