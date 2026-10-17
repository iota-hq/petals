export type ShapeType = 'frame' | 'rect' | 'ellipse' | 'line' | 'text' | 'image'
export type Align = 'left' | 'center' | 'right'
export type Fit = 'cover' | 'contain'

/** One gradient color stop. pos is 0..100 along the gradient axis. */
export interface GradientStop {
  color: string
  alpha: number
  pos: number
}

export interface Gradient {
  type: 'linear' | 'radial'
  /** degrees, CSS conventions: 0 = bottom→top, 90 = left→right */
  angle: number
  stops: GradientStop[]
}

export interface ShadowStyle {
  x: number
  y: number
  blur: number
  color: string
}

/** CSS-filter equivalent list (units in px / % / deg at render time). */
export type Filters = Partial<{
  blur: number
  brightness: number
  contrast: number
  grayscale: number
  hueRotate: number
  invert: number
  saturate: number
  sepia: number
}>

/** Frame content-box inset (like CSS padding). */
export interface Margin {
  t: number
  r: number
  b: number
  l: number
}

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
  fill?: string | Gradient
  rotation?: number
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
  // rect / ellipse / frame / image / text
  shadow?: ShadowStyle
  innerShadow?: ShadowStyle
  filters?: Filters
  // frame content-box inset
  margin?: Margin
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
