import { useEffect, useRef, useState } from 'react'
import { parseHash, type Route } from './router'
import { Navbar } from './components/Navbar'
import { ThemeToggle } from './components/ThemeToggle'
import { Footer } from './components/Footer'
import { BrandMark } from './components/BrandMark'
import { Home } from './pages/Home'
import { Docs } from './pages/Docs'

type Phase = 'idle' | 'cover' | 'reveal'

const COVER_MS = 520
const REVEAL_MS = 700

/** Hash routing with a curtain wipe between pages. */
function usePageTransition() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))
  const [phase, setPhase] = useState<Phase>('idle')
  const shown = useRef(route.page)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const onHash = () => {
      const next = parseHash(window.location.hash)
      timers.current.forEach(window.clearTimeout)
      timers.current = []

      if (next.page === shown.current) {
        setRoute(next)
        if (next.page === 'home' && next.anchor === '') window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }

      shown.current = next.page
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setRoute(next)
        return
      }
      setPhase('cover')
      timers.current.push(
        window.setTimeout(() => {
          setRoute(next)
          setPhase('reveal')
        }, COVER_MS),
        window.setTimeout(() => setPhase('idle'), COVER_MS + REVEAL_MS),
      )
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return { route, phase }
}

export default function App() {
  const { route, phase } = usePageTransition()

  // After switching pages, land on the requested anchor (or the top).
  useEffect(() => {
    if (route.page !== 'home') return
    const id = route.anchor
    const raf = requestAnimationFrame(() => {
      const el = id ? document.getElementById(id) : null
      if (el) el.scrollIntoView({ behavior: 'auto' })
      else window.scrollTo({ top: 0, behavior: 'auto' })
    })
    return () => cancelAnimationFrame(raf)
    // only when the page itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.page])

  return (
    <>
      <ThemeToggle />
      <Navbar route={route} />
      <main className="page" key={route.page}>
        {route.page === 'docs' ? <Docs slug={route.slug} /> : <Home />}
      </main>
      <Footer />
      <div className={`curtain curtain--${phase}`} aria-hidden>
        <span className="curtain__logo">
          <BrandMark size={56} />
        </span>
      </div>
    </>
  )
}
