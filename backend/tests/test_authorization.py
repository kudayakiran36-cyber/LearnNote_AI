def create_sample_note_for_user(client, auth_headers):
    payload = {
        "title": "Private Note Alpha",
        "subject": "Computer Science",
        "topic": "Algorithms",
        "summary": "Confidential study notes on binary search trees.",
        "content": {
            "core_concepts": ["Tree traversal", "In-order traversal"],
            "detailed_explanation": "Detailed breakdown of binary search trees.",
            "examples": ["root = Node(10)"],
            "common_mistakes": ["Not balancing trees"],
            "key_takeaways": ["BST lookup is O(log N) average"],
            "sources": ["CLRS"],
        },
        "tags": ["bst", "algorithms"],
        "questions": [
            {
                "question": "What is the average lookup time complexity in a balanced BST?",
                "question_type": "mcq",
                "options": ["O(log N)", "O(N)", "O(1)", "O(N^2)"],
                "correct_answer": "O(log N)",
                "explanation": "Balanced trees divide search space in half at each step.",
            }
        ],
    }
    res = client.post("/notes", json=payload, headers=auth_headers)
    assert res.status_code == 201
    return res.json()


def test_user_b_cannot_view_user_a_note(client, auth_headers_a, auth_headers_b):
    note_a = create_sample_note_for_user(client, auth_headers_a)
    note_id = note_a["id"]

    # User B tries to access User A's note
    res = client.get(f"/notes/{note_id}", headers=auth_headers_b)
    assert res.status_code == 404
    assert "not found or access denied" in res.json()["detail"].lower()


def test_user_b_cannot_update_user_a_note(client, auth_headers_a, auth_headers_b):
    note_a = create_sample_note_for_user(client, auth_headers_a)
    note_id = note_a["id"]

    res = client.put(
        f"/notes/{note_id}",
        json={"title": "Hacked Title"},
        headers=auth_headers_b,
    )
    assert res.status_code == 404


def test_user_b_cannot_delete_user_a_note(client, auth_headers_a, auth_headers_b):
    note_a = create_sample_note_for_user(client, auth_headers_a)
    note_id = note_a["id"]

    res = client.delete(f"/notes/{note_id}", headers=auth_headers_b)
    assert res.status_code == 404

    # Confirm note still exists for User A
    check = client.get(f"/notes/{note_id}", headers=auth_headers_a)
    assert check.status_code == 200


def test_notes_list_isolation(client, auth_headers_a, auth_headers_b):
    # Create note for User A
    create_sample_note_for_user(client, auth_headers_a)

    # User B lists notes -> should be empty
    res_b = client.get("/notes", headers=auth_headers_b)
    assert res_b.status_code == 200
    assert len(res_b.json()) == 0

    # User A lists notes -> should have 1 note
    res_a = client.get("/notes", headers=auth_headers_a)
    assert res_a.status_code == 200
    assert len(res_a.json()) == 1


def test_user_b_cannot_mutate_user_a_question(client, auth_headers_a, auth_headers_b):
    note_a = create_sample_note_for_user(client, auth_headers_a)
    question_id = note_a["questions"][0]["id"]

    # User B tries to edit User A's question
    res = client.put(
        f"/questions/{question_id}",
        json={"question": "Tampered Question Text?"},
        headers=auth_headers_b,
    )
    assert res.status_code == 404

    # User B tries to delete User A's question
    res_del = client.delete(f"/questions/{question_id}", headers=auth_headers_b)
    assert res_del.status_code == 404
