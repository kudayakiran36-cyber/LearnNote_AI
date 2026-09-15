from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class RevisionItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    subject: str
    topic: str
    summary: str
    question_count: int
    last_reviewed_at: Optional[datetime] = None
    days_since_reviewed: Optional[int] = None
    status: str  # "never_reviewed" or "needs_revision"


class RevisionResponse(BaseModel):
    due_count: int
    items: List[RevisionItem]
