import uuid
from datetime import datetime, timedelta, timezone
from math import asin, cos, radians, sin, sqrt

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.intent import Intent
from app.models.match import Match
from app.models.user import User
from app.schemas.intent import NearbyIntentUser


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two lat/lon points in kilometers."""
    r = 6371  # Earth radius in km
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * r * asin(sqrt(a))


async def find_nearby_intents(
    db: AsyncSession,
    user_id: uuid.UUID,
    intent_type: str,
    latitude: float,
    longitude: float,
    radius_km: float,
) -> list[NearbyIntentUser]:
    """Find active intents matching the type within radius, excluding the user."""
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=settings.INTENT_ACTIVE_MINUTES)

    stmt = (
        select(Intent, User)
        .join(User, Intent.user_id == User.id)
        .where(
            and_(
                Intent.intent_type == intent_type,
                Intent.is_active == True,  # noqa: E712
                Intent.activated_at >= cutoff,
                Intent.user_id != user_id,
                User.is_active == True,  # noqa: E712
                User.is_banned == False,  # noqa: E712
                User.ghost_mode == False,  # noqa: E712
            )
        )
    )

    result = await db.execute(stmt)
    rows = result.all()

    nearby_users: list[NearbyIntentUser] = []
    for intent, user in rows:
        distance = haversine_km(latitude, longitude, intent.latitude, intent.longitude)
        if distance <= radius_km:
            nearby_users.append(
                NearbyIntentUser(
                    user_id=user.id,
                    display_name=user.display_name,
                    age=user.age,
                    avatar_url=user.avatar_url,
                    intent_type=intent.intent_type,
                    distance_km=round(distance, 2),
                    is_verified=user.is_verified,
                )
            )

    # Sort by distance
    nearby_users.sort(key=lambda u: u.distance_km)
    return nearby_users


async def create_match(
    db: AsyncSession,
    user_a_id: uuid.UUID,
    user_b_id: uuid.UUID,
    intent_type: str,
) -> Match:
    """Create a mutual match between two users."""
    # Check if match already exists
    stmt = select(Match).where(
        and_(
            Match.is_active == True,  # noqa: E712
            (
                (Match.user_a_id == user_a_id) & (Match.user_b_id == user_b_id)
                | (Match.user_a_id == user_b_id) & (Match.user_b_id == user_a_id)
            ),
        )
    )
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        return existing

    match = Match(
        user_a_id=user_a_id,
        user_b_id=user_b_id,
        intent_type=intent_type,
    )
    db.add(match)
    await db.commit()
    await db.refresh(match)
    return match


async def get_user_matches(db: AsyncSession, user_id: uuid.UUID) -> list[Match]:
    """Get all active matches for a user."""
    stmt = select(Match).where(
        and_(
            Match.is_active == True,  # noqa: E712
            (Match.user_a_id == user_id) | (Match.user_b_id == user_id),
        )
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
