import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-spur-darker flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-spur-purple border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!token) return <Navigate to="/login" replace />

  return <>{children}</>
}
