import json
import uuid
from datetime import datetime, timezone

from fastapi import WebSocket, WebSocketDisconnect

from app.core.security import decode_access_token


class ConnectionManager:
    """Manages WebSocket connections for real-time matching and chat."""

    def __init__(self):
        # user_id -> WebSocket
        self.active_connections: dict[uuid.UUID, WebSocket] = {}
        # user_id -> {intent_type, lat, lon, radius}
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
            await ws.send_json(message)

    async def broadcast_to_nearby(
        self, sender_id: uuid.UUID, message: dict, user_ids: list[uuid.UUID]
    ):
        """Send a message to specific nearby users."""
        for uid in user_ids:
            if uid != sender_id and uid in self.active_connections:
                await self.active_connections[uid].send_json(message)

    def set_intent(self, user_id: uuid.UUID, intent_data: dict):
        self.active_intents[user_id] = {
            **intent_data,
            "activated_at": datetime.now(timezone.utc).isoformat(),
        }

    def clear_intent(self, user_id: uuid.UUID):
        self.active_intents.pop(user_id, None)

    def get_matching_users(self, user_id: uuid.UUID, intent_type: str) -> list[uuid.UUID]:
        """Find all connected users with the same active intent."""
        matching = []
        for uid, intent in self.active_intents.items():
            if uid != user_id and intent.get("intent_type") == intent_type:
                matching.append(uid)
        return matching

    @property
    def online_count(self) -> int:
        return len(self.active_connections)


manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time features:
    - Intent activation/deactivation notifications
    - Match notifications
    - Chat messages
    - Nearby user updates
    """
    # Authenticate via token in query params
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

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            msg_type = message.get("type")

            if msg_type == "intent_activate":
                # User activated their intent
                intent_data = {
                    "intent_type": message.get("intent_type"),
                    "latitude": message.get("latitude"),
                    "longitude": message.get("longitude"),
                    "radius_km": message.get("radius_km", 0.5),
                }
                manager.set_intent(user_id, intent_data)

                # Check for matches
                matching_users = manager.get_matching_users(user_id, intent_data["intent_type"])
                if matching_users:
                    # Notify the user that there are nearby matches
                    await manager.send_personal(user_id, {
                        "type": "nearby_update",
                        "count": len(matching_users),
                        "intent_type": intent_data["intent_type"],
                    })

                    # Notify matching users that someone new is nearby
                    for mid in matching_users:
                        count = len(
                            manager.get_matching_users(mid, intent_data["intent_type"])
                        )
                        await manager.send_personal(mid, {
                            "type": "nearby_update",
                            "count": count,
                            "intent_type": intent_data["intent_type"],
                        })

            elif msg_type == "intent_deactivate":
                manager.clear_intent(user_id)

            elif msg_type == "chat_message":
                # Real-time chat message relay
                target_id = uuid.UUID(message["target_user_id"])
                await manager.send_personal(target_id, {
                    "type": "chat_message",
                    "from_user_id": str(user_id),
                    "content": message.get("content", ""),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

            elif msg_type == "match_request":
                # One user wants to match with another
                target_id = uuid.UUID(message["target_user_id"])
                await manager.send_personal(target_id, {
                    "type": "match_request",
                    "from_user_id": str(user_id),
                    "intent_type": message.get("intent_type"),
                })

            elif msg_type == "ping":
                await manager.send_personal(user_id, {"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception:
        manager.disconnect(user_id)
