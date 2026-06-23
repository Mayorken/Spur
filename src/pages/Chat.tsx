import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Phone, Video, MoreVertical, Send, Shield, AlertTriangle, Star } from 'lucide-react'
import RatingModal from '../components/RatingModal'
import { matches, type ChatMessageResponse, type ConversationResponse } from '../utils/api'
import { useWebSocket } from '../hooks/useWebSocket'
import { useAuth } from '../context/AuthContext'

export default function Chat() {
  const { id: matchId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [messages, setMessages] = useState<ChatMessageResponse[]>([])
  const [conversation, setConversation] = useState<ConversationResponse | null>(null)
  const [input, setInput] = useState('')
  const [showSafety, setShowSafety] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const { send } = useWebSocket(
    useCallback(
      (msg: Record<string, unknown>) => {
        if (msg.type === 'chat_message' && msg.from_user_id) {
          // Real-time message arrived — add as a pseudo-message and then re-fetch
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              match_id: matchId ?? '',
              sender_id: msg.from_user_id as string,
              content: msg.content as string,
              is_read: false,
              created_at: msg.timestamp as string,
            },
          ])
        }
      },
      [matchId],
    ),
  )

  // Load conversation info and message history
  useEffect(() => {
    if (!matchId) return

    Promise.all([matches.conversations(), matches.messages(matchId)])
      .then(([convs, msgs]) => {
        const conv = convs.find((c) => c.match_id === matchId)
        setConversation(conv ?? null)
        setMessages(msgs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [matchId])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !matchId || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    try {
      const msg = await matches.sendMessage(matchId, text)
      setMessages((prev) => [...prev, msg])

      // Also relay via WebSocket to the other user
      if (conversation?.other_user_id) {
        send({
          type: 'chat_message',
          target_user_id: conversation.other_user_id,
          content: text,
        })
      }
    } catch {
      setInput(text) // restore on failure
    } finally {
      setSending(false)
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const otherName = conversation?.other_user_name ?? 'User'
  const otherAvatar =
    conversation?.other_user_avatar ??
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${conversation?.other_user_id ?? 'user'}`

  return (
    <div className="min-h-screen bg-spur-darker flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-spur-darker/95 backdrop-blur-xl border-b border-spur-border/30">
        <div className="px-3 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/messages')}
            className="p-1.5 rounded-full hover:bg-spur-card transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>

          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-spur-border/50">
                <img src={otherAvatar} alt={otherName} className="w-full h-full object-cover" />
              </div>
              {conversation?.is_online && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-spur-darker" />
              )}
            </div>
            <div>
              <h2 className="text-white font-medium text-sm">{otherName}</h2>
              <span className="text-[10px] text-green-400">
                {conversation?.is_online ? 'Online now' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-spur-card transition-colors">
              <Phone size={16} className="text-spur-muted" />
            </button>
            <button className="p-2 rounded-full hover:bg-spur-card transition-colors">
              <Video size={16} className="text-spur-muted" />
            </button>
            <button
              onClick={() => setShowRating(true)}
              className="p-2 rounded-full hover:bg-spur-card transition-colors"
            >
              <Star size={16} className="text-yellow-400" />
            </button>
            <button className="p-2 rounded-full hover:bg-spur-card transition-colors">
              <MoreVertical size={16} className="text-spur-muted" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-2 flex items-center justify-center gap-2">
          <Shield size={10} className="text-green-400" />
          <span className="text-[10px] text-spur-muted">
            Chat auto-clears in 24h &middot; Tap for safety tools
          </span>
          <button
            onClick={() => setShowSafety(true)}
            className="text-[10px] text-spur-purple font-medium"
          >
            Safety
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <div className="text-center py-4">
          <span className="px-3 py-1.5 rounded-full bg-spur-purple/10 border border-spur-purple/20 text-[10px] text-spur-purple">
            Matched via Spur
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 rounded-full border-2 border-spur-purple border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-spur-muted text-sm py-8">
            Say hi to {otherName}!
          </p>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === user?.id
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                    isMe
                      ? 'bg-gradient-to-br from-spur-purple to-spur-pink text-white rounded-br-md'
                      : 'bg-spur-card border border-spur-border/50 text-spur-text rounded-bl-md'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-[9px] mt-1 ${isMe ? 'text-white/60' : 'text-spur-muted'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </motion.div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-spur-darker border-t border-spur-border/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full bg-spur-card border border-spur-border/50">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm text-white placeholder-spur-muted outline-none"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-spur-purple to-spur-pink flex items-center justify-center disabled:opacity-50"
          >
            <Send size={16} className="text-white" />
          </motion.button>
        </div>
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRating && (
          <RatingModal
            user={{ name: otherName, imageUrl: otherAvatar }}
            onSubmit={() => setShowRating(false)}
            onClose={() => setShowRating(false)}
          />
        )}
      </AnimatePresence>

      {/* Safety Modal */}
      {showSafety && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
          onClick={() => setShowSafety(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-spur-dark rounded-3xl p-6 border border-spur-border"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Safety Tools</h3>
            <p className="text-spur-muted text-xs text-center mb-6">
              Your safety is our priority. Use these tools anytime.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
              >
                Panic Button — Exit Now
              </button>
              <button className="w-full py-3 rounded-xl bg-spur-card border border-spur-border text-white text-sm font-medium hover:bg-spur-card/80 transition-colors">
                Report User
              </button>
              <button className="w-full py-3 rounded-xl bg-spur-card border border-spur-border text-white text-sm font-medium hover:bg-spur-card/80 transition-colors">
                Block & Clear Chat
              </button>
              <button onClick={() => setShowSafety(false)} className="w-full py-3 text-spur-muted text-sm">
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
