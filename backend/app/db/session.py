from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import get_settings


import os
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

settings = get_settings()

# Use os.getenv to ensure we get the raw environment variable if needed, 
# or fallback to settings if preferred. The user requested os.getenv("DATABASE_URL").
# We will use the logic provided by the user.

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # 1. Fix Protocol (postgres -> postgresql)
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    # 2. Robustly add SSL Mode
    try:
        parsed = urlparse(DATABASE_URL)
        query_params = parse_qs(parsed.query)
        
        # Only add sslmode if not present
        if "sslmode" not in query_params:
            query_params["sslmode"] = ["require"]
            
        # Rebuild the URL safely
        new_query = urlencode(query_params, doseq=True)
        parsed = parsed._replace(query=new_query)
        DATABASE_URL = urlunparse(parsed)
    except Exception as e:
        print(f"Error parsing DATABASE_URL: {e}")
        # Fallback: append blindly if parsing fails
        if "?" in DATABASE_URL:
            DATABASE_URL += "&sslmode=require"
        else:
            DATABASE_URL += "?sslmode=require"

    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        future=True,
    )
else:
    # Local SQLite fallback
    engine = create_engine(
        "sqlite:///./peace_cake.db",
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
