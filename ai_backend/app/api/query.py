from fastapi import APIRouter

router = APIRouter()

@router.post("/")
async def query_ai():
    return {"message": "AI query endpoint"}
