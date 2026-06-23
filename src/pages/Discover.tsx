import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Filter, Zap } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import ProfileCard from '../components/ProfileCard'
import ProximityAlert from '../components/ProximityAlert'
import { mockProfiles, mockNearbyUsers, mockUserExperienceTags } from '../utils/mockData'

const intentFilters = ['All', 'Casual', 'Romantic', 'Intimacy', 'Hook Up']

export default function Discover() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeFilter, setActiveFilter] = useState('All')
  const [showIntentSelector, setShowIntentSelector] = useState(false)
  const [proximityAlert, setProximityAlert] = useState<typeof mockNearbyUsers[0] | null>(null)
  const [matchedUser, setMatchedUser] = useState<string | null>(null)

  const dismissAlert = useCallback(() => setProximityAlert(null), [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const randomUser = mockNearbyUsers[Math.floor(Math.random() * mockNearbyUsers.length)]
      setProximityAlert(randomUser)
    }, 8000)
    return () => clearTimeout(timer)
  }, [])

  const handleAccept = (userId: string) => {
    setMatchedUser(userId)
    setProximityAlert(null)
  }

  const handleDecline = () => {
    setProximityAlert(null)
  }

  const handleLike = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, mockProfiles.length - 1))
  }

  const handlePass = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, mockProfiles.length - 1))
  }

  const currentProfile = mockProfiles[currentIndex]

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
              <span className="text-[10px] text-spur-muted">~0.5km</span>
            </div>
            <button
              onClick={() => setShowIntentSelector(!showIntentSelector)}
              className="p-2 rounded-full bg-spur-card border border-spur-border/50"
            >
              <Filter size={16} className="text-spur-muted" />
            </button>
          </div>
        </div>

        {/* Intent filter tabs */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {intentFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter
                  ? 'bg-gradient-to-r from-spur-purple to-spur-pink text-white'
                  : 'bg-spur-card border border-spur-border/50 text-spur-muted hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Main card area */}
      <div className="px-4 pt-6 pb-4">
        {/* Active intent banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-5 px-4 py-2 rounded-full bg-spur-purple/10 border border-spur-purple/30 mx-auto w-fit"
        >
          <Zap size={14} className="text-spur-purple" />
          <span className="text-xs text-spur-purple font-medium">
            Your intent: Casual Connection
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </motion.div>

        {/* Profile card */}
        <AnimatePresence mode="wait">
          {currentProfile && (
            <motion.div
              key={currentProfile.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <ProfileCard
                name={currentProfile.name}
                age={currentProfile.age}
                distance={currentProfile.distance}
                intent={currentProfile.intent}
                imageUrl={currentProfile.imageUrl}
                verified={currentProfile.verified}
                experienceTags={mockUserExperienceTags[currentProfile.id] || []}
                onLike={handleLike}
                onPass={handlePass}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {currentIndex >= mockProfiles.length - 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-full bg-spur-card border border-spur-border mx-auto mb-4 flex items-center justify-center">
              <Zap size={24} className="text-spur-purple" />
            </div>
            <p className="text-white font-medium mb-1">No more nearby</p>
            <p className="text-spur-muted text-sm">Check back soon or expand your radius</p>
          </motion.div>
        )}
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
              <h3 className="text-lg font-semibold text-white mb-4">Set Your Intent</h3>
              <p className="text-spur-muted text-sm mb-6">What are you open to right now?</p>

              <div className="space-y-3">
                {[
                  { label: 'Open to Intimacy', emoji: '🔥', desc: 'Physical connection, mutual desire' },
                  { label: 'Looking to Hook Up', emoji: '⚡', desc: 'No strings, just vibes' },
                  { label: 'Casual Connection', emoji: '✨', desc: 'See where things go' },
                  { label: 'Romantic', emoji: '💜', desc: 'Get to know each other deeper' },
                ].map((intent) => (
                  <button
                    key={intent.label}
                    onClick={() => setShowIntentSelector(false)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-spur-card border border-spur-border/50 hover:border-spur-purple/50 transition-colors text-left"
                  >
                    <span className="text-2xl">{intent.emoji}</span>
                    <div>
                      <p className="text-white font-medium text-sm">{intent.label}</p>
                      <p className="text-spur-muted text-xs">{intent.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proximity Alert Popup */}
      <AnimatePresence>
        {proximityAlert && (
          <ProximityAlert
            user={proximityAlert}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onClose={dismissAlert}
          />
        )}
      </AnimatePresence>

      {/* Match accepted toast */}
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
              <p className="text-white font-medium text-sm">Connection accepted!</p>
              <p className="text-white/70 text-xs">You can now chat with this person</p>
            </div>
            <button
              onClick={() => setMatchedUser(null)}
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
