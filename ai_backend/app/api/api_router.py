from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.ingest import router as ingest_router
from app.api.query import router as query_router
from app.api.summarize import router as summarize_router
from app.api.transcribe import router as transcribe_router

api_router = APIRouter()

api_router.include_router(health_router, prefix="/health", tags=["Health"])
api_router.include_router(ingest_router, prefix="/events", tags=["Ingestion"])
api_router.include_router(query_router, prefix="/ai", tags=["AI"])
api_router.include_router(summarize_router, prefix="/summarize", tags=["Summarize"])
api_router.include_router(transcribe_router, prefix="/transcribe", tags=["Transcribe"])
