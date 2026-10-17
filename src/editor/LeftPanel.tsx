import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Circle,
  Eye,
  EyeOff,
  Frame,
  Image as ImageIcon,
  Lock,
  LockOpen,
  Minus,
  Plus,
  Square,
  Type,
} from 'lucide-react'
import type { Shape, ShapeType } from '@/model/types'
import { childrenSorted, offsetForParent, subtreeIds, topOrderFor, ORDER_STEP } from '@/model/geometry'
import { useDoc } from '@/store/docStore'
import { useUi } from '@/store/uiStore'
import { setProps } from './commands'
import { Hint, TooltipProvider } from '@/components/ui/tooltip'

const typeIcon: Record<ShapeType, typeof Square> = {
  frame: Frame,
  rect: Square,
  ellipse: Circle,
  line: Minus,
  text: Type,
  image: ImageIcon,
}

interface Row {
  s: Shape
  depth: number
}

/** Flatten the tree for display: children sorted by descending z-order, frames expanded. */
function flatten(rows: Row[], nodes: Record<string, Shape>, parentId: string | null, depth: number) {
  const kids = (childrenSorted(nodes).get(parentId) ?? []).slice().reverse()
  for (const s of kids) {
    rows.push({ s, depth })
    if (s.type === 'frame') flatten(rows, nodes, s.id, depth + 1)
  }
}

