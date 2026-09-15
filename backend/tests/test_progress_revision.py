from datetime import datetime, timedelta, timezone
from app.models.note import Note
from app.models.user import User
from app.core.security import hash_password


def test_progress_calculation(client, auth_headers_a, db_session, test_user_a):
    # Create note
    note = Note(
        user_id=test_user_a.id,
        title="Physics 101",
        subject="Physics",
        topic="Mechanics",
        summary="Newton's laws of motion.",
        content={"detailed_explanation": "F=ma"},
    )
    db_session.add(note)
    db_session.commit()

    # Query progress
    res = client.get("/progress", headers=auth_headers_a)
    assert res.status_code == 200
    data = res.json()
    assert "total_quizzes" in data
    assert "average_score_percentage" in data
    assert "topic_performance" in data


def test_revision_queue_and_mark_reviewed(client, auth_headers_a, db_session, test_user_a):
    now = datetime.now(timezone.utc)

    # Note 1: Never reviewed
    n1 = Note(
        user_id=test_user_a.id,
        title="Unreviewed Topic",
        subject="Chemistry",
        topic="Periodic Table",
        summary="Elements and electron configurations.",
        content={"detailed_explanation": "Atoms and molecules."},
        last_reviewed_at=None,
    )

    # Note 2: Reviewed 10 days ago (needs revision)
    n2 = Note(
        user_id=test_user_a.id,
        title="Old Topic",
        subject="Biology",
        topic="Genetics",
        summary="DNA and RNA.",
        content={"detailed_explanation": "Nucleotides."},
        last_reviewed_at=now - timedelta(days=10),
    )

    # Note 3: Reviewed today (fresh)
    n3 = Note(
        user_id=test_user_a.id,
        title="Fresh Topic",
        subject="Math",
        topic="Calculus",
        summary="Derivatives and integrals.",
        content={"detailed_explanation": "Limits."},
        last_reviewed_at=now,
    )

    db_session.add_all([n1, n2, n3])
    db_session.commit()

    # Get revision queue (default threshold 3 days)
    res = client.get("/revision?days=3", headers=auth_headers_a)
    assert res.status_code == 200
    queue = res.json()
    assert queue["due_count"] == 2
    titles = [item["title"] for item in queue["items"]]
    assert "Unreviewed Topic" in titles
    assert "Old Topic" in titles
    assert "Fresh Topic" not in titles

    # Mark Note 2 as reviewed
    mark_res = client.post(f"/revision/{n2.id}/mark-reviewed", headers=auth_headers_a)
    assert mark_res.status_code == 200

    # Verify queue is reduced
    res2 = client.get("/revision?days=3", headers=auth_headers_a)
    assert res2.status_code == 200
    queue2 = res2.json()
    assert queue2["due_count"] == 1
    assert queue2["items"][0]["title"] == "Unreviewed Topic"


def test_demo_user_protection(client, db_session):
    # Create demo user
    demo_user = User(
        unique_id="eval_demo_user",
        email="eval@learnnote.ai",
        password_hash=hash_password("DemoPassword123!"),
        is_demo=True,
    )
    db_session.add(demo_user)
    db_session.commit()

    from app.core.security import create_access_token
    token = create_access_token(subject=str(demo_user.id))
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to change password
    pwd_res = client.put(
        "/settings/password",
        json={"current_password": "DemoPassword123!", "new_password": "NewDemoPass123!"},
        headers=headers,
    )
    assert pwd_res.status_code == 403
    assert "demo" in pwd_res.json()["detail"].lower()

    # Attempt to delete account
    del_res = client.delete("/account", headers=headers)
    assert del_res.status_code == 403
    assert "demo" in del_res.json()["detail"].lower()
