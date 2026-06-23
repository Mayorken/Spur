import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Send } from 'lucide-react'

interface RatingModalProps {
  user: {
    name: string
    imageUrl: string
  }
  onSubmit: (selectedTags: string[]) => void
  onClose: () => void
}

const availableTags = [
  { id: 'great_conversationalist', label: 'Great Conversationalist', emoji: '💬' },
  { id: 'head_master', label: 'Head Master', emoji: '👑' },
  { id: 'skilled_lover', label: 'Skilled Lover', emoji: '🔥' },
  { id: 'respectful', label: 'Respectful', emoji: '🤝' },
  { id: 'fun_energy', label: 'Fun Energy', emoji: '⚡' },
  { id: 'good_kisser', label: 'Good Kisser', emoji: '💋' },
  { id: 'generous', label: 'Generous', emoji: '💎' },
  { id: 'adventurous', label: 'Adventurous', emoji: '🌶️' },
  { id: 'clean_hygienic', label: 'Clean & Hygienic', emoji: '✨' },
  { id: 'knows_boundaries', label: 'Knows Boundaries', emoji: '🛡️' },
  { id: 'stamina_king', label: 'Stamina King', emoji: '💪' },
  { id: 'romantic', label: 'Romantic', emoji: '🌹' },
]

export default function RatingModal({ user, onSubmit, onClose }: RatingModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleTag = (tagId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) {
        next.delete(tagId)
      } else if (next.size < 3) {
        next.add(tagId)
      }
      return next
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-spur-dark rounded-t-3xl sm:rounded-3xl border-t sm:border border-spur-border/50 p-6 max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="w-12 h-1 rounded-full bg-spur-border mx-auto sm:hidden" />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-spur-purple/50">
            <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold">Rate {user.name}</h3>
            <p className="text-spur-muted text-xs">Select up to 3 experience tags</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-spur-card">
            <X size={18} className="text-spur-muted" />
          </button>
        </div>

        {/* Tags grid */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {availableTags.map((tag) => {
            const isSelected = selected.has(tag.id)
            return (
              <motion.button
                key={tag.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleTag(tag.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-spur-purple/15 border-spur-purple/50'
                    : 'bg-spur-card border-spur-border/30 hover:border-spur-border/60'
                }`}
              >
                <span className="text-lg">{tag.emoji}</span>
                <span className={`text-xs font-medium ${isSelected ? 'text-spur-purple' : 'text-white'}`}>
                  {tag.label}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-spur-card border border-spur-border/50 text-spur-muted text-sm font-medium"
          >
            Skip
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onSubmit(Array.from(selected))}
            disabled={selected.size === 0}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all ${
              selected.size > 0
                ? 'bg-gradient-to-r from-spur-purple to-spur-pink text-white'
                : 'bg-spur-card border border-spur-border/50 text-spur-muted cursor-not-allowed'
            }`}
          >
            <Send size={14} />
            Submit ({selected.size}/3)
          </motion.button>
        </div>

        <p className="text-center text-[10px] text-spur-muted mt-4">
          Only users you've connected with can rate each other. Ratings are anonymous.
        </p>
      </motion.div>
    </motion.div>
  )
}
