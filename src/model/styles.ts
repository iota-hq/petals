import type { CornerRadii, Filters, Gradient, ImageFill, Shape, ShadowStyle } from './types'

/** Clamp helper for stop positions etc. */
const clampTo = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

const hexToRgb = (hex: string): [number, number, number] | null => {
  const m = /^#[0-9a-fA-F]{3,8}$/.exec(hex)
  if (!m) return null
  let h = hex.slice(1)
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  if (h.length !== 6 && h.length !== 8) return null
  const n = parseInt(h.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Convert `#rrggbb` (or color string) + separate alpha into rgba(). */
export function withAlpha(color: string, alpha: number): string {
  const rgb = hexToRgb(color)
  if (!rgb) return color
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}

/** Extract alpha already embedded in an #rrggbbaa color (for canvas/SVG use). */
export function embeddedAlpha(color: string): number {
  const m = /^#[0-9a-fA-F]{8}$/.exec(color)
  if (!m) return 1
  return parseInt(color.slice(7), 16) / 255
}

/* -------------------------------------------------- fills -------------------------------------------------- */

/** Paint fill (solid color, gradient object, or image paint) as a CSS background value. */
export function fillToCss(fill: Shape['fill']): string {
  if (!fill) return 'transparent'
  if (typeof fill === 'string') return fill
  if (fill.type === 'image') {
    const fit = fill.fit === 'contain' ? 'contain' : 'cover'
    return fill.src
      ? `center / ${fit} no-repeat url('${fill.src.replace(/\n/g, '')}')`
      : 'repeating-conic-gradient(#52525b 0% 25%, #3f3f3f 0% 50%) 50% / 16px 16px'
  }
  const stops = fill.stops
  if (!stops.length) return 'transparent'
  const parts = stops
    .slice()
    .sort((a, b) => a.pos - b.pos)
    .map((s) => `${withAlpha(s.color, s.alpha)} ${clampTo(s.pos, 0, 100)}%`)
    .join(', ')
  if (fill.type === 'radial') return `radial-gradient(circle at 50% 50%, ${parts})`
  return `linear-gradient(${fill.angle}deg, ${parts})`
}

/** Track about the gradient direction for canvas/SVG (CSS angle → unit vector). */
export function gradientVector(angleDeg: number, w: number, h: number) {
  const a = (angleDeg * Math.PI) / 180
  // CSS: 0deg points up (bottom→top), 90deg → left→right
  const vx = Math.sin(a)
  const vy = -Math.cos(a)
  // length that always covers the box
  const len = Math.abs(vx) * w + Math.abs(vy) * h
  const cx = w / 2
  const cy = h / 2
  return { x0: cx - (vx * len) / 2, y0: cy - (vy * len) / 2, x1: cx + (vx * len) / 2, y1: cy + (vy * len) / 2 }
}

/* -------------------------------------------------- shadows -------------------------------------------------- */

export function shadowToCss(sh: ShadowStyle | undefined, inset = false): string | undefined {
  if (!sh) return undefined
  return `${inset ? 'inset ' : ''}${sh.x}px ${sh.y}px ${sh.blur}px ${sh.color}`
}

/* -------------------------------------------------- filters -------------------------------------------------- */

export function filtersToCss(f: Filters | undefined): string | undefined {
  if (!f) return undefined
  const parts: string[] = []
  if (f.blur) parts.push(`blur(${f.blur}px)`)
  if (f.brightness != null) parts.push(`brightness(${f.brightness}%)`)
  if (f.contrast != null) parts.push(`contrast(${f.contrast}%)`)
  if (f.grayscale != null) parts.push(`grayscale(${f.grayscale}%)`)
  if (f.hueRotate != null) parts.push(`hue-rotate(${f.hueRotate}deg)`)
  if (f.invert != null) parts.push(`invert(${f.invert}%)`)
  if (f.saturate != null) parts.push(`saturate(${f.saturate}%)`)
  if (f.sepia != null) parts.push(`sepia(${f.sepia}%)`)
  return parts.join(' ') || undefined
}

/** Rotation deg → CSS transform string. */
export function rotationToCss(rotation: number | undefined): string | undefined {
  return rotation ? `rotate(${rotation}deg)` : undefined
}

/* -------------------------------------------------- radii -------------------------------------------------- */

const R4 = [0, 0, 0, 0] as [number, number, number, number]

/** Corner radii c(tl, tr, br, bl) honoring per-corner `radii` over uniform `radius`. */
export function cornersOf(s: Shape): [number, number, number, number] {
  const r = s.radii
  if (r && (r.tl || r.tr || r.br || r.bl)) return [r.tl, r.tr, r.br, r.bl]
  const u = s.radius ?? 0
  return u ? [u, u, u, u] : R4
}

/** CSS border-radius string ("12px 4px 8px 4px" when mixed, plain number when uniform). */
export function radiusToCss(s: Shape): string | number {
  const [tl, tr, br, bl] = cornersOf(s)
  if (tl === tr && tr === br && br === bl) return tl
  if (tl === br && tr === bl) return `${tl}px ${tr}px`
  return `${tl}px ${tr}px ${br}px ${bl}px`
}
