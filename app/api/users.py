import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserLocationUpdate, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    current_user.last_active = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a profile photo. Accepts JPEG, PNG, or WebP up to MAX_UPLOAD_MB."""
    if file.content_type not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPEG, PNG and WebP images are accepted",
        )

    contents = await file.read()
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds {settings.MAX_UPLOAD_MB} MB limit",
        )

    # Persist to disk
    upload_dir = Path(settings.UPLOAD_DIR) / "avatars"
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = file.content_type.split("/")[-1].replace("jpeg", "jpg")
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    dest = upload_dir / filename

    with open(dest, "wb") as f:
        f.write(contents)

    # Delete previous avatar file if it was a local upload
    if current_user.avatar_url and current_user.avatar_url.startswith("/uploads/"):
        old_path = Path(current_user.avatar_url.lstrip("/"))
        if old_path.exists():
            old_path.unlink(missing_ok=True)

    current_user.avatar_url = f"/uploads/avatars/{filename}"
    current_user.last_active = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/me/location", response_model=UserResponse)
async def update_location(
    data: UserLocationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.latitude = data.latitude
    current_user.longitude = data.longitude
    current_user.last_active = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete the current user's account."""
    await db.execute(delete(User).where(User.id == current_user.id))
    await db.commit()
