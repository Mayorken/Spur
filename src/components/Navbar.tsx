import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-spur-darker/80 backdrop-blur-xl border-b border-spur-border/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-spur-purple to-spur-pink" />
          <span className="text-xl font-bold tracking-tight">Spur</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-spur-muted hover:text-white transition-colors text-sm">
            Features
          </a>
          <a href="#how-it-works" className="text-spur-muted hover:text-white transition-colors text-sm">
            How It Works
          </a>
          <a href="#safety" className="text-spur-muted hover:text-white transition-colors text-sm">
            Safety
          </a>
          <Link
            to="/onboarding"
            className="px-5 py-2 rounded-full bg-gradient-to-r from-spur-purple to-spur-pink text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-white"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-spur-dark border-b border-spur-border"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              <a href="#features" className="text-spur-muted hover:text-white transition-colors" onClick={() => setIsOpen(false)}>
                Features
              </a>
              <a href="#how-it-works" className="text-spur-muted hover:text-white transition-colors" onClick={() => setIsOpen(false)}>
                How It Works
              </a>
              <a href="#safety" className="text-spur-muted hover:text-white transition-colors" onClick={() => setIsOpen(false)}>
                Safety
              </a>
              <Link
                to="/onboarding"
                className="px-5 py-3 rounded-full bg-gradient-to-r from-spur-purple to-spur-pink text-white text-sm font-medium text-center"
                onClick={() => setIsOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
