from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import TokenResponse, UserLogin, UserRegister, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account with unique ID, email, and password."""
    # Check if unique_id already exists
    existing_id = db.query(User).filter(User.unique_id == payload.unique_id.strip()).first()
    if existing_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The requested User ID is already taken. Please choose another.",
        )

    # Check if email already exists
    existing_email = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please log in instead.",
        )

    # Create new user
    hashed = hash_password(payload.password)
    user = User(
        unique_id=payload.unique_id.strip(),
        email=payload.email.strip().lower(),
        password_hash=hashed,
        is_demo=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate token
    token = create_access_token(
        subject=str(user.id),
        extra_claims={"email": user.email, "unique_id": user.unique_id},
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with email or unique ID and return JWT access token."""
    identifier = payload.email_or_unique_id.strip().lower()

    user = (
        db.query(User)
        .filter(
            (User.email == identifier) | (User.unique_id == payload.email_or_unique_id.strip())
        )
        .first()
    )

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/user ID or password. Please try again.",
        )

    token = create_access_token(
        subject=str(user.id),
        extra_claims={"email": user.email, "unique_id": user.unique_id},
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get profile information for the authenticated user."""
    return UserResponse.model_validate(current_user)
