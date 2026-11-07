import { useState } from 'react'
import { ArrowUpRight, Check, Copy } from './Icons'

const tabs = {
  install: {
    label: 'install.sh',
    lines: [
      'git clone https://github.com/Miftah-Fentaw/Danger-Detection.git',
      'cd Danger-Detection',
      'python3 -m venv venv && source venv/bin/activate',
      'pip install -r danger_detection/requirements.txt',
      'cd web && npm install && npm run build && cd ..',
    ],
  },
  server: {
    label: 'server.sh',
    lines: [
      'source venv/bin/activate',
      'export PYTHONPATH="${PWD}"',
      'uvicorn danger_detection.app.pwa_server:app --host 127.0.0.1 --port 8000',
    ],
  },
  desktop: {
    label: 'detector.sh',
    lines: ['source venv/bin/activate', 'PYTHONPATH=. python -m danger_detection.app.main'],
  },
} as const

type TabKey = keyof typeof tabs

const STEP_TEXT: Record<TabKey, string> = {
  install: 'Install Python and web dependencies',
  server: 'Start the FastAPI alert server',
  desktop: 'Launch the desktop detector',
}

export function QuickStart() {
  const [active, setActive] = useState<TabKey>('install')
  const [copied, setCopied] = useState(false)
  const tab = tabs[active]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tab.lines.join('\n'))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <section className="quick" id="quick-start">
      <div className="quick__copy">
        <p className="kicker reveal">Quick start</p>
        <h2 className="reveal">
          Up and Running
          <br />
          in <em>Three Steps</em>
        </h2>
        <p className="lead reveal">
          You need Python 3.10+ and Node.js 18+. Place your fine-tuned model at{' '}
          <code>danger_detection/models/fire_smoke.pt</code>, then open{' '}
          <code>localhost:8000</code> to see alerts.
        </p>
        <ol className="quick__steps reveal">
          {(Object.keys(tabs) as TabKey[]).map((k, i) => (
            <li key={k}>
              <button className={active === k ? 'is-active' : ''} onClick={() => setActive(k)}>
                <span>0{i + 1}</span>
                {STEP_TEXT[k]}
              </button>
            </li>
          ))}
        </ol>
        <a className="link-arrow quick__more reveal" href="#/docs/installation">
          Full installation guide <ArrowUpRight size={16} />
        </a>
      </div>

      <div className="quick__code reveal">
        <div className="terminal__bar">
          <span className="terminal__dots">
            <i />
            <i />
            <i />
          </span>
          <div className="terminal__tabs" role="tablist">
            {(Object.keys(tabs) as TabKey[]).map((k) => (
              <button
                key={k}
                role="tab"
                aria-selected={active === k}
                className={active === k ? 'is-active' : ''}
                onClick={() => setActive(k)}
              >
                {tabs[k].label}
              </button>
            ))}
          </div>
          <button className="terminal__copy" onClick={copy} aria-label="Copy commands">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <pre className="terminal__body" key={active}>
          {tab.lines.map((line, i) => (
            <code key={line} style={{ animationDelay: `${i * 90}ms` }}>
              <span className="prompt">$</span> {line}
            </code>
          ))}
          <code style={{ animationDelay: `${tab.lines.length * 90}ms` }}>
            <span className="prompt">$</span> <span className="caret" />
          </code>
        </pre>
      </div>
    </section>
  )
}
