import json
import logging
from typing import Any, Dict, List, Optional
from groq import Groq
from app.core.config import settings
from app.schemas.ai import AIOutputContract, AIQuestionContract

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert curriculum designer and educator for LearnNote AI.
Your job is to transform learning material (whether a topic name, raw text, or document notes) into a complete, structured, high-yield learning module with a reusable question bank.

You MUST respond strictly with a single valid JSON object containing exactly these top-level keys:
- "title": (string) Crisp, descriptive title for the module
- "subject": (string) High-level academic/professional subject (e.g. Computer Science, Python Programming, Data Analysis)
- "topic": (string) Focused topic name
- "summary": (string) 2-4 sentence executive overview
- "core_concepts": (array of strings) 3-7 core fundamental concepts
- "detailed_explanation": (string) Thorough, well-organized explanation using Markdown (headers, bullet points, code blocks if applicable)
- "examples": (array of strings) 2-5 clear, practical code snippets or real-world concrete examples
- "common_mistakes": (array of strings) 2-5 common pitfalls, anti-patterns, or misconceptions and how to avoid them
- "key_takeaways": (array of strings) 3-6 quick-reference summary points for revision
- "tags": (array of strings) 3-8 lowercase keywords for searching and organizing
- "questions": (array of question objects) Generate approximately 15-20 high-quality, non-trivial questions.
    Each question object MUST have:
    - "question": (string) Clear, unambiguous question text
    - "question_type": (string) MUST be one of: "mcq", "true_false", or "fill_blank"
    - "options": (array of strings for "mcq" with 4 options, ["True", "False"] for "true_false", or null for "fill_blank")
    - "correct_answer": (string) The exact correct answer string matching one of the options (for mcq/true_false) or concise expected phrase (for fill_blank)
    - "explanation": (string) 1-3 sentences explaining why this answer is correct and why common alternatives are wrong
- "sources": (array of strings) 1-3 citations, documentation links, or source references

Make questions diverse across concepts. Do not create repetitive or trivial questions.
Do NOT wrap the JSON in markdown code blocks like ```json ... ```. Output raw JSON only.
"""


def get_groq_client() -> Optional[Groq]:
    if not settings.GROQ_API_KEY or settings.GROQ_API_KEY.strip() == "":
        return None
    return Groq(api_key=settings.GROQ_API_KEY.strip())


def sanitize_question(q: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Validate and normalize a question dictionary."""
    question_text = str(q.get("question", "")).strip()
    q_type = str(q.get("question_type", "")).strip().lower()
    correct_ans = str(q.get("correct_answer", "")).strip()
    explanation = str(q.get("explanation", "")).strip()
    options = q.get("options")

    if not question_text or not correct_ans:
        return None

    if q_type not in ["mcq", "true_false", "fill_blank"]:
        # Try to infer
        if options and isinstance(options, list) and len(options) >= 2:
            q_type = "mcq"
        elif correct_ans.lower() in ["true", "false"]:
            q_type = "true_false"
        else:
            q_type = "fill_blank"

    if q_type == "true_false":
        options = ["True", "False"]
        if correct_ans.lower() in ["t", "true", "yes", "1"]:
            correct_ans = "True"
        else:
            correct_ans = "False"
    elif q_type == "mcq":
        if not options or not isinstance(options, list) or len(options) < 2:
            # Fallback to fill_blank if options are missing
            q_type = "fill_blank"
            options = None
        else:
            options = [str(opt).strip() for opt in options if str(opt).strip()]
            if correct_ans not in options:
                # If correct_answer was given as an index or letter (A, B, C, D)
                if correct_ans.isdigit() and 0 <= int(correct_ans) < len(options):
                    correct_ans = options[int(correct_ans)]
                elif len(correct_ans) == 1 and correct_ans.upper() in "ABCD":
                    idx = ord(correct_ans.upper()) - ord("A")
                    if idx < len(options):
                        correct_ans = options[idx]
                    else:
                        options.append(correct_ans)
                else:
                    options.append(correct_ans)
    else:
        options = None

    if not explanation:
        explanation = f"The correct answer is: {correct_ans}"

    return {
        "question": question_text,
        "question_type": q_type,
        "options": options,
        "correct_answer": correct_ans,
        "explanation": explanation,
    }


