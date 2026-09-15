from datetime import datetime, timezone
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.note import Note
from app.models.question import Question
from app.models.quiz import QuizAnswer, QuizAttempt
from app.models.tag import NoteTag, Tag
from app.models.user import User
from app.schemas.quiz import (
    QuizAnswerResultItem,
    QuizHistoryItem,
    QuizQuestionClientItem,
    QuizResultResponse,
    QuizStartRequest,
    QuizStartResponse,
    QuizSubmitRequest,
    QuizTopicStats,
)
from app.services.quiz_service import is_answer_correct

router = APIRouter(prefix="/quiz", tags=["Quiz System"])


@router.get("/topics", response_model=List[QuizTopicStats])
def get_quiz_topics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all distinct topics with their question and note counts for the authenticated user."""
    # Query distinct topics from user's notes
    results = (
        db.query(
            Note.topic,
            func.count(func.distinct(Note.id)).label("note_count"),
            func.count(Question.id).label("question_count"),
        )
        .outerjoin(Question, (Question.note_id == Note.id) & (Question.user_id == current_user.id))
        .filter(Note.user_id == current_user.id)
        .group_by(Note.topic)
        .all()
    )

    return [
        QuizTopicStats(
            topic=r[0],
            note_count=r[1],
            question_count=r[2],
        )
        for r in results
    ]


@router.post("/start", response_model=QuizStartResponse)
def start_quiz(
    payload: QuizStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Randomly select stored questions from the specified topics or tags and start a quiz attempt."""
    query = (
        db.query(Question)
        .join(Note, Question.note_id == Note.id)
        .filter(Question.user_id == current_user.id)
    )

    if payload.topics:
        query = query.filter(Note.topic.in_(payload.topics))

    if payload.tags:
        query = (
            query.join(NoteTag, Note.id == NoteTag.note_id)
            .join(Tag, NoteTag.tag_id == Tag.id)
            .filter(Tag.name.in_([t.lower().strip() for t in payload.tags]))
        )

    all_matching_questions = query.distinct().all()

    if not all_matching_questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No questions found for the selected scope. Please select different topics/tags or create knowledge first.",
        )

    total_available = len(all_matching_questions)
    target_count = min(total_available, payload.question_count)
    selected_questions = random.sample(all_matching_questions, target_count)

    warning = None
    if total_available < payload.question_count:
        warning = f"Only {total_available} question(s) available for the selected scope (you requested {payload.question_count})."

    # Create topic scope summary string
    scope_str = ", ".join(payload.topics) if payload.topics else "All Topics"
    if payload.tags:
        scope_str += f" [Tags: {', '.join(payload.tags)}]"

    attempt = QuizAttempt(
        user_id=current_user.id,
        score=0,
        total_questions=len(selected_questions),
        topic_scope=scope_str[:250],
        created_at=datetime.now(timezone.utc),
    )
    db.add(attempt)
    db.flush()

    # Pre-record placeholder answers for this attempt
    client_questions: List[QuizQuestionClientItem] = []
    for q in selected_questions:
        # Shuffle options for MCQs if applicable so choices aren't in predictable order
        options_copy = list(q.options) if q.options else None
        if options_copy and q.question_type == "mcq":
            random.shuffle(options_copy)

        client_questions.append(
            QuizQuestionClientItem(
                id=q.id,
                question=q.question,
                question_type=q.question_type,
                options=options_copy,
                note_id=q.note_id,
                note_title=q.note.title if q.note else None,
            )
        )

        ans = QuizAnswer(
            attempt_id=attempt.id,
            question_id=q.id,
            selected_answer=None,
            is_correct=False,
            question_text=q.question,
            question_type=q.question_type,
            correct_answer=q.correct_answer,
            explanation=q.explanation,
        )
        db.add(ans)

    db.commit()
    db.refresh(attempt)

    return QuizStartResponse(
        attempt_id=attempt.id,
        total_questions=len(selected_questions),
        requested_count=payload.question_count,
        warning=warning,
        questions=client_questions,
    )


