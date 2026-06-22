import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.match import ChatMessage, Match
from app.models.user import User
from app.schemas.match import ChatMessageResponse, ConversationResponse


async def send_message(
    db: AsyncSession,
    match_id: uuid.UUID,
    sender_id: uuid.UUID,
    content: str,
) -> ChatMessage:
    """Send a chat message within a match."""
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.CHAT_AUTO_CLEAR_HOURS)

    message = ChatMessage(
        match_id=match_id,
        sender_id=sender_id,
        content=content,
        expires_at=expires_at,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


async def get_messages(
    db: AsyncSession,
    match_id: uuid.UUID,
    limit: int = 50,
    before: datetime | None = None,
) -> list[ChatMessageResponse]:
    """Get messages for a match (only non-expired)."""
    now = datetime.now(timezone.utc)
    conditions = [
        ChatMessage.match_id == match_id,
        (ChatMessage.expires_at > now) | (ChatMessage.expires_at == None),  # noqa: E711
    ]
    if before:
        conditions.append(ChatMessage.created_at < before)

    stmt = (
        select(ChatMessage)
        .where(and_(*conditions))
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    messages = list(result.scalars().all())
    messages.reverse()  # Return in chronological order

    return [ChatMessageResponse.model_validate(m) for m in messages]


async def get_conversations(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> list[ConversationResponse]:
    """Get all conversations (matches with latest message) for a user."""
    # Get all active matches
    stmt = select(Match).where(
        and_(
            Match.is_active == True,  # noqa: E712
            (Match.user_a_id == user_id) | (Match.user_b_id == user_id),
        )
    )
    result = await db.execute(stmt)
    matches = list(result.scalars().all())

    conversations: list[ConversationResponse] = []
    for match in matches:
        other_user_id = match.user_b_id if match.user_a_id == user_id else match.user_a_id

        # Get other user info
        user_stmt = select(User).where(User.id == other_user_id)
        user_result = await db.execute(user_stmt)
        other_user = user_result.scalar_one_or_none()
        if not other_user:
            continue

        # Get last message
        msg_stmt = (
            select(ChatMessage)
            .where(ChatMessage.match_id == match.id)
            .order_by(ChatMessage.created_at.desc())
            .limit(1)
        )
        msg_result = await db.execute(msg_stmt)
        last_msg = msg_result.scalar_one_or_none()

        # Count unread
        unread_stmt = select(func.count()).where(
            and_(
                ChatMessage.match_id == match.id,
                ChatMessage.sender_id != user_id,
                ChatMessage.is_read == False,  # noqa: E712
            )
        )
        unread_result = await db.execute(unread_stmt)
        unread_count = unread_result.scalar() or 0

        conversations.append(
            ConversationResponse(
                match_id=match.id,
                other_user_id=other_user.id,
                other_user_name=other_user.display_name,
                other_user_avatar=other_user.avatar_url,
                last_message=last_msg.content if last_msg else None,
                last_message_time=last_msg.created_at if last_msg else None,
                unread_count=unread_count,
                is_online=False,  # Would be tracked via Redis in production
            )
        )

    # Sort by latest message
    conversations.sort(key=lambda c: c.last_message_time or datetime.min, reverse=True)
    return conversations


async def clear_expired_messages(db: AsyncSession) -> int:
    """Delete messages that have passed their expiry time."""
    now = datetime.now(timezone.utc)
    stmt = select(ChatMessage).where(
        and_(
            ChatMessage.expires_at != None,  # noqa: E711
            ChatMessage.expires_at <= now,
        )
    )
    result = await db.execute(stmt)
    expired = list(result.scalars().all())

    for msg in expired:
        await db.delete(msg)

    await db.commit()
    return len(expired)
