import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass, Radio, MessageCircle, User } from 'lucide-react'

const tabs = [
  { path: '/app', icon: Compass, label: 'Discover' },
  { path: '/nearby', icon: Radio, label: 'Nearby' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-spur-darker/95 backdrop-blur-xl border-t border-spur-border/50 z-50">
      <div className="flex items-center justify-around px-4 py-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path
          const Icon = tab.icon

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-0.5 py-1 px-3"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-spur-purple to-spur-pink rounded-full"
                />
              )}
              <Icon
                size={22}
                className={isActive ? 'text-spur-purple' : 'text-spur-muted'}
              />
              <span
                className={`text-[10px] ${
                  isActive ? 'text-spur-purple font-medium' : 'text-spur-muted'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
      {/* Safe area spacer for mobile */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  )
}
