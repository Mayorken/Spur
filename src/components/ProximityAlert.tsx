import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, X, Check, Zap } from 'lucide-react'

interface ProximityAlertProps {
  user: {
    id: string
    name: string
    imageUrl: string
    intent: string
    distance: string
  }
  onAccept: (userId: string) => void
  onDecline: (userId: string) => void
  onClose: () => void
}

export default function ProximityAlert({ user, onAccept, onDecline, onClose }: ProximityAlertProps) {
  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 40 }}
        transition={{ type: 'spring', damping: 20 }}
        className="w-full max-w-sm bg-spur-dark rounded-3xl border border-spur-border/50 overflow-hidden"
      >
        {/* Pulsing header */}
        <div className="relative bg-gradient-to-r from-spur-purple/30 to-spur-pink/30 px-6 pt-6 pb-4">
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <span className="text-[10px] text-spur-muted font-mono">{countdown}s</span>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10">
              <X size={16} className="text-spur-muted" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
            </div>
            <span className="text-xs font-medium text-green-400">Nearby Alert</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-spur-purple">
                <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-spur-purple flex items-center justify-center border-2 border-spur-dark">
                <Zap size={10} className="text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{user.name}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={12} className="text-spur-purple" />
                <span className="text-spur-muted text-xs">{user.distance} away</span>
              </div>
            </div>
          </div>
        </div>

        {/* Intent info */}
        <div className="px-6 py-4">
          <p className="text-spur-muted text-xs mb-2">Currently in</p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-spur-purple/15 border border-spur-purple/30">
            <Zap size={12} className="text-spur-purple" />
            <span className="text-sm font-medium text-spur-purple">{user.intent}</span>
          </div>
          <p className="text-spur-muted text-xs mt-3">
            This person is nearby and shares a matching intent. Connect now?
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onDecline(user.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-spur-card border border-spur-border/50 hover:border-red-500/50 transition-colors"
          >
            <X size={18} className="text-red-400" />
            <span className="text-red-400 font-medium text-sm">Decline</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onAccept(user.id)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-spur-purple to-spur-pink text-white font-medium text-sm"
          >
            <Check size={18} />
            <span>Accept</span>
          </motion.button>
        </div>

        {/* Countdown bar */}
        <div className="h-1 bg-spur-border/30">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 30, ease: 'linear' }}
            className="h-full bg-gradient-to-r from-spur-purple to-spur-pink"
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
