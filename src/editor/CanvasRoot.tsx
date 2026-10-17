import { useEffect, useRef } from 'react'
import { offsetForParent, type Vec } from '@/model/geometry'
import { useDoc } from '@/store/docStore'
import { zoomAt, useUi, setZoomAroundCenter, type Handle } from '@/store/uiStore'
import { Hint, TooltipProvider } from '@/components/ui/tooltip'
import {
  addImageFile,
  addTextAt,
  beginMove,
  cancelGesture,
  commitCreate,
  endpointLive,
  finishEndpoint,
  finishMarquee,
  finishMove,
  finishResize,
  fitAll,
  moveLive,
  pageFromClient,
  resizeLive,
  canvasEl,
  startEndpoint,
  startResize,
} from './commands'
import { World } from './World'
import { SelectionOverlay } from './SelectionOverlay'
import { HoverMeasure } from './HoverMeasure'

export function CanvasRoot() {
  const rootRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const tool = useUi((s) => s.tool)
  const space = useUi((s) => s.space)
  const empty = useDoc((s) => Object.keys(s.nodes).length === 0)
  const gestureKind = useUi((s) => s.gesture?.kind)
  const canvasBg = useUi((s) => s.canvasBg)

  // register canvas element + sync camera to both layers without React re-render
  useEffect(() => {
    canvasEl.current = rootRef.current
    const sync = () => {
      const c = useUi.getState().camera
      const t = `translate(${c.x}px, ${c.y}px) scale(${c.zoom})`
      if (worldRef.current) worldRef.current.style.transform = t
      if (overlayRef.current) overlayRef.current.style.transform = t
      rootRef.current?.style.setProperty('--zoom', String(c.zoom))
    }
    sync()
    const un = useUi.subscribe(sync)
    return () => {
      un()
      canvasEl.current = null
    }
  }, [])

  // wheel: pan / pinch-zoom (non-passive)
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) {
        zoomAt({ x: e.clientX, y: e.clientY }, Math.exp(-e.deltaY * 0.0022), rect)
      } else {
        const cam = useUi.getState().camera
        const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX
        const dy = e.shiftKey && !e.deltaX ? 0 : e.deltaY
        useUi.getState().setCamera({ x: cam.x - dx, y: cam.y - dy, zoom: cam.zoom })
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // global gesture move/up (registered once)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const g = useUi.getState().gesture
      if (!g) return
      if (g.kind === 'pan') {
        const cam = g.startCam
        useUi.getState().setCamera({ x: cam.x + (e.clientX - g.startClient.x), y: cam.y + (e.clientY - g.startClient.y), zoom: cam.zoom })
        useUi.getState().setGesture({ ...g, startClient: { x: e.clientX, y: e.clientY }, startCam: { x: cam.x + (e.clientX - g.startClient.x), y: cam.y + (e.clientY - g.startClient.y), zoom: cam.zoom } })
        return
      }
      const p = pageFromClient(e)
      if (g.kind === 'create' || g.kind === 'marquee') {
        let p2 = p
        if (g.kind === 'create' && e.shiftKey) {
          // Shift-drag creation: 'square' for rect/ellipse/frame, 45° snapping for line
          const dx = p.x - g.start.x
          const dy = p.y - g.start.y
          if (g.tool === 'line') {
            const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4)
            const len = Math.hypot(dx, dy)
            p2 = { x: g.start.x + Math.cos(angle) * len, y: g.start.y + Math.sin(angle) * len }
          } else {
            const m = Math.max(Math.abs(dx), Math.abs(dy))
            p2 = { x: g.start.x + Math.sign(dx || 1) * m, y: g.start.y + Math.sign(dy || 1) * m }
          }
        }
        useUi.getState().setGesture({ ...g, point: p2 })
      } else if (g.kind === 'move') {
        moveLive(p)
      } else if (g.kind === 'resize') {
        resizeLive(p, e.shiftKey)
      } else if (g.kind === 'endpoint') {
        endpointLive(p)
      }
    }
    const onUp = () => {
      const g = useUi.getState().gesture
      if (!g) return
      if (g.kind === 'pan') useUi.getState().setGesture(null)
      else if (g.kind === 'create') commitCreate(g.tool, g.start, g.point)
      else if (g.kind === 'marquee') finishMarquee(g.start, g.point, g.additive)
      else if (g.kind === 'move') finishMove()
      else if (g.kind === 'resize') finishResize()
      else if (g.kind === 'endpoint') finishEndpoint()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  // drop images
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f && f.type.startsWith('image/')) {
      const p = pageFromClient({ x: e.clientX, y: e.clientY })
      void addImageFile(f, p)
    }
  }
  // paste images
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement
      if (t?.isContentEditable || t?.closest('input, textarea, [contenteditable="true"]')) return
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'))
      const f = item?.getAsFile()
      if (f) {
        e.preventDefault()
        void addImageFile(f)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button === 2) return
    const ui = useUi.getState()
    const doc = useDoc.getState()
    const p = pageFromClient({ x: e.clientX, y: e.clientY })
    const clientVec: Vec = { x: e.clientX, y: e.clientY }

    // pan gestures
    if (e.button === 1 || ui.space || ui.tool === 'hand') {
      e.preventDefault()
      ui.setGesture({ kind: 'pan', startClient: clientVec, startCam: ui.camera })
      return
    }
    if (e.button !== 0) return

    // overlay handles (resize / line endpoints)
    const handleEl = (e.target as HTMLElement).closest('[data-handle]')
    if (handleEl instanceof HTMLElement && ui.tool === 'select' && !ui.editingText) {
      const nid = handleEl.getAttribute('data-node-id')
      const s = nid ? doc.nodes[nid] : undefined
      if (nid && s) {
        e.preventDefault()
        const h = handleEl.getAttribute('data-handle') ?? ''
        const off = offsetForParent(doc.nodes, s.parentId)
        if (h === 'ep1' || h === 'ep2') startEndpoint(nid, h === 'ep1' ? 1 : 2, p, off)
        else startResize(nid, h as Handle, p, off)
        return
      }
    }

    // don't steal pointer events while editing a text node
    if (ui.editingText) {
      const inside = (e.target as HTMLElement).closest(`[data-node-id="${ui.editingText}"]`)
      if (inside) return
    }

    if (ui.tool === 'text') {
      e.preventDefault()
      addTextAt(p)
      return
    }
    if (ui.tool === 'image') {
      e.preventDefault()
      pickImageFile()
      return
    }
    if (ui.tool !== 'select') {
      e.preventDefault()
      ui.setGesture({ kind: 'create', tool: ui.tool, start: p, point: p })
      return
    }

    // ---- select tool ----
    const nodeEl = (e.target as HTMLElement).closest('[data-node-id]')
    const nid = nodeEl?.getAttribute('data-node-id') ?? null
    const node = nid ? doc.nodes[nid] : undefined
    if (!node || !node.visible || node.locked) {
      e.preventDefault()
      ui.setGesture({ kind: 'marquee', start: p, point: p, additive: e.shiftKey })
      if (!e.shiftKey) ui.clearSelection()
      return
    }
    const selNow = useUi.getState().selection
    if (e.shiftKey) {
      ui.toggleSelection(node.id)
      return
    }
    if (!selNow.includes(node.id)) {
      useUi.setState({ selection: [node.id] })
    }
    e.preventDefault()
    beginMove(useUi.getState().selection, p, e.altKey)
  }

  const cursorValue =
    gestureKind === 'pan'
      ? 'grabbing'
      : tool === 'hand'
        ? 'grab'
        : tool === 'select'
          ? 'default'
          : tool === 'text'
            ? 'text'
            : 'crosshair'

  return (
    <TooltipProvider>
      <div
        data-canvas-root=""
        className="absolute inset-0 select-none overflow-hidden"
        ref={rootRef}
        style={{ background: canvasBg, cursor: cursorValue, touchAction: 'none' } as React.CSSProperties}
        onPointerDown={onPointerDown}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div ref={worldRef} className="absolute inset-0" style={{ transformOrigin: '0 0' }}>
          <World />
        </div>
        <div ref={overlayRef} className="absolute inset-0" style={{ transformOrigin: '0 0', pointerEvents: 'none' }}>
          <SelectionOverlay />
          <HoverMeasure />
        </div>
        {empty && !gestureKind && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center text-sm text-muted-foreground/60">
              <p className="text-base text-muted-foreground/80">Petals canvas</p>
              <p className="mt-1">
                Press <kbd className="rounded border border-border bg-card px-1">R</kbd> and drag to draw a rectangle ·{' '}
                <kbd className="rounded border border-border bg-card px-1">F</kbd> for a frame ·{' '}
                <kbd className="rounded border border-border bg-card px-1">T</kbd> for text
              </p>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

function pickImageFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const f = input.files?.[0]
    if (f) void addImageFile(f)
  }
  input.click()
}

