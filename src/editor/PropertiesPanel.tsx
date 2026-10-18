import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { HexColorPicker } from 'react-colorful'
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  AlignStartHorizontal,
  AlignStartVertical,
  Check,
  ChevronDown,
  Circle,
  Expand,
  Frame as FrameIcon,
  Image as ImageIcon,
  Minimize2,
  Minus,
  Minus as LineIcon,
  Minus as RemoveIcon,
  PanelRight,
  Plus,
  Square,
  Type,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { nanoid } from 'nanoid'
import type { Filters, Gradient, GradientStop, ImageFill, Margin, Shape, ShapePatch, ShadowEntry, ShadowKind, ShadowStyle, ShapeType } from '@/model/types'
import { pageAABB, selectionRoots, boundsOfRects } from '@/model/geometry'
import { fillToCss, radiusToCss } from '@/model/styles'
import { useDoc, type Tx } from '@/store/docStore'
import { useUi, DEFAULT_CANVAS_BG, setZoomAroundCenter } from '@/store/uiStore'
import { fileToImageSrc, addImageFile, alignSelection, canvasEl, nudge, setProps, type AlignEdge } from './commands'
import { downloadSelectionCode, exportSelectionEPS, exportSelectionPNG, exportSelectionRaster, exportSelectionSVG } from './exporters'
import { IconBlur, IconBrightness, IconBoxShadow, IconContrast, IconConic, IconGradientFill, IconGrayscale, IconHue, IconImageFill, IconInnerShadow, IconInvert, IconLinear, IconLetterSpacing, IconMargin, IconOpacity, IconRadial, IconRadius, IconRotate, IconSepia, IconSaturate, IconSolidFill, IconSpread, IconFontSize, IconLineHeight, IconStrokeWidth } from './proIcons'
import { FontPicker, useGoogleFonts, type FontEntry } from './FontPicker'
import { UndoRedoButtons } from './UndoRedoButtons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Hint, TooltipProvider } from '@/components/ui/tooltip'

/* ------------------------------ shells ------------------------------ */

const panelCls =
  'flex w-[264px] shrink-0 flex-col overflow-hidden border-l border-border bg-[#1c1c1c]'

/** Below lg the right panel floats over the canvas instead of being clipped off-screen. */
const panelMobileRight =
  ' max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:z-40 max-lg:w-[min(300px,86vw)] max-lg:shadow-2xl'

/** Ultra-slim scrollbar that fades out shortly after scrolling stops; body may scroll, the top bar stays fixed. */
function PanelScroll({ children }: { children: ReactNode }) {
  const timer = useRef<number>(0)
  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto scrollbar-auto"
      onScroll={(e) => {
        const el = e.currentTarget
        el.classList.add('is-scrolling')
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => el.classList.remove('is-scrolling'), 800)
      }}
    >
      {children}
    </div>
  )
}

/**
 * Collapsible properties section. Exactly one indicator lives in the header:
 * - plain sections: − when open / + when closed (click collapses).
 * - addable sections (onAdd/onRemove): the same slot is + when the content is absent
 *   and − when present (adds/removes), so a section never shows two icons.
 * - addSlot replaces the indicator entirely (e.g. the filters "+ filter" menu).
 * Closed sections sit closer together so the stack scans quickly.
 */
