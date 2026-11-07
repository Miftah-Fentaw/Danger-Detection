import { useEffect } from 'react'
import { hazardTitle } from '../lib/api'
import type { ActiveAlert } from '../lib/alerts'
import { clockTime, relativeTime } from '../lib/time'
import { IconCheck, IconCheckAll, IconClose, IconCloud, IconFlame, IconShield } from './Icons'

function KindIcon({ kind, size = 20 }: { kind: ActiveAlert['kind']; size?: number }) {
  return kind === 'smoke' ? <IconCloud size={size} /> : <IconFlame size={size} />
}

function AlertCard({
  a,
  now,
  onAck,
  onDismiss,
  fresh,
}: {
  a: ActiveAlert
  now: number
  onAck: () => void
  onDismiss: () => void
  fresh: boolean
}) {
  return (
    <li className={`acard acard--${a.kind} ${a.acknowledged ? 'is-ack' : ''} ${fresh ? 'is-fresh' : ''}`}>
      <span className="acard__icon">
        <KindIcon kind={a.kind} />
      </span>
      <div className="acard__body">
        <div className="acard__top">
          <strong>{hazardTitle(a.kind)}</strong>
          <time dateTime={new Date(a.ts).toISOString()} title={clockTime(a.ts)}>
            {relativeTime(a.ts, now)}
          </time>
        </div>
        <div className="acard__chips">
          {a.fire > 0 && <span className="chip chip--fire">Fire ×{a.fire}</span>}
          {a.smoke > 0 && <span className="chip chip--smoke">Smoke ×{a.smoke}</span>}
          <span className="chip">{a.preview ? 'Preview' : a.source.replace(/_/g, ' ')}</span>
        </div>
        {!a.acknowledged && (
          <p className="acard__msg">
            Possible hazard reported by the monitoring camera at {clockTime(a.ts)}. Check the area and follow local safety
            instructions.
          </p>
        )}
        <div className="acard__actions">
          {!a.acknowledged ? (
            <button type="button" className="btn btn--solid btn--sm" onClick={onAck}>
              <IconCheck size={16} /> Acknowledge
            </button>
          ) : (
            <span className="acard__done">
              <IconCheck size={14} /> Acknowledged
            </span>
          )}
          <button type="button" className="btn btn--ghost btn--sm" onClick={onDismiss} aria-label="Remove alert">
            Remove
          </button>
        </div>
      </div>
    </li>
  )
}

export function AlertPanel({
  open,
  alerts,
  now,
  onClose,
  onAck,
  onAckAll,
  onDismiss,
  onClearAcknowledged,
}: {
  open: boolean
  alerts: ActiveAlert[]
  now: number
  onClose: () => void
  onAck: (id: string) => void
  onAckAll: () => void
  onDismiss: (id: string) => void
  onClearAcknowledged: () => void
}) {
  const pending = alerts.filter((a) => !a.acknowledged)
  const done = alerts.filter((a) => a.acknowledged)
  const newestId = pending[0]?.id

  // Escape closes the panel; it never traps focus, so the page stays usable.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div className={`panel-scrim ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden />
      <aside
        className={`panel ${open ? 'is-open' : ''} ${pending.length ? 'has-pending' : ''}`}
        aria-label="Hazard alerts"
        aria-hidden={!open}
        inert={!open}
      >
        <header className="panel__head">
          <div>
            <p className="kicker">Hazard alerts</p>
            <h2>
              {pending.length > 0 ? `${pending.length} need${pending.length === 1 ? 's' : ''} attention` : 'All clear'}
            </h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close alerts panel">
            <IconClose />
          </button>
        </header>

        {pending.length > 1 && (
          <div className="panel__bulk">
            <button type="button" className="btn btn--ghost btn--sm" onClick={onAckAll}>
              <IconCheckAll size={16} /> Acknowledge all
            </button>
          </div>
        )}

        <div className="panel__scroll">
          {alerts.length === 0 && (
            <div className="panel__empty">
              <span className="panel__empty-icon">
                <IconShield size={28} />
              </span>
              <strong>No active alerts</strong>
              <p>When the detector reports fire or smoke, the alert appears here instantly.</p>
            </div>
          )}

          {pending.length > 0 && (
            <ul className="panel__list" aria-live="assertive">
              {pending.map((a) => (
                <AlertCard
                  key={a.id}
                  a={a}
                  now={now}
                  fresh={a.id === newestId}
                  onAck={() => onAck(a.id)}
                  onDismiss={() => onDismiss(a.id)}
                />
              ))}
            </ul>
          )}

          {done.length > 0 && (
            <>
              <div className="panel__sub">
                <span>Acknowledged</span>
                <button type="button" className="link-btn" onClick={onClearAcknowledged}>
                  Clear
                </button>
              </div>
              <ul className="panel__list">
                {done.map((a) => (
                  <AlertCard
                    key={a.id}
                    a={a}
                    now={now}
                    fresh={false}
                    onAck={() => onAck(a.id)}
                    onDismiss={() => onDismiss(a.id)}
                  />
                ))}
              </ul>
            </>
          )}
        </div>

        <footer className="panel__foot">
          <IconShield size={16} />
          <p>Stay calm, move away from smoke or flames, and contact emergency services if anyone is in danger.</p>
        </footer>
      </aside>
    </>
  )
}
