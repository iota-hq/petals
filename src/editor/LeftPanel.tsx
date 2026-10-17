import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, Circle, Eye, EyeOff, Frame, Image as ImageIcon, Lock, LockOpen, Minus, PanelLeft, Plus, Square, SquareDashed, Type } from 'lucide-react'
import type { Shape, ShapeType } from '@/model/types'
import { childrenSorted, subtreeIds, topOrderFor, ORDER_STEP } from '@/model/geometry'
import { useDoc } from '@/store/docStore'
import { useUi } from '@/store/uiStore'
import { useProjects } from '@/store/projectsStore'
import { setProps } from './commands'
import { go } from '@/App'
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

/**
 * Flatten the tree for display: children sorted by descending z-order, frames expanded.
 * Shapes whose parent frame went missing are surfaced at the root level (defensive).
 */
function flatten(out: Row[], nodes: Record<string, Shape>) {
  const walk = (parentId: string | null, depth: number) => {
    const kids = (childrenSorted(nodes).get(parentId) ?? []).slice().reverse()
    for (const s of kids) {
      out.push({ s, depth })
      if (s.type === 'frame') walk(s.id, depth + 1)
    }
  }
  walk(null, 0)
  for (const s of Object.values(nodes)) {
    if (s.parentId === null || nodes[s.parentId]) continue
    out.push({ s, depth: 0 })
    for (const d of Object.values(nodes)) {
      if (d.parentId === s.id) out.push({ s: d, depth: 1 })
    }
  }
}

export function LeftPanel({ projectId }: { projectId: string }) {
  const nodes = useDoc((s) => s.nodes)
  const selection = useUi((s) => s.selection)
  const editingText = useUi((s) => s.editingText)
  const projectName = useProjects((s) => s.projects.find((p) => p.id === projectId)?.name ?? 'Untitled')
  const [renaming, setRenaming] = useState(false)
  const renameRequest = useUi((s) => s.renameRequest)

  // context-menu "Rename": open the selected layer's inline rename
  useEffect(() => {
    if (renameRequest) {
      setEditing(renameRequest)
      useUi.getState().setRenameRequest(null)
    }
  }, [renameRequest])

  const [drag, setDrag] = useState<{ id: string } | null>(null)
  const [hover, setHover] = useState<{ id: string; zone: 'above' | 'below' | 'in' } | null>(null)
  const [editing, setEditing] = useState<string | null>(null)

  const dragRef = useRef(drag)
  dragRef.current = drag
  const hoverRef = useRef(hover)
  hoverRef.current = hover

  const rows: Row[] = []
  flatten(rows, nodes)

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

  const TypeIcon = ({ t }: { t: ShapeType }) => {
    const I = typeIcon[t]
    return <I size={12} className="shrink-0 text-muted-foreground" />
  }

  return (
    <TooltipProvider>
      <aside className="flex min-h-0 w-60 shrink-0 flex-col border-r border-border bg-[#1c1c1c] max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:shadow-2xl">
        {/* file header: back · project name · panel toggle */}
        <div className="flex h-10 shrink-0 items-center gap-0.5 border-b border-border px-2">
          <Hint label="Back to projects">
            <button
              className="group flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={() => go('/projects')}
            >
              <ChevronLeft size={14} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
            </button>
          </Hint>
          {renaming ? (
            <input
              autoFocus
              defaultValue={projectName}
              onBlur={(e) => {
                const v = e.target.value.trim()
                if (v && v !== projectName) useProjects.getState().rename(projectId, v)
                setRenaming(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') setRenaming(false)
              }}
              className="min-w-0 flex-1 rounded border border-input bg-transparent px-1.5 py-0.5 text-[13px] font-medium outline-none focus:border-ring"
            />
          ) : (
            <button
              className="min-w-0 flex-1 cursor-pointer truncate rounded-md px-1.5 py-0.5 text-left text-[13px] font-medium hover:bg-accent"
              onClick={() => setRenaming(true)}
            >
              {projectName}
            </button>
          )}
          <Hint label="Hide layers panel">
            <button
              className="flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={() => useUi.getState().togglePanel('left')}
            >
              <PanelLeft size={14} />
            </button>
          </Hint>
        </div>

        {/* Pages */}
        <section className="border-b border-border px-3.5 pb-2 pt-3">
          <div className="mb-2 flex min-h-6 items-center justify-between gap-1">
            <span className="text-[13px] font-semibold tracking-[0.01em] text-foreground/90">Pages</span>
            <Hint label="More pages soon">
              <button className="cursor-pointer text-muted-foreground disabled:cursor-default disabled:opacity-40" disabled>
                <Plus size={13} />
              </button>
            </Hint>
          </div>
          <div className="flex h-7 items-center gap-2 rounded-md bg-[#2b2b2b] px-2 text-[12px] font-medium text-foreground/90 ring-1 ring-inset ring-primary/40">Page 1</div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col pt-3">
          <div className="mb-2 flex min-h-6 shrink-0 items-center justify-between pl-3.5 pr-3.5">
            <span className="text-[13px] font-semibold tracking-[0.01em] text-foreground/90">Layers</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pb-3 scrollbar-thin" style={drag ? { userSelect: 'none' } : undefined}>
          {rows.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
              <SquareDashed size={22} className="text-muted-foreground/40" />
              <span className="text-[11px] text-muted-foreground/50">No layers yet</span>
            </div>
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
                  'group mx-1.5 mb-0.5 flex h-6.5 items-center gap-2 rounded-md pr-0.5 select-none ' +
                  (selected ? 'bg-primary/15' : '') +
                  (hovered && hover?.zone === 'in' ? ' ring-1 ring-inset ring-primary bg-accent' : '') +
                  (drag?.id === s.id ? ' opacity-50' : ' hover:bg-accent/60')
                }
                style={{
                  paddingLeft: 6 + depth * 14,
                  ...(hovered && hover?.zone === 'above'
                    ? { boxShadow: 'inset 0 2px 0 0 var(--primary)' }
                    : hovered && hover?.zone === 'below'
                      ? { boxShadow: 'inset 0 -2px 0 0 var(--primary)' }
                      : {}),
                }}
              >
                <TypeIcon t={s.type} />
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
                    className="min-w-0 flex-1 rounded bg-[#2b2b2b] text-[12px] outline-none px-0.5"
                  />
                ) : (
                  <span className={'min-w-0 flex-1 truncate text-[12px] ' + (s.visible ? 'text-foreground' : 'text-muted-foreground/50 italic')}>{s.name}</span>
                )}
                <button
                  className={'shrink-0 ' + (s.locked || selected || !s.visible ? 'opacity-70' : 'opacity-0 group-hover:opacity-60 hover:opacity-100')}
                  onClick={(e) => {
                    e.stopPropagation()
                    setProps([s.id], { visible: !s.visible }, s.visible ? 'Hide' : 'Show')
                  }}
                >
                  {s.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                </button>
                <button
                  className={'shrink-0 ' + (s.locked || selected ? 'opacity-70' : 'opacity-0 group-hover:opacity-60 hover:opacity-100')}
                  onClick={(e) => {
                    e.stopPropagation()
                    setProps([s.id], { locked: !s.locked }, s.locked ? 'Unlock' : 'Lock')
                  }}
                >
                  {s.locked ? <Lock size={11} /> : <LockOpen size={11} />}
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
            <p className="mt-2 text-center text-[11px] text-muted-foreground/60" style={{ pointerEvents: 'none' }}>
              Drop here to send to page background
            </p>
          )}
          </div>
        </section>
      </aside>
    </TooltipProvider>
  )
}
