from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.note import Note
from app.models.question import Question
from app.models.quiz import QuizAnswer, QuizAttempt
from app.models.user import User
from app.schemas.progress import ProgressResponse, TopicPerformanceItem
from app.schemas.quiz import QuizHistoryItem

router = APIRouter(prefix="/progress", tags=["Learning Progress"])


@router.get("", response_model=ProgressResponse)
def get_user_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Calculate and return real progress metrics based on stored quiz attempts and answers."""
    # 1. Lifetime Quiz Stats
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.created_at.desc())
        .all()
    )

    total_quizzes = len(attempts)
    total_questions_answered = sum(att.total_questions for att in attempts)
    total_correct_answers = sum(att.score for att in attempts)

    average_score_percentage = 0.0
    if total_questions_answered > 0:
        average_score_percentage = round((total_correct_answers / total_questions_answered * 100.0), 1)

    # 2. Topic-Level Performance (calculated strictly from actual stored answers)
    from sqlalchemy import case, Integer

    topic_stats_query = (
        db.query(
            Note.topic,
            Note.subject,
            func.count(QuizAnswer.id).label("total_answers"),
            func.sum(case((QuizAnswer.is_correct == True, 1), else_=0)).label("correct_answers"),
        )
        .join(QuizAttempt, QuizAnswer.attempt_id == QuizAttempt.id)
        .join(Question, QuizAnswer.question_id == Question.id)
        .join(Note, Question.note_id == Note.id)
        .filter(QuizAttempt.user_id == current_user.id)
        .group_by(Note.topic, Note.subject)
        .all()
    )

    topic_performance: List[TopicPerformanceItem] = []
    for row in topic_stats_query:
        topic_name = row[0]
        subject_name = row[1]
        t_total = row[2] or 0
        t_correct = int(row[3] or 0)
        t_pct = round((t_correct / t_total * 100.0), 1) if t_total > 0 else 0.0

        topic_performance.append(
            TopicPerformanceItem(
                topic=topic_name,
                subject=subject_name,
                total_answered=t_total,
                correct_count=t_correct,
                accuracy_percentage=t_pct,
            )
        )

    # Sort topic performance by accuracy descending
    topic_performance.sort(key=lambda x: x.accuracy_percentage, reverse=True)

    # 3. Recent 10 Quizzes
    recent_quizzes = []
    for att in attempts[:10]:
        pct = round((att.score / att.total_questions * 100.0), 1) if att.total_questions > 0 else 0.0
        recent_quizzes.append(
            QuizHistoryItem(
                id=att.id,
                score=att.score,
                total_questions=att.total_questions,
                percentage=pct,
                topic_scope=att.topic_scope,
                created_at=att.created_at,
            )
        )

    return ProgressResponse(
        total_quizzes=total_quizzes,
        total_questions_answered=total_questions_answered,
        total_correct_answers=total_correct_answers,
        average_score_percentage=average_score_percentage,
        topic_performance=topic_performance,
        recent_quizzes=recent_quizzes,
    )
