import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Circle, Square } from 'lucide-react'
import type { Shape } from '@/model/types'
import { useDoc, type Tx } from '@/store/docStore'
import { useUi } from '@/store/uiStore'
import { addImageFile, setProps } from './commands'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-border px-3 py-3">
      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

function NumField({ label, value, onCommit, disabled }: { label: string; value: number; onCommit: (v: number) => void; disabled?: boolean }) {
  const [editing, setEditing] = useState<string | null>(null)
  return (
    <label className="flex min-w-0 flex-1 items-center gap-1.5">
      <span className="w-3.5 shrink-0 text-center text-[11px] text-muted-foreground">{label}</span>
      <Input
        className="h-7 border-transparent bg-transparent px-1 hover:border-input focus-visible:bg-background"
        type="number"
        value={editing ?? (Number.isFinite(value) ? String(Math.round(value * 100) / 100) : '')}
        disabled={disabled}
        onFocus={() => setEditing(String(Math.round(value * 100) / 100))}
        onChange={(e) => setEditing(e.target.value)}
        onBlur={() => {
          if (editing !== null) {
            const v = parseFloat(editing)
            if (Number.isFinite(v) && v !== value) onCommit(v)
            setEditing(null)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
    </label>
  )
}

/** Color swatch + local popup picker; continuous changes fold into one undo entry on close. */
function ColorField({ shapeId, field, value, noneable }: { shapeId: string; field: 'fill' | 'stroke' | 'color'; value?: string; noneable?: boolean }) {
  const [open, setOpen] = useState(false)
  const [hex, setHex] = useState(value ?? 'ffffff')
  const txRef = useRef<Tx | null>(null)
  useEffect(() => {
    if (!open) setHex((value ?? '#ffffff').replace('#', ''))
  }, [value, open])

  const swatch = value ?? 'transparent'
  const hexSafe = hex.startsWith('#') ? hex : `#${hex}`

  const applyLive = (c: string) => {
    setHex(c)
    const doc = useDoc.getState()
    txRef.current ??= doc.beginTx(`Change ${field === 'color' ? 'text color' : field}`)
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

  return (
    <div className="relative flex items-center justify-between gap-2">
      <span className="text-[13px] text-foreground/80">{field === 'color' ? 'Text color' : field === 'stroke' ? 'Stroke' : 'Fill'}</span>
      <div className="flex items-center gap-1.5">
        {noneable && (
          <button
            className="text-[11px] text-muted-foreground hover:text-foreground"
            onClick={() => {
              txRef.current?.commit()
              txRef.current = null
              setProps([shapeId], { [field]: 'transparent' }, `Change ${field}`)
            }}
          >
            None
          </button>
        )}
        <button
          className="h-6 w-8 rounded border border-input ring-1 ring-inset ring-black/10"
          style={{ background: swatch }}
          onClick={() => setOpen((o) => !o)}
        />
        {open && (
          <div className="absolute right-0 top-0 z-30 mt-1 w-[190px] rounded-lg border border-border bg-popover p-2 shadow-xl">
            <HexColorPicker color={hexSafe} onChange={applyLive} />
            <div className="mt-2 flex items-center gap-2">
              <Input
                className="h-7 text-xs"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                onBlur={() => {
                  const v = hex.startsWith('#') ? hex : `#${hex}`
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) applyLive(v)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                }}
              />
              <Button size="sm" variant="subtle" className="h-7 shrink-0 px-2" onClick={close}>
                OK
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>
}

export function PropertiesPanel() {
  const selection = useUi((s) => s.selection)
  const nodes = useDoc((s) => s.nodes)
  const shapes = selection.map((id) => nodes[id]).filter(Boolean) as Shape[]

  if (!shapes.length) {
    return (
      <aside className="hidden w-60 shrink-0 flex-col border-l border-border bg-card lg:flex">
        <div className="px-3 py-4 text-xs text-muted-foreground/70">Nothing selected. Click a shape on the canvas, or drag one out with R / F / T.</div>
      </aside>
    )
  }

  if (shapes.length > 1) {
    return (
      <aside className="hidden w-60 shrink-0 flex-col border-l border-border bg-card lg:flex">
        <Section title="Selection">
          <p className="text-sm">{shapes.length} shapes selected</p>
          <p className="mt-1 text-xs text-muted-foreground">Drag to move · ⌘D duplicate · arrows nudge</p>
        </Section>
      </aside>
    )
  }

  const s = shapes[0]
  const commit = (patch: Parameters<typeof setProps>[1], label?: string) => setProps([s.id], patch, label)

  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-l border-border bg-card scrollbar-thin lg:flex">
      <Section title={s.type === 'frame' ? 'Frame' : s.type === 'rect' ? 'Rectangle' : s.type === 'ellipse' ? 'Ellipse' : s.type === 'line' ? 'Line' : s.type}>
        <Input
          className="h-7 text-[13px]"
          defaultValue={s.name}
          key={s.id}
          onBlur={(e) => {
            const v = e.target.value.trim()
            if (v && v !== s.name) commit({ name: v }, 'Rename')
            e.target.value = v || s.name
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
        />
      </Section>

      {s.type !== 'line' && (
        <Section title={s.type === 'frame' ? 'Position' : 'Position & size'}>
          <Row>
            <NumField label="X" value={s.x} onCommit={(v) => commit({ x: v }, 'Move')} />
            <NumField label="Y" value={s.y} onCommit={(v) => commit({ y: v }, 'Move')} />
          </Row>
          <div className="mt-1.5" />
          <Row>
            <NumField label="W" value={s.w} onCommit={(v) => commit({ w: Math.max(1, v) }, 'Resize')} />
            {s.type === 'text' ? (
              <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[11px] text-muted-foreground/60">H auto</span>
            ) : (
              <NumField label="H" value={s.h} onCommit={(v) => commit({ h: Math.max(1, v) }, 'Resize')} />
            )}
          </Row>
        </Section>
      )}

      {(s.type === 'rect' || s.type === 'ellipse' || s.type === 'text') && (
        <Section title="Appearance">
          <Row>
            <span className="flex-1 text-[13px] text-foreground/80">Opacity</span>
            <NumField label="%" value={Math.round(s.opacity * 100)} onCommit={(v) => commit({ opacity: Math.min(1, Math.max(0, v / 100)) }, 'Opacity')} />
          </Row>
        </Section>
      )}

      {(s.type === 'rect' || s.type === 'frame' || s.type === 'image') && (
        <Section title="Corner radius">
          <NumField label="R" value={s.radius ?? 0} onCommit={(v) => commit({ radius: Math.max(0, v) }, 'Radius')} />
        </Section>
      )}

      {(s.type === 'rect' || s.type === 'ellipse' || s.type === 'frame') && (
        <Section title="Fill">
          <ColorField shapeId={s.id} field="fill" value={s.fill} noneable />
          {s.type === 'frame' && (
            <label className="mt-2 flex items-center justify-between text-[13px] text-foreground/80">
              Clip content
              <input type="checkbox" checked={s.clip ?? false} onChange={(e) => commit({ clip: e.target.checked }, 'Clip')} className="accent-[var(--primary)]" />
            </label>
          )}
        </Section>
      )}

      {s.type === 'line' && (
        <Section title="Line">
          <ColorField shapeId={s.id} field="stroke" value={s.stroke} noneable />
          <div className="mt-2">
            <Row>
              <span className="flex-1 text-[13px] text-foreground/80">Width</span>
              <NumField label="px" value={s.strokeWidth ?? 2} onCommit={(v) => commit({ strokeWidth: Math.max(1, v) }, 'Stroke width')} />
            </Row>
          </div>
        </Section>
      )}

      {s.type === 'text' && (
        <Section title="Text">
          <Row>
            <span className="w-16 text-[13px] text-foreground/80">Size</span>
            <NumField label="px" value={s.fontSize ?? 24} onCommit={(v) => commit({ fontSize: Math.max(4, v) }, 'Font size')} />
          </Row>
          <div className="mt-1.5">
            <Row>
              <span className="w-16 text-[13px] text-foreground/80">Weight</span>
              <select
                className="h-7 flex-1 rounded-md border border-input bg-transparent px-1 text-[13px] outline-none focus:border-ring"
                value={String(s.fontWeight ?? 500)}
                onChange={(e) => commit({ fontWeight: Number(e.target.value) }, 'Font weight')}
              >
                <option value="400">Regular</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="700">Bold</option>
              </select>
            </Row>
          </div>
          <div className="mt-1.5">
            <Row>
              <span className="w-16 text-[13px] text-foreground/80">Align</span>
              <div className="flex flex-1 gap-1">
                {(
                  [
                    ['left', Square],
                    ['center', Circle],
                    ['right', Square],
                  ] as const
                ).map(([a, I]) => (
                  <button
                    key={a}
                    onClick={() => commit({ align: a }, 'Align')}
                    className={
                      'flex h-7 flex-1 items-center justify-center rounded-md border text-xs ' +
                      ((s.align ?? 'left') === a ? 'border-primary/60 bg-primary/15 text-primary' : 'border-border text-muted-foreground hover:bg-accent')
                    }
                  >
                    <I size={10} />
                  </button>
                ))}
              </div>
            </Row>
          </div>
          <div className="mt-2">
            <ColorField shapeId={s.id} field="color" value={s.color} />
          </div>
        </Section>
      )}

      {s.type === 'image' && (
        <Section title="Image">
          <Row>
            <span className="flex-1 text-[13px] text-foreground/80">Fit</span>
            <select
              className="h-7 flex-1 rounded-md border border-input bg-transparent px-1 text-[13px] outline-none focus:border-ring"
              value={s.fit ?? 'cover'}
              onChange={(e) => commit({ fit: e.target.value as 'cover' | 'contain' }, 'Image fit')}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </Row>
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => replaceImage(s)}>
            Replace image
          </Button>
        </Section>
      )}
    </aside>
  )
}

function replaceImage(s: Shape) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const f = input.files?.[0]
    if (f) void addImageFile(f, undefined)
  }
  input.click()
}
