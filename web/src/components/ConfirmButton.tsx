import { useEffect, useState, type ReactNode } from 'react'

/**
 * Two-step inline confirmation (replaces window.confirm).
 * First click arms it; confirm or cancel within 6 seconds.
 */
export function ConfirmButton({
  children,
  confirmLabel,
  question,
  onConfirm,
  disabled,
  className = '',
}: {
  children: ReactNode
  confirmLabel: string
  question: string
  onConfirm: () => Promise<unknown> | void
  disabled?: boolean
  className?: string
}) {
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!armed) return
    const t = window.setTimeout(() => setArmed(false), 6000)
    return () => window.clearTimeout(t)
  }, [armed])

  if (!armed) {
    return (
      <button type="button" className={`btn btn--ghost ${className}`} disabled={disabled} onClick={() => setArmed(true)}>
        {children}
      </button>
    )
  }

  return (
    <span className="confirm" role="group" aria-label={question}>
      <span className="confirm__q">{question}</span>
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setArmed(false)} disabled={busy}>
        Cancel
      </button>
      <button
        type="button"
        className="btn btn--danger btn--sm"
        disabled={busy}
        aria-busy={busy}
        onClick={async () => {
          setBusy(true)
          try {
            await onConfirm()
          } finally {
            setBusy(false)
            setArmed(false)
          }
        }}
        autoFocus
      >
        {confirmLabel}
      </button>
    </span>
  )
}
