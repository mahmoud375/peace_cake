from __future__ import annotations

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    profile_id = Column(
        String(36),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    profile = relationship("Profile", back_populates="quizzes")
    questions = relationship(
        "Question",
        back_populates="quiz",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="Question.points",
    )