@router.post("/{attempt_id}/submit", response_model=QuizResultResponse)
def submit_quiz(
    attempt_id: int,
    payload: QuizSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit user answers, calculate score deterministically without AI, and return full result breakdown."""
    attempt = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.id == attempt_id, QuizAttempt.user_id == current_user.id)
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found or access denied.")

    # Build answer map by question_id
    user_answers_map = {ans.question_id: ans.selected_answer for ans in payload.answers}

    # Fetch stored placeholder answers for this attempt
    stored_answers = (
        db.query(QuizAnswer)
        .filter(QuizAnswer.attempt_id == attempt.id)
        .all()
    )

    total_correct = 0
    now = datetime.now(timezone.utc)
    notes_to_update_review = set()

    for ans_record in stored_answers:
        user_choice = user_answers_map.get(ans_record.question_id)
        ans_record.selected_answer = user_choice

        # Deterministic scoring
        correct = is_answer_correct(
            selected=user_choice,
            correct=ans_record.correct_answer,
            question_type=ans_record.question_type,
        )
        ans_record.is_correct = correct
        if correct:
            total_correct += 1

        # Track note for updating last_reviewed_at
        if ans_record.question and ans_record.question.note_id:
            notes_to_update_review.add(ans_record.question.note_id)

    # Update attempt score
    attempt.score = total_correct
    db.add(attempt)

    # Update last_reviewed_at on tested notes for date-based revision
    if notes_to_update_review:
        db.query(Note).filter(Note.id.in_(notes_to_update_review)).update(
            {"last_reviewed_at": now}, synchronize_session=False
        )

    db.commit()
    db.refresh(attempt)

    # Prepare response breakdown
    result_items: List[QuizAnswerResultItem] = []
    for a in stored_answers:
        result_items.append(
            QuizAnswerResultItem(
                question_id=a.question_id,
                question=a.question_text or (a.question.question if a.question else "Question"),
                question_type=a.question_type or (a.question.question_type if a.question else "mcq"),
                options=a.question.options if a.question else None,
                selected_answer=a.selected_answer,
                correct_answer=a.correct_answer or (a.question.correct_answer if a.question else ""),
                is_correct=a.is_correct,
                explanation=a.explanation or (a.question.explanation if a.question else ""),
                note_id=a.question.note_id if a.question else None,
                note_title=a.question.note.title if a.question and a.question.note else None,
            )
        )

    percentage = round((total_correct / attempt.total_questions * 100.0), 1) if attempt.total_questions > 0 else 0.0

    return QuizResultResponse(
        attempt_id=attempt.id,
        score=attempt.score,
        total_questions=attempt.total_questions,
        percentage=percentage,
        correct_count=total_correct,
        incorrect_count=attempt.total_questions - total_correct,
        created_at=attempt.created_at,
        topic_scope=attempt.topic_scope,
        answers=result_items,
    )


@router.get("/{attempt_id}/result", response_model=QuizResultResponse)
def get_quiz_result(
    attempt_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the detailed result of a past quiz attempt."""
    attempt = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.id == attempt_id, QuizAttempt.user_id == current_user.id)
        .first()
    )
    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found or access denied.")

    stored_answers = (
        db.query(QuizAnswer)
        .filter(QuizAnswer.attempt_id == attempt.id)
        .all()
    )

    result_items: List[QuizAnswerResultItem] = []
    for a in stored_answers:
        result_items.append(
            QuizAnswerResultItem(
                question_id=a.question_id,
                question=a.question_text or (a.question.question if a.question else "Question"),
                question_type=a.question_type or (a.question.question_type if a.question else "mcq"),
                options=a.question.options if a.question else None,
                selected_answer=a.selected_answer,
                correct_answer=a.correct_answer or (a.question.correct_answer if a.question else ""),
                is_correct=a.is_correct,
                explanation=a.explanation or (a.question.explanation if a.question else ""),
                note_id=a.question.note_id if a.question else None,
                note_title=a.question.note.title if a.question and a.question.note else None,
            )
        )

    percentage = round((attempt.score / attempt.total_questions * 100.0), 1) if attempt.total_questions > 0 else 0.0

    return QuizResultResponse(
        attempt_id=attempt.id,
        score=attempt.score,
        total_questions=attempt.total_questions,
        percentage=percentage,
        correct_count=attempt.score,
        incorrect_count=attempt.total_questions - attempt.score,
        created_at=attempt.created_at,
        topic_scope=attempt.topic_scope,
        answers=result_items,
    )


@router.get("/history", response_model=List[QuizHistoryItem])
def get_quiz_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve quiz attempt history for the authenticated user, ordered newest first."""
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.created_at.desc())
        .all()
    )

    history = []
    for att in attempts:
        pct = round((att.score / att.total_questions * 100.0), 1) if att.total_questions > 0 else 0.0
        history.append(
            QuizHistoryItem(
                id=att.id,
                score=att.score,
                total_questions=att.total_questions,
                percentage=pct,
                topic_scope=att.topic_scope,
                created_at=att.created_at,
            )
        )
    return history
