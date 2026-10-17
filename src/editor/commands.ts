import { nanoid } from 'nanoid'
import type { DragTool, Shape, ShapeType, ShapePatch } from '@/model/types'
import { createShape } from '@/model/defaults'
import {
  adoptFrameAt,
  boundsOfRects,
  lineBox,
  lineEnds,
  normRect,
  offsetForParent,
  pageAABB,
  rectIntersect,
  selectionRoots,
  topOrderFor,
  type Rect,
  type Vec,
} from '@/model/geometry'
import { useDoc, type Tx } from '@/store/docStore'
import { MIN_ZOOM, useUi, setZoomAroundCenter, type Handle } from '@/store/uiStore'
import { canvasEl, pageFromClient } from './view'

export { canvasEl, pageFromClient }

const shapeNames: Record<ShapeType, string> = {
  frame: 'Frame',
  rect: 'Rectangle',
  ellipse: 'Ellipse',
  line: 'Line',
  text: 'Text',
  image: 'Image',
}

function uniqueName(nodes: Record<string, Shape>, t: ShapeType): string {
  const base = shapeNames[t]
  let n = 0
  for (const s of Object.values(nodes)) if (s.name.startsWith(base)) n++
  return n === 0 ? base : `${base} ${n + 1}`
}

function toLocal(nodes: Record<string, Shape>, parentId: string | null, page: Vec): Vec {
  const off = offsetForParent(nodes, parentId)
  return { x: page.x - off.x, y: page.y - off.y }
}

/* ============================== creation ============================== */

export function addShapeAt(tool: DragTool, rectPage: Rect, nameOverride?: string): string {
  const doc = useDoc.getState()
  const nodes = doc.nodes
  const r = rectPage
  const center = { x: r.x + r.w / 2, y: r.y + r.h / 2 }
  const parent = adoptFrameAt(nodes, center)
  const parentId = parent?.id ?? null
  const local = toLocal(nodes, parentId, { x: r.x, y: r.y })
  const name = nameOverride ?? uniqueName(nodes, tool)
  const shape =
    tool === 'line'
      ? createShape({
          type: 'line',
          name,
          parentId,
          order: topOrderFor(nodes, parentId) + 1024,
          x1: local.x,
          y1: local.y,
          x2: local.x + r.w,
          y2: local.y + r.h,
          w: 0,
          h: 0,
        })
      : createShape({
          type: tool,
          name,
          parentId,
          order: topOrderFor(nodes, parentId) + 1024,
          x: local.x,
          y: local.y,
          w: r.w,
          h: r.h,
        })
  doc.insertShapes([shape], `Add ${nameOverride ?? shapeNames[tool]}`)
  useUi.setState({ selection: [shape.id], tool: 'select', gesture: null })
  return shape.id
}

export function commitCreate(tool: DragTool, start: Vec, end: Vec) {
  const r = normRect(start, end)
  if (r.w < 2 && r.h < 2) {
    // click = default size centered on the pointer
    if (tool === 'frame') { r.x = start.x - 200; r.y = start.y - 150; r.w = 400; r.h = 300 }
    else if (tool === 'line') { r.x = start.x - 80; r.y = start.y; r.w = 160; r.h = 0 }
    else { r.x = start.x - 50; r.y = start.y - 50; r.w = 100; r.h = 100 }
  }
  addShapeAt(tool, r)
}

/** Frame preset sizes offered in the toolbar menu. */
export const FRAME_PRESETS = [
  { name: 'Phone', w: 390, h: 844 },
  { name: 'Phone landscape', w: 844, h: 390 },
  { name: 'Tablet', w: 768, h: 1024 },
  { name: 'Laptop', w: 1280, h: 800 },
  { name: 'Desktop', w: 1440, h: 900 },
  { name: 'Square', w: 512, h: 512 },
] as const

