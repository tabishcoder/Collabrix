from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={
        "connect_timeout": 10,
        "sslmode": "require",
    },
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


def init_db() -> None:
    # Import models so they are registered on Base.metadata
    from app.models.knowledge import KnowledgeItem  # noqa: F401

    # Enable pgvector extension
    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            print("pgvector extension enabled")
    except Exception as e:
        print(f"Could not enable pgvector: {e}")

    # Create tables
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Database connection failed: {e}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()