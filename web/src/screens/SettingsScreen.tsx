import type { ReactNode } from 'react'
import type { SocketStatus } from '../hooks/useAlertSocket'
import { serverLabel, wsUrl } from '../lib/api'
import type { ThemePref } from '../lib/prefs'
import { Toggle } from '../components/Toggle'
import { StatusPill } from '../components/StatusPill'
import { IconBell, IconExternal, IconMonitor, IconMoon, IconPlay, IconSun } from '../components/Icons'

export type AlertPrefs = {
  sound: boolean
  vibration: boolean
  notifications: boolean
  autoOpen: boolean
}

function Card({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="card settings-card">
      <header className="card__head card__head--stack">
        <h2>{title}</h2>
        {desc && <p className="muted">{desc}</p>}
      </header>
      <div className="settings-card__body">{children}</div>
    </section>
  )
}

export function SettingsScreen({
  theme,
  onTheme,
  prefs,
  onPrefs,
  notifPermission,
  onEnableNotifications,
  status,
  retryIn,
  onRetry,
  onPreview,
}: {
  theme: ThemePref
  onTheme: (t: ThemePref) => void
  prefs: AlertPrefs
  onPrefs: (p: AlertPrefs) => void
  notifPermission: NotificationPermission | 'unsupported'
  onEnableNotifications: () => void
  status: SocketStatus
  retryIn: number
  onRetry: () => void
  onPreview: () => void
}) {
  const set = (patch: Partial<AlertPrefs>) => onPrefs({ ...prefs, ...patch })

  const notifHint =
    notifPermission === 'unsupported'
      ? 'Not supported in this browser.'
      : notifPermission === 'denied'
        ? 'Blocked in browser settings. Allow notifications for this site to enable.'
        : 'Show a system notification when this app is in the background.'

  return (
    <main className="page" aria-labelledby="settings-title">
      <header className="page-head">
        <p className="kicker">Preferences</p>
        <h1 id="settings-title">Settings</h1>
        <p className="page-head__lede">How this device reacts to alerts. Settings are stored on this device only.</p>
      </header>

      <div className="settings-grid">
        <Card title="When an alert arrives" desc="Choose how you want to be told about a new hazard.">
          <Toggle label="Sound" hint="Two short tones" checked={prefs.sound} onChange={(v) => set({ sound: v })} />
          <Toggle
            label="Vibration"
            hint="On phones that support it"
            checked={prefs.vibration}
            onChange={(v) => set({ vibration: v })}
          />
          <Toggle
            label="Open the alerts panel"
            hint="Slide the panel in automatically"
            checked={prefs.autoOpen}
            onChange={(v) => set({ autoOpen: v })}
          />
          <Toggle
            label="System notifications"
            hint={notifHint}
            checked={prefs.notifications && notifPermission === 'granted'}
            disabled={notifPermission === 'unsupported' || notifPermission === 'denied'}
            onChange={(v) => {
              if (v && notifPermission !== 'granted') onEnableNotifications()
              else set({ notifications: v })
            }}
          />
          <div className="row">
            <span className="row__icon">
              <IconPlay size={18} />
            </span>
            <span className="row__text">
              <span className="row__label">Preview an alert</span>
              <span className="row__hint">Test sound and the panel. Nothing is sent to the server.</span>
            </span>
            <button type="button" className="btn btn--outline btn--sm" onClick={onPreview}>
              Preview
            </button>
          </div>
        </Card>

        <Card title="Appearance">
          <div className="theme-picker" role="radiogroup" aria-label="Theme">
            {(
              [
                ['system', 'System', IconMonitor],
                ['light', 'Light', IconSun],
                ['dark', 'Dark', IconMoon],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={theme === id}
                className={`theme-opt theme-opt--${id} ${theme === id ? 'is-active' : ''}`}
                onClick={() => onTheme(id)}
              >
                <span className="theme-opt__preview" aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
                <span className="theme-opt__label">
                  <Icon size={16} /> {label}
                </span>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Connection">
          <div className="row">
            <span className="row__icon">
              <IconBell size={18} />
            </span>
            <span className="row__text">
              <span className="row__label">Live channel</span>
              <span className="row__hint mono">{wsUrl()}</span>
            </span>
            <StatusPill status={status} retryIn={retryIn} />
          </div>
          <div className="row">
            <span className="row__icon">
              <IconMonitor size={18} />
            </span>
            <span className="row__text">
              <span className="row__label">Alert server</span>
              <span className="row__hint mono">{serverLabel()}</span>
            </span>
            {status !== 'open' && (
              <button type="button" className="btn btn--outline btn--sm" onClick={onRetry}>
                Reconnect
              </button>
            )}
          </div>
        </Card>

        <Card title="About">
          <p className="about">
            Danger Detection Alerts shows fire and smoke detected by the Danger Detection desktop monitor. Install it to
            your home screen for one-tap access.
          </p>
          <p className="about about--warn">
            This app adds awareness. It is not a certified fire alarm, so keep tested smoke alarms installed.
          </p>
          <a className="btn btn--outline btn--sm" href="https://github.com/Miftah-Fentaw/Danger-Detection" target="_blank" rel="noreferrer">
            Project on GitHub <IconExternal size={14} />
          </a>
        </Card>
      </div>
    </main>
  )
}
