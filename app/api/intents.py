from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.intent import Intent
from app.models.user import User
from app.schemas.intent import IntentCreate, IntentResponse, NearbyIntentUser
from app.services.matching import create_match, find_nearby_intents
from app.services.lgbtq_matching import MatchCompatibility
from app.services.spur_hours import spur_hours

router = APIRouter(prefix="/intents", tags=["intents"])

VALID_INTENTS = ["open_to_intimacy", "looking_to_hook_up", "casual_connection", "romantic"]


@router.post("/activate", response_model=IntentResponse, status_code=status.HTTP_201_CREATED)
async def activate_intent(
    data: IntentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Activate an intent — the core Spur mechanic."""
    if data.intent_type not in VALID_INTENTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid intent. Must be one of: {VALID_INTENTS}",
        )

    if data.radius_km > settings.MAX_RADIUS_KM:
        data.radius_km = settings.MAX_RADIUS_KM

    # Deactivate any existing active intent for this user
    stmt = select(Intent).where(
        and_(Intent.user_id == current_user.id, Intent.is_active == True)  # noqa: E712
    )
    result = await db.execute(stmt)
    for old_intent in result.scalars().all():
        old_intent.is_active = False

    # Validate group size
    group_size = data.group_size if hasattr(data, 'group_size') else 1
    max_group_capacity = data.max_group_capacity if hasattr(data, 'max_group_capacity') else group_size
    target_user_id = data.target_user_id if hasattr(data, 'target_user_id') else None

    if group_size < 1 or group_size > 10:
        raise HTTPException(status_code=400, detail="Group size must be 1-10")
    if max_group_capacity < group_size or max_group_capacity > 10:
        raise HTTPException(
            status_code=400,
            detail=f"Max capacity must be {group_size}-10"
        )

    # Validate target_user_id if provided
    if target_user_id:
        import uuid as uuid_mod
        try:
            target_uuid = uuid_mod.UUID(target_user_id)
            # Verify target user exists
            target_stmt = select(User).where(User.id == target_uuid)
            target_result = await db.execute(target_stmt)
            if not target_result.scalar_one_or_none():
                raise HTTPException(status_code=404, detail="Target user not found")
        except (ValueError, Exception):
            raise HTTPException(status_code=400, detail="Invalid target user ID")

    # Create new intent
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.INTENT_ACTIVE_MINUTES)

    # Convert target_user_id to UUID if provided
    target_uuid = None
    if target_user_id:
        import uuid as uuid_mod
        target_uuid = uuid_mod.UUID(target_user_id)

    intent = Intent(
        user_id=current_user.id,
        intent_type=data.intent_type,
        latitude=data.latitude,
        longitude=data.longitude,
        radius_km=data.radius_km,
        preferred_vibe=data.preferred_vibe,
        time_window=data.time_window,
        vibe_clip_url=data.vibe_clip_url,
        group_size=group_size,
        max_group_capacity=max_group_capacity,
        target_user_id=target_uuid,  # Stealth mode: only visible to target
        expires_at=expires_at,
    )
    db.add(intent)

    # Update user location
    current_user.latitude = data.latitude
    current_user.longitude = data.longitude

    await db.commit()
    await db.refresh(intent)

    # Cache in Redis for fast nearby queries (include group size)
    if spur_hours and spur_hours.enabled:
        try:
            import json
            redis_key = f"intent:{current_user.id}:{intent.id}"
            intent_data = {
                "user_id": str(current_user.id),
                "intent_type": intent.intent_type,
                "latitude": intent.latitude,
                "longitude": intent.longitude,
                "radius_km": intent.radius_km,
                "group_size": intent.group_size,
                "max_group_capacity": intent.max_group_capacity,
                "activated_at": intent.activated_at.isoformat(),
            }
            spur_hours.client.setex(
                redis_key,
                settings.INTENT_ACTIVE_MINUTES * 60,
                json.dumps(intent_data),
            )
        except Exception:
            pass  # Fail gracefully

    return IntentResponse.model_validate(intent)


@router.post("/deactivate")
async def deactivate_intent(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate the user's current intent."""
    stmt = select(Intent).where(
        and_(Intent.user_id == current_user.id, Intent.is_active == True)  # noqa: E712
    )
    result = await db.execute(stmt)
    intents = list(result.scalars().all())

    for intent in intents:
        intent.is_active = False

    await db.commit()
    return {"message": "Intent deactivated"}


@router.get("/nearby", response_model=list[NearbyIntentUser])
async def get_nearby(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Find nearby users with matching active intents."""
    # Get current user's active intent
    stmt = select(Intent).where(
        and_(Intent.user_id == current_user.id, Intent.is_active == True)  # noqa: E712
    )
    result = await db.execute(stmt)
    active_intent = result.scalar_one_or_none()

    if not active_intent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active intent. Activate an intent first.",
        )

    nearby = await find_nearby_intents(
        db=db,
        user_id=current_user.id,
        intent_type=active_intent.intent_type,
        latitude=active_intent.latitude,
        longitude=active_intent.longitude,
        radius_km=active_intent.radius_km,
        my_group_size=active_intent.group_size,
        my_max_capacity=active_intent.max_group_capacity,
    )

    return nearby


@router.post("/match/{target_user_id}")
async def match_with_user(
    target_user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a mutual match when both users have the same active intent nearby.

    Squad Matching Logic:
    - Intent types must match
    - Group sizes must be compatible:
      * Solo (1) only matches solo (1) OR accepts group in max_group_capacity
      * Group (2+) matches other groups of compatible size
      * Compatibility: |group_size_a - group_size_b| <= 1 (size difference <= 1)
    """
    import uuid as uuid_mod
    from app.services.vip_benefits import VIPBenefits

    target_id = uuid_mod.UUID(target_user_id)

    # Check VIP match limit
    can_match, matches_today, limit = await VIPBenefits.check_match_limit(current_user.id, db)
    if not can_match:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily match limit reached ({limit}). Upgrade to VIP for unlimited matches!",
        )

    # Verify both users have matching active intents
    stmt = select(Intent).where(
        and_(Intent.user_id == current_user.id, Intent.is_active == True)  # noqa: E712
    )
    result = await db.execute(stmt)
    my_intent = result.scalar_one_or_none()

    if not my_intent:
        raise HTTPException(status_code=400, detail="No active intent")

    stmt = select(Intent).where(
        and_(Intent.user_id == target_id, Intent.is_active == True)  # noqa: E712
    )
    result = await db.execute(stmt)
    their_intent = result.scalar_one_or_none()

    if not their_intent or their_intent.intent_type != my_intent.intent_type:
        raise HTTPException(status_code=400, detail="No matching intent found for this user")

    # Check group compatibility
    def groups_compatible(size_a: int, cap_a: int, size_b: int, cap_b: int) -> bool:
        """Check if two groups are compatible for matching."""
        # Solo must accept group in their max capacity
        if size_a == 1 and size_b > 1:
            return size_b <= cap_a
        if size_b == 1 and size_a > 1:
            return size_a <= cap_b
        # Groups must have size difference <= 1
        if size_a > 1 and size_b > 1:
            return abs(size_a - size_b) <= 1
        # Solo to solo always compatible
        return True

    if not groups_compatible(
        my_intent.group_size,
        my_intent.max_group_capacity,
        their_intent.group_size,
        their_intent.max_group_capacity,
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Group sizes incompatible: {my_intent.group_size} vs {their_intent.group_size}",
        )

    # Check LGBTQ+ compatibility
    target_user_stmt = select(User).where(User.id == target_id)
    target_user_result = await db.execute(target_user_stmt)
    target_user = target_user_result.scalar_one_or_none()

    if target_user:
        compatibility_check = MatchCompatibility(
            {
                "sexual_orientation": current_user.sexual_orientation,
                "gender_identity": current_user.gender_identity,
                "male_role": current_user.male_role,
                "female_role": current_user.female_role,
                "seeking_roles": current_user.seeking_roles,
                "ghost_mode": current_user.ghost_mode,
                "is_banned": current_user.is_banned,
            },
            {
                "sexual_orientation": target_user.sexual_orientation,
                "gender_identity": target_user.gender_identity,
                "male_role": target_user.male_role,
                "female_role": target_user.female_role,
                "seeking_roles": target_user.seeking_roles,
                "ghost_mode": target_user.ghost_mode,
                "is_banned": target_user.is_banned,
            },
        )
        if not compatibility_check.is_compatible():
            raise HTTPException(
                status_code=400,
                detail="Your preferences are not compatible for matching",
            )

    # Create match with group info
    match = await create_match(db, current_user.id, target_id, my_intent.intent_type)

    # Determine if this is a squad match
    is_squad = my_intent.group_size > 1 or their_intent.group_size > 1

    return {
        "match_id": str(match.id),
        "message": "It's a Squad Match!" if is_squad else "It's a Spur!",
        "my_group_size": my_intent.group_size,
        "their_group_size": their_intent.group_size,
        "is_squad_match": is_squad,
    }


@router.get("/active", response_model=IntentResponse | None)
async def get_active_intent(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the user's current active intent."""
    stmt = select(Intent).where(
        and_(Intent.user_id == current_user.id, Intent.is_active == True)  # noqa: E712
    )
    result = await db.execute(stmt)
    intent = result.scalar_one_or_none()

    if not intent:
        return None

    return IntentResponse.model_validate(intent)


@router.post("/vibe-clip")
async def upload_vibe_clip(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a 5-second vibe clip video for the intent."""
    import os
    from pathlib import Path

    # Validate file type
    if file.content_type not in ["video/mp4", "video/webm", "video/quicktime"]:
        raise HTTPException(status_code=400, detail="Only MP4, WebM, or MOV videos allowed")

    # Ensure upload directory exists
    upload_dir = Path(settings.UPLOAD_DIR) / "vibe_clips"
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Save file with user ID in name
    filename = f"{current_user.id}_{file.filename}"
    filepath = upload_dir / filename

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    # Return relative URL for frontend
    video_url = f"/uploads/vibe_clips/{filename}"
    return {"video_url": video_url}


@router.post("/spur-hours")
async def activate_spur_hours(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Activate 60-minute visibility boost in your geo-radius (Spur Hours)."""
    if not spur_hours:
        raise HTTPException(status_code=400, detail="Spur Hours requires Redis")

    # Get active intent
    stmt = select(Intent).where(
        and_(Intent.user_id == current_user.id, Intent.is_active == True)  # noqa: E712
    )
    result = await db.execute(stmt)
    active_intent = result.scalar_one_or_none()

    if not active_intent:
        raise HTTPException(status_code=400, detail="No active intent")

    # Activate Spur Hours
    success = await spur_hours.activate_spur_hours(
        str(current_user.id),
        active_intent.latitude,
        active_intent.longitude,
        active_intent.radius_km,
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to activate Spur Hours")

    return {
        "message": "Spur Hours activated",
        "boost_duration_minutes": 60,
        "visibility_multiplier": 3.0,
    }
