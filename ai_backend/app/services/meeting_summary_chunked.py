from __future__ import annotations

from app.ai.gemini_client import GeminiClient
from app.ai.prompts import MEETING_SUMMARY_SYSTEM

CHUNK_CHARS = 12000
OVERLAP = 400

CHUNK_SYSTEM = """You are compressing part of a meeting transcript for later merging.
Output 5-12 bullet points of facts and decisions only. No preamble. Same language as the chunk (English or Urdu as appropriate)."""


def _split_chunks(text: str) -> list[str]:
    t = text.strip()
    if len(t) <= CHUNK_CHARS:
        return [t]
    chunks: list[str] = []
    start = 0
    while start < len(t):
        end = min(len(t), start + CHUNK_CHARS)
        chunks.append(t[start:end])
        if end >= len(t):
            break
        start = end - OVERLAP
        if start < 0:
            start = 0
    return chunks


def summarize_long_transcript(text: str, language: str | None, client: GeminiClient) -> tuple[str, str]:
    """Map-reduce style: chunk summaries then final summary + action items."""
    chunks = _split_chunks(text)
    lang = language or "unspecified"

    if len(chunks) == 1:
        raw = _single_pass(client, chunks[0], lang)
        return _split_summary_response(raw)

    partials: list[str] = []
    for i, ch in enumerate(chunks):
        user = f"Language hint: {lang}\nPart {i + 1} of {len(chunks)}.\n\n{ch}"
        partial = client.generate(CHUNK_SYSTEM, user)
        partials.append(f"--- Part {i + 1} ---\n{partial.strip()}")

    merged = "\n\n".join(partials)
    merge_system = """You are merging partial summaries of one meeting into one coherent report.
Use exactly these two sections:

## Summary
Consolidated bullets (merge duplicates).

## Action items
Numbered list; if none, write "None".

Rules: do not invent; same language as the notes (English or Urdu)."""
    merge_user = f"Language hint: {lang}\n\nPartial summaries:\n{merged}"
    raw = client.generate(merge_system, merge_user)
    return _split_summary_response(raw)


def _single_pass(client: GeminiClient, text: str, lang: str) -> str:
    user = f"Transcript language hint: {lang}\n\n---\n{text.strip()}\n---"
    return client.generate(MEETING_SUMMARY_SYSTEM, user)


def _split_summary_response(raw: str) -> tuple[str, str]:
    if not raw.strip():
        return "", ""
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
    return summary_part or raw, action_part or "(See summary above for any implied follow-ups.)"
