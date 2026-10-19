import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { GoogleFont } from '@/lib/googleFonts'
import { familyNameOf, googleFontUrl, loadGoogleFonts } from '@/lib/googleFonts'
import type { FontCategory } from '@/lib/googleFonts'
import { AssetPanel, panelRect, type PanelRect } from './AssetPanel'

/**
 * Figma-style font list: a tall, narrow column of names over the canvas, each set in its own
 * face, with a search row across the top. Local faces ship with the app; the Google library is
 * fetched from the Fontsource CDN on demand, and only the rows actually on screen pull their face.
 */

export interface FontEntry {
  id: string
  name: string
  category: FontCategory | 'builtin'
  /** css family preview stack; loaded faces preview instantly, unloaded ones fall back */
  preview: string
}

const PAGE = 60

// Preview faces are injected once per session and left in document.fonts. Adding a
// loaded FontFace makes the browser restyle any text already using that family name,
// so the rows repaint themselves without React re-rendering.
const injected = new Set<string>()

/** Register + load a family's preview face (idempotent; failures may retry later). */
export function ensureFontFace(f: GoogleFont): void {
  if (typeof FontFace === 'undefined') return
  if (injected.has(f.id)) return
  injected.add(f.id)
  new FontFace(f.name, `url(${googleFontUrl(f.id, f.subset, f.weight)}) format('woff2')`)
    .load()
    .then((face) => document.fonts.add(face))
    .catch(() => injected.delete(f.id))
}

/** Lazily fetch the google library once per session (never blocks rendering). */
export function useGoogleFonts(): [GoogleFont[], boolean] {
  const [fonts, setFonts] = useState<GoogleFont[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    loadGoogleFonts()
      .then((f) => {
        if (!alive) return
        setFonts(f)
        setLoading(false)
      })
      .catch(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])
  return [fonts, loading]
}

export const FontPicker = memo(function FontPicker({
  fonts,
  builtin,
  value,
  onChange,
  loading = false,
}: {
  /** google library rows */
  fonts: GoogleFont[]
  /** locally shipped faces (always available, preview without fetch) */
  builtin: FontEntry[]
  /** current css font-family stack */
  value: string
  onChange: (stack: string) => void
  loading?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const scrollRef = useRef<HTMLDivElement>(null)
  const rowsRef = useRef(new Map<string, HTMLElement>())
  const [rect, setRect] = useState<PanelRect | null>(null)

  const entries: FontEntry[] = useMemo(
    () => [
      ...builtin,
      ...fonts.map((f): FontEntry => ({ id: `google:${f.id}`, name: f.name, category: f.category as FontCategory, preview: `'${f.name}'` })),
    ],
    [builtin, fonts],
  )

  const currentName = familyNameOf(value)
  const entriesByName = useMemo(() => {
    const m = new Map<string, FontEntry>()
    for (const e of entries) if (!m.has(e.name.toLowerCase())) m.set(e.name.toLowerCase(), e)
    return m
  }, [entries])
  const current: FontEntry = builtin.find((e) => e.preview === value) ?? entriesByName.get(currentName.toLowerCase()) ?? builtin[0]

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? entries.filter((f) => f.name.toLowerCase().includes(q)) : entries
  }, [entries, query])

  // a new search starts the window over — adjusted during render rather than in an
  // effect, so no frame of the stale, longer window is ever painted
  const [limitKey, setLimitKey] = useState(query)
  if (limitKey !== query) {
    setLimitKey(query)
    setLimit(PAGE)
  }
  const shown = useMemo(() => matches.slice(0, limit), [matches, limit])

  // Only fetch the face for rows actually on screen. Without this, opening the menu
  // would pull ~60 font files at once; with it, roughly a screenful.
  useEffect(() => {
    if (!open || !scrollRef.current) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const id = (e.target as HTMLElement).dataset.fontId
          if (id?.startsWith('google:')) {
            const f = fonts.find((x) => x.id === id.slice(7))
            if (f) ensureFontFace(f)
          }
          io.unobserve(e.target)
        }
      },
      { root: scrollRef.current, rootMargin: '150px' },
    )
    rowsRef.current.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [open, fonts, shown])

  const setRow = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) rowsRef.current.set(id, el)
      else rowsRef.current.delete(id)
    },
    [],
  )

  const scrollTimer = useRef(0)
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    el.classList.add('is-scrolling')
    window.clearTimeout(scrollTimer.current)
    scrollTimer.current = window.setTimeout(() => el.classList.remove('is-scrolling'), 800)
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 240) setLimit((l) => (l < matches.length ? l + PAGE : l))
  }

  function pick(f: FontEntry) {
    const fallback =
      f.category === 'monospace'
        ? 'monospace'
        : f.category === 'handwriting'
          ? 'cursive'
          : f.category === 'sans-serif'
            ? 'sans-serif'
            : 'serif'
    onChange(f.category === 'builtin' ? f.preview : `'${f.name}', ${fallback}`)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => {
          if (open) return setOpen(false)
          setRect(panelRect())
          setQuery('')
          setLimit(PAGE)
          setOpen(true)
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Font family"
        data-asset-anchor
        className="flex h-7 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-md bg-[#2b2b2b] px-2 text-left transition-colors hover:bg-[#333]"
      >
        <span className="truncate text-[13px] leading-none text-foreground" style={{ fontFamily: current.preview }}>
          {current.name}
        </span>
        <ChevronDown size={13} className="shrink-0 text-muted-foreground/70" />
      </button>

      {open && rect && (
        <AssetPanel
          label="Fonts"
          rect={rect}
          onClose={() => setOpen(false)}
          query={query}
          onQuery={setQuery}
          searchLabel="Search fonts"
          placeholder="Search fonts"
          busy={loading}
        >
          <div
            ref={scrollRef}
            onScroll={onScroll}
            role="listbox"
            aria-label="Fonts"
            className="scrollbar-auto min-h-0 flex-1 overflow-y-auto py-0.5"
          >
            {matches.length === 0 && (
              <p className="px-3 py-2 text-[11px] text-muted-foreground">
                {loading ? 'Loading fonts…' : `No fonts match “${query}”.`}
              </p>
            )}
            {shown.map((f) => {
              const selected = f.id === current.id
              return (
                <button
                  key={f.id}
                  ref={setRow(f.id)}
                  data-font-id={f.id}
                  role="option"
                  aria-selected={selected}
                  onClick={() => pick(f)}
                  className={
                    'flex w-full cursor-pointer items-center gap-2 px-3 py-[3px] text-left transition-colors ' +
                    (selected ? 'bg-white/5 text-foreground' : 'text-foreground/85 hover:bg-white/5 hover:text-foreground')
                  }
                >
                  <span className="min-w-0 flex-1 truncate text-[13.5px] leading-6" style={{ fontFamily: f.preview }}>
                    {f.name}
                  </span>
                  {selected && <Check size={12} className="shrink-0 text-primary" />}
                </button>
              )
            })}
            {shown.length < matches.length && (
              <p className="px-3 py-2 text-center text-[10px] text-muted-foreground/70">
                {matches.length - shown.length} more, keep scrolling
              </p>
            )}
          </div>
        </AssetPanel>
      )}
    </>
  )
})
