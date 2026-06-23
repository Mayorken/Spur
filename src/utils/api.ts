const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'
const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws'

function getToken(): string | null {
  return localStorage.getItem('spur_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('spur_token')
    localStorage.removeItem('spur_user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail ?? 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  signup: (data: { email: string; password: string; display_name: string; age?: number }) =>
    request<{ access_token: string; token_type: string; user: UserResponse }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; token_type: string; user: UserResponse }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = {
  me: () => request<UserResponse>('/users/me'),

  updateMe: (data: Partial<UserUpdate>) =>
    request<UserResponse>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),

  updateLocation: (latitude: number, longitude: number) =>
    request<UserResponse>('/users/me/location', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude }),
    }),
}

// ── Intents ───────────────────────────────────────────────────────────────────
export const intents = {
  activate: (data: {
    intent_type: string
    latitude: number
    longitude: number
    radius_km?: number
  }) =>
    request<IntentResponse>('/intents/activate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deactivate: () => request<{ message: string }>('/intents/deactivate', { method: 'POST' }),

  active: () => request<IntentResponse | null>('/intents/active'),

  nearby: () => request<NearbyIntentUser[]>('/intents/nearby'),

  matchWith: (targetUserId: string) =>
    request<{ match_id: string; message: string }>(`/intents/match/${targetUserId}`, {
      method: 'POST',
    }),
}

// ── Matches ───────────────────────────────────────────────────────────────────
export const matches = {
  list: () => request<MatchWithUser[]>('/matches/'),

  conversations: () => request<ConversationResponse[]>('/matches/conversations'),

  messages: (matchId: string) => request<ChatMessageResponse[]>(`/matches/${matchId}/messages`),

  sendMessage: (matchId: string, content: string) =>
    request<ChatMessageResponse>(`/matches/${matchId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
}

// ── WebSocket ─────────────────────────────────────────────────────────────────
export function createWebSocket(): WebSocket | null {
  const token = getToken()
  if (!token) return null
  return new WebSocket(`${WS_URL}?token=${token}`)
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface UserResponse {
  id: string
  email: string
  display_name: string
  age: number | null
  bio: string | null
  avatar_url: string | null
  is_verified: boolean
  is_id_verified: boolean
  ghost_mode: boolean
  trust_score: number
  created_at: string
}

export interface UserUpdate {
  display_name?: string
  bio?: string
  avatar_url?: string
  age?: number
  ghost_mode?: boolean
  blurred_photos?: boolean
  location_radius_km?: number
}

export interface IntentResponse {
  id: string
  user_id: string
  intent_type: string
  latitude: number
  longitude: number
  radius_km: number
  preferred_vibe: string | null
  time_window: string | null
  is_active: boolean
  activated_at: string
  expires_at: string | null
}

export interface NearbyIntentUser {
  user_id: string
  display_name: string
  age: number | null
  avatar_url: string | null
  intent_type: string
  distance_km: number
  is_verified: boolean
}

export interface MatchWithUser {
  id: string
  matched_user_id: string
  matched_user_name: string
  matched_user_avatar: string | null
  matched_user_verified: boolean
  intent_type: string
  created_at: string
}

export interface ChatMessageResponse {
  id: string
  match_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface ConversationResponse {
  match_id: string
  other_user_id: string
  other_user_name: string
  other_user_avatar: string | null
  last_message: string | null
  last_message_time: string | null
  unread_count: number
  is_online: boolean
}
