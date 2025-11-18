from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class TeamBase(BaseModel):
    name: str


class TeamRead(TeamBase):
    id: str
    score: int = 0


class SessionCreate(BaseModel):
    quiz_id: str
    teams: List[TeamBase] = Field(..., min_items=2, max_items=4)


class SessionRead(BaseModel):
    id: str
    quiz_id: str
    teams: List[TeamRead]
    used_question_ids: List[str]
    current_question_id: Optional[str] = None
    question_started_at: Optional[datetime] = None
    current_turn_index: int


class QuestionStartResponse(BaseModel):
    session: SessionRead


class StealAttempt(BaseModel):
    team_id: str
    outcome: Literal["correct", "incorrect"]


class QuestionResolution(BaseModel):
    team_id: str
    outcome: Literal["correct", "incorrect"]
    steal_attempt: Optional[StealAttempt] = None
