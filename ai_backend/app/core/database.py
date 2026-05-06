from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 5},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def init_db() -> None:
    # Import models so they are registered on Base.metadata
    from app.models.knowledge import KnowledgeItem  # noqa: F401

    # Ensure pgvector is available (may require DB permissions)
    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    except Exception:
        # If the DB user can't create extensions, tables can still be created
        # but vector operations will fail until pgvector is enabled by an admin.
        pass

    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        # Allow service to boot even if DB is temporarily unavailable.
        # Ingestion/query will error until DB is reachable.
        pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

