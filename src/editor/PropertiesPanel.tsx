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
  Minus as LineIcon,
  PanelRight,
  Square,
  Type,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Shape, ShapePatch, ShapeType } from '@/model/types'
import { pageAABB, selectionRoots, boundsOfRects } from '@/model/geometry'
import { useDoc, type Tx } from '@/store/docStore'
import { useUi, DEFAULT_CANVAS_BG } from '@/store/uiStore'
import { addImageFile, alignSelection, nudge, setProps, type AlignEdge } from './commands'
import { exportSelectionPNG, exportSelectionSVG } from './exporters'
import { UndoRedoButtons } from './UndoRedoButtons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Hint, TooltipProvider } from '@/components/ui/tooltip'

/* ------------------------------ shells ------------------------------ */

const panelCls =
  'flex w-60 shrink-0 flex-col overflow-y-auto border-l border-border bg-card scrollbar-thin'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-border px-3 py-2.5">
      <h3 className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">{title}</h3>
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

/* ------------------------------ alignment ------------------------------ */

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

/** Right-panel header: undo/redo + collapse toggle (the top bar is gone; sidebars carry everything). */
function PanelTop() {
  return (
    <div className="flex h-10 shrink-0 items-center gap-0.5 border-b border-border px-2">
      <UndoRedoButtons />
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
          <h3 className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80">Page</h3>
        </div>
        <Section title="Canvas">
          <CanvasBgField />
        </Section>
        <div className="px-3 py-4 text-[11px] leading-relaxed text-muted-foreground/60">
          Nothing selected. Press <kbd className="rounded border border-border bg-accent/60 px-1">R</kbd> and drag on
          the canvas to draw, or click a shape to inspect it.
        </div>
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
            <Section title="Position">
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
        </Section>

        {(s.type === 'rect' || s.type === 'ellipse' || s.type === 'frame') && (
          <Section title="Fill">
            <ColorField shapeId={s.id} field="fill" label="Fill" value={s.fill} noneable />
          </Section>
        )}

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
