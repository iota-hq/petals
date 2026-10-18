import { create } from 'zustand'
import type { Vec } from '@/model/geometry'
import type { DragTool } from '@/model/types'
import type { Tx } from './docStore'

export type Tool = 'select' | 'hand' | DragTool | 'text' | 'image'
export type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
export type Camera = { x: number; y: number; zoom: number }

/** Screen → page conversion inputs live in the wheel/pointer handlers (view.ts). */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export type MoveStart = { x: number; y: number; x1?: number; y1?: number; x2?: number; y2?: number }

export type Gesture =
  | { kind: 'pan'; startClient: Vec; startCam: Camera }
  | { kind: 'create'; tool: DragTool; start: Vec; point: Vec }
  | { kind: 'marquee'; start: Vec; point: Vec; additive: boolean }
  | {
      kind: 'move'
      ids: string[]
      start: Record<string, MoveStart>
      pageStart: Vec
      point: Vec
      dup: boolean
      dupClones: string[]
      switched: boolean
      tx: Tx
    }
  | { kind: 'resize'; id: string; handle: Handle; parentOff: Vec; start: Rect; point: Vec; shift: boolean; tx: Tx }
  | {
      kind: 'endpoint'
      id: string
      which: 1 | 2
      parentOff: Vec
      start: { x1: number; y1: number; x2: number; y2: number }
      point: Vec
      tx: Tx
    }

export const MIN_ZOOM = 0.05
export const MAX_ZOOM = 16

interface UiState {
  tool: Tool
  camera: Camera
  selection: string[]
  hoverId: string | null
  dropTarget: string | null
  gesture: Gesture | null
  space: boolean
  editingText: string | null
  showLeft: boolean
  showRight: boolean
  /** Editor canvas background (page color behind everything). */
  canvasBg: string
  /** Serialized copied shapes (see copySelection) — the app's internal clipboard. */
  clipboard: string | null
  /** When set, the layers panel opens the row's inline rename (context-menu "Rename"). */
  renameRequest: string | null
  /** Drag-to-fill mode: canvas pans freely and release over an edge strip fills it (Toolbar). */
  dockZones: boolean

  setTool: (t: Tool) => void
  setDockZones: (v: boolean) => void
  setCamera: (c: Camera) => void
  setSelection: (ids: string[]) => void
  toggleSelection: (id: string) => void
  clearSelection: () => void
  pruneSelection: (valid: Set<string>) => void
  setHover: (id: string | null) => void
  setDropTarget: (id: string | null) => void
  setGesture: (g: Gesture | null) => void
  setSpace: (v: boolean) => void
  setEditingText: (id: string | null) => void
  togglePanel: (side: 'left' | 'right') => void
  setCanvasBg: (v: string) => void
  setRenameRequest: (id: string | null) => void
}

export const DEFAULT_CANVAS_BG = '#404040'

function initialCanvasBg(): string {
  try {
    return localStorage.getItem('petal.canvasBg') ?? DEFAULT_CANVAS_BG
  } catch {
    return DEFAULT_CANVAS_BG
  }
}

export const useUi = create<UiState>((set) => ({
  tool: 'select',
  camera: { x: 120, y: 90, zoom: 1 },
  selection: [],
  hoverId: null,
  dropTarget: null,
  gesture: null,
  space: false,
  editingText: null,
  showLeft: true,
  showRight: true,
  canvasBg: initialCanvasBg(),
  clipboard: null,
  renameRequest: null,
  dockZones: false,

  setTool: (tool) => set({ tool }),
  setDockZones: (dockZones) => set({ dockZones }),
  setCamera: (camera) => set({ camera }),
  setSelection: (selection) => set({ selection, editingText: null }),

  toggleSelection: (id) =>
    set((s) => ({
      selection: s.selection.includes(id) ? s.selection.filter((i) => i !== id) : [...s.selection, id],
    })),
  clearSelection: () => set({ selection: [] }),
  pruneSelection: (valid) =>
    set((s) => {
      const sel = s.selection.filter((id) => valid.has(id))
      return sel.length === s.selection.length ? s : { selection: sel }
    }),
  setHover: (hoverId) => set((s) => (s.hoverId === hoverId ? s : { hoverId })),
  setDropTarget: (dropTarget) => set((s) => (s.dropTarget === dropTarget ? s : { dropTarget })),
  setGesture: (gesture) => set({ gesture }),
  setSpace: (space) => set((s) => (s.space === space ? s : { space })),
  setEditingText: (editingText) => set({ editingText }),
  togglePanel: (side) =>
    set((s) => (side === 'left' ? { showLeft: !s.showLeft } : { showRight: !s.showRight })),
  setCanvasBg: (canvasBg) => {
    try {
      localStorage.setItem('petal.canvasBg', canvasBg)
    } catch {
      /* ignore */
    }
    set({ canvasBg })
  },
  setRenameRequest: (renameRequest) => set({ renameRequest }),
}))

/** Pointer-centered zoom, clamped. rect = canvas element rect at event time. */
export function zoomAt(client: Vec, factor: number, rect: DOMRect) {
  const { camera, setCamera } = useUi.getState()
  const px = client.x - rect.left
  const py = client.y - rect.top
  const pageX = (px - camera.x) / camera.zoom
  const pageY = (py - camera.y) / camera.zoom
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, camera.zoom * factor))
  setCamera({ x: px - pageX * zoom, y: py - pageY * zoom, zoom })
}

/** Set absolute zoom keeping the current view center fixed. */
export function setZoomAroundCenter(zoom: number, rect: DOMRect) {
  const { camera, setCamera } = useUi.getState()
  const cpx = rect.width / 2
  const cpy = rect.height / 2
  const pageX = (cpx - camera.x) / camera.zoom
  const pageY = (cpy - camera.y) / camera.zoom
  setCamera({ x: cpx - pageX * zoom, y: cpy - pageY * zoom, zoom })
}

