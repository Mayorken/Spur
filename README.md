# Spur Backend API

Real-time adult connection platform — Desire. Consent. Connection. Instantly.

## Tech Stack

- **FastAPI** — async web framework
- **SQLAlchemy 2.0** — async ORM with PostgreSQL
- **Redis** — real-time intent state and online presence
- **WebSockets** — live matching notifications and chat
- **JWT** — stateless authentication

## Quick Start

```bash
# Install dependencies
pip install -e .

# Copy env file
cp .env.example .env

# Start PostgreSQL & Redis (via Docker)
docker compose up -d

# Run migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Auth
- `POST /api/v1/auth/signup` — Register new user
- `POST /api/v1/auth/login` — Login and get JWT token

### Users
- `GET /api/v1/users/me` — Get current profile
- `PATCH /api/v1/users/me` — Update profile
- `POST /api/v1/users/me/location` — Update location

### Intents (Core Spur Mechanic)
- `POST /api/v1/intents/activate` — Activate an intent
- `POST /api/v1/intents/deactivate` — Deactivate intent
- `GET /api/v1/intents/nearby` — Find nearby matching users
- `GET /api/v1/intents/active` — Get current active intent
- `POST /api/v1/intents/match/{user_id}` — Create a match

### Matches & Chat
- `GET /api/v1/matches/` — List all matches
- `GET /api/v1/matches/conversations` — List conversations
- `GET /api/v1/matches/{match_id}/messages` — Get messages
- `POST /api/v1/matches/{match_id}/messages` — Send message

### Safety
- `POST /api/v1/safety/report` — Report a user
- `POST /api/v1/safety/block` — Block a user
- `POST /api/v1/safety/unblock/{user_id}` — Unblock
- `POST /api/v1/safety/panic` — Panic button (instant exit)

### WebSocket
- `WS /ws?token=<jwt>` — Real-time connection for matching, chat, and presence

## Architecture

```
app/
├── api/          # REST endpoints
├── core/         # Config, database, security
├── models/       # SQLAlchemy models
├── schemas/      # Pydantic schemas
├── services/     # Business logic (matching, chat)
└── websockets/   # Real-time WebSocket handlers
```
