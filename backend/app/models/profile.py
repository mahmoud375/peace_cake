from __future__ import annotations

import uuid

from sqlalchemy import Column, DateTime, String, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    quizzes = relationship(
        "Quiz",
        back_populates="profile",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
