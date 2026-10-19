import { create } from 'zustand'
import { produce } from 'immer'
import { nanoid } from 'nanoid'
import type { Shape, ShapePatch } from '@/model/types'
import { normalizeShape } from '@/model/defaults'
import { descendantsOf, subtreeIds } from '@/model/geometry'
import { useProjects } from './projectsStore'
import { useUi } from './uiStore'

export interface HistoryEntry {
  label: string
  created: Shape[]
  deleted: Shape[]
  changed: { id: string; before: ShapePatch; after: ShapePatch }[]
}

/**
 * A per-interaction transaction: captures "before" values for touched ids,
 * then folds them into ONE undo entry on commit.
 */
export interface Tx {
  label: string
  before: { [id: string]: ShapePatch }
  created: Set<string>
  capture: (id: string, patch: ShapePatch) => void
  markCreated: (id: string) => void
  commit: () => void
  /** Build the changed list without pushing (used to fold interactions into one entry). */
  changedFor: () => HistoryEntry['changed']
}

const clone = <T,>(v: T): T => structuredClone(v)

let saveTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const { docId, nodes, pages, activePage } = useDoc.getState()
    if (!docId) return
    try {
      localStorage.setItem(`petal.doc.v1.${docId}`, JSON.stringify({ v: 1, nodes, pages, activePage }))
    } catch {
      /* storage full — ignore */
    }
    useProjects.getState().stamp(docId)
  }, 400)
}

interface DocState {
  docId: string | null
  nodes: Record<string, Shape>
  /** Order-preserving list of document pages. */
  pages: PageMeta[]
  activePage: string
  past: HistoryEntry[]
  future: HistoryEntry[]
}

/** A document page: shapes reference it through Shape.pageId. */
export interface PageMeta {
  id: string
  name: string
}

interface DocActions {
  loadDoc: (projectId: string) => void
  applyMut: (fn: (nodes: Record<string, Shape>) => void) => void
  /** Live (non-undoable) patch used for gesture tracking; finalize with a tx commit. */
  patchLive: (fn: (nodes: Record<string, Shape>) => void) => void
  insertShapes: (shapes: Shape[], label: string) => void
  deleteShapes: (ids: string[], label: string) => void
  /** Change parent/order deltas (also converts local coords to keep page position). */
  moveToLayer: (id: string, dest: { parentId: string | null; order: number }, label: string) => void
  /** Real clones inserted without a history entry (used for alt-drag duplication). */
  duplicateForDrag: (ids: string[], dx: number, dy: number) => string[]
  removeLive: (ids: string[]) => void
  beginTx: (label: string) => Tx
  addPage: () => void
  renamePage: (id: string, name: string) => void
  removePage: (id: string) => void
  setActivePage: (id: string) => void
  commitEntry: (entry: HistoryEntry) => void
  commitCreated: (ids: string[], label: string) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
}

export type DocStore = DocState & DocActions

