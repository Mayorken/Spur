import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.match import Match
from app.models.rating import ExperienceRating, ExperienceTagSummary
from app.models.user import User
from app.schemas.rating import (
    AVAILABLE_TAGS,
    ExperienceTagResponse,
    RatingCreate,
    RatingResponse,
    UserExperienceResponse,
    get_rank,
)

router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.post("/", response_model=list[RatingResponse])
async def rate_user(
    data: RatingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.rated_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot rate yourself")

    # Verify there's an active or past match between the users
    match_query = select(Match).where(
        (
            (Match.user_a_id == current_user.id)
            & (Match.user_b_id == data.rated_user_id)
        )
        | (
            (Match.user_a_id == data.rated_user_id)
            & (Match.user_b_id == current_user.id)
        )
    )
    result = await db.execute(match_query)
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=403,
            detail="You can only rate users you've matched with",
        )

    # Validate tags
    for tag in data.tags:
        if tag not in AVAILABLE_TAGS:
            raise HTTPException(
                status_code=400, detail=f"Invalid tag: {tag}"
            )

    ratings = []
    for tag in data.tags:
        # Check if already rated with this tag
        existing = await db.execute(
            select(ExperienceRating).where(
                and_(
                    ExperienceRating.rater_id == current_user.id,
                    ExperienceRating.rated_id == data.rated_user_id,
                    ExperienceRating.tag == tag,
                )
            )
        )
        if existing.scalar_one_or_none():
            continue

        rating = ExperienceRating(
            rater_id=current_user.id,
            rated_id=data.rated_user_id,
            tag=tag,
        )
        db.add(rating)
        ratings.append(rating)

        # Update or create summary
        summary_result = await db.execute(
            select(ExperienceTagSummary).where(
                and_(
                    ExperienceTagSummary.user_id == data.rated_user_id,
                    ExperienceTagSummary.tag == tag,
                )
            )
        )
        summary = summary_result.scalar_one_or_none()
        tag_info = AVAILABLE_TAGS[tag]

        if summary:
            summary.count = ExperienceTagSummary.count + 1
        else:
            summary = ExperienceTagSummary(
                user_id=data.rated_user_id,
                tag=tag,
                label=tag_info["label"],
                emoji=tag_info["emoji"],
                count=1,
            )
            db.add(summary)

    await db.commit()
    return ratings


@router.get("/user/{user_id}", response_model=UserExperienceResponse)
async def get_user_experience(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ExperienceTagSummary)
        .where(ExperienceTagSummary.user_id == user_id)
        .order_by(ExperienceTagSummary.count.desc())
    )
    summaries = result.scalars().all()

    tags = [
        ExperienceTagResponse(
            tag=s.tag,
            label=s.label,
            emoji=s.emoji,
            count=s.count,
            rank=get_rank(s.count),
        )
        for s in summaries
    ]

    return UserExperienceResponse(user_id=user_id, tags=tags)


@router.get("/tags", response_model=dict)
async def get_available_tags():
    return AVAILABLE_TAGS
