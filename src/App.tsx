import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Discover from './pages/Discover'
import Nearby from './pages/Nearby'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Match from './pages/Match'
import Premium from './pages/Premium'
import VipDirectory from './pages/VipDirectory'
import VipJoin from './pages/VipJoin'
import Admin from './pages/Admin'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import SafetyDashboard from './pages/SafetyDashboard'
import VibeCheck from './pages/VibeCheck'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/app" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
      <Route path="/nearby" element={<ProtectedRoute><Nearby /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/match" element={<ProtectedRoute><Match /></ProtectedRoute>} />
      <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
      <Route path="/premium/success" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
      <Route path="/vip" element={<ProtectedRoute><VipDirectory /></ProtectedRoute>} />
      <Route path="/vip/join" element={<ProtectedRoute><VipJoin /></ProtectedRoute>} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/safety" element={<ProtectedRoute><SafetyDashboard /></ProtectedRoute>} />
      <Route path="/vibe-check/:token" element={<VibeCheck />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
