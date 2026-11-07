import { useState } from 'react'
import { Arrow, Check, Copy, GitHub } from './Icons'
import { GITHUB_URL } from '../site'

const INSTALL = `git clone ${GITHUB_URL}.git`

export function Hero() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <section className="hero" id="top">
      <div className="hero__inner">
        <a className="hero__badge" href={GITHUB_URL} target="_blank" rel="noreferrer">
          <span>Open source</span>
          MIT licensed · Python &amp; React
          <Arrow size={14} />
        </a>

        <h1 className="hero__title">
          Detect Danger
          <br />
          <em>Before It</em> Spreads
        </h1>

        <p className="hero__lead">
          AI-powered fire and smoke detection for any camera. Real-time YOLO computer vision, instant
          alerts to your phone, and everything runs on your own machine.
        </p>

        <div className="hero__ctas">
          <a className="pill-cta pill-cta--lg" href="#/docs/installation">
            <span>Get Started</span>
            <i>
              <Arrow size={18} />
            </i>
          </a>
          <a className="btn btn--outline" href={GITHUB_URL} target="_blank" rel="noreferrer">
            <GitHub size={18} /> View on GitHub
          </a>
        </div>

        <div className="hero__install">
          <code>
            <span className="prompt">$</span> {INSTALL}
          </code>
          <button onClick={copy} aria-label="Copy install command">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>

        <ul className="hero__meta">
          <li>Python 3.10+</li>
          <li>Ultralytics YOLO</li>
          <li>FastAPI + WebSocket</li>
          <li>Installable PWA</li>
        </ul>
      </div>
    </section>
  )
}
