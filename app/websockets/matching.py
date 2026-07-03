"""
WebSocket endpoint for real-time matching and chat.

Connection manager supports two modes:
  - In-memory (default / local dev): all users must be on the same process.
  - Redis pub/sub (production): set REDIS_URL in env to fan out across workers.
"""
import json
import logging
import uuid
from datetime import datetime, timezone

from fastapi import WebSocket, WebSocketDisconnect

from app.core.config import settings
from app.core.security import decode_access_token

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Redis pub/sub helper (only imported when REDIS_URL is set)
# ---------------------------------------------------------------------------

_redis_available = False
_redis_client = None

if settings.REDIS_URL:
    try:
        import redis.asyncio as aioredis  # type: ignore[import]
        _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        _redis_available = True
        logger.info("WebSocket Redis pub/sub enabled at %s", settings.REDIS_URL)
    except ImportError:
        logger.warning("redis package not installed — falling back to in-memory WebSocket manager")
    except Exception as exc:
        logger.warning("Redis connection failed (%s) — falling back to in-memory", exc)


# ---------------------------------------------------------------------------
# In-memory connection manager
# ---------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[uuid.UUID, WebSocket] = {}
        self.active_intents: dict[uuid.UUID, dict] = {}

    async def connect(self, websocket: WebSocket, user_id: uuid.UUID):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: uuid.UUID):
        self.active_connections.pop(user_id, None)
        self.active_intents.pop(user_id, None)

    async def send_personal(self, user_id: uuid.UUID, message: dict):
        ws = self.active_connections.get(user_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(user_id)

    def set_intent(self, user_id: uuid.UUID, intent_data: dict):
        self.active_intents[user_id] = {
            **intent_data,
            "activated_at": datetime.now(timezone.utc).isoformat(),
        }

    def clear_intent(self, user_id: uuid.UUID):
        self.active_intents.pop(user_id, None)

    def get_matching_users(self, user_id: uuid.UUID, intent_type: str) -> list[uuid.UUID]:
        return [
            uid for uid, intent in self.active_intents.items()
            if uid != user_id and intent.get("intent_type") == intent_type
        ]

    @property
    def online_count(self) -> int:
        return len(self.active_connections)


manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Redis fan-out helpers
# ---------------------------------------------------------------------------

_CHANNEL_PREFIX = "spur:ws:"


async def _redis_publish(user_id: uuid.UUID, message: dict) -> None:
    if _redis_client:
        try:
            await _redis_client.publish(f"{_CHANNEL_PREFIX}{user_id}", json.dumps(message))
        except Exception as exc:
            logger.error("Redis publish error: %s", exc)


async def _redis_listen(websocket: WebSocket, user_id: uuid.UUID) -> None:
    if not _redis_client:
        return
    pubsub = _redis_client.pubsub()
    await pubsub.subscribe(f"{_CHANNEL_PREFIX}{user_id}")
    try:
        async for raw in pubsub.listen():
            if raw["type"] == "message":
                data = json.loads(raw["data"])
                try:
                    await websocket.send_json(data)
                except Exception:
                    break
    except Exception:
        pass
    finally:
        await pubsub.unsubscribe(f"{_CHANNEL_PREFIX}{user_id}")
        await pubsub.aclose()


async def _send(user_id: uuid.UUID, message: dict) -> None:
    if _redis_available:
        await _redis_publish(user_id, message)
    else:
        await manager.send_personal(user_id, message)


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------

async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    user_id_str = decode_access_token(token)
    if not user_id_str:
        await websocket.close(code=4001, reason="Invalid token")
        return

    user_id = uuid.UUID(user_id_str)
    await manager.connect(websocket, user_id)

    import asyncio
    listen_task = None
    if _redis_available:
        listen_task = asyncio.create_task(_redis_listen(websocket, user_id))

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            if msg_type == "intent_activate":
                intent_data = {
                    "intent_type": message.get("intent_type"),
                    "latitude": message.get("latitude"),
                    "longitude": message.get("longitude"),
                    "radius_km": message.get("radius_km", 0.5),
                }
                manager.set_intent(user_id, intent_data)

                matching = manager.get_matching_users(user_id, intent_data["intent_type"])
                if matching:
                    await _send(user_id, {
                        "type": "nearby_update",
                        "count": len(matching),
                        "intent_type": intent_data["intent_type"],
                    })
                    for mid in matching:
                        count = len(manager.get_matching_users(mid, intent_data["intent_type"]))
                        await _send(mid, {
                            "type": "nearby_update",
                            "count": count,
                            "intent_type": intent_data["intent_type"],
                        })

            elif msg_type == "intent_deactivate":
                manager.clear_intent(user_id)

            elif msg_type == "chat_message":
                target_id = uuid.UUID(message["target_user_id"])
                await _send(target_id, {
                    "type": "chat_message",
                    "from_user_id": str(user_id),
                    "content": message.get("content", ""),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

            elif msg_type == "match_request":
                target_id = uuid.UUID(message["target_user_id"])
                await _send(target_id, {
                    "type": "match_request",
                    "from_user_id": str(user_id),
                    "intent_type": message.get("intent_type"),
                })

            elif msg_type == "ping":
                await _send(user_id, {"type": "pong"})

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.error("WebSocket error for user %s: %s", user_id, exc)
    finally:
        manager.disconnect(user_id)
        if listen_task:
            listen_task.cancel()
