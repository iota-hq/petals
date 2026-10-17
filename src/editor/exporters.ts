import type { Gradient, ImageFill, Shape } from '@/model/types'

/** Gradient narrowed to conic (Grad['type'] is itself a union, so plain Extract won't do). */
type ConicGrad = Omit<Gradient, 'type'> & { type: 'conic' }
import { boundsOfRects, lineEnds, pageAABB, roundedRectPath, selectionRoots, subtreeIds } from '@/model/geometry'
import type { Rect } from '@/model/geometry'
import { cornersOf, filtersToCss, gradientVector, withAlpha } from '@/model/styles'
import { useDoc } from '@/store/docStore'
import { useUi } from '@/store/uiStore'

const UI_FONT = '"Geist Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

/* ------------------------------ shared ------------------------------ */

function sanitizeName(v: string | undefined, fallback: string): string {
  const s = (v ?? '').trim().replace(/[^\w.-]+/g, '_')
  return s || fallback
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function download(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

/** Absolute page-space box of a shape within a subtree walk (accumulate parent offsets). */
function absBox(s: Shape, ox: number, oy: number): Rect {
  if (s.type === 'line') {
    const e = lineEnds(s)
    const x1 = ox + e.x1
    const y1 = oy + e.y1
    const x2 = ox + e.x2
    const y2 = oy + e.y2
    return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1) || 1, h: Math.abs(y2 - y1) || 1 }
  }
  return { x: ox + s.x, y: oy + s.y, w: s.w, h: s.h }
}

/** Margin-aware children offsets: child coords live in the frame's content box. */
function childOffset(s: Shape, ox: number, oy: number): { ox: number; oy: number } {
  return {
    ox: ox + s.x + (s.margin?.l ?? 0),
    oy: oy + s.y + (s.margin?.t ?? 0),
  }
}

function childrenSortedOf(nodes: Record<string, Shape>, parentId: string): Shape[] {
  const out: Shape[] = []
  for (const s of Object.values(nodes)) if (s.parentId === parentId) out.push(s)
  out.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
  return out
}

function collectSelection(): { nodes: Record<string, Shape>; roots: string[] } | null {
  const { nodes } = useDoc.getState()
  const roots = selectionRoots(nodes, useUi.getState().selection)
  if (!roots.length) return null
  return { nodes, roots }
}

function flatSelection(snap: { nodes: Record<string, Shape>; roots: string[] }): Shape[] {
  const all: Shape[] = []
  for (const r of snap.roots) {
    all.push(snap.nodes[r])
    for (const d of subtreeIds(snap.nodes, [r])) if (d !== r) all.push(snap.nodes[d])
  }
  return all.filter(Boolean)
}

/* ------------------------------ style helpers ------------------------------ */

type FillPaint = string | CanvasGradient | null

/** Image-paint getter with proper narrowing. */
function imagePaintOf(s: Shape): ImageFill | null {
  return typeof s.fill === 'object' && s.fill.type === 'image' ? s.fill : null
}

function canvasFill(ctx: CanvasRenderingContext2D, fill: Shape['fill'], b: Rect): FillPaint {
  if (!fill) return null
  if (typeof fill === 'string') return fill !== 'transparent' ? fill : null
  if (fill.type === 'image') return null // image paints are drawn as clipped bitmaps
  const stops = fill.stops
  if (!stops.length) return null
  const sorted = stops.slice().sort((a, b2) => a.pos - b2.pos)
  const paint = (grad: CanvasGradient) => {
    for (const st of sorted) grad.addColorStop(Math.min(1, Math.max(0, st.pos / 100)), withAlpha(st.color, st.alpha))
    return grad
  }
  if (fill.type === 'conic') {
    if (typeof ctx.createConicGradient === 'function') {
      const grad = ctx.createConicGradient((fill.angle * Math.PI) / 180, b.x + b.w / 2, b.y + b.h / 2)
      return paint(grad)
    }
    // fallback: radial
    const grad = ctx.createRadialGradient(b.x + b.w / 2, b.y + b.h / 2, 0, b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h) / 2)
    return paint(grad)
  }
  const v = gradientVector(fill.angle, b.w, b.h)
  const grad =
    fill.type === 'radial'
      ? ctx.createRadialGradient(b.x + b.w / 2, b.y + b.h / 2, 0, b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h) / 2)
      : ctx.createLinearGradient(b.x + v.x0, b.y + v.y0, b.x + v.x1, b.y + v.y1)
  return paint(grad)
}

function shapePath(ctx: CanvasRenderingContext2D, s: Shape, b: Rect): Path2D {
  const p = new Path2D()
  if (s.type === 'ellipse') {
    p.ellipse(b.x + b.w / 2, b.y + b.h / 2, Math.max(0.5, b.w / 2), Math.max(0.5, b.h / 2), 0, 0, Math.PI * 2)
  } else {
    p.roundRect(b.x, b.y, b.w, b.h, cornersOf(s))
  }
  return p
}

/** css filter expressions for SVG style (outer shadow via drop-shadow; spread unsupported there). */
function svgFilterChain(s: Shape): string {
  const parts: string[] = []
  const chain = filtersToCss(s.filters)
  if (chain) parts.push(chain)
  const sh = s.shadow
  if (sh) parts.push(`drop-shadow(${sh.x}px ${sh.y}px ${sh.blur}px ${sh.color})`)
  return parts.join(' ')
}

