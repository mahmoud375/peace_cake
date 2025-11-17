from __future__ import annotations

import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import relationship

from app.db.session import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(
        String(36),
        ForeignKey("quizzes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    prompt = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    correct_index = Column(Integer, nullable=False)
    points = Column(Integer, nullable=False)
    difficulty = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    quiz = relationship("Quiz", back_populates="questions")
