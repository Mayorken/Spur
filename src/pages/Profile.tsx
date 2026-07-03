import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Crown,
  Trash2,
} from 'lucide-react'
import BottomNav from '../components/BottomNav'
import LGBTQProfile from '../components/LGBTQProfile'
import ExperienceCards, { type ExperienceTag } from '../components/ExperienceCards'
import { useAuth } from '../context/AuthContext'
import { users, matches, ratings } from '../utils/api'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

export default function Profile() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [ghostMode, setGhostMode] = useState(user?.ghost_mode ?? false)
  const [savingGhost, setSavingGhost] = useState(false)
  const [stealthMode, setStealthMode] = useState(user?.is_stealth ?? false)
  const [savingStealth, setSavingStealth] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingBio, setEditingBio] = useState(false)
  const [bioValue, setBioValue] = useState(user?.bio ?? '')
  const [savingBio, setSavingBio] = useState(false)
  const [matchCount, setMatchCount] = useState<number | null>(null)
  const [experienceTags, setExperienceTags] = useState<ExperienceTag[]>([])
  const [radius, setRadius] = useState(user?.location_radius_km ?? 0.5)
  const [savingRadius, setSavingRadius] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [mode, setMode] = useState(user?.mode ?? null)
  const [savingMode, setSavingMode] = useState(false)
  const [orientation, setOrientation] = useState(user?.sexual_orientation ?? null)
  const [gender, setGender] = useState(user?.gender_identity ?? null)
  const [maleRole, setMaleRole] = useState(user?.male_role ?? null)
  const [femaleRole, setFemaleRole] = useState(user?.female_role ?? null)
  const [seekingRoles, setSeekingRoles] = useState<string[]>(user?.seeking_roles ?? [])
  const [savingLGBTQ, setSavingLGBTQ] = useState(false)

  const FEMALE_MODES = [
    { id: 'ovulating', label: 'Ovulating', emoji: '🔥' },
    { id: 'fertile_window', label: 'Fertile Window', emoji: '💚' },
    { id: 'not_fertile', label: 'Not Fertile', emoji: '💙' },
    { id: 'menstruating', label: 'Menstruating', emoji: '🩸' },
    { id: 'peak_fertility', label: 'Peak Fertility', emoji: '⚡' },
    { id: 'any_time', label: 'Any Time', emoji: '💜' },
  ]

  const MALE_MODES = [
    { id: 'high_energy', label: 'High Energy', emoji: '💥' },
    { id: 'chill_vibes', label: 'Chill Vibes', emoji: '😌' },
    { id: 'dominant', label: 'Dominant', emoji: '👑' },
    { id: 'submissive', label: 'Submissive', emoji: '🙏' },
    { id: 'adventurous', label: 'Adventurous', emoji: '🚀' },
    { id: 'romantic', label: 'Romantic', emoji: '💕' },
    { id: 'just_vibing', label: 'Just Vibing', emoji: '😊' },
  ]

  useEffect(() => {
    if (!user?.id) return
    matches.list().then((m) => setMatchCount(m.length)).catch(() => {})
    ratings.userExperience(user.id).then((r) => {
      setExperienceTags(
        r.tags.map((t) => ({ id: t.tag, label: t.label, emoji: t.emoji, count: t.count, rank: t.rank }))
      )
    }).catch(() => {})
  }, [user?.id])

  const toggleGhostMode = async (val: boolean) => {
    setSavingGhost(true)
    try {
      await users.updateMe({ ghost_mode: val })
      setGhostMode(val)
      await refreshUser()
    } catch {
      // revert on error
    } finally {
      setSavingGhost(false)
    }
  }

  const toggleStealthMode = async (val: boolean) => {
    setSavingStealth(true)
    try {
      await users.updateMe({ is_stealth: val })
      setStealthMode(val)
      await refreshUser()
    } catch {
      // revert on error
    } finally {
      setSavingStealth(false)
    }
  }

  const saveLGBTQ = async () => {
    setSavingLGBTQ(true)
    try {
      await users.updateMe({
        sexual_orientation: orientation,
        gender_identity: gender,
        male_role: maleRole,
        female_role: femaleRole,
        seeking_roles: seekingRoles,
      })
      await refreshUser()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save preferences')
    } finally {
      setSavingLGBTQ(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    try {
      await users.deleteAccount()
      logout()
      navigate('/')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setDeletingAccount(false)
      setShowDeleteModal(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const token = localStorage.getItem('spur_token')
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${API_BASE}/users/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (res.ok) await refreshUser()
    } catch {
      // silently ignore
    } finally {
      setUploadingAvatar(false)
    }
  }

  const saveBio = async () => {
    setSavingBio(true)
    try {
      await users.updateMe({ bio: bioValue })
      await refreshUser()
      setEditingBio(false)
    } catch {
      // ignore
    } finally {
      setSavingBio(false)
    }
  }

  const trustPercent = Math.round((user?.trust_score ?? 0))

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
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-spur-purple/50">
                <img
                  src={
                    user?.avatar_url
                      ? user.avatar_url.startsWith('/uploads/')
                        ? `http://localhost:8000${user.avatar_url}`
                        : user.avatar_url
                      : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id ?? 'me'}`
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-spur-purple flex items-center justify-center border-2 border-spur-card disabled:opacity-60"
              >
                {uploadingAvatar
                  ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <Camera size={14} className="text-white" />
                }
              </button>
            </div>

            <h2 className="text-xl font-bold text-white mt-4">
              {user?.display_name ?? 'You'}
            </h2>
            <p className="text-spur-muted text-sm mt-1">{user?.email}</p>

            {user?.is_verified && (
              <div className="flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
                <Shield size={12} className="text-green-400" />
                <span className="text-[10px] text-green-400 font-medium">Verified</span>
              </div>
            )}

            {/* Bio */}
            <div className="w-full mt-4">
              {editingBio ? (
                <div className="w-full">
                  <textarea
                    value={bioValue}
                    onChange={(e) => setBioValue(e.target.value)}
                    maxLength={200}
                    rows={3}
                    placeholder="Write a short bio…"
                    className="w-full px-3 py-2 rounded-xl bg-spur-dark border border-spur-border/60 text-white text-sm placeholder-spur-muted outline-none focus:border-spur-purple/60 resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={saveBio}
                      disabled={savingBio}
                      className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-spur-purple to-spur-pink text-white text-xs font-medium disabled:opacity-50"
                    >
                      {savingBio ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setEditingBio(false); setBioValue(user?.bio ?? '') }}
                      className="flex-1 py-1.5 rounded-lg bg-spur-card border border-spur-border text-spur-muted text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setEditingBio(true)} className="w-full text-center">
                  <p className="text-spur-muted text-xs">
                    {user?.bio || <span className="text-spur-purple/60">+ Add a bio</span>}
                  </p>
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-spur-border/30">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{matchCount ?? '—'}</p>
              <p className="text-[10px] text-spur-muted">Matches</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{experienceTags.length > 0 ? experienceTags.reduce((s, t) => s + t.count, 0) : '—'}</p>
              <p className="text-[10px] text-spur-muted">Ratings</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{trustPercent}%</p>
              <p className="text-[10px] text-spur-muted">Trust Score</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Experience Cards */}
      <div className="px-4 mb-4">
        <ExperienceCards tags={experienceTags} />
      </div>

      {/* LGBTQ+ Profile Section */}
      <div className="px-4 mb-6">
        <h3 className="text-xs font-medium text-spur-muted uppercase tracking-wider px-2 mb-3">
          🏳️‍🌈 Identity & Preferences
        </h3>
        <LGBTQProfile
          orientation={orientation}
          gender={gender}
          maleRole={maleRole}
          femaleRole={femaleRole}
          seekingRoles={seekingRoles}
          onOrientationChange={setOrientation}
          onGenderChange={setGender}
          onMaleRoleChange={setMaleRole}
          onFemaleRoleChange={setFemaleRole}
          onSeekingRolesChange={setSeekingRoles}
        />
        {(orientation || gender || maleRole || femaleRole || (seekingRoles && seekingRoles.length > 0)) && (
          <button
            onClick={saveLGBTQ}
            disabled={savingLGBTQ}
            className="w-full mt-4 py-3 bg-spur-purple text-white font-bold rounded-lg hover:bg-spur-purple/80 transition-colors disabled:opacity-50"
          >
            {savingLGBTQ ? 'Saving...' : 'Save Preferences'}
          </button>
        )}
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
            <Toggle
              checked={ghostMode}
              onChange={toggleGhostMode}
              disabled={savingGhost}
            />
          }
        />
        <SettingItem
          icon={<Eye size={18} className="text-spur-accent" />}
          label="Stealth Mode"
          description="Hidden until you Spur"
          trailing={
            <Toggle
              checked={stealthMode}
              onChange={toggleStealthMode}
              disabled={savingStealth}
            />
          }
        />
        {/* Location radius inline control */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-spur-card border border-spur-border/30">
          <div className="w-9 h-9 rounded-xl bg-spur-dark flex items-center justify-center flex-shrink-0">
            <MapPin size={18} className="text-spur-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium">Location Radius</p>
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              onMouseUp={async () => {
                setSavingRadius(true)
                try { await users.updateMe({ location_radius_km: radius }) } catch {}
                finally { setSavingRadius(false) }
              }}
              onTouchEnd={async () => {
                setSavingRadius(true)
                try { await users.updateMe({ location_radius_km: radius }) } catch {}
                finally { setSavingRadius(false) }
              }}
              className="w-full h-1.5 rounded-full accent-spur-purple mt-1.5"
            />
          </div>
          <span className="text-xs text-spur-muted flex-shrink-0 w-10 text-right">
            {savingRadius ? '…' : `${radius.toFixed(1)}km`}
          </span>
        </div>

        {/* Mode selector */}
        <div>
          <h3 className="text-xs font-medium text-spur-muted uppercase tracking-wider px-2 mb-3">
            Your Vibe
          </h3>
          <div className="flex flex-wrap gap-2">
            {(user?.id?.includes('f') ? FEMALE_MODES : MALE_MODES).map((m) => (
              <button
                key={m.id}
                onClick={async () => {
                  setMode(m.id)
                  setSavingMode(true)
                  try {
                    await users.updateMe({ mode: m.id })
                    await refreshUser()
                  } catch {}
                  finally {
                    setSavingMode(false)
                  }
                }}
                disabled={savingMode}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  mode === m.id
                    ? 'bg-spur-purple/30 border-spur-purple text-white'
                    : 'bg-spur-card border-spur-border/50 text-spur-muted hover:border-spur-purple/50'
                }`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
          {mode && (
            <p className="text-spur-muted text-xs mt-2">
              ✓ Set as {(user?.id?.includes('f') ? FEMALE_MODES : MALE_MODES).find((m) => m.id === mode)?.label}
            </p>
          )}
        </div>

        <SettingItem
          icon={<Shield size={18} className="text-green-400" />}
          label="Safety Preferences"
          description={user?.is_id_verified ? 'ID verified, panic button on' : 'Panic button on'}
          trailing={<ChevronRight size={16} className="text-spur-muted" />}
        />
        <SettingItem
          icon={<Bell size={18} className="text-spur-purple" />}
          label="Notifications"
          description="Matches & messages"
          trailing={<ChevronRight size={16} className="text-spur-muted" />}
        />
        <SettingItem
          icon={<Moon size={18} className="text-spur-purple" />}
          label="Appearance"
          description="Dark mode"
          trailing={<ChevronRight size={16} className="text-spur-muted" />}
        />

        <div className="pt-2 space-y-2">
          <button
            onClick={() => navigate('/premium')}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/20 hover:border-yellow-400/40 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0">
              <Crown size={16} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-yellow-400 text-sm font-medium">Upgrade to Premium</p>
              <p className="text-yellow-600/80 text-[10px]">Access the VIP directory — $15 once</p>
            </div>
            <ChevronRight size={16} className="text-yellow-600" />
          </button>

          <button
            onClick={() => navigate('/vip/join')}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-spur-card border border-spur-border/30 hover:border-spur-border/60 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-spur-dark flex items-center justify-center flex-shrink-0">
              <Crown size={18} className="text-spur-pink" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white text-sm font-medium">Be Available on Spur</p>
              <p className="text-spur-muted text-[10px]">Set yourself as available — free</p>
            </div>
            <ChevronRight size={16} className="text-spur-muted" />
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-red-500/5 transition-colors"
          >
            <LogOut size={18} className="text-red-400" />
            <span className="text-red-400 text-sm font-medium">Sign Out</span>
          </button>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={18} className="text-red-500" />
            <span className="text-red-500 text-sm font-medium">Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
          onClick={() => !deletingAccount && setShowDeleteModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-spur-dark rounded-3xl p-6 border border-spur-border"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white text-center mb-2">Delete Account?</h3>
            <p className="text-spur-muted text-xs text-center mb-6">
              This action is permanent. Your profile, messages, and matches will be deleted forever.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {deletingAccount ? 'Deleting…' : 'Delete My Account'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
                className="w-full py-3 rounded-xl bg-spur-card border border-spur-border text-white text-sm font-medium hover:bg-spur-card/80 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

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

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onChange(!checked)
      }}
      disabled={disabled}
      className={`relative w-10 h-6 rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-spur-purple' : 'bg-spur-border'
      }`}
    >
      <motion.div
        animate={{ x: checked ? 18 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
      />
    </button>
  )
}
