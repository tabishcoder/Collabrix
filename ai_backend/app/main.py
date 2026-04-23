from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.api_router import api_router
from app.core.database import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="Collabrix AI Backend", lifespan=lifespan)
app.include_router(api_router)


@app.get("/", tags=["Root"])
def root():
    return {"status": "AI backend running", "service": "ai_backend"}
