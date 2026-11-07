import { useRef, type ComponentType } from 'react'
import { Arrow, ArrowUpRight, Chef, Flask, Home, Warehouse } from './Icons'
import { ISSUES_URL } from '../site'

const cases: { icon: ComponentType<{ size?: number }>; title: string; body: string; tag: string; tone: string }[] = [
  {
    icon: Home,
    title: 'Homes',
    body: 'Watch the garage, workshop or living room and get an alert while you are away.',
    tag: 'Personal',
    tone: 'dawn',
  },
  {
    icon: Warehouse,
    title: 'Warehouses',
    body: 'Cover large storage areas where a small fire could go unnoticed for minutes.',
    tag: 'Industrial',
    tone: 'slate',
  },
  {
    icon: Chef,
    title: 'Kitchens',
    body: 'Catch smoke and flare-ups around stoves and fryers before they spread.',
    tag: 'Hospitality',
    tone: 'ember',
  },
  {
    icon: Flask,
    title: 'Labs & Workshops',
    body: 'Keep watch over 3D printers, soldering benches and long unattended runs.',
    tag: 'Research',
    tone: 'sea',
  },
  {
    icon: Home,
    title: 'Offices & Studios',
    body: 'Server closets, kitchenettes and after-hours spaces, covered by the cameras you have.',
    tag: 'Workplace',
    tone: 'dusk',
  },
]

export function UseCases() {
  const rail = useRef<HTMLDivElement>(null)
  const scroll = (dir: 1 | -1) => {
    const el = rail.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(420, el.clientWidth * 0.8), behavior: 'smooth' })
  }

  return (
    <section className="rail-section" id="use-cases">
      <div className="rail-head">
        <div className="reveal">
          <p className="kicker">Use cases</p>
          <h2>
            Built for the Places <em>Fire</em> Starts
          </h2>
        </div>
        <div className="rail-head__side reveal">
          <p>If it has a camera and a computer nearby, Danger Detection can watch it.</p>
          <div className="rail-nav">
            <button onClick={() => scroll(-1)} aria-label="Previous">
              <Arrow size={18} style={{ transform: 'rotate(180deg)' }} />
            </button>
            <button onClick={() => scroll(1)} aria-label="Next">
              <Arrow size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="rail" ref={rail}>
        {cases.map((c, i) => (
          <article className={`tile tile--${c.tone} reveal`} key={c.title} style={{ transitionDelay: `${i * 80}ms` }}>
            <span className="tile__num">0{i + 1}</span>
            <span className="tile__icon">
              <c.icon size={30} />
            </span>
            <div className="tile__body">
              <span className="tile__tag">{c.tag}</span>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          </article>
        ))}
        <a className="tile tile--more" href={ISSUES_URL} target="_blank" rel="noreferrer">
          <span className="tile__icon">
            <ArrowUpRight size={30} />
          </span>
          <div className="tile__body">
            <h3>Your use case?</h3>
            <p>Tell us where you would run it. Open an issue on GitHub.</p>
          </div>
        </a>
      </div>
    </section>
  )
}
