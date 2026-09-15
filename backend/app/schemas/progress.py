from typing import List, Optional
from pydantic import BaseModel
from app.schemas.quiz import QuizHistoryItem


class TopicPerformanceItem(BaseModel):
    topic: str
    subject: str
    total_answered: int
    correct_count: int
    accuracy_percentage: float


class ProgressResponse(BaseModel):
    total_quizzes: int
    total_questions_answered: int
    total_correct_answers: int
    average_score_percentage: float
    topic_performance: List[TopicPerformanceItem]
    recent_quizzes: List[QuizHistoryItem]
