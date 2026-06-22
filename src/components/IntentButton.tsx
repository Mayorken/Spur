import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface IntentButtonProps {
  onActivate?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export default function IntentButton({ onActivate, size = 'lg' }: IntentButtonProps) {
  const [isActive, setIsActive] = useState(false)
  const [showRipple, setShowRipple] = useState(false)

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-36 h-36',
    lg: 'w-48 h-48',
  }

  const handlePress = () => {
    setIsActive(!isActive)
    setShowRipple(true)
    setTimeout(() => setShowRipple(false), 1500)
    onActivate?.()
  }

  return (
    <div className="relative flex items-center justify-center">
      {/* Ripple effects */}
      <AnimatePresence>
        {showRipple && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, delay: i * 0.3 }}
                className={`absolute ${sizeClasses[size]} rounded-full border-2 ${
                  isActive ? 'border-spur-pink' : 'border-spur-purple'
                }`}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main button */}
      <motion.button
        onClick={handlePress}
        whileTap={{ scale: 0.95 }}
        className={`relative ${sizeClasses[size]} rounded-full flex items-center justify-center cursor-pointer ${
          isActive ? 'intent-pulse' : ''
        }`}
        style={{
          background: isActive
            ? 'linear-gradient(135deg, #ec4899, #7c3aed)'
            : 'linear-gradient(135deg, #7c3aed, #4c1d95)',
        }}
      >
        {/* Inner glow */}
        <div
          className={`absolute inset-2 rounded-full ${
            isActive ? 'bg-spur-pink/20' : 'bg-spur-purple/20'
          } backdrop-blur-sm`}
        />

        {/* Icon/Text */}
        <div className="relative z-10 flex flex-col items-center gap-1">
          <motion.div
            animate={isActive ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl"
          >
            {isActive ? '🔥' : '⚡'}
          </motion.div>
          <span className="text-white font-semibold text-sm">
            {isActive ? 'Active' : 'Tap to Spur'}
          </span>
        </div>

        {/* Outer ring */}
        <div
          className={`absolute inset-0 rounded-full border-2 ${
            isActive ? 'border-spur-pink/50' : 'border-spur-purple/50'
          }`}
        />
      </motion.button>
    </div>
  )
}
