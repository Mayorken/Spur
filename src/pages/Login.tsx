import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type Mode = 'login' | 'signup'

export default function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(email, password)
        navigate('/app')
      } else {
        if (!displayName.trim()) {
          setError('Display name is required')
          setLoading(false)
          return
        }
        await signup(email, password, displayName, age ? Number(age) : undefined)
        navigate('/onboarding')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-spur-purple/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-spur-pink/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-sm w-full">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-10">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-spur-purple to-spur-pink flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">Spur</span>
        </Link>

        {/* Tab switcher */}
        <div className="flex bg-spur-card rounded-full p-1 border border-spur-border/50 mb-8">
          {(['login', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                mode === m
                  ? 'bg-gradient-to-r from-spur-purple to-spur-pink text-white'
                  : 'text-spur-muted'
              }`}
            >
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: mode === 'signup' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {mode === 'signup' && (
              <>
                <div>
                  <label className="text-xs text-spur-muted mb-1.5 block">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How you appear to others"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-spur-card border border-spur-border/50 text-white text-sm placeholder-spur-muted outline-none focus:border-spur-purple/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-spur-muted mb-1.5 block">Age (optional)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Your age"
                    min={18}
                    max={99}
                    className="w-full px-4 py-3 rounded-xl bg-spur-card border border-spur-border/50 text-white text-sm placeholder-spur-muted outline-none focus:border-spur-purple/60 transition-colors"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs text-spur-muted mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-spur-card border border-spur-border/50 text-white text-sm placeholder-spur-muted outline-none focus:border-spur-purple/60 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-spur-muted mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-spur-card border border-spur-border/50 text-white text-sm placeholder-spur-muted outline-none focus:border-spur-purple/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-spur-muted"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs text-center"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-spur-purple to-spur-pink text-white font-semibold text-sm disabled:opacity-60 transition-opacity mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </motion.button>
          </motion.form>
        </AnimatePresence>

        <p className="text-center text-spur-muted text-xs mt-6">
          By continuing you agree to our{' '}
          <span className="text-spur-purple">Terms</span> &amp;{' '}
          <span className="text-spur-purple">Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}
