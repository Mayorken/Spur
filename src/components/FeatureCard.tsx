import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  delay?: number
}

export default function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="p-6 rounded-2xl bg-spur-card border border-spur-border/50 hover:border-spur-purple/50 transition-colors group"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-spur-purple/20 to-spur-pink/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-spur-muted text-sm leading-relaxed">{description}</p>
    </motion.div>
  )
}
