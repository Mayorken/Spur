import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.intents import router as intents_router
from app.api.matches import router as matches_router
from app.api.premium import router as premium_router
from app.api.ratings import router as ratings_router
from app.api.safety import router as safety_router
from app.api.users import router as users_router
from app.api.waitlist import router as waitlist_router
from app.api.wingman import router as wingman_router
from app.api.vip_analytics import router as vip_analytics_router
from app.core.config import settings
from app.websockets.matching import websocket_endpoint

logger = logging.getLogger(__name__)


async def _cleanup_loop() -> None:
    """Background task: clean expired intents, send VIP reminders, delete chat messages."""
    from sqlalchemy import and_, delete, update
    from app.core.database import async_session_factory
    from app.models.intent import Intent
    from app.models.match import ChatMessage
    from app.services.vip_reminder_scheduler import VIPReminderScheduler

    while True:
        await asyncio.sleep(settings.INTENT_CLEANUP_INTERVAL_MINUTES * 60)
        try:
            async with async_session_factory() as db:
                now = datetime.now(timezone.utc)

                # Expire intents
                intent_stmt = (
                    update(Intent)
                    .where(and_(Intent.is_active == True, Intent.expires_at <= now))  # noqa: E712
                    .values(is_active=False)
                )
                ir = await db.execute(intent_stmt)

                # Delete expired chat messages
                msg_stmt = delete(ChatMessage).where(
                    and_(ChatMessage.expires_at != None, ChatMessage.expires_at <= now)  # noqa: E711
                )
                mr = await db.execute(msg_stmt)

                await db.commit()
                if ir.rowcount or mr.rowcount:
                    logger.info("Cleanup: %d intent(s) expired, %d message(s) deleted", ir.rowcount, mr.rowcount)

                # Send VIP reminder emails
                reminder_count = await VIPReminderScheduler.send_pending_reminders(db)
                if reminder_count > 0:
                    logger.info("VIP Reminders: %d email(s) sent", reminder_count)

        except Exception as exc:
            logger.error("Cleanup error: %s", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.database import create_tables
    await create_tables()

    # Ensure upload directory exists and is served
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

    # Start background cleanup
    cleanup_task = asyncio.create_task(_cleanup_loop())

    yield

    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.APP_NAME,
    description="Real-time adult connection platform — Desire. Consent. Connection. Instantly.",
    version="0.1.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — read allowed origins from env
_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded files (create dir eagerly so mount doesn't fail at import)
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# API routes
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(users_router, prefix=settings.API_PREFIX)
app.include_router(intents_router, prefix=settings.API_PREFIX)
app.include_router(matches_router, prefix=settings.API_PREFIX)
app.include_router(safety_router, prefix=settings.API_PREFIX)
app.include_router(ratings_router, prefix=settings.API_PREFIX)
app.include_router(premium_router, prefix=settings.API_PREFIX)
app.include_router(admin_router, prefix=settings.API_PREFIX)
app.include_router(waitlist_router, prefix=settings.API_PREFIX)
app.include_router(wingman_router, prefix=settings.API_PREFIX)
app.include_router(vip_analytics_router, prefix=settings.API_PREFIX)

# WebSocket
app.websocket("/ws")(websocket_endpoint)


@app.get("/")
async def root():
    return {"app": settings.APP_NAME, "version": "0.1.0", "tagline": "Desire. Consent. Connection. Instantly."}


@app.get("/health")
async def health():
    return {"status": "healthy"}
