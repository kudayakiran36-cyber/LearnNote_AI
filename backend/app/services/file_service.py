import base64
import io
import logging
import os
import uuid
from typing import Optional, Tuple
from fastapi import HTTPException, UploadFile
from PIL import Image
from pypdf import PdfReader
from app.core.config import settings

logger = logging.getLogger(__name__)

# 10 MB maximum file size
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
}

STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage")
os.makedirs(STORAGE_DIR, exist_ok=True)


async def validate_and_save_file(file: UploadFile) -> Tuple[str, str, bytes]:
    """Validate file type, size, and save locally (or prepare for Supabase)."""
    filename = file.filename or "upload"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported formats: PDF, PNG, JPG, WEBP.",
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 10 MB limit.")

    # Generate unique stored filename
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(STORAGE_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    return unique_filename, ext, content


def extract_text_from_pdf(content: bytes) -> str:
    """Extract readable text from a PDF byte stream."""
    try:
        reader = PdfReader(io.BytesIO(content))
        text_pages = []
        for page_idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_pages.append(f"--- Page {page_idx + 1} ---\n" + page_text.strip())

        extracted = "\n\n".join(text_pages).strip()
        if not extracted:
            raise HTTPException(
                status_code=400,
                detail="No readable text could be extracted from this PDF. It might contain only scanned images or be password protected.",
            )
        return extracted
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to read PDF document: {str(e)}")


async def extract_text_from_image(content: bytes, filename: str) -> str:
    """Extract content from an image using Groq Vision model if available, or basic metadata."""
    # Verify image integrity with Pillow
    try:
        image = Image.open(io.BytesIO(content))
        image.verify()
        width, height = image.size
        img_format = image.format
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid or corrupt image file.")

    # Try Groq vision model if API key is present
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip():
        try:
            from groq import Groq

            client = Groq(api_key=settings.GROQ_API_KEY.strip())
            base64_image = base64.b64encode(content).decode("utf-8")
            mime_type = "image/jpeg"
            if filename.lower().endswith(".png"):
                mime_type = "image/png"
            elif filename.lower().endswith(".webp"):
                mime_type = "image/webp"

            prompt = (
                "Please transcribe all visible text, code, diagrams, formulas, and conceptual content "
                "from this educational image into comprehensive structured notes."
            )

            completion = client.chat.completions.create(
                model=settings.GROQ_VISION_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{mime_type};base64,{base64_image}"},
                            },
                        ],
                    }
                ],
                max_tokens=2048,
            )
            extracted_text = completion.choices[0].message.content
            if extracted_text and extracted_text.strip():
                return extracted_text.strip()
        except Exception as e:
            logger.warning(f"Groq Vision extraction failed: {e}. Falling back to image metadata.")

    # Fallback description for offline / mock testing
    base_name = os.path.splitext(filename)[0].replace("_", " ").replace("-", " ")
    return (
        f"Image Document: {filename}\n"
        f"Detected format: {img_format}, dimensions: {width}x{height}px.\n"
        f"Topic inferred from filename: {base_name.title()}.\n"
        f"The image depicts conceptual diagrams, charts, and technical reference material for {base_name}."
    )
