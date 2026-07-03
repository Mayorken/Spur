import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MapPin, Filter, Zap, X } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import SpurLogo from '../components/SpurLogo'
import ProfileCard from '../components/ProfileCard'
import ProximityAlert from '../components/ProximityAlert'
import { intents, type NearbyIntentUser } from '../utils/api'
import { selectPromoVariant, shouldShowVIPPromo, getNextPromoDelay, type PromoVariant } from '../utils/vipPromoLogic'
import { useLocation } from '../hooks/useLocation'
import { useWebSocket } from '../hooks/useWebSocket'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { useAuth } from '../context/AuthContext'

const INTENT_OPTIONS = [
  { key: 'casual_connection', label: 'Casual Connection', emoji: '✨', desc: 'See where things go' },
  { key: 'open_to_intimacy', label: 'Open to Intimacy', emoji: '🔥', desc: 'Physical connection, mutual desire' },
  { key: 'looking_to_hook_up', label: 'Looking to Hook Up', emoji: '⚡', desc: 'No strings, just vibes' },
  { key: 'romantic', label: 'Romantic', emoji: '💜', desc: 'Get to know each other deeper' },
]

const INTENT_LABELS: Record<string, string> = {
  casual_connection: 'Casual Connection',
  open_to_intimacy: 'Open to Intimacy',
  looking_to_hook_up: 'Looking to Hook Up',
  romantic: 'Romantic',
}

