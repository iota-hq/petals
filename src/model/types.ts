export type ShapeType = 'frame' | 'rect' | 'ellipse' | 'line' | 'text' | 'image'
export type Align = 'left' | 'center' | 'right' | 'justify'
export type Fit = 'cover' | 'contain'
export type ShadowKind = 'box' | 'inner'

/** One gradient color stop. pos is 0..100 along the gradient axis. */
export interface GradientStop {
  color: string
  alpha: number
  pos: number
}

export interface Gradient {
  type: 'linear' | 'radial' | 'conic'
  /** degrees, CSS conventions: 0 = bottom→top (linear) / sweep-origin rotation (conic) */
  angle: number
  stops: GradientStop[]
}

/** Image-paint fill: drawn inside the shape with cover/contain fit. */
export interface ImageFill {
  type: 'image'
  src?: string
  fit?: Fit
}

/** Per-corner radii; takes precedence over `radius` when any value is set. */
export interface CornerRadii {
  tl: number
  tr: number
  br: number
  bl: number
}

export interface ShadowStyle {
  x: number
  y: number
  blur: number
  /** expansion of the shadow silhouette in px (CSS box-shadow spread) */
  spread?: number
  color: string
}

/** One shadow of a shape — a shape keeps a list of any mix of box and inner shadows. */
export interface ShadowEntry extends ShadowStyle {
  id: string
  kind: ShadowKind
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
  /** Page the shape lives on (may be missing on very old docs — treated as the first page). */
  pageId?: string
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
  fill?: string | Gradient | ImageFill
  rotation?: number
  /** mirror the shape horizontally / vertically about its center */
  flipX?: boolean
  flipY?: boolean
  radius?: number
  radii?: CornerRadii
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
  /** the live list (box + inner in any mix); legacy shadow/innerShadow migrate into it */
  shadows?: ShadowEntry[]
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
  letterSpacing?: number
  // image
  src?: string
  fit?: Fit
}

export type ShapePatch = Partial<Shape>

/** Shape types that are drag-created on the canvas. */
export type DragTool = 'frame' | 'rect' | 'ellipse' | 'line'
