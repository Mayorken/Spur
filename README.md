# Spur

**Desire. Consent. Connection. Instantly.**

Real-time adult connection platform that matches people on mutual intent — no swiping, no waiting.

## Project Structure

```
├── src/               # React frontend (Vite + TypeScript + Tailwind)
│   ├── components/    # Reusable UI components (ProfileCard, RadarView, etc.)
│   ├── pages/         # Route pages (Landing, Discover, Nearby, Chat, etc.)
│   └── utils/         # Mock data and helpers
├── app/               # FastAPI backend
│   ├── api/           # REST endpoints (auth, users, intents, matches, safety)
│   ├── core/          # Config, database, security
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # Business logic (matching engine, chat)
│   └── websockets/    # Real-time WebSocket handlers
```

## Frontend

Live: https://dist-pjcxtdlo.devinapps.com

```bash
npm install
npm run dev
```

## Backend API

```bash
pip install -e .
cp .env.example .env
uvicorn main:app --reload --port 8000
```

Requires PostgreSQL and Redis.

## API Endpoints

- `POST /api/v1/auth/signup` & `/login` — JWT auth
- `POST /api/v1/intents/activate` — Core Spur mechanic
- `GET /api/v1/intents/nearby` — Find matching users within radius
- `POST /api/v1/intents/match/{user_id}` — Create mutual match
- `GET /api/v1/matches/conversations` — Chat list
- `POST /api/v1/safety/panic` — One-tap panic button
- `WS /ws?token=<jwt>` — Real-time matching & chat
