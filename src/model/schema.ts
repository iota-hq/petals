import { z } from 'zod'

const shadowSchema = z.object({
  x: z.number(),
  y: z.number(),
  blur: z.number(),
  spread: z.number().optional(),
  color: z.string(),
})

const gradientStopSchema = z.object({
  color: z.string(),
  alpha: z.number(),
  pos: z.number(),
})

const gradientSchema = z.object({
  type: z.enum(['linear', 'radial', 'conic']),
  angle: z.number(),
  stops: z.array(gradientStopSchema),
})

const imageFillSchema = z.object({
  type: z.literal('image'),
  src: z.string().optional(),
  fit: z.enum(['cover', 'contain']).optional(),
})

const radiiSchema = z.object({
  tl: z.number(),
  tr: z.number(),
  br: z.number(),
  bl: z.number(),
})

const marginSchema = z.object({
  t: z.number(),
  r: z.number(),
  b: z.number(),
  l: z.number(),
})

const nodeSchema = z.object({
  id: z.string(),
  type: z.enum(['frame', 'rect', 'ellipse', 'line', 'text', 'image']),
  name: z.string(),
  parentId: z.string().nullable(),
  order: z.number(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  opacity: z.number(),
  visible: z.boolean(),
  locked: z.boolean(),
  fill: z.union([z.string(), gradientSchema, imageFillSchema]).optional(),
  rotation: z.number().optional(),
  flipX: z.boolean().optional(),
  flipY: z.boolean().optional(),
  radius: z.number().optional(),
  radii: radiiSchema.optional(),
  clip: z.boolean().optional(),
  x1: z.number().optional(),
  y1: z.number().optional(),
  x2: z.number().optional(),
  y2: z.number().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  shadow: shadowSchema.optional(),
  innerShadow: shadowSchema.optional(),
  shadows: z
    .array(shadowSchema.extend({ id: z.string(), kind: z.enum(['box', 'inner']) }))
    .optional(),
  filters: z.record(z.string(), z.number()).optional(),
  margin: marginSchema.optional(),
  text: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.number().optional(),
  fontFamily: z.string().optional(),
  align: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  src: z.string().optional(),
  fit: z.enum(['cover', 'contain']).optional(),
})

export const docSchema = z.object({
  v: z.literal(1),
  nodes: z.record(z.string(), nodeSchema),
})

export { nodeSchema as shapeSchema }
