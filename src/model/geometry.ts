import type { Shape } from './types'

export type { Shape }

export interface Vec {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export const ORDER_STEP = 1024

/** SVG path for a rounded rect with per-corner radii (arcs, y-down space). */
export function roundedRectPath(b: Rect, corners: [number, number, number, number]): string {
  const [tl, tr, br, bl] = corners.map((c) => Math.max(0, Math.min(c, Math.min(b.w, b.h) / 2)))
  const x2 = b.x + b.w
  const y2 = b.y + b.h
  if (tl === tr && tr === br && br === bl) {
    if (!tl) return `M${b.x} ${b.y}H${x2}V${y2}H${b.x}Z`
    const r = tl
    return `M${b.x + r} ${b.y}H${x2 - r}A${r} ${r} 0 0 1 ${x2} ${b.y + r}V${y2 - r}A${r} ${r} 0 0 1 ${x2 - r} ${y2}H${b.x + r}A${r} ${r} 0 0 1 ${b.x} ${y2 - r}V${b.y + r}A${r} ${r} 0 0 1 ${b.x + r} ${b.y}Z`
  }
  return [
    `M${b.x + tl} ${b.y}`,
    `H${x2 - tr}`,
    tr ? `A${tr} ${tr} 0 0 1 ${x2} ${b.y + tr}` : `L${x2} ${b.y}`,
    `V${y2 - br}`,
    br ? `A${br} ${br} 0 0 1 ${x2 - br} ${y2}` : `L${x2} ${y2}`,
    `H${b.x + bl}`,
    bl ? `A${bl} ${bl} 0 0 1 ${b.x} ${y2 - bl}` : `L${b.x} ${y2}`,
    `V${b.y + tl}`,
    tl ? `A${tl} ${tl} 0 0 1 ${b.x + tl} ${b.y}` : `L${b.x} ${b.y}`,
    'Z',
  ].join('')
}

/* ---------- geometry (no rotation in v1: rotation is stored, not applied) ---------- */

export function rectIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export function rectContains(a: Rect, b: Rect): boolean {
  return b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w && b.y + b.h <= a.y + a.h
}

export function normRect(a: Vec, b: Vec): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  }
}

/** Line endpoints in parent space (with safe defaults). */
export function lineEnds(s: Shape): { x1: number; y1: number; x2: number; y2: number } {
  return { x1: s.x1 ?? 0, y1: s.y1 ?? 0, x2: s.x2 ?? 0, y2: s.y2 ?? 0 }
}

export function lineBox(s: Shape): Rect {
  const e = lineEnds(s)
  return {
    x: Math.min(e.x1, e.x2),
    y: Math.min(e.y1, e.y2),
    w: Math.abs(e.x2 - e.x1) || 1,
    h: Math.abs(e.y2 - e.y1) || 1,
  }
}

export function boxOf(s: Shape): Rect {
  if (s.type === 'line') return lineBox(s)
  return { x: s.x, y: s.y, w: s.w, h: s.h }
}

/**
 * Summed offset of the ancestor chain for a node whose parent is `parentId`.
 * Page pos of a nested shape = parentOffset + local (x,y).
 * Frame margins count in: children coordinates are relative to the frame's
 * content box, whose origin is offset by margin.l / margin.t.
 */
export function offsetForParent(nodes: Record<string, Shape>, parentId: string | null): Vec {
  let x = 0
  let y = 0
  let cur = parentId ? nodes[parentId] : undefined
  let guard = 0
  while (cur && guard++ < 64) {
    x += cur.x + (cur.margin?.l ?? 0)
    y += cur.y + (cur.margin?.t ?? 0)
    cur = cur.parentId ? nodes[cur.parentId] : undefined
  }
  return { x, y }
}

/** Page-space AABB of a single shape (ignoring nesting clip). */
export function pageAABB(nodes: Record<string, Shape>, s: Shape): Rect {
  const off = offsetForParent(nodes, s.parentId)
  const b = boxOf(s)
  return { x: b.x + off.x, y: b.y + off.y, w: b.w, h: b.h }
}

export function boundsOfRects(rects: Rect[]): Rect | null {
  if (!rects.length) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const r of rects) {
    minX = Math.min(minX, r.x)
    minY = Math.min(minY, r.y)
    maxX = Math.max(maxX, r.x + r.w)
    maxY = Math.max(maxY, r.y + r.h)
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

/* ---------- hierarchy helpers ---------- */

/** Sibling groups keyed by parentId, each sorted ascending by order (paint back→front). */
export function childrenSorted(nodes: Record<string, Shape>): Map<string | null, Shape[]> {
  const map = new Map<string | null, Shape[]>()
  for (const s of Object.values(nodes)) {
    const arr = map.get(s.parentId)
    if (arr) arr.push(s)
    else map.set(s.parentId, [s])
  }
  for (const arr of map.values()) arr.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
  return map
}

/** All descendant ids (not including the given id). */
export function descendantsOf(nodes: Record<string, Shape>, id: string): Shape[] {
  const kids = childrenSorted(nodes)
  const out: Shape[] = []
  const walk = (pid: string) => {
    for (const c of kids.get(pid) ?? []) {
      out.push(c)
      walk(c.id)
    }
  }
  walk(id)
  return out
}

/** Full subtree closure including the root ids. */
export function subtreeIds(nodes: Record<string, Shape>, ids: string[]): Set<string> {
  const out = new Set<string>()
  for (const id of ids) {
    out.add(id)
    for (const d of descendantsOf(nodes, id)) out.add(d.id)
  }
  return out
}

/** Reduce a selection to top-most ancestors (drop ids whose ancestor is selected). */
export function selectionRoots(nodes: Record<string, Shape>, ids: string[]): string[] {
  const selected = new Set(ids)
  return ids.filter((id) => {
    let cur = nodes[id]
    let guard = 0
    while (cur && guard++ < 64) {
      cur = cur.parentId ? nodes[cur.parentId] : (undefined as unknown as Shape)
      if (cur && selected.has(cur.id)) return false
    }
    return true
  })
}

/** Largest sibling order in a group (children of parentId). */
export function topOrderFor(nodes: Record<string, Shape>, parentId: string | null): number {
  let max = -Infinity
  for (const s of Object.values(nodes)) {
    if (s.parentId === parentId && s.order > max) max = s.order
  }
  return max === -Infinity ? 0 : max
}

/** Deepest visible, unlocked frame whose page AABB contains point p (excluding `exclude` subtrees). */
export function adoptFrameAt(nodes: Record<string, Shape>, p: Vec, exclude?: Set<string>): Shape | null {
  const frames = Object.values(nodes).filter(
    (s) => s.type === 'frame' && s.visible && !s.locked && !exclude?.has(s.id),
  )
  let best: Shape | null = null
  let bestDepth = -1
  let bestOrder = -Infinity
  for (const f of frames) {
    const b = pageAABB(nodes, f)
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
      const depth = ancestorDepth(nodes, f.id)
      if (depth > bestDepth || (depth === bestDepth && f.order > bestOrder)) {
        best = f
        bestDepth = depth
        bestOrder = f.order
      }
    }
  }
  return best
}

function ancestorDepth(nodes: Record<string, Shape>, id: string): number {
  let d = 0
  let cur = nodes[id]
  let guard = 0
  while (cur && cur.parentId && guard++ < 64) {
    cur = nodes[cur.parentId]
    if (cur) d++
  }
  return d
}
