from collections.abc import Generator

from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.session_manager import SessionManager

_session_manager = SessionManager()


def get_db_session() -> Generator[Session, None, None]:
    yield from get_db()


def get_session_manager() -> SessionManager:
    return _session_manager
