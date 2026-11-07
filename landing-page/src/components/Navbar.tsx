import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useScrolled, useScrollSpy } from '../hooks'
import { docHref, type Route } from '../router'
import { DOC_GROUPS } from '../docs/content'
import { GITHUB_URL } from '../site'
import { Arrow, ChevronDown, Close, GitHub, Menu } from './Icons'
import { BrandMark } from './BrandMark'
import { SearchPalette } from './Search'

const LINKS = [
  { id: 'top', href: '#/', label: 'Home' },
  { id: 'features', href: '#features', label: 'Features' },
  { id: 'how-it-works', href: '#how-it-works', label: 'How it works' },
  { id: 'use-cases', href: '#use-cases', label: 'Use cases' },
  { id: 'quick-start', href: '#quick-start', label: 'Quick start' },
]
// 'faq' is tracked so the indicator hides there instead of sticking on Quick start
const SPY_IDS = ['top', 'features', 'how-it-works', 'use-cases', 'quick-start', 'faq']

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <a href="#/" className={`logo ${compact ? 'logo--compact' : ''}`} aria-label="Danger Detection home">
      <BrandMark size={34} />
      <span className="logo__text">
        Danger
        <br />
        Detection
      </span>
    </a>
  )
}

export function Navbar({ route }: { route: Route }) {
  const scrolled = useScrolled(30)
  const spy = useScrollSpy(SPY_IDS, 200)
  const active = route.page === 'docs' ? 'docs' : spy
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(false)

  const linksRef = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false })

  useLayoutEffect(() => {
    const measure = () => {
      const el = linksRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`)
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth, ready: true })
      else setPill((p) => ({ ...p, ready: false }))
    }
    measure()
    window.addEventListener('resize', measure)
    // fonts can change widths after first paint
    document.fonts?.ready.then(measure)
    return () => window.removeEventListener('resize', measure)
  }, [active])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearch((s) => !s)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    const onOpen = () => setSearch(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('dd:search', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('dd:search', onOpen)
    }
  }, [])

  const close = () => setOpen(false)

  return (
    <>
      <header className={`nav ${scrolled || route.page === 'docs' ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
        <Logo />
        <span className="nav__sep" aria-hidden />

        <nav className="nav__links" aria-label="Primary" ref={linksRef}>
          <span
            className="nav__indicator"
            style={{ transform: `translateX(${pill.left}px)`, width: pill.width, opacity: pill.ready ? 1 : 0 }}
            aria-hidden
          />
          {LINKS.map((l) => (
            <a
              key={l.id}
              data-id={l.id}
              href={l.href}
              className={active === l.id ? 'is-active' : ''}
              aria-current={active === l.id ? 'page' : undefined}
              onClick={close}
            >
              {l.label}
            </a>
          ))}

          <div className="nav__drop" data-id="docs">
            <a href="#/docs" className={active === 'docs' ? 'is-active' : ''} onClick={close}>
              Docs <ChevronDown size={14} />
            </a>
            <div className="mega" role="menu">
              {DOC_GROUPS.map((g) => (
                <div className="mega__col" key={g.title}>
                  <p>{g.title}</p>
                  {g.items.slice(0, 4).map((it) => (
                    <a key={it.slug} href={docHref(it.slug)} role="menuitem" onClick={close}>
                      <strong>{it.title}</strong>
                      <small>{it.summary}</small>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </nav>

        <span className="nav__sep" aria-hidden />

        <div className="nav__actions">
          <a className="nav__icon" href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub repository">
            <GitHub size={17} />
          </a>
          <a className="pill-cta" href="#/docs/installation">
            <span>Get Started</span>
            <i>
              <Arrow size={15} />
            </i>
          </a>
          <button
            className="nav__icon nav__toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <Close size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>
      <SearchPalette open={search} onClose={() => setSearch(false)} />
    </>
  )
}