export function LeftPanel() {  const nodes = useDoc((s) => s.nodes)
  const selection = useUi((s) => s.selection)
  const editingText = useUi((s) => s.editingText)

  const [drag, setDrag] = useState<{ id: string } | null>(null)
  const [hover, setHover] = useState<{ id: string; zone: 'above' | 'below' | 'in' } | null>(null)
  const [editing, setEditing] = useState<string | null>(null)

  const dragRef = useRef(drag)
  dragRef.current = drag
  const hoverRef = useRef(hover)
  hoverRef.current = hover

  const rows: Row[] = []
  flatten(rows, nodes, null, 0)
  const rootMin = Math.min(...Object.values(nodes).filter((s) => s.parentId === null).map((s) => s.order).filter((n) => Number.isFinite(n)))

  const startDrag = (e: React.PointerEvent, id: string) => {
    if ((e.target as HTMLElement).closest('button')) return
    if (editingText) return
    e.preventDefault()
    const startY = e.clientY
    let dragging = false
    const move = (ev: PointerEvent) => {
      if (!dragging && Math.abs(ev.clientY - startY) > 4) {
        dragging = true
        setDrag({ id })
      }
      if (!dragging) return
      const el = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('[data-layer-row]') as HTMLElement | null
      if (!el || !el.dataset.layerRow) {
        setHover(null)
        return
      }
      const tid = el.dataset.layerRow
      if (tid === id || subtreeIds(useDoc.getState().nodes, [id]).has(tid)) {
        setHover(null)
        return
      }
      const r = el.getBoundingClientRect()
      const y = (ev.clientY - r.top) / r.height
      const target = useDoc.getState().nodes[tid]
      const zone: 'above' | 'below' | 'in' =
        target && target.type === 'frame' ? (y < 0.25 ? 'above' : y > 0.75 ? 'below' : 'in') : y < 0.5 ? 'above' : 'below'
      setHover({ id: tid, zone })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      const h = hoverRef.current
      const d = dragRef.current
      setDrag(null)
      setHover(null)
      if (!d || !h || !dragging) return
      const doc = useDoc.getState()
      const target = doc.nodes[h.id]
      const dragged = doc.nodes[d.id]
      if (!target || !dragged) return
      let dest: { parentId: string | null; order: number } | null = null
      if (h.zone === 'in') dest = { parentId: target.id, order: topOrderFor(doc.nodes, target.id) + ORDER_STEP }
      else if (h.zone === 'above') dest = { parentId: target.parentId, order: target.order + ORDER_STEP / 2 }
      else {
        const group = Object.values(doc.nodes).filter((s) => s.parentId === target.parentId && s.id !== d.id)
        const min = group.length ? Math.min(...group.map((s) => s.order)) : 0
        dest = { parentId: target.parentId, order: target.order === min ? target.order - ORDER_STEP : (target.order + min) / 2 }
      }
      if (dest.parentId === dragged.parentId && Math.abs(dest.order - dragged.order) < 1) return
      doc.moveToLayer(d.id, dest, 'Reorder')
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const Icon = ({ t }: { t: ShapeType }) => {
    const I = typeIcon[t]
    return <I size={12} className="shrink-0 text-muted-foreground" />
  }

  return (
    <TooltipProvider>
      <aside className="flex min-h-0 w-60 shrink-0 flex-col border-r border-border bg-card">
        {/* Pages */}
        <div className="flex h-8 items-center justify-between px-3 pt-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pages</span>
          <Hint label="More pages soon">
            <button className="text-muted-foreground hover:text-foreground" disabled>
              <Plus size={13} />
            </button>
          </Hint>
        </div>
        <div className="px-2 pb-2">
          <div className="flex h-7 items-center gap-2 rounded-md bg-accent px-2 text-[13px]">Page 1</div>
        </div>

        <div className="px-3 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Layers</div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-3 scrollbar-thin" style={drag ? { userSelect: 'none' } : undefined}>
          {rows.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground/70">
              Nothing here yet — draw something on the canvas.
            </p>
          )}
          {rows.map(({ s, depth }) => {
            const selected = selection.includes(s.id)
            const hovered = hover?.id === s.id
            return (
              <div
                key={s.id}
                data-layer-row={s.id}
                onPointerDown={(e) => startDrag(e, s.id)}
                onClick={(e) => {
                  if (e.shiftKey) useUi.getState().toggleSelection(s.id)
                  else useUi.getState().setSelection([s.id])
                }}
                onDoubleClick={() => setEditing(s.id)}
                className={
                  'group mx-2 mb-0.5 flex h-7 items-center gap-2 rounded-md pr-1 text-[13px] select-none ' +
                  (selected ? 'bg-primary/20 text-primary' : 'text-foreground/90') +
                  (hovered && hover?.zone === 'in' ? ' ring-1 ring-primary bg-accent' : '') +
                  (drag?.id === s.id ? ' opacity-40' : ' hover:bg-accent/60')
                }
                style={{
                  paddingLeft: 6 + depth * 14,
                  ...(hovered && hover?.zone === 'above'
                    ? { boxShadow: 'inset 0 2px 0 0 #f472b6' }
                    : hovered && hover?.zone === 'below'
                      ? { boxShadow: 'inset 0 -2px 0 0 #f472b6' }
                      : {}),
                }}
              >
                <Icon t={s.type} />
                {editing === s.id ? (
                  <input
                    autoFocus
                    defaultValue={s.name}
                    onBlur={(e) => {
                      setProps([s.id], { name: e.target.value.trim() || s.name }, 'Rename')
                      setEditing(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      if (e.key === 'Escape') setEditing(null)
                    }}
                    className="min-w-0 flex-1 rounded bg-transparent text-[13px] outline-none"
                  />
                ) : (
                  <span className={'min-w-0 flex-1 truncate' + (s.visible ? '' : ' opacity-40')}>{s.name}</span>
                )}
                <button
                  className={cn('shrink-0', selected ? 'opacity-90' : 'opacity-0 group-hover:opacity-60 hover:opacity-100')}
                  onClick={(e) => {
                    e.stopPropagation()
                    setProps([s.id], { visible: !s.visible }, s.visible ? 'Hide' : 'Show')
                  }}
                >
                  {s.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button
                  className={cn('shrink-0', s.locked || selected ? 'opacity-90' : 'opacity-0 group-hover:opacity-60 hover:opacity-100')}
                  onClick={(e) => {
                    e.stopPropagation()
                    setProps([s.id], { locked: !s.locked }, s.locked ? 'Unlock' : 'Lock')
                  }}
                >
                  {s.locked ? <Lock size={12} /> : <LockOpen size={12} />}
                </button>
              </div>
            )
          })}
          {/* empty-area drop zone */}
          <div
            className="min-h-16 w-full"
            style={drag ? { pointerEvents: 'auto' } : { pointerEvents: 'none' }}
            onPointerOver={() => setHover(null)}
          />
          {drag && !hover && (
            <p
              className="mt-2 text-center text-[11px] text-muted-foreground/60"
              style={{ pointerEvents: 'none' }}
            >
              Drop here to send to page background
            </p>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )

  function cn(...xs: (string | false | undefined)[]) {
    return xs.filter(Boolean).join(' ')
  }
}

/** A small section wrapper used by panels. */
export function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-border px-3 py-3">
      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}
