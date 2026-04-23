# Collabrix AI Backend (`ai_backend`)

FastAPI microservice that powers the **workspace intelligence agent** using **RAG** over workspace data (tasks, boards, documents, meeting summaries).

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
```

### 2) Create the database

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
- If you use a different username/password/db name, update `DATABASE_URL` accordingly.
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

## Troubleshooting

- **`password authentication failed for user "postgres"`**
  - Update Postgres password or update `DATABASE_URL` in `ai_backend/.env`.
- **Gemini model errors (404 / not supported)**
  - Set `GEMINI_MODEL` to a model your key supports (example: `models/gemini-2.5-flash`).

