from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_email_token,
    create_password_reset_token,
    decode_email_token,
    decode_password_reset_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.user import TokenResponse, UserCreate, UserLogin, UserResponse
from app.services.email import send_password_reset_email, send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def signup(data: UserCreate, request: Request, db: AsyncSession = Depends(get_db)):
    """Register a new user and send a verification email."""
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        display_name=data.display_name,
        age=data.age,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Send verification email (fire-and-forget — don't block signup on email failure)
    base_url = str(request.base_url).rstrip("/")
    verify_token = create_email_token(str(user.id))
    send_verification_email(user.email, user.display_name, verify_token, base_url)

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(data: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return token."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active or user.is_banned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated or banned")

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    """Confirm email address via the link sent at signup."""
    user_id = decode_email_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification link")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.is_verified:
        return {"message": "Email already verified"}

    user.is_verified = True
    await db.commit()
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification(request: Request, data: dict, db: AsyncSession = Depends(get_db)):
    email = data.get("email", "")
    """Resend verification email."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or user.is_verified:
        # Don't leak whether email exists
        return {"message": "If that email is registered and unverified, a new link has been sent"}

    base_url = str(request.base_url).rstrip("/")
    verify_token = create_email_token(str(user.id))
    send_verification_email(user.email, user.display_name, verify_token, base_url)
    return {"message": "If that email is registered and unverified, a new link has been sent"}


@router.post("/forgot-password")
async def forgot_password(data: dict, request: Request, db: AsyncSession = Depends(get_db)):
    """Send a password-reset link to the given email."""
    email = data.get("email", "")
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user and user.is_active and not user.is_banned:
        token = create_password_reset_token(str(user.id))
        send_password_reset_email(user.email, user.display_name, token, settings.FRONTEND_URL)
    return {"message": "If that email is registered, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(data: dict, db: AsyncSession = Depends(get_db)):
    """Set a new password using the reset token."""
    token = data.get("token", "")
    new_password = data.get("new_password", "")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    user_id = decode_password_reset_token(token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = hash_password(new_password)
    await db.commit()
    return {"message": "Password updated successfully"}
