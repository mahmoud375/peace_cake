from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db_session
from app.models import Profile, Quiz
from app.schemas.profile import ProfileCreate, ProfileDetail, ProfileRead
from app.schemas.quiz import QuizSummary

router = APIRouter(prefix="/api/v1/profiles", tags=["profiles"])


@router.get("/", response_model=List[ProfileRead])
def list_profiles(db: Session = Depends(get_db_session)) -> List[ProfileRead]:
    stmt = select(Profile).order_by(Profile.created_at)
    return db.scalars(stmt).all()


@router.post("/", response_model=ProfileRead, status_code=status.HTTP_201_CREATED)
def create_profile(profile_in: ProfileCreate, db: Session = Depends(get_db_session)) -> ProfileRead:
    profile = Profile(name=profile_in.name.strip())
    db.add(profile)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Profile name already exists",
        ) from exc
    db.refresh(profile)
    return profile  # type: ignore[return-value]


@router.get("/{profile_id}", response_model=ProfileDetail)
def get_profile(profile_id: str, db: Session = Depends(get_db_session)) -> ProfileDetail:
    stmt = (
        select(Profile)
        .where(Profile.id == profile_id)
        .options(selectinload(Profile.quizzes).selectinload(Quiz.questions))
    )
    profile = db.scalars(stmt).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    quiz_summaries = [
        QuizSummary(
            id=quiz.id,
            title=quiz.title,
            description=quiz.description,
            question_count=len(quiz.questions),
            created_at=quiz.created_at,
        )
        for quiz in profile.quizzes
    ]

    return ProfileDetail(
        id=profile.id,
        name=profile.name,
        created_at=profile.created_at,
        quiz_count=len(quiz_summaries),
        quizzes=quiz_summaries,
    )


@router.patch("/{profile_id}", response_model=ProfileRead)
def update_profile(
    profile_id: str,
    profile_in: ProfileCreate,
    db: Session = Depends(get_db_session),
) -> ProfileRead:
    profile = db.get(Profile, profile_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    profile.name = profile_in.name.strip()
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Profile name already exists",
        ) from exc
    db.refresh(profile)
    return profile  # type: ignore[return-value]


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(profile_id: str, db: Session = Depends(get_db_session)) -> Response:
    profile = db.get(Profile, profile_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    db.delete(profile)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
