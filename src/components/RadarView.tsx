import { motion } from 'framer-motion'

interface NearbyUser {
  id: string
  name: string
  imageUrl: string
  intent: string
  distance: string
}

interface RadarViewProps {
  users: NearbyUser[]
  onUserTap?: (user: NearbyUser) => void
}

export default function RadarView({ users, onUserTap }: RadarViewProps) {
  // Place users in a circle around center
  const getPosition = (index: number, total: number, radius: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    }
  }

  return (
    <div className="relative w-80 h-80 mx-auto">
      {/* Orbit rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="w-40 h-40 rounded-full border border-spur-border/20"
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="w-60 h-60 rounded-full border border-spur-border/15"
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-76 h-76 rounded-full border border-spur-border/10" />
      </div>

      {/* Pulse from center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 rounded-full bg-spur-purple/20"
        />
      </div>

      {/* Center - current user */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-spur-purple to-spur-pink flex items-center justify-center shadow-lg glow-purple">
          <span className="text-white text-sm font-semibold">You</span>
        </div>
      </div>

      {/* Nearby users positioned in orbits */}
      {users.slice(0, 7).map((user, i) => {
        const orbit = i < 4 ? 90 : 130
        const pos = getPosition(i < 4 ? i : i - 4, i < 4 ? 4 : 3, orbit)
        return (
          <motion.button
            key={user.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
            onClick={() => onUserTap?.(user)}
            className="absolute z-10 group"
            style={{
              left: `calc(50% + ${pos.x}px - 24px)`,
              top: `calc(50% + ${pos.y}px - 24px)`,
            }}
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-spur-purple/50 group-hover:border-spur-pink group-hover:scale-110 transition-all">
                <img
                  src={user.imageUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Online indicator */}
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-spur-darker" />
              {/* Name tooltip */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[9px] text-white whitespace-nowrap bg-spur-dark/90 px-1.5 py-0.5 rounded-full border border-spur-border/50">
                  {user.name}
                </span>
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
