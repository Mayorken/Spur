from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.intents import router as intents_router
from app.api.matches import router as matches_router
from app.api.safety import router as safety_router
from app.api.users import router as users_router
from app.core.config import settings
from app.websockets.matching import websocket_endpoint


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown


app = FastAPI(
    title=settings.APP_NAME,
    description="Real-time adult connection platform — Desire. Consent. Connection. Instantly.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(users_router, prefix=settings.API_PREFIX)
app.include_router(intents_router, prefix=settings.API_PREFIX)
app.include_router(matches_router, prefix=settings.API_PREFIX)
app.include_router(safety_router, prefix=settings.API_PREFIX)

# WebSocket
app.websocket("/ws")(websocket_endpoint)


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": "0.1.0",
        "tagline": "Desire. Consent. Connection. Instantly.",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
