from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, List

from pydantic import BaseModel, ConfigDict

from .quiz import QuizSummary

if TYPE_CHECKING:
    from app.schemas.quiz import QuizSummary


class ProfileBase(BaseModel):
    name: str


class ProfileCreate(ProfileBase):
    pass


class ProfileRead(ProfileBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProfileDetail(ProfileRead):
    quiz_count: int
    quizzes: List["QuizSummary"]
