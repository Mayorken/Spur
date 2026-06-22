import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import MessageItem from '../components/MessageItem'
import { mockConversations, mockMatches } from '../utils/mockData'

export default function Messages() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-spur-darker pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-spur-darker/95 backdrop-blur-xl border-b border-spur-border/30">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-white">Messages</h1>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-spur-card border border-spur-border/50">
            <Search size={16} className="text-spur-muted" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="flex-1 bg-transparent text-sm text-white placeholder-spur-muted outline-none"
            />
          </div>
        </div>
      </div>

      {/* Matches row - like Mingle2's top match avatars */}
      <div className="px-4 py-4 border-b border-spur-border/20">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">New Matches</h2>
          <span className="text-xs text-spur-purple">{mockMatches.length} new</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {mockMatches.map((match, i) => (
            <motion.button
              key={match.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(`/chat/${match.id}`)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-br from-spur-purple to-spur-pink">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-spur-darker">
                    <img
                      src={match.avatar}
                      alt={match.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-spur-muted">{match.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Conversations list */}
      <div className="px-2 py-2">
        <h2 className="text-sm font-semibold text-white px-2 py-2">Conversations</h2>
        {mockConversations.map((conversation, i) => (
          <motion.div
            key={conversation.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <MessageItem
              name={conversation.name}
              avatar={conversation.avatar}
              lastMessage={conversation.lastMessage}
              time={conversation.time}
              unread={conversation.unread}
              online={conversation.online}
              onClick={() => navigate(`/chat/${conversation.id}`)}
            />
          </motion.div>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
