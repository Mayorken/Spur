import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MapPin, Filter, Zap } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import ProfileCard from '../components/ProfileCard'
import ProximityAlert from '../components/ProximityAlert'
import { intents, type NearbyIntentUser } from '../utils/api'
import { useLocation } from '../hooks/useLocation'
import { useWebSocket } from '../hooks/useWebSocket'

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

  const [nearbyUsers, setNearbyUsers] = useState<NearbyIntentUser[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showIntentSelector, setShowIntentSelector] = useState(false)
  const [activeIntent, setActiveIntent] = useState<string | null>(null)
  const [activatingIntent, setActivatingIntent] = useState(false)
  const [proximityAlert, setProximityAlert] = useState<NearbyIntentUser | null>(null)
  const [matchedUser, setMatchedUser] = useState<{ name: string; matchId: string } | null>(null)
  const [nearbyCount, setNearbyCount] = useState(0)

  const { send } = useWebSocket(
    useCallback(
      (msg: Record<string, unknown>) => {
        if (msg.type === 'nearby_update') {
          setNearbyCount(msg.count as number)
          fetchNearby()
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
    setActivatingIntent(true)
    try {
      await intents.activate({
        intent_type: intentKey,
        latitude: location.latitude,
        longitude: location.longitude,
        radius_km: 0.5,
      })
      setActiveIntent(intentKey)
      send({
        type: 'intent_activate',
        intent_type: intentKey,
        latitude: location.latitude,
        longitude: location.longitude,
        radius_km: 0.5,
      })
      await fetchNearby()
    } finally {
      setActivatingIntent(false)
      setShowIntentSelector(false)
    }
  }

  const handleAccept = async (userId: string) => {
    try {
      const res = await intents.matchWith(userId)
      const userName = nearbyUsers.find((u) => u.user_id === userId)?.display_name ?? 'someone'
      setMatchedUser({ name: userName, matchId: res.match_id })
    } catch {
      // match already exists or intent mismatch
    }
    setProximityAlert(null)
  }

  const handleDecline = () => setProximityAlert(null)
  const dismissAlert = useCallback(() => setProximityAlert(null), [])

  const handleLike = () => setCurrentIndex((p) => Math.min(p + 1, nearbyUsers.length - 1))
  const handlePass = () => setCurrentIndex((p) => Math.min(p + 1, nearbyUsers.length - 1))

  const currentUser = nearbyUsers[currentIndex]

  const toProfileCard = (u: NearbyIntentUser) => ({
    name: u.display_name,
    age: u.age ?? 0,
    distance: `${u.distance_km.toFixed(1)}km`,
    intent: INTENT_LABELS[u.intent_type] ?? u.intent_type,
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
      <div className="sticky top-0 z-40 bg-spur-darker/95 backdrop-blur-xl border-b border-spur-border/30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-spur-purple to-spur-pink" />
            <h1 className="text-lg font-bold text-white">Spur</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-spur-card border border-spur-border/50">
              <MapPin size={12} className="text-spur-purple" />
              <span className="text-[10px] text-spur-muted">
                {location.latitude ? '~0.5km' : 'locating…'}
              </span>
            </div>
            <button
              onClick={() => setShowIntentSelector(!showIntentSelector)}
              className="p-2 rounded-full bg-spur-card border border-spur-border/50"
            >
              <Filter size={16} className="text-spur-muted" />
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
            className="flex items-center justify-center gap-2 mb-5 px-4 py-2 rounded-full bg-spur-purple/10 border border-spur-purple/30 mx-auto w-fit"
          >
            <Zap size={14} className="text-spur-purple" />
            <span className="text-xs text-spur-purple font-medium">
              {INTENT_LABELS[activeIntent]}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {nearbyCount > 0 && (
              <span className="text-[10px] text-spur-muted">· {nearbyCount} nearby</span>
            )}
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
              className="w-full bg-spur-dark rounded-t-3xl p-6 border-t border-spur-border"
            >
              <div className="w-12 h-1 rounded-full bg-spur-border mx-auto mb-6" />
              <h3 className="text-lg font-semibold text-white mb-1">Set Your Intent</h3>
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
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-spur-card border transition-colors text-left disabled:opacity-50 ${
                      activeIntent === intent.key
                        ? 'border-spur-purple/70'
                        : 'border-spur-border/50 hover:border-spur-purple/50'
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
            className="fixed bottom-24 left-4 right-4 z-50 bg-gradient-to-r from-spur-purple to-spur-pink rounded-2xl p-4 flex items-center gap-3"
          >
            <Zap size={20} className="text-white" />
            <div className="flex-1">
              <p className="text-white font-medium text-sm">It's a Spur with {matchedUser.name}!</p>
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

      <BottomNav />
    </div>
  )
}