export const useDoc = create<DocStore>((set, get) => {
  const push = (entry: HistoryEntry) => {
    if (!entry.created.length && !entry.deleted.length && !entry.changed.length) return
    set(
      produce((s: DocState) => {
        s.past.push(entry)
        if (s.past.length > 100) s.past.shift()
        s.future = []
      }),
    )
    scheduleSave()
  }

  const applyMut = (fn: (nodes: Record<string, Shape>) => void) => {
    set(
      produce((s: DocState) => {
        fn(s.nodes)
        // keep every shape on a real page: fresh gestures, undo resurrections, etc.
        if (!s.pages.length) s.pages = [{ id: 'page1', name: 'Page 1' }]
        if (!s.pages.some((p) => p.id === s.activePage)) s.activePage = s.pages[0].id
        for (const node of Object.values(s.nodes)) {
          if (!node.pageId) node.pageId = s.activePage
          else if (!s.pages.some((p) => p.id === node.pageId)) node.pageId = s.pages[0].id
        }
        reflowFrames(s.nodes, s.activePage)
      }),
    )
    scheduleSave()
  }

  /** Dangling-parent guard after history edits. Runs inside produce — never writes frozen state. */
  /**
   * Frame auto-layout: positions every child of a flow frame into the frame's
   * margin box (padding) with the frame's gap and main/cross alignment.
   * Runs right after any mutation; keeps x/y in the normal (parent-local) space
   * so gestures, selection bounds and exports all see the laid-out geometry.
   * Runs inside produce — never writes frozen state.
   */
  const reflowFrames = (nodes: Record<string, Shape>, activePage: string) => {
    const flows = Object.values(nodes).filter((f) => f.type === 'frame' && f.layoutFlow && f.pageId === activePage)
    if (!flows.length) return
    // deepest first: a hug frame resizes itself, which its parent must account for
    const depth = (id: string): number => {
      let d = 0
      let n = nodes[id]
      while (n?.parentId) {
        d++
        n = nodes[n.parentId]
      }
      return d
    }
    flows.sort((a, b) => depth(b.id) - depth(a.id))
    for (const f of flows) {
      const kids = Object.values(nodes)
        .filter((k) => k.parentId === f.id && k.type !== 'line')
        .sort((a, b) => a.order - b.order)
      if (!kids.length) continue
      const m = f.margin ?? { t: 0, r: 0, b: 0, l: 0 }
      const g = Math.max(0, f.gap ?? 0)
      const main = f.layoutMain === 1 ? 1 : f.layoutMain === 2 ? 2 : 0
      const cross = f.layoutCross === 1 ? 1 : f.layoutCross === 2 ? 2 : 0
      const hug = f.sizingMain === 'hug'
      // child x/y are relative to the frame's margin-inset origin (offsetForParent),
      // so the layout cursor runs 0..(inner) inside that box
      const innerW = Math.max(0, f.w - m.l - m.r)
      const innerH = Math.max(0, f.h - m.t - m.b)
      const vert = f.layoutFlow === 'v'
      // main axis: w for horizontal flow, h for vertical
      const mainAxis = vert ? 'h' : 'w'
      const innerMain = vert ? innerH : innerW
      const sizeOf = (k: Shape) => (mainAxis === 'w' ? k.w : k.h)
      const setSize = (k: Shape, v: number) => {
        if (mainAxis === 'w') {
          if (Math.abs(k.w - v) > 0.01) k.w = v
        } else {
          if (Math.abs(k.h - v) > 0.01) k.h = v
        }
      }
      // fill children share the remaining main space; fills are inert in a hug frame
      const gaps = g * Math.max(0, kids.length - 1)
      if (!hug && kids.some((k) => k.mainFill)) {
        const fixedSum = kids.filter((k) => !k.mainFill).reduce((a, k) => a + sizeOf(k), 0)
        const share = Math.max(0, (innerMain - gaps - fixedSum) / kids.filter((k) => k.mainFill).length)
        for (const k of kids) if (k.mainFill) setSize(k, share)
      }
      if (cross === 1 || cross === 2 || kids.some((k) => k.crossFill)) {
        for (const k of kids) {
          if (k.crossFill) {
            if (mainAxis === 'w') {
              if (Math.abs(k.h - innerH) > 0.01) k.h = innerH
            } else {
              if (Math.abs(k.w - innerW) > 0.01) k.w = innerW
            }
          }
        }
      }
      const total = kids.reduce((a, k) => a + sizeOf(k), 0) + gaps
      let cursor = hug || kids.some((k) => k.mainFill) ? 0 : main === 0 ? 0 : main === 1 ? (innerMain - total) / 2 : innerMain - total
      for (const k of kids) {
        const crossSize = mainAxis === 'w' ? k.h : k.w
        const crossInner = mainAxis === 'w' ? innerH : innerW
        const crossPos = cross === 0 ? 0 : cross === 1 ? (crossInner - crossSize) / 2 : crossInner - crossSize
        if (mainAxis === 'w') {
          if (Math.abs(k.x - cursor) > 0.01) k.x = cursor
          if (Math.abs(k.y - crossPos) > 0.01) k.y = crossPos
        } else {
          if (Math.abs(k.x - crossPos) > 0.01) k.x = crossPos
          if (Math.abs(k.y - cursor) > 0.01) k.y = cursor
        }
        cursor += sizeOf(k) + g
      }
      // hug grows the frame's main axis to fit content + padding. Margins can now be
      // negative (they pull content in), so the total can go under zero — a frame may not.
      if (hug) {
        const contentMain = kids.reduce((a, k) => a + sizeOf(k), 0) + g * Math.max(0, kids.length - 1)
        const full = Math.max(0, contentMain + (mainAxis === 'w' ? m.l + m.r : m.t + m.b))
        if (mainAxis === 'w') {
          if (Math.abs(f.w - full) > 0.01) f.w = full
        } else {
          if (Math.abs(f.h - full) > 0.01) f.h = full
        }
      }
    }
  }

  const sanitizeParents = () => {    const { nodes } = get()
    const dangling = Object.values(nodes)
      .filter((s) => {
        const pid = s.parentId
        return !!pid && (pid === s.id || !nodes[pid])
      })
      .map((s) => s.id)
    if (!dangling.length) return
    applyMut((n) => {
      for (const id of dangling) {
        const s = n[id]
        if (s && s.parentId && (s.parentId === id || !n[s.parentId])) s.parentId = null
      }
    })
  }

  const entryChanged = (label: string, before: Tx['before']): HistoryEntry['changed'] => {
    const nodes = get().nodes
    const out: HistoryEntry['changed'] = []
    for (const [id, beforePatch] of Object.entries(before)) {
      const keys = Object.keys(beforePatch) as (keyof Shape)[]
      const after: ShapePatch = {}
      let differing = false
      for (const k of keys) {
        ;(after as Record<string, unknown>)[k] = nodes[id] ? (nodes[id] as unknown as Record<string, unknown>)[k] : undefined
        if ((beforePatch as Record<string, unknown>)[k] !== (after as Record<string, unknown>)[k]) differing = true
      }
      if (differing) out.push({ id, before: beforePatch, after })
    }
    return out
  }

  return {
    docId: null,
    nodes: {},
    pages: [{ id: 'page1', name: 'Page 1' }],
    activePage: 'page1',
    past: [],
    future: [],

    loadDoc(projectId) {
      let nodes: Record<string, Shape> = {}
      let pages: PageMeta[] = []
      let activePage = ''
      try {
        const raw = localStorage.getItem(`petal.doc.v1.${projectId}`)
        if (raw) {
          const parsed = JSON.parse(raw) as { nodes?: Record<string, unknown>; pages?: PageMeta[]; activePage?: string }
          for (const [id, n] of Object.entries(parsed.nodes ?? {})) {
            const s = normalizeShape(n)
            if (s) nodes[id] = s
          }
          pages = (parsed.pages ?? []).filter((p) => p && p.id && p.name)
          activePage = parsed.activePage ?? ''
        }
      } catch {
        nodes = {}
      }
      if (!pages.length) pages = [{ id: 'page1', name: 'Page 1' }]
      if (!pages.some((p) => p.id === activePage)) activePage = pages[0].id
      // drop orphans whose parents no longer exist; re-home shapes onto a live page
      for (const s of Object.values(nodes)) {
        if (s.parentId && !nodes[s.parentId]) s.parentId = null
        if (!s.pageId || !pages.some((p) => p.id === s.pageId)) s.pageId = pages[0].id
      }
      set({ docId: projectId, nodes, pages, activePage, past: [], future: [] })
    },

    addPage() {
      const { pages } = get()
      const base = 'Page'
      let n = pages.length + 1
      while (pages.some((p) => p.name === `${base} ${n}`)) n++
      const page = { id: nanoid(8), name: `${base} ${n}` }
      set(
        produce((s: DocState) => {
          s.pages.push(page)
          s.activePage = page.id
        }),
      )
      useUi.getState().setSelection([])
      scheduleSave()
    },

    renamePage(id, name) {
      const clean = name.trim()
      if (!clean) return
      set(
        produce((s: DocState) => {
          const p = s.pages.find((x) => x.id === id)
          if (p) p.name = clean
        }),
      )
      scheduleSave()
    },

    removePage(id) {
      const { pages, nodes } = get()
      if (pages.length <= 1) return
      const idx = pages.findIndex((p) => p.id === id)
      if (idx < 0) return
      // history keeps the removed shapes so undo can resurrect them onto the first page
      const all = [...subtreeIds(nodes, Object.values(nodes).filter((s) => s.pageId === id).map((s) => s.id))]
      const deleted: Shape[] = [...new Set(all)].map((sid) => nodes[sid]).filter(Boolean).map(clone)
      applyMut((n) => {
        for (const sid of all) {
          if (n[sid] && n[sid].pageId === id) delete n[sid]
        }
      })
      set(
        produce((s: DocState) => {
          s.pages = pages.filter((p) => p.id !== id)
          if (s.activePage === id) s.activePage = s.pages[0].id
        }),
      )
      useUi.getState().setSelection(
        useUi.getState().selection.filter((sid) => !deleted.some((d) => d.id === sid)),
      )
      push({ label: `Delete ${pages[idx].name}`, created: [], deleted, changed: [] })
      scheduleSave()
    },

    setActivePage(id) {
      if (id !== get().activePage && get().pages.some((p) => p.id === id)) {
        set({ activePage: id })
        scheduleSave()
      }
    },

    applyMut,
    patchLive: applyMut,

    insertShapes(shapes, label) {
      applyMut((n) => {
        for (const s of shapes) n[s.id] = s
      })
      push({ label, created: shapes.map(clone), deleted: [], changed: [] })
    },

    deleteShapes(ids, label) {
      const { nodes } = get()
      const all = [...subtreeIds(nodes, ids)]
      // snapshot PLAIN clones BEFORE the mutation — drafts must never leak into history
      const deleted: Shape[] = all.map((id) => nodes[id]).filter(Boolean).map(clone)
      applyMut((n) => {
        for (const id of all) {
          if (n[id]) delete n[id]
        }
      })
      push({ label, created: [], deleted, changed: [] })
    },

    moveToLayer(id, dest, label) {
      const { nodes } = get()
      const s = nodes[id]
      if (!s) return
      if (s.parentId === dest.parentId && Math.abs(s.order - dest.order) < 1e-9) return
      // keep page position when changing parent: newLocal = oldLocal + (oldOff - newOff)
      const oldOff = offset(nodes, s.parentId)
      const newOff = offset(nodes, dest.parentId)
      const ddx = oldOff.x - newOff.x
      const ddy = oldOff.y - newOff.y
      const before: ShapePatch = { parentId: s.parentId, order: s.order, x: s.x, y: s.y }
      if (s.type === 'line') Object.assign(before, { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 })
      applyMut((n) => {
        const t = n[id]
        t.parentId = dest.parentId
        t.order = dest.order
        t.x += ddx
        t.y += ddy
        if (s.type === 'line') {
          t.x1 = (t.x1 ?? 0) + ddx
          t.y1 = (t.y1 ?? 0) + ddy
          t.x2 = (t.x2 ?? 0) + ddx
          t.y2 = (t.y2 ?? 0) + ddy
        }
      })
      push({
        label,
        created: [],
        deleted: [],
        changed: [{ id, before, after: changedAfter(id, get().nodes) }],
      })
    },

    duplicateForDrag(ids, dx, dy) {
      const { nodes } = get()
      const newRoots: string[] = []
      applyMut((n) => {
        for (const srcId of ids) {
          const src = nodes[srcId]
          if (!src) continue
          const idMap = new Map<string, string>()
          for (const s of [src, ...descendantsOf(nodes, srcId)]) idMap.set(s.id, nanoid(8))
          for (const s of [src, ...descendantsOf(nodes, srcId)]) {
            const c = clone(s)
            c.id = idMap.get(s.id)!
            c.parentId = s.id === srcId ? s.parentId : (idMap.get(s.parentId ?? '') ?? s.parentId)
            if (s.id === srcId) {
              c.name = `${s.name} copy`
              c.order = s.order + 0.5
              c.x += dx
              c.y += dy
              newRoots.push(c.id)
            }
            n[c.id] = c
          }
        }
      })
      return newRoots
    },

    removeLive(ids) {
      applyMut((n) => {
        for (const id of ids) delete n[id]
      })
    },

    beginTx(label) {
      const tx: Tx = {
        label,
        before: {},
        created: new Set<string>(),
        capture(id, patch) {
          if (tx.before[id]) return
          const cur = get().nodes[id]
          if (!cur) return
          const b: ShapePatch = {}
          for (const k of Object.keys(patch) as (keyof Shape)[]) {
            ;(b as unknown as Record<string, unknown>)[k] = (cur as unknown as Record<string, unknown>)[k]
          }
          tx.before[id] = b
        },
        markCreated(id) {
          tx.created.add(id)
        },
        changedFor() {
          return entryChanged(label, tx.before)
        },
        commit() {
          const changed = tx.changedFor()
          if (changed.length || tx.created.size) {
            push({
              label,
              created: [...tx.created].map((id) => get().nodes[id]).filter(Boolean).map(clone),
              deleted: [],
              changed,
            })
          }
        },
      }
      return tx
    },

    commitEntry: (entry) => push(entry),

    commitCreated(ids, label) {
      push({ label, created: [...ids].map((id) => get().nodes[id]).filter(Boolean).map(clone), deleted: [], changed: [] })
    },

    undo() {
      const { past } = get()
      const e = past[past.length - 1]
      if (!e) return
      applyMut((n) => {
        for (const s of e.created) delete n[s.id]
        for (const s of e.deleted) n[s.id] = clone(s)
        for (const c of e.changed) {
          const cur = n[c.id]
          if (cur) Object.assign(cur, c.before)
        }
      })
      set(
        produce((s: DocState) => {
          s.past.pop()
          s.future.push(e)
        }),
      )
      sanitizeParents()
      scheduleSave()
    },

    redo() {
      const { future } = get()
      const e = future[future.length - 1]
      if (!e) return
      applyMut((n) => {
        for (const s of e.deleted) delete n[s.id]
        for (const s of e.created) n[s.id] = clone(s)
        for (const c of e.changed) {
          const cur = n[c.id]
          if (cur) Object.assign(cur, c.after)
        }
      })
      set(
        produce((s: DocState) => {
          s.future.pop()
          s.past.push(e)
        }),
      )
      sanitizeParents()
      scheduleSave()
    },

    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  }

  /* ---------- helpers ---------- */
  function offset(n: Record<string, Shape>, parentId: string | null) {
    let x = 0
    let y = 0
    let cur = parentId ? n[parentId] : undefined
    let guard = 0
    while (cur && guard++ < 64) {
      x += cur.x
      y += cur.y
      cur = cur.parentId ? n[cur.parentId] : undefined
    }
    return { x, y }
  }

  function changedAfter(id: string, nodes: Record<string, Shape>): ShapePatch {
    const s = nodes[id]
    if (!s) return {}
    const after: ShapePatch = { parentId: s.parentId, order: s.order, x: s.x, y: s.y }
    if (s.type === 'line') Object.assign(after, { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 })
    return after
  }
})