/** outer shadow as a blurred, expanded silhouette (canvas; supports spread). */
function paintOuterShadow(ctx: CanvasRenderingContext2D, s: Shape, b: Rect) {
  const sh = s.shadow
  if (!sh) return
  ctx.save()
  ctx.filter = `blur(${Math.max(0.01, sh.blur / 2)}px)`
  ctx.fillStyle = sh.color
  ctx.translate(sh.x, sh.y)
  ctx.fill(expandPath(s, b, sh.spread ?? 0))
  ctx.restore()
}

function expandPath(s: Shape, b: Rect, spread: number): Path2D {
  const e = new Path2D()
  if (s.type === 'ellipse') {
    e.ellipse(b.x + b.w / 2, b.y + b.h / 2, Math.max(0.5, b.w / 2 + spread), Math.max(0.5, b.h / 2 + spread), 0, 0, Math.PI * 2)
  } else {
    const corners = cornersOf(s).map((c) => Math.max(0, c + spread)) as [number, number, number, number]
    e.roundRect(b.x - spread, b.y - spread, b.w + spread * 2, b.h + spread * 2, corners)
  }
  return e
}

/** Emulates an inner shadow inside the shape by stroking a wide transparent line under a clip. */
function innerShadowStroke(ctx: CanvasRenderingContext2D, path: Path2D, s: Shape) {
  const sh = s.innerShadow
  if (!sh) return
  const spread = sh.spread ?? 0
  ctx.save()
  ctx.clip(path)
  ctx.shadowColor = sh.color
  ctx.shadowOffsetX = sh.x
  ctx.shadowOffsetY = sh.y
  ctx.shadowBlur = sh.blur
  ctx.strokeStyle = 'rgba(0,0,0,0)'
  ctx.lineWidth = Math.max(1, sh.blur * 2 + spread * 2)
  ctx.stroke(path)
  ctx.restore()
}

function applyRotation(ctx: CanvasRenderingContext2D, rotation: number | undefined, b: Rect) {
  if (!rotation) return
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  ctx.translate(cx, cy)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.translate(-cx, -cy)
}

/* ------------------------------ PNG / JPG / WEBP / AVIF ------------------------------ */

async function paintImageFill(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  src: string | undefined,
  fit: Fit2,
  b: Rect,
  cache: Map<string, HTMLImageElement | null>,
) {
  if (!src) return
  const img = cache.get(src) ?? (await loadImage(src).then((i) => (cache.set(src, i), i)))
  if (!img) return
  ctx.save()
  ctx.clip(path)
  drawFitted(img, ctx, b, fit)
  ctx.restore()
}

type Fit2 = 'cover' | 'contain' | undefined

function drawFitted(img: HTMLImageElement, ctx: CanvasRenderingContext2D, b: Rect, fit: Fit2) {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  if (!iw || !ih) return
  if ((fit ?? 'cover') === 'contain') {
    const scale = Math.min(b.w / iw, b.h / ih)
    const w = iw * scale
    const h = ih * scale
    ctx.drawImage(img, b.x + (b.w - w) / 2, b.y + (b.h - h) / 2, w, h)
  } else {
    const scale = Math.max(b.w / iw, b.h / ih)
    const w = iw * scale
    const h = ih * scale
    ctx.drawImage(img, b.x + (b.w - w) / 2, b.y + (b.h - h) / 2, w, h)
  }
}

