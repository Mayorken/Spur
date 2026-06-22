import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Shield,
  Eye,
  MapPin,
  Bell,
  Moon,
  LogOut,
  ChevronRight,
  Camera,
  Edit3,
} from 'lucide-react'
import BottomNav from '../components/BottomNav'

export default function Profile() {
  const [privacyMode, setPrivacyMode] = useState(true)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-spur-darker pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-spur-darker/95 backdrop-blur-xl border-b border-spur-border/30">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">Profile</h1>
          <button className="p-2 rounded-full hover:bg-spur-card transition-colors">
            <Settings size={18} className="text-spur-muted" />
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div className="px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-6 rounded-3xl bg-spur-card border border-spur-border/50"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-spur-purple/50">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-spur-purple flex items-center justify-center border-2 border-spur-card">
                <Camera size={14} className="text-white" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-white mt-4">You</h2>
            <p className="text-spur-muted text-sm mt-1">@yourhandle</p>

            {/* Verification badge */}
            <div className="flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
              <Shield size={12} className="text-green-400" />
              <span className="text-[10px] text-green-400 font-medium">Verified</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-spur-border/30">
            <div className="text-center">
              <p className="text-xl font-bold text-white">12</p>
              <p className="text-[10px] text-spur-muted">Matches</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">5</p>
              <p className="text-[10px] text-spur-muted">Connections</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">89%</p>
              <p className="text-[10px] text-spur-muted">Trust Score</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Current Intent */}
      <div className="px-4 mb-4">
        <div className="p-4 rounded-2xl bg-spur-purple/10 border border-spur-purple/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-spur-muted mb-1">Current Intent</p>
              <p className="text-white font-medium text-sm flex items-center gap-2">
                <span className="text-lg">✨</span> Casual Connection
              </p>
            </div>
            <button className="px-3 py-1.5 rounded-full bg-spur-purple/20 text-spur-purple text-xs font-medium">
              Change
            </button>
          </div>
        </div>
      </div>

      {/* Settings list */}
      <div className="px-4 space-y-2">
        <h3 className="text-xs font-medium text-spur-muted uppercase tracking-wider px-2 mb-2">
          Privacy & Safety
        </h3>

        <SettingItem
          icon={<Eye size={18} className="text-spur-purple" />}
          label="Ghost Mode"
          description="Browse invisibly"
          trailing={
            <Toggle checked={privacyMode} onChange={setPrivacyMode} />
          }
        />
        <SettingItem
          icon={<MapPin size={18} className="text-spur-purple" />}
          label="Location Radius"
          description="0.5km"
          trailing={<ChevronRight size={16} className="text-spur-muted" />}
        />
        <SettingItem
          icon={<Shield size={18} className="text-green-400" />}
          label="Safety Preferences"
          description="ID verified, panic button on"
          trailing={<ChevronRight size={16} className="text-spur-muted" />}
        />
        <SettingItem
          icon={<Bell size={18} className="text-spur-purple" />}
          label="Notifications"
          description="Matches & messages"
          trailing={<ChevronRight size={16} className="text-spur-muted" />}
        />
        <SettingItem
          icon={<Edit3 size={18} className="text-spur-purple" />}
          label="Edit Profile"
          description="Photos, bio, preferences"
          trailing={<ChevronRight size={16} className="text-spur-muted" />}
        />
        <SettingItem
          icon={<Moon size={18} className="text-spur-purple" />}
          label="Appearance"
          description="Dark mode"
          trailing={<ChevronRight size={16} className="text-spur-muted" />}
        />

        <div className="pt-4">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-red-500/5 transition-colors"
          >
            <LogOut size={18} className="text-red-400" />
            <span className="text-red-400 text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

function SettingItem({
  icon,
  label,
  description,
  trailing,
}: {
  icon: React.ReactNode
  label: string
  description: string
  trailing: React.ReactNode
}) {
  return (
    <button className="w-full flex items-center gap-3 p-3 rounded-2xl bg-spur-card border border-spur-border/30 hover:border-spur-border/60 transition-colors">
      <div className="w-9 h-9 rounded-xl bg-spur-dark flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-spur-muted text-[10px]">{description}</p>
      </div>
      {trailing}
    </button>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={`relative w-10 h-5.5 rounded-full transition-colors ${
        checked ? 'bg-spur-purple' : 'bg-spur-border'
      }`}
    >
      <motion.div
        animate={{ x: checked ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm"
      />
    </button>
  )
}
