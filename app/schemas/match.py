import uuid
from datetime import datetime

from pydantic import BaseModel


class MatchResponse(BaseModel):
    id: uuid.UUID
    user_a_id: uuid.UUID
    user_b_id: uuid.UUID
    intent_type: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MatchWithUser(BaseModel):
    id: uuid.UUID
    matched_user_id: uuid.UUID
    matched_user_name: str
    matched_user_avatar: str | None
    matched_user_verified: bool
    intent_type: str
    created_at: datetime


class ChatMessageCreate(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    match_id: uuid.UUID
    sender_id: uuid.UUID
    content: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    match_id: uuid.UUID
    other_user_id: uuid.UUID
    other_user_name: str
    other_user_avatar: str | None
    last_message: str | None
    last_message_time: datetime | None
    unread_count: int
    is_online: bool
