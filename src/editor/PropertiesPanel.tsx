import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HexColorPicker } from 'react-colorful'
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
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
import type { Filters, Gradient, GradientStop, ImageFill, Margin, Shape, ShapePatch, ShadowStyle, ShapeType } from '@/model/types'
import { pageAABB, selectionRoots, boundsOfRects } from '@/model/geometry'
import { fillToCss, radiusToCss } from '@/model/styles'
import { useDoc, type Tx } from '@/store/docStore'
import { useUi, DEFAULT_CANVAS_BG, setZoomAroundCenter } from '@/store/uiStore'
import { fileToImageSrc, addImageFile, alignSelection, canvasEl, nudge, setProps, type AlignEdge } from './commands'
import { exportSelectionEPS, exportSelectionPNG, exportSelectionRaster, exportSelectionSVG } from './exporters'
import { UndoRedoButtons } from './UndoRedoButtons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Hint, TooltipProvider } from '@/components/ui/tooltip'

/* ------------------------------ shells ------------------------------ */

const panelCls =
  'flex w-[264px] shrink-0 flex-col overflow-y-auto border-l border-border bg-[#1c1c1c] scrollbar-thin'

/**
 * Collapsible properties section. The right-side indicator is a minus when open and a
 * plus when closed; sections with addable content (e.g. shadows) use it to add/remove.
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
}: {
  title: string
  subtitle?: string
  children: ReactNode
  addSlot?: ReactNode
  onAdd?: () => void
  onRemove?: () => void
  /** force open/closed for addable-style sections; undefined = self-managed collapse */
  open?: boolean
  defaultOpen?: boolean
}) {
  const [openState, setOpenState] = useState(defaultOpen)
  const collapsible = openProp === undefined
  const open = collapsible ? openState : openProp

  const toggle = () => {
    if (!collapsible) return
    setOpenState((o) => !o)
  }
  const onIndicator = () => {
    if (!collapsible) {
      if (!openProp && onAdd) onAdd()
      return
    }
    toggle()
  }

  return (
    <section className="border-b border-border px-3.5 py-3">
      <div className="mb-2 flex min-h-6 items-center justify-between gap-1">
        <button
          onClick={toggle}
          className="flex min-w-0 cursor-pointer items-baseline gap-1.5 text-left"
          aria-label={`Toggle ${title}`}
        >
          <span className="truncate text-[13px] font-semibold tracking-[0.01em] text-foreground/90">{title}</span>
          {subtitle && <span className="truncate text-[11px] font-normal text-muted-foreground">{subtitle}</span>}
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {addSlot}
          <Hint label={open ? 'Collapse' : 'Expand'}>
            <button
              onClick={onIndicator}
              className="cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label={open ? 'Collapse section' : 'Expand section'}
            >
              {open ? <Minus size={13} /> : <Plus size={13} />}
            </button>
          </Hint>
          {!collapsible && openProp && onRemove && (
            <Hint label="Remove">
              <button onClick={onRemove} className="cursor-pointer text-muted-foreground hover:text-foreground">
                <RemoveIcon size={13} />
              </button>
            </Hint>
          )}
        </div>
      </div>
      {open && <div className="space-y-1.5">{children}</div>}
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
  label: string
  value: number
  /** displayed = stored × scale (e.g. opacity stored 0..1 → scale 100) */
  scale?: number
  /** stored units per pixel of drag */
  step?: number
  min?: number
  max?: number
  disabled?: boolean
  onLive?: (stored: number) => void
  onEnd?: () => void
  onCommit: (stored: number) => void
}

const clampField = (v: number, min?: number, max?: number) => {
  if (min !== undefined) v = Math.max(min, v)
  if (max !== undefined) v = Math.min(max, v)
  return v
}

function NumField({ label, value, scale = 1, step = 1, min, max, disabled, onLive, onEnd, onCommit }: NumFieldProps) {
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
    <label className="flex min-w-0 flex-1 items-center gap-1 rounded-md border border-transparent bg-background/40 px-1.5 py-0.5 transition-colors hover:border-border focus-within:border-ring">
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
    </label>
  )
}

