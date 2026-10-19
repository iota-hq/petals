import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Shapes } from 'lucide-react'
import { Hint } from '@/components/ui/tooltip'
import { useDoc } from '@/store/docStore'
import { useUi, type LibrarySource } from '@/store/uiStore'
import { MOTIFS } from '@/lib/patterns/registry'
import { motifThumb, patternFill, patternFor } from '@/lib/patterns/fill'
import { loadLogoIndex, logoSvgUrl, searchLogos, type LogoEntry } from '@/lib/brandLogos'
import { loadIconMarkups, iconTitle, searchIcons, tintIconMarkup, IconifyUnavailable, type IconHit } from '@/lib/iconify'
import { fetchSvgText, parseSvg, svgDataUrl } from '@/lib/svg'
import { addShapeAt, canvasEl, insertImageFragment, pageFromClient, setPropsBatch } from './commands'
import { AssetPanel, PillRow, panelRect, type PanelRect } from './AssetPanel'

/**
 * The asset library: generative patterns, brand logos, and searchable icons — one panel,
 * one search box, over the canvas.
 *
 * Patterns are local: the motif engine is a few kilobytes of pure TypeScript, a thumbnail
 * is built once and memoised, and the result is applied as an ordinary image fill, so a
 * patterned canvas renders no differently from a photographic one. It is tuned afterwards
 * in the inspector's Pattern section, not here.
 *
 * Logos and icons arrive over the network and are never bundled. Brand marks come from a
 * fetched index (jsDelivr) so they stay browsable offline once loaded; icons are searched
 * live against Iconify — about 300,000 of them across 200+ sets. Whichever you pick is
 * fetched once, sanitised, and **inlined as a data URL**, so the document never has to reach
 * a CDN again to render, and it stays recolourable from the inspector's Logo section.
 *
 * Iconify's drawings are fetched with the search rather than on click — batched per icon set
 * — so a thumbnail is a local data URL and tapping one is instant. Thumbnails are tinted for
 * the dark tile: inside an `<img>`, an icon's own `currentColor` would render black. A
 * refusal is shown as such: a search that could not be made never looks like a search that
 * found nothing.
 *
 * The three tabs are also reachable from the canvas context menu ("Library"), which asks for
 * a tab through `useUi.libraryRequest` rather than reaching into this component.
 */

type Source = LibrarySource

const SOURCES: Array<{ id: Source; label: string }> = [
  { id: 'patterns', label: 'Patterns' },
  { id: 'logos', label: 'Logos' },
  { id: 'icons', label: 'Icons' },
]

/** Where an inserted asset lands, and how big. */
const BRAND_PX = 160
const ICON_PX = 96
/** A grid thumbnail has to read on a dark tile, and `currentColor` renders black in an <img>. */
const ICON_TINT = '#e8e8ea'

const PAGE = 72
/**
 * How many icons one search shows. Their drawings arrive batched, one request per icon *set*
 * rather than one per icon, so this is a browsing decision rather than a budget one — a page
 * this size spans a dozen sets or so, and typing more is how you narrow it.
 */
const ICON_PAGE = 24
/** Iconify asks for nothing but manners; a paused keystroke is one request. */
const ICON_DEBOUNCE = 280

