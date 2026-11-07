/** Types and helpers for the Danger Detection alert server (FastAPI). */

export type WsMessage =
  | { type: 'hello'; message: string }
  | { type: 'alert'; fire: number; smoke: number; ts: number; source?: string }

export type LogEvent = {
  ts: number
  iso: string
  fire: number
  smoke: number
  source: string
  summary: string
}

export type HazardKind = 'fire' | 'smoke' | 'both'

export function hazardKind(fire: number, smoke: number): HazardKind {
  if (fire > 0 && smoke > 0) return 'both'
  return fire > 0 ? 'fire' : 'smoke'
}

export function hazardTitle(kind: HazardKind): string {
  return kind === 'both' ? 'Fire & smoke detected' : kind === 'fire' ? 'Fire detected' : 'Smoke detected'
}

/** HTTP base for the API. Same origin in production, :8000 during development. */
export function apiBase(): string {
  const b = import.meta.env.VITE_API_BASE as string | undefined
  if (b) return b.replace(/\/$/, '')
  if (import.meta.env.DEV) return `${window.location.protocol}//${window.location.hostname}:8000`
  return ''
}

export function wsUrl(): string {
  const explicit = import.meta.env.VITE_WS_URL as string | undefined
  if (explicit) return explicit
  const { protocol, hostname, host } = window.location
  const proto = protocol === 'https:' ? 'wss:' : 'ws:'
  if (import.meta.env.DEV) return `${proto}//${hostname}:8000/ws`
  return `${proto}//${host}/ws`
}

/** Human-readable server address for the settings screen. */
export function serverLabel(): string {
  return apiBase() || window.location.origin
}

export async function fetchEventLog(limit = 100): Promise<LogEvent[]> {
  const res = await fetch(`${apiBase()}/api/events?limit=${limit}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = (await res.json()) as { events?: LogEvent[] }
  return data.events ?? []
}

export async function clearEventLog(): Promise<void> {
  // POST avoids 405s from service workers / static hosts that mishandle DELETE.
  const res = await fetch(`${apiBase()}/api/events/clear`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
