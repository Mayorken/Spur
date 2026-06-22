import uuid
from datetime import datetime

from pydantic import BaseModel


class ReportCreate(BaseModel):
    reported_user_id: uuid.UUID
    reason: str  # harassment, fake, spam, unsafe
    description: str | None = None


class ReportResponse(BaseModel):
    id: uuid.UUID
    reporter_id: uuid.UUID
    reported_user_id: uuid.UUID
    reason: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class BlockCreate(BaseModel):
    blocked_id: uuid.UUID


class BlockResponse(BaseModel):
    id: uuid.UUID
    blocker_id: uuid.UUID
    blocked_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class PanicResponse(BaseModel):
    success: bool
    message: str