def generate_fallback_knowledge(
    mode: str,
    topic: Optional[str] = None,
    subject: Optional[str] = None,
    text: Optional[str] = None,
    source_reference: Optional[str] = None,
) -> AIOutputContract:
    """Deterministic fallback generator when GROQ_API_KEY is not configured or offline."""
    base_title = topic or (text[:50] + "..." if text else "Study Note")
    base_subject = subject or "General Knowledge"
    base_topic = topic or "Core Concepts"

    core_concepts = [
        f"Foundational principles of {base_topic}",
        "Syntax, mechanics, and runtime lifecycle",
        "Best practices, optimization, and memory management",
        "Common real-world integration scenarios",
    ]

    detailed_exp = (
        f"# {base_title}\n\n"
        f"## Overview\n"
        f"{base_topic} is an essential concept within {base_subject}. "
        f"Understanding its core behavior enables developers and practitioners to write more robust, maintainable, and efficient solutions.\n\n"
        f"## Key Architectural Pillars\n"
        f"1. **Predictability**: Structured design patterns minimize unintended side effects.\n"
        f"2. **Maintainability**: Clear separation of concerns simplifies debugging and long-term testing.\n"
        f"3. **Performance**: Efficient execution guarantees optimal resource utilization.\n\n"
        f"## Practical Implementation\n"
        f"When applying {base_topic}, always verify boundary conditions, handle exceptions gracefully, and write modular routines that can be tested in isolation."
    )

    examples = [
        f"// Basic Implementation of {base_topic}\n"
        f"function executeTask(input) {{\n"
        f"    // Validate preconditions\n"
        f"    if (!input) throw new Error('Invalid parameter');\n"
        f"    return process(input);\n"
        f"}}",
        f"# Pythonic approach to {base_topic}\n"
        f"def handle_resource(config):\n"
        f"    with open(config.path, 'r') as stream:\n"
        f"        return stream.read()",
    ]

    common_mistakes = [
        f"Ignoring edge cases and missing null checks when initializing {base_topic}",
        "Overcomplicating the implementation when a simpler standard library abstraction exists",
        "Neglecting cleanup or resource deallocation in error paths",
    ]

    key_takeaways = [
        f"{base_topic} provides a structured pattern for solving recurring problems in {base_subject}.",
        "Prioritize clear boundaries, readable logic, and comprehensive validation.",
        "Test both happy paths and edge cases thoroughly.",
    ]

    tags = [
        base_subject.lower().replace(" ", "-"),
        base_topic.lower().replace(" ", "-"),
        "fundamentals",
        "best-practices",
    ]

    questions_raw = [
        {
            "question": f"What is the primary objective of studying {base_topic} in {base_subject}?",
            "question_type": "mcq",
            "options": [
                f"To build structured, maintainable, and reliable systems using {base_topic}",
                "To increase execution latency unnecessarily",
                "To bypass static analysis and automated testing",
                "To eliminate the need for version control",
            ],
            "correct_answer": f"To build structured, maintainable, and reliable systems using {base_topic}",
            "explanation": f"The primary goal is to establish reliable, maintainable architectures using the principles of {base_topic}.",
        },
        {
            "question": f"True or False: In {base_subject}, proper error handling and boundary validation are essential when using {base_topic}.",
            "question_type": "true_false",
            "options": ["True", "False"],
            "correct_answer": "True",
            "explanation": "Validating boundaries and handling errors prevent cascading failures and data corruption.",
        },
        {
            "question": f"Fill in the blank: A key benefit of modular design in {base_topic} is improved code ________.",
            "question_type": "fill_blank",
            "options": None,
            "correct_answer": "maintainability",
            "explanation": "Modular design enables individual components to be updated, debugged, and tested independently.",
        },
        {
            "question": f"Which of the following represents a common mistake when dealing with {base_topic}?",
            "question_type": "mcq",
            "options": [
                "Neglecting resource cleanup in error paths",
                "Writing unit tests for public methods",
                "Documenting architectural invariants",
                "Using meaningful variable identifiers",
            ],
            "correct_answer": "Neglecting resource cleanup in error paths",
            "explanation": "Unclosed handles, leaked memory, or dangling references in error conditions cause severe runtime issues.",
        },
        {
            "question": f"True or False: {base_topic} can be effectively mastered without understanding its underlying execution model.",
            "question_type": "true_false",
            "options": ["True", "False"],
            "correct_answer": "False",
            "explanation": "Understanding how the runtime executes and allocates resources is essential for diagnosing subtle bugs.",
        },
        {
            "question": f"Fill in the blank: The principle of separation of ________ ensures that distinct concerns are managed by different components.",
            "question_type": "fill_blank",
            "options": None,
            "correct_answer": "concerns",
            "explanation": "Separation of concerns is a fundamental software engineering principle.",
        },
    ]

    validated_questions = []
    for q in questions_raw:
        san = sanitize_question(q)
        if san:
            validated_questions.append(AIQuestionContract(**san))

    return AIOutputContract(
        title=base_title.title(),
        subject=base_subject,
        topic=base_topic,
        summary=f"A structured, comprehensive learning module covering {base_topic} within {base_subject}, detailing architectural principles, practical examples, and common pitfalls.",
        core_concepts=core_concepts,
        detailed_explanation=detailed_exp,
        examples=examples,
        common_mistakes=common_mistakes,
        key_takeaways=key_takeaways,
        tags=tags,
        questions=validated_questions,
        sources=[source_reference or f"{base_subject} Documentation & Standards"],
    )


