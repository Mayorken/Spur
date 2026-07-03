import uuid
from datetime import datetime

from pydantic import BaseModel


class IntentCreate(BaseModel):
    intent_type: str
    latitude: float
    longitude: float
    radius_km: float = 0.5
    preferred_vibe: str | None = None
    time_window: str | None = None
    vibe_clip_url: str | None = None
    group_size: int = 1
    max_group_capacity: int = 1
    target_user_id: str | None = None  # For stealth mode: only visible to this user


class IntentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    intent_type: str
    latitude: float
    longitude: float
    radius_km: float
    preferred_vibe: str | None
    time_window: str | None
    vibe_clip_url: str | None
    group_size: int
    max_group_capacity: int
    target_user_id: str | None  # Stealth mode
    is_active: bool
    activated_at: datetime
    expires_at: datetime | None

    model_config = {"from_attributes": True}


class IntentDeactivate(BaseModel):
    intent_id: uuid.UUID


class NearbyIntentUser(BaseModel):
    user_id: uuid.UUID
    display_name: str
    age: int | None
    avatar_url: str | None
    intent_type: str
    distance_km: float
    is_verified: bool
    group_size: int
    max_group_capacity: int
    sexual_orientation: str | None
    gender_identity: str | None
    male_role: str | None
    female_role: str | None
    seeking_roles: list[str] | None
