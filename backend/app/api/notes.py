from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.note import Note
from app.models.question import Question
from app.models.tag import NoteTag, Tag
from app.models.user import User
from app.schemas.ai import AIGenerateRequest, AIOutputContract
from app.schemas.note import NoteCreate, NoteDetail, NoteListItem, NoteUpdate, TagResponse
from app.schemas.question import QuestionResponse, QuestionUpdate
from app.services.ai_service import generate_knowledge, regenerate_questions
from app.services.file_service import extract_text_from_image, extract_text_from_pdf, validate_and_save_file

router = APIRouter(tags=["Knowledge Notes"])


def get_or_create_tag(db: Session, name: str) -> Tag:
    tag_clean = name.strip().lower()
    tag = db.query(Tag).filter(Tag.name == tag_clean).first()
    if not tag:
        tag = Tag(name=tag_clean)
        db.add(tag)
        db.flush()
    return tag


def format_note_list_item(note: Note) -> NoteListItem:
    tags = [t.name for t in note.tags]
    return NoteListItem(
        id=note.id,
        title=note.title,
        subject=note.subject,
        topic=note.topic,
        summary=note.summary,
        tags=tags,
        question_count=len(note.questions),
        source_type=note.source_type,
        source_reference=note.source_reference,
        last_reviewed_at=note.last_reviewed_at,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


def format_note_detail(note: Note) -> NoteDetail:
    tags = [t.name for t in note.tags]
    questions = [QuestionResponse.model_validate(q) for q in note.questions]
    return NoteDetail(
        id=note.id,
        title=note.title,
        subject=note.subject,
        topic=note.topic,
        summary=note.summary,
        content=note.content,
        tags=tags,
        questions=questions,
        source_type=note.source_type,
        source_reference=note.source_reference,
        last_reviewed_at=note.last_reviewed_at,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


# --- AI Generation & Previews ---


@router.post("/notes/generate", response_model=AIOutputContract)
async def generate_note_preview(
    payload: AIGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate structured knowledge notes and questions preview using AI. Does not persist to DB yet."""
    if payload.mode == "topic" and not payload.topic:
        raise HTTPException(status_code=400, detail="Topic is required when creating knowledge from a topic.")
    if payload.mode == "text" and not payload.text:
        raise HTTPException(status_code=400, detail="Learning text or notes content is required.")

    result = await generate_knowledge(
        mode=payload.mode,
        topic=payload.topic,
        subject=payload.subject,
        text=payload.text,
        file_extracted_text=payload.file_extracted_text,
        source_reference=payload.source_reference,
    )
    return result


@router.post("/notes/upload", response_model=AIOutputContract)
async def upload_file_and_generate_preview(
    file: UploadFile = File(...),
    subject: Optional[str] = Form(None),
    topic: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
):
    """Upload a PDF or image, extract text content, and generate a knowledge preview."""
    unique_filename, ext, file_bytes = await validate_and_save_file(file)

    if ext == ".pdf":
        extracted_text = extract_text_from_pdf(file_bytes)
    else:
        extracted_text = await extract_text_from_image(file_bytes, file.filename or "upload")

    result = await generate_knowledge(
        mode="upload",
        topic=topic or file.filename,
        subject=subject or "Document Import",
        file_extracted_text=extracted_text,
        source_reference=file.filename or unique_filename,
    )
    return result


# --- Notes CRUD ---


@router.post("/notes", response_model=NoteDetail, status_code=status.HTTP_201_CREATED)
def create_and_save_note(
    payload: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save a reviewed and finalized knowledge note with its tags and question bank."""
    now = datetime.now(timezone.utc)

    content_dict = payload.content.model_dump()

    note = Note(
        user_id=current_user.id,
        title=payload.title.strip(),
        subject=payload.subject.strip(),
        topic=payload.topic.strip(),
        summary=payload.summary.strip(),
        content=content_dict,
        source_type=payload.source_type,
        source_reference=payload.source_reference,
        created_at=now,
        updated_at=now,
    )
    db.add(note)
    db.flush()

    # Add tags
    for tag_name in payload.tags:
        cleaned_tag = tag_name.strip().lower()
        if cleaned_tag:
            tag_obj = get_or_create_tag(db, cleaned_tag)
            note_tag = NoteTag(note_id=note.id, tag_id=tag_obj.id)
            db.add(note_tag)

    # Add questions
    for q in payload.questions:
        question_obj = Question(
            user_id=current_user.id,
            note_id=note.id,
            question=q.question.strip(),
            question_type=q.question_type,
            options=q.options,
            correct_answer=q.correct_answer.strip(),
            explanation=q.explanation.strip(),
            created_at=now,
        )
        db.add(question_obj)

    db.commit()
    db.refresh(note)
    return format_note_detail(note)


@router.get("/notes", response_model=List[NoteListItem])
def list_notes(
    q: Optional[str] = Query(None, description="Search keyword in title, topic, subject, or summary"),
    topic: Optional[str] = Query(None, description="Filter by exact topic"),
    tag: Optional[str] = Query(None, description="Filter by tag name"),
    sort: str = Query("newest", description="Sort order: 'newest' or 'oldest'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List notes belonging to the authenticated user with search and filtering."""
    query = db.query(Note).filter(Note.user_id == current_user.id)

    if q and q.strip():
        search_term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                Note.title.ilike(search_term),
                Note.topic.ilike(search_term),
                Note.subject.ilike(search_term),
                Note.summary.ilike(search_term),
            )
        )

    if topic and topic.strip():
        query = query.filter(Note.topic == topic.strip())

    if tag and tag.strip():
        query = query.join(Note.tags).filter(Tag.name == tag.strip().lower())

    if sort == "oldest":
        query = query.order_by(Note.created_at.asc())
    else:
        query = query.order_by(Note.created_at.desc())

    notes = query.all()
    return [format_note_list_item(n) for n in notes]


@router.get("/notes/search", response_model=List[NoteListItem])
def search_notes(
    q: str = Query(..., min_length=1, description="Search query string"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Dedicated search endpoint for notes."""
    return list_notes(q=q, current_user=current_user, db=db)


@router.get("/notes/{id}", response_model=NoteDetail)
def get_note(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve full details of a note including core concepts, explanation, and question bank."""
    note = db.query(Note).filter(Note.id == id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found or access denied.")
    return format_note_detail(note)


@router.put("/notes/{id}", response_model=NoteDetail)
def update_note(
    id: int,
    payload: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update note attributes without calling AI."""
    note = db.query(Note).filter(Note.id == id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found or access denied.")

    if payload.title is not None:
        note.title = payload.title.strip()
    if payload.subject is not None:
        note.subject = payload.subject.strip()
    if payload.topic is not None:
        note.topic = payload.topic.strip()
    if payload.summary is not None:
        note.summary = payload.summary.strip()
    if payload.content is not None:
        note.content = payload.content.model_dump()

    if payload.tags is not None:
        # Clear existing tags for this note
        db.query(NoteTag).filter(NoteTag.note_id == note.id).delete()
        for tag_name in payload.tags:
            cleaned = tag_name.strip().lower()
            if cleaned:
                tag_obj = get_or_create_tag(db, cleaned)
                note_tag = NoteTag(note_id=note.id, tag_id=tag_obj.id)
                db.add(note_tag)

    note.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(note)
    return format_note_detail(note)


@router.delete("/notes/{id}", status_code=status.HTTP_200_OK)
def delete_note(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a note and its questions. Preserves global tags and quiz attempts."""
    if current_user.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo accounts are protected from note deletion to preserve evaluation datasets.",
        )

    note = db.query(Note).filter(Note.id == id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found or access denied.")

    db.delete(note)
    db.commit()
    return {"message": f"Note '{note.title}' and associated questions successfully deleted."}


@router.post("/notes/{id}/regenerate-questions", response_model=List[QuestionResponse])
async def regenerate_note_questions(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Regenerate the entire question bank for a note upon explicit user confirmation."""
    note = db.query(Note).filter(Note.id == id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found or access denied.")

    new_questions = await regenerate_questions(
        note_title=note.title,
        note_subject=note.subject,
        note_topic=note.topic,
        note_summary=note.summary,
        note_content=note.content,
    )

    # Delete existing questions for this note
    db.query(Question).filter(Question.note_id == note.id).delete()

    created_questions = []
    now = datetime.now(timezone.utc)
    for q in new_questions:
        q_obj = Question(
            user_id=current_user.id,
            note_id=note.id,
            question=q.question.strip(),
            question_type=q.question_type,
            options=q.options,
            correct_answer=q.correct_answer.strip(),
            explanation=q.explanation.strip(),
            created_at=now,
        )
        db.add(q_obj)
        created_questions.append(q_obj)

    db.commit()
    for q_obj in created_questions:
        db.refresh(q_obj)

    return [QuestionResponse.model_validate(q) for q in created_questions]


# --- Individual Question Management ---


@router.put("/questions/{id}", response_model=QuestionResponse)
def update_question(
    id: int,
    payload: QuestionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Edit an individual question within a note's question bank without calling AI."""
    question = db.query(Question).filter(Question.id == id, Question.user_id == current_user.id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found or access denied.")

    if payload.question is not None:
        question.question = payload.question.strip()
    if payload.question_type is not None:
        question.question_type = payload.question_type
    if payload.options is not None:
        question.options = payload.options
    if payload.correct_answer is not None:
        question.correct_answer = payload.correct_answer.strip()
    if payload.explanation is not None:
        question.explanation = payload.explanation.strip()

    db.commit()
    db.refresh(question)
    return QuestionResponse.model_validate(question)


@router.delete("/questions/{id}", status_code=status.HTTP_200_OK)
def delete_question(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an individual question."""
    if current_user.is_demo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo accounts are protected from deleting prepared questions.",
        )

    question = db.query(Question).filter(Question.id == id, Question.user_id == current_user.id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found or access denied.")

    db.delete(question)
    db.commit()
    return {"message": "Question successfully deleted."}
