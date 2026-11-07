import type { SocketStatus } from '../hooks/useAlertSocket'

const LABEL: Record<SocketStatus, string> = {
  open: 'Live',
  connecting: 'Connecting',
  retrying: 'Offline',
}

export function StatusPill({ status, retryIn, compact = false }: { status: SocketStatus; retryIn?: number; compact?: boolean }) {
  return (
    <span className={`status status--${status} ${compact ? 'status--compact' : ''}`} role="status">
      <span className="status__dot" aria-hidden />
      <span className="status__label">
        {LABEL[status]}
        {!compact && status === 'retrying' && retryIn ? ` · retry in ${retryIn}s` : ''}
      </span>
    </span>
  )
}
