import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.match import Match
from app.models.user import User
from app.schemas.match import (
    ChatMessageCreate,
    ChatMessageResponse,
    ConversationResponse,
    MatchWithUser,
)
from app.services.chat import get_conversations, get_messages, send_message
from app.services.matching import get_user_matches

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("/", response_model=list[MatchWithUser])
async def list_matches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all active matches for the current user."""
    matches = await get_user_matches(db, current_user.id)

    result = []
    for match in matches:
        other_id = match.user_b_id if match.user_a_id == current_user.id else match.user_a_id
        stmt = select(User).where(User.id == other_id)
        user_result = await db.execute(stmt)
        other_user = user_result.scalar_one_or_none()
        if other_user:
            result.append(
                MatchWithUser(
                    id=match.id,
                    matched_user_id=other_user.id,
                    matched_user_name=other_user.display_name,
                    matched_user_avatar=other_user.avatar_url,
                    matched_user_verified=other_user.is_verified,
                    intent_type=match.intent_type,
                    created_at=match.created_at,
                )
            )

    return result


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all conversations for the current user."""
    return await get_conversations(db, current_user.id)


@router.get("/{match_id}/messages", response_model=list[ChatMessageResponse])
async def get_match_messages(
    match_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get messages for a specific match."""
    # Verify user is part of this match
    stmt = select(Match).where(
        and_(
            Match.id == match_id,
            (Match.user_a_id == current_user.id) | (Match.user_b_id == current_user.id),
        )
    )
    result = await db.execute(stmt)
    match = result.scalar_one_or_none()

    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    return await get_messages(db, match_id)


@router.post("/{match_id}/messages", response_model=ChatMessageResponse)
async def send_match_message(
    match_id: uuid.UUID,
    data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message in a match conversation."""
    # Verify user is part of this match
    stmt = select(Match).where(
        and_(
            Match.id == match_id,
            Match.is_active == True,  # noqa: E712
            (Match.user_a_id == current_user.id) | (Match.user_b_id == current_user.id),
        )
    )
    result = await db.execute(stmt)
    match = result.scalar_one_or_none()

    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    message = await send_message(db, match_id, current_user.id, data.content)
    return ChatMessageResponse.model_validate(message)
