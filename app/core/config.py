from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Spur"
    DEBUG: bool = False
    API_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://spur:spur@localhost:5432/spur"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-a-real-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Location
    DEFAULT_RADIUS_KM: float = 0.5
    MAX_RADIUS_KM: float = 5.0

    # Chat
    CHAT_AUTO_CLEAR_HOURS: int = 24

    # Matching
    INTENT_ACTIVE_MINUTES: int = 60  # how long an intent stays "live"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
