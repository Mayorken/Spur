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

  deleteAccount: () =>
    request<void>('/users/me', { method: 'DELETE' }),
}

// ── Intents ───────────────────────────────────────────────────────────────────
export const intents = {
  activate: (data: {
    intent_type: string
    latitude: number
    longitude: number
    radius_km?: number
    vibe_clip_url?: string
    group_size?: number
    max_group_capacity?: number
    target_user_id?: string  // For stealth mode: targeted intent
  }) =>
    request<IntentResponse>('/intents/activate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  uploadVibeClip: async (file: File): Promise<{ video_url: string }> => {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE_URL}/intents/vibe-clip`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) throw new Error('Failed to upload vibe clip')
    return res.json()
  },

  deactivate: () => request<{ message: string }>('/intents/deactivate', { method: 'POST' }),

  active: () => request<IntentResponse | null>('/intents/active'),

  nearby: () => request<NearbyIntentUser[]>('/intents/nearby'),

  matchWith: (targetUserId: string) =>
    request<{ match_id: string; message: string }>(`/intents/match/${targetUserId}`, {
      method: 'POST',
    }),

  spurHours: () =>
    request<{ message: string; boost_duration_minutes: number; visibility_multiplier: number }>(
      '/intents/spur-hours',
      { method: 'POST' }
    ),
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

// ── Premium ───────────────────────────────────────────────────────────────────
export const premium = {
  status: () => request<PremiumStatus>('/premium/status'),

  checkout: () => request<{ checkout_url: string; session_id: string }>('/premium/checkout', { method: 'POST' }),

  ladies: (params?: { state?: string; city?: string; availability?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams()
    if (params?.state) q.set('state', params.state)
    if (params?.city) q.set('city', params.city)
    if (params?.availability) q.set('availability', params.availability)
    if (params?.limit) q.set('limit', String(params.limit))
    if (params?.offset) q.set('offset', String(params.offset))
    return request<VipProfile[]>(`/vip/ladies${q.toString() ? '?' + q : ''}`)
  },

  states: () => request<string[]>('/vip/ladies/states'),

  getLady: (id: string) => request<VipProfile>(`/vip/ladies/${id}`),

  myProfile: () => request<VipProfile>('/vip/profile/me'),

  createProfile: (data: VipProfileCreate) =>
    request<VipProfile>('/vip/profile', { method: 'POST', body: JSON.stringify(data) }),

  updateProfile: (data: Partial<VipProfileCreate>) =>
    request<VipProfile>('/vip/profile', { method: 'PATCH', body: JSON.stringify(data) }),
}

// ── Ratings ───────────────────────────────────────────────────────────────────
export const ratings = {
  rate: (rated_user_id: string, tags: string[]) =>
    request<RatingResponse[]>('/ratings/', {
      method: 'POST',
      body: JSON.stringify({ rated_user_id, tags }),
    }),

  tags: () => request<Record<string, { label: string; emoji: string }>>('/ratings/tags'),

  userExperience: (user_id: string) =>
    request<UserExperienceResponse>(`/ratings/user/${user_id}`),
}

export interface UserExperienceResponse {
  user_id: string
  tags: ExperienceTagResponse[]
}

export interface ExperienceTagResponse {
  tag: string
  label: string
  emoji: string
  count: number
  rank: 'bronze' | 'silver' | 'gold' | 'diamond'
}

// ── Safety ────────────────────────────────────────────────────────────────────
export const safety = {
  report: (reported_user_id: string, reason: string, description?: string) =>
    request<{ id: string }>('/safety/report', {
      method: 'POST',
      body: JSON.stringify({ reported_user_id, reason, description }),
    }),

  block: (blocked_id: string) =>
    request<{ id: string }>('/safety/block', {
      method: 'POST',
      body: JSON.stringify({ blocked_id }),
    }),

  panic: () => request<{ success: boolean; message: string }>('/safety/panic', { method: 'POST' }),

  wingmanAlert: (matchId: string) =>
    request<{ message: string; match_id: string }>(`/safety/wingman/alert/${matchId}`, {
      method: 'POST',
    }),
}

// ── Wingman (Location Sharing) ─────────────────────────────────────────────
export const wingman = {
  addContact: (data: { name: string; phone?: string; email?: string }) =>
    request<TrustedContactResponse>('/wingman/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listContacts: () => request<TrustedContactResponse[]>('/wingman/contacts'),

  deleteContact: (contactId: string) =>
    request<void>(`/wingman/contacts/${contactId}`, { method: 'DELETE' }),

  createSession: (data: { trusted_contact_id: string; duration_hours?: number }) =>
    request<WingmanSessionResponse>('/wingman/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listSessions: () => request<WingmanSessionResponse[]>('/wingman/sessions'),

  updateLocation: (sessionId: string, data: { latitude: number; longitude: number; accuracy?: number }) =>
    request<{ message: string }>(`/wingman/sessions/${sessionId}/location`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  endSession: (sessionId: string) =>
    request<void>(`/wingman/sessions/${sessionId}/end`, { method: 'POST' }),

  getTrackingLocation: (shareToken: string) =>
    request<WingmanPublicLocation>(`/wingman/track/${shareToken}`),

  panicWithWingman: () => request<{ message: string; contacts_alerted: number }>('/wingman/panic', { method: 'POST' }),
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface TrustedContactResponse {
  id: string
  user_id: string
  name: string
  phone: string | null
  email: string | null
  is_verified: boolean
  created_at: string
}

export interface WingmanSessionResponse {
  id: string
  user_id: string
  share_token: string
  last_latitude: number | null
  last_longitude: number | null
  last_location_update: string | null
  created_at: string
  expires_at: string
  is_active: boolean
  panic_triggered: boolean
}

export interface WingmanPublicLocation {
  latitude: number | null
  longitude: number | null
  last_updated: string
  is_active: boolean
  panic_triggered: boolean
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
  is_stealth: boolean
  trust_score: number
  location_radius_km: number
  mode: string | null
  sexual_orientation: string | null
  gender_identity: string | null
  male_role: string | null
  female_role: string | null
  seeking_roles: string[] | null
  wingman_enabled: boolean
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
  mode?: string | null
  is_stealth?: boolean
  sexual_orientation?: string | null
  gender_identity?: string | null
  male_role?: string | null
  female_role?: string | null
  seeking_roles?: string[] | null
  wingman_webhook_url?: string | null
  wingman_enabled?: boolean
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
  vibe_clip_url: string | null
  group_size: number
  max_group_capacity: number
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
  mode?: string | null
  group_size: number
  max_group_capacity: number
  sexual_orientation: string | null
  gender_identity: string | null
  male_role: string | null
  female_role: string | null
  seeking_roles: string[] | null
}

export interface MatchWithUser {
  id: string
  matched_user_id: string
  matched_user_name: string
  matched_user_avatar: string | null
  matched_user_verified: boolean
  intent_type: string
  my_group_size: number
  their_group_size: number
  is_squad_match: boolean  // true if group_size > 1
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

export interface PremiumStatus {
  is_premium: boolean
  expires_at: string | null
  activated_at: string | null
}

export interface VipProfile {
  id: string
  display_name: string
  age: number | null
  state: string
  city: string | null
  area: string | null
  bio: string | null
  services: string[]
  languages: string[]
  availability: string | null
  is_verified: boolean
  is_active?: boolean
  views: number
  whatsapp: string | null
  telegram: string | null
  avatar_url: string | null
  created_at: string
}

export interface VipProfileCreate {
  state: string
  city?: string
  area?: string
  display_name: string
  age?: number
  bio?: string
  services?: string
  languages?: string
  availability?: string
  whatsapp?: string
  telegram?: string
}

export interface RatingResponse {
  id: string
  rater_id: string
  rated_id: string
  tag: string
  created_at: string
}
