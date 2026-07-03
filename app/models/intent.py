import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class IntentType:
    INTIMACY = "open_to_intimacy"
    HOOKUP = "looking_to_hook_up"
    CASUAL = "casual_connection"
    ROMANTIC = "romantic"


class Intent(Base):
    __tablename__ = "intents"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"), index=True)
    intent_type: Mapped[str] = mapped_column(String(50), index=True)

    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    radius_km: Mapped[float] = mapped_column(Float, default=0.5)

    preferred_vibe: Mapped[str | None] = mapped_column(String(50), nullable=True)
    time_window: Mapped[str | None] = mapped_column(String(50), nullable=True)
    vibe_clip_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Social Group Spurs (Squad matching)
    group_size: Mapped[int] = mapped_column(default=1)
    max_group_capacity: Mapped[int] = mapped_column(default=1)

    # Stealth Mode: targeted intent (only visible to target_user_id)
    target_user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)

    is_active: Mapped[bool] = mapped_column(default=True)
    activated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