async function paintShape(
  ctx: CanvasRenderingContext2D,
  nodes: Record<string, Shape>,
  s: Shape,
  cache: Map<string, HTMLImageElement | null>,
  ox: number,
  oy: number,
) {
  if (!s.visible || s.opacity === 0) return
  ctx.save()
  ctx.globalAlpha = s.opacity
  ctx.filter = filtersToCss(s.filters) || 'none'

  if (s.type === 'frame') {
    const b = absBox(s, ox, oy)
    applyRotation(ctx, s.rotation, b)
    paintOuterShadow(ctx, s, b)
    const paint = canvasFill(ctx, s.fill, b)
    const path = shapePath(ctx, s, b)
    if (paint) {
      ctx.fillStyle = paint
      ctx.fill(path)
    }
    const ip = imagePaintOf(s)
    await paintImageFill(ctx, path, ip?.src, ip?.fit, b, cache)
    if (s.stroke) {
      ctx.lineWidth = s.strokeWidth ?? 1
      ctx.strokeStyle = s.stroke
      ctx.stroke(path)
    }
    innerShadowStroke(ctx, path, s)
    const { ox: cx, oy: cy } = childOffset(s, ox, oy)
    for (const c of childrenSortedOf(nodes, s.id)) await paintShape(ctx, nodes, c, cache, cx, cy)
    ctx.restore()
    return
  }

  if (s.type === 'rect' || s.type === 'ellipse') {
    const b = absBox(s, ox, oy)
    applyRotation(ctx, s.rotation, b)
    paintOuterShadow(ctx, s, b)
    const path = shapePath(ctx, s, b)
    const paint = canvasFill(ctx, s.fill, b)
    if (paint) {
      ctx.fillStyle = paint
      ctx.fill(path)
    }
    const ip2 = imagePaintOf(s)
    await paintImageFill(ctx, path, ip2?.src, ip2?.fit, b, cache)
    if (s.stroke) {
      ctx.lineWidth = s.strokeWidth ?? 1
      ctx.strokeStyle = s.stroke
      ctx.stroke(path)
    }
    innerShadowStroke(ctx, path, s)
    ctx.restore()
    return
  }

  if (s.type === 'line') {
    const e = lineEnds(s)
    ctx.beginPath()
    ctx.moveTo(ox + e.x1, oy + e.y1)
    ctx.lineTo(ox + e.x2, oy + e.y2)
    ctx.lineWidth = s.strokeWidth ?? 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = s.stroke ?? '#ececf1'
    ctx.stroke()
    ctx.restore()
    return
  }

  if (s.type === 'image') {
    const b = absBox(s, ox, oy)
    applyRotation(ctx, s.rotation, b)
    paintOuterShadow(ctx, s, b)
    const path = shapePath(ctx, s, b)
    const src = s.src
    const img = src ? (cache.get(src) ?? (await loadImage(src).then((i) => (cache.set(src, i), i)))) : null
    if (img) drawFitted(img, ctx, b, s.fit)
    if (s.stroke) {
      ctx.lineWidth = s.strokeWidth ?? 1
      ctx.strokeStyle = s.stroke
      ctx.stroke(path)
    }
    innerShadowStroke(ctx, path, s)
    ctx.restore()
    return
  }

  if (s.type === 'text') {
    const b = absBox(s, ox, oy)
    applyRotation(ctx, s.rotation, b)
    const fontSize = s.fontSize ?? 24
    const lh = fontSize * (s.lineHeight ?? 1.4)
    ctx.font = `${s.fontWeight ?? 500} ${fontSize}px ${s.fontFamily ?? UI_FONT}`
    if (s.letterSpacing) ctx.letterSpacing = `${s.letterSpacing}px`
    if (s.shadow) ctx.filter = [filtersToCss(s.filters) ?? '', `drop-shadow(${s.shadow.x}px ${s.shadow.y}px ${s.shadow.blur}px ${s.shadow.color})`].join(' ').trim()
    ctx.fillStyle = s.color ?? '#ececf1'
    ctx.textBaseline = 'top'
    const wrapped: string[] = []
    for (const raw of (s.text ?? '').split('\n')) {
      let line = raw
      if (ctx.measureText(line).width > s.w && s.w > 0) {
        line = ''
        for (const w of raw.split(' ')) {
          const test = line ? `${line} ${w}` : w
          if (line && ctx.measureText(test).width > s.w) {
            wrapped.push(line)
            line = w
          } else line = test
        }
      }
      wrapped.push(line)
    }
    wrapped.forEach((line, i) => {
      const tw = ctx.measureText(line).width
      const x = b.x + (s.align === 'center' ? (s.w - tw) / 2 : s.align === 'right' ? s.w - tw : 0)
      ctx.fillText(line, x, b.y + i * lh)
    })
    ctx.restore()
    return
  }

  ctx.restore()
}

const RASTER: Record<string, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
}

export async function exportSelectionRaster(format: 'png' | 'jpeg' | 'webp' | 'avif', scale = 2) {
  const snap = collectSelection()
  if (!snap) return
  const { nodes, roots } = snap
  const valid = flatSelection(snap)
  const b = boundsOfRects(valid.map((s) => pageAABB(nodes, s)))
  if (!b || b.w <= 0 || b.h <= 0) return

  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(b.w * scale))
  c.height = Math.max(1, Math.round(b.h * scale))
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.scale(scale, scale)
  if (format === 'jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, b.w, b.h)
  }
  // pre-load images
  const srcs = new Set(
    valid.flatMap((i) => [i.src, typeof i.fill === 'object' && i.fill.type === 'image' ? i.fill.src : undefined]).filter(Boolean) as string[],
  )
  const cache = new Map<string, HTMLImageElement | null>()
  await Promise.all(Array.from(srcs).map(async (src) => cache.set(src, await loadImage(src))))
  for (const root of roots) {
    const s = nodes[root]
    if (s) await paintShape(ctx, nodes, s, cache, 0, 0)
  }

  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, RASTER[format], format === 'jpeg' ? 0.92 : undefined))
  if (!blob) return
  download(blob, `${sanitizeName(nodes[roots[0]]?.name, 'petal-export')}.${format === 'jpeg' ? 'jpg' : format}`)
}

/* keep the old external name working */
export function exportSelectionPNG(scale = 2) {
  return exportSelectionRaster('png', scale)
}

/* ------------------------------ SVG ------------------------------ */

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function gradientDefs(fill: Exclude<Shape['fill'], undefined>, idPrefix: string): string {
  if (typeof fill === 'string' || fill.type === 'image' || fill.type === 'conic' || !fill.stops.length) return ''
  const v = gradientVector(fill.angle, 1, 1)
  const stops = fill.stops
    .slice()
    .sort((a, b2) => a.pos - b2.pos)
    .map((st) => `<stop offset="${Math.min(1, Math.max(0, st.pos / 100))}" stop-color="${esc(st.color)}" stop-opacity="${st.alpha}"/>`)
    .join('')
  if (fill.type === 'radial') {
    return `<radialGradient id="${idPrefix}" cx="0.5" cy="0.5" r="0.5">${stops}</radialGradient>`
  }
  return `<linearGradient id="${idPrefix}" x1="${v.x0}" y1="${v.y0}" x2="${v.x1}" y2="${v.y1}">${stops}</linearGradient>`
}

