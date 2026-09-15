from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.question import QuestionCreate, QuestionResponse


class NoteContent(BaseModel):
    core_concepts: List[str] = Field(default_factory=list, description="List of foundational concepts")
    detailed_explanation: str = Field(..., description="In-depth conceptual breakdown")
    examples: List[str] = Field(default_factory=list, description="Concrete examples or code snippets")
    common_mistakes: List[str] = Field(default_factory=list, description="Common misconceptions or errors")
    key_takeaways: List[str] = Field(default_factory=list, description="Core takeaways for fast revision")
    sources: List[str] = Field(default_factory=list, description="Source references or citations")


class NoteCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    subject: str = Field(..., min_length=2, max_length=150)
    topic: str = Field(..., min_length=2, max_length=150)
    summary: str = Field(..., min_length=10)
    content: NoteContent
    tags: List[str] = Field(default_factory=list)
    questions: List[QuestionCreate] = Field(default_factory=list)
    source_type: str = Field("topic", description="topic, text, pdf, or image")
    source_reference: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    topic: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[NoteContent] = None
    tags: Optional[List[str]] = None


class TagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class NoteListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    subject: str
    topic: str
    summary: str
    tags: List[str]
    question_count: int
    source_type: str
    source_reference: Optional[str] = None
    last_reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class NoteDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    subject: str
    topic: str
    summary: str
    content: NoteContent
    tags: List[str]
    questions: List[QuestionResponse]
    source_type: str
    source_reference: Optional[str] = None
    last_reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
