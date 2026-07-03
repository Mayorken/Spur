from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG, connect_args=connect_args)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
# Alias used by background tasks that need to create their own sessions
async_session_factory = async_session


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:  # type: ignore[misc]
    async with async_session() as session:
        yield session


async def create_tables() -> None:
    """Create all tables (used for SQLite dev mode — production uses Alembic)."""
    from app.models import user, intent, match, rating, safety, premium  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Add columns that may be missing from older DBs (SQLite ALTER TABLE workaround)
    if settings.DATABASE_URL.startswith("sqlite"):
        await _sqlite_add_missing_columns()


async def _sqlite_add_missing_columns() -> None:
    """Idempotently add new columns to existing SQLite tables."""
    migrations = [
        ("users", "location_radius_km", "REAL DEFAULT 0.5"),
        ("users", "blurred_photos", "INTEGER DEFAULT 0"),
    ]
    async with engine.begin() as conn:
        for table, column, definition in migrations:
            try:
                await conn.execute(
                    __import__("sqlalchemy").text(
                        f"ALTER TABLE {table} ADD COLUMN {column} {definition}"
                    )
                )
            except Exception:
                pass  # Column already exists — ignore
