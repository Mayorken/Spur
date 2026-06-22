import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Radio, MapPin, Users } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import RadarView from '../components/RadarView'
import { mockNearbyUsers } from '../utils/mockData'

export default function Nearby() {
  const [view, setView] = useState<'radar' | 'grid'>('radar')
  const navigate = useNavigate()

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
          <span className="text-white font-medium">{mockNearbyUsers.length} people</span> nearby share your intent
        </span>
      </div>

      {view === 'radar' ? (
        /* Radar View */
        <div className="px-4 py-8">
          <RadarView
            users={mockNearbyUsers}
            onUserTap={(user) => navigate(`/chat/${user.id}`)}
          />
          <p className="text-center text-spur-muted text-xs mt-6">
            Tap a person to connect
          </p>
        </div>
      ) : (
        /* Grid View - like Mingle2's "Who's Online" */
        <div className="px-4 py-4">
          <div className="grid grid-cols-3 gap-3">
            {mockNearbyUsers.map((user, i) => (
              <motion.button
                key={user.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/chat/${user.id}`)}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-spur-card border border-spur-border/30 hover:border-spur-purple/50 transition-colors"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-spur-border/50">
                    <img
                      src={user.imageUrl}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-spur-card" />
                </div>
                <div className="text-center">
                  <p className="text-white text-xs font-medium">{user.name}</p>
                  <div className="flex items-center gap-0.5 justify-center mt-0.5">
                    <MapPin size={8} className="text-spur-muted" />
                    <span className="text-[10px] text-spur-muted">{user.distance}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-spur-purple/10 text-[9px] text-spur-purple font-medium">
                  {user.intent.split(' ').slice(0, 2).join(' ')}
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
