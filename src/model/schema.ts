import { z } from 'zod'

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
  fill: z.string().optional(),
  radius: z.number().optional(),
  clip: z.boolean().optional(),
  x1: z.number().optional(),
  y1: z.number().optional(),
  x2: z.number().optional(),
  y2: z.number().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  text: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.number().optional(),
  fontFamily: z.string().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  color: z.string().optional(),
  lineHeight: z.number().optional(),
  src: z.string().optional(),
  fit: z.enum(['cover', 'contain']).optional(),
})

export const docSchema = z.object({
  v: z.literal(1),
  nodes: z.record(z.string(), nodeSchema),
})

export { nodeSchema as shapeSchema }
