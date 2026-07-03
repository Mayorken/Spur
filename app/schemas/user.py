import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: str
    age: int | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    age: int | None = None
    ghost_mode: bool | None = None
    blurred_photos: bool | None = None
    location_radius_km: float | None = None
    mode: str | None = None
    is_stealth: bool | None = None
    sexual_orientation: str | None = None
    gender_identity: str | None = None
    male_role: str | None = None
    female_role: str | None = None
    seeking_roles: list[str] | None = None
    wingman_webhook_url: str | None = None
    wingman_enabled: bool | None = None


class UserLocationUpdate(BaseModel):
    latitude: float
    longitude: float


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    display_name: str
    age: int | None
    bio: str | None
    avatar_url: str | None
    is_verified: bool
    is_id_verified: bool
    ghost_mode: bool
    is_stealth: bool
    trust_score: float
    location_radius_km: float
    mode: str | None
    sexual_orientation: str | None
    gender_identity: str | None
    male_role: str | None
    female_role: str | None
    seeking_roles: list[str] | None
    wingman_enabled: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserPublicResponse(BaseModel):
    id: uuid.UUID
    display_name: str
    age: int | None
    bio: str | None
    avatar_url: str | None
    is_verified: bool
    distance_km: float | None = None
    sexual_orientation: str | None
    gender_identity: str | None
    male_role: str | None
    female_role: str | None
    seeking_roles: list[str] | None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
