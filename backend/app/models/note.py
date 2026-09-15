from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    subject = Column(String(150), nullable=False, index=True)
    topic = Column(String(150), nullable=False, index=True)
    summary = Column(Text, nullable=False)
    # Content stores structured dict: core_concepts, detailed_explanation, examples, common_mistakes, key_takeaways, sources
    content = Column(JSON, nullable=False, default=dict)
    source_type = Column(String(50), nullable=False, default="topic")  # topic, text, pdf, image
    source_reference = Column(String(255), nullable=True)  # filename or url
    last_reviewed_at = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="notes")
    tags = relationship("Tag", secondary="note_tags", back_populates="notes")
    questions = relationship("Question", back_populates="note", cascade="all, delete-orphan")
