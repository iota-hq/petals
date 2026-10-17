import { useEffect, useLayoutEffect, memo, useRef } from 'react'
import type { Shape } from '@/model/types'
import { lineEnds, lineBox } from '@/model/geometry'
import { filtersToCss, fillToCss, rotationToCss, shadowToCss } from '@/model/styles'
import { useDoc } from '@/store/docStore'
import { useUi } from '@/store/uiStore'
import { commitTextEdit, setIntrinsicHeight, typeLive } from './commands'

export type GroupMap = Map<string | null, Shape[]>

const UI_FONT = '"Geist Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

/** Style bits shared by every box-like shape: fill-extras, shadows, filters, rotation. */
function boxShadowOf(s: Shape): string | undefined {
  const outer = shadowToCss(s.shadow)
  const inner = shadowToCss(s.innerShadow, true)
  return [outer, inner].filter(Boolean).join(', ') || undefined
}

function sameChildren(a: Shape[] | undefined, b: Shape[] | undefined): boolean {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

function sameGroup(prev: GroupMap, next: GroupMap, id: string): boolean {
  return sameChildren(prev.get(id), next.get(id))
}

/**
 * One DOM node per shape, absolutely positioned in parent space.
 * Memoized on the shape object identity — camera moves never re-render these.
 */
export const ShapeNode = memo(
  function ShapeNode({ s, group }: { s: Shape; group: GroupMap }) {
    if (!s.visible) return null
    switch (s.type) {
      case 'frame':
        return <FrameView s={s} group={group} />
      case 'rect':
        return (
          <div
            data-node-id={s.id}
            className="absolute"
            style={{
              left: s.x,
              top: s.y,
              width: s.w,
              height: s.h,
              background: fillToCss(s.fill),
              borderRadius: s.radius ?? 0,
              opacity: s.opacity,
              transform: rotationToCss(s.rotation),
              boxShadow: boxShadowOf(s),
              filter: filtersToCss(s.filters),
              border: s.stroke ? `${s.strokeWidth ?? 1}px solid ${s.stroke}` : undefined,
            }}
          />
        )
      case 'ellipse':
        return (
          <div
            data-node-id={s.id}
            className="absolute"
            style={{
              left: s.x,
              top: s.y,
              width: s.w,
              height: s.h,
              background: fillToCss(s.fill),
              borderRadius: '50%',
              opacity: s.opacity,
              transform: rotationToCss(s.rotation),
              boxShadow: boxShadowOf(s),
              filter: filtersToCss(s.filters),
              border: s.stroke ? `${s.strokeWidth ?? 1}px solid ${s.stroke}` : undefined,
            }}
          />
        )
      case 'image':
        return s.src ? (
          <img
            data-node-id={s.id}
            src={s.src}
            alt=""
            draggable={false}
            className="absolute select-none"
            style={{
              left: s.x,
              top: s.y,
              width: s.w,
              height: s.h,
              objectFit: s.fit ?? 'cover',
              borderRadius: s.radius ?? 0,
              opacity: s.opacity,
              transform: rotationToCss(s.rotation),
              boxShadow: boxShadowOf(s),
              filter: filtersToCss(s.filters),
            }}
          />
        ) : null
      case 'line':
        return <LineView s={s} />
      case 'text':
        return <TextView s={s} />
    }
  },
  (prev, next) => prev.s === next.s && (prev.s.type !== 'frame' || (sameGroup(prev.group, next.group, prev.s.id) && prev.s === next.s)),
)

function FrameView({ s, group }: { s: Shape; group: GroupMap }) {
  const kids = group.get(s.id) ?? []
  const mL = s.margin?.l ?? 0
  const mT = s.margin?.t ?? 0
  const mR = s.margin?.r ?? 0
  const mB = s.margin?.b ?? 0
  return (
    <div
      data-node-id={s.id}
      className="absolute"
      style={{
        left: s.x,
        top: s.y,
        width: s.w,
        height: s.h,
        opacity: s.opacity,
        transform: rotationToCss(s.rotation),
        filter: filtersToCss(s.filters),
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          marginBottom: 'calc(4px / var(--zoom))',
          fontSize: 'calc(11px / var(--zoom))',
          lineHeight: 1.2,
          color: '#8b8b95',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {s.name}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: fillToCss(s.fill),
          borderRadius: s.radius ?? 0,
          overflow: s.clip ? 'hidden' : 'visible',
          boxShadow: boxShadowOf(s),
          border: s.stroke ? `${s.strokeWidth ?? 1}px solid ${s.stroke}` : undefined,
        }}
      >
        {/* content box — children coords are relative to the margin-inset origin */}
        <div
          style={{
            position: 'absolute',
            left: mL,
            top: mT,
            width: Math.max(0, s.w - mL - mR),
            height: Math.max(0, s.h - mT - mB),
          }}
        >
          {kids.map((c) => (
            <ShapeNode key={c.id} s={c} group={group} />
          ))}
        </div>
      </div>
    </div>
  )
}

function LineView({ s }: { s: Shape }) {
  const e = lineEnds(s)
  const b = lineBox(s)
  const dx1 = e.x1 - b.x
  const dy1 = e.y1 - b.y
  const dx2 = e.x2 - b.x
  const dy2 = e.y2 - b.y
  return (
    <div data-node-id={s.id} className="absolute" style={{ left: b.x, top: b.y, width: 0, height: 0, opacity: s.opacity }}>
      <svg
        className="absolute"
        style={{ left: dx1, top: dy1, overflow: 'visible' }}
        width={1}
        height={1}
      >
        {/* generous invisible hit area (constant screen thickness) */}
        <line
          x1={0}
          y1={0}
          x2={dx2 - dx1}
          y2={dy2 - dy1}
          stroke="transparent"
          strokeWidth={12}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={0}
          y1={0}
          x2={dx2 - dx1}
          y2={dy2 - dy1}
          stroke={s.stroke ?? '#ececf1'}
          strokeWidth={s.strokeWidth ?? 2}
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function TextView({ s }: { s: Shape }) {
  const editing = useUi((u) => u.editingText === s.id)
  const ref = useRef<HTMLDivElement>(null)
  const editingRef = useRef(false)
  editingRef.current = editing

  // auto-height while not editing (scrollHeight is already in page units)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || editing) return
    const h = el.scrollHeight
    if (Math.abs(h - s.h) > 0.75) setIntrinsicHeight(s.id, h)
  })

  useEffect(() => {
    if (!editing) return
    const el = ref.current
    if (!el) return
    el.textContent = s.text ?? ''
    el.focus()
    const r = document.createRange()
    r.selectNodeContents(el)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(r)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  const finish = () => {
    const el = ref.current
    if (!el || !editingRef.current) return
    const text = el.textContent ?? ''
    const doc = useDoc.getState()
    if (!text.trim()) {
      doc.deleteShapes([s.id], 'Edit text')
      useUi.getState().setEditingText(null)
      return
    }
    commitTextEdit(s.id, text, el.scrollHeight)
    useUi.getState().setEditingText(null)
  }

  return (
    <div
      ref={ref}
      data-node-id={s.id}
      className="absolute"
      style={{
        left: s.x,
        top: s.y,
        width: s.w,
        opacity: s.opacity,
        color: s.color ?? '#ececf1',
        fontSize: s.fontSize ?? 24,
        fontWeight: s.fontWeight ?? 500,
        fontFamily: s.fontFamily ?? UI_FONT,
        lineHeight: s.lineHeight ?? 1.4,
        textAlign: s.align ?? 'left',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        position: 'absolute',
        transform: rotationToCss(s.rotation),
        filter: filtersToCss(s.filters),
        ...(editing
          ? { contentEditable: true as unknown as string, suppressContentEditableWarning: true as never, outline: 'none', cursor: 'text' }
          : {}),
      }}
      {...(editing ? { contentEditable: true, suppressContentEditableWarning: true } : {})}
      onInput={editing ? () => typeLive(s.id, ref.current?.textContent ?? '') : undefined}
      onKeyDown={editing
        ? (ev) => {
            if (ev.key === 'Escape' || (ev.key === 'Enter' && !ev.shiftKey)) {
              ev.preventDefault()
              ev.stopPropagation()
              finish()
            }
          }
        : undefined}
      onBlur={editing ? finish : undefined}
    >
      {editing ? undefined : (s.text ?? '')}
    </div>
  )
}
