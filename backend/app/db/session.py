from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import get_settings


settings = get_settings()


engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
    future=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables() -> None:
    """Create database tables based on SQLAlchemy metadata."""
    # Import models to ensure metadata is populated before create_all is invoked
    from app import models  # noqa: F401  pylint: disable=unused-import

    Base.metadata.create_all(bind=engine)
