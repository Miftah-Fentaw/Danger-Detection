import { useEffect, useState } from 'react'

export type Route = { page: 'home'; anchor: string } | { page: 'docs'; slug: string }

export function parseHash(hash: string): Route {
  if (hash.startsWith('#/docs')) {
    return { page: 'docs', slug: hash.slice('#/docs/'.length) }
  }
  return { page: 'home', anchor: hash.replace(/^#\/?/, '') }
}

/** Hash-based routing so the site works on any static host. */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))
  useEffect(() => {
    const onHash = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return route
}

export function docHref(slug: string) {
  return `#/docs/${slug}`
}
