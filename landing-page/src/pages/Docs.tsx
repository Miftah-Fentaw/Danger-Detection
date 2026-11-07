import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { DOC_GROUPS, DOC_ITEMS } from '../docs/content'
import { docHref } from '../router'
import { useRevealOnScroll, useScrollProgress, useScrollSpy } from '../hooks'
import { Arrow, ArrowUpRight, GitHub, Menu, Search } from '../components/Icons'
import { GITHUB_URL, ISSUES_URL } from '../site'
import { usePageMeta } from '../meta'
import { DOCS_TITLE } from '../seo'

const NAV_OFFSET = 104
const QUICK = ['installation', 'running', 'configuration', 'api']

function scrollToSlug(slug: string, smooth = true) {
  const el = document.getElementById(`doc-${slug}`)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET + 1
  window.scrollTo({ top, behavior: smooth ? 'smooth' : 'instant' })
}

export function Docs({ slug }: { slug: string }) {
  useRevealOnScroll('docs')
  const ids = useMemo(() => DOC_ITEMS.map((d) => `doc-${d.slug}`), [])
  const activeId = useScrollSpy(ids, NAV_OFFSET + 40)
  const active = activeId.replace(/^doc-/, '')
  const progress = useScrollProgress()
  const [drawer, setDrawer] = useState(false)

  // Jump to the section named in the URL (again once web fonts have settled the layout).
  useEffect(() => {
    let alive = true
    const jump = () => {
      if (!alive) return
      if (slug) scrollToSlug(slug, false)
      else window.scrollTo({ top: 0, behavior: 'instant' })
    }
    const t = window.setTimeout(jump, 40)
    document.fonts?.ready.then(() => window.setTimeout(jump, 60))
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [slug])

  // Keep the URL in sync with what is being read, without adding history entries.
  useEffect(() => {
    if (!active) return
    const target = docHref(active)
    if (window.location.hash !== target) window.history.replaceState(null, '', target)
  }, [active])

  // Sliding indicator in the sidebar.
  const sideRef = useRef<HTMLElement>(null)
  const [mark, setMark] = useState({ top: 0, height: 0 })
  useLayoutEffect(() => {
    const el = sideRef.current?.querySelector<HTMLAnchorElement>(`a[data-slug="${active}"]`)
    if (el) setMark({ top: el.offsetTop, height: el.offsetHeight })
  }, [active])

  const onNav = (e: MouseEvent<HTMLAnchorElement>, s: string) => {
    e.preventDefault()
    window.history.pushState(null, '', docHref(s))
    scrollToSlug(s)
    setDrawer(false)
  }

  const current = DOC_ITEMS.find((d) => d.slug === active) ?? DOC_ITEMS[0]
  usePageMeta(DOCS_TITLE(current.title), `${current.title}: ${current.summary} Danger Detection documentation.`)

  return (
    <div className="docs">
      <div className="docs__progress" style={{ transform: `scaleX(${progress})` }} aria-hidden />

      <header className="docs-hero">
        <div className="docs-hero__glow" aria-hidden />
        <div>
          <p className="kicker hero-in">Documentation</p>
          <h1 className="hero__title docs-hero__title">
            <span className="line">
              <span style={{ animationDelay: '0.1s' }}>Everything about</span>
            </span>
            <span className="line">
              <span style={{ animationDelay: '0.22s' }}>
                <em>Danger Detection</em>
              </span>
            </span>
          </h1>
          <p className="docs-hero__lead hero-in" style={{ animationDelay: '0.4s' }}>
            Install it, run it, configure it, and understand how every part works, from the YOLO detector to the alert
            server and the web app.
          </p>
          <div className="docs-hero__actions hero-in" style={{ animationDelay: '0.5s' }}>
            <button className="docs-search" onClick={() => window.dispatchEvent(new Event('dd:search'))}>
              <Search size={16} />
              Search the docs
              <kbd>⌘K</kbd>
            </button>
            <a className="link-arrow" href={GITHUB_URL} target="_blank" rel="noreferrer">
              <GitHub size={16} /> View on GitHub
            </a>
          </div>
        </div>
        <ul className="docs-quick hero-in" style={{ animationDelay: '0.6s' }}>
          {QUICK.map((q, i) => {
            const item = DOC_ITEMS.find((d) => d.slug === q)!
            return (
              <li key={q}>
                <a href={docHref(q)} onClick={(e) => onNav(e, q)}>
                  <span>0{i + 1}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.summary}</small>
                  </span>
                  <ArrowUpRight size={18} />
                </a>
              </li>
            )
          })}
        </ul>
      </header>

      <div className="docs__body">
        <button className="docs__drawer-btn" onClick={() => setDrawer((d) => !d)} aria-expanded={drawer}>
          <Menu size={16} />
          <span>
            <small>{current.group}</small>
            {current.title}
          </span>
        </button>

        <aside className={`docs__side ${drawer ? 'is-open' : ''}`} ref={sideRef} aria-label="Documentation">
          <span
            className="docs__mark"
            style={{
              transform: `translateY(${mark.top}px)`,
              height: mark.height,
            }}
            aria-hidden
          />
          {DOC_GROUPS.map((g) => (
            <div className="docs__group" key={g.title}>
              <p>{g.title}</p>
              <ul>
                {g.items.map((it) => (
                  <li key={it.slug}>
                    <a
                      href={docHref(it.slug)}
                      data-slug={it.slug}
                      className={active === it.slug ? 'is-active' : ''}
                      aria-current={active === it.slug ? 'location' : undefined}
                      onClick={(e) => onNav(e, it.slug)}
                    >
                      {it.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="docs__side-foot">
            <a href={ISSUES_URL} target="_blank" rel="noreferrer">
              Report an issue <ArrowUpRight size={14} />
            </a>
          </div>
        </aside>

        <article className="docs__content">
          {DOC_ITEMS.map((d, i) => {
            const next = DOC_ITEMS[i + 1]
            return (
              <section className="doc reveal" id={`doc-${d.slug}`} key={d.slug}>
                <p className="doc__group">{d.group}</p>
                <h2>
                  <a href={docHref(d.slug)} onClick={(e) => onNav(e, d.slug)}>
                    {d.title}
                    <span aria-hidden>#</span>
                  </a>
                </h2>
                <p className="doc__summary">{d.summary}</p>
                <div className="doc__body">{d.body}</div>
                {next && (
                  <a className="doc__next" href={docHref(next.slug)} onClick={(e) => onNav(e, next.slug)}>
                    <span>
                      <small>Next</small>
                      {next.title}
                    </span>
                    <Arrow size={18} />
                  </a>
                )}
              </section>
            )
          })}
        </article>
      </div>
    </div>
  )
}
