import type { ComponentType } from 'react'
import type { SocketStatus } from '../hooks/useAlertSocket'
import { BrandMark } from './BrandMark'
import { IconBell, IconGrid, IconMoon, IconSettings, IconSun, IconTable } from './Icons'
import { StatusPill } from './StatusPill'

export type Screen = 'overview' | 'events' | 'settings'

type NavProps = {
  screen: Screen
  onScreen: (s: Screen) => void
  unread: number
  panelOpen: boolean
  onTogglePanel: () => void
  status: SocketStatus
  retryIn: number
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

const ITEMS: { id: Screen; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: 'overview', label: 'Overview', icon: IconGrid },
  { id: 'events', label: 'Events', icon: IconTable },
  { id: 'settings', label: 'Settings', icon: IconSettings },
]

function Badge({ n }: { n: number }) {
  if (n <= 0) return null
  return (
    <span className="badge" aria-label={`${n} unacknowledged`}>
      {n > 99 ? '99+' : n}
    </span>
  )
}

/** Left sidebar for tablets (icon rail) and desktops (full). */
export function Sidebar(p: NavProps) {
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar__brand">
        <BrandMark size={34} />
        <span className="sidebar__name">
          Danger Detection
          <small>Alerts</small>
        </span>
      </div>

      <p className="sidebar__section">Monitor</p>
      <nav className="sidebar__nav">
        {ITEMS.map((it) => (
          <button
            key={it.id}
            type="button"
            className={`navlink ${p.screen === it.id ? 'is-active' : ''}`}
            aria-current={p.screen === it.id ? 'page' : undefined}
            onClick={() => p.onScreen(it.id)}
            title={it.label}
          >
            <it.icon size={20} />
            <span className="navlink__label">{it.label}</span>
          </button>
        ))}
        <button
          type="button"
          className={`navlink ${p.panelOpen ? 'is-active' : ''} ${p.unread ? 'is-urgent' : ''}`}
          aria-expanded={p.panelOpen}
          onClick={p.onTogglePanel}
          title="Alerts"
        >
          <span className="navlink__icon">
            <IconBell size={20} />
            <Badge n={p.unread} />
          </span>
          <span className="navlink__label">Alerts</span>
          {p.unread > 0 && <span className="navlink__count">{p.unread}</span>}
        </button>
      </nav>

      <div className="sidebar__foot">
        <div className="sidebar__status">
          <StatusPill status={p.status} retryIn={p.retryIn} />
          <span className="sidebar__status-hint">
            {p.status === 'open' ? 'Receiving alerts in real time' : 'Waiting for the alert server'}
          </span>
        </div>
        <button
          type="button"
          className="navlink"
          onClick={p.onToggleTheme}
          title={p.theme === 'dark' ? 'Light theme' : 'Dark theme'}
        >
          {p.theme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
          <span className="navlink__label">{p.theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>
        </button>
      </div>
    </aside>
  )
}

/** Phone header: brand, live status, alerts bell. */
export function TopBar(p: NavProps) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <BrandMark size={28} />
        <span>Danger Detection</span>
      </div>
      <div className="topbar__actions">
        <StatusPill status={p.status} compact />
        <button
          type="button"
          className={`icon-btn ${p.unread ? 'is-urgent' : ''}`}
          onClick={p.onTogglePanel}
          aria-label={`Alerts${p.unread ? `, ${p.unread} unacknowledged` : ''}`}
          aria-expanded={p.panelOpen}
        >
          <IconBell size={20} />
          <Badge n={p.unread} />
        </button>
      </div>
    </header>
  )
}

/** Phone bottom tabs. */
export function BottomTabs(p: NavProps) {
  return (
    <nav className="tabs" aria-label="Main navigation">
      {ITEMS.map((it) => (
        <button
          key={it.id}
          type="button"
          className={`tab ${p.screen === it.id && !p.panelOpen ? 'is-active' : ''}`}
          aria-current={p.screen === it.id ? 'page' : undefined}
          onClick={() => p.onScreen(it.id)}
        >
          <it.icon size={22} />
          <span>{it.label}</span>
        </button>
      ))}
      <button type="button" className={`tab ${p.panelOpen ? 'is-active' : ''}`} onClick={p.onTogglePanel} aria-expanded={p.panelOpen}>
        <span className="tab__icon">
          <IconBell size={22} />
          <Badge n={p.unread} />
        </span>
        <span>Alerts</span>
      </button>
    </nav>
  )
}
