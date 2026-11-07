import type { ReactNode } from 'react'

export function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled,
  icon,
}: {
  label: string
  hint?: ReactNode
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  icon?: ReactNode
}) {
  return (
    <label className={`row toggle ${disabled ? 'is-disabled' : ''}`}>
      {icon && <span className="row__icon">{icon}</span>}
      <span className="row__text">
        <span className="row__label">{label}</span>
        {hint && <span className="row__hint">{hint}</span>}
      </span>
      <input
        type="checkbox"
        className="toggle__input"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle__switch" aria-hidden />
    </label>
  )
}
