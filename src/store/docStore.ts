import { create } from 'zustand'
import { produce } from 'immer'
import { nanoid } from 'nanoid'
import type { Shape, ShapePatch } from '@/model/types'
import { normalizeShape } from '@/model/defaults'
import { descendantsOf, subtreeIds } from '@/model/geometry'
import { useProjects } from './projectsStore'

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
    const { docId, nodes } = useDoc.getState()
    if (!docId) return
    try {
      localStorage.setItem(`petal.doc.v1.${docId}`, JSON.stringify({ v: 1, nodes }))
    } catch {
      /* storage full — ignore */
    }
    useProjects.getState().stamp(docId)
  }, 400)
}

interface DocState {
  docId: string | null
  nodes: Record<string, Shape>
  past: HistoryEntry[]
  future: HistoryEntry[]
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
      }),
    )
    scheduleSave()
  }

  /** Dangling-parent guard after history edits. */
  const sanitizeParents = () => {
    const { nodes } = get()
    for (const s of Object.values(nodes)) {
      if (s.parentId && !nodes[s.parentId]) s.parentId = null
    }
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
    past: [],
    future: [],

    loadDoc(projectId) {
      let nodes: Record<string, Shape> = {}
      try {
        const raw = localStorage.getItem(`petal.doc.v1.${projectId}`)
        if (raw) {
          const parsed = JSON.parse(raw) as { nodes?: Record<string, unknown> }
          for (const [id, n] of Object.entries(parsed.nodes ?? {})) {
            const s = normalizeShape(n)
            if (s) nodes[id] = s
          }
        }
      } catch {
        nodes = {}
      }
      // drop orphans whose parents no longer exist
      for (const s of Object.values(nodes)) {
        if (s.parentId && !nodes[s.parentId]) s.parentId = null
      }
      set({ docId: projectId, nodes, past: [], future: [] })
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
      const all = subtreeIds(nodes, ids)
      const deleted: Shape[] = []
      applyMut((n) => {
        for (const id of all) {
          const s = n[id]
          if (s) {
            deleted.push(s)
            delete n[id]
          }
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
