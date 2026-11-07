import { useEffect, useState, type ComponentType } from 'react'
import { ArrowUpRight, Bell, Box, Database, Flame, UserScan } from './Icons'

const features: { icon: ComponentType<{ size?: number }>; title: string; body: string }[] = [
  {
    icon: Flame,
    title: 'Fire & Smoke Detection',
    body: 'A fine-tuned YOLO model finds flames and smoke in each frame, often before they are obvious.',
  },
  {
    icon: UserScan,
    title: 'Person Tracking',
    body: 'Follows people across frames and flags sustained, unusual movement in red.',
  },
  {
    icon: Box,
    title: 'Object Detection',
    body: 'General COCO detection adds context to every scene beyond the hazards.',
  },
  {
    icon: Bell,
    title: 'Real-time Alerts',
    body: 'Debounced WebSocket pushes reach every connected browser and phone instantly.',
  },
  {
    icon: Database,
    title: 'Event History',
    body: 'Every detection is logged to SQLite with timestamps for later review.',
  },
]

const CLASSES = [
  { key: 'fire', label: 'fire', base: 0.91 },
  { key: 'smoke', label: 'smoke', base: 0.74 },
  { key: 'person', label: 'person', base: 0.22 },
  { key: 'oven', label: 'oven', base: 0.63 },
] as const

type LogLine = { id: number; time: string; label: string; conf: string; alert: boolean }

