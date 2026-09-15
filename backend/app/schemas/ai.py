from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from app.schemas.question import QuestionBase


class AIQuestionContract(QuestionBase):
    pass


class AIOutputContract(BaseModel):
    title: str = Field(..., description="Concise descriptive title of the learning note")
    subject: str = Field(..., description="High-level subject (e.g. Computer Science, Python, Data Science)")
    topic: str = Field(..., description="Specific subtopic name")
    summary: str = Field(..., description="2-3 sentence overview summary")
    core_concepts: List[str] = Field(default_factory=list, description="Bulleted foundational concepts")
    detailed_explanation: str = Field(..., description="Comprehensive explanation of the subject matter")
    examples: List[str] = Field(default_factory=list, description="Practical code or real-world examples")
    common_mistakes: List[str] = Field(default_factory=list, description="Common traps, misconceptions, and fixes")
    key_takeaways: List[str] = Field(default_factory=list, description="Actionable points to remember")
    tags: List[str] = Field(default_factory=list, description="Keywords for indexing and searching")
    questions: List[AIQuestionContract] = Field(default_factory=list, description="Varied question bank (~15-20 questions)")
    sources: List[str] = Field(default_factory=list, description="Reference citations or source context")


class AIGenerateRequest(BaseModel):
    mode: Literal["topic", "text", "upload"] = "topic"
    topic: Optional[str] = None
    subject: Optional[str] = None
    text: Optional[str] = None
    file_extracted_text: Optional[str] = None
    source_reference: Optional[str] = None


class AIRegenerateQuestionsRequest(BaseModel):
    note_id: int
