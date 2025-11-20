from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, get_session_manager
from app.models import Question, Quiz
from app.schemas.session import (
    QuestionResolution,
    SessionCreate,
    SessionRead,
)
from app.services.session_manager import SessionManager, SessionState

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])


def _session_to_schema(state: SessionState) -> SessionRead:
    return SessionRead(
        id=state.id,
        quiz_id=state.quiz_id,
        teams=[{"id": t.id, "name": t.name, "score": t.score} for t in state.teams],
        used_question_ids=list(state.used_question_ids),
        current_question_id=state.current_question_id,
        question_started_at=state.question_started_at,
        current_turn_index=state.current_turn_index,
        timer_seconds=state.timer_seconds,
    )


def _ensure_quiz_exists(db: Session, quiz_id: str) -> None:
    if db.get(Quiz, quiz_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")


def _require_question(db: Session, question_id: str) -> Question:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return question


def _resolve_session(state: SessionState) -> SessionRead:
    return _session_to_schema(state)


@router.post("/", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: SessionCreate,
    db: Session = Depends(get_db_session),
    manager: SessionManager = Depends(get_session_manager),
) -> SessionRead:
    _ensure_quiz_exists(db, payload.quiz_id)
    try:
        state = manager.create_session(
            payload.quiz_id, 
            [team.name for team in payload.teams],
            timer_seconds=payload.timer_seconds or 20
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _session_to_schema(state)


@router.get("/{session_id}", response_model=SessionRead)
def get_session(
    session_id: str,
    manager: SessionManager = Depends(get_session_manager),
) -> SessionRead:
    state = manager.get_session(session_id)
    if state is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return _session_to_schema(state)


@router.post(
    "/{session_id}/question/{question_id}/start",
    response_model=SessionRead,
)
def start_question(
    session_id: str,
    question_id: str,
    db: Session = Depends(get_db_session),
    manager: SessionManager = Depends(get_session_manager),
) -> SessionRead:
    _require_question(db, question_id)
    try:
        state = manager.start_question(session_id, question_id)
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _session_to_schema(state)


@router.post(
    "/{session_id}/question/{question_id}/resolve",
    response_model=SessionRead,
)
def resolve_question(
    session_id: str,
    question_id: str,
    resolution: QuestionResolution,
    db: Session = Depends(get_db_session),
    manager: SessionManager = Depends(get_session_manager),
) -> SessionRead:
    question = _require_question(db, question_id)
    if resolution.team_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="team_id required")
    try:
        state = manager.resolve_question(
            session_id,
            question_id,
            resolution.team_id,
            resolution.outcome,
            points=question.points,
            steal_attempt=resolution.steal_attempt.model_dump() if resolution.steal_attempt else None,
        )
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return _resolve_session(state)


@router.post(
    "/{session_id}/turn/{team_index}",
    response_model=SessionRead,
)
def set_active_turn(
    session_id: str,
    team_index: int,
    manager: SessionManager = Depends(get_session_manager),
) -> SessionRead:
    try:
        state = manager.set_active_turn(session_id, team_index)
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _session_to_schema(state)