function svgFillAttr(fill: Shape['fill'], id: string): string {
  if (!fill) return ' fill="none"'
  if (typeof fill === 'string') return fill !== 'transparent' ? ` fill="${fill}"` : ' fill="none"'
  if (fill.type === 'image' || fill.type === 'conic') return ' fill="none"'
  return ` fill="url(#${id})"`
}

/* ---- conic gradient: SVG has no conic primitive, so emit a clipped wedge fan ---- */

function hexLerp(a: string, b: string, t: number): [number, number, number] {
  const pa = parseInt(a.replace('#', '').slice(0, 6), 16) || 0
  const pb = parseInt(b.replace('#', '').slice(0, 6), 16) || 0
  const l = (x: number, y: number) => Math.round(x + (y - x) * t)
  return [l((pa >> 16) & 255, (pb >> 16) & 255), l((pa >> 8) & 255, (pb >> 8) & 255), l(pa & 255, pb & 255)]
}

function conicAt(fill: ConicGrad, t: number): { c: string; alpha: number; opacity: number } {
  const stops = fill.stops.slice().sort((a, b) => a.pos - b.pos)
  const p = Math.min(100, Math.max(0, t * 100))
  let i = 0
  while (i < stops.length - 1 && stops[i + 1].pos < p) i++
  const a = stops[Math.min(i, stops.length - 1)]
  const b = stops[Math.min(i + 1, stops.length - 1)]
  const span = b.pos - a.pos || 1
  const local = (p - a.pos) / span
  const rgb = hexLerp(a.color, b.color, local)
  const alpha = a.alpha + (b.alpha - a.alpha) * local
  void alpha
  return { c: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`, alpha: 1, opacity: alpha }
}

function svgConicWedges(
  fill: ConicGrad,
  s: Shape,
  b: Rect,
  clips: string[],
  out: string[],
  n: { i: number },
) {
  if (!fill.stops.length) return
  const id = `c${n.i++}`
  const path = s.type === 'ellipse'
    ? `M${b.x} ${b.y + b.h / 2}A${b.w / 2} ${b.h / 2} 0 1 0 ${b.x + b.w} ${b.y + b.h / 2}A${b.w / 2} ${b.h / 2} 0 1 0 ${b.x} ${b.y + b.h / 2}Z`
    : roundedRectPath(b, cornersOf(s))
  clips.push(`<clipPath id="${id}"><path d="${path}"/></clipPath>`)
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  const R = Math.hypot(b.w / 2, b.h / 2) + 1
  const N = 48
  const start = -Math.PI / 2 + (fill.angle * Math.PI) / 180
  const segs: string[] = []
  for (let k = 0; k < N; k++) {
    const t0 = k / N
    const t1 = (k + 1) / N
    const a0 = start + t0 * Math.PI * 2
    const a1 = start + t1 * Math.PI * 2
    const p0 = `${fmt(cx + R * Math.cos(a0))} ${fmt(cy + R * Math.sin(a0))}`
    const p1 = `${fmt(cx + R * Math.cos(a1))} ${fmt(cy + R * Math.sin(a1))}`
    const st = conicAt(fill, (t0 + t1) / 2)
    const large = t1 - t0 > 0.5 ? 1 : 0
    segs.push(`<path d="M${fmt(cx)} ${fmt(cy)}L${p0}A${fmt(R)} ${fmt(R)} 0 ${large} 1 ${p1}Z" fill="${st.c}" fill-opacity="${fmt(st.opacity)}"/>`)
  }
  out.push(`<g clip-path="url(#${id})">${segs.join('')}</g>`)
}

function svgStyleAttr(s: Shape): string {
  const f = svgFilterChain(s)
  return f ? ` style="filter:${esc(f)}"` : ''
}

function svgShapeEl(s: Shape, b: Rect, attrs: string): string {
  if (s.type === 'ellipse') {
    return `<ellipse cx="${b.x + b.w / 2}" cy="${b.y + b.h / 2}" rx="${Math.max(0.5, b.w / 2)}" ry="${Math.max(0.5, b.h / 2)}"${attrs}/>`
  }
  return `<path d="${roundedRectPath(b, cornersOf(s))}"${attrs}/>`
}

async function svgImageFills(
  s: Shape,
  b: Rect,
  cache: Map<string, HTMLImageElement | null>,
  clips: string[],
  out: string[],
  n: { i: number },
): Promise<boolean> {
  const fill = typeof s.fill === 'object' ? s.fill : null
  if (!fill || fill.type !== 'image') return false
  const src = fill.src
  const img = src ? (cache.get(src) ?? (await loadImage(src).then((i) => (cache.set(src, i), i)))) : null
  if (!img) return false
  const id = `c${n.i++}`
  const path = s.type === 'ellipse'
    ? `M${b.x} ${b.y + b.h / 2}A${b.w / 2} ${b.h / 2} 0 1 0 ${b.x + b.w} ${b.y + b.h / 2}A${b.w / 2} ${b.h / 2} 0 1 0 ${b.x} ${b.y + b.h / 2}Z`
    : roundedRectPath(b, cornersOf(s))
  clips.push(`<clipPath id="${id}"><path d="${path}"/></clipPath>`)
  out.push(`<g clip-path="url(#${id})">${imageEl(img.src, b, fill.fit)}</g>`)
  return true
}

function imageEl(src: string, b: Rect, fit: 'cover' | 'contain' | undefined): string {
  return `<image x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" preserveAspectRatio="${fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}" href="${esc(src).replace(/\n/g, '')}"/>`
}

/** Emits the wedge fan for conic fills (SVG has no conic primitive). */
function svgConicFill(s: Shape, b: Rect, clips: string[], out: string[], n: { i: number }) {
  if (typeof s.fill === 'object' && s.fill.type === 'conic') svgConicWedges(s.fill as ConicGrad, s, b, clips, out, n)
}

async function shapeToSvg(
  nodes: Record<string, Shape>,
  s: Shape,
  ox: number,
  oy: number,
  out: string[],
  clips: string[],
  defs: string[],
  n: { i: number },
  cache: Map<string, HTMLImageElement | null>,
) {
  if (!s.visible || s.opacity === 0) return
  const b = absBox(s, ox, oy)
  const op = s.opacity < 1 ? ` opacity="${s.opacity}"` : ''
  const stroke = s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.strokeWidth ?? 1}"` : ''
  let gradId: string | null = null
  if (typeof s.fill === 'object' && s.fill.type !== 'image') {
    gradId = `grad${n.i++}`
    const def = gradientDefs(s.fill, gradId)
    if (def) defs.push(def)
  }
  const styleAttr = svgStyleAttr(s)
  const rot = s.rotation ? ` transform="rotate(${s.rotation} ${b.x + b.w / 2} ${b.y + b.h / 2})"` : ''

  if (s.type === 'frame') {
    let clipAttr = ''
    let inner = ''
    if (s.clip) {
      const id = `clip${n.i++}`
      clips.push(`<clipPath id="${id}"><path d="${roundedRectPath(b, cornersOf(s))}"/></clipPath>`)
      clipAttr = ` clip-path="url(#${id})"`
    }
    const attrs = `${svgFillAttr(s.fill, gradId!)}${stroke}${op}${rot}${styleAttr}`
    out.push(svgShapeEl(s, b, attrs))
    svgConicFill(s, b, clips, out, n)
    if (await svgImageFills(s, b, cache, clips, out, n)) {
      // image paint replaces nothing else
    }
    const { ox: cx, oy: cy } = childOffset(s, ox, oy)
    for (const c of childrenSortedOf(nodes, s.id)) {
      const { ox: ccx, oy: ccy } = childOffset(s, ox, oy)
      void ccx
      void ccy
      await shapeToSvg(nodes, c, cx, cy, out, clips, defs, n, cache)
    }
    void inner
    return
  }

  await svgImageFills(s, b, cache, clips, out, n)

  if (s.type === 'rect') {
    out.push(svgShapeEl(s, b, `${svgFillAttr(s.fill, gradId!)}${stroke}${op}${rot}${styleAttr}`))
    svgConicFill(s, b, clips, out, n)
    return
  }
  if (s.type === 'ellipse') {
    out.push(svgShapeEl(s, b, `${svgFillAttr(s.fill, gradId!)}${stroke}${op}${rot}${styleAttr}`))
    svgConicFill(s, b, clips, out, n)
    return
  }
  if (s.type === 'line') {
    const e = lineEnds(s)
    out.push(
      `<line x1="${ox + e.x1}" y1="${oy + e.y1}" x2="${ox + e.x2}" y2="${oy + e.y2}" stroke="${s.stroke ?? '#ececf1'}" stroke-width="${s.strokeWidth ?? 2}" stroke-linecap="round"${op}${styleAttr}/>`,
    )
    return
  }
  if (s.type === 'image' && s.src) {
    out.push(
      `<image x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" preserveAspectRatio="${s.fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}" href="${esc(s.src).replace(/\n/g, '')}"${op}${rot}${styleAttr}/>`,
    )
    return
  }
  if (s.type === 'text') {
    const fontSize = s.fontSize ?? 24
    const lh = fontSize * (s.lineHeight ?? 1.4)
    const anchor = s.align === 'center' ? 'middle' : s.align === 'right' ? 'end' : 'start'
    const tx = s.align === 'center' ? b.x + s.w / 2 : s.align === 'right' ? b.x + s.w : b.x
    const family = (s.fontFamily ?? UI_FONT).replace(/"/g, "'")
    const tspans = (s.text ?? '')
      .split('\n')
      .map((line, i) => `<tspan x="${tx}" y="${b.y + i * lh + fontSize * 0.82}">${esc(line)}</tspan>`)
      .join('')
    out.push(
      `<text font-family="${esc(family)}" font-size="${fontSize}" font-weight="${s.fontWeight ?? 500}"${s.letterSpacing ? ` letter-spacing="${s.letterSpacing}"` : ''} text-anchor="${anchor}" fill="${esc(s.color ?? '#ececf1')}"${op}${rot}${styleAttr}>${tspans}</text>`,
    )
    return
  }
}

export async function exportSelectionSVG() {
  const snap = collectSelection()
  if (!snap) return
  const { nodes, roots } = snap
  const valid = flatSelection(snap)
  const b = boundsOfRects(valid.map((s) => pageAABB(nodes, s)))
  if (!b || b.w <= 0 || b.h <= 0) return

  const srcs = new Set(
    valid.flatMap((i) => [i.src, typeof i.fill === 'object' && i.fill.type === 'image' ? i.fill.src : undefined]).filter(Boolean) as string[],
  )
  const cache = new Map<string, HTMLImageElement | null>()
  await Promise.all(Array.from(srcs).map(async (src) => cache.set(src, await loadImage(src))))

  const body: string[] = []
  const clips: string[] = []
  const defs: string[] = []
  const n = { i: 0 }
  for (const root of roots) await shapeToSvg(nodes, nodes[root], 0, 0, body, clips, defs, n, cache)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(b.w)}" height="${Math.round(b.h)}" viewBox="${b.x} ${b.y} ${b.w} ${b.h}">${defs.join('')}${clips.join('')}${body.join('')}</svg>`

  download(new Blob([svg], { type: 'image/svg+xml' }), `${sanitizeName(nodes[roots[0]]?.name, 'petal-export')}.svg`)
}

