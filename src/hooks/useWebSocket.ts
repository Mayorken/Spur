import { useEffect, useRef, useCallback } from 'react'
import { createWebSocket } from '../utils/api'
import { useAuth } from '../context/AuthContext'

type MessageHandler = (msg: Record<string, unknown>) => void

export function useWebSocket(onMessage: MessageHandler) {
  const { token } = useAuth()
  const wsRef = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!token) return

    const ws = createWebSocket()
    if (!ws) return
    wsRef.current = ws

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type !== 'pong') onMessageRef.current(msg)
      } catch {
        // ignore malformed messages
      }
    }

    ws.onerror = () => {}

    return () => {
      clearInterval(pingInterval)
      ws.close()
      wsRef.current = null
    }
  }, [token])

  const send = useCallback((msg: Record<string, unknown>) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg))
    }
  }, [])

  return { send, wsRef }
}
