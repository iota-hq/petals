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
  Frame as FrameIcon,
  Image as ImageIcon,
  Minus,
  Minus as LineIcon,
  Minus as RemoveIcon,
  PanelRight,
  Plus,
  Square,
  Type,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Filters, Gradient, GradientStop, Margin, ShadowStyle, Shape, ShapePatch, ShapeType } from '@/model/types'
import { pageAABB, selectionRoots, boundsOfRects } from '@/model/geometry'
import { useDoc, type Tx } from '@/store/docStore'
import { useUi, DEFAULT_CANVAS_BG, setZoomAroundCenter } from '@/store/uiStore'
import { addImageFile, alignSelection, canvasEl, nudge, setProps, type AlignEdge } from './commands'
import { exportSelectionPNG, exportSelectionSVG } from './exporters'
import { UndoRedoButtons } from './UndoRedoButtons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Hint, TooltipProvider } from '@/components/ui/tooltip'

/* ------------------------------ shells ------------------------------ */

const panelCls =
  'flex w-60 shrink-0 flex-col overflow-y-auto border-l border-border bg-card scrollbar-thin'

function Section({ title, children, onAdd, addSlot }: { title: string; children: ReactNode; onAdd?: () => void; addSlot?: ReactNode }) {
  return (
    <section className="border-b border-border px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-[11px] text-muted-foreground">{title}</h3>
        {addSlot ?? (onAdd ? (
          <Hint label="Add">
            <button onClick={onAdd} className="text-muted-foreground hover:text-foreground">
              <Plus size={13} />
            </button>
          </Hint>
        ) : null)}
      </div>
      <div className="space-y-1.5">{children}</div>
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
        className={'w-3.5 shrink-0 select-none text-center text-[10px] ' + (canScrub ? 'cursor-ew-resize text-muted-foreground' : 'text-muted-foreground/70')}
        onPointerDown={startScrub}
      >
        {label}
      </span>
      <Input
        type="text"
        inputMode="decimal"
        disabled={disabled}
        className="h-5 w-full min-w-0 border-0 bg-transparent px-0 text-[12px] shadow-none focus-visible:ring-0"
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
      className="h-5 w-7 shrink-0 rounded border border-border ring-1 ring-inset ring-black/20"
      style={{ background: color === 'transparent' ? 'repeating-conic-gradient(#52525b 0% 25%, #3f3f3f 0% 50%) 50% / 8px 8px' : color }}
    />
  )
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
  const [open, setOpen] = useState(false)
  const [hex, setHex] = useState('#ffffff')
  const txRef = useRef<Tx | null>(null)
  useEffect(() => {
    if (!open) setHex((value && value !== 'transparent' ? value : '#ffffff').toLowerCase())
  }, [value, open])

  const applyLive = (c: string) => {
    setHex(c)
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
  const close = () => {
    commitNow()
    setOpen(false)
  }
  const setNone = () => {
    commitNow()
    setProps([shapeId], { [field]: 'transparent' }, `Remove ${label.toLowerCase()}`)
  }

  const validHex = /^#[0-9a-fA-F]{6}$/.test(hex)

  return (
    <div className="relative flex items-center justify-between gap-2">
      <span className="text-[12px] text-foreground/80">{label}</span>
      <div className="flex items-center gap-1.5">
        {noneable && (
          <Hint label="Remove color">
            <button className="text-[11px] text-muted-foreground hover:text-foreground" onClick={setNone}>
              none
            </button>
          </Hint>
        )}
        <ColorButton
          color={value ?? 'transparent'}
          onClick={() => {
            commitNow()
            setOpen((o) => !o)
          }}
        />
        <span className="w-12 text-right font-mono text-[11px] uppercase text-muted-foreground">{(open ? hex : (value && value !== 'transparent' ? value : '')).replace('#', '')}</span>
        {open && (
          <div className="absolute right-0 top-full z-40 mt-1.5 w-[196px] rounded-xl border border-border bg-popover/95 p-2.5 shadow-2xl backdrop-blur">
            <HexColorPicker color={hex} onChange={applyLive} />
            <div className="mt-2 flex items-center gap-1.5">
              <Input
                className="h-6 flex-1 bg-background/40 font-mono text-[11px] uppercase"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                onBlur={() => {
                  const v = hex.startsWith('#') ? hex : `#${hex}`
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) applyLive(v.toLowerCase())
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                }}
              />
              <Button size="sm" variant="subtle" className="h-6 px-2 text-[11px]" onClick={close}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CanvasBgField() {
  const bg = useUi((s) => s.canvasBg)
  const [open, setOpen] = useState(false)
  const [hex, setHex] = useState(bg)
  useEffect(() => {
    if (!open) setHex(bg)
  }, [bg, open])

  const apply = (c: string) => {
    setHex(c)
    useUi.getState().setCanvasBg(c)
  }

  return (
    <div className="relative flex items-center justify-between gap-2">
      <span className="text-[12px] text-foreground/80">Background</span>
      <div className="flex items-center gap-1.5">
        <ColorButton color={bg} onClick={() => setOpen((o) => !o)} />
        <span className="w-12 text-right font-mono text-[11px] uppercase text-muted-foreground">{(open ? hex : bg).replace('#', '')}</span>
        {open && (
          <div className="absolute right-0 top-full z-40 mt-1.5 w-[196px] rounded-xl border border-border bg-popover/95 p-2.5 shadow-2xl backdrop-blur">
            <HexColorPicker color={hex} onChange={apply} />
            <div className="mt-2 flex items-center justify-between gap-1.5">
              <Input
                className="h-6 flex-1 bg-background/40 font-mono text-[11px] uppercase"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                onBlur={() => {
                  const v = hex.startsWith('#') ? hex : `#${hex}`
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) apply(v.toLowerCase())
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                }}
              />
              <Button size="sm" variant="subtle" className="h-6 px-2 text-[11px]" onClick={() => apply(DEFAULT_CANVAS_BG)}>
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------ styles: fill / shadow / filters / margin ------------------------------ */

/** Small swatch that opens a color popover; used by gradient stops and shadow colors. */
function SwatchButton({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false)
  const alphaBits = /^#[0-9a-fA-F]{8}$/.test(color) ? color.slice(7) : ''
  return (
    <div className="relative inline-flex items-center">
      <ColorButton color={color} onClick={() => setOpen((o) => !o)} />
      {open && (
        <div className="absolute right-0 top-full z-40 mt-1.5 w-[196px] rounded-xl border border-border bg-popover/95 p-2.5 shadow-2xl backdrop-blur">
          <HexColorPicker
            color={/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(color) ? color.slice(0, 7) : '#000000'}
            onChange={(c) => onChange(c + alphaBits)}
          />
          <div className="mt-2 flex items-center justify-between gap-1.5">
            <Input
              className="h-6 flex-1 bg-background/40 font-mono text-[11px] uppercase"
              defaultValue={color}
              onBlur={(e) => {
                let v = e.target.value.trim()
                if (!v.startsWith('#')) v = '#' + v
                if (/^#[0-9a-fA-F]{8}$/.test(v) || /^#[0-9a-fA-F]{6}$/.test(v)) onChange(v.toLowerCase())
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            />
            <Button size="sm" variant="subtle" className="h-6 px-2 text-[11px]" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const GRADIENT_STOP: GradientStop = { color: '#000000', alpha: 1, pos: 100 }

/** Fill editor: solid color or linear/radial gradient with two stops. */
function FillField({ s }: { s: Shape }) {
  const g = typeof s.fill === 'object' && s.fill ? (s.fill as Gradient) : null
  const solid = typeof s.fill === 'string' && s.fill !== 'transparent' ? s.fill : undefined

  const setFill = (v: Shape['fill'], label: string) => setProps([s.id], { fill: v === undefined ? 'transparent' : v }, label)

  const setStop = (i: 0 | 1, patch: Partial<GradientStop>) => {
    if (!g) return
    const stops = g.stops.map((st, j) => (j === i ? { ...st, ...patch } : st))
    setProps([s.id], { fill: { ...g, stops } }, 'Gradient stop')
  }

  const startGradient = (type: 'linear' | 'radial') => {
    const base = solid ?? '#f472b6'
    setFill(
      {
        type,
        angle: g?.angle ?? 90,
        stops: [
          { color: base, alpha: 1, pos: 0 },
          { color: '#ffffff', alpha: 1, pos: 100 },
        ],
      },
      'Gradient fill',
    )
  }

  const mode: 'solid' | 'linear' | 'radial' = g ? g.type : 'solid'

  return (
    <>
      <Row>
        {(
          [
            ['solid', 'Solid'],
            ['linear', 'Linear'],
            ['radial', 'Radial'],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            onClick={() => (m !== 'solid' ? startGradient(m) : g ? setFill(undefined, 'Solid fill') : undefined)}
            className={
              'flex-1 rounded-md px-1 py-0.5 text-[11px] ' +
              (mode === m ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-accent')
            }
          >
            {label}
          </button>
        ))}
      </Row>
      {mode === 'solid' ? (
        <ColorField shapeId={s.id} field="fill" label="Fill" value={solid} noneable />
      ) : (
        <>
          {[0, 1].map((i) => {
            const st = g!.stops[i] ?? GRADIENT_STOP
            return (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-3 text-center text-[10px] text-muted-foreground">{i === 0 ? 'A' : 'B'}</span>
                <SwatchButton color={st.color} onChange={(c) => setStop(i as 0 | 1, { color: c })} />
                <NumField
                  label="%"
                  scale={100}
                  min={0}
                  max={1}
                  step={0.01}
                  value={st.alpha}
                  onCommit={(v) => setStop(i as 0 | 1, { alpha: v })}
                />
              </div>
            )
          })}
          {mode === 'linear' && (
            <NumField
              label="°"
              min={0}
              max={360}
              value={g!.angle}
              onCommit={(v) => setProps([s.id], { fill: { ...g!, angle: Math.min(360, Math.max(0, v)) } }, 'Gradient angle')}
            />
          )}
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
    <Section title={title} onAdd={sh ? undefined : () => setProps([s.id], { [field]: SHADOW_DEFAULT } as ShapePatch, 'Add shadow')}>
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
              label="B"
              min={0}
              value={sh.blur}
              onLive={(v) => setFLive({ blur: Math.max(0, v) })}
              onEnd={end}
              onCommit={(v) => setF({ blur: Math.max(0, v) }, 'Shadow blur')}
            />
          </Row>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-foreground/80">Color</span>
            <div className="flex items-center gap-1.5">
              <SwatchButton color={sh.color} onChange={(c) => setF({ color: c }, 'Shadow color')} />
              <Hint label="Remove shadow">
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setProps([s.id], { [field]: undefined } as ShapePatch, 'Remove shadow')}
                >
                  <RemoveIcon size={13} />
                </button>
              </Hint>
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

/** "+" menu listing the available filters, like the Figma filters popover. */
function FilterAddMenu({ s }: { s: Shape }) {
  const [open, setOpen] = useState(false)
  const add = (k: (typeof FILTER_KINDS)[number]) => {
    setProps([s.id], { filters: { ...(s.filters ?? {}), [k.key]: k.def } }, `Add ${k.label.toLowerCase()}`)
    setOpen(false)
  }
  return (
    <div className="relative">
      <Hint label="Add filter">
        <button onClick={() => setOpen((o) => !o)} className="text-muted-foreground hover:text-foreground">
          <Plus size={13} />
        </button>
      </Hint>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-[150px] rounded-xl border border-border bg-popover/95 py-1 shadow-2xl backdrop-blur">
          {FILTER_KINDS.map((k) => (
            <button
              key={k.key}
              onClick={() => add(k)}
              className="block w-full px-2.5 py-1 text-left text-[12px] text-foreground/90 hover:bg-accent"
            >
              {k.label}
            </button>
          ))}
          <div className="mx-2 my-1 h-px bg-border" />
          {FILTER_KINDS.map((k) => (
            <button
              key={'b' + k.key}
              disabled
              className="block w-full px-2.5 py-1 text-left text-[12px] text-muted-foreground/40"
            >
              {`Backdrop ${k.label.toLowerCase()}`}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function FiltersSection({ s }: { s: Shape }) {
  const f = s.filters
  const { live, end } = useLiveTx()
  const setF = (k: keyof Filters, v: number) => setProps([s.id], { filters: { ...f, [k]: v } }, 'Filter')
  return (
    <Section title="Filters" addSlot={<FilterAddMenu s={s} />}>
      {f &&
        FILTER_KINDS.filter((k) => f[k.key] != null).map((k) => (
          <div key={k.key} className="flex items-center gap-1.5">
            <span className="min-w-0 flex-1 truncate text-[12px] text-foreground/80">{k.label}</span>
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
                className="text-muted-foreground hover:text-foreground"
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
            className="h-6 border-0 bg-transparent px-1 text-[12px] shadow-none focus-visible:bg-background/40 focus-visible:ring-0"
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
          <span className="text-[12px] font-medium">{meta.label}</span>
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
              <NumField
                label="R"
                min={0}
                value={s.radius ?? 0}
                onLive={(v) => live(s.id, { radius: Math.max(0, v) }, 'Corner radius')}
                onEnd={end}
                onCommit={(v) => commitProp({ radius: Math.max(0, v) }, 'Corner radius')}
              />
              {s.type === 'frame' && (
                <label className="flex flex-1 items-center justify-end gap-1.5 text-[12px] text-foreground/80">
                  Clip
                  <input
                    type="checkbox"
                    checked={s.clip ?? false}
                    onChange={(e) => commitProp({ clip: e.target.checked }, 'Clip')}
                    className="size-3.5 accent-[var(--primary)]"
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

        {(s.type === 'rect' || s.type === 'ellipse' || s.type === 'frame') && <MarginSection s={s} />}

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
  return (
    <Row>
      <Button variant="outline" size="sm" className="h-6 flex-1 text-[11px]" onClick={() => void exportSelectionPNG(2)}>
        PNG 2×
      </Button>
      <Button variant="outline" size="sm" className="h-6 flex-1 text-[11px]" onClick={() => exportSelectionSVG()}>
        SVG
      </Button>
    </Row>
  )
}
