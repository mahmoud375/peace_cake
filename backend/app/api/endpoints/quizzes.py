from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db_session
from app.models import Profile, Question, Quiz
from app.schemas.quiz import QuizCreate, QuizRead, QuizSummary, QuizUpdate

router = APIRouter(prefix="/api/v1", tags=["quizzes"])


@router.get("/profiles/{profile_id}/quizzes", response_model=List[QuizSummary])
def list_quizzes_for_profile(
    profile_id: str,
    db: Session = Depends(get_db_session),
) -> List[QuizSummary]:
    _ensure_profile_exists(db, profile_id)
    quizzes = _fetch_quizzes_for_profile(db, profile_id)
    return [
        QuizSummary(
            id=quiz.id,
            title=quiz.title,
            description=quiz.description,
            question_count=len(quiz.questions),
            created_at=quiz.created_at,
        )
        for quiz in quizzes
    ]


@router.post(
    "/profiles/{profile_id}/quizzes",
    response_model=QuizRead,
    status_code=status.HTTP_201_CREATED,
)
def create_quiz_for_profile(
    profile_id: str,
    quiz_in: QuizCreate,
    db: Session = Depends(get_db_session),
) -> QuizRead:
    _ensure_profile_exists(db, profile_id)
    quiz = Quiz(profile_id=profile_id, **quiz_in.model_dump())
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz  # type: ignore[return-value]


@router.get("/quizzes/{quiz_id}", response_model=QuizRead)
def get_quiz(quiz_id: str, db: Session = Depends(get_db_session)) -> QuizRead:
    quiz = _fetch_quiz_with_questions(db, quiz_id)
    return quiz  # type: ignore[return-value]


@router.put("/quizzes/{quiz_id}", response_model=QuizRead)
def update_quiz(
    quiz_id: str,
    quiz_update: QuizUpdate,
    db: Session = Depends(get_db_session),
) -> QuizRead:
    quiz = db.get(Quiz, quiz_id)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    for field, value in quiz_update.model_dump(exclude_unset=True).items():
        setattr(quiz, field, value)

    db.commit()
    db.refresh(quiz)
    return quiz  # type: ignore[return-value]


@router.delete("/quizzes/{quiz_id}")
def delete_quiz(quiz_id: str, db: Session = Depends(get_db_session)) -> None:
    quiz = db.get(Quiz, quiz_id)
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")

    db.delete(quiz)
    db.commit()


@router.post("/quizzes/{quiz_id}/duplicate", response_model=QuizRead)
def duplicate_quiz(quiz_id: str, db: Session = Depends(get_db_session)) -> QuizRead:
    quiz = _fetch_quiz_with_questions(db, quiz_id)

    duplicate = Quiz(
        profile_id=quiz.profile_id,
        title=f"{quiz.title} (Copy)",
        description=quiz.description,
    )
    for question in quiz.questions:
        duplicate.questions.append(
            Question(
                prompt=question.prompt,
                options=question.options,
                correct_index=question.correct_index,
                points=question.points,
                difficulty=question.difficulty,
            )
        )

    db.add(duplicate)
    db.commit()
    db.refresh(duplicate)
    return duplicate  # type: ignore[return-value]


def _ensure_profile_exists(db: Session, profile_id: str) -> None:
    if db.get(Profile, profile_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")


def _fetch_quizzes_for_profile(db: Session, profile_id: str) -> List[Quiz]:
    stmt = (
        select(Quiz)
        .where(Quiz.profile_id == profile_id)
        .options(selectinload(Quiz.questions))
        .order_by(Quiz.created_at)
    )
    return db.scalars(stmt).all()


def _fetch_quiz_with_questions(db: Session, quiz_id: str) -> Quiz:
    stmt = (
        select(Quiz)
        .where(Quiz.id == quiz_id)
        .options(selectinload(Quiz.questions))
    )
    quiz = db.scalars(stmt).first()
    if quiz is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    return quiz