/** Night-vision style inference console: frame, live confidences, event log. */
function Console() {
  const [tick, setTick] = useState(0)
  const [log, setLog] = useState<LogLine[]>(() =>
    [1, 2, 3].map((i) => ({
      id: -i,
      time: new Date(Date.now() - i * 1600).toLocaleTimeString([], { hour12: false }),
      label: i % 2 ? 'fire' : 'smoke',
      conf: i % 2 ? '0.9' + i : '0.7' + i,
      alert: i % 2 === 1,
    })),
  )

  useEffect(() => {
    const t = window.setInterval(() => {
      setTick((n) => n + 1)
      setLog((l) => {
        const isFire = Math.random() > 0.4
        const line: LogLine = {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour12: false }),
          label: isFire ? 'fire' : 'smoke',
          conf: (isFire ? 0.88 + Math.random() * 0.08 : 0.7 + Math.random() * 0.1).toFixed(2),
          alert: isFire,
        }
        return [line, ...l].slice(0, 5)
      })
    }, 1600)
    return () => window.clearInterval(t)
  }, [])

  const confs = CLASSES.map((c, i) => {
    const wobble = Math.sin(tick * 1.7 + i * 2) * 0.05
    return { ...c, v: Math.max(0.05, Math.min(0.99, c.base + wobble)) }
  })

  return (
    <div className="console" aria-hidden>
      <div className="console__top">
        <span>
          <span className="rec" /> CAM 0 · IR
        </span>
        <span>yolo · fire_smoke.pt</span>
        <span>frame {String(48210 + tick * 24).padStart(6, '0')}</span>
      </div>

      <div className="console__frame">
        <svg viewBox="0 0 640 380" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="ir-glow" cx="0.5" cy="0.6" r="0.5">
              <stop offset="0" stopColor="#e9ffd8" stopOpacity="0.95" />
              <stop offset="0.4" stopColor="#9bf07a" stopOpacity="0.5" />
              <stop offset="1" stopColor="#3c7a35" stopOpacity="0" />
            </radialGradient>
            <filter id="ir-blur">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>
          <rect width="640" height="380" fill="#0c1a0e" />
          {/* kitchen: cabinets, counter, stove */}
          <g fill="#13281a" stroke="#1f4026" strokeWidth="2">
            <rect x="30" y="30" width="160" height="90" />
            <rect x="200" y="30" width="160" height="90" />
            <rect x="470" y="30" width="140" height="90" />
            <rect x="0" y="230" width="640" height="150" />
            <rect x="230" y="240" width="190" height="130" />
          </g>
          <g stroke="#2a5432" strokeWidth="2" fill="none">
            <path d="M110 30v90M280 30v90M540 30v90" />
            <rect x="250" y="270" width="150" height="80" rx="6" />
            <path d="M0 230h640" />
          </g>
          {/* hood */}
          <path d="M260 120h130l30 60H230Z" fill="#163020" stroke="#2a5432" strokeWidth="2" />
          {/* pan */}
          <ellipse cx="325" cy="228" rx="62" ry="10" fill="#1d3a24" />
          <rect x="386" y="223" width="70" height="6" rx="3" fill="#1d3a24" />
          {/* flame (bright in IR) */}
          <ellipse cx="325" cy="200" rx="90" ry="60" fill="url(#ir-glow)" className="scene__fireglow" />
          <g className="scene__flames">
            <path d="M300 226c-10-18 6-26 3-44 10 9 14 19 11 27 5-9 7-22 2-38 17 12 24 33 16 55Z" fill="#c8ff9e" />
            <path d="M322 226c-6-12 4-18 4-30 8 8 10 16 7 22 4-6 6-14 2-23 10 8 14 20 8 31Z" fill="#f2ffe6" />
            <path d="M342 226c-7-14 4-21 6-33 9 9 11 21 6 33Z" fill="#b6f58a" />
          </g>
          {/* smoke */}
          <g filter="url(#ir-blur)" fill="#5f8f5a" className="scene__smoke">
            <circle cx="320" cy="150" r="30" opacity="0.5" />
            <circle cx="345" cy="110" r="38" opacity="0.4" />
            <circle cx="310" cy="72" r="42" opacity="0.32" />
          </g>
          {/* boxes */}
          <g fontFamily="JetBrains Mono, monospace" fontSize="13" fontWeight="700">
            <rect x="284" y="160" width="82" height="70" rx="4" fill="none" stroke="#ff8a3d" strokeWidth="2.5" className="console__box" />
            <rect x="283" y="141" width="86" height="19" rx="3" fill="#ff8a3d" />
            <text x="289" y="155" fill="#1f0e04">
              fire {confs[0].v.toFixed(2)}
            </text>
            <rect x="268" y="40" width="130" height="118" rx="4" fill="none" stroke="#d9e6d4" strokeWidth="2" strokeDasharray="8 6" className="console__box" />
            <rect x="267" y="21" width="96" height="19" rx="3" fill="#d9e6d4" />
            <text x="273" y="35" fill="#13251a">
              smoke {confs[1].v.toFixed(2)}
            </text>
            <rect x="232" y="242" width="186" height="126" rx="4" fill="none" stroke="#7fd8ff" strokeWidth="1.5" opacity="0.8" />
            <text x="238" y="362" fill="#7fd8ff">
              oven {confs[3].v.toFixed(2)}
            </text>
          </g>
          {/* noise lines */}
          <g opacity="0.08" stroke="#b6ffa0">
            {Array.from({ length: 19 }, (_, i) => (
              <path key={i} d={`M0 ${i * 20 + 4}h640`} />
            ))}
          </g>
        </svg>
        <div className="console__scan" />
        <div className="console__vignette" />
      </div>

      <div className="console__panels">
        <div className="console__bars">
          <p className="console__label">Class confidence</p>
          {confs.map((c) => (
            <div className={`cbar ${c.v >= 0.35 ? 'is-hit' : ''} cbar--${c.key}`} key={c.key}>
              <span>{c.label}</span>
              <div className="cbar__track">
                <i style={{ width: `${c.v * 100}%` }} />
                <b style={{ left: '35%' }} title="threshold 0.35" />
              </div>
              <em>{c.v.toFixed(2)}</em>
            </div>
          ))}
        </div>
        <div className="console__log">
          <p className="console__label">Event log</p>
          <ul>
            {log.map((l, i) => (
              <li key={l.id} className={i === 0 ? 'is-new' : ''}>
                <span>{l.time}</span>
                <span className={`tag tag--${l.label}`}>{l.label}</span>
                <span>{l.conf}</span>
                <span className="console__sent">{l.alert ? '→ alert sent' : 'logged'}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function Features() {
  return (
    <section className="split" id="features">
      <div className="split__media reveal reveal--fade">
        <Console />
      </div>

      <div className="split__body">
        <p className="kicker reveal">What it does</p>
        <h2 className="reveal">
          Everything You Need,
          <br />
          <em>Nothing</em> You Don't
        </h2>
        <p className="lead reveal">
          From the first wisp of smoke to a notification on your phone, every piece runs on your
          own hardware, with no cloud and no subscription.
        </p>

        <ol className="feature-list">
          {features.map((f, i) => (
            <li className="feature-row reveal" key={f.title} style={{ transitionDelay: `${i * 70}ms` }}>
              <span className="feature-row__num">0{i + 1}</span>
              <div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
              <span className="feature-row__icon">
                <f.icon size={20} />
              </span>
            </li>
          ))}
        </ol>

        <a className="link-arrow reveal" href="#/docs/detection">
          Read how detection works <ArrowUpRight size={16} />
        </a>
      </div>
    </section>
  )
}
