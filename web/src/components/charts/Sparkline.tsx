/** 12-point trend line: de-emphasis stroke, current point in the accent. */
export function Sparkline({ values, tone = 'neutral' }: { values: number[]; tone?: 'neutral' | 'fire' | 'smoke' }) {
  const w = 120
  const h = 34
  const max = Math.max(1, ...values)
  const step = values.length > 1 ? w / (values.length - 1) : w
  const pts = values.map((v, i) => [i * step, h - 4 - (v / max) * (h - 8)] as const)
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('')
  const area = `${line}L${w},${h}L0,${h}Z`
  const last = pts[pts.length - 1]
  return (
    <svg className={`spark spark--${tone}`} viewBox={`-4 0 ${w + 8} ${h}`} preserveAspectRatio="none" aria-hidden>
      <path className="spark__area" d={area} />
      <path className="spark__line" d={line} vectorEffect="non-scaling-stroke" />
      {last && <circle className="spark__dot" cx={last[0]} cy={last[1]} r="3.5" />}
    </svg>
  )
}
