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
    max_context_chars: int = int(os.getenv("MAX_CONTEXT_CHARS", "14000"))


settings = Settings()