/* ------------------------------ EPS / AI ------------------------------ */

const imageCache = new Map<string, HTMLImageElement | null>()

const fmt = (v: number) => (Math.round(v * 100) / 100).toString()

function rgbParts(hex: string): [string, string, string] | null {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex) ?? /^#([0-9a-fA-F]{6})[0-9a-fA-F]{2}$/.exec(hex)
  if (!m) return null
  const h = m[1]
  return [
    fmt(parseInt(h.slice(0, 2), 16) / 255),
    fmt(parseInt(h.slice(2, 4), 16) / 255),
    fmt(parseInt(h.slice(4, 6), 16) / 255),
  ]
}

function epsSetColor(hex: string): string {
  const rgb = rgbParts(hex)
  if (!rgb) return '0 0 0 setrgbcolor'
  return `${rgb[0]} ${rgb[1]} ${rgb[2]} setrgbcolor`
}

/** Rounded-rect PostScript path in screen (y-down) coords, per-corner radii via arct. */
function epsRectPath(c: [number, number, number, number], b: Rect): string {
  const [tl, tr, br, bl] = c
  const x2 = b.x + b.w
  const y2 = b.y + b.h
  return [
    `${fmt(b.x + tl)} ${fmt(b.y)} moveto`,
    `${fmt(x2 - tr)} ${fmt(b.y)} ${fmt(x2)} ${fmt(b.y + tr)} ${fmt(tr)} arct`,
    `${fmt(x2)} ${fmt(y2 - br)} ${fmt(x2 - br)} ${fmt(y2)} ${fmt(br)} arct`,
    `${fmt(b.x + bl)} ${fmt(y2)} ${fmt(b.x)} ${fmt(y2 - bl)} ${fmt(bl)} arct`,
    `${fmt(b.x)} ${fmt(b.y + tl)} ${fmt(b.x + tl)} ${fmt(b.y)} ${fmt(tl)} arct`,
    'closepath',
  ].join(' ')
}

