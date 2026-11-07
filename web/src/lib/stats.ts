import type { LogEvent } from './api'

export type RangeId = '1h' | '24h' | '7d' | '30d'

type RangeDef = { id: RangeId; label: string; long: string; ms: number; buckets: number }

export const RANGES: RangeDef[] = [
  { id: '1h', label: '1H', long: 'last hour', ms: 3_600_000, buckets: 12 },
  { id: '24h', label: '24H', long: 'last 24 hours', ms: 86_400_000, buckets: 24 },
  { id: '7d', label: '7D', long: 'last 7 days', ms: 7 * 86_400_000, buckets: 7 },
  { id: '30d', label: '30D', long: 'last 30 days', ms: 30 * 86_400_000, buckets: 30 },
]

export const rangeDef = (id: RangeId) => RANGES.find((r) => r.id === id) ?? RANGES[1]

/** Event timestamps from the server are in seconds. */
export const ms = (e: LogEvent) => e.ts * 1000

export function inWindow(events: LogEvent[], from: number, to: number) {
  return events.filter((e) => ms(e) >= from && ms(e) < to)
}

export type Bucket = { start: number; end: number; fire: number; smoke: number; alerts: number }

/** Splits [now - range, now) into equal buckets and sums detections per bucket. */
export function bucketize(events: LogEvent[], range: RangeDef, now: number, count = range.buckets): Bucket[] {
  const size = range.ms / count
  const start = now - range.ms
  const out: Bucket[] = Array.from({ length: count }, (_, i) => ({
    start: start + i * size,
    end: start + (i + 1) * size,
    fire: 0,
    smoke: 0,
    alerts: 0,
  }))
  for (const e of events) {
    const i = Math.floor((ms(e) - start) / size)
    if (i < 0 || i >= count) continue
    out[i].fire += e.fire
    out[i].smoke += e.smoke
    out[i].alerts += 1
  }
  return out
}

export type Totals = { alerts: number; fire: number; smoke: number; both: number }

export function totals(events: LogEvent[]): Totals {
  let fire = 0
  let smoke = 0
  let both = 0
  for (const e of events) {
    fire += e.fire
    smoke += e.smoke
    if (e.fire > 0 && e.smoke > 0) both += 1
  }
  return { alerts: events.length, fire, smoke, both }
}

/** Rounds an axis maximum up to a clean value (1, 2, 5 × 10ⁿ). */
export function niceMax(v: number) {
  if (v <= 4) return 4
  const p = 10 ** Math.floor(Math.log10(v))
  const n = v / p
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * p
}

export function compact(n: number) {
  return new Intl.NumberFormat(undefined, { notation: n >= 10_000 ? 'compact' : 'standard' }).format(n)
}

export function bucketLabel(b: Bucket, range: RangeDef) {
  const d = new Date(b.start)
  if (range.id === '1h') return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  if (range.id === '24h') return d.toLocaleTimeString(undefined, { hour: '2-digit' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function bucketTitle(b: Bucket, range: RangeDef) {
  const a = new Date(b.start)
  const z = new Date(b.end)
  if (range.id === '7d' || range.id === '30d') return a.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const t = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  return `${t(a)} – ${t(z)}`
}
