from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_internal_secret
from app.core.database import get_db
from app.schemas.query import QueryRequest, QueryResponse, RetrievedContextItem
from app.services.qa_service import QAService
from app.services.retrieval_service import RetrievalService

router = APIRouter(dependencies=[Depends(require_internal_secret)])


@router.post("/")
async def query_ai(payload: QueryRequest, db: Session = Depends(get_db)) -> QueryResponse:
    try:
        retrieved = RetrievalService().retrieve(
            db,
            query=payload.query,
            workspace_id=payload.workspace_id,
            project_id=payload.project_id,
            top_k=payload.top_k,
        )
        answer = QAService().answer(payload.query, retrieved)
        used_context = [
            RetrievedContextItem(
                id=int(it.id),
                content_type=it.content_type,
                event_type=it.event_type,
                source_id=it.source_id,
                title=it.title,
                content=it.content,
            )
            for it in retrieved
        ]
        return QueryResponse(answer=answer, used_context=used_context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