/** Rasterize an image (cropped to the target aspect) to raw-RGB ASCIIHex for EPS image ops. */
function rgbHexForImage(
  img: HTMLImageElement,
  aspect: number,
  fit: 'cover' | 'contain' | undefined,
): { hex: string; w: number; h: number } {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  if (!iw || !ih) return { hex: '', w: 1, h: 1 }
  const canvas = document.createElement('canvas')
  const MAX = 1024
  if ((fit ?? 'cover') === 'cover') {
    let sx: number
    let sy: number
    let sw: number
    let sh: number
    const ia = iw / ih
    if (ia > aspect) {
      sh = ih
      sw = ih * aspect
      sx = (iw - sw) / 2
      sy = 0
    } else {
      sw = iw
      sh = iw / aspect
      sx = 0
      sy = (ih - sh) / 2
    }
    const scale = Math.min(1, MAX / sw, MAX / sh)
    canvas.width = Math.max(1, Math.round(sw * scale))
    canvas.height = Math.max(1, Math.round(sh * scale))
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  } else {
    // contain: letterbox on white
    canvas.width = Math.max(1, Math.round(Math.min(MAX, aspect * 1024)))
    canvas.height = Math.max(1, Math.round(canvas.width / aspect))
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const scale = Math.min(canvas.width / iw, canvas.height / ih)
    const w = iw * scale
    const h = ih * scale
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
  }
  const d = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
  let hex = ''
  for (let i = 0; i < d.length; i += 4) {
    hex += (hex.length % 240 === 239 ? '\n' : '')
    hex += d[i].toString(16).padStart(2, '0')
    hex += d[i + 1].toString(16).padStart(2, '0')
    hex += d[i + 2].toString(16).padStart(2, '0')
  }
  return { hex: hex + '\n>\n', w: canvas.width, h: canvas.height }
}

const hex2 = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0').toUpperCase()

