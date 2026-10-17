export type ShapeType = 'frame' | 'rect' | 'ellipse' | 'line' | 'text' | 'image'
export type Align = 'left' | 'center' | 'right'
export type Fit = 'cover' | 'contain'

/**
 * Flat, normalized shape record.
 * Coordinates are relative to the parent (page origin when parentId is null),
 * which matches how they are rendered inside nested frames.
 */
export interface Shape {
  id: string
  type: ShapeType
  name: string
  parentId: string | null
  /** Fractional z-order among siblings; sorted on read. */
  order: number
  x: number
  y: number
  w: number
  h: number
  opacity: number
  visible: boolean
  locked: boolean
  // rect / ellipse / image / frame
  fill?: string
  radius?: number
  // rect / frame
  clip?: boolean
  // line: endpoints in parent space (x/y/w/h unused for lines)
  x1?: number
  y1?: number
  x2?: number
  y2?: number
  stroke?: string
  strokeWidth?: number
  // text
  text?: string
  fontSize?: number
  fontWeight?: number
  fontFamily?: string
  align?: Align
  color?: string
  lineHeight?: number
  // image
  src?: string
  fit?: Fit
}

export type ShapePatch = Partial<Shape>

/** Shape types that are drag-created on the canvas. */
export type DragTool = 'frame' | 'rect' | 'ellipse' | 'line'
