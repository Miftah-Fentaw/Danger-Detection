import { Arrow, Book, GitHub } from './Icons'
import { Logo } from './Navbar'
import { GITHUB_URL, ISSUES_URL, LICENSE_URL } from '../site'

export function CTA() {
  return (
    <section className="cta">
      <div className="cta__rings" aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="cta__core" aria-hidden />
      <div className="cta__content reveal">
        <p className="kicker kicker--light">Ready when you are</p>
        <h2>
          Protect What Matters,
          <br />
          <em>Starting Today</em>
        </h2>
        <p>Free, open source, and running on your own machine in minutes.</p>
        <div className="cta__actions">
          <a className="pill-cta pill-cta--lg pill-cta--light" href="#/docs/installation">
            <span>Read the install guide</span>
            <i>
              <Arrow size={18} />
            </i>
          </a>
          <a className="btn btn--outline-light" href={GITHUB_URL} target="_blank" rel="noreferrer">
            <GitHub size={18} /> View source
          </a>
        </div>
      </div>
    </section>
  )
}

const YEAR = new Date().getFullYear()

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Use cases', href: '#use-cases' },
      { label: 'Quick start', href: '#quick-start' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  {
    title: 'Docs',
    links: [
      { label: 'Introduction', href: '#/docs/introduction' },
      { label: 'Installation', href: '#/docs/installation' },
      { label: 'Configuration', href: '#/docs/configuration' },
      { label: 'API reference', href: '#/docs/api' },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'Source code', href: GITHUB_URL },
      { label: 'Report an issue', href: ISSUES_URL },
      { label: 'MIT License', href: LICENSE_URL },
      { label: 'Ultralytics YOLO', href: 'https://ultralytics.com' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <Logo />
          <p>Real-time fire and smoke detection with instant alerts. Open source and private by design.</p>
          <div className="footer__social">
            <a className="circle-btn" href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub">
              <GitHub size={18} />
            </a>
            <a className="circle-btn" href="#/docs" aria-label="Documentation">
              <Book size={18} />
            </a>
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title} className="footer__col">
            <h4>{col.title}</h4>
            <ul>
              {col.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} {...(l.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="footer__wordmark" aria-hidden>
        Danger Detection
      </p>
      <div className="footer__bottom">
        <span>© {YEAR} Danger Detection · MIT License</span>
        <a href="#/">Back to top ↑</a>
      </div>
    </footer>
  )
}
