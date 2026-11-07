import { useState, type MouseEvent } from 'react'

type Theme = 'light' | 'dark'

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function applyTheme(t: Theme) {
  document.documentElement.dataset.theme = t
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#111312' : '#f3eee7')
  try {
    localStorage.setItem('dd-theme', t)
  } catch {
    /* storage unavailable */
  }
}

/** Sun ⇄ moon switch. Uses a circular view transition where supported, a cross-fade otherwise. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme)
  const dark = theme === 'dark'

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    const next: Theme = dark ? 'light' : 'dark'
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } }

    if (doc.startViewTransition && !reduce) {
      const x = e.clientX || 40
      const y = e.clientY || 40
      const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
      const vt = doc.startViewTransition(() => {
        applyTheme(next)
        setTheme(next)
      })
      vt.ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 700, easing: 'cubic-bezier(0.76, 0, 0.24, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      })
      return
    }

    const root = document.documentElement
    root.classList.add('theme-fade')
    applyTheme(next)
    setTheme(next)
    window.setTimeout(() => root.classList.remove('theme-fade'), 600)
  }

  return (
    <button
      className={`theme-toggle ${dark ? 'is-dark' : ''}`}
      onClick={toggle}
      role="switch"
      aria-checked={dark}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Light theme' : 'Dark theme'}
    >
      <span className="theme-toggle__stars" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <span className="theme-toggle__knob" aria-hidden>
        <svg viewBox="0 0 24 24" width="18" height="18">
          <mask id="moon-cut">
            <rect width="24" height="24" fill="#fff" />
            <circle className="theme-toggle__cut" cx="17" cy="7" r="6" fill="#000" />
          </mask>
          <circle className="theme-toggle__core" cx="12" cy="12" r="5" fill="currentColor" mask="url(#moon-cut)" />
          <g className="theme-toggle__rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M4.6 19.4 6 18M18 6l1.4-1.4" />
          </g>
        </svg>
      </span>
    </button>
  )
}
