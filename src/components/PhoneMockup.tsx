import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface PhoneMockupProps {
  children: ReactNode
  className?: string
}

export default function PhoneMockup({ children, className = '' }: PhoneMockupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className={`relative mx-auto ${className}`}
    >
      {/* Phone frame */}
      <div className="relative w-[280px] h-[580px] md:w-[320px] md:h-[660px] rounded-[3rem] border-4 border-spur-border bg-spur-dark overflow-hidden shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-spur-darker rounded-b-2xl z-10" />
        
        {/* Screen content */}
        <div className="absolute inset-0 overflow-hidden">
          {children}
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full" />
      </div>
    </motion.div>
  )
}
