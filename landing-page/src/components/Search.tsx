import { isValidElement, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DOC_ITEMS } from '../docs/content'
import { docHref } from '../router'
import { Arrow, Search as SearchIcon } from './Icons'

type Entry = { title: string; group: string; summary: string; href: string; text?: string }

/** Flattens a docs body (JSX, code blocks, tables) to plain text for searching. */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join(' ')
  if (isValidElement(node)) {
    const props = node.props as Record<string, unknown>
    return [props.children, props.code, props.head, props.rows, props.title]
      .map((v) => textOf(v as ReactNode))
      .join(' ')
  }
  return ''
}

const HOME_ENTRIES: Entry[] = [
  { title: 'Home', group: 'Website', summary: 'Back to the start', href: '#/' },
  { title: 'Features', group: 'Website', summary: 'What Danger Detection does', href: '#features' },
  { title: 'How it works', group: 'Website', summary: 'From camera to phone', href: '#how-it-works' },
  { title: 'Use cases', group: 'Website', summary: 'Where to run it', href: '#use-cases' },
  { title: 'FAQ', group: 'Website', summary: 'Common questions, answered', href: '#faq' },
]

const ENTRIES: Entry[] = [
  ...DOC_ITEMS.map((d) => ({
    title: d.title,
    group: `Docs · ${d.group}`,
    summary: d.summary,
    href: docHref(d.slug),
    text: textOf(d.body).toLowerCase(),
  })),
  ...HOME_ENTRIES,
]

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const input = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return ENTRIES
    const words = t.split(/\s+/)
    const scored = ENTRIES.map((e) => {
      const head = `${e.title} ${e.summary}`.toLowerCase()
      let score = 0
      for (const w of words) {
        if (head.includes(w)) score += 3
        else if (e.text?.includes(w) || e.group.toLowerCase().includes(w)) score += 1
        else return { e, score: 0 }
      }
      return { e, score }
    })
    return scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.e)
  }, [q])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => input.current?.focus(), 30)
    document.body.style.overflow = 'hidden'
    return () => {
      window.clearTimeout(t)
      document.body.style.overflow = ''
    }
  }, [open])

  const go = (e: Entry | undefined) => {
    if (!e) return
    window.location.hash = e.href
    setQ('')
    setSel(0)
    onClose()
  }

  if (!open) return null

  return (
    <div className="palette" role="dialog" aria-modal="true" aria-label="Search" onClick={onClose}>
      <div className="palette__panel" onClick={(e) => e.stopPropagation()}>
        <div className="palette__input">
          <SearchIcon size={18} />
          <input
            ref={input}
            value={q}
            placeholder="Search docs and pages…"
            onChange={(e) => {
              setQ(e.target.value)
              setSel(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSel((s) => Math.min(s + 1, results.length - 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSel((s) => Math.max(s - 1, 0))
              }
              if (e.key === 'Enter') go(results[sel])
            }}
          />
          <kbd>esc</kbd>
        </div>
        <ul className="palette__list">
          {results.length === 0 && <li className="palette__empty">No results for “{q}”</li>}
          {results.map((r, i) => (
            <li key={r.href}>
              <button
                className={i === sel ? 'is-sel' : ''}
                onMouseEnter={() => setSel(i)}
                onClick={() => go(r)}
                style={{ animationDelay: `${Math.min(i, 10) * 25}ms` }}
              >
                <div>
                  <small>{r.group}</small>
                  <strong>{r.title}</strong>
                  <span>{r.summary}</span>
                </div>
                <Arrow size={16} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
