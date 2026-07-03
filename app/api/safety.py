import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.match import Match
from app.models.safety import Block, Report
from app.models.user import User
from app.schemas.safety import (
    BlockCreate,
    BlockResponse,
    PanicResponse,
    ReportCreate,
    ReportResponse,
)

router = APIRouter(prefix="/safety", tags=["safety"])

VALID_REASONS = ["harassment", "fake", "spam", "unsafe", "underage", "other"]


@router.post("/report", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def report_user(
    data: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Report a user for safety concerns."""
    if data.reason not in VALID_REASONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid reason. Must be one of: {VALID_REASONS}",
        )

    # Can't report yourself
    if data.reported_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot report yourself")

    report = Report(
        reporter_id=current_user.id,
        reported_user_id=data.reported_user_id,
        reason=data.reason,
        description=data.description,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    return ReportResponse.model_validate(report)


@router.post("/block", response_model=BlockResponse, status_code=status.HTTP_201_CREATED)
async def block_user(
    data: BlockCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Block a user — they won't appear in your feed or be able to message you."""
    if data.blocked_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")

    # Check if already blocked
    stmt = select(Block).where(
        and_(Block.blocker_id == current_user.id, Block.blocked_id == data.blocked_id)
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User already blocked")

    block = Block(blocker_id=current_user.id, blocked_id=data.blocked_id)
    db.add(block)

    # Also deactivate any matches between them
    match_stmt = select(Match).where(
        and_(
            Match.is_active == True,  # noqa: E712
            (
                (Match.user_a_id == current_user.id) & (Match.user_b_id == data.blocked_id)
                | (Match.user_a_id == data.blocked_id) & (Match.user_b_id == current_user.id)
            ),
        )
    )
    match_result = await db.execute(match_stmt)
    for match in match_result.scalars().all():
        match.is_active = False

    await db.commit()
    await db.refresh(block)

    return BlockResponse.model_validate(block)


@router.post("/unblock/{user_id}")
async def unblock_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Unblock a previously blocked user."""
    stmt = select(Block).where(
        and_(Block.blocker_id == current_user.id, Block.blocked_id == user_id)
    )
    result = await db.execute(stmt)
    block = result.scalar_one_or_none()

    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    await db.delete(block)
    await db.commit()
    return {"message": "User unblocked"}


@router.post("/panic", response_model=PanicResponse)
async def panic_button(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Panic button — one-tap exit.
    Deactivates all intents, hides the user from discovery,
    and optionally notifies Digital Wingman.
    """
    from app.models.intent import Intent

    # Deactivate all intents
    stmt = select(Intent).where(
        and_(Intent.user_id == current_user.id, Intent.is_active == True)  # noqa: E712
    )
    result = await db.execute(stmt)
    for intent in result.scalars().all():
        intent.is_active = False

    # Enable ghost mode
    current_user.ghost_mode = True

    # Trigger Digital Wingman webhook if enabled
    if current_user.wingman_enabled and current_user.wingman_webhook_url:
        import asyncio
        import httpx

        async def send_wingman_alert():
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(
                        current_user.wingman_webhook_url,
                        json={
                            "alert_type": "panic_activated",
                            "user_name": current_user.display_name,
                            "user_email": current_user.email,
                            "latitude": current_user.latitude,
                            "longitude": current_user.longitude,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "message": f"{current_user.display_name} activated panic button",
                        },
                        timeout=5,
                    )
            except Exception:
                pass  # Silently fail if webhook unreachable

        asyncio.create_task(send_wingman_alert())

    await db.commit()

    return PanicResponse(
        success=True,
        message="You are now safe. All intents deactivated, ghost mode enabled. "
        "Your trusted contact has been notified.",
    )


@router.post("/wingman/alert/{match_id}")
async def trigger_wingman_alert(
    match_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger Digital Wingman alert when a match is created."""
    if not current_user.wingman_enabled or not current_user.wingman_webhook_url:
        raise HTTPException(status_code=400, detail="Digital Wingman not configured")

    # Get match details
    stmt = select(Match).where(Match.id == match_id)
    result = await db.execute(stmt)
    match = result.scalar_one_or_none()

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Get other user details
    other_user_id = match.user_b_id if match.user_a_id == current_user.id else match.user_a_id
    stmt = select(User).where(User.id == other_user_id)
    result = await db.execute(stmt)
    other_user = result.scalar_one_or_none()

    # Send webhook
    import asyncio
    import httpx
    from datetime import timezone

    async def send_wingman_notification():
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    current_user.wingman_webhook_url,
                    json={
                        "alert_type": "match_created",
                        "user_name": current_user.display_name,
                        "match_with": other_user.display_name if other_user else "Unknown",
                        "latitude": current_user.latitude,
                        "longitude": current_user.longitude,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "message": f"{current_user.display_name} matched with {other_user.display_name if other_user else 'someone'}",
                    },
                    timeout=5,
                )
        except Exception:
            pass

    asyncio.create_task(send_wingman_notification())

    return {"message": "Wingman alert sent", "match_id": str(match_id)}
