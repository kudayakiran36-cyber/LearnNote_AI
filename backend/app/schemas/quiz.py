from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class QuizStartRequest(BaseModel):
    topics: Optional[List[str]] = Field(None, description="Optional list of topic names to filter by")
    tags: Optional[List[str]] = Field(None, description="Optional list of tag names to filter by")
    question_count: int = Field(10, ge=1, le=50, description="Requested number of questions (e.g. 5, 10, 15, 20)")


class QuizQuestionClientItem(BaseModel):
    id: int
    question: str
    question_type: str
    options: Optional[List[str]] = None
    note_id: int
    note_title: Optional[str] = None


class QuizStartResponse(BaseModel):
    attempt_id: int
    total_questions: int
    requested_count: int
    warning: Optional[str] = None  # If fewer questions exist than requested
    questions: List[QuizQuestionClientItem]


class SingleAnswerSubmit(BaseModel):
    question_id: int
    selected_answer: str


class QuizSubmitRequest(BaseModel):
    answers: List[SingleAnswerSubmit]


class QuizAnswerResultItem(BaseModel):
    question_id: Optional[int]
    question: str
    question_type: str
    options: Optional[List[str]] = None
    selected_answer: Optional[str]
    correct_answer: str
    is_correct: bool
    explanation: str
    note_id: Optional[int] = None
    note_title: Optional[str] = None


class QuizResultResponse(BaseModel):
    attempt_id: int
    score: int
    total_questions: int
    percentage: float
    correct_count: int
    incorrect_count: int
    created_at: datetime
    topic_scope: Optional[str] = None
    answers: List[QuizAnswerResultItem]


class QuizHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    score: int
    total_questions: int
    percentage: float
    topic_scope: Optional[str] = None
    created_at: datetime


class QuizTopicStats(BaseModel):
    topic: str
    question_count: int
    note_count: int
