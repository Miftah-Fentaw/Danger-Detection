import { useCallback, useEffect, useRef, useState } from 'react'
import { hazardKind, hazardTitle } from './lib/api'
import type { ActiveAlert } from './lib/alerts'
import { usePref, useTheme, resolveTheme } from './lib/prefs'
import {
  notificationPermission,
  playAlertTone,
  requestNotifications,
  showSystemNotification,
  vibrateAlert,
} from './lib/feedback'
import { useAlertSocket } from './hooks/useAlertSocket'
import { useEventLog } from './hooks/useEventLog'
import { AlertPanel } from './components/AlertPanel'
import { BottomTabs, Sidebar, TopBar, type Screen } from './components/Navigation'
import { OverviewScreen, type DashboardData } from './screens/OverviewScreen'
import { EventsScreen } from './screens/EventsScreen'
import type { RangeId } from './lib/stats'
import { SettingsScreen, type AlertPrefs } from './screens/SettingsScreen'

const BASE_TITLE = 'Danger Detection Alerts'

function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(t)
  }, [intervalMs])
  return now
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('overview')
  const [themePref, setThemePref] = useTheme()
  const [sound, setSound] = usePref('sound', true)
  const [vibration, setVibration] = usePref('vibration', true)
  const [notifications, setNotifications] = usePref('notifications', false)
  const [autoOpen, setAutoOpen] = usePref('auto-open', true)
  const [range, setRange] = usePref<RangeId>('range', '24h')
  const [notifPermission, setNotifPermission] = useState(notificationPermission)
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(themePref))

  const [alerts, setAlerts] = useState<ActiveAlert[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const now = useNow()
  const log = useEventLog()

  const prefs: AlertPrefs = { sound, vibration, notifications, autoOpen }
  const prefsRef = useRef(prefs)
  useEffect(() => {
    prefsRef.current = { sound, vibration, notifications, autoOpen }
  }, [sound, vibration, notifications, autoOpen])

  // Track the effective theme (for the sidebar toggle icon).
  useEffect(() => {
    const update = () => setResolvedTheme(resolveTheme(themePref))
    const t = window.setTimeout(update, 0)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', update)
    return () => {
      window.clearTimeout(t)
      mq.removeEventListener('change', update)
    }
  }, [themePref])

  const raise = useCallback((fire: number, smoke: number, source: string, preview = false) => {
    const kind = hazardKind(fire, smoke)
    const alert: ActiveAlert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind,
      fire,
      smoke,
      ts: Date.now(),
      source,
      acknowledged: false,
      preview,
    }
    setAlerts((list) => [alert, ...list].slice(0, 50))
    const p = prefsRef.current
    if (p.autoOpen) setPanelOpen(true)
    if (p.sound) playAlertTone()
    if (p.vibration) vibrateAlert()
    if (p.notifications && document.visibilityState !== 'visible') {
      void showSystemNotification(hazardTitle(kind), [fire && `Fire ×${fire}`, smoke && `Smoke ×${smoke}`].filter(Boolean).join(' · '))
    }
  }, [])

  const reloadLog = log.reload
  const socket = useAlertSocket(
    useCallback(
      (a) => {
        raise(a.fire, a.smoke, a.source ?? 'desktop_app')
        void reloadLog()
      },
      [raise, reloadLog],
    ),
  )

  const unread = alerts.filter((a) => !a.acknowledged).length

  // Unread count in the tab title.
  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) Hazard alert · ${BASE_TITLE}` : BASE_TITLE
  }, [unread])

  const ack = useCallback((id: string) => setAlerts((l) => l.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))), [])
  const ackAll = useCallback(() => setAlerts((l) => l.map((a) => ({ ...a, acknowledged: true }))), [])
  const dismiss = useCallback((id: string) => setAlerts((l) => l.filter((a) => a.id !== id)), [])
  const clearAcked = useCallback(() => setAlerts((l) => l.filter((a) => !a.acknowledged)), [])
  const closePanel = useCallback(() => setPanelOpen(false), [])

  const enableNotifications = async () => {
    const res = await requestNotifications()
    setNotifPermission(res)
    setNotifications(res === 'granted')
  }

  const onPrefs = (p: AlertPrefs) => {
    setSound(p.sound)
    setVibration(p.vibration)
    setNotifications(p.notifications)
    setAutoOpen(p.autoOpen)
  }

  const dash: DashboardData = {
    events: log.events,
    loaded: log.loaded,
    error: log.error,
    refreshing: log.refreshing,
    lastSync: log.lastSync,
    latency: log.latency,
    now,
    status: socket.status,
    retryIn: socket.retryIn,
    connectedAt: socket.connectedAt,
    reconnects: socket.reconnects,
    unread,
    range,
    onRange: setRange,
    onRefresh: () => void log.refresh(),
    onRetry: socket.retryNow,
    onOpenAlerts: () => setPanelOpen(true),
    onViewEvents: () => {
      setScreen('events')
      window.scrollTo({ top: 0 })
    },
  }

  const navProps = {
    screen,
    onScreen: (s: Screen) => {
      setScreen(s)
      setPanelOpen(false)
      window.scrollTo({ top: 0 })
    },
    unread,
    panelOpen,
    onTogglePanel: () => setPanelOpen((o) => !o),
    status: socket.status,
    retryIn: socket.retryIn,
    theme: resolvedTheme,
    onToggleTheme: () => setThemePref(resolvedTheme === 'dark' ? 'light' : 'dark'),
  }

  return (
    <div className={`app ${unread ? 'has-unread' : ''} ${panelOpen ? 'panel-open' : ''}`}>
      <div className="attention" aria-hidden />
      <Sidebar {...navProps} />
      <TopBar {...navProps} />

      <div className="content" key={screen}>
        {screen === 'overview' ? (
          <OverviewScreen {...dash} />
        ) : screen === 'events' ? (
          <EventsScreen {...dash} onClear={log.clear} />        ) : (
          <SettingsScreen
            theme={themePref}
            onTheme={setThemePref}
            prefs={prefs}
            onPrefs={onPrefs}
            notifPermission={notifPermission}
            onEnableNotifications={() => void enableNotifications()}
            status={socket.status}
            retryIn={socket.retryIn}
            onRetry={socket.retryNow}
            onPreview={() => raise(1, 1, 'preview', true)}
          />
        )}
      </div>

      <BottomTabs {...navProps} />

      {unread > 0 && !panelOpen && (
        <button type="button" className="alert-fab" onClick={() => setPanelOpen(true)}>
          <span className="alert-fab__pulse" aria-hidden />
          {unread} unacknowledged alert{unread === 1 ? '' : 's'}
        </button>
      )}

      <AlertPanel
        open={panelOpen}
        alerts={alerts}
        now={now}
        onClose={closePanel}
        onAck={ack}
        onAckAll={ackAll}
        onDismiss={dismiss}
        onClearAcknowledged={clearAcked}
      />
    </div>
  )
}
