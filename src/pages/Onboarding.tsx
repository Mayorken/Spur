import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Shield, Zap, Heart, Eye } from 'lucide-react'

const steps = [
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

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      navigate('/app')
    }
  }

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-spur-purple/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-spur-pink/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Progress */}
        <div className="flex gap-2 mb-12">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= currentStep ? 'bg-gradient-to-r from-spur-purple to-spur-pink' : 'bg-spur-border'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <div className="w-24 h-24 rounded-full bg-spur-card border border-spur-border flex items-center justify-center mx-auto mb-8">
              {steps[currentStep].icon}
            </div>

            <h1 className="text-3xl font-bold text-white mb-3">
              {steps[currentStep].title}
            </h1>
            <p className="text-spur-purple font-medium mb-4">
              {steps[currentStep].subtitle}
            </p>
            <p className="text-spur-muted text-sm leading-relaxed max-w-sm mx-auto">
              {steps[currentStep].description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-16">
          <button
            onClick={prev}
            disabled={currentStep === 0}
            className="p-3 rounded-full border border-spur-border text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-spur-card transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <button
            onClick={next}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-spur-purple to-spur-pink text-white font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            {currentStep === steps.length - 1 ? 'Enter Spur' : 'Continue'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
