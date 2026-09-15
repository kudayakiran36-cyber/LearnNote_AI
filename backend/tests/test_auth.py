def test_register_success(client):
    response = client.post(
        "/auth/register",
        json={
            "unique_id": "new_student",
            "email": "student@example.com",
            "password": "StrongPassword123!",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["unique_id"] == "new_student"
    assert data["user"]["email"] == "student@example.com"
    assert data["user"]["is_demo"] is False


def test_register_duplicate_id(client, test_user_a):
    response = client.post(
        "/auth/register",
        json={
            "unique_id": test_user_a.unique_id,
            "email": "different@example.com",
            "password": "StrongPassword123!",
        },
    )
    assert response.status_code == 400
    assert "already taken" in response.json()["detail"].lower()


def test_register_duplicate_email(client, test_user_a):
    response = client.post(
        "/auth/register",
        json={
            "unique_id": "another_id",
            "email": test_user_a.email,
            "password": "StrongPassword123!",
        },
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()


def test_login_success_with_email(client, test_user_a):
    response = client.post(
        "/auth/login",
        json={
            "email_or_unique_id": test_user_a.email,
            "password": "Password123!",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["unique_id"] == test_user_a.unique_id


def test_login_success_with_unique_id(client, test_user_a):
    response = client.post(
        "/auth/login",
        json={
            "email_or_unique_id": test_user_a.unique_id,
            "password": "Password123!",
        },
    )
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password(client, test_user_a):
    response = client.post(
        "/auth/login",
        json={
            "email_or_unique_id": test_user_a.email,
            "password": "WrongPassword999!",
        },
    )
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


def test_protected_route_unauthorized(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_protected_route_authorized(client, auth_headers_a, test_user_a):
    response = client.get("/auth/me", headers=auth_headers_a)
    assert response.status_code == 200
    data = response.json()
    assert data["unique_id"] == test_user_a.unique_id
    assert data["email"] == test_user_a.email