/* ------------------------------ color ------------------------------ */

function ColorButton({ color, onClick }: { color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-6 w-8 shrink-0 cursor-pointer rounded-md border border-border ring-1 ring-inset ring-black/20"
      style={{
        background:
          color === 'transparent' || color === 'none'
            ? 'repeating-conic-gradient(#52525b 0% 25%, #3f3f3f 0% 50%) 50% / 8px 8px'
            : color,
      }}
    />
  )
}

/** Close popovers on outside pointerdown / Escape. */
function usePopoverDismiss(ref: React.RefObject<HTMLElement | null>, onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [active])
}

const hexDisplay = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/
const hexShort = /^#([0-9a-fA-F]{6})$/

/** Small color popover: picker + hex field, no buttons — clicking outside closes and commits. */
function ColorPopover({
  popoverRef,
  onPick,
  hex,
  setHex,
}: {
  popoverRef: React.RefObject<HTMLDivElement | null>
  onPick: (hex: string) => void
  hex: string
  setHex: (h: string) => void
}) {
  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full z-40 mt-1.5 w-[190px] rounded-xl border border-border bg-popover/95 p-2 shadow-2xl backdrop-blur"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <HexColorPicker color={hex} onChange={onPick} />
      <div className="mt-2 flex items-center justify-between gap-1.5">
        <span className="text-[10px] font-normal text-muted-foreground">Hex</span>
        <Input
          className="h-6 w-24 bg-background/40 font-mono text-[11px] uppercase"
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

/** Shared popover state for one color control: outside-click + Escape close it. */
function useColorPop(value: string) {
  const [open, setOpen] = useState(false)
  const [hex, setHex] = useState('#ffffff')
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!open) setHex(hexDisplay.test(value) ? value.slice(0, 7) : '#ffffff')
  }, [value, open])
  usePopoverDismiss(ref, () => setOpen(false), open)
  return { open, setOpen, hex, setHex, ref }
}

function ColorField({
  shapeId,
  field,
  label,
  value,
  noneable,
}: {
  shapeId: string
  field: 'fill' | 'stroke' | 'color'
  label: string
  value?: string
  noneable?: boolean
}) {
  const pop = useColorPop(value ?? 'transparent')
  const txRef = useRef<Tx | null>(null)

  const applyLive = (c: string) => {
    pop.setHex(c)
    const doc = useDoc.getState()
    txRef.current ??= doc.beginTx(`Change ${label.toLowerCase()}`)
    txRef.current.capture(shapeId, { [field]: '' })
    doc.patchLive((n) => {
      const s = n[shapeId]
      if (s) (s as unknown as Record<string, unknown>)[field] = c
    })
  }
  const commitNow = () => {
    txRef.current?.commit()
    txRef.current = null
  }
  const setNone = () => {
    commitNow()
    setProps([shapeId], { [field]: 'transparent' }, `Remove ${label.toLowerCase()}`)
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[13px] font-semibold text-foreground/85">{label}</span>
      <div className="relative flex items-center gap-1.5">
        {noneable && (
          <Hint label="Remove color">
            <button className="cursor-pointer text-[11px] font-normal text-muted-foreground hover:text-foreground" onClick={setNone}>
              none
            </button>
          </Hint>
        )}
        <ColorButton
          color={value ?? 'transparent'}
          onClick={() => {
            commitNow()
            pop.setOpen((o) => !o)
          }}
        />
        <span className="w-11 text-right font-mono text-[11px] font-normal uppercase text-muted-foreground">
          {(value && value !== 'transparent' ? value : '').replace('#', '')}
        </span>
        {pop.open && <ColorPopover popoverRef={pop.ref} onPick={applyLive} hex={pop.hex} setHex={pop.setHex} />}
      </div>
    </div>
  )
}

