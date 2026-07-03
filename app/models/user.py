import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, JSON, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(100))
    age: Mapped[int | None] = mapped_column(nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    location_radius_km: Mapped[float] = mapped_column(Float, default=0.5)

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_id_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_banned: Mapped[bool] = mapped_column(Boolean, default=False)
    trust_score: Mapped[float] = mapped_column(Float, default=50.0)

    ghost_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    blurred_photos: Mapped[bool] = mapped_column(Boolean, default=False)
    mode: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_stealth: Mapped[bool] = mapped_column(Boolean, default=False)

    # Premium/VIP
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    subscription_status: Mapped[str | None] = mapped_column(String(50), nullable=True)  # active, canceled, past_due
    subscription_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # LGBTQ+ Identity
    sexual_orientation: Mapped[str | None] = mapped_column(String(50), nullable=True)  # gay, lesbian, bi, straight, queer, asexual
    gender_identity: Mapped[str | None] = mapped_column(String(50), nullable=True)  # man, woman, non_binary, trans_man, trans_woman

    # Role preferences (for applicable orientations)
    male_role: Mapped[str | None] = mapped_column(String(50), nullable=True)  # top, bottom, versatile
    female_role: Mapped[str | None] = mapped_column(String(50), nullable=True)  # femme, butch, androgynous
    seeking_roles: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)  # JSON list of roles user is seeking

    # Digital Wingman: share location + match status with trusted contact
    wingman_webhook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    wingman_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    last_active: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
