from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from threading import Lock
from typing import Dict, List, Optional

from app.core.config import get_settings


@dataclass
class TeamState:
    id: str
    name: str
    score: int = 0


@dataclass
class SessionState:
    id: str
    quiz_id: str
    teams: List[TeamState]
    used_question_ids: set[str] = field(default_factory=set)
    current_question_id: Optional[str] = None
    question_started_at: Optional[datetime] = None
    current_question_id: Optional[str] = None
    question_started_at: Optional[datetime] = None
    current_turn_index: int = 0
    timer_seconds: int = 20


class SessionManager:
    def __init__(self) -> None:
        self._sessions: Dict[str, SessionState] = {}
        self._lock = Lock()
        self._settings = get_settings()

    def create_session(self, quiz_id: str, team_names: List[str], timer_seconds: int = 20) -> SessionState:
        if not (self._settings.min_teams <= len(team_names) <= self._settings.max_teams):
            raise ValueError(
                f"Team count must be between {self._settings.min_teams} and {self._settings.max_teams}."
            )

        with self._lock:
            session_id = str(uuid.uuid4())
            teams = [
                TeamState(id=str(uuid.uuid4()), name=name.strip(), score=0)
                for name in team_names
            ]
            state = SessionState(
                id=session_id, 
                quiz_id=quiz_id, 
                teams=teams, 
                timer_seconds=timer_seconds
            )
            self._sessions[session_id] = state
            return state

    def get_session(self, session_id: str) -> Optional[SessionState]:
        return self._sessions.get(session_id)

    def start_question(self, session_id: str, question_id: str) -> SessionState:
        with self._lock:
            state = self._require_session(session_id)
            if question_id in state.used_question_ids:
                raise ValueError("Question already used in this session")
            state.current_question_id = question_id
            state.question_started_at = datetime.now(timezone.utc)
            return state

    def resolve_question(
        self,
        session_id: str,
        question_id: str,
        team_id: str,
        outcome: str,
        *,
        points: int,
        steal_attempt: Optional[dict] = None,
    ) -> SessionState:
        with self._lock:
            state = self._require_session(session_id)
            if state.current_question_id != question_id:
                raise ValueError("Question is not currently active for this session")

            team = self._find_team(state, team_id)
            if outcome == "correct":
                team.score += points
            elif outcome != "incorrect":
                raise ValueError("Outcome must be 'correct' or 'incorrect'")

            if steal_attempt:
                state = self._handle_steal(state, steal_attempt, outcome, points)

            state.used_question_ids.add(question_id)
            state.current_question_id = None
            state.question_started_at = None
            
            # Auto-increment turn to next team (wraps around)
            state.current_turn_index = (state.current_turn_index + 1) % len(state.teams)
            
            return state

    def _handle_steal(
        self,
        state: SessionState,
        steal_attempt: dict,
        initial_outcome: str,
        points: int,
    ) -> SessionState:
        steal_team_id = steal_attempt.get("team_id")
        steal_outcome = steal_attempt.get("outcome")
        if steal_team_id is None or steal_outcome not in {"correct", "incorrect"}:
            raise ValueError("Invalid steal attempt payload")
        if initial_outcome != "incorrect":
            raise ValueError("Steal attempt only allowed after an incorrect initial outcome")
        steal_team = self._find_team(state, steal_team_id)
        if steal_outcome == "correct":
            steal_points = int(points * self._settings.steal_points_factor)
            steal_team.score += steal_points
        return state

    def set_active_turn(self, session_id: str, team_index: int) -> SessionState:
        with self._lock:
            state = self._require_session(session_id)
            if team_index < 0 or team_index >= len(state.teams):
                raise ValueError(f"Invalid team index: {team_index}")
            state.current_turn_index = team_index
            return state

    def _require_session(self, session_id: str) -> SessionState:
        state = self._sessions.get(session_id)
        if not state:
            raise KeyError("Session not found")
        return state

    def _find_team(self, state: SessionState, team_id: str) -> TeamState:
        for team in state.teams:
            if team.id == team_id:
                return team
        raise KeyError("Team not found in session")
