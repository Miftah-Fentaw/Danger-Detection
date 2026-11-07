import { useEffect, useState } from 'react'

const PREFIX = 'danger-alerts-'

export function readPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    // legacy values from the first version of the app
    if (raw === '1' || raw === '0') return (raw === '1') as T
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writePref<T>(key: string, value: T) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

/** useState that persists to localStorage. */
export function usePref<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readPref(key, fallback))
  useEffect(() => writePref(key, value), [key, value])
  return [value, setValue] as const
}

export type ThemePref = 'system' | 'light' | 'dark'

export function resolveTheme(pref: ThemePref): 'light' | 'dark' {
  if (pref !== 'system') return pref
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Applies the theme to <html> and follows the OS while set to "system". */
export function useTheme() {
  const [pref, setPref] = usePref<ThemePref>('theme', 'system')
  useEffect(() => {
    const apply = () => {
      const t = resolveTheme(pref)
      document.documentElement.dataset.theme = t
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#111312' : '#f3eee7')
    }
    apply()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [pref])
  return [pref, setPref] as const
}
