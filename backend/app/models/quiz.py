from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Integer, nullable=False, default=0)
    total_questions = Column(Integer, nullable=False, default=0)
    topic_scope = Column(String(255), nullable=True)  # Store summary of topics/tags included
    created_at = Column(DateTime, default=utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="quiz_attempts")
    answers = relationship("QuizAnswer", back_populates="attempt", cascade="all, delete-orphan")


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="SET NULL"), nullable=True, index=True)
    selected_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=False, default=False)

    # Historical snapshots to preserve quiz history if question or note is modified/deleted
    question_text = Column(Text, nullable=True)
    question_type = Column(String(50), nullable=True)
    correct_answer = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)

    # Relationships
    attempt = relationship("QuizAttempt", back_populates="answers")
    question = relationship("Question")