export default function Discover() {
  const navigate = useNavigate()
  const location = useLocation(true)
  const { notify, requestPermission, state: pushState } = usePushNotifications()
  const { user } = useAuth()

  const [nearbyUsers, setNearbyUsers] = useState<NearbyIntentUser[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showIntentSelector, setShowIntentSelector] = useState(false)
  const [showSquadSelector, setShowSquadSelector] = useState(false)
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null)
  const [activeIntent, setActiveIntent] = useState<string | null>(null)
  const [activatingIntent, setActivatingIntent] = useState(false)
  const [squadSize, setSquadSize] = useState(1)
  const [maxGroupCapacity, setMaxGroupCapacity] = useState(1)
  const [proximityAlert, setProximityAlert] = useState<NearbyIntentUser | null>(null)
  const [matchedUser, setMatchedUser] = useState<{ name: string; matchId: string; isSquadMatch?: boolean } | null>(null)
  const [nearbyCount, setNearbyCount] = useState(0)
  const [deactivating, setDeactivating] = useState(false)
  const [showVIPPromo, setShowVIPPromo] = useState(false)
  const [promoVariant, setPromoVariant] = useState<PromoVariant | null>(null)
  const [promoIntentActivationTime, setPromoIntentActivationTime] = useState(0)
  const [promoDismissalCount, setPromoDismissalCount] = useState(0)

  const { send } = useWebSocket(
    useCallback(
      (msg: Record<string, unknown>) => {
        if (msg.type === 'nearby_update') {
          setNearbyCount(msg.count as number)
          fetchNearby()
          notify('Someone nearby is interested', `${msg.count} ${msg.count === 1 ? 'person' : 'people'} nearby with matching intent`, '/app')
        } else if (msg.type === 'match_request') {
          // Someone wants to match with us — auto-accept for now
        }
      },
      [],
    ),
  )

  const fetchNearby = useCallback(async () => {
    if (!activeIntent) return
    try {
      const users = await intents.nearby()
      setNearbyUsers(users)
      setCurrentIndex(0)
    } catch {
      // No active intent yet or location missing
    }
  }, [activeIntent])

  // Load active intent on mount
  useEffect(() => {
    intents.active().then((intent) => {
      if (intent) setActiveIntent(intent.intent_type)
    }).catch(() => {})
  }, [])

  // Fetch nearby whenever intent becomes active
  useEffect(() => {
    if (activeIntent) fetchNearby()
  }, [activeIntent, fetchNearby])

  // Proximity alert: show a nearby user after a short delay
  useEffect(() => {
    if (nearbyUsers.length === 0) return
    const timer = setTimeout(() => {
      setProximityAlert(nearbyUsers[0])
    }, 8000)
    return () => clearTimeout(timer)
  }, [nearbyUsers])

  const activateIntent = async (intentKey: string) => {
    if (!location.latitude || !location.longitude) return
    // Show squad selector first
    setSelectedIntent(intentKey)
    setShowSquadSelector(true)
  }

  const confirmSquadIntent = async () => {
    if (!selectedIntent || !location.latitude || !location.longitude) return
    // Ask for notification permission on first intent activation
    if (pushState === 'default') requestPermission()
    setActivatingIntent(true)
    try {
      const radiusKm = user?.location_radius_km ?? 0.5

      // If in stealth mode, target the current user (if viewing a card)
      const targetUserId = user?.is_stealth && currentUser ? currentUser.user_id : undefined

      await intents.activate({
        intent_type: selectedIntent,
        latitude: location.latitude,
        longitude: location.longitude,
        radius_km: radiusKm,
        group_size: squadSize,
        max_group_capacity: maxGroupCapacity,
        target_user_id: targetUserId,  // Stealth: targeted intent
      })
      setActiveIntent(selectedIntent)
      send({
        type: 'intent_activate',
        intent_type: selectedIntent,
        latitude: location.latitude,
        longitude: location.longitude,
        radius_km: radiusKm,
        group_size: squadSize,
        target_user_id: targetUserId,
      })
      await fetchNearby()

      // Smart VIP promo for female users selecting hookup intent
      if (
        selectedIntent === 'looking_to_hook_up' &&
        (user?.gender_identity === 'woman' || user?.gender_identity === 'trans_woman')
      ) {
        const lastVIPPromoTime = localStorage.getItem('lastVIPPromoTime')
        const dismissalCountStr = localStorage.getItem('vipPromoDismissalCount')
        const dismissalCount = dismissalCountStr ? parseInt(dismissalCountStr) : 0
        const now = Date.now()

        const context = {
          userId: user?.id ?? '',
          gender: user?.gender_identity,
          matchCount: nearbyUsers.length,
          hoursSinceActive: (now - promoIntentActivationTime) / (1000 * 60 * 60),
          lastDismissalTime: lastVIPPromoTime ? parseInt(lastVIPPromoTime) : undefined,
          dismissalCount,
          isPremium: user?.is_premium,
        }

        // Check if we should show promo
        if (shouldShowVIPPromo(context)) {
          const variant = selectPromoVariant(context)
          setPromoVariant(variant)
          setShowVIPPromo(true)
          setPromoIntentActivationTime(now)

          // Track promo impression
          fetch(`${API_BASE}/analytics/vip-promo-impression`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('spur_token')}` },
            body: JSON.stringify({ variant: variant.id, intent: selectedIntent, timestamp: now }),
          }).catch(() => {})
        }
      }
    } finally {
      setActivatingIntent(false)
      setShowIntentSelector(false)
      setShowSquadSelector(false)
    }
  }

  const handleAccept = async (userId: string) => {
    try {
      const res = await intents.matchWith(userId)
      const nearbyUser = nearbyUsers.find((u) => u.user_id === userId)
      const userName = nearbyUser?.display_name ?? 'someone'
      const isSquadMatch = res.is_squad_match || (res.my_group_size > 1 || res.their_group_size > 1)
      setMatchedUser({ name: userName, matchId: res.match_id, isSquadMatch })
      // Navigate to match celebration after brief delay
      setTimeout(() => {
        navigate('/match', {
          state: {
            matchId: res.match_id,
            otherUserName: userName,
            otherUserAvatar: nearbyUser?.avatar_url ?? null,
            intentType: nearbyUser?.intent_type,
            distanceKm: nearbyUser?.distance_km,
            isSquadMatch,
            myGroupSize: res.my_group_size,
            theirGroupSize: res.their_group_size,
          },
        })
      }, 500)
    } catch {
      // match already exists or intent mismatch — go to messages
      navigate('/messages')
    }
    setProximityAlert(null)
  }

  const handleDecline = () => setProximityAlert(null)
  const dismissAlert = useCallback(() => setProximityAlert(null), [])

  const deactivateIntent = async () => {
    setDeactivating(true)
    try {
      await intents.deactivate()
      setActiveIntent(null)
      setNearbyUsers([])
      setNearbyCount(0)
    } catch {
      // ignore
    } finally {
      setDeactivating(false)
    }
  }

  const handleLike = async () => {
    if (!currentUser) return
    // Attempt to match; on success navigate to celebration
    try {
      const res = await intents.matchWith(currentUser.user_id)
      const isSquadMatch = res.is_squad_match || (res.my_group_size > 1 || res.their_group_size > 1)
      navigate('/match', {
        state: {
          matchId: res.match_id,
          otherUserName: currentUser.display_name,
          otherUserAvatar: currentUser.avatar_url ?? null,
          intentType: currentUser.intent_type,
          distanceKm: currentUser.distance_km,
          isSquadMatch,
          myGroupSize: res.my_group_size,
          theirGroupSize: res.their_group_size,
        },
      })
    } catch {
      // Already matched or intent mismatch — just advance
      setCurrentIndex((p) => Math.min(p + 1, nearbyUsers.length - 1))
    }
  }

  const handlePass = () => setCurrentIndex((p) => Math.min(p + 1, nearbyUsers.length - 1))

  const currentUser = nearbyUsers[currentIndex]

  const toProfileCard = (u: NearbyIntentUser) => ({
    name: u.display_name,
    age: u.age ?? 0,
    distance: `${u.distance_km.toFixed(1)}km`,
    intent: INTENT_LABELS[u.intent_type] ?? u.intent_type,
    mode: u.mode,
    imageUrl: u.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.user_id}`,
    verified: u.is_verified,
    experienceTags: [],
  })

  const toAlertUser = (u: NearbyIntentUser) => ({
    id: u.user_id,
    name: u.display_name,
    imageUrl: u.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.user_id}`,
    intent: INTENT_LABELS[u.intent_type] ?? u.intent_type,
    distance: `${u.distance_km.toFixed(1)}km`,
  })

  return (
    <div className="min-h-screen bg-spur-darker pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-spur-darker border-b-2 border-spur-accent">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SpurLogo size="lg" />
            {user?.is_stealth && (
              <div className="px-2 py-1 bg-spur-accent/20 border border-spur-accent rounded text-xs font-bold text-spur-accent">
                👻 STEALTH
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-spur-darker border-2 border-spur-accent font-mono text-sm font-bold">
              <MapPin size={14} className="text-spur-accent" />
              <span className="text-spur-accent">
                {location.latitude ? `${(user?.location_radius_km ?? 0.5).toFixed(1)}KM` : 'LOCATING'}
              </span>
            </div>
            <button
              onClick={() => setShowIntentSelector(!showIntentSelector)}
              className="px-3 py-1.5 bg-spur-darker border-2 border-spur-accent font-mono text-sm font-bold text-spur-accent hover:bg-spur-accent hover:text-spur-dark transition-colors"
            >
              FILTER
            </button>
          </div>
        </div>
      </div>

      {/* Main card area */}
      <div className="px-4 pt-6 pb-4">
        {/* Active intent banner */}
        {activeIntent ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-5 mx-auto w-fit"
          >
            <div className="flex items-center gap-2 px-4 py-3 bg-spur-dark border-2 border-spur-accent font-mono font-bold uppercase text-sm">
              <Zap size={16} className="text-spur-accent" />
              <span className="text-spur-accent">
                {INTENT_LABELS[activeIntent].toUpperCase()}
              </span>
              <div className="w-2 h-2 bg-spur-accent animate-pulse" />
              {nearbyCount > 0 && (
                <span className="text-spur-accent text-xs">/ {nearbyCount} NEARBY</span>
              )}
            </div>
            <button
              onClick={deactivateIntent}
              disabled={deactivating}
              title="Deactivate intent"
              className="w-8 h-8 rounded-full bg-spur-card border border-spur-border/50 flex items-center justify-center hover:border-red-400/50 hover:bg-red-500/10 transition-colors disabled:opacity-40"
            >
              {deactivating
                ? <span className="w-3 h-3 border border-spur-muted border-t-transparent rounded-full animate-spin" />
                : <X size={14} className="text-spur-muted" />
              }
            </button>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setShowIntentSelector(true)}
            className="flex items-center justify-center gap-2 mb-5 px-4 py-2 rounded-full bg-spur-card border border-spur-border/50 mx-auto w-fit"
          >
            <Zap size={14} className="text-spur-muted" />
            <span className="text-xs text-spur-muted">Tap to set your intent</span>
          </motion.button>
        )}

        {/* Profile card */}
        <AnimatePresence mode="wait">
          {currentUser ? (
            <motion.div
              key={currentUser.user_id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <ProfileCard
                {...toProfileCard(currentUser)}
                onLike={handleLike}
                onPass={handlePass}
              />
            </motion.div>
          ) : activeIntent ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-spur-card border border-spur-border mx-auto mb-4 flex items-center justify-center">
                <Zap size={24} className="text-spur-purple" />
              </div>
              <p className="text-white font-medium mb-1">No one nearby yet</p>
              <p className="text-spur-muted text-sm">Check back soon or expand your radius</p>
            </motion.div>
          ) : (
            <div className="text-center py-20">
              <p className="text-spur-muted text-sm">Set an intent to see nearby people</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Intent Selector Modal */}
      <AnimatePresence>
        {showIntentSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end"
            onClick={() => setShowIntentSelector(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-spur-dark rounded-t-3xl p-6 border-t-2 border-spur-accent"
            >
              <div className="w-12 h-1 rounded-full bg-spur-border mx-auto mb-6" />
              <h3 className="text-lg font-bold text-spur-accent mb-1">SET YOUR INTENT</h3>
              {!location.latitude && (
                <p className="text-yellow-400 text-xs mb-3">
                  Allow location access to activate intent matching
                </p>
              )}
              <p className="text-spur-muted text-sm mb-6">What are you open to right now?</p>

              <div className="space-y-3">
                {INTENT_OPTIONS.map((intent) => (
                  <button
                    key={intent.key}
                    onClick={() => activateIntent(intent.key)}
                    disabled={activatingIntent || !location.latitude}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-spur-card border-2 transition-colors text-left disabled:opacity-50 ${
                      activeIntent === intent.key
                        ? 'border-spur-accent'
                        : 'border-spur-border/50 hover:border-spur-accent/50'
                    }`}
                  >
                    <span className="text-2xl">{intent.emoji}</span>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{intent.label}</p>
                      <p className="text-spur-muted text-xs">{intent.desc}</p>
                    </div>
                    {activeIntent === intent.key && (
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Squad Size Selector Modal */}
      <AnimatePresence>
        {showSquadSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end"
            onClick={() => setShowSquadSelector(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-spur-dark rounded-t-3xl p-6 border-t-2 border-spur-accent"
            >
              <div className="w-12 h-1 rounded-full bg-spur-border mx-auto mb-6" />
              <h3 className="text-lg font-bold text-spur-accent mb-1">SELECT YOUR SQUAD SIZE</h3>
              <p className="text-spur-muted text-sm mb-6">How many people in your group?</p>

              <div className="space-y-3 mb-6">
                {[1, 2, 3, 4, 5].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSquadSize(size)}
                    className={`w-full p-4 rounded-2xl border-2 transition-colors text-left font-bold ${
                      squadSize === size
                        ? 'bg-spur-accent/20 border-spur-accent text-spur-accent'
                        : 'bg-spur-card border-spur-border/50 text-white hover:border-spur-accent/50'
                    }`}
                  >
                    {size === 1 ? '👤 Solo' : `👥 Squad of ${size}`}
                  </button>
                ))}
              </div>

              <div className="space-y-3 mb-6">
                <label className="text-xs text-spur-muted uppercase font-bold">
                  WILLING TO MATCH WITH UP TO:
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((size) => (
                    <button
                      key={`cap-${size}`}
                      onClick={() => setMaxGroupCapacity(Math.max(size, squadSize))}
                      className={`flex-1 py-2 rounded-lg border-2 font-bold text-sm transition-colors ${
                        maxGroupCapacity === size
                          ? 'bg-spur-accent/20 border-spur-accent text-spur-accent'
                          : size < squadSize
                            ? 'bg-spur-border/30 border-spur-border text-spur-muted cursor-not-allowed'
                            : 'bg-spur-card border-spur-border/50 text-white hover:border-spur-accent/50'
                      }`}
                      disabled={size < squadSize}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={confirmSquadIntent}
                disabled={activatingIntent}
                className="w-full py-3 bg-spur-accent text-spur-dark font-black rounded-lg hover:bg-spur-accent-dark transition-colors disabled:opacity-50"
              >
                {activatingIntent ? 'ACTIVATING...' : 'CONFIRM SQUAD INTENT'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proximity Alert */}
      <AnimatePresence>
        {proximityAlert && (
          <ProximityAlert
            user={toAlertUser(proximityAlert)}
            onAccept={(id) => handleAccept(id)}
            onDecline={handleDecline}
            onClose={dismissAlert}
          />
        )}
      </AnimatePresence>

      {/* Match toast */}
      <AnimatePresence>
        {matchedUser && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-24 left-4 right-4 z-50 rounded-2xl p-4 flex items-center gap-3 ${
              matchedUser.isSquadMatch
                ? 'bg-gradient-to-r from-spur-accent to-spur-accent/70'
                : 'bg-gradient-to-r from-spur-accent to-spur-accent'
            }`}
          >
            {matchedUser.isSquadMatch ? (
              <span className="text-2xl">👥</span>
            ) : (
              <Zap size={20} className="text-white" />
            )}
            <div className="flex-1">
              <p className="text-white font-bold text-sm">
                {matchedUser.isSquadMatch ? `It's a Squad Match with ${matchedUser.name}!` : `It's a Spur with ${matchedUser.name}!`}
              </p>
              <p className="text-white/70 text-xs">You can now chat</p>
            </div>
            <button
              onClick={() => {
                navigate(`/chat/${matchedUser.matchId}`)
                setMatchedUser(null)
              }}
              className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium"
            >
              Chat
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIP Promotion Modal - Dynamic Variant */}
      <AnimatePresence>
        {showVIPPromo && promoVariant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4"
            onClick={() => {
              // Track dismissal
              const newCount = promoDismissalCount + 1
              setPromoDismissalCount(newCount)
              localStorage.setItem('vipPromoDismissalCount', newCount.toString())
              const nextDelay = getNextPromoDelay(newCount)
              localStorage.setItem('lastVIPPromoTime', Date.now().toString())

              // Send dismissal event
              fetch(`${API_BASE}/analytics/vip-promo-dismissal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('spur_token')}` },
                body: JSON.stringify({ variant: promoVariant.id, dismissalCount: newCount, nextDelayMs: nextDelay }),
              }).catch(() => {})

              setShowVIPPromo(false)
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-3xl p-6 border-2 ${
                promoVariant.urgency === 'high'
                  ? 'bg-gradient-to-b from-red-950/80 to-spur-dark border-red-600 shadow-lg shadow-red-600/20'
                  : promoVariant.urgency === 'medium'
                    ? 'bg-gradient-to-b from-spur-card to-spur-dark border-spur-accent'
                    : 'bg-gradient-to-b from-spur-card to-spur-dark border-spur-accent'
              }`}
            >
              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const newCount = promoDismissalCount + 1
                  setPromoDismissalCount(newCount)
                  localStorage.setItem('vipPromoDismissalCount', newCount.toString())
                  const nextDelay = getNextPromoDelay(newCount)
                  localStorage.setItem('lastVIPPromoTime', Date.now().toString())

                  fetch(`${API_BASE}/analytics/vip-promo-dismissal`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('spur_token')}` },
                    body: JSON.stringify({ variant: promoVariant.id, dismissalCount: newCount, nextDelayMs: nextDelay }),
                  }).catch(() => {})

                  setShowVIPPromo(false)
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-spur-accent/20 flex items-center justify-center hover:bg-spur-accent/30 transition-colors"
              >
                <X size={18} className="text-spur-accent" />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">{promoVariant.emoji}</div>
                <h3 className={`text-2xl font-black mb-2 ${
                  promoVariant.urgency === 'high' ? 'text-red-400' : 'text-spur-accent'
                }`}>
                  {promoVariant.title}
                </h3>
                <p className="text-spur-muted text-sm">{promoVariant.description}</p>
              </div>

              {/* Benefits */}
              <div className="space-y-2 mb-6">
                {promoVariant.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-spur-dark/50">
                    <p className="text-white text-sm font-medium">{benefit}</p>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    // Track conversion
                    fetch(`${API_BASE}/analytics/vip-promo-click`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('spur_token')}` },
                      body: JSON.stringify({ variant: promoVariant.id }),
                    }).catch(() => {})
                    setShowVIPPromo(false)
                    navigate('/vip/join')
                  }}
                  className={`w-full py-3 text-white font-black rounded-xl transition-opacity hover:opacity-90 ${
                    promoVariant.urgency === 'high'
                      ? 'bg-gradient-to-r from-red-600 to-red-700'
                      : 'bg-gradient-to-r from-spur-accent to-spur-accent-dark'
                  }`}
                >
                  {promoVariant.cta}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const newCount = promoDismissalCount + 1
                    setPromoDismissalCount(newCount)
                    localStorage.setItem('vipPromoDismissalCount', newCount.toString())
                    localStorage.setItem('lastVIPPromoTime', Date.now().toString())
                    setShowVIPPromo(false)
                  }}
                  className="w-full py-3 bg-spur-card border-2 border-spur-border/50 text-white font-medium rounded-xl hover:border-spur-border transition-colors"
                >
                  Not Now
                </button>
              </div>

              {/* Trust badge */}
              <p className="text-center text-spur-muted text-xs mt-4">
                ✓ 10,000+ women use VIP • Discreet & Secure
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  )
}
