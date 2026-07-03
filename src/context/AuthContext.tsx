import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { auth, users, type UserResponse } from '../utils/api'

interface AuthState {
  user: UserResponse | null
  token: string | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName: string, age?: number) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('spur_token'),
    loading: true,
  })

  useEffect(() => {
    const token = localStorage.getItem('spur_token')
    if (!token) {
      setState((s) => ({ ...s, loading: false }))
      return
    }
    users
      .me()
      .then((user) => setState({ user, token, loading: false }))
      .catch(() => {
        localStorage.removeItem('spur_token')
        localStorage.removeItem('spur_user')
        setState({ user: null, token: null, loading: false })
      })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await auth.login({ email, password })
    localStorage.setItem('spur_token', res.access_token)
    setState({ user: res.user, token: res.access_token, loading: false })
  }, [])

  const signup = useCallback(
    async (email: string, password: string, displayName: string, age?: number) => {
      const res = await auth.signup({ email, password, display_name: displayName, age })
      localStorage.setItem('spur_token', res.access_token)
      setState({ user: res.user, token: res.access_token, loading: false })
    },
    [],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('spur_token')
    localStorage.removeItem('spur_onboarded')
    setState({ user: null, token: null, loading: false })
  }, [])

  const refreshUser = useCallback(async () => {
    const user = await users.me()
    setState((s) => ({ ...s, user }))
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
