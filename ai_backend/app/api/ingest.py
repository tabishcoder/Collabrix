from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_internal_secret
from app.core.database import get_db
from app.schemas.ingest import IngestEvent, IngestResponse
from app.services.ingestion_service import IngestionService

router = APIRouter(dependencies=[Depends(require_internal_secret)])


@router.post("/")
async def ingest_event(payload: IngestEvent, db: Session = Depends(get_db)) -> IngestResponse:
    try:
        knowledge_item_id = IngestionService().ingest(db, payload)
        return IngestResponse(stored=True, knowledge_item_id=knowledge_item_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
