from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def ingest_event():
    return {"message": "Event ingestion endpoint"}
