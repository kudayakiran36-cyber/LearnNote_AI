from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


QuestionType = Literal["mcq", "true_false", "fill_blank"]


class QuestionBase(BaseModel):
    question: str = Field(..., min_length=5, description="Question text")
    question_type: QuestionType = Field(..., description="mcq, true_false, or fill_blank")
    options: Optional[List[str]] = Field(None, description="Choices for MCQ or True/False")
    correct_answer: str = Field(..., description="The correct answer string")
    explanation: str = Field(..., description="Explanation of the correct answer")


class QuestionCreate(QuestionBase):
    pass


class QuestionUpdate(BaseModel):
    question: Optional[str] = None
    question_type: Optional[QuestionType] = None
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None


class QuestionResponse(QuestionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    note_id: int
    created_at: datetime
