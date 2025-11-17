from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class DifficultyLevel(str, Enum):
    EASY = "Easy"
    MEDIUM = "Medium"
    HARD = "Hard"
    IMPOSSIBLE = "Impossible"


class QuestionBase(BaseModel):
    prompt: str
    options: List[str] = Field(..., min_length=3, max_length=4)
    correct_index: int
    points: int = Field(..., gt=0)
    difficulty: Optional[DifficultyLevel] = None

    @model_validator(mode="after")
    def validate_correct_index(self) -> "QuestionBase":
        if not 0 <= self.correct_index < len(self.options):
            raise ValueError("correct_index must reference one of the provided options")
        return self


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    prompt: Optional[str] = None
    options: Optional[List[str]] = Field(default=None, min_length=3, max_length=4)
    correct_index: Optional[int] = None
    points: Optional[int] = Field(default=None, gt=0)
    difficulty: Optional[DifficultyLevel] = None

    @model_validator(mode="after")
    def validate_indices(self) -> "QuestionUpdate":
        if self.options is not None and self.correct_index is not None:
            if not 0 <= self.correct_index < len(self.options):
                raise ValueError("correct_index must reference one of the provided options")
        return self


class QuestionOrderUpdate(BaseModel):
    points: Optional[int] = Field(default=None, gt=0)
    difficulty: Optional[DifficultyLevel] = None


class QuestionRead(QuestionBase):
    id: str
    quiz_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
