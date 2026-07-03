import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Navigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Shield, Zap, Heart, Eye } from 'lucide-react'
import { users } from '../utils/api'
import { useAuth } from '../context/AuthContext'

const slides = [
  {
    icon: <Zap className="text-spur-purple" size={48} />,
    title: 'Welcome to Spur',
    subtitle: 'Connection, reimagined around real-time intent and mutual consent.',
    description: 'No swiping. No waiting. Just honest, instant connection with people who want what you want.',
  },
  {
    icon: <Heart className="text-spur-pink" size={48} />,
    title: 'Set Your Intent',
    subtitle: 'Tell us what you are open to right now.',
    description: 'Choose from intents like casual connection, romantic, or intimacy. Your intent can change any time.',
  },
  {
    icon: <Eye className="text-spur-purple" size={48} />,
    title: 'Privacy First',
    subtitle: 'No public profiles. No breadcrumbs.',
    description: 'Your location is approximate. Chat history auto-clears. No one sees you unless you want them to.',
  },
  {
    icon: <Shield className="text-green-400" size={48} />,
    title: 'Safety Always',
    subtitle: 'Verified. Protected. Respected.',
    description: 'Every user is verified. AI catches fakes. A panic button is always one tap away.',
  },
]

const TOTAL_STEPS = slides.length + 1

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  // Skip onboarding if already completed
  if (localStorage.getItem('spur_onboarded')) return <Navigate to="/app" replace />

  const isProfileStep = currentStep === slides.length

  const next = () => {
    if (currentStep < slides.length) setCurrentStep(currentStep + 1)
  }

  const prev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const finish = async () => {
    if (!displayName.trim()) return
    setSaving(true)
    try {
      await users.updateMe({
        display_name: displayName.trim(),
        ...(age ? { age: parseInt(age) } : {}),
      })
      await refreshUser()
    } catch {
      // profile can be updated from Profile page
    } finally {
      setSaving(false)
      localStorage.setItem('spur_onboarded', '1')
      navigate('/app', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-spur-purple/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-spur-pink/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        <div className="flex gap-2 mb-12">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= currentStep ? 'bg-gradient-to-r from-spur-purple to-spur-pink' : 'bg-spur-border'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!isProfileStep ? (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="w-24 h-24 rounded-full bg-spur-card border border-spur-border flex items-center justify-center mx-auto mb-8">
                {slides[currentStep].icon}
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">{slides[currentStep].title}</h1>
              <p className="text-spur-purple font-medium mb-4">{slides[currentStep].subtitle}</p>
              <p className="text-spur-muted text-sm leading-relaxed max-w-sm mx-auto">
                {slides[currentStep].description}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-white mb-2">Quick intro</h1>
              <p className="text-spur-muted text-sm mb-8">How should others see you?</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-spur-muted mb-1.5 block">Display name *</label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex"
                    maxLength={30}
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-spur-card border border-spur-border/50 text-white placeholder-spur-muted outline-none focus:border-spur-purple/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-spur-muted mb-1.5 block">Age (optional)</label>
                  <input
                    value={age}
                    onChange={(e) => setAge(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 25"
                    maxLength={2}
                    inputMode="numeric"
                    className="w-full px-4 py-3 rounded-xl bg-spur-card border border-spur-border/50 text-white placeholder-spur-muted outline-none focus:border-spur-purple/60 transition-colors"
                  />
                </div>
                <p className="text-spur-muted text-[11px]">
                  You can always update this from your profile. Your name is only visible to mutual matches.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mt-16">
          <button
            onClick={prev}
            disabled={currentStep === 0}
            className="p-3 rounded-full border border-spur-border text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-spur-card transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          {!isProfileStep ? (
            <button
              onClick={next}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-spur-purple to-spur-pink text-white font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              Continue
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={!displayName.trim() || saving}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-spur-purple to-spur-pink text-white font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Enter Spur'}
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
