/**
 * Turning a pattern into something a shape can wear.
 *
 * A pattern becomes an ordinary image fill: the SVG is generated once and stored as a data
 * URL, alongside the params that produced it (`Shape.pattern`), so it stays editable. The
 * tile is emitted once and repeated by the SVG's own `<pattern>` fill, so the cost does not
 * grow with the shape — a 1920×1080 frame renders as cheaply as a swatch, and a renderer
 * never touches the pattern engine at all.
 */

import type { ImageFill } from '@/model/types'
import { svgDataUrl } from '@/lib/svg'
import { motifParams } from './registry'
import { buildPatternSvg } from './render-svg'
import type { PatternParams } from './types'

/**
 * A pattern as a shape fill. `cover` against an SVG generated at the shape's own size
 * paints it 1:1; resizing then scales it the way any image fill does.
 */
export function patternFill(params: PatternParams, w: number, h: number): ImageFill {
  const svg = buildPatternSvg(params, {
    width: Math.max(1, Math.round(w)),
    height: Math.max(1, Math.round(h)),
  })
  return { type: 'image', src: svgDataUrl(svg), fit: 'cover' }
}

/**
 * A motif tuned for a shape. `size` is a multiplier on the motif's own tuned scale —
 * `motifParams` carries a scale chosen so that motif reads correctly, and a plain pixel
 * value would throw that away for every motif but one. `override` is applied last, which is
 * what lets a shape's own colour win over the motif's sampled palette.
 */
export function patternFor(motifId: string, size = 1, override: Partial<PatternParams> = {}): PatternParams {
  const tuned = motifParams(motifId)
  return { ...tuned, scale: tuned.scale * size, ...override }
}

const thumbs = new Map<string, string>()

/**
 * A motif thumbnail at small size. Built once and memoised across openings — the picker
 * shows all two dozen at once, and regenerating them per render would be the one place this
 * library could actually cost a frame.
 */
export function motifThumb(motifId: string, size = 56, cells = 3): string {
  const key = `${motifId}@${size}/${cells}`
  const hit = thumbs.get(key)
  if (hit) return hit
  const params = { ...motifParams(motifId), scale: Math.max(6, size / cells) }
  const url = svgDataUrl(buildPatternSvg(params, { width: size, height: size }))
  thumbs.set(key, url)
  return url
}
