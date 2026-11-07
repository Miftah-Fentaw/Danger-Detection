import { useEffect, useRef, useState } from 'react'

/** Tracks an element's content width so SVG charts can render at real pixel size. */
export function useWidth<T extends HTMLElement>(initial = 600) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(initial)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(120, Math.round(entry.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, width }
}
