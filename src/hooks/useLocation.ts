import { useEffect, useRef, useState } from 'react'
import { users } from '../utils/api'
import { useAuth } from '../context/AuthContext'

interface LocationState {
  latitude: number | null
  longitude: number | null
  error: string | null
  loading: boolean
}

export function useLocation(sendToServer = false) {
  const { token } = useAuth()
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  })
  const sentRef = useRef(false)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation((s) => ({ ...s, error: 'Geolocation not supported', loading: false }))
      return
    }

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLocation({ latitude, longitude, error: null, loading: false })

        if (sendToServer && token && !sentRef.current) {
          sentRef.current = true
          users.updateLocation(latitude, longitude).catch(() => {
            sentRef.current = false
          })
        }
      },
      (err) => {
        setLocation((s) => ({ ...s, error: err.message, loading: false }))
      },
      { enableHighAccuracy: true, maximumAge: 30000 },
    )

    return () => navigator.geolocation.clearWatch(watcher)
  }, [sendToServer, token])

  return location
}
