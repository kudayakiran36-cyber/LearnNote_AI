from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.note import Note
from app.models.user import User
from app.schemas.revision import RevisionItem, RevisionResponse

router = APIRouter(prefix="/revision", tags=["Date-Based Revision"])


@router.get("", response_model=RevisionResponse)
def get_revision_queue(
    days: int = Query(3, ge=1, le=90, description="Notes unreviewed for more than this number of days"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve notes due for revision: either never reviewed or not reviewed within the threshold."""
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=days)

    notes = (
        db.query(Note)
        .filter(
            Note.user_id == current_user.id,
            or_(
                Note.last_reviewed_at.is_(None),
                Note.last_reviewed_at < cutoff,
            ),
        )
        .all()
    )

    items: List[RevisionItem] = []
    for n in notes:
        days_since = None
        status_label = "never_reviewed"
        if n.last_reviewed_at:
            # Handle naive or aware datetimes cleanly
            rev_time = n.last_reviewed_at
            if rev_time.tzinfo is None:
                rev_time = rev_time.replace(tzinfo=timezone.utc)
            delta = now - rev_time
            days_since = max(0, delta.days)
            status_label = "needs_revision"

        items.append(
            RevisionItem(
                id=n.id,
                title=n.title,
                subject=n.subject,
                topic=n.topic,
                summary=n.summary,
                question_count=len(n.questions),
                last_reviewed_at=n.last_reviewed_at,
                days_since_reviewed=days_since,
                status=status_label,
            )
        )

    # Sort: never reviewed first (None), then largest days_since_reviewed descending
    items.sort(key=lambda x: (x.days_since_reviewed is not None, -(x.days_since_reviewed or 9999)))

    return RevisionResponse(
        due_count=len(items),
        items=items,
    )


@router.post("/{note_id}/mark-reviewed")
def mark_note_as_reviewed(
    note_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Manually mark a note as reviewed right now."""
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found or access denied.")

    note.last_reviewed_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": f"Note '{note.title}' marked as reviewed."}
