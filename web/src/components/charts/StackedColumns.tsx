import { useState } from 'react'
import { bucketLabel, bucketTitle, compact, niceMax, rangeDef, type Bucket, type RangeId } from '../../lib/stats'
import { useWidth } from './useWidth'

const H = 240
const M = { top: 12, right: 6, bottom: 28, left: 34 }
const GAP = 2 // surface gap between stacked segments

/** Path for a column segment: 4px rounded top when `round`, square at the baseline. */
function colPath(x: number, y: number, w: number, h: number, round: boolean) {
  if (h <= 0) return ''
  const r = round ? Math.min(4, h, w / 2) : 0
  return `M${x},${y + h}V${y + r}${r ? `Q${x},${y} ${x + r},${y}` : ''}H${x + w - r}${r ? `Q${x + w},${y} ${x + w},${y + r}` : ''}V${y + h}Z`
}

/**
 * Detections over time: fire (base) + smoke (top) stacked per bucket.
 * Each column's full-height band is its hover/focus target.
 */
export function StackedColumns({ buckets, range, dimmed }: { buckets: Bucket[]; range: RangeId; dimmed?: boolean }) {
  const { ref, width } = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const def = rangeDef(range)

  const innerW = width - M.left - M.right
  const innerH = H - M.top - M.bottom
  const n = buckets.length
  const band = innerW / n
  const barW = Math.max(3, Math.min(24, band * 0.62))
  const max = niceMax(Math.max(...buckets.map((b) => b.fire + b.smoke), 0))
  const y = (v: number) => M.top + innerH - (v / max) * innerH
  const ticks = [0, max / 2, max]
  const every = Math.max(1, Math.ceil(n / Math.max(2, innerW / 64)))
  const empty = buckets.every((b) => b.fire + b.smoke === 0)
  const hb = hover != null ? buckets[hover] : null

  return (
    <div className={`chart ${dimmed ? 'is-dimmed' : ''}`} ref={ref}>
      <svg width={width} height={H} role="img" aria-label={`Fire and smoke detections over the ${def.long}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="chart__grid" x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />
            <text className="chart__tick" x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
              {compact(t)}
            </text>
          </g>
        ))}

        {buckets.map((b, i) => {
          const cx = M.left + band * i + band / 2
          const x = cx - barW / 2
          const fh = (b.fire / max) * innerH
          const sh = (b.smoke / max) * innerH
          const base = M.top + innerH
          const fireTop = b.smoke === 0
          return (
            <g key={b.start} className={`chart__col ${hover === i ? 'is-hover' : ''} ${hover != null && hover !== i ? 'is-muted' : ''}`}>
              {hover === i && <rect className="chart__band" x={M.left + band * i} y={M.top} width={band} height={innerH} rx="6" />}
              <path className="chart__fire" d={colPath(x, base - fh, barW, fh, fireTop)} />
              {b.smoke > 0 && (
                <path className="chart__smoke" d={colPath(x, base - fh - sh - (fh > 0 ? GAP : 0), barW, sh, true)} />
              )}
              {i % every === 0 && (
                <text className="chart__tick" x={cx} y={H - 8} textAnchor="middle">
                  {bucketLabel(b, def)}
                </text>
              )}
              <rect
                className="chart__hit"
                x={M.left + band * i}
                y={M.top}
                width={band}
                height={innerH}
                tabIndex={0}
                aria-label={`${bucketTitle(b, def)}: ${b.fire} fire, ${b.smoke} smoke detections`}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              />
            </g>
          )
        })}
        <line className="chart__axis" x1={M.left} x2={width - M.right} y1={M.top + innerH} y2={M.top + innerH} />
      </svg>

      {empty && <p className="chart__empty">No detections in the {def.long}</p>}

      {hb && hover != null && (
        <div
          className="tooltip"
          style={{
            left: Math.min(Math.max(M.left + band * hover + band / 2, 90), width - 90),
            top: Math.max(4, y(hb.fire + hb.smoke) - 12),
          }}
          role="status"
        >
          <p className="tooltip__title">{bucketTitle(hb, def)}</p>
          <p className="tooltip__row">
            <span className="key key--fire" />
            <strong>{hb.fire}</strong> fire
          </p>
          <p className="tooltip__row">
            <span className="key key--smoke" />
            <strong>{hb.smoke}</strong> smoke
          </p>
          <p className="tooltip__foot">
            {hb.alerts} alert{hb.alerts === 1 ? '' : 's'}
          </p>
        </div>
      )}
    </div>
  )
}
