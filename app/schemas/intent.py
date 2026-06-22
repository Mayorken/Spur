import uuid
from datetime import datetime

from pydantic import BaseModel


class IntentCreate(BaseModel):
    intent_type: str  # open_to_intimacy, looking_to_hook_up, casual_connection, romantic
    latitude: float
    longitude: float
    radius_km: float = 0.5
    preferred_vibe: str | None = None  # casual, adventurous, low-key
    time_window: str | None = None  # now, tonight, this_week


class IntentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    intent_type: str
    latitude: float
    longitude: float
    radius_km: float
    preferred_vibe: str | None
    time_window: str | None
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
