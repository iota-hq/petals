import { memo, useEffect, useState, type CSSProperties } from 'react'
import { boundsOfRects, pageAABB, selectionRoots } from '@/model/geometry'
import { useDoc } from '@/store/docStore'
import { useUi } from '@/store/uiStore'

const PINK = '#f472b6'

/** One dashed measure bridge or a solid edge-alignment line, in page space. */
interface Line {
  horiz: boolean
  /** the fixed coordinate (y for horizontal lines, x for vertical ones) */
  c: number
  from: number
  to: number
  label?: string
  align?: boolean
}

const pzc = (px: number) => `calc(${px}px / var(--zoom))`
const fmt = (v: number) => String(Math.round(v))

/**
 * Figma-style measurements: hold Alt and hover another element to see the gaps to the
 * selection on every relevant side — dashed pink bridges with distance labels, plus
 * solid alignment lines when edges line up.
 */
export const HoverMeasure = memo(function HoverMeasure() {
  const nodes = useDoc((s) => s.nodes)
  const selection = useUi((s) => s.selection)
  const zoom = useUi((s) => s.camera.zoom)
  const gesture = useUi((s) => s.gesture)
  const editingText = useUi((s) => s.editingText)
  const [hoverId, setHoverId] = useState<string | null>(null)

  // track Alt-hover on the canvas surface (window-level so mount order never matters)
  // note: holding Alt fires repeated keydown events — never clear on those, only on keyup
  useEffect(() => {
    const pos = { x: -1, y: -1 }
    let raf = 0
    const pick = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y)
      const onCanvas = !!el?.closest?.('[data-canvas-root]')
      const id = onCanvas ? (el?.closest('[data-node-id]')?.getAttribute('data-node-id') ?? null) : null
      setHoverId(id)
    }
    const schedule = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        pick(pos.x, pos.y)
      })
    }
    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      if (!e.altKey || e.buttons) {
        setHoverId((v) => (v === null ? v : null))
        raf = 0
        return
      }
      schedule()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        if (e.repeat) return
        schedule() // Alt pressed without moving the mouse: measure at the current pointer
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setHoverId((v) => (v === null ? v : null))
      }
    }
    const clear = () => {
      raf = 0
      setHoverId((v) => (v === null ? v : null))
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clear)
    const el = document.querySelector('[data-canvas-root]')
    el?.addEventListener('pointerleave', clear)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clear)
      el?.removeEventListener('pointerleave', clear)
    }
  }, [])

  if (!hoverId || gesture || editingText) return null
  const nodes001 = nodes
  const roots = selectionRoots(nodes001, selection)
  const hoverShape = nodes[hoverId]
  if (!roots.length || !hoverShape || roots.includes(hoverId)) return null

  // hovering inside the selection's own subtree is not a measurement target
  let anc = hoverShape.parentId ?? null
  while (anc) {
    if (selection.includes(anc)) return null
    anc = nodes001[anc]?.parentId ?? null
  }

  const selRects = roots.map((id) => pageAABB(nodes001, nodes001[id]))
  const A = boundsOfRects(selRects)
  const B = pageAABB(nodes001, hoverShape)
  if (!A || A.w <= 0 || A.h <= 0 || B.w <= 0 || B.h <= 0) return null

  const tol = Math.max(1.5, 3 / zoom) * (zoom < 0.2 ? 2 : 1)
  const near = (v: number, w: number) => Math.abs(v - w) <= tol

  const ax = A.x, ay = A.y, ax2 = A.x + A.w, ay2 = A.y + A.h
  const bx = B.x, by = B.y, bx2 = B.x + B.w, by2 = B.y + B.h
  const xOverlap = bx < ax2 && bx2 > ax
  const yOverlap = by < ay2 && by2 > ay
  const channelX = (Math.max(ax, bx) + Math.min(ax2, bx2)) / 2
  const channelY = (Math.max(ay, by) + Math.min(ay2, by2)) / 2
  const acX = (ax + ax2) / 2
  const bcX = (bx + bx2) / 2
  const acY = (ay + ay2) / 2
  const bcY = (by + by2) / 2

  const lines: Line[] = []
  const H = (c: number, from: number, to: number, label?: string) =>
    lines.push({ horiz: true, c, from, to, label: label || undefined })
  const V = (c: number, from: number, to: number, label?: string) =>
    lines.push({ horiz: false, c, from, to, label: label || undefined })
  /** solid alignment line spanning both boxes */
  const alignH = (y: number) => lines.push({ horiz: true, c: y, from: Math.min(ax, bx), to: Math.max(ax2, bx2), align: true })
  const alignV = (x: number) => lines.push({ horiz: false, c: x, from: Math.min(ay, by), to: Math.max(ay2, by2), align: true })

  if (xOverlap && yOverlap) {
    // boxes share both axes (one may contain the other, or they straddle):
    // measure top↔top, bottom↔bottom, left↔left, right↔right edge pairs — works
    // no matter which box is the bigger one
    if (Math.abs(by - ay) > tol) H(channelX, Math.min(ay, by), Math.max(ay, by), fmt(Math.abs(by - ay)))
    if (Math.abs(by2 - ay2) > tol) H(channelX, Math.min(by2, ay2), Math.max(by2, ay2), fmt(Math.abs(by2 - ay2)))
    if (Math.abs(bx - ax) > tol) V(channelY, Math.min(bx, ax), Math.max(bx, ax), fmt(Math.abs(bx - ax)))
    if (Math.abs(bx2 - ax2) > tol) V(channelY, Math.min(bx2, ax2), Math.max(bx2, ax2), fmt(Math.abs(bx2 - ax2)))
    if (near(by, ay)) alignH(ay)
    if (near(by2, ay2)) alignH(ay2)
    if (near(bx, ax)) alignV(ax)
    if (near(bx2, ax2)) alignV(ax2)
  } else if (xOverlap) {
    // B sits fully above or below: one bridge + side-alignment checks
    if (by >= ay2 - tol) H(channelX, ay2, by, fmt(by - ay2))
    else if (ay >= by2 - tol) H(channelX, by2, ay, fmt(ay - by2))
    if (near(bx, ax)) alignV(ax)
    if (near(bx2, ax2)) alignV(ax2)
  } else if (yOverlap) {
    if (bx >= ax2 - tol) V(channelY, ax2, bx, fmt(bx - ax2))
    else if (ax >= bx2 - tol) V(channelY, bx2, ax, fmt(ax - bx2))
    if (near(by, ay)) alignH(ay)
    if (near(by2, ay2)) alignH(ay2)
  } else {
    // diagonal: bridges along both axes along the pair's centers
    if (bx >= ax2 - tol) H(bcY, ax2, bx, fmt(bx - ax2))
    else if (ax >= bx2 - tol) H(bcY, bx2, ax, fmt(ax - bx2))
    if (by >= ay2 - tol) V(bcX, ay2, by, fmt(by - ay2))
    else if (ay >= by2 - tol) V(bcX, by2, ay, fmt(ay - by2))
  }

  const lineW = pzc(1)
  const markL = pzc(7)
  const pieces = lines.map((l, i) => {
    const common: CSSProperties = {
      position: 'absolute',
      pointerEvents: 'none',
      borderTop: `${lineW} ${l.align ? 'solid' : 'dashed'} ${PINK}`,
      borderLeft: `${lineW} ${l.align ? 'solid' : 'dashed'} ${PINK}`,
    }
    const seg = l.horiz
      ? { left: l.from, top: l.c, width: Math.max(1, l.to - l.from), height: 0, ...common }
      : { left: l.c, top: l.from, width: 0, height: Math.max(1, l.to - l.from), ...common }
    const len = l.horiz ? l.to - l.from : l.to - l.from
    const mX = l.horiz ? (l.from + l.to) / 2 : l.c
    const mY = l.horiz ? l.c : (l.from + l.to) / 2
    return (
      <div key={i} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={seg} />
        {/* end ticks */}
        <div style={l.horiz ? { position: 'absolute', left: l.from, top: l.c, width: 0, height: markL, transform: 'translateY(-50%)', borderLeft: `${lineW} solid ${PINK}`, pointerEvents: 'none' } : { position: 'absolute', left: l.c, top: l.from, width: markL, height: 0, transform: 'translateX(-50%)', borderTop: `${lineW} solid ${PINK}`, pointerEvents: 'none' }} />
        <div style={l.horiz ? { position: 'absolute', left: l.to, top: l.c, width: 0, height: markL, transform: 'translateY(-50%)', borderLeft: `${lineW} solid ${PINK}`, pointerEvents: 'none' } : { position: 'absolute', left: l.c, top: l.to, width: markL, height: 0, transform: 'translateX(-50%)', borderTop: `${lineW} solid ${PINK}`, pointerEvents: 'none' }} />
        {l.label && len > 8 / zoom && (
          <div
            data-measure-label=""
            style={{
              position: 'absolute',
              left: mX,
              top: mY,
              transform: 'translate(-50%, -50%)',
              background: '#111111',
              border: `calc(1px / var(--zoom)) solid ${PINK}55`,
              borderRadius: pzc(999),
              color: PINK,
              fontSize: pzc(10),
              fontWeight: 600,
              lineHeight: 1,
              padding: `${pzc(2.5)} ${pzc(5)}`,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 3,
            }}
          >
            {l.label}
          </div>
        )}
      </div>
    )
  })

  return (
    <div data-measure-overlay="" style={{ pointerEvents: 'none' }}>
      {/* hovered element outline */}
      <div
        style={{
          position: 'absolute',
          left: B.x,
          top: B.y,
          width: B.w,
          height: B.h,
          border: `${lineW} dashed ${PINK}`,
          pointerEvents: 'none',
        }}
      />
      {pieces}
    </div>
  )
})