function Section({
  title,
  subtitle,
  children,
  addSlot,
  onAdd,
  onRemove,
  open: openProp,
  defaultOpen = true,
  /** row-wide click: for "+" sections, clicking anywhere on the row opens/acts (falls back to normal toggle) */
  onActivate,
}: {
  title: string
  subtitle?: string
  children?: ReactNode
  addSlot?: ReactNode
  onAdd?: () => void
  onRemove?: () => void
  /** force presence of content (addable style); undefined = self-managed collapse */
  open?: boolean
  defaultOpen?: boolean
  onActivate?: (e: React.MouseEvent) => void
}) {
  const [openState, setOpenState] = useState(defaultOpen)
  const [collapsed, setCollapsed] = useState(false)
  const addable = openProp !== undefined || onAdd || onRemove
  const open = addable ? !!openProp && !collapsed : openState

  const toggle = () => {
    if (addable) setCollapsed((c) => !c)
    else setOpenState((o) => !o)
  }
  const rowActivate = (e: React.MouseEvent) => (onActivate ? onActivate(e) : onAdd ? onAdd() : toggle())
  const rowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    rowActivate(e)
  }

  let indicator: ReactNode = null
  if (!addSlot) {
    if (addable) {
      if (openProp) {
        indicator = (
          <Hint label="Remove">
            <button onClick={onRemove} className="cursor-pointer text-muted-foreground hover:text-foreground">
              <Minus size={13} />
            </button>
          </Hint>
        )
      } else {
        indicator = (
          <Hint label="Add">
            <button onClick={onAdd} className="cursor-pointer text-muted-foreground hover:text-foreground">
              <Plus size={13} />
            </button>
          </Hint>
        )
      }
    } else {
      indicator = (
        <Hint label={open ? 'Collapse' : 'Expand'}>
          <button onClick={toggle} className="cursor-pointer text-muted-foreground hover:text-foreground">
            {open ? <Minus size={13} /> : <Plus size={13} />}
          </button>
        </Hint>
      )
    }
  }

  return (
    <section className={(open ? 'px-3.5 py-3' : 'px-3.5 py-2') + ' border-b border-border'}>
      <div className="flex min-h-5 items-center justify-between gap-1" onClick={rowClick} onMouseDown={(e) => e.preventDefault()}>
        <button
          onClick={rowActivate}
          className="flex min-w-0 cursor-pointer items-baseline gap-1.5 text-left"
          aria-label={`Toggle ${title}`}
        >
          <span className="truncate text-[13px] font-semibold tracking-[0.01em] text-foreground/90">{title}</span>
          {subtitle && <span className="truncate text-[11px] font-normal text-muted-foreground">{subtitle}</span>}
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {addSlot}
          {indicator}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {(!addable ? openState : open) && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 pt-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-1.5">{children}</div>
}

const typeMeta: Record<ShapeType, { icon: LucideIcon; label: string }> = {
  frame: { icon: FrameIcon, label: 'Frame' },
  rect: { icon: Square, label: 'Rectangle' },
  ellipse: { icon: Circle, label: 'Ellipse' },
  line: { icon: LineIcon, label: 'Line' },
  text: { icon: Type, label: 'Text' },
  image: { icon: ImageIcon, label: 'Image' },
}

/* ------------------------------ live-patch plumbing ------------------------------ */

/** One shared transaction for all scrub dragging in the panel; folds drags into a single undo step. */
function useLiveTx() {
  const ref = useRef<{ tx: Tx; label: string } | null>(null)
  useEffect(
    () => () => {
      ref.current?.tx.commit()
      ref.current = null
    },
    [],
  )
  const live = (id: string, patch: ShapePatch, label: string) => {
    const doc = useDoc.getState()
    ref.current ??= { tx: doc.beginTx(label), label: label }
    ref.current.tx.capture(id, patch)
    doc.patchLive((n) => {
      const s = n[id]
      if (s) Object.assign(s, patch)
    })
  }
  const liveMany = (ids: string[], fn: (n: Record<string, Shape>) => void, label: string) => {
    const doc = useDoc.getState()
    ref.current ??= { tx: doc.beginTx(label), label }
    for (const id of ids) ref.current.tx.capture(id, { x: 0, y: 0, opacity: -1 })
    doc.patchLive(fn)
  }
  const end = () => {
    ref.current?.tx.commit()
    ref.current = null
  }
  return { live, liveMany, end }
}

/* ------------------------------ fields ------------------------------ */

interface NumFieldProps {
  label?: string
  /** trailing unit rendered after the value (e.g. percent) */
  unit?: string
  icon?: ReactNode
  value: number
  /** displayed = stored × scale (e.g. opacity stored 0..1 → scale 100) */
  scale?: number
  /** stored units per pixel of drag */
  step?: number
  min?: number
  max?: number
  disabled?: boolean
  /** no own box chrome — render inside a parent box (e.g. the color row) */
  plain?: boolean
  onLive?: (stored: number) => void
  onEnd?: () => void
  onCommit: (stored: number) => void
}

const clampField = (v: number, min?: number, max?: number) => {
  if (min !== undefined) v = Math.max(min, v)
  if (max !== undefined) v = Math.min(max, v)
  return v
}

function NumField({
  label,
  unit,
  icon,
  value,
  scale = 1,
  step = 1,
  min,
  max,
  disabled,
  plain,
  onLive,
  onEnd,
  onCommit,
}: NumFieldProps) {
  const [editing, setEditing] = useState<string | null>(null)
  const [live, setLive] = useState<number | null>(null)
  const shown = live ?? value
  const display = Math.round(shown * scale * 100) / 100
  const canScrub = !disabled && onLive != null

  const startScrub = (e: React.PointerEvent) => {
    if (!canScrub || e.button !== 0) return
    e.preventDefault()
    const sx = e.clientX
    const startStored = value
    let moved = false
    const move = (ev: PointerEvent) => {
      const stored = clampField(startStored + (ev.clientX - sx) * step, min, max)
      if (Math.abs(ev.clientX - sx) > 2) moved = true
      if (!moved) return
      setLive(stored)
      onLive?.(stored)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (moved) {
        onEnd?.()
        setLive(null)
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <label
      className={
        plain
          ? 'flex min-w-0 flex-1 items-center gap-1'
          : 'flex min-w-0 flex-1 items-center gap-1 rounded-md border border-transparent bg-[#2b2b2b] px-1.5 py-0.5 transition-colors hover:border-border focus-within:border-ring'
      }
    >
      {icon && (
        <span
          className={
            'flex w-4 shrink-0 select-none items-center justify-center text-[11px] ' +
            (canScrub ? 'cursor-ew-resize text-muted-foreground' : 'text-muted-foreground/70')
          }
          onPointerDown={startScrub}
        >
          {icon}
        </span>
      )}
      {!icon && label !== undefined && (
        <span
          className={
            'shrink-0 select-none text-center text-[11px] ' +
            (label.length > 2 ? 'px-0.5 ' : 'w-3.5 ') +
            (canScrub ? 'cursor-ew-resize text-muted-foreground' : 'text-muted-foreground/70')
          }
          onPointerDown={startScrub}
        >
          {label}
        </span>
      )}
      <Input
        type="text"
        inputMode="decimal"
        disabled={disabled}
        className="h-6 w-full min-w-0 border-0 bg-transparent px-0 text-[13px] font-medium shadow-none focus-visible:ring-0"
        value={editing ?? String(display)}
        onFocus={() => setEditing(String(display))}
        onChange={(e) => setEditing(e.target.value)}
        onBlur={() => {
          if (editing !== null) {
            const d = parseFloat(editing)
            if (Number.isFinite(d)) {
              const stored = clampField(d / scale, min, max)
              if (stored !== value) onCommit(stored)
            }
            setEditing(null)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') {
            setEditing(null)
            ;(e.target as HTMLInputElement).blur()
          }
        }}
      />
      {unit && (
        <span
          className={
            'shrink-0 select-none text-center text-[11px] ' +
            (unit.length > 2 ? 'px-0.5 ' : 'w-3.5 ') +
            (canScrub ? 'cursor-ew-resize text-muted-foreground' : 'text-muted-foreground/70')
          }
          onPointerDown={startScrub}
        >
          {unit}
        </span>
      )}
    </label>
  )
}

/* ------------------------------ color ------------------------------ */

function ColorButton({ color, onClick, sm }: { color: string; onClick: (e: React.MouseEvent) => void; sm?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={
        (sm ? 'h-4 w-5 rounded' : 'h-6 w-8 shrink-0 rounded-md') +
        ' shrink-0 cursor-pointer border border-border ring-1 ring-inset ring-black/20'
      }
      style={{
        background:
          color === 'transparent' || color === 'none'
            ? 'repeating-conic-gradient(#52525b 0% 25%, #3f3f3f 0% 50%) 50% / 8px 8px'
            : color,
      }}
    />
  )
}

/** Close popovers on outside pointerdown / Escape / scroll (fixed popovers detach on scroll). */
function usePopoverDismiss(ref: React.RefObject<HTMLElement | null>, onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onScroll = () => onClose()
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [active])
}

/** Fixed-position popover state anchored beside the trigger — it opens over the canvas, off the panel. */
type PopFixed = ReturnType<typeof usePopFixed>

function usePopFixed() {  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement | null>(null)
  const toggle = (e: React.MouseEvent) => {
    if (open) {
      setOpen(false)
      return
    }
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const width = 192
    const height = 246
    // open over the canvas, flush against the panel's left border (falls back to the trigger when no aside ancestor)
    const aside = (e.currentTarget as HTMLElement).closest('aside')
    const panel = aside?.getBoundingClientRect()
    const right = panel ? panel.left - 8 : r.left - 8
    setPos({
      top: r.bottom + height > window.innerHeight ? Math.max(8, r.top - height) : r.bottom + 6,
      left: Math.max(8, right - width),
    })
    setOpen(true)
  }
  usePopoverDismiss(ref, () => setOpen(false), open)
  return { open, toggle, setOpen, pos, ref }
}

const hexDisplay = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/
const hexShort = /^#([0-9a-fA-F]{6})$/

/** Small color popover: picker + hex field, no buttons — clicking outside closes and commits. */
function ColorPopover({
  popoverRef,
  pos,
  onPick,
  hex,
  setHex,
}: {
  popoverRef: React.RefObject<HTMLDivElement | null>
  pos: { top: number; left: number }
  onPick: (hex: string) => void
  hex: string
  setHex: (h: string) => void
}) {
  return (
    <div
      ref={popoverRef}
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-50 w-[192px] rounded-md border border-border bg-popover/95 p-2 shadow-2xl backdrop-blur"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <HexColorPicker color={hex} onChange={onPick} />
      <div className="mt-2 flex items-center justify-between gap-1.5">
        <span className="text-[10px] font-normal text-muted-foreground">Hex</span>
        <Input
          className="h-6 w-24 bg-[#2b2b2b] font-mono text-[11px] uppercase"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          onBlur={() => {
            const v = hexInTrim(hex)
            if (hexShort.test(v) || hexDisplay.test(v)) onPick(v.toLowerCase())
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
      </div>
    </div>
  )
}

function hexInTrim(v: string): string {
  v = v.trim()
  return v.startsWith('#') ? v : v ? '#' + v : v
}

/** Popover + hex state for one color control; the popover anchors to the element you click. */
function useColorPop(value: string) {
  const pop = usePopFixed()
  const [hex, setHex] = useState('#ffffff')
  useEffect(() => {
    if (!pop.open) setHex(hexDisplay.test(value) ? value.slice(0, 7) : '#ffffff')
  }, [value, pop.open])
  return { ...pop, hex, setHex }
}

/* ---- the boxed color row: [swatch | hex | alpha %] in one box, minus outside ---- */

const alphaOf = (v?: string) => (v && /^#[0-9a-fA-F]{8}$/.test(v) ? parseInt(v.slice(7, 9), 16) / 255 : 1)
/** Compose a displayable color: 8-digit hex only when alpha < 100%. */
const withAlphaHex = (hex6: string, a: number) => {
  const byte = Math.round(Math.min(1, Math.max(0, a)) * 255)
  const suffix = byte.toString(16).padStart(2, '0')
  return suffix === 'ff' ? hex6 : hex6 + suffix
}
/** Keep a paint's existing alpha (8-digit suffix) when a new base color is picked. */
const keepAlpha = (v: string | undefined, newBase: string) => {
  const suffix = v && /^#[0-9a-fA-F]{8}$/.test(v) ? v.slice(7) : ''
  return suffix ? newBase + suffix : newBase
}

function ColorBoxRow({
  value,
  onApply,
  onRemove,
  selected,
}: {
  value?: string
  /** live-applied paint color, 6 or 8 digit hex */
  onApply: (c: string) => void
  onRemove?: () => void
  /** highlight as the active gradient stop */
  selected?: boolean
}) {
  const pop = useColorPop(value ?? 'transparent')
  const hex6 = value && /^#[0-9a-fA-F]{6}/.test(value) ? value.slice(0, 7) : undefined
  const hasColor = !!value && value !== 'transparent' && value !== 'none'
  return (
    <div className="flex items-center gap-1.5">
      <div
        role="button"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('input,label')) return
          pop.toggle(e)
        }}
        className={
          'relative flex h-7 min-w-0 flex-1 cursor-pointer items-center gap-1.5 rounded-md bg-[#2b2b2b] px-1.5 ' + (selected ? 'bg-[#353535]' : '')
        }
      >
        <ColorButton sm color={hasColor ? (hex6 ?? value!) : 'transparent'} onClick={(e) => pop.toggle(e)} />
        <span className="font-mono text-[12px] uppercase text-foreground/85">{hasColor ? (hex6 ?? '').replace('#', '') : ''}</span>
        <div className="ml-auto flex w-12 min-w-0 items-center" onClick={(e) => e.stopPropagation()}>
          <NumField
            plain
            unit="%"
            scale={100}
            step={0.01}
            min={0}
            max={1}
            disabled={!hex6 || !onApply}
            value={alphaOf(hex6 ? value : undefined)}
            onLive={hex6 ? (v) => onApply(withAlphaHex(hex6, v)) : undefined}
            onCommit={hex6 ? (v) => onApply(withAlphaHex(hex6, v)) : () => {}}
          />
        </div>
        {pop.open && (
          <ColorPopover
            popoverRef={pop.ref}
            pos={pop.pos}
            onPick={(c) => onApply(keepAlpha(value, c))}
            hex={pop.hex}
            setHex={pop.setHex}
          />
        )}
      </div>
      {onRemove && (
        <Hint label="Remove color">
          <button className="cursor-pointer text-muted-foreground hover:text-foreground" onClick={onRemove}>
            <Minus size={13} />
          </button>
        </Hint>
      )}
    </div>
  )
}

function ColorField({
  shapeId,
  field,
  txLabel,
  value,
  noneable,
}: {
  shapeId: string
  field: 'fill' | 'stroke' | 'color'
  txLabel: string
  value?: string
  noneable?: boolean
}) {
  const txRef = useRef<Tx | null>(null)

  const applyLive = (c: string) => {
    const doc = useDoc.getState()
    txRef.current ??= doc.beginTx(`Change ${txLabel.toLowerCase()}`)
    txRef.current.capture(shapeId, { [field]: '' })
    doc.patchLive((n) => {
      const s = n[shapeId]
      if (s) (s as unknown as Record<string, unknown>)[field] = c
    })
  }
  const setNone = () => {
    txRef.current?.commit()
    txRef.current = null
    setProps([shapeId], { [field]: 'transparent' }, `Remove ${txLabel.toLowerCase()}`)
  }

  return <ColorBoxRow value={value} onApply={applyLive} onRemove={noneable ? setNone : undefined} />
}

function CanvasBgField() {
  const bg = useUi((s) => s.canvasBg)
  const apply = (c: string) => useUi.getState().setCanvasBg(keepAlpha(bg, c))
  return <ColorBoxRow value={bg} onApply={apply} />
}

/* ---- small custom dropdown replacing native <select>, styled like our menus ---- */

function MiniSelect<T extends string>({
  value,
  options,
  onChange,
  disabled,
  disabledOptions,
}: {
  value: T
  options: readonly (readonly [T, string])[]
  onChange: (v: T) => void
  disabled?: boolean
  /** visually present but not selectable (coming-soon entries) */
  disabledOptions?: readonly T[]
}) {
  const pop = usePopFixed()
  const label = options.find(([v]) => v === value)?.[1] ?? value
  return (
    <div className="relative min-w-0 flex-1">
      <button
        disabled={disabled}
        onClick={pop.toggle}
        className={
          'flex h-7 w-full min-w-0 cursor-pointer items-center justify-between gap-1 rounded-md border border-transparent bg-[#2b2b2b] px-2 text-[12px] font-medium text-foreground/90 hover:border-border focus:outline-none ' +
          (disabled ? 'cursor-default opacity-40' : '')
        }
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={12} className="shrink-0 text-muted-foreground" />
      </button>
      {pop.open && !disabled && (
        <div
          ref={pop.ref}
          style={{ top: pop.pos.top, left: pop.pos.left }}
          className="fixed z-50 w-[192px] rounded-md border border-border bg-popover/95 py-1 shadow-2xl backdrop-blur"
        >
          {options.map(([v, l]) => {
            const off = disabledOptions?.includes(v) ?? false
            return (
              <button
                key={v}
                onClick={off ? undefined : () => {
                  onChange(v)
                  pop.setOpen(false)
                }}
                title={off ? 'Coming soon' : undefined}
                className={
                  'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] font-medium hover:bg-accent ' +
                  (off ? 'cursor-default text-muted-foreground/45 hover:bg-transparent' : 'cursor-pointer text-foreground/90')
                }
              >
                <span className="flex-1 truncate">{l}</span>
                {v === value && <Check size={12} className="shrink-0 text-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Tiny custom switch replacing native checkboxes. */
function MiniSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={'relative h-4 w-7 shrink-0 cursor-pointer rounded-full transition-colors ' + (checked ? 'bg-primary' : 'bg-[#3f3f46]')}
    >
      <span
        className={'absolute top-0.5 size-3 rounded-full bg-white shadow transition-all ' + (checked ? 'left-3.5' : 'left-0.5')}
      />
    </button>
  )
}

/* ------------------------------ styles: fill / shadow / filters / margin ------------------------------ */

/** Small swatch that opens a color popover; used by gradient stops and shadow colors. */
function SwatchButton({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const pop = useColorPop(color || '#000000')
  return (
    <div className="relative inline-flex items-center">
      <ColorButton color={color} onClick={(e) => pop.toggle(e)} />
      {pop.open && (
        <ColorPopover
          popoverRef={pop.ref}
          pos={pop.pos}
          onPick={(c) => {
            // preserve an existing #rrggbbaa alpha suffix
            const alpha = /^#[0-9a-fA-F]{8}$/.test(color) ? color.slice(7) : ''
            onChange(c + alpha)
          }}
          hex={pop.hex}
          setHex={pop.setHex}
        />
      )}
    </div>
  )
}

const gradientOf = (fill: Shape['fill']): Gradient | null =>
  typeof fill === 'object' && fill && fill.type !== 'image' ? (fill as Gradient) : null
const imageFillOf = (fill: Shape['fill']): ImageFill | null =>
  typeof fill === 'object' && fill && fill.type === 'image' ? (fill as ImageFill) : null

/** Built-in placeholder picture used until the user chooses their own image fill. */
const PLACEHOLDER_IMAGE = '/petal-pattern.svg'

/** Gradient bar with draggable / clickable color stops, like the Figma gradient editor. */
function GradientBar({
  g,
  selected,
  setSelected,
  onStopLive,
  onEnd,
  onAdd,
}: {
  g: Gradient
  selected: number
  setSelected: (i: number) => void
  onStopLive: (stops: GradientStop[]) => void
  onEnd: () => void
  onAdd: (pos: number) => void
}) {
  const barRef = useRef<HTMLDivElement>(null)
  const displayFill = fillToCss(g)

  const beginDrag = (i: number) => (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setSelected(i)
    const bar = barRef.current
    if (!bar) return
    const rect0 = bar.getBoundingClientRect()
    const startPos = g.stops[i]?.pos ?? 50
    const sx = e.clientX
    let moved = false
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - sx
      if (Math.abs(dx) > 1) moved = true
      const pos = Math.min(100, Math.max(0, startPos + (dx * 100) / rect0.width))
      onStopLive(g.stops.map((st, j) => (j === i ? { ...st, pos } : st)))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      if (moved) onEnd()
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      ref={barRef}
      className="relative h-3.5 cursor-pointer overflow-visible rounded-md ring-1 ring-inset ring-black/20"
      style={{ background: displayFill }}
      onPointerDown={(e) => {
        // click on the empty bar adds a stop there
        if (e.target === e.currentTarget && barRef.current) {
          const r = barRef.current.getBoundingClientRect()
          onAdd(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)))
        }
      }}
    >
      {g.stops.map((st, i) => (
        <button
          key={i}
          onPointerDown={beginDrag(i)}
          onClick={(e) => {
            e.stopPropagation()
            setSelected(i)
          }}
          aria-label={`Gradient stop ${i + 1}`}
          className={
            'absolute top-1/2 h-3.5 w-2.5 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-[4px] border-2 shadow-sm ' +
            (selected === i ? 'border-white' : 'border-white/60')
          }
          style={{ left: `${st.pos}%`, background: st.color }}
        />
      ))}
    </div>
  )
}

/** Fill editor: Solid color, Gradient (bar + stops + angle), or Image paint. */
function FillField({ s }: { s: Shape }) {
  const g = gradientOf(s.fill)
  const image = imageFillOf(s.fill)
  const solid = typeof s.fill === 'string' && s.fill !== 'transparent' ? s.fill : undefined
  const mode: 'solid' | 'gradient' | 'image' = g ? 'gradient' : image ? 'image' : 'solid'
  const [sel, setSel] = useState(0)
  const { live, end } = useLiveTx()
  const kindPop = usePopFixed()

  const setFill = (v: Shape['fill'], label: string) =>
    setProps([s.id], { fill: v === undefined ? 'transparent' : v } as ShapePatch, label)

  const pick = (m: 'solid' | 'gradient' | 'image') => {
    if (m === mode) return
    if (m === 'solid') {
      const base = solid ?? (g ? g.stops[0]?.color : undefined) ?? '#f472b6'
      setFill(base, 'Solid fill')
    } else if (m === 'image') {
      setFill({ type: 'image', src: image?.src ?? s.src ?? PLACEHOLDER_IMAGE, fit: image?.fit ?? 'cover' }, 'Image fill')
    }
  }

  /** Choose a gradient variety — patching the live gradient or minting a two-stop one. */
  const setGradient = (type: Gradient['type']) => {
    if (g) {
      patchG({ type }, 'Gradient type')
      return
    }
    const base = solid ?? '#f472b6'
    setFill(
      {
        type,
        angle: 90,
        stops: [
          { color: base, alpha: 1, pos: 0 },
          { color: '#ffffff', alpha: 1, pos: 100 },
        ],
      },
      'Gradient fill',
    )
    setSel(0)
  }

  const patchG = (patch: Partial<Gradient>, label: string) => {
    if (!g) return
    setFill({ ...g, ...patch }, label)
  }
  const patchGLive = (patch: Partial<Gradient>) => {
    if (!g) return
    live(s.id, { fill: { ...g, ...patch } } as ShapePatch, 'Gradient')
  }

  /** Insert a new stop at `pos` (percent) and select it. */
  const addStopAt = (pos: number) => {
    if (!g) return
    const stops = [...g.stops, { color: '#808080', alpha: 1, pos }].sort((a, b) => a.pos - b.pos)
    setSel(Math.max(0, stops.findIndex((st) => st.pos === pos)))
    patchG({ stops }, 'Add gradient stop')
  }
  /** Delete stop `i` (minimum of two stops is kept). */
  const removeStopAt = (i: number) => {
    if (!g || g.stops.length <= 2) return
    const stops = g.stops.filter((_, j) => j !== i)
    setSel((v) => Math.max(0, Math.min(v, stops.length - 1)))
    patchG({ stops }, 'Remove gradient stop')
  }

  const chooseImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const f = input.files?.[0]
      if (!f) return
      const src2 = await fileToImageSrc(f)
      if (src2) setFill({ type: 'image', src: src2, fit: image?.fit ?? 'cover' }, 'Change image fill')
    }
    input.click()
  }

  return (
    <>
      {/* fill kind: flat icon row — Gradient opens the nested direction menu */}
      <Row>
        <Hint label="Solid fill">
          <button
            aria-label="Solid fill"
            onClick={() => pick('solid')}
            className={
              'flex size-7 cursor-pointer items-center justify-center rounded-md ' +
              (mode === 'solid' ? 'bg-[#2b2b2b] text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground')
            }
          >
            <IconSolidFill size={14} />
          </button>
        </Hint>
        <Hint label="Gradient fill">
          <button
            aria-label="Gradient fill"
            onClick={(e) => kindPop.toggle(e)}
            className={
              'flex size-7 cursor-pointer items-center justify-center rounded-md ' +
              (mode === 'gradient' ? 'bg-[#2b2b2b] text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground')
            }
          >
            <IconGradientFill size={14} />
          </button>
        </Hint>
        <Hint label="Image fill">
          <button
            aria-label="Image fill"
            onClick={() => pick('image')}
            className={
              'flex size-7 cursor-pointer items-center justify-center rounded-md ' +
              (mode === 'image' ? 'bg-[#2b2b2b] text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground')
            }
          >
            <IconImageFill size={14} />
          </button>
        </Hint>
      </Row>
      {kindPop.open && (
        <div
          ref={kindPop.ref}
          style={{ top: kindPop.pos.top, left: kindPop.pos.left }}
          className="fixed z-50 w-[180px] rounded-md border border-border bg-popover/95 py-1.5 shadow-2xl backdrop-blur"
        >
          <div className="px-2.5 pb-1 pt-0.5 text-[10px] font-normal text-muted-foreground/70">
            Gradient direction
          </div>
          {(
            [
              ['linear', IconLinear, 'Linear'],
              ['radial', IconRadial, 'Radial'],
              ['conic', IconConic, 'Conic'],
            ] as const
          ).map(([t, Icon, label]) => (
            <button
              key={t}
              onClick={() => {
                setGradient(t)
                kindPop.setOpen(false)
              }}
              className={'flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left text-[12px] font-medium text-foreground/90 hover:bg-accent ' + (g?.type === t ? 'bg-accent/60' : '')}
            >
              <span className="text-muted-foreground/80">
                <Icon size={13} />
              </span>
              {label}
            </button>
          ))}
        </div>
      )}
      {mode === 'solid' && <ColorField shapeId={s.id} field="fill" txLabel="Solid fill" value={solid} noneable />}
      {mode === 'gradient' && g && (
        <>
          {/* the bar sits on a padded slot so the end stop chips never clip the column */}
          <div className="px-1.5">
            <GradientBar
              g={g}
              selected={sel}
              setSelected={setSel}
              onStopLive={(stops) => patchGLive({ stops })}
              onEnd={end}
              onAdd={(pos) => {
                const stops = [...g.stops, { color: '#808080', alpha: 1, pos }].sort((a, b) => a.pos - b.pos)
                setSel(g.stops.length)
                patchG({ stops }, 'Add gradient stop')
              }}
            />
          </div>
          {/* stops as color rows: swatch · hex · alpha % — like the canvas color fields */}
          <div className="flex flex-col gap-1" onPointerDownCapture={() => setSel(Math.min(sel, g.stops.length - 1))}>
            {g.stops.map((st, i) => (
              <ColorBoxRow
                key={i}
                selected={i === Math.min(sel, g.stops.length - 1)}
                value={st.color + (st.alpha < 1 ? Math.round(st.alpha * 255).toString(16).padStart(2, '0') : '')}
                onApply={(c) => {
                  const m = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(c)
                  if (!m) return
                  patchG(
                    {
                      stops: g.stops.map((s2, j) =>
                        j === i ? { ...s2, color: `#${m[1]}`, alpha: m[2] ? parseInt(m[2], 16) / 255 : 1 } : s2,
                      ),
                    },
                    'Gradient stop',
                  )
                }}
                onRemove={g.stops.length > 2 ? () => removeStopAt(i) : undefined}
              />
            ))}
          </div>
          {g.stops[Math.min(sel, g.stops.length - 1)] && (() => {
            const i = Math.min(sel, g.stops.length - 1)
            const st = g.stops[i]
            return (
              <Row>
                <NumField
                  label="Stop"
                  scale={1}
                  min={0}
                  max={100}
                  value={st.pos}
                  onLive={(v) => patchGLive({ stops: g.stops.map((s2, j) => (j === i ? { ...s2, pos: v } : s2)) })}
                  onEnd={end}
                  onCommit={(v) => patchG({ stops: g.stops.map((s2, j) => (j === i ? { ...s2, pos: v } : s2)) }, 'Gradient stop')}
                />
                <NumField
                  label="Φ"
                  scale={100}
                  min={0}
                  max={1}
                  step={0.01}
                  value={st.alpha}
                  onLive={(v) => patchGLive({ stops: g.stops.map((s2, j) => (j === i ? { ...s2, alpha: v } : s2)) })}
                  onEnd={end}
                  onCommit={(v) => patchG({ stops: g.stops.map((s2, j) => (j === i ? { ...s2, alpha: v } : s2)) }, 'Gradient opacity')}
                />
                {(g.type === 'linear' || g.type === 'conic') && (
                  <NumField
                    label="°"
                    min={0}
                    max={360}
                    value={g.angle}
                    onLive={(v) => patchGLive({ angle: Math.min(360, Math.max(0, v)) })}
                    onEnd={end}
                    onCommit={(v) => patchG({ angle: Math.min(360, Math.max(0, v)) }, 'Gradient angle')}
                  />
                )}
              </Row>
            )
          })()}
        </>
      )}
      {mode === 'image' && image && (
        <>
          <div
            className="h-14 w-full rounded-md ring-1 ring-inset ring-black/20"
            style={{
              background: image.src
                ? `center / ${(image.fit ?? 'cover') === 'contain' ? 'contain' : 'cover'} no-repeat url('${image.src.replace(/\n/g, '')}')`
                : 'repeating-conic-gradient(#52525b 0% 25%, #3f3f3f 0% 50%) 50% / 16px 16px',
            }}
          />
          <Row>
            <Button variant="outline" size="sm" className="h-6 flex-1 cursor-pointer text-[11px]" onClick={chooseImage}>
              Choose image
            </Button>
          </Row>
          <Row>
            <span className="shrink-0 text-[13px] font-semibold text-foreground/85">Fit</span>
            <MiniSelect
              value={image.fit ?? 'cover'}
              options={[
                ['cover', 'Cover'],
                ['contain', 'Contain'],
              ]}
              onChange={(v) => setFill({ ...image, fit: v }, 'Image fit')}
            />
          </Row>
        </>
      )}
    </>
  )
}

const SHADOW_DEFAULT: ShadowStyle = { x: 0, y: 8, blur: 24, spread: 0, color: '#00000066' }

/**
 * Shadow section: a small "add shadow" menu (like the filters one) offering box
 * and inner shadow; each pick APPENDS a shadow, so an element carries any mix
 * of several. Every present shadow gets its own block with X/Y/blur/spread + color.
 */
function ShadowsSection({ s }: { s: Shape }) {
  const shadows = s.shadows ?? []
  const pop = usePopFixed()
  const add = (kind: ShadowKind) => {
    const entry: ShadowEntry = { id: nanoid(8), kind, ...SHADOW_DEFAULT }
    setProps([s.id], { shadows: [...(s.shadows ?? []), entry] }, `Add ${kind} shadow`)
    pop.setOpen(false)
  }
  return (
    <Section
      title="Shadow"
      /** remount when it flips between empty/non-empty so defaultOpen picks the right state */
      key={shadows.length === 0 ? 'no-shadows' : 'has-shadows'}
      defaultOpen={shadows.length > 0}
      onActivate={shadows.length ? undefined : (e) => pop.toggle(e)}
      addSlot={
        <div className="relative">
          <Hint label="Add shadow">
            <button onClick={pop.toggle} className="cursor-pointer text-muted-foreground hover:text-foreground" aria-label="Add shadow">
              <Plus size={13} />
            </button>
          </Hint>
          {pop.open && (
            <div
              ref={pop.ref}
              style={{ top: pop.pos.top, left: pop.pos.left }}
              className="fixed z-50 w-[180px] rounded-md border border-border bg-popover/95 py-1.5 shadow-2xl backdrop-blur"
            >
              <div className="px-2.5 pb-1 pt-0.5 text-[10px] font-normal text-muted-foreground/70">
                Add shadow
              </div>
              <button
                onClick={() => add('box')}
                className="flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left text-[12px] font-medium text-foreground/90 hover:bg-accent"
              >
                <span className="text-muted-foreground/80">
                  <IconBoxShadow size={13} />
                </span>
                Box shadow
              </button>
              <button
                onClick={() => add('inner')}
                className="flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left text-[12px] font-medium text-foreground/90 hover:bg-accent"
              >
                <span className="text-muted-foreground/80">
                  <IconInnerShadow size={13} />
                </span>
                Inner shadow
              </button>
            </div>
          )}
        </div>
      }
    >
      {shadows.map((sh) => (
        <ShadowBlock key={sh.id} s={s} sh={sh} />
      ))}
    </Section>
  )
}

/** One shadow in the list: header with kind + remove, then its editing fields. */
function ShadowBlock({ s, sh }: { s: Shape; sh: ShadowEntry }) {
  const { live, end } = useLiveTx()
  const label = sh.kind === 'box' ? 'Box shadow' : 'Inner shadow'

  const apply = (patch: Partial<ShadowStyle>, txLabel: string) => {
    if (!s.shadows) return
    setProps([s.id], { shadows: s.shadows.map((x) => (x.id === sh.id ? { ...x, ...patch } : x)) }, txLabel)
  }
  const applyLive = (patch: Partial<ShadowStyle>) => {
    if (!s.shadows) return
    live(s.id, { shadows: s.shadows.map((x) => (x.id === sh.id ? { ...x, ...patch } : x)) }, 'Shadow')
  }
  const remove = () => {
    if (!s.shadows) return
    setProps([s.id], { shadows: s.shadows.filter((x) => x.id !== sh.id) }, `Remove ${label.toLowerCase()}`)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-5 items-center gap-1.5">
        <span className="flex shrink-0 cursor-default items-center text-muted-foreground">
          {sh.kind === 'box' ? <IconBoxShadow size={13} /> : <IconInnerShadow size={13} />}
        </span>
        <button
          className="min-w-0 flex-1 cursor-pointer truncate text-left text-[13px] font-semibold tracking-[0.01em] text-foreground/90"
          onClick={() => remove()}
        >
          {label}
        </button>
        <Hint label={`Remove ${label.toLowerCase()}`}>
          <button className="cursor-pointer text-muted-foreground hover:text-foreground" onClick={remove} aria-label={`Remove ${label}`}>
            <Minus size={13} />
          </button>
        </Hint>
      </div>
      <Row>
        <NumField
          label="X"
          value={sh.x}
          onLive={(v) => applyLive({ x: v })}
          onEnd={end}
          onCommit={(v) => apply({ x: v }, 'Shadow offset')}
        />
        <NumField
          label="Y"
          value={sh.y}
          onLive={(v) => applyLive({ y: v })}
          onEnd={end}
          onCommit={(v) => apply({ y: v }, 'Shadow offset')}
        />
        <NumField
          icon={<IconBlur />}
          min={0}
          value={sh.blur}
          onLive={(v) => applyLive({ blur: Math.max(0, v) })}
          onEnd={end}
          onCommit={(v) => apply({ blur: Math.max(0, v) }, 'Shadow blur')}
        />
        <NumField
          icon={<IconSpread />}
          value={sh.spread ?? 0}
          onLive={(v) => applyLive({ spread: v })}
          onEnd={end}
          onCommit={(v) => apply({ spread: v }, 'Shadow spread')}
        />
      </Row>
      <ColorBoxRow value={sh.color} onApply={(c) => apply({ color: c }, 'Shadow color')} />
    </div>
  )
}

const FILTER_KINDS: Array<{
  key: keyof Filters
  label: string
  icon: (p: { size?: number; className?: string }) => React.ReactElement
  def: number
  min: number
  max: number
  suffix: string
}> = [
  { key: 'blur', label: 'Blur', icon: IconBlur, def: 8, min: 0, max: 64, suffix: 'px' },
  { key: 'brightness', label: 'Brightness', icon: IconBrightness, def: 110, min: 0, max: 300, suffix: '%' },
  { key: 'contrast', label: 'Contrast', icon: IconContrast, def: 110, min: 0, max: 300, suffix: '%' },
  { key: 'grayscale', label: 'Grayscale', icon: IconGrayscale, def: 100, min: 0, max: 100, suffix: '%' },
  { key: 'hueRotate', label: 'Hue rotation', icon: IconHue, def: 45, min: 0, max: 360, suffix: '°' },
  { key: 'invert', label: 'Invert', icon: IconInvert, def: 100, min: 0, max: 100, suffix: '%' },
  { key: 'saturate', label: 'Saturate', icon: IconSaturate, def: 120, min: 0, max: 300, suffix: '%' },
  { key: 'sepia', label: 'Sepia', icon: IconSepia, def: 100, min: 0, max: 100, suffix: '%' },
]

/** Popover menu listing the filters the plus button can add. */
function FilterAddMenu({ s, pop }: { s: Shape; pop: PopFixed }) {
  const add = (k: (typeof FILTER_KINDS)[number]) => {
    setProps([s.id], { filters: { ...(s.filters ?? {}), [k.key]: k.def } }, `Add ${k.label.toLowerCase()}`)
    pop.setOpen(false)
  }
  return (
    <div className="relative">
      <Hint label="Add filter">
        <button
          onClick={pop.toggle}
          className="cursor-pointer text-muted-foreground hover:text-foreground"
          aria-label="Add filter"
        >
          <Plus size={13} />
        </button>
      </Hint>
      {pop.open && (
        <div
          ref={pop.ref}
          style={{ top: pop.pos.top, left: pop.pos.left }}
          className="fixed z-50 w-[192px] rounded-md border border-border bg-popover/95 py-1.5 shadow-2xl backdrop-blur"
        >
          <div className="px-2.5 pb-1 pt-0.5 text-[10px] font-normal text-muted-foreground/70">
            Add filter
          </div>
          {FILTER_KINDS.map((k) => (
            <button
              key={k.key}
              onClick={() => add(k)}
              className="flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left text-[12px] font-medium text-foreground/90 hover:bg-accent"
            >
              <span className="text-muted-foreground/80">
                <k.icon />
              </span>
              {k.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function FiltersSection({ s }: { s: Shape }) {
  const f = s.filters
  const has = f && FILTER_KINDS.some((k) => f[k.key] != null)
  const pop = usePopFixed()
  const { live, end } = useLiveTx()
  const setF = (k: keyof Filters, v: number) => setProps([s.id], { filters: { ...f, [k]: v } }, 'Filter')
  return (
    <Section
      title="Filters"
      addSlot={<FilterAddMenu s={s} pop={pop} />}
      open={!!has}
      defaultOpen
      onActivate={has ? undefined : (e) => pop.toggle(e)}
    >
      {has &&
        FILTER_KINDS.filter((k) => f[k.key] != null).map((k) => (
          <div key={k.key} className="flex items-center gap-1.5">
            <Hint label={k.label}>
              <span className="flex shrink-0 cursor-default text-muted-foreground">
                <k.icon />
              </span>
            </Hint>
            <NumField
              label={k.suffix}
              min={k.min}
              max={k.max}
              value={f[k.key]!}
              onLive={(v) =>
                live(s.id, { filters: { ...f, [k.key]: Math.min(k.max, Math.max(k.min, v)) } }, 'Filter')
              }
              onEnd={end}
              onCommit={(v) => setF(k.key, Math.min(k.max, Math.max(k.min, v)))}
            />
            <Hint label={`Remove ${k.label.toLowerCase()}`}>
              <button
                className="cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const next = { ...f }
                  delete next[k.key]
                  setProps([s.id], { filters: next }, `Remove ${k.label.toLowerCase()}`)
                }}
              >
                <RemoveIcon size={13} />
              </button>
            </Hint>
          </div>
        ))}
    </Section>
  )
}

function MarginSection({ s }: { s: Shape }) {
  const m = s.margin ?? { t: 0, r: 0, b: 0, l: 0 }
  const { live, end } = useLiveTx()
  const patch = (p: Partial<Margin>) => setProps([s.id], { margin: { ...m, ...p } }, 'Margin')
  const patchLive = (p: Partial<Margin>) => live(s.id, { margin: { ...m, ...p } }, 'Margin')
  return (
    <Section title="Margin">
      <Row>
        <NumField icon={<IconMargin dir="top" />} min={0} value={m.t} onLive={(v) => patchLive({ t: Math.max(0, v) })} onEnd={end} onCommit={(v) => patch({ t: Math.max(0, v) })} />
        <NumField icon={<IconMargin dir="right" />} min={0} value={m.r} onLive={(v) => patchLive({ r: Math.max(0, v) })} onEnd={end} onCommit={(v) => patch({ r: Math.max(0, v) })} />
      </Row>
      <Row>
        <NumField icon={<IconMargin dir="bottom" />} min={0} value={m.b} onLive={(v) => patchLive({ b: Math.max(0, v) })} onEnd={end} onCommit={(v) => patch({ b: Math.max(0, v) })} />
        <NumField icon={<IconMargin dir="left" />} min={0} value={m.l} onLive={(v) => patchLive({ l: Math.max(0, v) })} onEnd={end} onCommit={(v) => patch({ l: Math.max(0, v) })} />
      </Row>
    </Section>
  )
}

/** Outline/stroke: addable weight + align row over a boxed color row. */
function BorderSection({
  s,
  live,
  end,
  commit,
}: {
  s: Shape
  live: (id: string, patch: ShapePatch, label: string) => void
  end: () => void
  commit: (patch: ShapePatch, label: string) => void
}) {
  const has = !!s.stroke
  const isLine = s.type === 'line'
  return (
    <Section
      title={isLine ? 'Stroke' : 'Outline'}
      open={has}
      onAdd={
        !has && !isLine
          ? () => commit({ stroke: '#d9d9d9', strokeWidth: s.strokeWidth ?? 1 }, 'Add border')
          : undefined
      }
      onActivate={
        !has && !isLine
          ? () => commit({ stroke: '#d9d9d9', strokeWidth: s.strokeWidth ?? 1 }, 'Add border')
          : undefined
      }
      onRemove={has && !isLine ? () => commit({ stroke: undefined }, 'Remove outline') : undefined}
    >
      <Row>
        <NumField
          icon={<IconStrokeWidth />}
          min={1}
          value={s.strokeWidth ?? 1}
          onLive={(v) => live(s.id, { strokeWidth: Math.max(1, v) }, 'Stroke width')}
          onEnd={end}
          onCommit={(v) => commit({ strokeWidth: Math.max(1, v) }, 'Stroke width')}
        />
        <MiniSelect
          value="all"
          options={[
            ['all', 'Align: All'],
            ['inside', 'Align: Inside'],
            ['outside', 'Align: Outside'],
          ]}
          disabledOptions={isLine ? [] : ['inside', 'outside']}
          onChange={() => { /* only 'All' is supported by the renderer for now */ }}
        />
      </Row>
      <ColorField shapeId={s.id} field="stroke" txLabel={isLine ? 'Stroke color' : 'Border color'} value={s.stroke} />
    </Section>
  )
}

const FONT_FAMILIES: readonly (readonly [string, string])[] = [
  ['"Geist Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', 'Geist'],
  ['"Geist Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace', 'Geist Mono'],
  ['Georgia, serif', 'Georgia'],
  ['"Times New Roman", serif', 'Times New Roman'],
  ['Arial, Helvetica, sans-serif', 'Arial'],
  ['"Courier New", monospace', 'Courier New'],
]

/** Locally shipped faces for the FontPicker trigger + list (always preview instantly). */
const BUILTIN_FONT_ENTRIES: FontEntry[] = [
  { id: 'builtin:geist', name: 'Geist', category: 'sans-serif', preview: FONT_FAMILIES[0][0] },
  { id: 'builtin:geist-mono', name: 'Geist Mono', category: 'monospace', preview: FONT_FAMILIES[1][0] },
  { id: 'builtin:georgia', name: 'Georgia', category: 'serif', preview: FONT_FAMILIES[2][0] },
  { id: 'builtin:times', name: 'Times New Roman', category: 'serif', preview: FONT_FAMILIES[3][0] },
  { id: 'builtin:arial', name: 'Arial', category: 'sans-serif', preview: FONT_FAMILIES[4][0] },
  { id: 'builtin:courier', name: 'Courier New', category: 'monospace', preview: FONT_FAMILIES[5][0] },
]

const FONT_WEIGHTS: readonly (readonly [string, string])[] = [
  ['400', 'Regular'],
  ['500', 'Medium'],
  ['600', 'Semibold'],
  ['700', 'Bold'],
]

/** Typography: family, weight + size, line-height + letter-spacing, horizontal align. */
function TypographySection({
  s,
  live,
  end,
  commit,
}: {
  s: Shape
  live: (id: string, patch: ShapePatch, label: string) => void
  end: () => void
  commit: (patch: ShapePatch, label: string) => void
}) {
  const alignButtons: Array<{ icon: LucideIcon; a: 'left' | 'center' | 'right' | 'justify'; tip: string }> = [
    { icon: AlignLeft, a: 'left', tip: 'Align left' },
    { icon: AlignCenter, a: 'center', tip: 'Align center' },
    { icon: AlignRight, a: 'right', tip: 'Align right' },
    { icon: AlignJustify, a: 'justify', tip: 'Justify' },
  ]
  // google library loads once per session, lazily when the picker opens
  const [googleFonts, googleFontsLoading] = useGoogleFonts()
  return (
    <Section title="Typography">
      <FontPicker
        fonts={googleFonts}
        builtin={BUILTIN_FONT_ENTRIES}
        value={(s.fontFamily ?? FONT_FAMILIES[0][0]) as string}
        onChange={(v) => commit({ fontFamily: v }, 'Font family')}
        loading={googleFontsLoading}
      />
      <Row>
        <MiniSelect
          value={String(s.fontWeight ?? 500)}
          options={FONT_WEIGHTS}
          onChange={(v) => commit({ fontWeight: Number(v) }, 'Font weight')}
        />
        <NumField
          icon={<IconFontSize />}
          min={4}
          step={0.25}
          value={s.fontSize ?? 24}
          onLive={(v) => live(s.id, { fontSize: Math.max(4, v) }, 'Font size')}
          onEnd={end}
          onCommit={(v) => commit({ fontSize: Math.max(4, v) }, 'Font size')}
        />
      </Row>
      <Row>
        <NumField
          icon={<IconLineHeight />}
          step={0.01}
          min={0.5}
          max={4}
          value={s.lineHeight ?? 1.4}
          onLive={(v) => live(s.id, { lineHeight: clampF(v) }, 'Line height')}
          onEnd={end}
          onCommit={(v) => commit({ lineHeight: clampF(v) }, 'Line height')}
        />
        <NumField
          icon={<IconLetterSpacing />}
          step={0.1}
          min={-20}
          max={40}
          value={s.letterSpacing ?? 0}
          onLive={(v) => live(s.id, { letterSpacing: v }, 'Letter spacing')}
          onEnd={end}
          onCommit={(v) => commit({ letterSpacing: v }, 'Letter spacing')}
        />
      </Row>
      <Row>
        {alignButtons.map(({ icon: I, a, tip }) => (
          <Hint key={a} label={tip}>
            <button
              onClick={() => commit({ align: a }, 'Align text')}
              className={
                'flex h-7 flex-1 cursor-pointer items-center justify-center rounded-md transition-colors ' +
                ((s.align ?? 'left') === a ? 'bg-primary/20 text-primary' : 'bg-[#2b2b2b] text-muted-foreground hover:text-foreground')
              }
            >
              <I size={13} />
            </button>
          </Hint>
        ))}
      </Row>
    </Section>
  )
}

const clampF = (v: number) => Math.min(4, Math.max(0.5, v))


/**
 * Corner radius row: one uniform field with an expand toggle that reveals all four corners.
 */
function RadiusField({
  s,
  live,
  end,
  commit,
}: {
  s: Shape
  live: (id: string, patch: ShapePatch, label: string) => void
  end: () => void
  commit: (patch: ShapePatch, label: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const radii = s.radii
  const r = s.radius ?? 0
  const val = (c: keyof NonNullable<Shape['radii']>) => radii?.[c] ?? r
  const setAll = (v: number) => commit({ radius: Math.max(0, v), radii: undefined }, 'Corner radius')
  const setCorner = (c: 'tl' | 'tr' | 'br' | 'bl') => (v: number) =>
    commit({ radius: 0, radii: { tl: val('tl'), tr: val('tr'), br: val('br'), bl: val('bl'), [c]: Math.max(0, v) } as Shape['radii'] & Record<string, number> }, 'Corner radius')
  const setCornerLive = (c: 'tl' | 'tr' | 'br' | 'bl') => (v: number) =>
    live(s.id, { radius: 0, radii: { tl: val('tl'), tr: val('tr'), br: val('br'), bl: val('bl'), [c]: Math.max(0, v) } as Shape['radii'] & Record<string, number> }, 'Corner radius')

  /** The same throw-away-corner mark, flipped to point at each corner. */
  const CornerIcon = ({ c }: { c: 'tl' | 'tr' | 'br' | 'bl' }) => (
    <img
      src="/TablerBorderRadius.png"
      alt=""
      className="size-4"
      style={{
        transform:
          c === 'tl' ? 'none' : c === 'tr' ? 'scaleX(-1)' : c === 'bl' ? 'scaleY(-1)' : 'scale(-1, -1)',
      }}
    />
  )

  return (
    <Row>
      {expanded ? (
        <>
          <NumField key="tl" icon={<CornerIcon c="tl" />} min={0} value={val('tl')} onLive={setCornerLive('tl')} onEnd={end} onCommit={setCorner('tl')} />
          <NumField key="tr" icon={<CornerIcon c="tr" />} min={0} value={val('tr')} onLive={setCornerLive('tr')} onEnd={end} onCommit={setCorner('tr')} />
          <NumField key="br" icon={<CornerIcon c="br" />} min={0} value={val('br')} onLive={setCornerLive('br')} onEnd={end} onCommit={setCorner('br')} />
          <NumField key="bl" icon={<CornerIcon c="bl" />} min={0} value={val('bl')} onLive={setCornerLive('bl')} onEnd={end} onCommit={setCorner('bl')} />
          <Hint label="Uniform corners">
            <button onClick={() => setExpanded(false)} className="cursor-pointer text-muted-foreground hover:text-foreground">
              <Minimize2 size={12} />
            </button>
          </Hint>
        </>
      ) : (
        <>
          <NumField key="r" icon={<IconRadius />} min={0} value={r} onLive={(v) => live(s.id, { radius: Math.max(0, v), radii: undefined }, 'Corner radius')} onEnd={end} onCommit={setAll} />
          <Hint label="Individual corners">
            <button onClick={() => setExpanded(true)} className="cursor-pointer text-muted-foreground hover:text-foreground">
              <Expand size={12} />
            </button>
          </Hint>
        </>
      )}
    </Row>
  )
}

const alignButtons: Array<{ icon: LucideIcon; edge: AlignEdge; tip: string }> = [
  { icon: AlignStartVertical, edge: 'left', tip: 'Align left' },
  { icon: AlignCenterVertical, edge: 'hcenter', tip: 'Align horizontal centers' },
  { icon: AlignEndVertical, edge: 'right', tip: 'Align right' },
  { icon: AlignStartHorizontal, edge: 'top', tip: 'Align top' },
  { icon: AlignCenterHorizontal, edge: 'vcenter', tip: 'Align vertical centers' },
  { icon: AlignEndHorizontal, edge: 'bottom', tip: 'Align bottom' },
]

function AlignRow() {
  return (
    <div className="flex items-center gap-0.5">
      {alignButtons.map(({ icon: I, edge, tip }) => (
        <Hint key={edge} label={tip}>
          <button
            onClick={() => alignSelection(edge)}
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <I size={13} />
          </button>
        </Hint>
      ))}
    </div>
  )
}

/* ------------------------------ panel ------------------------------ */

/** Zoom percentage cluster for the right-panel header. */
/** Undo/redo + zoom readout cluster; reused by the right panel header and the mobile canvas pill. */
export function ZoomCluster() {
  const zoom = useUi((s) => s.camera.zoom)
  const step = (factor: number) => {
    const el = canvasEl.current
    if (!el) return
    const next = Math.min(16, Math.max(0.05, zoom * factor))
    setZoomAroundCenter(next, el.getBoundingClientRect())
  }
  return (
    <div className="flex items-center gap-0.5">
      <Hint label="Zoom out">
        <button
          className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={() => step(1 / 1.25)}
        >
          <Minus size={13} />
        </button>
      </Hint>
      <span className="w-10 text-center font-mono text-[11px] text-foreground/90">{Math.round(zoom * 100)}%</span>
      <Hint label="Zoom in">
        <button
          className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={() => step(1.25)}
        >
          <Plus size={13} />
        </button>
      </Hint>
    </div>
  )
}

/** Right-panel header: undo/redo + zoom + collapse toggle (the top bar is gone; sidebars carry everything). */
function PanelTop() {
  return (
    <div className="flex h-10 shrink-0 items-center gap-0.5 border-b border-border px-2">
      <UndoRedoButtons />
      <div className="mx-1 h-4 w-px bg-border" />
      <ZoomCluster />
      <div className="flex-1" />
      <Hint label="Hide properties panel">
        <button
          className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={() => useUi.getState().togglePanel('right')}
        >
          <PanelRight size={14} />
        </button>
      </Hint>
    </div>
  )
}

export function PropertiesPanel() {
  const selection = useUi((s) => s.selection)
  const nodes = useDoc((s) => s.nodes)
  const shapes = selection.map((id) => nodes[id]).filter(Boolean) as Shape[]
  const { live, liveMany, end } = useLiveTx()

  if (!shapes.length) {
    return (
      <aside className={panelCls + panelMobileRight}>
        <PanelTop />
        <PanelScroll>
          <div className="border-b border-border px-3 py-2.5">
            <h3 className="text-[11px] text-muted-foreground">Page</h3>
          </div>
          <Section title="Canvas">
            <CanvasBgField />
          </Section>
        </PanelScroll>
      </aside>
    )
  }

  const ids = shapes.map((s) => s.id)
  const multi = shapes.length > 1

  // shared header
  const header = (t: ShapeType, s?: Shape) => {
    const meta = typeMeta[t]
    const I = meta.icon
    return (
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <I size={13} className="shrink-0 text-muted-foreground" />
        {s && !multi ? (
          <Input
            key={s.id}
            className="h-6 border-0 bg-transparent px-1 text-[13px] font-medium shadow-none focus-visible:bg-[#2b2b2b] focus-visible:ring-0"
            defaultValue={s.name}
            onBlur={(e) => {
              const v = e.target.value.trim()
              if (v && v !== s.name) setProps([s.id], { name: v }, 'Rename')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
          />
        ) : (
          <span className="text-[13px] font-semibold">{meta.label}</span>
        )}
      </div>
    )
  }

  if (multi) {
    const roots = selectionRoots(nodes, selection)
    const boxes = roots.map((id) => nodes[id]).filter(Boolean).map((s) => pageAABB(nodes, s))
    const b = boundsOfRects(boxes)
    return (
      <TooltipProvider>
        <aside className={panelCls + panelMobileRight}>
          <PanelTop />
          <PanelScroll>
          {header('rect')}
          <Section title="Align">
            <AlignRow />
          </Section>
          {b && (
            <Section title="Position & size">
              <Row>
                <NumField
                  label="X"
                  value={b.x}
                  onCommit={(v) => nudge(v - b.x, 0)}
                />
                <NumField
                  label="Y"
                  value={b.y}
                  onCommit={(v) => nudge(0, v - b.y)}
                />
              </Row>
              <Row>
                <Input disabled className="h-5 min-w-0 flex-1 border-0 bg-transparent px-0 text-[12px] shadow-none" value={String(Math.round(b.w))} />
                <Input disabled className="h-5 min-w-0 flex-1 border-0 bg-transparent px-0 text-[12px] shadow-none" value={String(Math.round(b.h))} />
              </Row>
            </Section>
          )}
          <Section title="Opacity">
            <Row>
              <NumField
                icon={<IconOpacity />}
                scale={100}
                step={0.004}
                min={0}
                max={1}
                value={shapes[0].opacity === shapes[1].opacity ? shapes[0].opacity : NaN}
                onLive={(v) => liveMany(ids, (n) => {
                  for (const id of ids) {
                    const s = n[id]
                    if (s) s.opacity = v
                  }
                }, 'Opacity')}
                onEnd={end}
                onCommit={(v) => setProps(ids, { opacity: v }, 'Opacity')}
              />
            </Row>
          </Section>
          <ExportSection />
          </PanelScroll>
        </aside>
      </TooltipProvider>
    )
  }

  const s = shapes[0]
  const isLine = s.type === 'line'
  const commitProp = (patch: ShapePatch, label: string) => setProps([s.id], patch, label)

  const fillEl =
    (s.type === 'rect' || s.type === 'ellipse' || s.type === 'frame' || s.type === 'text') && (
      <Section title="Fill">
        <FillField s={s} />
      </Section>
    )
  const shadowsEl =
    (s.type === 'rect' || s.type === 'ellipse' || s.type === 'frame' || s.type === 'image' || s.type === 'text') && (
      <ShadowsSection s={s} />
    )
  const filtersEl = <FiltersSection s={s} />
  const borderEl = <BorderSection s={s} live={live} end={end} commit={commitProp} />
  const textEl = (
    <>
      <TypographySection s={s} live={live} end={end} commit={commitProp} />
      <Section
        title="Text fill"
        open={!!s.color}
        onAdd={!s.color ? () => commitProp({ color: '#ececf1' }, 'Add text fill') : undefined}
        onRemove={s.color ? () => commitProp({ color: undefined }, 'Remove text fill') : undefined}
      >
        <ColorField shapeId={s.id} field="color" txLabel="Text color" value={s.color} />
      </Section>
    </>
  )

  return (
    <TooltipProvider>
      <aside className={panelCls + panelMobileRight}>
        <PanelTop />
        <PanelScroll>
        {header(s.type, s)}

        {!isLine && (
          <Section title="Align">
            <AlignRow />
          </Section>
        )}

        {!isLine && (
          <Section title="Position & size">
            <Row>
              <NumField
                label="X"
                value={s.x}
                onLive={(v) => live(s.id, { x: v }, 'Move')}
                onEnd={end}
                onCommit={(v) => commitProp({ x: v }, 'Move')}
              />
              <NumField
                label="Y"
                value={s.y}
                onLive={(v) => live(s.id, { y: v }, 'Move')}
                onEnd={end}
                onCommit={(v) => commitProp({ y: v }, 'Move')}
              />
            </Row>
            <Row>
              <NumField
                label="W"
                min={1}
                value={s.type === 'line' ? 0 : s.w}
                onLive={(v) => live(s.id, { w: Math.max(1, v) }, 'Resize')}
                onEnd={end}
                onCommit={(v) => commitProp({ w: Math.max(1, v) }, 'Resize')}
              />
              {s.type === 'text' ? (
                <span className="flex-1 pl-1 text-[11px] text-muted-foreground/60">H auto</span>
              ) : (
                <NumField
                  label="H"
                  min={1}
                  value={s.h}
                  onLive={(v) => live(s.id, { h: Math.max(1, v) }, 'Resize')}
                  onEnd={end}
                  onCommit={(v) => commitProp({ h: Math.max(1, v) }, 'Resize')}
                />
              )}
            </Row>
          </Section>
        )}

        <Section title="Appearance">
          <Row>
            <NumField
              icon={<IconOpacity />}
              scale={100}
              step={0.004}
              min={0}
              max={1}
              value={s.opacity}
              onLive={(v) => live(s.id, { opacity: v }, 'Opacity')}
              onEnd={end}
              onCommit={(v) => commitProp({ opacity: v }, 'Opacity')}
            />
          </Row>
          {(s.type === 'rect' || s.type === 'frame' || s.type === 'image' || s.type === 'text') && (
            <Row>
              <RadiusField s={s} live={live} end={end} commit={commitProp} />
              {s.type === 'frame' && (
                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[12px] font-medium text-foreground/85">
                  Clip
                  <MiniSwitch checked={s.clip ?? false} onChange={(v) => commitProp({ clip: v }, 'Clip')} />
                </label>
              )}
            </Row>
          )}
          {s.type !== 'line' && (
            <Row>
              <NumField
                icon={<IconRotate />}
                min={-360}
                max={360}
                value={s.rotation ?? 0}
                onLive={(v) => live(s.id, { rotation: Math.min(360, Math.max(-360, v)) }, 'Rotation')}
                onEnd={end}
                onCommit={(v) => commitProp({ rotation: Math.min(360, Math.max(-360, v)) }, 'Rotation')}
              />
            </Row>
          )}
        </Section>

        {s.type === 'text' ? (
          <>
            {/* sequence for text: appearance -> typography -> text fill -> fill -> shadow -> filters -> outline */}
            {textEl}
            {fillEl}
            {shadowsEl}
            {filtersEl}
            {borderEl}
          </>
        ) : (
          <>
            {fillEl}
            {shadowsEl}
            {filtersEl}
            {s.type === 'frame' && <MarginSection s={s} />}
            {borderEl}
          </>
        )}

        {s.type === 'image' && (
          <Section title="Image">
            <Row>
              <span className="shrink-0 text-[13px] font-semibold text-foreground/85">Fit</span>
              <MiniSelect
                value={s.fit ?? 'cover'}
                options={[
                  ['cover', 'Cover'],
                  ['contain', 'Contain'],
                ]}
                onChange={(v) => commitProp({ fit: v }, 'Image fit')}
              />
            </Row>
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-full text-[11px]"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = () => {
                  const f = input.files?.[0]
                  if (f) void addImageFile(f)
                }
                input.click()
              }}
            >
              Replace image
            </Button>
          </Section>
        )}

        <ExportSection />
        </PanelScroll>
      </aside>
    </TooltipProvider>
  )
}

/** Export: a single dropdown listing every format, opened from the section header. */
/** Export section: clicking the row (or the "Export" chip) opens the format menu. */
function ExportSection() {
  const pop = usePopFixed()
  return <Section title="Export" addSlot={<ExportMenu pop={pop} />} onActivate={(e) => pop.toggle(e)} />
}

function ExportMenu({ pop }: { pop: PopFixed }) {
  const items: Array<[string, string, () => void]> = [
    ['PNG', '2× raster', () => void exportSelectionPNG(2)],
    ['JPG', '2× raster', () => void exportSelectionRaster('jpeg', 2)],
    ['WEBP', '2× raster', () => void exportSelectionRaster('webp', 2)],
    ['AVIF', '2× raster', () => void exportSelectionRaster('avif', 2)],
    ['SVG', 'Vector', () => void exportSelectionSVG()],
    ['EPS', 'Vector · PostScript', () => void exportSelectionEPS(false)],
    ['AI', 'Vector · Illustrator', () => void exportSelectionEPS(true)],
    ['TSX', 'React + Tailwind code', () => downloadSelectionCode()],
  ]
  return (
    <div className="relative">
      <button
        onClick={pop.toggle}
        className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-foreground/85 hover:bg-accent hover:text-foreground"
      >
        Export
        <ChevronDown size={11} />
      </button>
      {pop.open && (
        <div
          ref={pop.ref}
          style={{ top: pop.pos.top, left: pop.pos.left }}
          className="fixed z-50 w-[192px] rounded-md border border-border bg-popover/95 py-1 shadow-2xl backdrop-blur"
        >
          {items.map(([label, sub, run]) => (
            <button
              key={label}
              onClick={() => {
                run()
                pop.setOpen(false)
              }}
              className="flex w-full cursor-pointer items-baseline gap-2 px-2.5 py-1.5 text-left hover:bg-accent"
            >
              <span className="text-[12px] font-semibold text-foreground/90">{label}</span>
              <span className="text-[10px] font-normal text-muted-foreground">{sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
