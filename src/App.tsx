import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import Discover from './pages/Discover'
import Nearby from './pages/Nearby'
import Messages from './pages/Messages'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Match from './pages/Match'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/app" element={<Discover />} />
      <Route path="/nearby" element={<Nearby />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/chat/:id" element={<Chat />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/match" element={<Match />} />
    </Routes>
  )
}

export default App
