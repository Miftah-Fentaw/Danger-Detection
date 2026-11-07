import { useMemo } from 'react'
import { inWindow, rangeDef } from '../lib/stats'
import { ConfirmButton } from '../components/ConfirmButton'
import { EventsTable } from '../components/Dashboard'
import { IconTrash } from '../components/Icons'
import { OfflineBanner, PageHead, type DashboardData } from './OverviewScreen'

export function EventsScreen(d: DashboardData & { onClear: () => Promise<boolean> }) {
  const def = rangeDef(d.range)
  const rows = useMemo(() => inWindow(d.events, d.now - def.ms, d.now + 1), [d.events, d.now, def])

  return (
    <main className="page" aria-labelledby="page-title">
      <PageHead
        kicker="History"
        title="Events"
        lede="Every hazard the server has recorded. The server keeps the most recent 500 alerts in memory."
        range={d.range}
        onRange={d.onRange}
        refreshing={d.refreshing}
        onRefresh={d.onRefresh}
        lastSync={d.lastSync}
        now={d.now}
      />
      <OfflineBanner status={d.status} retryIn={d.retryIn} onRetry={d.onRetry} />
      {d.error && <p className="inline-error">{d.error}</p>}

      <EventsTable
        title={`${rows.length} event${rows.length === 1 ? '' : 's'} in the ${def.long}`}
        events={rows}
        now={d.now}
        footer={
          <div className="table-foot">
            <span>Clearing removes the history on the server for everyone.</span>
            <ConfirmButton question="Clear all history?" confirmLabel="Clear" onConfirm={d.onClear} disabled={d.events.length === 0}>
              <IconTrash size={15} />
              <span>Clear history</span>
            </ConfirmButton>
          </div>
        }
      />
    </main>
  )
}
