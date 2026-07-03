import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass, Radio, MessageCircle, User, Crown } from 'lucide-react'
import { useUnreadCount } from '../hooks/useUnreadCount'

const tabs: { path: string; icon: React.ElementType; label: string; gold?: boolean }[] = [
  { path: '/app', icon: Compass, label: 'Discover' },
  { path: '/nearby', icon: Radio, label: 'Nearby' },
  { path: '/messages', icon: MessageCircle, label: 'Messages' },
  { path: '/vip', icon: Crown, label: 'VIP', gold: true },
  { path: '/profile', icon: User, label: 'Profile' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const unread = useUnreadCount()

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
              <div className="relative">
                <Icon
                  size={22}
                  className={
                    tab.gold
                      ? isActive ? 'text-yellow-400' : 'text-yellow-600'
                      : isActive ? 'text-spur-purple' : 'text-spur-muted'
                  }
                />
                {tab.path === '/messages' && unread > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-spur-pink text-white text-[9px] font-bold flex items-center justify-center leading-none">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] ${
                  tab.gold
                    ? isActive ? 'text-yellow-400 font-medium' : 'text-yellow-600'
                    : isActive ? 'text-spur-purple font-medium' : 'text-spur-muted'
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
