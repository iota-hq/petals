import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Search, X } from 'lucide-react'

/**
 * The chrome every searchable picker shares — fonts and the asset library alike.
 *
 * One rule, so the two panels can never drift apart: a compact panel pinned just left of the
 * properties sidebar and clear of the floating toolbar, so the inspector stays usable while
 * you pick. Frosted, so the canvas reads through it. Narrow is the point: the list is a column
 * of names and thumbnails, and a wide panel would only push the canvas away.
 *
 * Both are anchored to the viewport rather than to whatever opened them: the trigger moves
 * (a font row here, a toolbar button there) and the panel should not.
 *
 * Nothing here takes part in layout and nothing here covers the app: the panel is portalled and
 * fixed, and an outside *pointerdown* closes it rather than a full-viewport shield, so while it
 * is open the two sidebars still scroll and the canvas still pans and zooms underneath.
 */

/** Sized to the inspector beside it: the panel reads as a second column, not a wall. */
const PANEL_W = 256
const PANEL_H = 380
/** Never so narrow that a grid tile is unusable, nor so wide it would overlap the toolbar. */
const MIN_W = 216
const GAP = 8
/** Clearance above the floating toolbar. */
const TOOLBAR_GAP = 16

export interface PanelRect {
  left: number
  bottom: number
  width: number
  height: number
}

export function panelRect(): PanelRect {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const aside = document.querySelector('[data-props-panel]')
  const asideLeft = aside ? aside.getBoundingClientRect().left : vw
  // the toolbar floats above the canvas; the panel sits on top of it, not over it
  const bar = document.querySelector('[data-toolbar]')
  const barTop = bar ? bar.getBoundingClientRect().top : vh
  const width = Math.max(MIN_W, Math.min(PANEL_W, asideLeft - GAP * 2))
  const left = Math.max(GAP, asideLeft - GAP - width)
  const bottom = Math.max(GAP, vh - barTop + TOOLBAR_GAP)
  return { left, bottom, width, height: Math.max(200, Math.min(PANEL_H, vh - bottom - GAP)) }
}

export function AssetPanel({
  label,
  rect,
  onClose,
  query,
  onQuery,
  placeholder,
  searchLabel,
  busy = false,
  tabs,
  children,
}: {
  /** the dialog's accessible name, e.g. "Library" */
  label: string
  rect: PanelRect
  onClose: () => void
  query: string
  onQuery: (q: string) => void
  placeholder: string
  /** accessible name for the search box, distinct per panel */
  searchLabel: string
  busy?: boolean
  /** an optional row between the search box and the body */
  tabs?: ReactNode
  children: ReactNode
}) {
  const shell = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    const close = () => onClose()
    // Closing on an outside press, rather than under a full-viewport shield: a shield would eat
    // the wheel and swallow drags meant for the sidebars and the canvas behind it.
    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest?.('[data-asset-panel]')) return
      // the trigger toggles this panel itself — let its own click do that
      if (target?.closest?.('[data-asset-anchor]')) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', close)
    document.addEventListener('pointerdown', onDown, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', close)
      document.removeEventListener('pointerdown', onDown, true)
    }
  }, [onClose])

  return createPortal(
    <div
      ref={shell}
      data-asset-panel
      role="dialog"
      aria-label={label}
      className="fixed z-[70] flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-[#232323]/95 shadow-2xl backdrop-blur-xl"
      style={{ left: rect.left, bottom: rect.bottom, width: rect.width, height: rect.height }}
    >
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/10 px-3">
        {busy ? (
          <Loader2 size={13} className="shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <Search size={13} className="shrink-0 text-muted-foreground" />
        )}
        <input
          autoFocus
          aria-label={searchLabel}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          aria-label={query ? 'Clear search' : 'Close'}
          onClick={() => (query ? onQuery('') : onClose())}
          className="shrink-0 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>
      {tabs}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>,
    document.body,
  )
}

/** A small pill row of mutually exclusive choices — used for source tabs and mode switches. */
export function PillRow<T extends string>({
  value,
  options,
  onChange,
  label,
  className = '',
}: {
  value: T
  options: Array<{ id: T; label: string }>
  onChange: (v: T) => void
  label?: string
  className?: string
}) {
  return (
    <div role="tablist" aria-label={label} className={'flex shrink-0 items-center gap-0.5 ' + className}>
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={
            'cursor-pointer rounded-full px-2.5 py-[3px] text-[11px] font-medium transition-colors ' +
            (value === o.id ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:text-foreground')
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
