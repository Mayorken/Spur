import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Phone, Video, MoreVertical, Send, Shield, AlertTriangle, Star } from 'lucide-react'
import RatingModal from '../components/RatingModal'
import CallModal from '../components/CallModal'
import { matches, ratings, safety, type ChatMessageResponse, type ConversationResponse } from '../utils/api'
import { useWebSocket } from '../hooks/useWebSocket'
import { useWebRTC } from '../hooks/useWebRTC'
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
  const [reportReason, setReportReason] = useState('')
  const [reportStep, setReportStep] = useState<'menu' | 'report' | 'done'>('menu')
  const [incomingCallFrom, setIncomingCallFrom] = useState<string | null>(null)
  const [callType, setCallType] = useState<'audio' | 'video'>('audio')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { callState, startCall, acceptCall, declineCall, endCall, setRemoteAnswer } = useWebRTC()

  const { send } = useWebSocket(
    useCallback(
      (msg: Record<string, unknown>) => {
        if (msg.type === 'chat_message' && msg.from_user_id) {
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
        } else if (msg.type === 'call_offer') {
          setIncomingCallFrom(msg.from_user_id as string)
          setCallType(msg.call_type as 'audio' | 'video')
        } else if (msg.type === 'call_answer') {
          setRemoteAnswer(msg.answer as string)
        }
      },
      [matchId, setRemoteAnswer],
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
            <button
              onClick={() => {
                setCallType('audio')
                startCall(conversation?.other_user_id ?? '')
              }}
              className="p-2 rounded-full hover:bg-spur-card transition-colors"
              title="Start audio call"
            >
              <Phone size={16} className="text-spur-muted hover:text-spur-purple transition-colors" />
            </button>
            <button
              onClick={() => {
                setCallType('video')
                startCall(conversation?.other_user_id ?? '')
              }}
              className="p-2 rounded-full hover:bg-spur-card transition-colors"
              title="Start video call"
            >
              <Video size={16} className="text-spur-muted hover:text-spur-purple transition-colors" />
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

      {/* Call Modal */}
      <CallModal
        callState={callState}
        otherName={otherName}
        otherAvatar={otherAvatar}
        isIncoming={!!incomingCallFrom}
        localStream={callState.localStream}
        remoteStream={callState.remoteStream}
        onAccept={() => {
          acceptCall('')
          setIncomingCallFrom(null)
        }}
        onDecline={() => {
          declineCall()
          setIncomingCallFrom(null)
        }}
        onEnd={() => {
          endCall()
          setIncomingCallFrom(null)
        }}
      />

      {/* Rating Modal */}
      <AnimatePresence>
        {showRating && conversation && (
          <RatingModal
            user={{ name: otherName, imageUrl: otherAvatar }}
            onSubmit={async (tags: string[]) => {
              await ratings.rate(conversation.other_user_id, tags)
              setShowRating(false)
            }}
            onClose={() => setShowRating(false)}
          />
        )}
      </AnimatePresence>

      {/* Safety Modal */}
      <AnimatePresence>
        {showSafety && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={() => { setShowSafety(false); setReportStep('menu') }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-spur-dark rounded-3xl p-6 border border-spur-border"
            >
              {reportStep === 'menu' && (
                <>
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle size={24} className="text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white text-center mb-2">Safety Tools</h3>
                  <p className="text-spur-muted text-xs text-center mb-6">Your safety is our priority.</p>
                  <div className="space-y-3">
                    <button
                      onClick={async () => {
                        await safety.panic()
                        navigate('/')
                      }}
                      className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
                    >
                      Panic Button — Exit Now
                    </button>
                    <button
                      onClick={() => setReportStep('report')}
                      className="w-full py-3 rounded-xl bg-spur-card border border-spur-border text-white text-sm font-medium hover:bg-spur-card/80 transition-colors"
                    >
                      Report {otherName}
                    </button>
                    <button
                      onClick={async () => {
                        if (!conversation) return
                        await safety.block(conversation.other_user_id)
                        navigate('/messages')
                      }}
                      className="w-full py-3 rounded-xl bg-spur-card border border-spur-border text-white text-sm font-medium hover:bg-spur-card/80 transition-colors"
                    >
                      Block & Leave Chat
                    </button>
                    <button onClick={() => setShowSafety(false)} className="w-full py-3 text-spur-muted text-sm">
                      Close
                    </button>
                  </div>
                </>
              )}

              {reportStep === 'report' && (
                <>
                  <h3 className="text-lg font-semibold text-white text-center mb-4">Report {otherName}</h3>
                  <p className="text-spur-muted text-xs text-center mb-4">Select a reason:</p>
                  <div className="space-y-2 mb-4">
                    {['harassment', 'fake', 'spam', 'unsafe', 'underage', 'other'].map((r) => (
                      <button
                        key={r}
                        onClick={() => setReportReason(r)}
                        className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-colors capitalize ${
                          reportReason === r
                            ? 'bg-spur-purple/20 border-spur-purple text-white'
                            : 'bg-spur-card border-spur-border text-spur-muted'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={!reportReason}
                    onClick={async () => {
                      if (!conversation || !reportReason) return
                      await safety.report(conversation.other_user_id, reportReason)
                      setReportStep('done')
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-spur-purple to-spur-pink text-white text-sm font-medium disabled:opacity-40"
                  >
                    Submit Report
                  </button>
                  <button onClick={() => setReportStep('menu')} className="w-full py-2 text-spur-muted text-sm mt-2">
                    Back
                  </button>
                </>
              )}

              {reportStep === 'done' && (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <Shield size={24} className="text-green-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Report Submitted</h3>
                  <p className="text-spur-muted text-xs mb-6">Thank you. Our safety team will review this report.</p>
                  <button
                    onClick={() => { setShowSafety(false); setReportStep('menu') }}
                    className="w-full py-3 rounded-xl bg-spur-card border border-spur-border text-white text-sm"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
