import { useCallback, useEffect, useState } from 'react'
import { clearEventLog, fetchEventLog, type LogEvent } from '../lib/api'

const POLL_MS = 12_000

/** Server event history: polls every 12s and exposes refresh / clear. */
export function useEventLog() {
  const [events, setEvents] = useState<LogEvent[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastSync, setLastSync] = useState<number | null>(null)
  const [latency, setLatency] = useState<number | null>(null)

  const load = useCallback(async () => {
    const t0 = performance.now()
    try {
      // the server keeps up to 500 alerts and returns at most 200 per request
      const list = await fetchEventLog(200)
      setLatency(Math.round(performance.now() - t0))
      setEvents(list)
      setError(null)
      setLastSync(Date.now())
    } catch {
      setLatency(null)
      setError('Could not load the event history.')
    } finally {
      setLoaded(true)
    }
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await load()
    } finally {
      setRefreshing(false)
    }
  }, [load])

  const clear = useCallback(async () => {
    try {
      await clearEventLog()
      setEvents([])
      setError(null)
      return true
    } catch {
      setError('Could not clear the event history.')
      return false
    }
  }, [])

  useEffect(() => {
    const first = window.setTimeout(() => void load(), 0)
    const id = window.setInterval(() => void load(), POLL_MS)
    const onFocus = () => document.visibilityState === 'visible' && void load()
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [load])

  return { events, loaded, error, refreshing, lastSync, latency, refresh, reload: load, clear }
}
