import { motion } from 'framer-motion'
import { Star, Award, Crown, Flame } from 'lucide-react'

export interface ExperienceTag {
  id: string
  label: string
  emoji: string
  count: number
  rank: 'bronze' | 'silver' | 'gold' | 'diamond'
}

const rankConfig = {
  bronze: {
    label: 'Bronze',
    color: 'from-amber-700 to-amber-600',
    border: 'border-amber-700/50',
    bg: 'bg-amber-900/20',
    text: 'text-amber-500',
    icon: Star,
    minCount: 1,
  },
  silver: {
    label: 'Silver',
    color: 'from-gray-400 to-gray-300',
    border: 'border-gray-400/50',
    bg: 'bg-gray-500/10',
    text: 'text-gray-300',
    icon: Award,
    minCount: 5,
  },
  gold: {
    label: 'Gold',
    color: 'from-yellow-500 to-amber-400',
    border: 'border-yellow-500/50',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    icon: Crown,
    minCount: 15,
  },
  diamond: {
    label: 'Diamond',
    color: 'from-cyan-400 to-blue-400',
    border: 'border-cyan-400/50',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-300',
    icon: Flame,
    minCount: 30,
  },
}

function ExperienceCard({ tag }: { tag: ExperienceTag }) {
  const config = rankConfig[tag.rank]
  const RankIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`relative p-3 rounded-2xl ${config.bg} border ${config.border} cursor-default`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{tag.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">{tag.label}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <RankIcon size={10} className={config.text} />
            <span className={`text-[9px] font-medium ${config.text}`}>{config.label}</span>
          </div>
        </div>
      </div>

      {/* Rating bar */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-1 rounded-full bg-spur-border/30 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((tag.count / rankConfig[nextRank(tag.rank)].minCount) * 100, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full bg-gradient-to-r ${config.color}`}
          />
        </div>
        <span className="text-[9px] text-spur-muted font-mono">{tag.count}x</span>
      </div>
    </motion.div>
  )
}

function nextRank(rank: ExperienceTag['rank']): ExperienceTag['rank'] {
  const order: ExperienceTag['rank'][] = ['bronze', 'silver', 'gold', 'diamond']
  const idx = order.indexOf(rank)
  return order[Math.min(idx + 1, order.length - 1)]
}

export default function ExperienceCards({ tags }: { tags: ExperienceTag[] }) {
  if (tags.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-spur-muted uppercase tracking-wider">
          Experience Cards
        </h3>
        <span className="text-[10px] text-spur-muted">{tags.length} tags earned</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {tags.map((tag) => (
          <ExperienceCard key={tag.id} tag={tag} />
        ))}
      </div>
    </div>
  )
}
