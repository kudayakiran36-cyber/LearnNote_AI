import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.api.deps import get_db
from app.core.database import Base
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.user import User

# In-memory SQLite database isolated for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create fresh tables in in-memory database for each test function."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_a(db_session):
    """Create test User A."""
    user = User(
        unique_id="user_alpha",
        email="alpha@test.com",
        password_hash=hash_password("Password123!"),
        is_demo=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers_a(test_user_a):
    token = create_access_token(
        subject=str(test_user_a.id),
        extra_claims={"email": test_user_a.email, "unique_id": test_user_a.unique_id},
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_user_b(db_session):
    """Create test User B."""
    user = User(
        unique_id="user_beta",
        email="beta@test.com",
        password_hash=hash_password("Password123!"),
        is_demo=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers_b(test_user_b):
    token = create_access_token(
        subject=str(test_user_b.id),
        extra_claims={"email": test_user_b.email, "unique_id": test_user_b.unique_id},
    )
    return {"Authorization": f"Bearer {token}"}
