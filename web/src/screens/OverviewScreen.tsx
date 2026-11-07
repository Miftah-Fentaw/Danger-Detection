import { useMemo } from 'react'
import type { LogEvent } from '../lib/api'
import type { SocketStatus } from '../hooks/useAlertSocket'
import { bucketize, inWindow, rangeDef, totals, type RangeId } from '../lib/stats'
import { relativeTime } from '../lib/time'
import { EventsTable, HealthCard, KpiTile, RangePicker, StatusHero } from '../components/Dashboard'
import { StackedColumns } from '../components/charts/StackedColumns'
import { SegmentedBar } from '../components/charts/SegmentedBar'
import { IconActivity, IconClock, IconCloud, IconFlame, IconRefresh, IconWifiOff } from '../components/Icons'

export type DashboardData = {
  events: LogEvent[]
  loaded: boolean
  error: string | null
  refreshing: boolean
  lastSync: number | null
  latency: number | null
  now: number
  status: SocketStatus
  retryIn: number
  connectedAt: number | null
  reconnects: number
  unread: number
  range: RangeId
  onRange: (r: RangeId) => void
  onRefresh: () => void
  onRetry: () => void
  onOpenAlerts: () => void
  onViewEvents: () => void
}

export function PageHead({
  kicker,
  title,
  lede,
  range,
  onRange,
  refreshing,
  onRefresh,
  lastSync,
  now,
}: {
  kicker: string
  title: string
  lede: string
  range: RangeId
  onRange: (r: RangeId) => void
  refreshing: boolean
  onRefresh: () => void
  lastSync: number | null
  now: number
}) {
  return (
    <>
      <header className="page-head">
        <p className="kicker">{kicker}</p>
        <h1 id="page-title">{title}</h1>
        <p className="page-head__lede">{lede}</p>
      </header>
      <div className="toolbar">
        <RangePicker value={range} onChange={onRange} />
        <div className="toolbar__right">
          <span className="toolbar__sync">{lastSync ? `Synced ${relativeTime(lastSync, now)}` : 'Syncing…'}</span>
          <button type="button" className="btn btn--outline btn--sm" onClick={onRefresh} disabled={refreshing} aria-busy={refreshing}>
            <IconRefresh size={15} className={refreshing ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </>
  )
}

export function OfflineBanner({ status, retryIn, onRetry }: { status: SocketStatus; retryIn: number; onRetry: () => void }) {
  if (status !== 'retrying') return null
  return (
    <div className="banner" role="alert">
      <IconWifiOff size={20} />
      <div>
        <strong>Live channel disconnected</strong>
        <span>Reconnecting{retryIn ? ` in ${retryIn}s` : '…'} History keeps syncing in the background.</span>
      </div>
      <button type="button" className="btn btn--outline btn--sm" onClick={onRetry}>
        Retry now
      </button>
    </div>
  )
}

export function OverviewScreen(d: DashboardData) {
  const def = rangeDef(d.range)

  const view = useMemo(() => {
    const cur = inWindow(d.events, d.now - def.ms, d.now + 1)
    const prev = inWindow(d.events, d.now - 2 * def.ms, d.now - def.ms)
    const buckets = bucketize(cur, def, d.now)
    const spark = bucketize(cur, def, d.now, 12)
    return { cur, t: totals(cur), p: totals(prev), buckets, spark }
  }, [d.events, d.now, def])

  const last = d.events[0]

  return (
    <main className="page" aria-labelledby="page-title">
      <PageHead
        kicker="Monitor · Detect · Alert"
        title="Overview"
        lede="Live hazard monitoring from your Danger Detection camera."
        range={d.range}
        onRange={d.onRange}
        refreshing={d.refreshing}
        onRefresh={d.onRefresh}
        lastSync={d.lastSync}
        now={d.now}
      />

      <OfflineBanner status={d.status} retryIn={d.retryIn} onRetry={d.onRetry} />

      <StatusHero
        status={d.status}
        unread={d.unread}
        last={last}
        alerts={view.t.alerts}
        rangeLong={def.long}
        now={d.now}
        onOpenAlerts={d.onOpenAlerts}
      />

      <section className="kpis" aria-label="Key figures">
        <KpiTile
          icon={IconActivity}
          label="Alerts"
          value={String(view.t.alerts)}
          delta={{ value: view.t.alerts - view.p.alerts, period: `previous ${def.label}` }}
          trend={view.spark.map((b) => b.alerts)}
        />
        <KpiTile
          icon={IconFlame}
          tone="fire"
          label="Fire detections"
          value={String(view.t.fire)}
          delta={{ value: view.t.fire - view.p.fire, period: `previous ${def.label}` }}
          trend={view.spark.map((b) => b.fire)}
        />
        <KpiTile
          icon={IconCloud}
          tone="smoke"
          label="Smoke detections"
          value={String(view.t.smoke)}
          delta={{ value: view.t.smoke - view.p.smoke, period: `previous ${def.label}` }}
          trend={view.spark.map((b) => b.smoke)}
        />
        <KpiTile
          icon={IconClock}
          label="Last hazard"
          value={last ? relativeTime(last.ts * 1000, d.now).replace(' ago', '') : 'None'}
          unit={last && !relativeTime(last.ts * 1000, d.now).includes('just') ? 'ago' : undefined}
        />
      </section>

      <div className="grid">
        <section className="card chart-card" aria-labelledby="chart-title">
          <header className="card__head">
            <div>
              <p className="kicker">Trend</p>
              <h2 id="chart-title">Detections over time</h2>
            </div>
            <ul className="legend" aria-label="Legend">
              <li>
                <span className="swatch swatch--fire" /> Fire
              </li>
              <li>
                <span className="swatch swatch--smoke" /> Smoke
              </li>
            </ul>
          </header>
          <StackedColumns buckets={view.buckets} range={d.range} dimmed={d.refreshing} />
        </section>

        <section className="card mix-card" aria-labelledby="mix-title">
          <header className="card__head">
            <div>
              <p className="kicker">Breakdown</p>
              <h2 id="mix-title">Detection mix</h2>
            </div>
          </header>
          <SegmentedBar
            parts={[
              { key: 'fire', label: 'Fire', value: view.t.fire },
              { key: 'smoke', label: 'Smoke', value: view.t.smoke },
            ]}
          />
          <dl className="mix-stats">
            <div>
              <dt>Alerts with both</dt>
              <dd>{view.t.both}</dd>
            </div>
            <div>
              <dt>Busiest {d.range === '1h' ? '5 minutes' : d.range === '24h' ? 'hour' : 'day'}</dt>
              <dd>{Math.max(0, ...view.buckets.map((b) => b.alerts))} alerts</dd>
            </div>
          </dl>
        </section>

        <EventsTable
          title="Recent events"
          events={view.cur}
          now={d.now}
          limit={6}
          toolbar={false}
          footer={
            view.cur.length > 6 ? (
              <button type="button" className="table-more" onClick={d.onViewEvents}>
                View all {view.cur.length} events →
              </button>
            ) : null
          }
        />

        <HealthCard
          status={d.status}
          connectedAt={d.connectedAt}
          reconnects={d.reconnects}
          latency={d.latency}
          lastSync={d.lastSync}
          syncError={!!d.error}
          lastEvent={last}
          now={d.now}
        />
      </div>
    </main>
  )
}
