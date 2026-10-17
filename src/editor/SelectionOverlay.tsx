import { memo, type ReactNode } from 'react'
import { lineEnds, normRect, offsetForParent, pageAABB, selectionRoots } from '@/model/geometry'
import { rotationToCss } from '@/model/styles'
import { useDoc } from '@/store/docStore'
import { useUi } from '@/store/uiStore'

const cursorFor: Record<string, string> = {
  nw: 'cursor-nwse-resize',
  se: 'cursor-nwse-resize',
  ne: 'cursor-nesw-resize',
  sw: 'cursor-nesw-resize',
  n: 'cursor-ns-resize',
  s: 'cursor-ns-resize',
  e: 'cursor-ew-resize',
  w: 'cursor-ew-resize',
  ep1: 'cursor-move',
  ep2: 'cursor-move',
}

const HANDLE_A = 'calc(8px / var(--zoom))'
const STROKE = 'calc(1.5px / var(--zoom))'

function handleStyle(left: number, top: number): React.CSSProperties {
  return {
    position: 'absolute',
    left,
    top,
    width: HANDLE_A,
    height: HANDLE_A,
    transform: 'translate(-50%,-50%)',
    background: '#ffffff',
    border: `${STROKE} solid #f472b6`,
    borderRadius: 'calc(2px / var(--zoom))',
    pointerEvents: 'auto',
    zIndex: 2,
  }
}

/** Handles rotate around the selection center together with the shape. */
function handleTransform(left: number, top: number, rot: string): string {
  return `translate(-50%,-50%) ${rot}`
}

/** All editor chrome drawn in page-space; the container inherits the camera transform. */
export const SelectionOverlay = memo(function SelectionOverlay() {
  const selection = useUi((s) => s.selection)
  const gesture = useUi((s) => s.gesture)
  const dropTarget = useUi((s) => s.dropTarget)
  const editingText = useUi((s) => s.editingText)
  const nodes = useDoc((s) => s.nodes)

  const editing = editingText !== null
  const roots = selectionRoots(nodes, selection)
  const single = roots.length === 1 && !gesture ? (nodes[roots[0]] ?? null) : null

  const pieces: ReactNode[] = []
  let k = 0

  // selection outlines
  // selection outlines (rotation-conscious: same box the node renders)
  for (const root of roots) {
    const sRoot = nodes[root]
    if (!sRoot) continue
    const r = pageAABB(nodes, sRoot)
    pieces.push(
      <div
        key={`o${k++}`}
        style={{
          position: 'absolute',
          left: r.x,
          top: r.y,
          width: r.w,
          height: r.h,
          transform: rotationToCss(sRoot.rotation),
          border: `${STROKE} solid #f472b6`,
          pointerEvents: 'none',
        }}
      />,
    )
  }

  // resize handles for single selection
  if (single && !editing) {
    const r = pageAABB(nodes, single)
    const rot = rotationToCss(single.rotation)
    const handles: Array<[string, number, number]> = [
      ['nw', r.x, r.y],
      ['n', r.x + r.w / 2, r.y],
      ['ne', r.x + r.w, r.y],
      ['e', r.x + r.w, r.y + r.h / 2],
      ['se', r.x + r.w, r.y + r.h],
      ['s', r.x + r.w / 2, r.y + r.h],
      ['sw', r.x, r.y + r.h],
      ['w', r.x, r.y + r.h / 2],
    ]
    for (const [h, x, y] of handles) {
      pieces.push(
        <div
          key={`h${k++}`}
          data-handle={h}
          data-node-id={single.id}
          className={cursorFor[h]}
          style={{
            ...handleStyle(x, y),
            ...(rot ? { transformOrigin: `${r.x + r.w / 2 - x}px ${r.y + r.h / 2 - y}px`, transform: handleTransform(x, y, rot) } : {}),
          }}
        />,
      )
    }
  }
  // line endpoint handles
  if (single?.type === 'line' && !editing) {
    const off = offsetForParent(nodes, single.parentId)
    const e = lineEnds(single)
    const pts: Array<[string, number, number]> = [
      ['ep1', off.x + e.x1, off.y + e.y1],
      ['ep2', off.x + e.x2, off.y + e.y2],
    ]
    for (const [h, x, y] of pts) {
      pieces.push(
        <div
          key={`e${k++}`}
          data-handle={h}
          data-node-id={single.id}
          className={cursorFor[h]}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: HANDLE_A,
            height: HANDLE_A,
            transform: 'translate(-50%,-50%)',
            borderRadius: '50%',
            background: '#f472b6',
            pointerEvents: 'auto',
            zIndex: 2,
          }}
        />,
      )
    }
  }

  // drop-target highlight (frame adoption preview)
  if (gesture?.kind === 'move' && dropTarget) {
    const t = nodes[dropTarget]
    if (t) {
      const r = pageAABB(nodes, t)
      pieces.push(
        <div
          key={`d${k++}`}
          style={{
            position: 'absolute',
            left: r.x,
            top: r.y,
            width: r.w,
            height: r.h,
            border: 'calc(2px / var(--zoom)) dashed #f472b6',
            borderRadius: 'calc(4px / var(--zoom))',
            background: 'rgba(244,114,182,0.08)',
            pointerEvents: 'none',
          }}
        />,
      )
    }
  }

  // marquee
  if (gesture?.kind === 'marquee') {
    const r = normRect(gesture.start, gesture.point)
    pieces.push(
      <div
        key={`m${k++}`}
        style={{
          position: 'absolute',
          left: r.x,
          top: r.y,
          width: r.w,
          height: r.h,
          border: `${STROKE} solid rgba(244,114,182,0.9)`,
          background: 'rgba(244,114,182,0.08)',
          pointerEvents: 'none',
        }}
      />,
    )
  }

  // drag-create ghost + size badge
  if (gesture?.kind === 'create') {
    const r = normRect(gesture.start, gesture.point)
    const isEllipse = gesture.tool === 'ellipse'
    const isLine = gesture.tool === 'line'
    pieces.push(
      <div
        key={`g${k++}`}
        style={{
          position: 'absolute',
          left: r.x,
          top: r.y,
          width: r.w,
          height: r.h,
          border: `${STROKE} dashed rgba(244,114,182,0.9)`,
          borderRadius: isEllipse ? '50%' : 'calc(4px / var(--zoom))',
          background: isEllipse ? 'rgba(244,114,182,0.06)' : 'transparent',
          pointerEvents: 'none',
        }}
      />,
    )
    if (isLine) {
      pieces.push(
        <svg key={`gl${k++}`} style={{ position: 'absolute', left: r.x, top: r.y, overflow: 'visible', width: 1, height: 1, pointerEvents: 'none' }}>
          <line x1={0} y1={0} x2={r.w} y2={r.h} stroke="#f472b6" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        </svg>,
      )
    }
    pieces.push(
      <div
        key={`b${k++}`}
        style={{
          position: 'absolute',
          left: gesture.point.x,
          top: gesture.point.y,
          transform: 'translate(12px, -24px)',
          padding: 'calc(2px / var(--zoom)) calc(6px / var(--zoom))',
          borderRadius: 'calc(4px / var(--zoom))',
          background: '#26262d',
          border: 'calc(1px / var(--zoom)) solid #3a3a44',
          color: '#ececf1',
          fontSize: 'calc(11px / var(--zoom))',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        {Math.round(r.w)} × {Math.round(r.h)}
      </div>,
    )
  }

  return <>{pieces}</>
})
