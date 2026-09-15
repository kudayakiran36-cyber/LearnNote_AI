import re
from datetime import datetime, timezone
from typing import Optional


def normalize_text(text: Optional[str]) -> str:
    """Strip whitespace, lowercase, and collapse multiple spaces."""
    if text is None:
        return ""
    # Remove leading/trailing quotes and punctuation
    cleaned = str(text).strip().lower()
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned


def is_answer_correct(selected: Optional[str], correct: str, question_type: str) -> bool:
    """Perform deterministic answer comparison without AI."""
    if selected is None:
        return False

    sel_clean = normalize_text(selected)
    cor_clean = normalize_text(correct)

    if question_type == "true_false":
        true_values = {"true", "t", "yes", "1"}
        false_values = {"false", "f", "no", "0"}

        sel_bool = True if sel_clean in true_values else (False if sel_clean in false_values else None)
        cor_bool = True if cor_clean in true_values else (False if cor_clean in false_values else None)

        if sel_bool is not None and cor_bool is not None:
            return sel_bool == cor_bool
        return sel_clean == cor_clean

    if question_type == "mcq":
        return sel_clean == cor_clean

    if question_type == "fill_blank":
        # Allow slight punctuation differences (trailing periods, hyphens)
        clean_sel = re.sub(r"[.,!?;:\"']+$", "", sel_clean).strip()
        clean_cor = re.sub(r"[.,!?;:\"']+$", "", cor_clean).strip()
        return clean_sel == clean_cor

    # Fallback to direct string comparison
    return sel_clean == cor_clean
