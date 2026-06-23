import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import MessageItem from '../components/MessageItem'
import { matches, type ConversationResponse, type MatchWithUser } from '../utils/api'

export default function Messages() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [newMatches, setNewMatches] = useState<MatchWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    Promise.all([matches.conversations(), matches.list()])
      .then(([convs, mlist]) => {
        setConversations(convs)
        // Show matches that haven't started a conversation yet
        const matchedIds = new Set(convs.map((c) => c.other_user_id))
        setNewMatches(mlist.filter((m) => !matchedIds.has(m.matched_user_id)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = conversations.filter(
    (c) =>
      search === '' || c.other_user_name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-spur-darker pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-spur-darker/95 backdrop-blur-xl border-b border-spur-border/30">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-white">Messages</h1>
        </div>

        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-spur-card border border-spur-border/50">
            <Search size={16} className="text-spur-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="flex-1 bg-transparent text-sm text-white placeholder-spur-muted outline-none"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-spur-purple border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* New Matches row */}
          {newMatches.length > 0 && (
            <div className="px-4 py-4 border-b border-spur-border/20">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-white">New Matches</h2>
                <span className="text-xs text-spur-purple">{newMatches.length} new</span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {newMatches.map((match, i) => (
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
                            src={
                              match.matched_user_avatar ??
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.matched_user_id}`
                            }
                            alt={match.matched_user_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-spur-muted">{match.matched_user_name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Conversations list */}
          <div className="px-2 py-2">
            {filtered.length > 0 ? (
              <>
                <h2 className="text-sm font-semibold text-white px-2 py-2">Conversations</h2>
                {filtered.map((conv, i) => (
                  <motion.div
                    key={conv.match_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <MessageItem
                      name={conv.other_user_name}
                      avatar={
                        conv.other_user_avatar ??
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.other_user_id}`
                      }
                      lastMessage={conv.last_message ?? 'Start the conversation'}
                      time={
                        conv.last_message_time
                          ? new Date(conv.last_message_time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''
                      }
                      unread={conv.unread_count}
                      online={conv.is_online}
                      onClick={() => navigate(`/chat/${conv.match_id}`)}
                    />
                  </motion.div>
                ))}
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-white font-medium mb-1">No conversations yet</p>
                <p className="text-spur-muted text-sm">Match with someone to start chatting</p>
              </div>
            )}
          </div>
        </>
      )}

      <BottomNav />
    </div>
  )
}
