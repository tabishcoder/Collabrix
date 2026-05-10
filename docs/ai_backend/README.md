# Collabrix AI Backend (`ai_backend`)

FastAPI microservice that powers the **workspace intelligence agent** using **RAG** over workspace data (tasks, boards, documents, meeting summaries).

The canonical copy for developers working in the service folder is [`ai_backend/README.md`](../../ai_backend/README.md); keep both in sync when you change setup or API docs.

## Tech

- **API**: FastAPI + Uvicorn
- **DB**: PostgreSQL
- **Embeddings / LLM**: Google Gemini (`google-generativeai`)

## Prerequisites

- Python 3.11+
- PostgreSQL 16+

## Setup

### 1) Configure environment

Create `ai_backend/.env` (copy from `.env.example`) and fill in values:

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/collabrix_ai
GOOGLE_API_KEY=YOUR_KEY
GEMINI_MODEL=models/gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=models/gemini-embedding-001
RETRIEVAL_TOP_K=6
MAX_CONTEXT_CHARS=14000
# Optional: lock down /events/, /ai/, /summarize/meeting to your Node server (same value as backend AI_SERVICE_SECRET)
INTERNAL_API_SECRET=
```

### 2) Create the database

**Option A — Docker (recommended on Windows if port 5432 says “connection refused”)**

From the `ai_backend` folder:

```bash
docker compose up -d
```

This starts PostgreSQL with `postgres` / `postgres` and database `collabrix_ai`, matching the default `DATABASE_URL`.

**Option B — Local PostgreSQL**

From a terminal:

```bash
psql -U postgres
```

Then run:

```sql
ALTER USER postgres WITH PASSWORD 'postgres';
CREATE DATABASE collabrix_ai;
\q
```

Notes:

- If you use a different username/password/db name, update `DATABASE_URL` in `ai_backend/.env` accordingly.
- The service creates tables automatically on startup.

### 3) Install dependencies

From `ai_backend/`:

```bash
pip install -r requirements.txt
```

### 4) Run the server

From `ai_backend/`:

```bash
python -m uvicorn app.main:app --reload --port 8001
```

## API

Base URL: `http://127.0.0.1:8001`

### Health

- `GET /health/`

### Ingest event

- `POST /events/`

Example body:

```json
{
  "event_type": "TASK_CREATED",
  "workspace_id": "ws_1",
  "project_id": "proj_1",
  "content_type": "task",
  "source_id": "task_123",
  "title": "Implement login",
  "content": "Task: Implement login. Status: todo. Blocker: waiting on UI."
}
```

### Query (RAG)

- `POST /ai/`

Example body:

```json
{
  "query": "What blockers exist for backend tasks?",
  "workspace_id": "ws_1",
  "project_id": "proj_1",
  "top_k": 6
}
```

When `INTERNAL_API_SECRET` is set, send header `X-Internal-Secret: <same value>` (the Express app does this when `AI_SERVICE_SECRET` is set).

### Summarize meeting transcript (no RAG)

- `POST /summarize/meeting`

Example body:

```json
{
  "text": "Full transcript or notes…",
  "language": "en"
}
```

## Quick test (PowerShell)

```powershell
# Health
irm http://127.0.0.1:8001/health/ | ConvertTo-Json

# Ingest
$ingest = @{
  event_type="TASK_CREATED"
  workspace_id="ws_1"
  project_id="proj_1"
  content_type="task"
  source_id=("task_"+(Get-Random))
  title="Implement login"
  content="Task: Implement login. Status: todo. Blocker: waiting on UI."
} | ConvertTo-Json

irm http://127.0.0.1:8001/events/ -Method Post -ContentType "application/json" -Body $ingest | ConvertTo-Json

# Query
$query = @{
  query="What blockers exist for backend tasks?"
  workspace_id="ws_1"
  project_id="proj_1"
  top_k=6
} | ConvertTo-Json

irm http://127.0.0.1:8001/ai/ -Method Post -ContentType "application/json" -Body $query | ConvertTo-Json -Depth 20
```

## Deploying with the Node (MERN) API

- Run this service on a private URL (e.g. `http://ai-internal:8001`). **Do not** expose `GOOGLE_API_KEY` to the browser.
- On the Node backend, set `AI_SERVICE_URL` to that base URL and optionally `AI_SERVICE_SECRET` / `INTERNAL_API_SECRET` to the same random string so only your API can call ingest/query/summarize.
- PostgreSQL for `ai_backend` is separate from MongoDB for the main app.

## Troubleshooting

- **`connection refused` on `localhost:5432`**
  - PostgreSQL is not running. Use **Option A** (`docker compose up -d` in `ai_backend`) or start the Postgres Windows service / your cloud instance, then retry.
- **`password authentication failed for user "postgres"`**
  - Update Postgres password or update `DATABASE_URL` in `ai_backend/.env`.
- **Gemini model errors (404 / not supported)**
  - Set `GEMINI_MODEL` to a model your key supports (example: `models/gemini-2.5-flash`).
- **403 from `/events/` or `/ai/`**
  - If `INTERNAL_API_SECRET` is set in `.env`, ensure Node `AI_SERVICE_SECRET` matches and requests include `X-Internal-Secret`.
