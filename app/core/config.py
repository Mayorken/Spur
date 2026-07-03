import warnings

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Spur"
    DEBUG: bool = False
    API_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://spur:spur@localhost:5432/spur"

    # Redis
    REDIS_URL: str = ""  # empty = disabled; set to redis://... to enable WS scaling

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-a-real-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS — comma-separated list of allowed origins; "*" allows all (dev only)
    CORS_ORIGINS: str = "*"

    # Location
    DEFAULT_RADIUS_KM: float = 0.5
    MAX_RADIUS_KM: float = 5.0

    # Chat
    CHAT_AUTO_CLEAR_HOURS: int = 24

    # Matching
    INTENT_ACTIVE_MINUTES: int = 60  # how long an intent stays "live"
    INTENT_CLEANUP_INTERVAL_MINUTES: int = 15  # background cleanup cadence

    # Email (SMTP)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@spur.app"
    EMAIL_FROM_NAME: str = "Spur"

    # File uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 5

    # Rate limiting
    RATE_LIMIT_AUTH: str = "10/minute"

    # Admin
    ADMIN_SECRET_KEY: str = "admin-change-me"  # set in .env for production

    # Stripe (set in .env for payments)
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_PRODUCT_ID: str = ""  # Product ID for VIP
    STRIPE_PRICE_ID: str = ""  # Price ID for $10/month
    STRIPE_PRICE_PREMIUM_USD: int = 1000  # cents — $10.00
    FRONTEND_URL: str = "http://localhost:5173"
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = "noreply@spur.app"

    model_config = {"env_file": ".env", "extra": "ignore"}

    def validate_secrets(self) -> None:
        insecure = {"change-me-in-production-use-a-real-secret", "dev-secret-key-change-in-production"}
        if self.SECRET_KEY in insecure and not self.DEBUG:
            warnings.warn("SECRET_KEY is set to a dev default — change it before going to production!", stacklevel=2)


settings = Settings()
settings.validate_secrets()