/** Insert a preset frame centered in the middle of the visible viewport. */
export function addFramePreset(name: string, w: number, h: number) {
  const el = canvasEl.current
  if (!el) return
  const rect = el.getBoundingClientRect()
  const center = pageFromClient({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
  const suffix = uniqueName(useDoc.getState().nodes, 'frame')
  addShapeAt('frame', { x: center.x - w / 2, y: center.y - h / 2, w, h }, name === 'Frame' ? suffix : suffix === 'Frame' ? name : `${name} · ${suffix.replace('Frame ', '')}`)
}

/* ============================== alignment ============================== */

export type AlignEdge = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom'

/**
 * Align the selection inside its containing frame (shared parent) —
 * or inside the visible page area when the selection sits on the page.
 */
export function alignSelection(edge: AlignEdge) {
  const doc = useDoc.getState()
  const nodes = doc.nodes
  const roots = selectionRoots(nodes, useUi.getState().selection)
  if (!roots.length) return
  const parentId = nodes[roots[0]].parentId
  let bounds: Rect | null = null
  if (parentId && nodes[parentId] && roots.every((id) => nodes[id].parentId === parentId)) {
    bounds = pageAABB(nodes, nodes[parentId])
  } else {
    const el = canvasEl.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cam = useUi.getState().camera
    bounds = { x: -cam.x / cam.zoom, y: -cam.y / cam.zoom, w: rect.width / cam.zoom, h: rect.height / cam.zoom }
  }
  if (!bounds) return
  const boxes = roots.map((id) => ({ id, b: pageAABB(nodes, nodes[id]) }))
  const all = boundsOfRects(boxes.map((x) => x.b))
  if (!all) return
  let dx = 0
  let dy = 0
  if (edge === 'left') dx = bounds.x - all.x
  else if (edge === 'hcenter') dx = bounds.x + bounds.w / 2 - all.x - all.w / 2
  else if (edge === 'right') dx = bounds.x + bounds.w - all.x - all.w
  else if (edge === 'top') dy = bounds.y - all.y
  else if (edge === 'vcenter') dy = bounds.y + bounds.h / 2 - all.y - all.h / 2
  else dy = bounds.y + bounds.h - all.y - all.h
  if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
  const tx = doc.beginTx('Align')
  for (const id of roots) tx.capture(id, { x: 0, y: 0, x1: 0, y1: 0, x2: 0, y2: 0 })
  doc.patchLive((n) => {
    for (const id of roots) {
      const s = n[id]
      if (!s) continue
      if (s.type === 'line') {
        s.x1 = (s.x1 ?? 0) + dx
        s.y1 = (s.y1 ?? 0) + dy
        s.x2 = (s.x2 ?? 0) + dx
        s.y2 = (s.y2 ?? 0) + dy
      } else {
        s.x += dx
        s.y += dy
      }
    }
  })
  tx.commit()
}

export function addTextAt(page: Vec): string {
  const doc = useDoc.getState()
  const nodes = doc.nodes
  const parent = adoptFrameAt(nodes, page)
  const parentId = parent?.id ?? null
  const local = toLocal(nodes, parentId, page)
  const shape = createShape({
    type: 'text',
    name: uniqueName(nodes, 'text'),
    parentId,
    order: topOrderFor(nodes, parentId) + 1024,
    x: local.x,
    y: local.y,
    text: '',
  })
  doc.insertShapes([shape], 'Add text')
  useUi.setState({ selection: [shape.id], tool: 'select', gesture: null, editingText: shape.id })
  return shape.id
}

/* ============================== images ============================== */

function downscaleImage(file: File): Promise<{ src: string; w: number; h: number } | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onerror = () => resolve(null)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => resolve(null)
      img.onload = () => {
        const MAX = 4096
        const scale = Math.min(1, MAX / img.naturalWidth, MAX / img.naturalHeight)
        if (scale < 1) {
          const c = document.createElement('canvas')
          c.width = Math.round(img.naturalWidth * scale)
          c.height = Math.round(img.naturalHeight * scale)
          const ctx = c.getContext('2d')
          if (!ctx) return resolve(null)
          ctx.drawImage(img, 0, 0, c.width, c.height)
          const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
          resolve({ src: c.toDataURL(type, 0.92), w: c.width, h: c.height })
        } else {
          resolve({ src: String(reader.result), w: img.naturalWidth, h: img.naturalHeight })
        }
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export async function addImageFile(file: File, at?: Vec) {
  const data = await downscaleImage(file)
  if (!data) return
  let point = at
  if (!point) {
    const el = canvasEl.current
    const cam = useUi.getState().camera
    if (el) {
      const rect = el.getBoundingClientRect()
      point = pageFromClient({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    } else point = { x: 0, y: 0 }
  }
  const disp = Math.min(1, 640 / Math.max(data.w, data.h))
  insertImageFragment(data.src, data.w * disp, data.h * disp, point)
}

/** Paste / drop helper: insert an already-loaded data URL at a page point (centered). */
export function insertImageFragment(src: string, w: number, h: number, at: Vec): string {
  const doc = useDoc.getState()
  const nodes = doc.nodes
  const parent = adoptFrameAt(nodes, at)
  const parentId = parent?.id ?? null
  const local = toLocal(nodes, parentId, at)
  const shape = createShape({
    type: 'image',
    name: uniqueName(nodes, 'image'),
    parentId,
    order: topOrderFor(nodes, parentId) + 1024,
    x: local.x - w / 2,
    y: local.y - h / 2,
    w,
    h,
    src,
  })
  doc.insertShapes([shape], 'Add image')
  useUi.setState({ selection: [shape.id], tool: 'select' })
  return shape.id
}

/* ============================== edit ops ============================== */

export function setProps(ids: string[], patch: ShapePatch, label = 'Change') {
  const doc = useDoc.getState()
  const tx = doc.beginTx(label)
  for (const id of ids) tx.capture(id, patch)
  doc.patchLive((n) => {
    for (const id of ids) {
      const s = n[id]
      if (s) Object.assign(s, patch)
    }
  })
  tx.commit()
}

export function commitTextEdit(id: string, text: string, autoH: number) {
  setProps([id], { text, h: Math.max(1, autoH) }, 'Edit text')
}

export function typeLive(id: string, text: string) {
  useDoc.getState().patchLive((n) => {
    const s = n[id]
    if (s) s.text = text
  })
}

/** Text auto-height: measured from DOM, applied without polluting undo entries. */
export function setIntrinsicHeight(id: string, h: number) {
  useDoc.getState().patchLive((n) => {
    const s = n[id]
    if (s && Math.abs(s.h - h) > 0.75) s.h = h
  })
}

export function deleteSelection() {
  const sel = selectionRoots(useDoc.getState().nodes, useUi.getState().selection)
  if (!sel.length) return
  useDoc.getState().deleteShapes(sel, 'Delete')
  useUi.setState({ selection: [], editingText: null })
}

export function duplicateSelection() {
  const doc = useDoc.getState()
  const roots = selectionRoots(doc.nodes, useUi.getState().selection)
  if (!roots.length) return
  const clones = doc.duplicateForDrag(roots, 12, 12)
  doc.commitCreated(clones, 'Duplicate')
  useUi.setState({ selection: clones })
}

export function nudge(dx: number, dy: number) {
  const doc = useDoc.getState()
  const roots = selectionRoots(doc.nodes, useUi.getState().selection)
  if (!roots.length) return
  const tx = doc.beginTx('Nudge')
  for (const id of roots) tx.capture(id, { x: 0, y: 0, x1: 0, y1: 0, x2: 0, y2: 0 })
  doc.patchLive((n) => {
    for (const id of roots) {
      const s = n[id]
      if (!s) continue
      if (s.type === 'line') {
        s.x1 = (s.x1 ?? 0) + dx
        s.y1 = (s.y1 ?? 0) + dy
        s.x2 = (s.x2 ?? 0) + dx
        s.y2 = (s.y2 ?? 0) + dy
      } else {
        s.x += dx
        s.y += dy
      }
    }
  })
  tx.commit()
}

export function undo() {
  const doc = useDoc.getState()
  if (!doc.canUndo()) return
  doc.undo()
  pruneSelection()
}

export function redo() {
  const doc = useDoc.getState()
  if (!doc.canRedo()) return
  doc.redo()
  pruneSelection()
}

export function pruneSelection() {
  const nodes = useDoc.getState().nodes
  useUi.getState().pruneSelection(new Set(Object.keys(nodes)))
}

export function selectAllTop(): string[] {
  const nodes = useDoc.getState().nodes
  const ids = Object.values(nodes).filter((s) => s.parentId === null && s.visible).map((s) => s.id)
  useUi.setState({ selection: ids })
  return ids
}

/* ============================== camera ============================== */

export function fitAll() {
  const nodes = useDoc.getState().nodes
  const el = canvasEl.current
  if (!el) return
  const rects = Object.values(nodes).map((s) => pageAABB(nodes, s))
  const b = boundsOfRects(rects)
  if (!b || (b.w <= 0 && b.h <= 0)) {
    useUi.setState({ camera: { x: 120, y: 90, zoom: 1 } })
    return
  }
  const pad = 96
  const cw = el.clientWidth
  const ch = el.clientHeight
  const zoom = Math.min(4, Math.max(MIN_ZOOM, Math.min(cw / (b.w + pad * 2), ch / (b.h + pad * 2))))
  useUi.setState({
    camera: { x: (cw - b.w * zoom) / 2 - b.x * zoom, y: (ch - b.h * zoom) / 2 - b.y * zoom, zoom },
  })
}

export function afterLoadCamera() {
  const nodes = useDoc.getState().nodes
  if (Object.keys(nodes).length) fitAll()
  else useUi.setState({ camera: { x: 140, y: 100, zoom: 1 } })
}

export function resetZoom100() {
  const el = canvasEl.current
  if (el) setZoomAroundCenter(1, el.getBoundingClientRect())
}

export function clampZoom(value: number): number {
  return Math.min(16, Math.max(MIN_ZOOM, value))
}

/* ============================== gesture finalize ============================== */

export function beginMove(rawIds: string[], page: Vec, dup: boolean): void {
  const doc = useDoc.getState()
  const ids = selectionRoots(doc.nodes, rawIds)
  if (!ids.length) return
  const start: Record<string, { x: number; y: number; x1?: number; y1?: number; x2?: number; y2?: number }> = {}
  const tx: Tx = doc.beginTx('Move')
  for (const id of ids) {
    const s = doc.nodes[id]
    if (!s) continue
    if (s.type === 'line') {
      const e = lineEnds(s)
      start[id] = { x: 0, y: 0, x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2 }
      tx.capture(id, { x: 0, y: 0, parentId: null, order: 0, x1: 0, y1: 0, x2: 0, y2: 0 })
    } else {
      start[id] = { x: s.x, y: s.y }
      tx.capture(id, { x: 0, y: 0, parentId: null, order: 0 })
    }
  }
  if (!ids.length) return
  useUi.setState({
    gesture: { kind: 'move', ids, start, pageStart: page, point: page, dup, dupClones: [], switched: false, tx },
  })
}

const MOVE_KEYS = { x: 0, y: 0 } as const
const LINE_KEYS = { x1: 0, y1: 0, x2: 0, y2: 0 } as const

/** Live move; handles crossing the alt-duplicate threshold. */
export function moveLive(page: Vec) {
  const ui = useUi.getState()
  const g = ui.gesture
  if (!g || g.kind !== 'move') return
  const doc = useDoc.getState()
  const dx = page.x - g.pageStart.x
  const dy = page.y - g.pageStart.y

  let ids = g.ids
  let start = g.start
  if (g.dup && !g.switched && Math.hypot(dx, dy) > 3) {
    const clones = doc.duplicateForDrag(g.ids, 0, 0)
    if (!clones.length) return
    const cloneStart: Record<string, { x: number; y: number; x1?: number; y1?: number; x2?: number; y2?: number }> = {}
    for (const id of clones) {
      const s = doc.nodes[id]
      if (!s) continue
      if (s.type === 'line') {
        const e = lineEnds(s)
        cloneStart[id] = { x: 0, y: 0, x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2 }
        g.tx.capture(id, LINE_KEYS)
      } else {
        cloneStart[id] = { x: s.x, y: s.y }
        g.tx.capture(id, MOVE_KEYS)
      }
    }
    ids = clones
    start = cloneStart
    useUi.setState({ selection: clones })
    useUi.setState({ gesture: { ...g, ids, start, switched: true, dupClones: clones } })
    return
  }

  doc.patchLive((n) => {
    for (const id of ids) {
      const s = n[id]
      if (!s) continue
      const st = start[id]
      if (!st) continue
      if (s.type === 'line') {
        s.x1 = (st.x1 ?? 0) + dx
        s.y1 = (st.y1 ?? 0) + dy
        s.x2 = (st.x2 ?? 0) + dx
        s.y2 = (st.y2 ?? 0) + dy
      } else {
        s.x = st.x + dx
        s.y = st.y + dy
      }
    }
  })
  // drop-target highlight for frame adoption
  const first = nodesFirst(ids)
  if (first) {
    const s = doc.nodes[first]
    if (s) {
      const off = offsetForParent(doc.nodes, s.parentId)
      const box = s.type === 'line' ? lineBox(s) : { x: s.x, y: s.y, w: s.w, h: s.h }
      const center = { x: off.x + box.x + box.w / 2, y: off.y + box.y + box.h / 2 }
      const target = adoptFrameAt(doc.nodes, center)
      useUi.getState().setDropTarget(target && target.id !== s.parentId ? target.id : null)
    }
  }
  useUi.setState({ gesture: { ...g, point: page } })
}

function nodesFirst(ids: string[]): string | null {
  return ids.length ? ids[0] : null
}

export function finishMove() {
  const ui = useUi.getState()
  const g = ui.gesture
  if (!g || g.kind !== 'move') return
  const doc = useDoc.getState()
  const nodes = doc.nodes

  // adopt into deepest frame containing each moved shape's center
  const dests = new Map<string, { parentId: string | null; order: number; x?: number; y?: number }>()
  for (const id of g.ids) {
    const s = nodes[id]
    if (!s) continue
    const off = offsetForParent(nodes, s.parentId)
    const box = s.type === 'line' ? lineBox(s) : { x: s.x, y: s.y, w: s.w, h: s.h }
    const center = { x: off.x + box.x + box.w / 2, y: off.y + box.y + box.h / 2 }
    const dest = adoptFrameAt(nodes, center)
    const destParent = dest?.id ?? null
    if (destParent !== s.parentId) {
      const newOff = offsetForParent(nodes, destParent)
      dests.set(id, {
        parentId: destParent,
        order: topOrderFor(nodes, destParent) + 1024,
        x: s.x + off.x - newOff.x,
        y: s.y + off.y - newOff.y,
      })
    }
  }
  if (dests.size) {
    doc.patchLive((n) => {
      for (const [id, d] of dests) {
        const s = n[id]
        if (!s) continue
        s.parentId = d.parentId
        s.order = d.order
        if (d.x !== undefined) s.x = d.x
        if (d.y !== undefined) s.y = d.y
      }
    })
  }

  if (g.dupClones.length) {
    // fold duplicate + move into one undo entry
    const created = g.dupClones
      .map((id) => nodes[id])
      .filter(Boolean)
      .map((s) => structuredClone(s))
    useUi.setState({ gesture: null, dropTarget: null, selection: g.ids })
    doc.commitEntry({ label: 'Duplicate', created, deleted: [], changed: g.tx.changedFor() })
  } else {
    useUi.setState({ gesture: null, dropTarget: null })
    g.tx.commit()
  }
}

export function startResize(id: string, handle: Handle, page: Vec, parentOff: Vec) {
  const doc = useDoc.getState()
  const s = doc.nodes[id]
  if (!s) return
  const tx = doc.beginTx('Resize')
  tx.capture(id, { x: 0, y: 0, w: 0, h: 0 })
  useUi.setState({
    gesture: {
      kind: 'resize',
      id,
      handle,
      parentOff,
      start: { x: s.x, y: s.y, w: s.w, h: s.h },
      point: page,
      shift: false,
      tx,
    },
  })
}

export function resizeLive(page: Vec, shift: boolean) {
  const ui = useUi.getState()
  const g = ui.gesture
  if (!g || g.kind !== 'resize') return
  const doc = useDoc.getState()
  const s = doc.nodes[g.id]
  if (!s) return
  const patch = computeResize(g.handle, g.start, { x: page.x - g.parentOff.x, y: page.y - g.parentOff.y }, shift, s.type === 'text')
  doc.patchLive((n) => {
    const t = n[g.id]
    if (t) Object.assign(t, patch)
  })
  useUi.setState({ gesture: { ...g, point: page, shift } })
}

const MINC = 1

export function computeResize(
  handle: string,
  start: Rect,
  p: Vec,
  shift: boolean,
  isText: boolean,
): ShapePatch {
  // anchor = the corner/edge opposite the dragged handle (fixed during drag)
  const anchorX = handle.includes('w') ? start.x + start.w : start.x
  const anchorY = handle.includes('n') ? start.y + start.h : start.y
  let nx = start.x
  let ny = start.y
  let nw = isText ? start.w : start.w
  let nh = start.h

  const freeW = handle.includes('e') || handle.includes('w') || handle.length === 2
  const freeH = handle.includes('n') || handle.includes('s') || handle.length === 2

  if (freeW) {
    if (handle.includes('w')) {
      nw = Math.max(MINC, anchorX - p.x)
      nx = Math.min(p.x, anchorX)
    } else {
      nw = Math.max(MINC, p.x - anchorX)
      nx = anchorX
    }
  }
  if (!isText && freeH && (handle.includes('n') || handle.includes('s'))) {
    if (handle.includes('n')) {
      nh = Math.max(MINC, anchorY - p.y)
      ny = Math.min(p.y, anchorY)
    } else {
      nh = Math.max(MINC, p.y - anchorY)
      ny = anchorY
    }
  }
  if (isText) {
    // text height is intrinsically measured — only width/x change
    return { x: nx, w: nw }
  }
  if (shift && handle.length === 2) {
    const ratio = start.h / Math.max(1, start.w)
    nh = nw * ratio
    ny = handle.includes('n') ? anchorY - nh : anchorY
  }
  return { x: nx, y: ny, w: nw, h: nh }
}

export function finishResize() {
  const ui = useUi.getState()
  const g = ui.gesture
  if (!g || g.kind !== 'resize') return
  useUi.setState({ gesture: null })
  g.tx.commit()
}

export function cancelGesture() {
  const ui = useUi.getState()
  const g = ui.gesture
  const doc = useDoc.getState()
  if (g) {
    if (g.kind === 'move') {
      doc.patchLive((n) => {
        for (const id of g.ids) {
          const s = n[id]
          const st = g.start[id]
          if (!s || !st) continue
          if (s.type === 'line') {
            s.x1 = st.x1 ?? 0
            s.y1 = st.y1 ?? 0
            s.x2 = st.x2 ?? 0
            s.y2 = st.y2 ?? 0
          } else {
            s.x = st.x
            s.y = st.y
          }
        }
      })
      if (g.dupClones.length) doc.removeLive(g.dupClones)
      if (g.dupClones.length) useUi.setState({ selection: g.ids.filter((id) => !g.dupClones.includes(id)) })
    } else if (g.kind === 'resize') {
      doc.patchLive((n) => {
        const s = n[g.id]
        if (s) Object.assign(s, { x: g.start.x, y: g.start.y, w: g.start.w, h: g.start.h })
      })
    } else if (g.kind === 'endpoint') {
      doc.patchLive((n) => {
        const s = n[g.id]
        if (s) Object.assign(s, { x1: g.start.x1, y1: g.start.y1, x2: g.start.x2, y2: g.start.y2 })
      })
    }
  }
  useUi.setState({ gesture: null, dropTarget: null })
}

export function startEndpoint(id: string, which: 1 | 2, page: Vec, parentOff: Vec) {
  const doc = useDoc.getState()
  const s = doc.nodes[id]
  if (!s) return
  const e = lineEnds(s)
  const tx = doc.beginTx('Edit line')
  tx.capture(id, LINE_KEYS)
  useUi.setState({
    gesture: { kind: 'endpoint', id, which, parentOff, start: { x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2 }, point: page, tx },
  })
}

export function endpointLive(page: Vec) {
  const ui = useUi.getState()
  const g = ui.gesture
  if (!g || g.kind !== 'endpoint') return
  const doc = useDoc.getState()
  const lx = page.x - g.parentOff.x
  const ly = page.y - g.parentOff.y
  doc.patchLive((n) => {
    const s = n[g.id]
    if (!s) return
    if (g.which === 1) {
      s.x1 = lx
      s.y1 = ly
    } else {
      s.x2 = lx
      s.y2 = ly
    }
  })
  useUi.setState({ gesture: { ...g, point: page } })
}

export function finishEndpoint() {
  const ui = useUi.getState()
  const g = ui.gesture
  if (!g || g.kind !== 'endpoint') return
  useUi.setState({ gesture: null })
  g.tx.commit()
}

export function finishMarquee(start: Vec, point: Vec, additive: boolean) {
  const r = normRect(start, point)
  const nodes = useDoc.getState().nodes
  const ids: string[] = []
  for (const s of Object.values(nodes)) {
    if (s.parentId === null && s.visible) {
      if (rectIntersect(r, pageAABB(nodes, s))) ids.push(s.id)
    }
  }
  const ui = useUi.getState()
  const sel = additive ? Array.from(new Set([...ui.selection, ...ids])) : ids
  useUi.setState({ selection: sel, gesture: null })
}

export function moveChildrenIds(id: string): string[] {
  const out: string[] = []
  const stack = [id]
  const nodes = useDoc.getState().nodes
  while (stack.length) {
    const cur = stack.pop()!
    for (const s of Object.values(nodes)) {
      if (s.parentId === cur) {
        out.push(s.id)
        stack.push(s.id)
      }
    }
  }
  return out
}
