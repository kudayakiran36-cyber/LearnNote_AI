from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.models.note import Note
from app.models.question import Question
from app.models.quiz import QuizAttempt
from app.models.user import User
from app.schemas.auth import PasswordUpdate, UserResponse

router = APIRouter(tags=["User Settings"])


@router.get("/settings")
def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve user account settings and workspace statistics."""
    note_count = db.query(Note).filter(Note.user_id == current_user.id).count()
    question_count = db.query(Question).filter(Question.user_id == current_user.id).count()
    quiz_count = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id).count()

    return {
        "user": UserResponse.model_validate(current_user),
        "statistics": {
            "total_notes": note_count,
            "total_questions": question_count,
            "total_quizzes": quiz_count,
        },
        "features": {
            "email_verification_available": False,
            "password_recovery": "Manual / Support-based (MVP)",
            "ai_provider": "Groq (llama-3.3-70b-versatile)",
        },
    }


@router.put("/settings/password")
def update_user_password(
    payload: PasswordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update user password. Blocked for demo accounts to preserve evaluation access."""
    if current_user.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo account passwords cannot be changed to ensure continuous access for evaluators.",
        )

    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password provided.",
        )

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully."}


@router.delete("/account")
def delete_user_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently delete user account and all associated knowledge notes, questions, and quiz records."""
    if current_user.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo accounts cannot be deleted to preserve evaluation datasets.",
        )

    db.delete(current_user)
    db.commit()
    return {"message": f"Account '{current_user.unique_id}' and all associated workspace data have been deleted."}
