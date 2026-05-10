import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Database
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:postgres@localhost:5432/collabrix_ai",
    )

    # Embeddings / LLM (Gemini via google-generativeai)
    google_api_key: str | None = os.getenv("GOOGLE_API_KEY") or None
    # Use a generally-available model name (note the "models/" prefix).
    gemini_model: str = os.getenv("GEMINI_MODEL", "models/gemini-2.5-flash")
    gemini_embedding_model: str = os.getenv("GEMINI_EMBEDDING_MODEL", "models/gemini-embedding-001")

    # Retrieval defaults
    retrieval_top_k: int = int(os.getenv("RETRIEVAL_TOP_K", "6"))
    max_context_chars: int = int(os.getenv("MAX_CONTEXT_CHARS", "12000"))
    # Max DB rows scored in Python per query (lower = faster Q&A).
    retrieval_candidate_limit: int = int(os.getenv("RETRIEVAL_CANDIDATE_LIMIT", "72"))

    # Optional: require X-Internal-Secret on /events/ and /ai/ (same value as Node AI_SERVICE_SECRET)
    internal_api_secret: str | None = os.getenv("INTERNAL_API_SECRET") or None

    # Local STT (faster-whisper) — free on your own machine; first request downloads model weights
    whisper_model_size: str = os.getenv("WHISPER_MODEL", "base")
    whisper_device: str = os.getenv("WHISPER_DEVICE", "cpu")
    whisper_compute_type: str = os.getenv("WHISPER_COMPUTE_TYPE", "int8")


settings = Settings()

