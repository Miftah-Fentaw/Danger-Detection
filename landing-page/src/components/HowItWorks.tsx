import { useEffect, useRef, useState, type ComponentType } from 'react'
import { useCountUp } from '../hooks'
import { Monitor, Phone, Server } from './Icons'
import { BrandMark } from './BrandMark'

/* ---------- pipeline timeline ---------- */

type Stage = 0 | 1 | 2 | 3
// detect → POST to server → WebSocket broadcast → phone notified
const DURATION: Record<Stage, number> = { 0: 1700, 1: 1300, 2: 1300, 3: 1900 }

const steps: { icon: ComponentType<{ size?: number }>; title: string; tag: string; body: string; stages: Stage[] }[] = [
  {
    icon: Monitor,
    title: 'Desktop App',
    tag: 'Tkinter · OpenCV · YOLO',
    body: 'Reads the camera, runs detection on every frame and posts fire and smoke counts.',
    stages: [0],
  },
  {
    icon: Server,
    title: 'Alert Server',
    tag: 'FastAPI · WebSocket',
    body: 'Checks the optional token, keeps a recent history and broadcasts to every client.',
    stages: [1, 2],
  },
  {
    icon: Phone,
    title: 'Web PWA',
    tag: 'React · Vite PWA',
    body: 'An installable app on any phone or laptop that shows the alert instantly.',
    stages: [3],
  },
]

const clock = () => new Date().toLocaleTimeString([], { hour12: false })

function usePipeline(active: boolean) {
  const [state, setState] = useState(() => ({ stage: 0 as Stage, cycle: 0, time: clock() }))
  useEffect(() => {
    if (!active) return
    const t = window.setTimeout(() => {
      setState((s) =>
        s.stage === 3
          ? { stage: 0, cycle: s.cycle + 1, time: clock() }
          : { ...s, stage: (s.stage + 1) as Stage, time: clock() },
      )
    }, DURATION[state.stage])
    return () => window.clearTimeout(t)
  }, [state.stage, active])
  return state
}

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return { ref, inView }
}

const HAZARDS = [
  { fire: 1, smoke: 0, conf: '0.94' },
  { fire: 0, smoke: 2, conf: '0.81' },
  { fire: 1, smoke: 1, conf: '0.91' },
]

function summary(h: { fire: number; smoke: number }) {
  return [h.fire && `fire ×${h.fire}`, h.smoke && `smoke ×${h.smoke}`].filter(Boolean).join(', ')
}

/* ---------- visual ---------- */

