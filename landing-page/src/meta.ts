import { useEffect } from 'react'

/** Keeps document.title and the description meta tag in sync with the current page. */
export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [title, description])
}