function CanvasBgField() {
  const bg = useUi((s) => s.canvasBg)
  const pop = useColorPop(bg)
  const apply = (c: string) => {
    pop.setHex(c)
    useUi.getState().setCanvasBg(c)
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[13px] font-semibold text-foreground/85">Background</span>
      <div className="relative flex items-center gap-1.5">
        <ColorButton color={bg} onClick={() => pop.setOpen((o) => !o)} />
        <span className="w-11 text-right font-mono text-[11px] font-normal uppercase text-muted-foreground">{bg.replace('#', '')}</span>
        {pop.open && <ColorPopover popoverRef={pop.ref} onPick={apply} hex={pop.hex} setHex={pop.setHex} />}
      </div>
    </div>
  )
}

/* ------------------------------ styles: fill / shadow / filters / margin ------------------------------ */

/** Small swatch that opens a color popover; used by gradient stops and shadow colors. */
function SwatchButton({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const pop = useColorPop(color || '#000000')
  return (
    <div className="relative inline-flex items-center">
      <ColorButton color={color} onClick={() => pop.setOpen((o) => !o)} />
      {pop.open && (
        <ColorPopover
          popoverRef={pop.ref}
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
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f472b6"/><stop offset="0.55" stop-color="#a855f7"/><stop offset="1" stop-color="#312e81"/></linearGradient></defs><rect width="480" height="360" fill="#231f28"/><circle cx="150" cy="150" r="88" fill="url(#g)"/><circle cx="330" cy="240" r="120" fill="url(#g)" opacity="0.65"/><circle cx="330" cy="110" r="60" fill="url(#g)" opacity="0.45"/></svg>`,
  )

/** Segmented mode switcher row. */
function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly (readonly [T, string])[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-background/40 p-0.5">
      {options.map(([m, label]) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={
            'flex-1 cursor-pointer rounded-md px-2 py-1 text-[12px] font-medium transition-colors ' +
            (value === m ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground')
          }
        >
          {label}
        </button>
      ))}
    </div>
  )
}

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
      className="relative h-5 cursor-pointer overflow-visible rounded-md ring-1 ring-inset ring-black/20"
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
            'absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 shadow ' +
            (selected === i ? 'border-primary' : 'border-white/90')
          }
          style={{ left: `${st.pos}%` }}
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

  const setFill = (v: Shape['fill'], label: string) =>
    setProps([s.id], { fill: v === undefined ? 'transparent' : v } as ShapePatch, label)

  const pick = (m: 'solid' | 'gradient' | 'image') => {
    if (m === mode) return
    if (m === 'solid') {
      const base = solid ?? (g ? g.stops[0]?.color : undefined) ?? '#f472b6'
      setFill(base, 'Solid fill')
    } else if (m === 'gradient') {
      const base = solid ?? '#f472b6'
      setFill(
        {
          type: 'linear',
          angle: g?.angle ?? 90,
          stops: [
            { color: base, alpha: 1, pos: 0 },
            { color: '#ffffff', alpha: 1, pos: 100 },
          ],
        },
        'Gradient fill',
      )
      setSel(0)
    } else {
      setFill({ type: 'image', src: image?.src ?? s.src ?? PLACEHOLDER_IMAGE, fit: image?.fit ?? 'cover' }, 'Image fill')
    }
  }

  const patchG = (patch: Partial<Gradient>, label: string) => {
    if (!g) return
    setFill({ ...g, ...patch }, label)
  }
  const patchGLive = (patch: Partial<Gradient>) => {
    if (!g) return
    live(s.id, { fill: { ...g, ...patch } } as ShapePatch, 'Gradient')
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
      <Seg
        options={
          [
            ['solid', 'Solid'],
            ['gradient', 'Gradient'],
            ['image', 'Image'],
          ] as const
        }
        value={mode}
        onChange={pick}
      />
      {mode === 'solid' && <ColorField shapeId={s.id} field="fill" label="Color" value={solid ?? 'transparent'} noneable />}
      {mode === 'gradient' && g && (
        <>
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
          <Row>
            <Seg
              options={
                [
                  ['linear', 'Linear'],
                  ['radial', 'Radial'],
                ] as const
              }
              value={g.type}
              onChange={(t) => patchG({ type: t }, 'Gradient type')}
            />
          </Row>
          <Row>
            {g.stops.map((st, i) => (
              <SwatchButton
                key={i}
                color={st.color}
                onChange={(c) => patchG({ stops: g.stops.map((s2, j) => (j === i ? { ...s2, color: c } : s2)) }, 'Gradient stop')}
              />
            ))}
            <div className="flex-1" />
            <Hint label="Add stop">
              <button
                className="cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => {
                  const stops = [...g.stops, { color: '#808080', alpha: 1, pos: 50 }].sort((a, b) => a.pos - b.pos)
                  setSel(g.stops.length)
                  patchG({ stops }, 'Add gradient stop')
                }}
              >
                <Plus size={13} />
              </button>
            </Hint>
            <Hint label="Remove stop">
              <button
                disabled={g.stops.length <= 2}
                className={
                  'cursor-pointer ' +
                  (g.stops.length > 2 ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground/30')
                }
                onClick={() => {
                  if (g.stops.length <= 2) return
                  const stops = g.stops.filter((_, j) => j !== Math.min(sel, g.stops.length - 1))
                  setSel((i2) => Math.max(0, Math.min(i2, stops.length - 1)))
                  patchG({ stops }, 'Remove gradient stop')
                }}
              >
                <RemoveIcon size={13} />
              </button>
            </Hint>
          </Row>
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
                {g.type === 'linear' && (
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
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-foreground/85">Fit</span>
            <select
              className="h-6 w-24 rounded-md border border-border bg-background/40 px-1 text-[12px] font-medium outline-none focus:border-ring"
              value={image.fit ?? 'cover'}
              onChange={(e) => setFill({ ...image, fit: e.target.value as 'cover' | 'contain' }, 'Image fit')}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </div>
        </>
      )}
    </>
  )
}

const SHADOW_DEFAULT: ShadowStyle = { x: 0, y: 8, blur: 24, color: '#00000066' }

/** Drop / inner shadow editor, shared shape of the two sections. */
function ShadowSection({ s, field, title }: { s: Shape; field: 'shadow' | 'innerShadow'; title: string }) {
  const sh = s[field]
  const { live, end } = useLiveTx()

  const setF = (patch: Partial<ShadowStyle>, label: string) => {
    const base = (sh ?? SHADOW_DEFAULT) as ShadowStyle
    setProps([s.id], { [field]: { ...base, ...patch } } as ShapePatch, label)
  }
  const setFLive = (patch: Partial<ShadowStyle>) => {
    const base = (sh ?? SHADOW_DEFAULT) as ShadowStyle
    live(s.id, { [field]: { ...base, ...patch } } as ShapePatch, 'Shadow')
  }

  return (
    <Section
      title={title}
      open={!!sh}
      onAdd={!sh ? () => setProps([s.id], { [field]: SHADOW_DEFAULT } as ShapePatch, 'Add shadow') : undefined}
      onRemove={
        sh
          ? () => setProps([s.id], { [field]: undefined } as ShapePatch, 'Remove shadow')
          : undefined
      }
    >
      {sh && (
        <>
          <Row>
            <NumField
              label="X"
              value={sh.x}
              onLive={(v) => setFLive({ x: v })}
              onEnd={end}
              onCommit={(v) => setF({ x: v }, 'Shadow offset')}
            />
            <NumField
              label="Y"
              value={sh.y}
              onLive={(v) => setFLive({ y: v })}
              onEnd={end}
              onCommit={(v) => setF({ y: v }, 'Shadow offset')}
            />
            <NumField
              label="Blur"
              min={0}
              value={sh.blur}
              onLive={(v) => setFLive({ blur: Math.max(0, v) })}
              onEnd={end}
              onCommit={(v) => setF({ blur: Math.max(0, v) }, 'Shadow blur')}
            />
          </Row>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-foreground/85">Color</span>
            <div className="flex items-center gap-1.5">
              <SwatchButton color={sh.color} onChange={(c) => setF({ color: c }, 'Shadow color')} />
            </div>
          </div>
        </>
      )}
    </Section>
  )
}

const FILTER_KINDS: Array<{ key: keyof Filters; label: string; def: number; min: number; max: number; suffix: string }> = [
  { key: 'blur', label: 'Blur', def: 8, min: 0, max: 64, suffix: 'px' },
  { key: 'brightness', label: 'Brightness', def: 110, min: 0, max: 300, suffix: '%' },
  { key: 'contrast', label: 'Contrast', def: 110, min: 0, max: 300, suffix: '%' },
  { key: 'grayscale', label: 'Grayscale', def: 100, min: 0, max: 100, suffix: '%' },
  { key: 'hueRotate', label: 'Hue rotation', def: 45, min: 0, max: 360, suffix: '°' },
  { key: 'invert', label: 'Invert', def: 100, min: 0, max: 100, suffix: '%' },
  { key: 'saturate', label: 'Saturate', def: 120, min: 0, max: 300, suffix: '%' },
  { key: 'sepia', label: 'Sepia', def: 100, min: 0, max: 100, suffix: '%' },
]

/** Popover menu listing the filters the plus button can add. */
function FilterAddMenu({ s }: { s: Shape }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  usePopoverDismiss(ref, () => setOpen(false), open)
  const add = (k: (typeof FILTER_KINDS)[number]) => {
    setProps([s.id], { filters: { ...(s.filters ?? {}), [k.key]: k.def } }, `Add ${k.label.toLowerCase()}`)
    setOpen(false)
  }
  return (
    <div className="relative">
      <Hint label="Add filter">
        <button
          onClick={() => setOpen((o) => !o)}
          className="cursor-pointer text-muted-foreground hover:text-foreground"
          aria-label="Add filter"
        >
          <Plus size={13} />
        </button>
      </Hint>
      {open && (
        <div
          ref={ref}
          className="absolute right-0 top-full z-40 mt-1.5 w-[168px] rounded-xl border border-border bg-popover/95 py-1.5 shadow-2xl backdrop-blur"
        >
          <div className="px-2.5 pb-1 pt-0.5 text-[10px] font-normal uppercase tracking-[0.06em] text-muted-foreground/70">
            Add filter
          </div>
          {FILTER_KINDS.map((k) => (
            <button
              key={k.key}
              onClick={() => add(k)}
              className="block w-full cursor-pointer px-2.5 py-1.5 text-left text-[12px] font-medium text-foreground/90 hover:bg-accent"
            >
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
  const { live, end } = useLiveTx()
  const setF = (k: keyof Filters, v: number) => setProps([s.id], { filters: { ...f, [k]: v } }, 'Filter')
  return (
    <Section title="Filters" addSlot={<FilterAddMenu s={s} />} open={!!has} defaultOpen>
      {has &&
        FILTER_KINDS.filter((k) => f[k.key] != null).map((k) => (
          <div key={k.key} className="flex items-center gap-1.5">
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground/85">{k.label}</span>
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
        <NumField label="T" min={0} value={m.t} onLive={(v) => patchLive({ t: Math.max(0, v) })} onEnd={end} onCommit={(v) => patch({ t: Math.max(0, v) })} />
        <NumField label="R" min={0} value={m.r} onLive={(v) => patchLive({ r: Math.max(0, v) })} onEnd={end} onCommit={(v) => patch({ r: Math.max(0, v) })} />
      </Row>
      <Row>
        <NumField label="B" min={0} value={m.b} onLive={(v) => patchLive({ b: Math.max(0, v) })} onEnd={end} onCommit={(v) => patch({ b: Math.max(0, v) })} />
        <NumField label="L" min={0} value={m.l} onLive={(v) => patchLive({ l: Math.max(0, v) })} onEnd={end} onCommit={(v) => patch({ l: Math.max(0, v) })} />
      </Row>
    </Section>
  )
}

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

  return (
    <Row>
      {expanded ? (
        <>
          <NumField key="tl" label="TL" min={0} value={val('tl')} onLive={setCornerLive('tl')} onEnd={end} onCommit={setCorner('tl')} />
          <NumField key="tr" label="TR" min={0} value={val('tr')} onLive={setCornerLive('tr')} onEnd={end} onCommit={setCorner('tr')} />
          <NumField key="br" label="BR" min={0} value={val('br')} onLive={setCornerLive('br')} onEnd={end} onCommit={setCorner('br')} />
          <NumField key="bl" label="BL" min={0} value={val('bl')} onLive={setCornerLive('bl')} onEnd={end} onCommit={setCorner('bl')} />
          <Hint label="Uniform corners">
            <button onClick={() => setExpanded(false)} className="cursor-pointer text-muted-foreground hover:text-foreground">
              <Minimize2 size={12} />
            </button>
          </Hint>
        </>
      ) : (
        <>
          <NumField key="r" label="R" min={0} value={r} onLive={(v) => live(s.id, { radius: Math.max(0, v), radii: undefined }, 'Corner radius')} onEnd={end} onCommit={setAll} />
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
function ZoomCluster() {
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
      <aside className={panelCls + ' hidden lg:flex'}>
        <PanelTop />
        <div className="border-b border-border px-3 py-2.5">
          <h3 className="text-[11px] text-muted-foreground">Page</h3>
        </div>
        <Section title="Canvas">
          <CanvasBgField />
        </Section>
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
            className="h-6 border-0 bg-transparent px-1 text-[13px] font-medium shadow-none focus-visible:bg-background/40 focus-visible:ring-0"
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
        <aside className={panelCls + ' hidden lg:flex'}>
          <PanelTop />
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
                label="O"
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
          <Section title="Export">
            <ExportButtons />
          </Section>
        </aside>
      </TooltipProvider>
    )
  }

  const s = shapes[0]
  const isLine = s.type === 'line'
  const commitProp = (patch: ShapePatch, label: string) => setProps([s.id], patch, label)

  return (
    <TooltipProvider>
      <aside className={panelCls + ' hidden lg:flex'}>
        <PanelTop />
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
              label="O"
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
          {(s.type === 'rect' || s.type === 'frame' || s.type === 'image') && (
            <Row>
              <RadiusField s={s} live={live} end={end} commit={commitProp} />
              {s.type === 'frame' && (
                <label className="flex shrink-0 cursor-pointer items-center justify-end gap-1.5 text-[12px] font-medium text-foreground/85">
                  Clip
                  <input
                    type="checkbox"
                    checked={s.clip ?? false}
                    onChange={(e) => commitProp({ clip: e.target.checked }, 'Clip')}
                    className="size-3.5 cursor-pointer accent-[var(--primary)]"
                  />
                </label>
              )}
            </Row>
          )}
          {s.type !== 'line' && (
            <Row>
              <NumField
                label="°"
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

        {(s.type === 'rect' || s.type === 'ellipse' || s.type === 'frame') && (
          <Section title="Fill">
            <FillField s={s} />
          </Section>
        )}

        {(s.type === 'rect' || s.type === 'ellipse' || s.type === 'frame' || s.type === 'image') && (
          <>
            <ShadowSection s={s} field="shadow" title="Shadow" />
            <ShadowSection s={s} field="innerShadow" title="Inner shadow" />
          </>
        )}

        <FiltersSection s={s} />

        {s.type === 'frame' && <MarginSection s={s} />}

        {(s.type === 'line' || s.type === 'rect' || s.type === 'ellipse' || s.type === 'frame') && (
          <Section title={isLine ? 'Stroke' : 'Border'}>
            <ColorField shapeId={s.id} field="stroke" label="Color" value={s.stroke} noneable />
            <Row>
              <NumField
                label="W"
                min={1}
                value={s.strokeWidth ?? 1}
                onLive={(v) => live(s.id, { strokeWidth: Math.max(1, v) }, 'Stroke width')}
                onEnd={end}
                onCommit={(v) => commitProp({ strokeWidth: Math.max(1, v) }, 'Stroke width')}
              />
            </Row>
          </Section>
        )}

        {s.type === 'text' && (
          <Section title="Typography">
            <Row>
              <NumField
                label="S"
                min={4}
                step={0.25}
                value={s.fontSize ?? 24}
                onLive={(v) => live(s.id, { fontSize: Math.max(4, v) }, 'Font size')}
                onEnd={end}
                onCommit={(v) => commitProp({ fontSize: Math.max(4, v) }, 'Font size')}
              />
              <select
                className="h-6 flex-1 rounded-md border border-border bg-background/40 px-1 text-[12px] outline-none focus:border-ring"
                value={String(s.fontWeight ?? 500)}
                onChange={(e) => commitProp({ fontWeight: Number(e.target.value) }, 'Font weight')}
              >
                <option value="400">Regular</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="700">Bold</option>
              </select>
            </Row>
            <Row>
              <span className="w-3.5 text-center text-[10px] text-muted-foreground/70">≡</span>
              {(
                [
                  ['left', '⇤'],
                  ['center', '↔'],
                  ['right', '⇥'],
                ] as const
              ).map(([a, glyph]) => (
                <button
                  key={a}
                  onClick={() => commitProp({ align: a }, 'Align text')}
                  className={
                    'h-6 flex-1 rounded text-[11px] ' +
                    ((s.align ?? 'left') === a ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent')
                  }
                >
                  {glyph}
                </button>
              ))}
            </Row>
            <ColorField shapeId={s.id} field="color" label="Text color" value={s.color} />
          </Section>
        )}

        {s.type === 'image' && (
          <Section title="Image">
            <Row>
              <span className="text-[12px] text-foreground/80">Fit</span>
              <select
                className="h-6 flex-1 rounded-md border border-border bg-background/40 px-1 text-[12px] outline-none focus:border-ring"
                value={s.fit ?? 'cover'}
                onChange={(e) => commitProp({ fit: e.target.value as 'cover' | 'contain' }, 'Image fit')}
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
              </select>
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

        <Section title="Export">
          <ExportButtons />
        </Section>
      </aside>
    </TooltipProvider>
  )
}

function ExportButtons() {
  const btn =
    'h-6 flex-1 cursor-pointer whitespace-nowrap rounded-md border border-border text-[11px] font-medium text-foreground/85 hover:bg-accent hover:text-foreground'
  return (
    <>
      <Row>
        <Button variant="outline" size="sm" className={btn} onClick={() => void exportSelectionPNG(2)}>
          PNG
        </Button>
        <Button variant="outline" size="sm" className={btn} onClick={() => void exportSelectionRaster('jpeg', 2)}>
          JPG
        </Button>
        <Button variant="outline" size="sm" className={btn} onClick={() => void exportSelectionRaster('webp', 2)}>
          WEBP
        </Button>
        <Button variant="outline" size="sm" className={btn} onClick={() => void exportSelectionRaster('avif', 2)}>
          AVIF
        </Button>
      </Row>
      <Row>
        <Button variant="outline" size="sm" className={btn} onClick={() => void exportSelectionSVG()}>
          SVG
        </Button>
        <Button variant="outline" size="sm" className={btn} onClick={() => void exportSelectionEPS(false)}>
          EPS
        </Button>
        <Button variant="outline" size="sm" className={btn} onClick={() => void exportSelectionEPS(true)}>
          AI
        </Button>
      </Row>
      <p className="text-[10px] font-normal leading-snug text-muted-foreground/60">
        PNG/JPG/WEBP/AVIF render at 2×. EPS/AI are vectors (Illustrator-compatible).
      </p>
    </>
  )
}
