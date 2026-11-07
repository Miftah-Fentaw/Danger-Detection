import { useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { hazardKind, hazardTitle, type LogEvent } from '../lib/api'
import { RANGES, type RangeId } from '../lib/stats'
import { clockTime, relativeTime } from '../lib/time'
import type { SocketStatus } from '../hooks/useAlertSocket'
import { Sparkline } from './charts/Sparkline'
import { IconCheck, IconCloud, IconFlame, IconInfo, IconMonitor, IconSearch, IconWifiOff } from './Icons'

/* ---------- range picker (one row, scopes everything below) ---------- */

export function RangePicker({ value, onChange }: { value: RangeId; onChange: (r: RangeId) => void }) {
  return (
    <div className="range" role="radiogroup" aria-label="Time range">
      {RANGES.map((r) => (
        <button
          key={r.id}
          type="button"
          role="radio"
          aria-checked={value === r.id}
          className={value === r.id ? 'is-active' : ''}
          onClick={() => onChange(r.id)}
          title={`Show the ${r.long}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- status hero ---------- */

export function StatusHero({
  status,
  unread,
  last,
  alerts,
  rangeLong,
  now,
  onOpenAlerts,
}: {
  status: SocketStatus
  unread: number
  last?: LogEvent
  alerts: number
  rangeLong: string
  now: number
  onOpenAlerts: () => void
}) {
  const recent = last && now - last.ts * 1000 < 10 * 60_000
  const state: 'alert' | 'recent' | 'clear' | 'offline' =
    unread > 0 ? 'alert' : status === 'retrying' ? 'offline' : recent ? 'recent' : 'clear'

  const headline = {
    alert: `${unread} hazard alert${unread === 1 ? '' : 's'} need${unread === 1 ? 's' : ''} attention`,
    recent: 'Hazard detected recently',
    clear: 'All clear',
    offline: 'Monitoring paused',
  }[state]

  const sub = {
    alert: 'Open the alerts panel to review and acknowledge them.',
    recent: `Last report ${relativeTime(last ? last.ts * 1000 : now, now)}. No unacknowledged alerts on this device.`,
    clear: last ? `No hazards in the last 10 minutes. Last report ${relativeTime(last.ts * 1000, now)}.` : 'No hazards have been reported yet.',
    offline: 'This device lost its live connection to the alert server. It reconnects automatically.',
  }[state]

  const step = (label: string, ok: boolean, hint: string, Icon: ComponentType<{ size?: number }>) => (
    <li className={`flow__step ${ok ? 'is-ok' : 'is-bad'}`}>
      <span className="flow__icon">
        <Icon size={16} />
      </span>
      <span>
        <b>{label}</b>
        <small>{hint}</small>
      </span>
    </li>
  )

  return (
    <section className={`hero hero--${state}`} aria-live="polite">
      <div className="hero__glow" aria-hidden />
      <div className="hero__main">
        <p className="kicker kicker--light">
          Live status <span /> {clockTime(now)}
        </p>
        <h2 className="hero__title">
          <span className="hero__icon" aria-hidden>
            {state === 'clear' ? <IconCheck size={22} /> : state === 'offline' ? <IconWifiOff size={22} /> : <IconFlame size={22} />}
          </span>
          {headline}
        </h2>
        <p className="hero__sub">{sub}</p>
        {state === 'alert' && (
          <button type="button" className="pill-cta pill-cta--light" onClick={onOpenAlerts}>
            <span>Review alerts</span>
            <i aria-hidden>→</i>
          </button>
        )}
      </div>

      <div className="hero__figure">
        <p className="hero__num">{alerts}</p>
        <p className="hero__label">alerts in the {rangeLong}</p>
      </div>

      <ol className="flow" aria-label="Alert pipeline">
        {step('Detector', !!last, last ? `last seen ${relativeTime(last.ts * 1000, now)}` : 'no events yet', IconFlame)}
        {step('Alert server', status !== 'retrying', status === 'retrying' ? 'unreachable' : 'reachable', IconMonitor)}
        {step('This device', status === 'open', status === 'open' ? 'receiving live' : 'reconnecting', IconCheck)}
      </ol>
    </section>
  )
}

/* ---------- KPI tile ---------- */

export function KpiTile({
  label,
  value,
  unit,
  delta,
  trend,
  tone = 'neutral',
  icon: Icon,
}: {
  label: string
  value: string
  unit?: string
  delta?: { value: number; period: string }
  trend?: number[]
  tone?: 'neutral' | 'fire' | 'smoke'
  icon: ComponentType<{ size?: number }>
}) {
  const d = delta?.value ?? 0
  return (
    <article className="kpi">
      <header className="kpi__head">
        <span className={`kpi__icon kpi__icon--${tone}`}>
          <Icon size={16} />
        </span>
        <p className="kpi__label">{label}</p>
      </header>
      <p className="kpi__value">
        {value}
        {unit && <small>{unit}</small>}
      </p>
      <div className="kpi__foot">
        {delta && (
          // more hazards is bad, so an increase reads as "up / worse"
          <span className={`delta ${d > 0 ? 'delta--up' : d < 0 ? 'delta--down' : ''}`}>
            {d > 0 ? '▲' : d < 0 ? '▼' : '•'} {d > 0 ? `+${d}` : d} <span>vs {delta.period}</span>
          </span>
        )}
        {trend && <Sparkline values={trend} tone={tone} />}
      </div>
    </article>
  )
}

/* ---------- system health ---------- */

type Health = 'good' | 'warning' | 'critical'

function HealthRow({ name, state, value, detail }: { name: string; state: Health; value: string; detail: string }) {
  const label = { good: 'Healthy', warning: 'Degraded', critical: 'Down' }[state]
  return (
    <li className={`health__row health__row--${state}`}>
      <span className="health__state">
        <span className="health__dot" aria-hidden>
          {state === 'good' ? <IconCheck size={12} /> : <IconInfo size={12} />}
        </span>
        {label}
      </span>
      <span className="health__name">{name}</span>
      <span className="health__value">{value}</span>
      <span className="health__detail">{detail}</span>
    </li>
  )
}

export function HealthCard({
  status,
  connectedAt,
  reconnects,
  latency,
  lastSync,
  syncError,
  lastEvent,
  now,
}: {
  status: SocketStatus
  connectedAt: number | null
  reconnects: number
  latency: number | null
  lastSync: number | null
  syncError: boolean
  lastEvent?: LogEvent
  now: number
}) {
  const uptime = connectedAt ? relativeTime(connectedAt, now).replace(' ago', '').replace('just now', '<10s') : '—'
  return (
    <section className="card health" aria-labelledby="health-title">
      <header className="card__head">
        <div>
          <p className="kicker">System</p>
          <h2 id="health-title">Health</h2>
        </div>
      </header>
      <ul className="health__list">
        <HealthRow
          name="Live channel"
          state={status === 'open' ? 'good' : status === 'connecting' ? 'warning' : 'critical'}
          value={status === 'open' ? `up ${uptime}` : status}
          detail={`${reconnects} reconnect${reconnects === 1 ? '' : 's'} this session`}
        />
        <HealthRow
          name="Alert server"
          state={syncError ? 'critical' : latency != null && latency > 800 ? 'warning' : 'good'}
          value={syncError || latency == null ? 'no response' : `${latency} ms`}
          detail={lastSync ? `synced ${relativeTime(lastSync, now)}` : 'not synced yet'}
        />
        <HealthRow
          name="Detector"
          state={lastEvent ? 'good' : 'warning'}
          value={lastEvent ? relativeTime(lastEvent.ts * 1000, now) : 'no reports'}
          detail={lastEvent ? 'last hazard report' : 'alerts appear when it detects fire or smoke'}
        />
      </ul>
    </section>
  )
}

/* ---------- events table ---------- */

type KindFilter = 'all' | 'fire' | 'smoke'

export function EventsTable({
  events,
  now,
  limit,
  toolbar = true,
  footer,
  title = 'Events',
}: {
  events: LogEvent[]
  now: number
  limit?: number
  toolbar?: boolean
  footer?: ReactNode
  title?: string
}) {
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<KindFilter>('all')
  const [asc, setAsc] = useState(false)

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    let list = events.filter((e) => (kind === 'all' ? true : kind === 'fire' ? e.fire > 0 : e.smoke > 0))
    if (t) list = list.filter((e) => `${e.summary} ${e.source} ${hazardTitle(hazardKind(e.fire, e.smoke))}`.toLowerCase().includes(t))
    list = [...list].sort((a, b) => (asc ? a.ts - b.ts : b.ts - a.ts))
    return limit ? list.slice(0, limit) : list
  }, [events, q, kind, asc, limit])

  return (
    <section className="card events-card" aria-labelledby="events-title">
      <header className="card__head">
        <div>
          <p className="kicker">History</p>
          <h2 id="events-title">{title}</h2>
        </div>
        {toolbar && (
          <div className="events-tools">
            <label className="search">
              <IconSearch size={16} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events" aria-label="Search events" />
            </label>
            <div className="segmented" role="radiogroup" aria-label="Filter by type">
              {(['all', 'fire', 'smoke'] as KindFilter[]).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={kind === k} className={kind === k ? 'is-active' : ''} onClick={() => setKind(k)}>
                  {k === 'all' ? 'All' : k === 'fire' ? 'Fire' : 'Smoke'}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {rows.length === 0 ? (
        <div className="empty">
          <span className="empty__icon">
            <IconCheck size={26} />
          </span>
          <h3>{events.length === 0 ? 'No events in this range' : 'No matching events'}</h3>
          <p>{events.length === 0 ? 'Hazards reported by the detector will be listed here.' : 'Try a different search or filter.'}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">
                  <button type="button" className="th-sort" onClick={() => setAsc((v) => !v)} aria-label={`Sort by time, ${asc ? 'oldest' : 'newest'} first`}>
                    Time {asc ? '↑' : '↓'}
                  </button>
                </th>
                <th scope="col">Type</th>
                <th scope="col" className="num">
                  Fire
                </th>
                <th scope="col" className="num">
                  Smoke
                </th>
                <th scope="col" className="t-source">Source</th>
                <th scope="col" className="num">
                  Age
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => {
                const k = hazardKind(e.fire, e.smoke)
                const t = e.ts * 1000
                return (
                  <tr key={`${e.ts}-${i}`}>
                    <td className="t-time">
                      <b>{clockTime(t)}</b>
                      <small>{new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small>
                    </td>
                    <td>
                      <span className="t-type">
                        <span className={`t-icon t-icon--${k}`}>{k === 'smoke' ? <IconCloud size={15} /> : <IconFlame size={15} />}</span>
                        {hazardTitle(k)}
                      </span>
                    </td>
                    <td className="num" data-label="Fire">
                      {e.fire || '–'}
                    </td>
                    <td className="num" data-label="Smoke">
                      {e.smoke || '–'}
                    </td>
                    <td className="t-source">{e.source.replace(/_/g, ' ')}</td>
                    <td className="num t-age">{relativeTime(t, now)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {footer}
    </section>
  )
}
