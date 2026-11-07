import { useState } from 'react'

type Part = { key: 'fire' | 'smoke'; label: string; value: number }

/** Tall segmented bar: one whole split into parts, share printed inside when it fits. */
export function SegmentedBar({ parts }: { parts: Part[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0)
  const [hover, setHover] = useState<string | null>(null)
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0)

  return (
    <div className="seg">
      <div className="seg__bar" role="img" aria-label={parts.map((p) => `${p.label} ${p.value} (${pct(p.value)}%)`).join(', ')}>
        {total === 0 && <span className="seg__none">No detections yet</span>}
        {parts
          .filter((p) => p.value > 0)
          .map((p) => {
            const share = pct(p.value)
            return (
              <span
                key={p.key}
                className={`seg__part seg__part--${p.key} ${hover && hover !== p.key ? 'is-muted' : ''}`}
                style={{ flexGrow: p.value }}
                tabIndex={0}
                aria-label={`${p.label}: ${p.value} detections, ${share}%`}
                onPointerEnter={() => setHover(p.key)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(p.key)}
                onBlur={() => setHover(null)}
              >
                {share >= 14 && <b>{share}%</b>}
              </span>
            )
          })}
      </div>
      <ul className="seg__legend">
        {parts.map((p) => (
          <li key={p.key} className={hover === p.key ? 'is-hover' : ''}>
            <span className={`swatch swatch--${p.key}`} />
            <span className="seg__name">{p.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
