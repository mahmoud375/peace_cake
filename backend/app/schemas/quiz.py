from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from .question import QuestionRead

if TYPE_CHECKING:
    from app.schemas.question import QuestionRead


class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None


class QuizCreate(QuizBase):
    pass


class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class QuizRead(QuizBase):
    id: str
    profile_id: str
    created_at: datetime
    updated_at: datetime
    questions: List["QuestionRead"] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class QuizSummary(BaseModel):
    id: str
    title: str
    description: Optional[str]
    question_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


QuestionRead.update_forward_refs()
