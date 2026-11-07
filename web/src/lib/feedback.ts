/** Sound, vibration and system notifications for incoming hazards. */

let ctx: AudioContext | null = null

export function playAlertTone() {
  try {
    ctx ??= new AudioContext()
    const now = ctx.currentTime
    // two short rising beeps
    for (const [i, freq] of [880, 1175].entries()) {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = freq
      o.connect(g)
      g.connect(ctx.destination)
      const t = now + i * 0.22
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.14, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
      o.start(t)
      o.stop(t + 0.21)
    }
  } catch {
    /* audio unavailable */
  }
}

export function vibrateAlert() {
  // Browsers ignore (and warn about) vibration before the user has interacted with the page.
  const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation
  if (activation && !activation.hasBeenActive) return
  navigator.vibrate?.([120, 80, 120, 80, 220])
}

export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported'
}

export async function requestNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export async function showSystemNotification(title: string, body: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    const opts: NotificationOptions = { body, icon: '/icon-192.png', badge: '/favicon-32.png', tag: 'danger-alert' }
    if (reg) await reg.showNotification(title, opts)
    else new Notification(title, opts)
  } catch {
    /* ignore */
  }
}
