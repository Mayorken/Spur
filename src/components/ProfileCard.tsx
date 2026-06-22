import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, X, Star, MapPin, Shield } from 'lucide-react'

interface ProfileCardProps {
  name: string
  age: number
  distance: string
  intent: string
  imageUrl: string
  verified?: boolean
  onLike?: () => void
  onPass?: () => void
  onSuperLike?: () => void
}

export default function ProfileCard({
  name,
  age,
  distance,
  intent,
  imageUrl,
  verified = false,
  onLike,
  onPass,
  onSuperLike,
}: ProfileCardProps) {
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null)

  const handleLike = () => {
    setExiting('right')
    setTimeout(() => onLike?.(), 300)
  }

  const handlePass = () => {
    setExiting('left')
    setTimeout(() => onPass?.(), 300)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          x: exiting === 'left' ? -300 : exiting === 'right' ? 300 : 0,
          rotate: exiting === 'left' ? -15 : exiting === 'right' ? 15 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-sm mx-auto aspect-[3/4] rounded-3xl overflow-hidden bg-spur-card border border-spur-border/50"
      >
        {/* Profile image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Intent badge */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1.5 rounded-full bg-spur-purple/80 backdrop-blur-sm text-white text-xs font-medium">
            {intent}
          </span>
        </div>

        {/* Verified badge */}
        {verified && (
          <div className="absolute top-4 right-4">
            <div className="w-8 h-8 rounded-full bg-green-500/20 backdrop-blur-sm flex items-center justify-center">
              <Shield size={16} className="text-green-400" />
            </div>
          </div>
        )}

        {/* Profile info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">
                {name}, {age}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={12} className="text-spur-muted" />
                <span className="text-spur-muted text-xs">{distance} away</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-4 mt-5">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handlePass}
              className="w-14 h-14 rounded-full bg-spur-dark/80 backdrop-blur-sm border border-spur-border/50 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
            >
              <X size={24} className="text-red-400" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onSuperLike}
              className="w-12 h-12 rounded-full bg-spur-dark/80 backdrop-blur-sm border border-spur-border/50 flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/50 transition-colors"
            >
              <Star size={20} className="text-blue-400" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-spur-purple to-spur-pink flex items-center justify-center glow-purple"
            >
              <Heart size={24} className="text-white" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
