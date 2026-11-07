import { useEffect, useRef, useState } from 'react'
import { wsUrl, type WsMessage } from '../lib/api'

export type SocketStatus = 'connecting' | 'open' | 'retrying'

type AlertPayload = Extract<WsMessage, { type: 'alert' }>

/**
 * Subscribes to the alert WebSocket and reconnects with exponential backoff
 * (1s → 15s). `retryIn` counts down the seconds until the next attempt.
 */
export function useAlertSocket(onAlert: (a: AlertPayload) => void) {
  const [status, setStatus] = useState<SocketStatus>('connecting')
  const [retryIn, setRetryIn] = useState(0)
  const [nonce, setNonce] = useState(0)
  const [connectedAt, setConnectedAt] = useState<number | null>(null)
  const [reconnects, setReconnects] = useState(0)
  const handler = useRef(onAlert)
  const attempts = useRef(0)

  useEffect(() => {
    handler.current = onAlert
  }, [onAlert])

  useEffect(() => {
    let ws: WebSocket | null = null
    let retryTimer = 0
    let tick = 0
    let disposed = false

    const connect = () => {
      setStatus('connecting')
      ws = new WebSocket(wsUrl())
      ws.onopen = () => {
        if (attempts.current > 0) setReconnects((n) => n + 1)
        attempts.current = 0
        setStatus('open')
        setConnectedAt(Date.now())
      }
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(String(ev.data)) as WsMessage
          if (data.type === 'alert') handler.current(data)
        } catch {
          /* ignore malformed messages */
        }
      }
      ws.onclose = () => {
        if (disposed) return
        setConnectedAt(null)
        const delay = Math.min(15, 2 ** attempts.current)
        attempts.current += 1
        setStatus('retrying')
        setRetryIn(delay)
        tick = window.setInterval(() => setRetryIn((s) => Math.max(0, s - 1)), 1000)
        retryTimer = window.setTimeout(() => {
          window.clearInterval(tick)
          connect()
        }, delay * 1000)
      }
    }

    connect()
    return () => {
      disposed = true
      window.clearTimeout(retryTimer)
      window.clearInterval(tick)
      ws?.close()
    }
  }, [nonce])

  /** Skip the wait and reconnect immediately. */
  const retryNow = () => {
    attempts.current = 0
    setNonce((n) => n + 1)
  }

  return { status, retryIn, retryNow, connectedAt, reconnects }
}
