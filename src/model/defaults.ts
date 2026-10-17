import type { Shape, ShapeType } from './types'
import { nanoid } from 'nanoid'

/** Per-type creation / read-back defaults (one place, like a Figma "default table"). */
const typeDefaults: Record<ShapeType, Partial<Shape>> = {
  frame: { clip: true, w: 400, h: 300, fill: '#ffffff' },
  rect: { fill: '#D9D9D9', radius: 8, w: 100, h: 100 },
  ellipse: { fill: '#D9D9D9', w: 100, h: 100 },
  line: { stroke: '#ececf1', strokeWidth: 2, x1: 0, y1: 0, x2: 160, y2: 0, w: 0, h: 0 },
  text: {
    text: 'Text',
    fontSize: 24,
    fontWeight: 500,
    align: 'left',
    color: '#0d0d0d',
    lineHeight: 1.4,
    w: 320,
    h: 34,
  },
  image: { fit: 'cover', radius: 8 },
}

const baseDefaults = {
  parentId: null as string | null,
  order: 0,
  x: 0,
  y: 0,
  w: 100,
  h: 100,
  opacity: 1,
  visible: true,
  locked: false,
}

function baseName(type: ShapeType): string {
  return (
    { frame: 'Frame', rect: 'Rectangle', ellipse: 'Ellipse', line: 'Line', text: 'Text', image: 'Image' } as const
  )[type]
}

/** Create a shape from partial input, merging base + per-type defaults. Partial overrides win. */
export function createShape(partial: Partial<Shape> & { type: ShapeType }): Shape {
  const t = partial.type
  return {
    ...(baseDefaults as Shape),
    ...(typeDefaults[t] as Shape),
    name: baseName(t),
    ...partial,
    // every shape MUST have an id — fall back to a fresh one for drag-created shapes
    id: partial.id ?? nanoid(8),
  } as Shape
}

/** Coerce anything persisted into a valid Shape (old docs read identically). */
export function normalizeShape(raw: unknown): Shape | null {
  const r = raw as Partial<Shape> | null
  if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !r.type) return null
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d)
  const t = r.type as ShapeType
  const shape = createShape({ type: t, id: r.id, name: r.name || baseName(t) })
  shape.parentId = typeof r.parentId === 'string' ? r.parentId : null
  shape.order = num(r.order, 0)
  shape.x = num(r.x, 0)
  shape.y = num(r.y, 0)
  shape.w = num(r.w, 0)
  shape.h = num(r.h, 0)
  shape.opacity = num(r.opacity, 1)
  shape.visible = r.visible !== false
  shape.locked = r.locked === true
  // pass through optional fields that exist
  for (const key of ['fill', 'radius', 'clip', 'x1', 'y1', 'x2', 'y2', 'stroke', 'strokeWidth',
    'text', 'fontSize', 'fontWeight', 'fontFamily', 'align', 'color', 'lineHeight', 'src', 'fit'] as const) {
    const v = r[key]
    if (v !== undefined) (shape as unknown as Record<string, unknown>)[key] = v
  }
  return shape
}
