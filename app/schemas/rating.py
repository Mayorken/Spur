import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class RatingCreate(BaseModel):
    rated_user_id: uuid.UUID
    tags: list[str] = Field(..., min_length=1, max_length=3)


class ExperienceTagResponse(BaseModel):
    tag: str
    label: str
    emoji: str
    count: int
    rank: str

    model_config = {"from_attributes": True}


class UserExperienceResponse(BaseModel):
    user_id: uuid.UUID
    tags: list[ExperienceTagResponse]


class RatingResponse(BaseModel):
    id: uuid.UUID
    rater_id: uuid.UUID
    rated_id: uuid.UUID
    tag: str
    created_at: datetime

    model_config = {"from_attributes": True}


AVAILABLE_TAGS = {
    "great_conversationalist": {"label": "Great Conversationalist", "emoji": "💬"},
    "head_master": {"label": "Head Master", "emoji": "👑"},
    "skilled_lover": {"label": "Skilled Lover", "emoji": "🔥"},
    "respectful": {"label": "Respectful", "emoji": "🤝"},
    "fun_energy": {"label": "Fun Energy", "emoji": "⚡"},
    "good_kisser": {"label": "Good Kisser", "emoji": "💋"},
    "generous": {"label": "Generous", "emoji": "💎"},
    "adventurous": {"label": "Adventurous", "emoji": "🌶️"},
    "clean_hygienic": {"label": "Clean & Hygienic", "emoji": "✨"},
    "knows_boundaries": {"label": "Knows Boundaries", "emoji": "🛡️"},
    "stamina_king": {"label": "Stamina King", "emoji": "💪"},
    "romantic": {"label": "Romantic", "emoji": "🌹"},
}


def get_rank(count: int) -> str:
    if count >= 30:
        return "diamond"
    if count >= 15:
        return "gold"
    if count >= 5:
        return "silver"
    return "bronze"
