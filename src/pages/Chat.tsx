import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Video, MoreVertical, Send, Shield, AlertTriangle } from 'lucide-react'
import { mockChatMessages } from '../utils/mockData'

export default function Chat() {
  const [messages, setMessages] = useState(mockChatMessages)
  const [input, setInput] = useState('')
  const [showSafety, setShowSafety] = useState(false)
  const navigate = useNavigate()

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages([
      ...messages,
      {
        id: String(messages.length + 1),
        sender: 'me',
        text: input,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    setInput('')
  }

  return (
    <div className="min-h-screen bg-spur-darker flex flex-col">
      {/* Chat header */}
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
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face"
                  alt="Sophia"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-spur-darker" />
            </div>
            <div>
              <h2 className="text-white font-medium text-sm">Sophia</h2>
              <span className="text-[10px] text-green-400">Online now</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-spur-card transition-colors">
              <Phone size={16} className="text-spur-muted" />
            </button>
            <button className="p-2 rounded-full hover:bg-spur-card transition-colors">
              <Video size={16} className="text-spur-muted" />
            </button>
            <button className="p-2 rounded-full hover:bg-spur-card transition-colors">
              <MoreVertical size={16} className="text-spur-muted" />
            </button>
          </div>
        </div>

        {/* Safety banner */}
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
        {/* Matched banner */}
        <div className="text-center py-4">
          <span className="px-3 py-1.5 rounded-full bg-spur-purple/10 border border-spur-purple/20 text-[10px] text-spur-purple">
            Matched via Casual Connection &middot; 0.3km
          </span>
        </div>

        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                msg.sender === 'me'
                  ? 'bg-gradient-to-br from-spur-purple to-spur-pink text-white rounded-br-md'
                  : 'bg-spur-card border border-spur-border/50 text-spur-text rounded-bl-md'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p
                className={`text-[9px] mt-1 ${
                  msg.sender === 'me' ? 'text-white/60' : 'text-spur-muted'
                }`}
              >
                {msg.time}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input area */}
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
            className="w-10 h-10 rounded-full bg-gradient-to-br from-spur-purple to-spur-pink flex items-center justify-center"
          >
            <Send size={16} className="text-white" />
          </motion.button>
        </div>
      </div>

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
              <button className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors">
                Panic Button — Exit Now
              </button>
              <button className="w-full py-3 rounded-xl bg-spur-card border border-spur-border text-white text-sm font-medium hover:bg-spur-card/80 transition-colors">
                Report User
              </button>
              <button className="w-full py-3 rounded-xl bg-spur-card border border-spur-border text-white text-sm font-medium hover:bg-spur-card/80 transition-colors">
                Block & Clear Chat
              </button>
              <button
                onClick={() => setShowSafety(false)}
                className="w-full py-3 text-spur-muted text-sm"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