function epsGradientShade(
  fill: Exclude<Shape['fill'], undefined>,
  b: Rect,
): string | null {
  if (typeof fill === 'string' || fill.type === 'image' || fill.type === 'conic' || fill.stops.length < 2) return null
  const stops = fill.stops.slice().sort((a, b2) => a.pos - b2.pos)
  const funcs = stops.slice(0, -1).map((st, i) => {
    const c0 = rgbParts(st.color) ?? ['0', '0', '0']
    const c1 = rgbParts(stops[i + 1].color) ?? ['0', '0', '0']
    return `<< /FunctionType 2 /Domain [0 1] /C0 [${c0.join(' ')}] /C1 [${c1.join(' ')}] /N 1 >>`
  })
  const fn = `<< /FunctionType 3 /Domain [0 1] /Functions [${funcs.join(' ')}] /Bounds [${stops
    .slice(1, -1)
    .map((st) => fmt(st.pos / 100))
    .join(' ')}] /Encode [${stops.slice(0, -1).map(() => '0 1').join(' ')}] >>`
  if (fill.type === 'radial') {
    const cx = b.x + b.w / 2
    const cy = b.y + b.h / 2
    const r = Math.max(b.w, b.h) / 2
    return `<< /ShadingType 3 /ColorSpace /DeviceRGB /Coords [${fmt(cx)} ${fmt(cy)} 0 ${fmt(cx)} ${fmt(cy)} ${fmt(r)}] /Function ${fn} >> shfill`
  }
  const v = gradientVector(fill.angle, b.w, b.h)
  return `<< /ShadingType 2 /ColorSpace /DeviceRGB /Coords [${fmt(b.x + v.x0)} ${fmt(b.y + v.y0)} ${fmt(b.x + v.x1)} ${fmt(b.y + v.y1)}] /Function ${fn} /Extend [true true] >> shfill`
}

function epsTextOps(s: Shape, b: Rect): string[] {
  const c = document.createElement('canvas').getContext('2d')
  if (!c) return []
  const fontSize = s.fontSize ?? 24
  const lh = fontSize * (s.lineHeight ?? 1.4)
  c.font = `${s.fontWeight ?? 500} ${fontSize}px ${s.fontFamily ?? UI_FONT}`
  const lines: string[] = []
  for (const raw of (s.text ?? '').split('\n')) {
    if (s.w > 0 && c.measureText(raw).width > s.w) {
      let acc = ''
      for (const w of raw.split(' ')) {
        const test = acc ? `${acc} ${w}` : w
        if (acc && c.measureText(test).width > s.w) {
          lines.push(acc)
          acc = w
        } else acc = test
      }
      if (acc) lines.push(acc)
    } else lines.push(raw)
  }
  const font = (s.fontWeight ?? 500) >= 600 ? 'Helvetica-Bold' : 'Helvetica'
  const color = epsSetColor(s.color ?? '#0d0d0d')
  const baseY = b.y + fontSize * 0.82
  return lines.map((line, i) => {
    const anchor =
      s.align === 'center' ? ' dup stringwidth pop 2 div neg 0 rmoveto' : s.align === 'right' ? ' dup stringwidth pop neg 0 rmoveto' : ''
    return `gsave ${fmt(b.x)} ${fmt(baseY + i * lh)} translate /${font} findfont ${fmt(fontSize)} scalefont setfont ${color} 0 0 moveto (${line.replace(/\\/g, '\\\\')})${anchor} show grestore`
  })
}

async function epsShape(
  nodes: Record<string, Shape>,
  s: Shape,
  ox: number,
  oy: number,
  out: string[],
) {
  if (!s.visible || s.opacity === 0) return
  const b = absBox(s, ox, oy)
  const rot = (body: string) =>
    s.rotation
      ? `gsave ${fmt(b.x + b.w / 2)} ${fmt(b.y + b.h / 2)} translate ${fmt(s.rotation)} rotate ${fmt(-(b.x + b.w / 2))} ${fmt(-(b.y + b.h / 2))} translate\n${body}\ngrestore\n`
      : body + '\n'

  const fill = s.fill
  const solid = typeof fill === 'string' && fill !== 'transparent' && fill !== 'none' ? fill : null
  const grad = typeof fill === 'object' && fill.type !== 'image' ? fill : null
  const imagePaint = typeof fill === 'object' && fill.type === 'image' ? fill : null
  const isEllipse = s.type === 'ellipse'

  const epsImageOp = (src: string | undefined, fit: 'cover' | 'contain' | undefined, bb: Rect): string => {
    if (!src) return ''
    const img = imageCache.get(src)
    if (!img) return ''
    const { hex, w, h } = rgbHexForImage(img, bb.w / bb.h, fit)
    if (!hex) return ''
    return [
      'gsave clip',
      `${fmt(bb.x)} ${fmt(bb.y)} translate ${fmt(bb.w)} ${fmt(bb.h)} scale`,
      '/DeviceRGB setcolorspace',
      `${w} ${h} 8 [${w} 0 0 ${h} 0 0] currentfile /ASCIIHexDecode filter image`,
      hex,
      'grestore',
    ].join('\n') + '\n'
  }

  // shape body path
  let body = ''
  const isBoxy = s.type === 'rect' || s.type === 'frame' || s.type === 'image' || isEllipse
  if (isBoxy) {
    if (isEllipse) {
      const cx = b.x + b.w / 2
      const cy = b.y + b.h / 2
      const pts: string[] = []
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * Math.PI * 2
        pts.push(`${fmt(cx + (b.w / 2) * Math.cos(a))} ${fmt(cy + (b.h / 2) * Math.sin(a))} ${i === 0 ? 'moveto' : 'lineto'}`)
      }
      body = `newpath ${pts.join(' ')} closepath\n`
    } else {
      body = `newpath ${epsRectPath(cornersOf(s), b)}\n`
    }
  }

  const paintsFill = s.type === 'rect' || s.type === 'frame' || isEllipse || s.type === 'image'
  if (paintsFill) {
    if (solid) body += `gsave ${epsSetColor(solid)} fill grestore\n`
    if (grad) {
      if (grad.type === 'conic') {
        // EPS has no conic primitive: approximate with the average stop color
        const stops = grad.stops
        if (stops.length) {
          const n = stops.length
          const avg = stops.reduce(
            (acc, st) => {
              const h = (parseInt(st.color.replace('#', ''), 16) || 0) & 0xffffff
              return { r: acc.r + ((h >> 16) & 255) / n, g: acc.g + ((h >> 8) & 255) / n, b: acc.b + (h & 255) / n }
            },
            { r: 0, g: 0, b: 0 },
          )
          body += `gsave clip ${epsSetColor(`#${hex2(avg.r)}${hex2(avg.g)}${hex2(avg.b)}`)} fill grestore\n`
        }
      } else {
        const shade = epsGradientShade(grad, b)
        if (shade) body += `gsave clip ${shade} grestore\n`
      }
    }
    if (imagePaint) body += epsImageOp(imagePaint.src, imagePaint.fit, b)
    if (s.type === 'image' && s.src) body += epsImageOp(s.src, s.fit, b)
    if (s.stroke) body += `${epsSetColor(s.stroke)} ${fmt(s.strokeWidth ?? 1)} setlinewidth 1 setlinecap stroke\n`
  } else if (s.type === 'line') {
    const e = lineEnds(s)
    body = `newpath ${fmt(ox + e.x1)} ${fmt(oy + e.y1)} moveto ${fmt(ox + e.x2)} ${fmt(oy + e.y2)} lineto ${epsSetColor(s.stroke ?? '#ececf1')} ${fmt(s.strokeWidth ?? 2)} setlinewidth 1 setlinecap stroke\n`
  }

  if (s.type === 'text') {
    for (const l of epsTextOps(s, b)) out.push(rot(l))
    return
  }
  out.push(rot(body))
  if (s.type === 'frame') {
    const { ox: cx, oy: cy } = childOffset(s, ox, oy)
    for (const c2 of childrenSortedOf(nodes, s.id)) await epsShape(nodes, c2, cx, cy, out)
  }
}

