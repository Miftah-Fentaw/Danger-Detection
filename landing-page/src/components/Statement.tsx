import { useEffect, useRef, useState } from 'react'

const TEXT =
  'Most fires start small. A flicker on a stove, a wisp of smoke in a storeroom. Danger Detection watches every frame so you can act in the first minute, not the tenth.'
const ACCENT = new Set(['small.', 'every', 'frame', 'first', 'minute,'])

/** Big statement whose words light up as it scrolls through the viewport. */
export function Statement() {
  const ref = useRef<HTMLElement>(null)
  const [progress, setProgress] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0,
  )
  const words = TEXT.split(' ')

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const run = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const p = (vh * 0.85 - r.top) / (r.height + vh * 0.2)
      setProgress(Math.max(0, Math.min(1, p)))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(run)
    }
    run()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section className="statement" ref={ref} aria-label="Why it matters">
      <p className="kicker">Why it matters</p>
      <p className="statement__text">
        {words.map((w, i) => {
          const on = i / words.length < progress
          return (
            <span key={i} className={`${on ? 'is-on' : ''} ${ACCENT.has(w) ? 'is-accent' : ''}`}>
              {w}{' '}
            </span>
          )
        })}
      </p>
      <div className="statement__foot">
        <div>
          <strong>0.35</strong>
          <small>default confidence threshold</small>
        </div>
        <div>
          <strong>0.45s</strong>
          <small>alert debounce window</small>
        </div>
        <div>
          <strong>~50ms</strong>
          <small>server to every connected client</small>
        </div>
      </div>
    </section>
  )
}