async def generate_knowledge(
    mode: str,
    topic: Optional[str] = None,
    subject: Optional[str] = None,
    text: Optional[str] = None,
    file_extracted_text: Optional[str] = None,
    source_reference: Optional[str] = None,
) -> AIOutputContract:
    """Generate structured knowledge and questions using Groq API, with robust fallback."""
    client = get_groq_client()

    if not client:
        logger.warning("GROQ_API_KEY not set. Using high-quality offline generator.")
        return generate_fallback_knowledge(
            mode=mode,
            topic=topic,
            subject=subject,
            text=text or file_extracted_text,
            source_reference=source_reference,
        )

    # Build prompt
    prompt_parts = [f"Creation Mode: {mode}"]
    if subject:
        prompt_parts.append(f"Subject: {subject}")
    if topic:
        prompt_parts.append(f"Topic: {topic}")
    if text:
        prompt_parts.append(f"Provided Learning Material / Text:\n{text[:12000]}")
    if file_extracted_text:
        prompt_parts.append(f"Extracted Document Content:\n{file_extracted_text[:12000]}")
    if source_reference:
        prompt_parts.append(f"Source Reference: {source_reference}")

    user_prompt = "\n\n".join(prompt_parts)

    try:
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=4096,
        )

        response_content = completion.choices[0].message.content
        data = json.loads(response_content)

        # Sanitize and validate questions list
        raw_questions = data.get("questions", [])
        clean_questions = []
        for q in raw_questions:
            san = sanitize_question(q)
            if san:
                clean_questions.append(AIQuestionContract(**san))

        # Ensure we have at least 5 questions; if Groq returned too few, complement with fallback
        if len(clean_questions) < 5:
            fallback = generate_fallback_knowledge(mode, topic or data.get("topic"), subject or data.get("subject"), text)
            clean_questions.extend(fallback.questions[: 10 - len(clean_questions)])

        tags = [str(t).strip().lower() for t in data.get("tags", []) if str(t).strip()]
        if not tags:
            tags = ["learning", (data.get("topic") or "notes").lower().replace(" ", "-")]

        return AIOutputContract(
            title=data.get("title") or (topic or "Study Note").title(),
            subject=data.get("subject") or (subject or "General Studies"),
            topic=data.get("topic") or (topic or "Core Concepts"),
            summary=data.get("summary") or "Comprehensive structured learning notes.",
            core_concepts=data.get("core_concepts") or ["Foundational concepts and principles"],
            detailed_explanation=data.get("detailed_explanation") or "Detailed explanation not provided.",
            examples=data.get("examples") or [],
            common_mistakes=data.get("common_mistakes") or [],
            key_takeaways=data.get("key_takeaways") or [],
            tags=tags,
            questions=clean_questions,
            sources=data.get("sources") or ([source_reference] if source_reference else ["LearnNote AI Knowledge Engine"]),
        )

    except Exception as e:
        logger.error(f"Error calling Groq API: {str(e)}. Falling back to deterministic generator.")
        return generate_fallback_knowledge(
            mode=mode,
            topic=topic,
            subject=subject,
            text=text or file_extracted_text,
            source_reference=source_reference,
        )


async def regenerate_questions(note_title: str, note_subject: str, note_topic: str, note_summary: str, note_content: Dict[str, Any]) -> List[AIQuestionContract]:
    """Regenerate a fresh set of ~15-20 questions for an existing note."""
    client = get_groq_client()
    if not client:
        fallback = generate_fallback_knowledge("topic", topic=note_topic, subject=note_subject)
        return fallback.questions

    prompt = (
        f"Regenerate a brand new, diverse bank of approximately 15-20 questions for this learning note:\n"
        f"Title: {note_title}\n"
        f"Subject: {note_subject}\n"
        f"Topic: {note_topic}\n"
        f"Summary: {note_summary}\n"
        f"Content Excerpt: {str(note_content)[:3000]}\n\n"
        f"Output a JSON object with a single key 'questions' containing an array of question objects "
        f"with question, question_type ('mcq', 'true_false', 'fill_blank'), options, correct_answer, explanation."
    )

    try:
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
            max_tokens=3000,
        )
        data = json.loads(completion.choices[0].message.content)
        raw_questions = data.get("questions", [])
        clean_questions = []
        for q in raw_questions:
            san = sanitize_question(q)
            if san:
                clean_questions.append(AIQuestionContract(**san))
        if clean_questions:
            return clean_questions
    except Exception as e:
        logger.error(f"Failed to regenerate questions via Groq: {e}")

    fallback = generate_fallback_knowledge("topic", topic=note_topic, subject=note_subject)
    return fallback.questions
