def test_quiz_flow_and_deterministic_scoring(client, auth_headers_a):
    # 1. Create a note with 3 diverse question types
    note_payload = {
        "title": "Computer Hardware Basics",
        "subject": "Hardware",
        "topic": "Architecture",
        "summary": "CPU, RAM, and Bus architectures.",
        "content": {
            "core_concepts": ["ALU", "Registers", "Control Unit"],
            "detailed_explanation": "Von Neumann architecture components.",
            "examples": [],
            "common_mistakes": [],
            "key_takeaways": [],
            "sources": [],
        },
        "tags": ["hardware", "cpu"],
        "questions": [
            {
                "question": "What component of the CPU performs arithmetic and logical operations?",
                "question_type": "mcq",
                "options": ["ALU", "Control Unit", "Cache", "RAM"],
                "correct_answer": "ALU",
                "explanation": "ALU stands for Arithmetic Logic Unit.",
            },
            {
                "question": "True or False: RAM is non-volatile primary storage.",
                "question_type": "true_false",
                "options": ["True", "False"],
                "correct_answer": "False",
                "explanation": "RAM is volatile memory; data is lost when power is disconnected.",
            },
            {
                "question": "Fill in the blank: The high-speed memory located directly inside the CPU is ________.",
                "question_type": "fill_blank",
                "options": None,
                "correct_answer": "register",
                "explanation": "CPU registers provide fastest data access directly on-chip.",
            },
        ],
    }
    note_res = client.post("/notes", json=note_payload, headers=auth_headers_a)
    assert note_res.status_code == 201

    # 2. Check quiz topics
    topics_res = client.get("/quiz/topics", headers=auth_headers_a)
    assert topics_res.status_code == 200
    topics_list = topics_res.json()
    assert any(t["topic"] == "Architecture" for t in topics_list)

    # 3. Start quiz requesting 10 questions (should return 3 with warning)
    start_res = client.post(
        "/quiz/start",
        json={"topics": ["Architecture"], "question_count": 10},
        headers=auth_headers_a,
    )
    assert start_res.status_code == 200
    quiz_data = start_res.json()
    attempt_id = quiz_data["attempt_id"]
    assert quiz_data["total_questions"] == 3
    assert quiz_data["warning"] is not None
    assert "Only 3 question(s) available" in quiz_data["warning"]

    # Verify questions do not leak correct answers or explanations
    for q in quiz_data["questions"]:
        assert "correct_answer" not in q
        assert "explanation" not in q

    # 4. Submit answers: 2 correct, 1 wrong
    # Answer 1 (MCQ ALU): correct
    # Answer 2 (T/F False): correct
    # Answer 3 (Fill blank): wrong answer ("hard drive")
    q_map = {q["question"]: q["id"] for q in quiz_data["questions"]}

    answers_submission = [
        {"question_id": q_map["What component of the CPU performs arithmetic and logical operations?"], "selected_answer": "ALU"},
        {"question_id": q_map["True or False: RAM is non-volatile primary storage."], "selected_answer": "False"},
        {"question_id": q_map["Fill in the blank: The high-speed memory located directly inside the CPU is ________."], "selected_answer": "hard drive"},
    ]

    submit_res = client.post(
        f"/quiz/{attempt_id}/submit",
        json={"answers": answers_submission},
        headers=auth_headers_a,
    )
    assert submit_res.status_code == 200
    result_data = submit_res.json()
    assert result_data["score"] == 2
    assert result_data["total_questions"] == 3
    assert result_data["correct_count"] == 2
    assert result_data["incorrect_count"] == 1
    assert result_data["percentage"] == 66.7

    # 5. Check quiz history
    history_res = client.get("/quiz/history", headers=auth_headers_a)
    assert history_res.status_code == 200
    history_list = history_res.json()
    assert len(history_list) >= 1
    assert history_list[0]["score"] == 2