function epsWrapLikeLines(s: Shape, b: Rect): string[] {
  const c = document.createElement('canvas').getContext('2d')
  if (!c) return []
  const fontSize = s.fontSize ?? 24
  const lh = fontSize * (s.lineHeight ?? 1.4)
  c.font = `${s.fontWeight ?? 500} ${fontSize}px ${s.fontFamily ?? UI_FONT}`
  const lines: string[] = []
  for (const raw of (s.text ?? '').split('\n')) {
    if (s.w > 0 && c.measureText(raw).width > s.w) {
      let acc = ''
      for (const w of raw.split(' ')) {
        const test = acc ? `${acc} ${w}` : w
        if (acc && c.measureText(test).width > s.w) {
          lines.push(acc)
          acc = w
        } else acc = test
      }
      if (acc) lines.push(acc)
    } else lines.push(raw)
  }
  const font = (s.fontWeight ?? 500) >= 600 ? 'Helvetica-Bold' : 'Helvetica'
  const color = epsSetColor(s.color ?? '#0d0d0d')
  const baseY = b.y + fontSize * 0.82
  return lines.map((line, i) => {
    const anchor =
      s.align === 'center' ? ' dup stringwidth pop 2 div neg 0 rmoveto' : s.align === 'right' ? ' dup stringwidth pop neg 0 rmoveto' : ''
    return `gsave ${fmt(b.x)} ${fmt(baseY + i * lh)} translate /${font} findfont ${fmt(fontSize)} scalefont setfont (${line.replace(/\\/g, '\\\\')})${anchor} show grestore\n${color}`
  })
}

export async function exportSelectionEPS(asAI = false) {
  const snap = collectSelection()
  if (!snap) return
  const { nodes, roots } = snap
  const valid = flatSelection(snap)
  const b = boundsOfRects(valid.map((s) => pageAABB(nodes, s)))
  if (!b || b.w <= 0 || b.h <= 0) return

  const W = Math.ceil(b.w)
  const Hh = Math.ceil(b.h)
  const out: string[] = []
  // pre-load images used by image fills / image nodes
  const srcs = new Set(
    valid.flatMap((i) => [i.src, typeof i.fill === 'object' && i.fill.type === 'image' ? i.fill.src : undefined]).filter(Boolean) as string[],
  )
  for (const src of srcs) imageCache.set(src, await loadImage(src))
  for (const root of roots) await epsShape(nodes, nodes[root], 0, 0, out)

  const name = sanitizeName(nodes[roots[0]]?.name, 'petal-export')
  const eps = [
    '%!PS-Adobe-3.0 EPSF-3.0',
    `%%BoundingBox: 0 0 ${W} ${Hh}`,
    `%%HiResBoundingBox: 0 0 ${fmt(b.w)} ${fmt(b.h)}`,
    '%%Creator: Petal',
    asAI ? '%%Creator: Adobe Illustrator(R) 24.3; AI application' : `%%Title: ${name}`,
    '%%Pages: 1',
    '%%EndComments',
    '%%Page: 1 1',
    'save',
    // map screen (y-down) selection coords into PS space (y-up), origin at selection top-left
    `${fmt(-b.x)} ${fmt(b.y + Hh)} translate 1 -1 scale`,
    `0 0 ${W} ${Hh} rectclip`,
    out.join('\n'),
    'restore',
    'showpage',
    '%%EOF',
    '',
  ].join('\n')

  download(new Blob([eps], { type: 'application/postscript' }), `${name}.${asAI ? 'ai' : 'eps'}`)
}
