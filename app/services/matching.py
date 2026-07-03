import uuid
from datetime import datetime, timedelta, timezone
from math import asin, cos, radians, sin, sqrt

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.intent import Intent
from app.models.match import Match
from app.models.user import User
from app.schemas.intent import NearbyIntentUser
from app.services.lgbtq_matching import MatchCompatibility


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
    my_group_size: int = 1,
    my_max_capacity: int = 1,
) -> list[NearbyIntentUser]:
    """Find active intents matching the type within radius, excluding the user.

    Stealth Mode Logic:
    - Exclude users where is_stealth == True
    - UNLESS they have a targeted intent directly at the requesting user
    - This keeps stealth users hidden from general discovery
    - But visible to their targets
    """
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(minutes=settings.INTENT_ACTIVE_MINUTES)

    # Find stealth users who targeted the requesting user
    stealth_targets_stmt = (
        select(Intent.user_id)
        .where(
            and_(
                Intent.is_active == True,  # noqa: E712
                Intent.activated_at >= cutoff,
                Intent.target_user_id == user_id,  # Targeted at us
                Intent.intent_type == intent_type,
            )
        )
    )
    stealth_targets = await db.execute(stealth_targets_stmt)
    stealth_target_ids = {row[0] for row in stealth_targets.all()}

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
                # Stealth filter: exclude stealth users UNLESS they targeted us
                or_(
                    User.is_stealth == False,  # noqa: E712
                    Intent.user_id.in_(stealth_target_ids),  # Stealth user targeted us
                ),
            )
        )
    )

    result = await db.execute(stmt)
    rows = result.all()

    def groups_compatible(size_a: int, cap_a: int, size_b: int, cap_b: int) -> bool:
        """Check if two groups are compatible for matching."""
        # Solo must fit in other's max capacity
        if size_a == 1 and size_b > 1:
            return size_b <= cap_a
        if size_b == 1 and size_a > 1:
            return size_a <= cap_b
        # Groups must have size difference <= 1
        if size_a > 1 and size_b > 1:
            return abs(size_a - size_b) <= 1
        # Solo to solo always compatible
        return True

    # Get current user for LGBTQ+ compatibility checking
    current_user_stmt = select(User).where(User.id == user_id)
    current_user_result = await db.execute(current_user_stmt)
    current_user = current_user_result.scalar_one_or_none()

    nearby_users: list[NearbyIntentUser] = []
    for intent, user in rows:
        distance = haversine_km(latitude, longitude, intent.latitude, intent.longitude)
        if distance <= radius_km:
            # Check group compatibility
            if not groups_compatible(
                my_group_size,
                my_max_capacity,
                intent.group_size,
                intent.max_group_capacity,
            ):
                continue

            # Check LGBTQ+ compatibility
            if current_user and (current_user.sexual_orientation or current_user.gender_identity):
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
                        "sexual_orientation": user.sexual_orientation,
                        "gender_identity": user.gender_identity,
                        "male_role": user.male_role,
                        "female_role": user.female_role,
                        "seeking_roles": user.seeking_roles,
                        "ghost_mode": user.ghost_mode,
                        "is_banned": user.is_banned,
                    },
                )
                if not compatibility_check.orientations_match():
                    continue

            nearby_users.append(
                NearbyIntentUser(
                    user_id=user.id,
                    display_name=user.display_name,
                    age=user.age,
                    avatar_url=user.avatar_url,
                    intent_type=intent.intent_type,
                    distance_km=round(distance, 2),
                    is_verified=user.is_verified,
                    group_size=intent.group_size,
                    max_group_capacity=intent.max_group_capacity,
                    sexual_orientation=user.sexual_orientation,
                    gender_identity=user.gender_identity,
                    male_role=user.male_role,
                    female_role=user.female_role,
                    seeking_roles=user.seeking_roles,
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
