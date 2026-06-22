from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.intent import Intent
from app.models.user import User
from app.schemas.intent import IntentCreate, IntentResponse, NearbyIntentUser
from app.services.matching import create_match, find_nearby_intents

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

    # Create new intent
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.INTENT_ACTIVE_MINUTES)
    intent = Intent(
        user_id=current_user.id,
        intent_type=data.intent_type,
        latitude=data.latitude,
        longitude=data.longitude,
        radius_km=data.radius_km,
        preferred_vibe=data.preferred_vibe,
        time_window=data.time_window,
        expires_at=expires_at,
    )
    db.add(intent)

    # Update user location
    current_user.latitude = data.latitude
    current_user.longitude = data.longitude

    await db.commit()
    await db.refresh(intent)

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
    )

    return nearby


@router.post("/match/{target_user_id}")
async def match_with_user(
    target_user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a mutual match when both users have the same active intent nearby."""
    import uuid as uuid_mod

    target_id = uuid_mod.UUID(target_user_id)

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

    match = await create_match(db, current_user.id, target_id, my_intent.intent_type)
    return {"match_id": str(match.id), "message": "It's a Spur!"}


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