function Pipeline({ stage, cycle, time }: { stage: Stage; cycle: number; time: string }) {
  const h = HAZARDS[cycle % HAZARDS.length]
  const label = h.fire ? 'fire' : 'smoke'
  const events = 127 + cycle + (stage >= 2 ? 1 : 0)

  const log = [
    { s: 0, text: `detector  ${label} ${h.conf} ≥ 0.35 · frame ${48210 + cycle * 97}` },
    { s: 1, text: `POST /internal/alert  {"fire": ${h.fire}, "smoke": ${h.smoke}}  → 200` },
    { s: 2, text: `ws /ws  broadcast {"type": "alert"} → 2 clients` },
    { s: 3, text: `pwa  notification · ${summary(h)}` },
  ].filter((l) => l.s <= stage)

  return (
    <div className={`pipe pipe--s${stage}`} aria-hidden>
      <div className="pipe__head">
        <span>
          <span className="rec" /> Live pipeline
        </span>
        <span>alert #{events}</span>
      </div>

      <div className="pipe__row">
        <div className={`pnode ${stage === 0 ? 'is-on' : ''}`}>
          <div className="pnode__card pnode__card--screen">
            <svg viewBox="0 0 120 76">
              <rect width="120" height="76" rx="6" fill="#0c1a0e" />
              <rect x="8" y="54" width="104" height="16" fill="#13281a" />
              <ellipse cx="60" cy="46" rx="26" ry="16" fill="#9bf07a" opacity="0.35" className="scene__fireglow" />
              <g className="scene__flames">
                <path d="M52 56c-4-7 2-10 1-17 4 3 5 7 4 10 2-3 3-8 1-13 6 4 9 12 6 20Z" fill="#c8ff9e" />
                <path d="M60 56c-2-5 2-7 2-12 3 3 4 6 3 9 1-2 2-5 1-8 4 3 5 8 3 11Z" fill="#f2ffe6" />
              </g>
              <g className="pnode__box">
                <rect x="44" y="30" width="34" height="27" rx="3" fill="none" stroke="#ff8a3d" strokeWidth="2" />
                <rect x="43" y="20" width="40" height="10" rx="2" fill="#ff8a3d" />
                <text x="46" y="28" fontSize="7" fontFamily="JetBrains Mono, monospace" fontWeight="700" fill="#1f0e04">
                  {label} {h.conf}
                </text>
              </g>
              <rect className="pnode__scan" x="0" y="0" width="120" height="2" fill="#9bf07a" opacity="0.6" />
            </svg>
          </div>
          <strong>Desktop app</strong>
          <small>{stage === 0 ? 'detecting…' : 'watching'}</small>
        </div>

        <div className={`wire ${stage === 1 ? 'is-run' : ''} ${stage > 1 ? 'is-done' : ''}`}>
          <span className="wire__track" />
          {stage === 1 && (
            <span className="wire__packet" key={`p1-${cycle}`}>
              POST
            </span>
          )}
          <em>HTTP</em>
        </div>

        <div className={`pnode ${stage === 1 || stage === 2 ? 'is-on' : ''}`}>
          <div className="pnode__card pnode__card--server">
            {[0, 1, 2].map((i) => (
              <span className="rack" key={i}>
                <i />
                <i />
                <b />
              </span>
            ))}
          </div>
          <strong>Alert server</strong>
          <small>{stage === 1 ? 'receiving…' : stage === 2 ? 'broadcasting…' : `${events} events`}</small>
        </div>

        <div className={`wire ${stage === 2 ? 'is-run' : ''} ${stage > 2 ? 'is-done' : ''}`}>
          <span className="wire__track" />
          {stage === 2 && (
            <span className="wire__packet wire__packet--ws" key={`p2-${cycle}`}>
              WS
            </span>
          )}
          <em>WebSocket</em>
        </div>

        <div className={`pnode ${stage === 3 ? 'is-on' : ''}`}>
          <div className="pnode__card pnode__card--phone">
            <span className="mini-phone">
              <span className="mini-phone__bar" />
              {stage === 3 && (
                <span className="mini-phone__toast" key={`t-${cycle}`}>
                  <BrandMark size={14} />
                  <span>
                    <b>Hazard</b>
                    {summary(h)}
                  </span>
                </span>
              )}
              <span className="mini-phone__line" />
              <span className="mini-phone__line mini-phone__line--short" />
            </span>
          </div>
          <strong>Web PWA</strong>
          <small>{stage === 3 ? 'alert shown' : 'listening'}</small>
        </div>
      </div>

      <ul className="pipe__log">
        {log.map((l) => (
          <li key={`${cycle}-${l.s}`} className={l.s === stage ? 'is-new' : ''}>
            <span>{time}</span>
            {l.text}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Stat({ value, suffix = '', text, label }: { value?: number; suffix?: string; text?: string; label: string }) {
  const { ref, value: v } = useCountUp<HTMLDivElement>(value ?? 0)
  return (
    <div className="bigstat" ref={ref}>
      <strong>{text ?? `${Math.round(v)}${suffix}`}</strong>
      <small>{label}</small>
    </div>
  )
}

export function HowItWorks() {
  const { ref, inView } = useInView<HTMLElement>()
  const { stage, cycle, time } = usePipeline(inView)

  return (
    <section className="dark" id="how-it-works" ref={ref}>
      <div className="dark__glow" aria-hidden />
      <div className="dark__grid">
        <div className="dark__copy">
          <p className="kicker kicker--light reveal">How it works</p>
          <h2 className="reveal">
            From Camera to Phone,
            <br />
            <em>in Real Time</em>
          </h2>
          <p className="lead reveal">
            Two lightweight processes work together. Watch a single alert travel through the system,
            the same way it does on your machine.
          </p>

          <ol className="timeline">
            {steps.map((s, i) => {
              const on = s.stages.includes(stage)
              const done = Math.max(...s.stages) < stage
              const ms = s.stages.reduce<number>((a, st) => a + DURATION[st], 0)
              return (
                <li
                  className={`tl reveal ${on ? 'is-on' : ''} ${done ? 'is-done' : ''}`}
                  key={s.title}
                  style={{ transitionDelay: `${i * 120}ms` }}
                >
                  <span className="tl__icon">
                    <s.icon size={20} />
                  </span>
                  <div>
                    <span className="tl__tag">
                      0{i + 1} · {s.tag}
                    </span>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                    <span className="tl__bar">
                      {on && <i key={`${cycle}-${i}`} style={{ animationDuration: `${ms}ms` }} />}
                      {done && <i className="is-full" />}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="dark__visual reveal">
          <Pipeline stage={stage} cycle={cycle} time={time} />
        </div>
      </div>

      <div className="bigstats">
        <Stat value={4} label="Detection modes" />
        <Stat value={100} suffix="%" label="Local processing" />
        <Stat text="24/7" label="Continuous monitoring" />
        <Stat text="MIT" label="Open-source license" />
      </div>
    </section>
  )
}
