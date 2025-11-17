from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db_session
from app.models import Question, Quiz
from app.schemas.question import (
    QuestionCreate,
    QuestionOrderUpdate,
    QuestionRead,
    QuestionUpdate,
)

router = APIRouter(prefix="/api", tags=["questions"])


@router.get("/quizzes/{quiz_id}/questions", response_model=List[QuestionRead])
def list_questions_for_quiz(
    quiz_id: str,
    db: Session = Depends(get_db_session),
) -> List[QuestionRead]:
    _ensure_quiz_exists(db, quiz_id)
    stmt = select(Question).where(Question.quiz_id == quiz_id).order_by(Question.points)
    return db.scalars(stmt).all()


@router.post(
    "/quizzes/{quiz_id}/questions",
    response_model=QuestionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_question(
    quiz_id: str,
    question_in: QuestionCreate,
    db: Session = Depends(get_db_session),
) -> QuestionRead:
    _ensure_quiz_exists(db, quiz_id)
    question = Question(quiz_id=quiz_id, **question_in.model_dump())
    db.add(question)
    db.commit()
    db.refresh(question)
    return question  # type: ignore[return-value]


@router.get("/questions/{question_id}", response_model=QuestionRead)
def get_question(question_id: str, db: Session = Depends(get_db_session)) -> QuestionRead:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return question  # type: ignore[return-value]


@router.put("/questions/{question_id}", response_model=QuestionRead)
def update_question(
    question_id: str,
    question_update: QuestionUpdate,
    db: Session = Depends(get_db_session),
) -> QuestionRead:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    payload = question_update.model_dump(exclude_unset=True)
    if "options" in payload and "correct_index" not in payload:
        # ensure correct_index still valid after options update
        if not 0 <= question.correct_index < len(payload["options"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="correct_index must reference updated options",
            )

    if "correct_index" in payload and "options" not in payload:
        if not 0 <= payload["correct_index"] < len(question.options):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="correct_index must reference existing options",
            )

    for field, value in payload.items():
        setattr(question, field, value)

    db.commit()
    db.refresh(question)
    return question  # type: ignore[return-value]


@router.delete("/questions/{question_id}")
def delete_question(question_id: str, db: Session = Depends(get_db_session)) -> None:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    db.delete(question)
    db.commit()


@router.patch("/questions/{question_id}/order", response_model=QuestionRead)
def update_question_order(
    question_id: str,
    order_update: QuestionOrderUpdate,
    db: Session = Depends(get_db_session),
) -> QuestionRead:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    for field, value in order_update.model_dump(exclude_unset=True).items():
        setattr(question, field, value)

    db.commit()
    db.refresh(question)
    return question  # type: ignore[return-value]


def _ensure_quiz_exists(db: Session, quiz_id: str) -> None:
    if db.get(Quiz, quiz_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
