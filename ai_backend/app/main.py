from fastapi import FastAPI
from app.api.api_router import api_router

app = FastAPI(title="Collabrix AI Backend")

# app.include_router(api_router)

@app.get("/")
def root():
    return {"status": "AI backend running"}
