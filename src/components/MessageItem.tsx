import { motion } from 'framer-motion'

interface MessageItemProps {
  name: string
  avatar: string
  lastMessage: string
  time: string
  unread?: number
  online?: boolean
  onClick?: () => void
}

export default function MessageItem({
  name,
  avatar,
  lastMessage,
  time,
  unread = 0,
  online = false,
  onClick,
}: MessageItemProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 hover:bg-spur-card/50 transition-colors rounded-xl"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-spur-border/50">
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        </div>
        {online && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-spur-darker" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-medium text-sm truncate">{name}</h4>
          <span className="text-spur-muted text-[10px] flex-shrink-0">{time}</span>
        </div>
        <p className="text-spur-muted text-xs truncate mt-0.5">{lastMessage}</p>
      </div>

      {/* Unread badge */}
      {unread > 0 && (
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-spur-purple to-spur-pink flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[10px] font-bold">{unread}</span>
        </div>
      )}
    </motion.button>
  )
}