/** Page coordinates at the middle of the visible canvas — where an insert lands. */
function viewCenter() {
  const el = canvasEl.current
  if (!el) return { x: 0, y: 0 }
  const r = el.getBoundingClientRect()
  return pageFromClient({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
}

export function LibraryPanel() {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<PanelRect | null>(null)
  const [source, setSource] = useState<Source>('patterns')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [working, setWorking] = useState(false)

  // brand logo index
  const [logos, setLogos] = useState<LogoEntry[] | null>(null)
  const [logoError, setLogoError] = useState(false)
  const [reload, setReload] = useState(0)
  // live icon search
  const [icons, setIcons] = useState<IconHit[] | null>(null)
  /** The drawings behind `icons`, by id: fetched with the search, so clicking needs no request. */
  const [iconArt, setIconArt] = useState<Map<string, string> | null>(null)
  const [iconBusy, setIconBusy] = useState(false)
  /** `null` = fine; otherwise why the search could not be answered, and with what status. */
  const [iconRefused, setIconRefused] = useState<{ status: number } | null>(null)
  const [retry, setRetry] = useState(0)
  /** A one-line complaint about the last insert that could not be fetched. */
  const [notice, setNotice] = useState<string | null>(null)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const q = query.trim()

  /** Open on a tab, from a fresh rectangle — the panel never inherits a stale one. */
  const show = (on: Source, fresh = false) => {
    setRect(panelRect())
    setSource(on)
    // A fresh open starts a fresh search; a tab change inside the panel does not, because the
    // three tabs are three views of what you typed, not three separate searches.
    if (fresh) setQuery('')
    setLimit(PAGE)
    setNotice(null)
    setOpen(true)
  }

  // The context menu's "Library" submenu opens a tab by asking through the ui store; the
  // nonce makes picking the same tab twice a fresh request rather than a no-op. Whatever was
  // typed stays typed: the tabs are three views of one search, not three separate searches.
  const request = useUi((s) => s.libraryRequest)
  const clearRequest = useUi((s) => s.clearLibraryRequest)
  useEffect(() => {
    if (!request) return
    show(request.source)
    clearRequest()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, clearRequest])

  // The brand index is fetched the first time the Logos tab is opened.
  useEffect(() => {
    if (!open || source !== 'logos' || logos) return
    let alive = true
    loadLogoIndex()
      .then((index) => alive && setLogos(index))
      .catch(() => alive && setLogoError(true))
    return () => {
      alive = false
    }
  }, [open, source, logos, reload])

  // Live icon search, debounced, with the previous request cancelled so a slow response
  // can never overwrite a newer one. Iconify is its own tab: the brand-logo index is a
  // browsable list, this is an API search, and mixing them made the Logos tab pay for a
  // request it did not need.
  useEffect(() => {
    if (!open || source !== 'icons' || q.length < 2) {
      setIcons(null)
      setIconArt(null)
      setIconBusy(false)
      setIconRefused(null)
      return
    }
    const ac = new AbortController()
    setIconBusy(true)
    const timer = window.setTimeout(() => {
      searchIcons(q, ICON_PAGE, ac.signal)
        .then(async (hits) => {
          setIcons(hits)
          setIconRefused(null)
          setIconArt(null)
          // The drawings are a second, batched request, so the grid fills in two beats:
          // names first (so the set is known), then art.
          const art = await loadIconMarkups(hits, ac.signal)
          if (!ac.signal.aborted) setIconArt(art)
        })
        .catch((err) => {
          if (ac.signal.aborted) return
          setIcons(null)
          setIconArt(null)
          setIconRefused({ status: err instanceof IconifyUnavailable ? err.status : 0 })
        })
        .finally(() => {
          if (!ac.signal.aborted) setIconBusy(false)
        })
    }, ICON_DEBOUNCE)
    return () => {
      window.clearTimeout(timer)
      ac.abort()
    }
  }, [open, source, q, retry])

  /** Thumbnails are the icons' own drawings, tinted for the dark tile and inlined — no request. */
  const iconThumbs = useMemo(() => {
    const out = new Map<string, string>()
    for (const [id, art] of iconArt ?? []) out.set(id, svgDataUrl(tintIconMarkup(art, ICON_TINT)))
    return out
  }, [iconArt])

  const patternRows = useMemo(() => {
    const needle = q.toLowerCase()
    const list = needle ? MOTIFS.filter((m) => m.name.toLowerCase().includes(needle)) : MOTIFS
    return list.map((m) => ({ key: m.id, label: m.name, thumb: motifThumb(m.id) }))
  }, [q])

  const brandRows = useMemo(() => {
    const index = logos ?? []
    const list = q ? searchLogos(index, q, 240) : index
    return list.map((e) => ({ key: e.file, label: e.title, thumb: logoSvgUrl(e.file) }))
  }, [logos, q])

  // A new search starts the page window over, adjusted during render so no frame of the
  // stale, longer window is ever painted.
  const windowKey = `${source}:${q}`
  const [limitKey, setLimitKey] = useState(windowKey)
  if (limitKey !== windowKey) {
    setLimitKey(windowKey)
    setLimit(PAGE)
  }
  const shownBrands = useMemo(() => brandRows.slice(0, limit), [brandRows, limit])
  const shownPatterns = useMemo(() => patternRows.slice(0, limit), [patternRows, limit])

  /* ---------------- inserting ---------------- */

  /**
   * Wear the motif on whatever is selected; with nothing selected, make something to wear
   * it. One undo step either way, and the params ride along so the inspector can keep
   * editing the pattern afterwards.
   *
   * The motif arrives in its own sampled colours — the ones its thumbnail advertises. It used
   * to be tinted to the shape's fill instead, which made a white frame swallow the pattern
   * whole; whatever the result should be, it is the inspector's job, and it is reversible from
   * there.
   */
  function applyPattern(motifId: string) {
    const doc = useDoc.getState()
    const selected = useUi.getState().selection.filter((id) => doc.nodes[id])

    if (!selected.length) {
      const w = 160
      const h = 120
      const params = patternFor(motifId, 1)
      const centre = viewCenter()
      addShapeAt('rect', { x: centre.x - w / 2, y: centre.y - h / 2, w, h }, 'Pattern', {
        fill: patternFill(params, w, h),
        pattern: params,
      })
      return
    }

    const entries = selected.flatMap((id) => {
      const shape = useDoc.getState().nodes[id]
      if (!shape) return []
      const params = patternFor(motifId, 1)
      return [{ id, fields: { fill: patternFill(params, shape.w, shape.h), pattern: params } }]
    })
    if (entries.length) setPropsBatch(entries, 'Apply pattern')
  }

  /** Fetch, sanitise and inline one SVG, keeping its pristine markup for recolouring. */
  async function insertSvg(url: string, title: string, px: number) {
    setWorking(true)
    setNotice(null)
    try {
      const text = await fetchSvgText(url, 2)
      const parsed = text ? parseSvg(text) : null
      if (!parsed) {
        // Saying nothing here would read as a dead click, and the reason (a CDN that did not
        // answer) is something the person can act on by retrying.
        setNotice(`Could not fetch ${title} — the icon service may be busy. Try again in a moment.`)
        return
      }
      insertImageFragment(svgDataUrl(parsed.markup), px, px, viewCenter(), title, {
        logo: { source: parsed.markup },
      })
    } finally {
      setWorking(false)
    }
  }

  /**
   * An icon's drawing arrived with the search, sanitised and already part of this session, so
   * inserting it is a paste rather than a download — and it cannot fail now.
   */
  function insertIcon(hit: IconHit, art: string) {
    insertImageFragment(svgDataUrl(art), ICON_PX, ICON_PX, viewCenter(), iconTitle(hit), {
      logo: { source: art },
    })
  }

  function choose(source: Source, row: { key: string; label: string }) {
    if (source === 'patterns') return applyPattern(row.key)
    return void insertSvg(logoSvgUrl(row.key), row.label, BRAND_PX)
  }

  /* ---------------- render ---------------- */

  const loadingBrands = source === 'logos' && !logos && !logoError
  const busy = working || iconBusy || loadingBrands

  const patternTabs = (
    <div className="flex shrink-0 items-center gap-1 border-b border-white/10 px-2 py-1">
      <PillRow
        label="Library source"
        value={source}
        options={SOURCES}
        // The query rides across: one search, three views of it.
        onChange={setSource}
      />
    </div>
  )

  /**
   * One grid cell. Kept as a component of its own so a thumbnail that failed to load can say
   * so in place: an `<img>` that never arrives has no box at all, which would leave a hole in
   * the grid rather than a legible gap.
   */
  const tile = (row: { key: string; label: string; thumb: string }, onClick: () => void, tint = false) => (
    <Tile key={row.key} label={row.label} thumb={row.thumb} onClick={onClick} tint={tint} />
  )

  /** The live icon results — the same block under the Logos tab and alone on the Icons tab. */
  const iconResults = iconRefused ? (
    <Empty
      text={
        iconRefused.status === 429
          ? 'Iconify is rate-limiting this browser — brand logos still work. Wait a moment, then try again.'
          : 'Could not reach Iconify — brand logos still work offline.'
      }
      action={{ label: 'Try again', onClick: () => setRetry((n) => n + 1) }}
    />
  ) : icons && icons.length > 0 ? (
    iconArt ? (
      <Grid>
        {icons
          .filter((hit) => iconArt.has(hit.id))
          .map((hit) =>
            tile(
              { key: hit.id, label: iconTitle(hit), thumb: iconThumbs.get(hit.id) ?? '' },
              () => insertIcon(hit, iconArt.get(hit.id)!),
            ),
          )}
      </Grid>
    ) : (
      <p className="py-6 text-center text-[11px] text-muted-foreground">Searching 300,000 icons…</p>
    )
  ) : iconBusy ? (
    <p className="py-6 text-center text-[11px] text-muted-foreground">Searching 300,000 icons…</p>
  ) : icons ? (
    <p className="py-6 text-center text-[11px] text-muted-foreground">No icons match “{query}”.</p>
  ) : null

  return (
    <>
      <Hint label="Library" side="top">
        <button
          ref={triggerRef}
          data-asset-anchor
          disabled={working}
          onClick={() => (open ? setOpen(false) : show(source))}
          aria-label="Library"
          aria-haspopup="dialog"
          aria-expanded={open}
          className={
            'flex size-8 items-center justify-center rounded-lg transition-colors ' +
            (open ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground')
          }
        >
          <Shapes size={15} />
        </button>
      </Hint>

      {open && rect && (
        <AssetPanel
          label="Library"
          rect={rect}
          onClose={() => setOpen(false)}
          query={query}
          onQuery={setQuery}
          searchLabel="Search library"
          placeholder={
            source === 'patterns' ? 'Search patterns…' : source === 'icons' ? 'Search icons…' : 'Search brand logos…'
          }
          busy={busy}
          tabs={patternTabs}
        >
          <div
            ref={scrollRef}
            role="listbox"
            aria-label="Library results"
            onScroll={(e) => {
              const el = e.currentTarget
              if (el.scrollHeight - el.scrollTop - el.clientHeight < 240) setLimit((l) => (l < brandRows.length ? l + PAGE : l))
            }}
            className="scrollbar-auto min-h-0 flex-1 overflow-y-auto p-2.5"
          >
            {notice && (
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-400/25 bg-amber-400/10 px-2 py-1.5 text-[10.5px] leading-snug text-amber-200/90">
                <span className="flex-1">{notice}</span>
                <button
                  onClick={() => setNotice(null)}
                  className="cursor-pointer text-amber-200/70 hover:text-amber-100"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            )}
            {source === 'patterns' ? (
              shownPatterns.length === 0 ? (
                <Empty text={`Nothing matches “${query}”.`} />
              ) : (
                <Grid>{shownPatterns.map((row) => tile(row, () => applyPattern(row.key)))}</Grid>
              )
            ) : source === 'icons' ? (
              q.length >= 2 ? (
                iconResults ?? <p className="py-6 text-center text-[11px] text-muted-foreground">Searching 300,000 icons…</p>
              ) : (
                <Empty text="Type at least two letters to search 300,000 icons." />
              )
            ) : logoError ? (
              <Empty
                text="Could not reach the logo library — you may be offline."
                action={{ label: 'Try again', onClick: () => { setLogoError(false); setReload((n) => n + 1) } }}
              />
            ) : (
              <>
                {shownBrands.length > 0 && (
                  <>
                    {q && <GroupLabel text="Logos" />}
                    <Grid>{shownBrands.map((row) => tile(row, () => choose('logos', row)))}</Grid>
                  </>
                )}
                {shownBrands.length === 0 && q && <Empty text={`No brand logos match “${query}”.`} />}
                {shownBrands.length === 0 && !q && !loadingBrands && (
                  <Empty text="Scroll the brand logos, or type to filter them. Icons live on their own tab." />
                )}
                {shownBrands.length < brandRows.length && (
                  <p className="py-3 text-center text-[10px] text-muted-foreground/70">
                    {brandRows.length - shownBrands.length} more brand logos — keep scrolling
                  </p>
                )}
              </>
            )}
          </div>
        </AssetPanel>
      )}
    </>
  )
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1">{children}</div>
}

/**
 * A grid cell: the artwork alone, rounded, with nothing written under it.
 *
 * Forty names at once is noise — you pick a pattern by eye. The name arrives as a hint after
 * a dwell instead, and hover dims the cell rather than lighting a box behind it. There is no
 * plate behind the artwork either: patterns and marks have their own edge.
 *
 * A thumbnail that never arrives still says so in place, rather than leaving a hole.
 */
function Tile({
  label,
  thumb,
  onClick,
  tint,
}: {
  label: string
  thumb: string
  onClick: () => void
  tint?: boolean
}) {
  const [failed, setFailed] = useState(false)
  return (
    <Hint label={label} side="top" delay={500}>
      <button
        role="option"
        aria-selected={false}
        aria-label={label}
        onClick={onClick}
        className="flex cursor-pointer items-center justify-center p-0.5 transition-opacity hover:opacity-60"
      >
        {failed ? (
          <span className="flex size-[40px] shrink-0 items-center justify-center rounded-md border border-dashed border-white/20">
            <span className="size-3 rounded-[3px] border border-dashed border-white/25" />
          </span>
        ) : (
          <img
            src={thumb}
            alt=""
            draggable={false}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className={'size-[40px] shrink-0 rounded-md object-contain ' + (tint ? 'opacity-90' : '')}
          />
        )}
      </button>
    </Hint>
  )
}

function GroupLabel({ text, busy }: { text: string; busy?: boolean }) {
  return (
    <p className="flex items-center gap-2 px-1 pb-1.5 pt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
      {text}
      {busy && <span className="size-1.5 animate-pulse rounded-full bg-primary" />}
    </p>
  )
}

function Empty({ text, action }: { text: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="flex flex-col items-center gap-2 px-2 py-8 text-center">
      <p className="text-[11px] leading-snug text-muted-foreground">{text}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="cursor-pointer rounded-full bg-white/10 px-3 py-1 text-[11px] text-foreground hover:bg-white/20"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
