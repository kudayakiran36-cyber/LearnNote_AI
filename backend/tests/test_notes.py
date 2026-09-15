def test_generate_knowledge_topic(client, auth_headers_a):
    response = client.post(
        "/notes/generate",
        json={"mode": "topic", "topic": "Python Generators", "subject": "Python"},
        headers=auth_headers_a,
    )
    assert response.status_code == 200
    data = response.json()
    assert "title" in data
    assert "Python Generators" in data["topic"]
    assert len(data["questions"]) >= 5
    assert "core_concepts" in data
    assert "summary" in data


def test_generate_knowledge_text(client, auth_headers_a):
    sample_text = (
        "Recursion is a programming technique where a function calls itself directly or indirectly. "
        "A base case is mandatory to prevent stack overflow errors. Divide and conquer algorithms often use recursion."
    )
    response = client.post(
        "/notes/generate",
        json={"mode": "text", "text": sample_text, "subject": "Algorithms"},
        headers=auth_headers_a,
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["questions"]) >= 5


def test_create_and_get_note(client, auth_headers_a):
    payload = {
        "title": "AsyncIO in Python",
        "subject": "Python",
        "topic": "AsyncIO",
        "summary": "Asynchronous programming using event loops, coroutines, and tasks.",
        "content": {
            "core_concepts": ["Event loop", "Coroutines", "await syntax"],
            "detailed_explanation": "AsyncIO is a library to write concurrent code using the async/await syntax.",
            "examples": ["async def main(): await asyncio.sleep(1)"],
            "common_mistakes": ["Calling blocking I/O inside async functions"],
            "key_takeaways": ["AsyncIO is single-threaded cooperative multitasking"],
            "sources": ["Python Docs"],
        },
        "tags": ["python", "asyncio", "concurrency"],
        "questions": [
            {
                "question": "What is the keyword used to pause a coroutine until a task completes?",
                "question_type": "fill_blank",
                "options": None,
                "correct_answer": "await",
                "explanation": "The await keyword pauses coroutine execution until the awaitable finishes.",
            }
        ],
    }
    create_res = client.post("/notes", json=payload, headers=auth_headers_a)
    assert create_res.status_code == 201
    created_note = create_res.json()
    note_id = created_note["id"]

    # Fetch by ID
    get_res = client.get(f"/notes/{note_id}", headers=auth_headers_a)
    assert get_res.status_code == 200
    note_data = get_res.json()
    assert note_data["title"] == "AsyncIO in Python"
    assert "asyncio" in note_data["tags"]
    assert len(note_data["questions"]) == 1


def test_update_note(client, auth_headers_a):
    # Create note
    payload = {
        "title": "Initial Title",
        "subject": "CS",
        "topic": "Data Structures",
        "summary": "Initial summary content here.",
        "content": {
            "core_concepts": ["Concept 1"],
            "detailed_explanation": "Explanation",
            "examples": [],
            "common_mistakes": [],
            "key_takeaways": [],
            "sources": [],
        },
        "tags": ["tag1"],
        "questions": [],
    }
    create_res = client.post("/notes", json=payload, headers=auth_headers_a)
    note_id = create_res.json()["id"]

    # Update note
    update_res = client.put(
        f"/notes/{note_id}",
        json={"title": "Updated Title", "tags": ["tag1", "new_tag"]},
        headers=auth_headers_a,
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["title"] == "Updated Title"
    assert "new_tag" in updated["tags"]


def test_search_and_filter_notes(client, auth_headers_a):
    # Create two distinct notes
    client.post(
        "/notes",
        json={
            "title": "PostgreSQL Indexing Strategies",
            "subject": "Databases",
            "topic": "PostgreSQL",
            "summary": "B-Tree, Hash, GIN, and GiST indexes.",
            "content": {
                "core_concepts": ["B-Tree"],
                "detailed_explanation": "Indexes speed up read queries.",
                "examples": [],
                "common_mistakes": [],
                "key_takeaways": [],
                "sources": [],
            },
            "tags": ["sql", "postgres", "performance"],
            "questions": [],
        },
        headers=auth_headers_a,
    )

    client.post(
        "/notes",
        json={
            "title": "CSS Grid & Flexbox",
            "subject": "Web Development",
            "topic": "CSS Layout",
            "summary": "Modern layout engines for responsive web design.",
            "content": {
                "core_concepts": ["Grid template columns"],
                "detailed_explanation": "CSS grid organizes items in two dimensions.",
                "examples": [],
                "common_mistakes": [],
                "key_takeaways": [],
                "sources": [],
            },
            "tags": ["css", "frontend", "responsive"],
            "questions": [],
        },
        headers=auth_headers_a,
    )

    # Search by keyword
    search_res = client.get("/notes?q=PostgreSQL", headers=auth_headers_a)
    assert search_res.status_code == 200
    assert len(search_res.json()) == 1
    assert "PostgreSQL" in search_res.json()[0]["title"]

    # Filter by tag
    tag_res = client.get("/notes?tag=css", headers=auth_headers_a)
    assert tag_res.status_code == 200
    assert len(tag_res.json()) == 1
    assert "CSS" in tag_res.json()[0]["title"]
