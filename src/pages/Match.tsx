import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { MessageCircle, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface MatchState {
  matchId: string
  otherUserName: string
  otherUserAvatar: string | null
  intentType?: string
  distanceKm?: number
}

export default function Match() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const state = location.state as MatchState | null

  useEffect(() => {
    if (!state?.matchId) navigate('/app', { replace: true })
  }, [state, navigate])

  if (!state?.matchId) return null

  const myAvatar = user?.avatar_url
    ? user.avatar_url.startsWith('/uploads/')
      ? `http://localhost:8000${user.avatar_url}`
      : user.avatar_url
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id ?? 'me'}`

  const theirAvatar =
    state.otherUserAvatar ??
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${state.otherUserName}`

  return (
    <div className="min-h-screen bg-spur-darker flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-spur-purple/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-spur-pink/15 rounded-full blur-[100px]" />
      </div>

      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0.5],
            x: (Math.random() - 0.5) * 300,
            y: (Math.random() - 0.5) * 400,
          }}
          transition={{ duration: 2, delay: i * 0.1, repeat: Infinity, repeatDelay: 3 }}
          className="absolute w-2 h-2 rounded-full pointer-events-none"
          style={{ background: i % 2 === 0 ? '#7c3aed' : '#ec4899', left: '50%', top: '40%' }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center"
      >
        <div className="flex items-center justify-center mb-8">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-spur-purple"
          >
            <img src={myAvatar} alt="You" className="w-full h-full object-cover" />
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-spur-purple to-spur-pink flex items-center justify-center -mx-3 z-10 text-lg"
          >
            💫
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-spur-pink"
          >
            <img src={theirAvatar} alt={state.otherUserName} className="w-full h-full object-cover" />
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-3xl font-bold text-white mb-2"
        >
          It's a <span className="gradient-text">Spur!</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-spur-muted text-sm mb-2"
        >
          You and <span className="text-white font-medium">{state.otherUserName}</span> share the same intent
        </motion.p>

        {(state.intentType || state.distanceKm !== undefined) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="inline-block px-3 py-1 rounded-full bg-spur-purple/10 border border-spur-purple/30 text-xs text-spur-purple mb-8"
          >
            {state.intentType && <span>{state.intentType.replace(/_/g, ' ')}</span>}
            {state.distanceKm !== undefined && <span> &middot; {state.distanceKm.toFixed(1)}km away</span>}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col gap-3"
        >
          <button
            onClick={() => navigate(`/chat/${state.matchId}`, { replace: true })}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-spur-purple to-spur-pink text-white font-semibold hover:opacity-90 transition-opacity glow-purple"
          >
            <MessageCircle size={18} />
            Send a Message
          </button>
          <button
            onClick={() => navigate('/app')}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-spur-border text-spur-muted hover:text-white hover:border-spur-border/80 transition-colors"
          >
            <X size={18} />
            Keep Browsing
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
