import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Radio, MapPin, Users, Loader2 } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import RadarView from '../components/RadarView'
import { intents, type NearbyIntentUser } from '../utils/api'

export default function Nearby() {
  const [view, setView] = useState<'radar' | 'grid'>('radar')
  const [nearbyUsers, setNearbyUsers] = useState<NearbyIntentUser[]>([])
  const [loading, setLoading] = useState(true)
  const [noIntent, setNoIntent] = useState(false)
  const [matchingId, setMatchingId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    intents
      .nearby()
      .then((users) => {
        setNearbyUsers(users)
        setLoading(false)
      })
      .catch((err: Error) => {
        if (err.message.includes('No active intent')) setNoIntent(true)
        setLoading(false)
      })
  }, [])

  const handleConnect = async (userId: string) => {
    if (matchingId) return
    setMatchingId(userId)
    try {
      const res = await intents.matchWith(userId)
      const u = nearbyUsers.find((x) => x.user_id === userId)
      navigate('/match', {
        state: {
          matchId: res.match_id,
          otherUserName: u?.display_name ?? 'someone',
          otherUserAvatar: u?.avatar_url ?? null,
          intentType: u?.intent_type,
          distanceKm: u?.distance_km,
        },
      })
    } catch {
      // already matched — go to messages
      navigate('/messages')
    } finally {
      setMatchingId(null)
    }
  }

  const radarUsers = nearbyUsers.map((u) => ({
    id: u.user_id,
    name: u.display_name,
    imageUrl: u.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.user_id}`,
    intent: u.intent_type,
    distance: `${u.distance_km.toFixed(1)}km`,
  }))

  return (
    <div className="min-h-screen bg-spur-darker pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-spur-darker/95 backdrop-blur-xl border-b border-spur-border/30">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio size={20} className="text-spur-purple" />
            Who's Nearby
          </h1>
          <div className="flex items-center gap-1 bg-spur-card rounded-full p-0.5 border border-spur-border/50">
            <button
              onClick={() => setView('radar')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                view === 'radar' ? 'bg-spur-purple text-white' : 'text-spur-muted'
              }`}
            >
              Radar
            </button>
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                view === 'grid' ? 'bg-spur-purple text-white' : 'text-spur-muted'
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Active count */}
      <div className="px-4 py-3 flex items-center justify-center gap-2">
        <Users size={14} className="text-spur-purple" />
        <span className="text-xs text-spur-muted">
          {loading ? (
            'Looking for people nearby…'
          ) : noIntent ? (
            <span className="text-yellow-400">Set an intent on Discover to see nearby people</span>
          ) : (
            <>
              <span className="text-white font-medium">{nearbyUsers.length} people</span> nearby
              share your intent
            </>
          )}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-spur-purple border-t-transparent animate-spin" />
        </div>
      ) : noIntent ? (
        <div className="text-center px-6 py-12">
          <Radio size={40} className="text-spur-border mx-auto mb-4" />
          <p className="text-white font-medium mb-1">No active intent</p>
          <p className="text-spur-muted text-sm">Go to Discover and set an intent first</p>
        </div>
      ) : view === 'radar' ? (
        <div className="px-4 py-8">
          <RadarView users={radarUsers} onUserTap={(user) => handleConnect(user.id)} />
          <p className="text-center text-spur-muted text-xs mt-6">Tap a person to connect</p>
        </div>
      ) : (
        <div className="px-4 py-4">
          <div className="grid grid-cols-3 gap-3">
            {nearbyUsers.map((user, i) => (
              <motion.button
                key={user.user_id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleConnect(user.user_id)}
                disabled={!!matchingId}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-spur-card border border-spur-border/30 hover:border-spur-purple/50 transition-colors disabled:opacity-60"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-spur-border/50">
                    {matchingId === user.user_id ? (
                      <div className="w-full h-full bg-spur-dark flex items-center justify-center">
                        <Loader2 size={20} className="text-spur-purple animate-spin" />
                      </div>
                    ) : (
                      <img
                        src={user.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.user_id}`}
                        alt={user.display_name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-spur-card" />
                </div>
                <div className="text-center">
                  <p className="text-white text-xs font-medium">{user.display_name}</p>
                  <div className="flex items-center gap-0.5 justify-center mt-0.5">
                    <MapPin size={8} className="text-spur-muted" />
                    <span className="text-[10px] text-spur-muted">{user.distance_km.toFixed(1)}km</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-spur-purple/10 text-[9px] text-spur-purple font-medium">
                  {user.intent_type.split('_').slice(0, 2).join(' ')}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
