import type { Gradient, ImageFill, Shape } from '@/model/types'

/** Gradient narrowed to conic (Grad['type'] is itself a union, so plain Extract won't do). */
type ConicGrad = Omit<Gradient, 'type'> & { type: 'conic' }
import { boundsOfRects, lineEnds, offsetForParent, pageAABB, roundedRectPath, selectionRoots, subtreeIds } from '@/model/geometry'
import type { Rect } from '@/model/geometry'
import { cornersOf, fillToCss, filtersToCss, gradientVector, shadowToCss, withAlpha } from '@/model/styles'
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

function applyRotation(ctx: CanvasRenderingContext2D, s: Shape, b: Rect) {
  if (!s.rotation && !s.flipX && !s.flipY) return
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  ctx.translate(cx, cy)
  if (s.rotation) ctx.rotate((s.rotation * Math.PI) / 180)
  if (s.flipX || s.flipY) ctx.scale(s.flipX ? -1 : 1, s.flipY ? -1 : 1)
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
    applyRotation(ctx, s, b)
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
    applyRotation(ctx, s, b)
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
    applyRotation(ctx, s, b)
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
    applyRotation(ctx, s, b)
    const fontSize = s.fontSize ?? 24
    const lh = fontSize * (s.lineHeight ?? 1.4)
    ctx.font = `${s.fontWeight ?? 500} ${fontSize}px ${s.fontFamily ?? UI_FONT}`
    if (s.letterSpacing) ctx.letterSpacing = `${s.letterSpacing}px`
    ctx.filter = filtersToCss(s.filters) ?? 'none'
    // box fill (rounded) + shadows behind the glyphs, same pipeline as rect/frame
    paintOuterShadow(ctx, s, b)
    const boxPath = shapePath(ctx, s, b)
    const paint = canvasFill(ctx, s.fill, b)
    if (paint) {
      ctx.fillStyle = paint
      ctx.fill(boxPath)
    }
    const ip = imagePaintOf(s)
    await paintImageFill(ctx, boxPath, ip?.src, ip?.fit, b, cache)
    if (s.stroke) {
      ctx.lineWidth = s.strokeWidth ?? 1
      ctx.strokeStyle = s.stroke
      ctx.stroke(boxPath)
    }
    innerShadowStroke(ctx, boxPath, s)
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
      if (s.stroke) {
        ctx.lineWidth = s.strokeWidth ?? 1
        ctx.strokeStyle = s.stroke
        ctx.strokeText(line, x, b.y + i * lh)
      }
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

/** Render the current selection into an encoded raster Blob (null when nothing to export). */
export async function rasterBlob(format: 'png' | 'jpeg' | 'webp' | 'avif', scale = 2): Promise<Blob | null> {
  const snap = collectSelection()
  if (!snap) return null
  const { nodes, roots } = snap
  const valid = flatSelection(snap)
  const b = boundsOfRects(valid.map((s) => pageAABB(nodes, s)))
  if (!b || b.w <= 0 || b.h <= 0) return null

  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(b.w * scale))
  c.height = Math.max(1, Math.round(b.h * scale))
  const ctx = c.getContext('2d')
  if (!ctx) return null
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
    if (s) await paintShape(ctx, nodes, s, cache, -b.x, -b.y)
  }

  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, RASTER[format], format === 'jpeg' ? 0.92 : undefined))
  return blob
}

export async function exportSelectionRaster(format: 'png' | 'jpeg' | 'webp' | 'avif', scale = 2) {
  const snap = collectSelection()
  if (!snap) return
  const name = sanitizeName(snap.nodes[snap.roots[0]]?.name, 'petals-export')
  const blob = await rasterBlob(format, scale)
  if (!blob) return
  download(blob, `${name}.${format === 'jpeg' ? 'jpg' : format}`)
}

/* keep the old external name working */
export function exportSelectionPNG(scale = 2) {
  return exportSelectionRaster('png', scale)
}

/* ------------------------------ layered PNG (After Effects) ------------------------------ */

/**
 * One transparent, full-frame PNG per top-level layer.
 *
 * This is the shape a layered import actually needs: After Effects flattens AI/EPS to a
 * single image, and its SVG import drops `<text>` and raster artwork. Full-frame PNGs keep
 * every layer exactly as drawn and already in position, so they drop straight into a comp.
 */
export async function layerBlobs(scale = 1): Promise<{
  frame: Rect
  files: Array<{ name: string; blob: Blob; shape: Shape; box: Rect }>
} | null> {
  const snap = collectSelection()
  if (!snap) return null
  const { nodes, roots } = snap
  const valid = flatSelection(snap)
  const bounds = boundsOfRects(valid.map((s) => pageAABB(nodes, s)))
  // the comp is the frame you selected — not the union of everything inside it, which would
  // also swallow decoration that bleeds past the artboard
  const frame = boundsOfRects(roots.map((id) => pageAABB(nodes, nodes[id])))
  const b = frame
  if (!b || b.w <= 0 || b.h <= 0 || !bounds) return null

  const srcs = new Set(
    valid.flatMap((i) => [i.src, typeof i.fill === 'object' && i.fill.type === 'image' ? i.fill.src : undefined]).filter(Boolean) as string[],
  )
  const cache = new Map<string, HTMLImageElement | null>()
  await Promise.all(Array.from(srcs).map(async (src) => cache.set(src, await loadImage(src))))

  // a frame's own paint is the bottom layer, then its direct children are the rest; a leaf
  // selection is a single layer. A transparent artboard contributes no empty layer.
  const paints = (s: Shape) =>
    !!s.stroke ||
    (Array.isArray(s.shadows) && s.shadows.length > 0) ||
    (typeof s.fill === 'string' ? s.fill !== '' && s.fill !== 'none' && s.fill !== 'transparent' : !!s.fill)
  const layers = roots.flatMap((id) => {
    const s = nodes[id]
    if (!s) return []
    const kids = childrenSortedOf(nodes, s.id)
    return kids.length ? [...(paints(s) ? [s] : []), ...kids] : [s]
  })

  const files: Array<{ name: string; blob: Blob; shape: Shape; box: Rect }> = []
  for (const [i, s] of layers.entries()) {
    if (!s || !s.visible || s.opacity === 0) continue
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(b.w * scale))
    c.height = Math.max(1, Math.round(b.h * scale))
    const ctx = c.getContext('2d')
    if (!ctx) return null
    ctx.scale(scale, scale)
    // start at the layer's parent offset so nested coords land where they land on the canvas
    const off = offsetForParent(nodes, s.parentId)
    await paintShape(ctx, nodes, s, cache, off.x - b.x, off.y - b.y)
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'))
    if (!blob) continue
    const box = pageAABB(nodes, s)
    files.push({
      name: `${String(i + 1).padStart(2, '0')} ${sanitizeName(s.name, 'layer')}.png`,
      blob,
      shape: s,
      box: { x: box.x - b.x, y: box.y - b.y, w: box.w, h: box.h },
    })
  }
  return { frame: b, files }
}

const LAYERS_HELP = `Layered PNG export from Petals
==============================

Why PNG: After Effects imports AI and EPS as a single flattened image, and its SVG
import drops text and raster artwork. Full-frame PNGs are the one format that keeps
every layer exactly as drawn — colours, gradients, icons and type included.

Each file in layers/ is the whole frame, transparent except for its own layer, so
every image is already sitting in the right place.

Import into After Effects — one step
------------------------------------
1. Unzip this folder somewhere and leave import.jsx next to layers/.
2. In After Effects: File > Scripts > Run Script File... and pick import.jsx.
   It creates a comp at the right size and adds every PNG in stack order, each
   one already in position. Nothing to drag, nothing to nudge.

By hand (same result)
---------------------
1. File > Import > File, select every PNG in layers/ (or the folder).
2. Create a composition the size given in layers.json (frame.width x frame.height),
   or just drag all the footage items onto a comp of that size.
3. Stack order: 01 is the back-most layer, then 02, 03, ... Reorder in the timeline
   to match — each layer is already positioned, so no nudging is needed.
4. Keep "Continuously Rasterize" off: these are rasters.

The files
---------
- layers/NN Name.png — one full-frame transparent PNG per layer (this is the artwork)
- import.jsx          — the one-step importer (builds the comp + stack)
- layers.json         — the manifest: frame size, layer names, boxes, text properties
                        (import.jsx has everything inlined, so nothing reads this)
- this file

what becomes a layer
--------------------
Export after selecting the frame you want as the composition (the artboard). Its own
fill is layer 01, then each direct child is a layer of its own — the same rows you see
in Petals' Layers panel. Select something deeper if you want a deeper split.

limits
------
Text is rasterised with the design's font, so it looks exactly as drawn but is not an
editable text layer. No file format can carry editable text from a design tool into
After Effects — AI, EPS and SVG all lose it. If you need live type, retype it (the
font, size and colour are in layers.json), or ask Petals to outline it as shapes.
`

/** Download a zip of one full-frame PNG per layer, plus a manifest and import notes. */
export async function exportSelectionLayers(scale = 1) {
  const snap = collectSelection()
  if (!snap) return
  const name = sanitizeName(snap.nodes[snap.roots[0]]?.name, 'petals-export')
  const pack = await layerBlobs(scale)
  if (!pack) return
  const r2 = (n: number) => Math.round(n * 100) / 100
  const files: Array<{ name: string; data: Uint8Array }> = []
  for (const f of pack.files) {
    files.push({ name: `layers/${f.name}`, data: new Uint8Array(await f.blob.arrayBuffer()) })
  }
  const manifest = {
    format: 'petals-layers@1',
    frame: { width: r2(pack.frame.w), height: r2(pack.frame.h) },
    scale,
    layers: pack.files.map((f) => ({
      file: `layers/${f.name}`,
      name: f.shape.name,
      type: f.shape.type,
      x: r2(f.box.x),
      y: r2(f.box.y),
      width: r2(f.box.w),
      height: r2(f.box.h),
      opacity: f.shape.opacity ?? 1,
      rotation: f.shape.rotation ?? 0,
      text: f.shape.type === 'text' ? f.shape.text : undefined,
      fontFamily: f.shape.type === 'text' ? f.shape.fontFamily : undefined,
      fontSize: f.shape.type === 'text' ? f.shape.fontSize : undefined,
      fontWeight: f.shape.type === 'text' ? f.shape.fontWeight : undefined,
      color: f.shape.type === 'text' ? f.shape.color : undefined,
    })),
  }
  files.push({ name: 'layers.json', data: new TextEncoder().encode(JSON.stringify(manifest, null, 2)) })
  files.push({ name: 'import.jsx', data: new TextEncoder().encode(buildLayersJSX(name, manifest)) })
  files.push({ name: 'IMPORT-AFTER-EFFECTS.txt', data: new TextEncoder().encode(LAYERS_HELP) })
  download(buildZipArchive(files), `${name}-layers.zip`)
}

/**
 * The one-step importer shipped inside the zip. It builds the comp and adds every PNG in
 * stack order, so nothing is placed by hand. All metadata is inlined — no file reads — because
 * both AE and EffectCraft restrict script file access.
 */
function buildLayersJSX(name: string, manifest: { frame: { width: number; height: number }; layers: Array<{ file: string; name: string }> }): string {
  return `// Petals layered import — builds the comp and adds every layer in order.
// File > Scripts > Run Script File... and pick this file (it reads layers/ next to itself).
(function () {
  var data = ${JSON.stringify({ name, frame: manifest.frame, layers: manifest.layers.map((l) => ({ file: l.file, name: l.name })) })};
  app.beginUndoGroup('Petals layers');
  var dir = (new File($.fileName)).parent;
  var comp = app.project.items.addComp(data.name + ' (Petals)', data.frame.width, data.frame.height, 1, 10, 30);
  var folder = null;
  try { folder = app.project.items.addFolder(data.name + ' layers'); } catch (e) {}
  for (var i = 0; i < data.layers.length; i++) {
    var l = data.layers[i];
    var f = new File(dir.fsName + '/' + l.file);
    var io = new ImportOptions(f);
    io.importAs = ImportAsType.FOOTAGE;
    var item = app.project.importFile(io);
    item.name = l.name;
    if (folder) { try { item.parentFolder = folder; } catch (e) {} }
    var lay = comp.layers.add(item);
    lay.name = l.name;
    try { lay.position.setValue([data.frame.width / 2, data.frame.height / 2]); } catch (e) {}
  }
  try { comp.openInViewer(); } catch (e) {}
  app.endUndoGroup();
  return comp;
})();
`
}

/* ------------------------------ native (editable) ------------------------------ */

type Rgba = [number, number, number, number]

/** CSS colour → the 0..1 [r,g,b,a] tuple ExtendScript wants. */
function rgbaOf(color: string | undefined): Rgba {
  const c = (color ?? '').trim()
  const hex = /^#([0-9a-f]{3,8})$/i.exec(c)
  if (hex) {
    const h = hex[1]
    const p = (i: number, len: number) => parseInt(len === 1 ? h[i] + h[i] : h.slice(i, i + 2), 16) / 255
    if (h.length === 3 || h.length === 4) return [p(0, 1), p(1, 1), p(2, 1), h.length === 4 ? p(3, 1) : 1]
    if (h.length === 6 || h.length === 8) return [p(0, 2), p(2, 2), p(4, 2), h.length === 8 ? p(6, 2) : 1]
  }
  const m = /^rgba?\(([^)]+)\)$/i.exec(c)
  if (m) {
    const n = m[1].split(/[,/\s]+/).filter(Boolean).map(Number)
    return [(n[0] ?? 0) / 255, (n[1] ?? 0) / 255, (n[2] ?? 0) / 255, Number.isFinite(n[3]) ? n[3] : 1]
  }
  // named colours and anything else: let the browser normalise it
  const ctx = document.createElement('canvas').getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#000000'
    ctx.fillStyle = c
    const v = String(ctx.fillStyle)
    if (v && v !== c && v !== '#000000') return rgbaOf(v)
  }
  return [0, 0, 0, 1]
}

const visibleFill = (s: Shape) =>
  typeof s.fill === 'string' ? !!s.fill && s.fill !== 'none' && s.fill !== 'transparent' : !!s.fill

function paintsShape(s: Shape): boolean {
  if (!s.visible) return false
  if (s.type === 'text') return !!s.text?.trim()
  if (s.type === 'image') return !!s.src
  if (s.type === 'line') return !!s.stroke && (s.strokeWidth ?? 1) > 0
  return visibleFill(s) || (!!s.stroke && (s.strokeWidth ?? 1) > 0) || !!s.shadows?.length
}

function cornerRadiusOf(s: Shape): number {
  if (s.radii) return Math.max(s.radii.tl, s.radii.tr, s.radii.br, s.radii.bl)
  return s.radius ?? 0
}

/** How far a raster layer must be padded so its shadows are not cut off. */
function shadowPad(s: Shape): number {
  let pad = 0
  for (const sh of s.shadows ?? []) pad = Math.max(pad, Math.abs(sh.x) + Math.abs(sh.y) + sh.blur * 2 + (sh.spread ?? 0))
  return Math.ceil(pad)
}

/**
 * The fill of a native shape. Solid paints stay vector; a linear/radial gradient with two
 * stops becomes a Gradient Ramp effect (the layer alpha keeps it inside the path); anything
 * richer (conic, 3+ stops, pattern, image paint) is rasterised so the look survives.
 */
type NativeFill =
  | { solid: Rgba }
  | { gradient: { kind: 'linear' | 'radial'; angle: number; stops: Array<{ color: Rgba; pos: number }> } }

function nativeFillOf(s: Shape): NativeFill | 'raster' | null {
  const f = s.fill
  if (!f) return null
  if (typeof f === 'string') return f && f !== 'none' && f !== 'transparent' ? { solid: rgbaOf(f) } : null
  if (f.type === 'linear' || f.type === 'radial') {
    if (f.stops.length > 2) return 'raster'
    const stops = [...f.stops].sort((a, b) => a.pos - b.pos)
    return {
      gradient: {
        kind: f.type,
        angle: f.angle ?? 180,
        stops: stops.map((st) => ({ color: rgbaOf(withAlpha(st.color, st.alpha)), pos: st.pos })),
      },
    }
  }
  return 'raster'
}

interface NativeShapeLayer {
  kind: 'shape'
  name: string
  x: number
  y: number
  w: number
  h: number
  rotation: number
  opacity: number
  geom: 'rect' | 'ellipse'
  radius?: number
  fill?: NativeFill
  stroke?: { color: Rgba; width: number }
  shadow?: { color: Rgba; direction: number; distance: number; softness: number }
}

interface NativeTextLayer {
  kind: 'text'
  name: string
  x: number
  y: number
  w: number
  h: number
  rotation: number
  opacity: number
  text: string
  font: string
  fontSize: number
  leading: number
  tracking: number
  align: string
  color: Rgba
}

interface NativeImageLayer {
  kind: 'image'
  name: string
  x: number
  y: number
  w: number
  h: number
  opacity: number
  file: string
  pxW: number
  pxH: number
}

type NativeLayer = NativeShapeLayer | NativeTextLayer | NativeImageLayer

interface NativeScene {
  format: 'petals-native@1'
  name: string
  frame: { width: number; height: number }
  layers: NativeLayer[]
}

const NATIVE_HELP = `Native After Effects export from Petals
=======================================

This is not an import of pictures: import-native.jsx BUILDS the design as real After
Effects layers.

  1. Unzip this folder somewhere (keep import.jsx... this one: import-native.jsx next to
     images/ and scene.json).
  2. After Effects: File > Scripts > Run Script File... and pick import-native.jsx.
  3. It creates a comp at the frame size and builds every layer, bottom to top.

What is native
--------------
- Text        real text layers. Double-click and type; font, size, leading, tracking,
              colour, alignment and the measured box are already set.
- Rectangles  shape layers with a Rect path: size, corner roundness, fill and stroke are
  / ellipses   editable in the shape's Contents, exactly like a hand-drawn shape layer.
- Two-stop    linear/radial gradients become a Gradient Ramp effect on the shape layer,
  gradients   so the colours stay editable in the Effect Controls panel.
- Shadows     a Drop Shadow effect (colour, direction, distance, softness), so it can be
              retimed or animated.

What arrives as an image
------------------------
- Icons, logos and photos (they are raster artwork in the design too).
- Conic gradients, pattern fills, and gradients with 3+ stops (After Effects' scriptable
  ramp only takes two stops).
- Shapes with inner shadows.
Those get a transparent PNG cropped to their own box, placed as a footage layer, so the
look is exact even though the pixels are not vector.

Known differences
-----------------
- After Effects has no groups: nested frames become a shape layer with their children as
  layers above them. The stack is the same as the canvas.
- Clipping on a frame is not carried over; keep that in mind if a child overflows.
- A font that is not installed is substituted; the script prints which ones it changed.
`

/**
 * Native export: a JSX builder plus raster fallbacks for the few things After Effects
 * cannot express natively. This is the only route that produces editable text and shape
 * layers — no interchange file (AI/EPS/SVG/PSD) carries editable type into AE.
 */
export async function exportSelectionNative() {
  const snap = collectSelection()
  if (!snap) return
  const { nodes, roots } = snap
  const name = sanitizeName(nodes[roots[0]]?.name, 'petals-export')
  const frame = boundsOfRects(roots.map((id) => pageAABB(nodes, nodes[id])))
  if (!frame) return

  const layers: NativeLayer[] = []
  const rasters: Array<{ layer: NativeImageLayer; shape: Shape; box: Rect; pad: number }> = []
  const srcs = new Set<string>()
  for (const s of flatSelection(snap)) {
    if (s.src) srcs.add(s.src)
    if (typeof s.fill === 'object' && s.fill.type === 'image' && s.fill.src) srcs.add(s.fill.src)
  }
  const cache = new Map<string, HTMLImageElement | null>()
  await Promise.all(Array.from(srcs).map(async (src) => cache.set(src, await loadImage(src))))

  const push = (s: Shape, box: Rect): NativeLayer | null => {
    const x = box.x - frame.x
    const y = box.y - frame.y
    const base = { name: s.name, x, y, w: box.w, h: box.h, rotation: s.rotation ?? 0, opacity: s.opacity ?? 1 }

    if (s.type === 'text') {
      const fontSize = s.fontSize ?? 24
      const weight = s.fontWeight ?? 500
      const style = weight >= 700 ? 'Bold' : weight >= 600 ? 'SemiBold' : weight >= 500 ? 'Medium' : 'Regular'
      const family = (s.fontFamily ?? 'Inter').replace(/["']/g, '').split(',')[0].trim()
      const layer: NativeTextLayer = {
        kind: 'text',
        ...base,
        text: s.text ?? '',
        font: `${family}-${style}`,
        fontSize,
        leading: fontSize * (s.lineHeight ?? 1.4),
        tracking: fontSize ? ((s.letterSpacing ?? 0) / fontSize) * 1000 : 0,
        align: s.align ?? 'left',
        color: rgbaOf(s.color ?? '#000000'),
      }
      layers.push(layer)
      return layer
    }

    // a straight line is a rotated rectangle: native, resizable, and no fake geometry
    if (s.type === 'line') {
      const e = lineEnds(s)
      const x1 = e.x1
      const y1 = e.y1
      const x2 = e.x2
      const y2 = e.y2
      const len = Math.hypot(x2 - x1, y2 - y1) || 1
      const th = s.strokeWidth ?? 1
      const cx = (x1 + x2) / 2
      const cy = (y1 + y2) / 2
      const layer: NativeShapeLayer = {
        kind: 'shape',
        ...base,
        x: cx - len / 2 - frame.x,
        y: cy - th / 2 - frame.y,
        w: len,
        h: th,
        rotation: (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI,
        geom: 'rect',
        fill: { solid: rgbaOf(s.stroke) },
      }
      layers.push(layer)
      return layer
    }

    const fill = nativeFillOf(s)
    const gradWithStroke = fill === 'raster' || (fill && 'gradient' in fill && s.stroke)
    const needsRaster = s.type === 'image' || !!s.src || !!s.pattern || !!imagePaintOf(s) || fill === 'raster' || !!gradWithStroke
    if (needsRaster) return null // handled by the raster pass

    const sh = s.shadows?.[0]
    const layer: NativeShapeLayer = {
      kind: 'shape',
      ...base,
      geom: s.type === 'ellipse' ? 'ellipse' : 'rect',
      radius: s.type === 'ellipse' ? undefined : cornerRadiusOf(s),
      fill: fill ?? undefined,
      stroke: s.stroke ? { color: rgbaOf(s.stroke), width: s.strokeWidth ?? 1 } : undefined,
      shadow: sh
        ? {
            color: [rgbaOf(sh.color)[0], rgbaOf(sh.color)[1], rgbaOf(sh.color)[2], withAlphaAlpha(sh.color)],
            direction: (((90 + (Math.atan2(sh.y, sh.x) * 180) / Math.PI) % 360) + 360) % 360,
            distance: Math.hypot(sh.x, sh.y),
            softness: sh.blur * 0.5,
          }
        : undefined,
    }
    layers.push(layer)
    return layer
  }

  const visit = (s: Shape, ox: number, oy: number) => {
    if (!s.visible) return
    const box = absBox(s, ox, oy)
    if (!paintsShape(s)) {
      // nothing of its own to draw, but its children still are layers
    } else {
      const made = push(s, box)
      if (!made) {
        const pad = shadowPad(s)
        const layer: NativeImageLayer = {
          kind: 'image',
          name: s.name,
          x: box.x - frame.x - pad,
          y: box.y - frame.y - pad,
          w: box.w + pad * 2,
          h: box.h + pad * 2,
          opacity: s.opacity ?? 1,
          file: '',
          pxW: 0,
          pxH: 0,
        }
        layers.push(layer)
        rasters.push({ layer, shape: s, box, pad })
      }
    }
    const off = childOffset(s, ox, oy)
    for (const kid of childrenSortedOf(nodes, s.id)) visit(kid, off.ox, off.oy)
  }
  for (const id of roots) visit(nodes[id], 0, 0)

  const files: Array<{ name: string; data: Uint8Array }> = []
  for (const r of rasters) {
    const scale = Math.max(1, Math.min(2, Math.round(512 / Math.max(r.box.w, r.box.h, 1))))
    const w = Math.max(1, Math.ceil((r.box.w + r.pad * 2) * scale))
    const h = Math.max(1, Math.ceil((r.box.h + r.pad * 2) * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) continue
    ctx.scale(scale, scale)
    ctx.translate(-(r.box.x - r.pad), -(r.box.y - r.pad))
    const off = offsetForParent(nodes, r.shape.parentId)
    await paintShape(ctx, nodes, r.shape, cache, off.x, off.y)
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'))
    if (!blob) continue
    const i = layers.indexOf(r.layer)
    const file = `images/${String(i + 1).padStart(2, '0')} ${sanitizeName(r.shape.name, 'layer')}.png`
    r.layer.file = file
    r.layer.pxW = w
    r.layer.pxH = h
    files.push({ name: file, data: new Uint8Array(await blob.arrayBuffer()) })
  }

  const scene: NativeScene = {
    format: 'petals-native@1',
    name,
    frame: { width: Math.round(frame.w), height: Math.round(frame.h) },
    layers,
  }
  files.push({ name: 'scene.json', data: new TextEncoder().encode(JSON.stringify(scene, null, 2)) })
  files.push({ name: 'import-native.jsx', data: new TextEncoder().encode(buildNativeJSX(scene)) })
  files.push({ name: 'README.txt', data: new TextEncoder().encode(NATIVE_HELP) })
  download(buildZipArchive(files), `${name}-native.zip`)
}

/** Alpha of a CSS colour (0..1), used for the shadow effect's opacity. */
function withAlphaAlpha(color: string): number {
  const c = rgbaOf(color)
  return c[3]
}

/**
 * The builder shipped in the zip. ExtendScript is ES3, so: var only, no arrows, no template
 * strings, try/catch around everything the host may not implement.
 */
function buildNativeJSX(scene: NativeScene): string {
  return `// Petals native import — builds editable layers, not flat pictures.
// File > Scripts > Run Script File... and pick this file (it reads images/ next to itself).
(function () {
  var data = ${JSON.stringify(scene)};
  var report = { shapes: 0, texts: 0, images: 0, warnings: [] };
  app.beginUndoGroup('Petals native import');
  var dir = (new File($.fileName)).parent.fsName;
  var comp = app.project.items.addComp(data.name + ' (Petals)', data.frame.width, data.frame.height, 1, 10, 30);
  var folder = null;

  function warn(msg) { report.warnings.push(msg); }

  function place(layer, d, ax, ay, px, py) {
    var t = layer.property('Transform');
    try { t.property('Anchor Point').setValue([ax, ay]); } catch (e) {}
    t.property('Position').setValue([px, py]);
    if (d.rotation) { try { t.property('Rotation').setValue(d.rotation); } catch (e) {} }
    if (d.opacity !== 1) { try { t.property('Opacity').setValue(d.opacity * 100); } catch (e) {} }
  }

  function addShape(d) {
    var l = comp.layers.addShape();
    l.name = d.name;
    var c = l.property('Contents');
    if (d.geom === 'ellipse') {
      var el = c.addProperty('ADBE Vector Shape - Ellipse');
      el.property('ADBE Vector Ellipse Size').setValue([d.w, d.h]);
    } else {
      var r = c.addProperty('ADBE Vector Shape - Rect');
      r.property('ADBE Vector Rect Size').setValue([d.w, d.h]);
      if (d.radius) {
        try { r.property('ADBE Vector Rect Roundness').setValue(d.radius); }
        catch (e) { warn('corner radius not applied: ' + d.name); }
      }
    }
    if (d.fill && d.fill.solid) {
      var f = c.addProperty('ADBE Vector Graphic - Fill');
      f.property('ADBE Vector Fill Color').setValue(d.fill.solid);
    }
    if (d.fill && d.fill.gradient) {
      var g = d.fill.gradient;
      var base = c.addProperty('ADBE Vector Graphic - Fill');
      base.property('ADBE Vector Fill Color').setValue([1, 1, 1, 1]);
      var ramp = l.Effects.addProperty('ADBE Ramp');
      ramp.property('Start Color').setValue(g.stops[0].color);
      ramp.property('End Color').setValue(g.stops[g.stops.length - 1].color);
      if (g.kind === 'radial') {
        ramp.property('Ramp Shape').setValue(2);
        ramp.property('Start of Ramp').setValue([0, 0]);
        ramp.property('End of Ramp').setValue([Math.max(d.w, d.h) / 2, 0]);
      } else {
        var rad = (g.angle * Math.PI) / 180;
        var dx = Math.sin(rad);
        var dy = -Math.cos(rad);
        var half = (Math.abs(d.w * dx) + Math.abs(d.h * dy)) / 2;
        ramp.property('Start of Ramp').setValue([-dx * half, -dy * half]);
        ramp.property('End of Ramp').setValue([dx * half, dy * half]);
      }
    }
    if (d.stroke && d.stroke.width > 0) {
      var s = c.addProperty('ADBE Vector Graphic - Stroke');
      s.property('ADBE Vector Stroke Color').setValue(d.stroke.color);
      s.property('ADBE Vector Stroke Width').setValue(d.stroke.width);
    }
    if (d.shadow) {
      var ds = l.Effects.addProperty('ADBE Drop Shadow');
      ds.property('Shadow Color').setValue([d.shadow.color[0], d.shadow.color[1], d.shadow.color[2], 1]);
      ds.property('Opacity').setValue(d.shadow.color[3] * 100);
      ds.property('Direction').setValue(d.shadow.direction);
      ds.property('Distance').setValue(d.shadow.distance);
      ds.property('Softness').setValue(d.shadow.softness);
    }
    place(l, d, 0, 0, d.x + d.w / 2, d.y + d.h / 2);
    report.shapes++;
  }

  function addText(d) {
    var l = comp.layers.addText(d.text);
    l.name = d.name;
    var src = l.property('Text').property('Source Text');
    var doc = src.value;
    var families = [d.font, d.font.split('-')[0], 'ArialMT', 'Arial'];
    for (var i = 0; i < families.length; i++) {
      try { doc.font = families[i]; break; } catch (e) {}
    }
    doc.fontSize = d.fontSize;
    doc.leading = d.leading;
    doc.tracking = d.tracking;
    doc.fillColor = [d.color[0], d.color[1], d.color[2]];
    try { doc.applyFill = true; } catch (e) {}
    try {
      doc.justification = d.align === 'center' ? ParagraphJustification.CENTER_JUSTIFY
        : d.align === 'right' ? ParagraphJustification.RIGHT_JUSTIFY
        : d.align === 'justify' ? ParagraphJustification.FULL_JUSTIFY
        : ParagraphJustification.LEFT_JUSTIFY;
    } catch (e) {}
    try {
      doc.boxText = true;
      doc.boxTextSize = [d.w, d.h];
      doc.boxTextPos = [0, 0];
    } catch (e) { warn('text box not applied: ' + d.name); }
    src.setValue(doc);
    place(l, d, d.w / 2, d.h / 2, d.x + d.w / 2, d.y + d.h / 2);
    report.texts++;
  }

  function addImage(d) {
    var io = new ImportOptions(new File(dir + '/' + d.file));
    io.importAs = ImportAsType.FOOTAGE;
    var item = app.project.importFile(io);
    item.name = d.name;
    if (!folder) {
      try { folder = app.project.items.addFolder(data.name + ' assets'); } catch (e) { folder = null; }
    }
    if (folder) { try { item.parentFolder = folder; } catch (e) {} }
    var l = comp.layers.add(item);
    l.name = d.name;
    var t = l.property('Transform');
    try { t.property('Anchor Point').setValue([d.pxW / 2, d.pxH / 2]); } catch (e) {}
    t.property('Position').setValue([d.x + d.w / 2, d.y + d.h / 2]);
    t.property('Scale').setValue([(d.w / d.pxW) * 100, (d.h / d.pxH) * 100]);
    if (d.opacity !== 1) { try { t.property('Opacity').setValue(d.opacity * 100); } catch (e) {} }
    report.images++;
  }

  for (var i = 0; i < data.layers.length; i++) {
    var d = data.layers[i];
    try {
      if (d.kind === 'text') addText(d);
      else if (d.kind === 'image') addImage(d);
      else addShape(d);
    } catch (e) {
      warn(d.name + ': ' + e);
    }
  }

  try { comp.openInViewer(); } catch (e) {}
  app.endUndoGroup();
  var out = ['Petals: ' + report.shapes + ' shape, ' + report.texts + ' text, ' + report.images + ' image layers'];
  for (var w = 0; w < report.warnings.length; w++) out.push('  ! ' + report.warnings[w]);
  writeLn(out.join('\\n'));
})();
`
}

/* ------------------------------ SVG ------------------------------ */

function svgTransform(s: Shape, b: Rect): string {
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  const parts: string[] = []
  if (s.flipX || s.flipY) parts.push(`translate(${fmt(cx)} ${fmt(cy)}) scale(${s.flipX ? -1 : 1} ${s.flipY ? -1 : 1}) translate(${fmt(-cx)} ${fmt(-cy)})`)
  if (s.rotation) parts.push(`rotate(${s.rotation} ${fmt(cx)} ${fmt(cy)})`)
  return parts.length ? ` transform="${parts.join(' ')}"` : ''
}

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
  const rot = svgTransform(s, b)

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
    const istroke = s.stroke ? ` stroke="${esc(s.stroke)}" stroke-width="${s.strokeWidth ?? 1}"` : ''
    out.push(
      `<image x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" preserveAspectRatio="${s.fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}" href="${esc(s.src).replace(/\n/g, '')}"${op}${rot}${styleAttr}${istroke}/>`,
    )
    return
  }
  if (s.type === 'text') {
    const fontSize = s.fontSize ?? 24
    const lh = fontSize * (s.lineHeight ?? 1.4)
    const anchor = s.align === 'center' ? 'middle' : s.align === 'right' ? 'end' : 'start'
    const tx = s.align === 'center' ? b.x + s.w / 2 : s.align === 'right' ? b.x + s.w : b.x
    const family = (s.fontFamily ?? UI_FONT).replace(/"/g, "'")
    // optional box fill behind the glyphs (solid fills only; gradients/ image fills not boxed here)
    if (s.fill && typeof s.fill === 'string') {
      const rr = s.radii || (s.radius ? { tl: s.radius, tr: s.radius, br: s.radius, bl: s.radius } : { tl: 0, tr: 0, br: 0, bl: 0 })
      out.push(`<rect x="${b.x}" y="${b.y}" width="${s.w}" height="${b.h}" rx="${Math.min(rr.tl, rr.tr, rr.br, rr.bl)}" fill="${esc(s.fill)}"${op}/>`)
    }
    const tstroke = s.stroke ? ` stroke="${esc(s.stroke)}" stroke-width="${s.strokeWidth ?? 1}" paint-order="stroke fill"` : ''
    const tspans = (s.text ?? '')
      .split('\n')
      .map((line, i) => `<tspan x="${tx}" y="${b.y + i * lh + fontSize * 0.82}">${esc(line)}</tspan>`)
      .join('')
    out.push(
      `<text font-family="${esc(family)}" font-size="${fontSize}" font-weight="${s.fontWeight ?? 500}"${s.letterSpacing ? ` letter-spacing="${s.letterSpacing}"` : ''} text-anchor="${anchor}" fill="${esc(s.color ?? '#ececf1')}"${tstroke}${op}${rot}${styleAttr}>${tspans}</text>`,
    )
    return
  }
}

/** Build the SVG document of the selection (null when nothing to export). */
export async function buildSelectionSVG(): Promise<string | null> {
  const snap = collectSelection()
  if (!snap) return null
  const { nodes, roots } = snap
  const valid = flatSelection(snap)
  const b = boundsOfRects(valid.map((s) => pageAABB(nodes, s)))
  if (!b || b.w <= 0 || b.h <= 0) return null

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

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(b.w)}" height="${Math.round(b.h)}" viewBox="${b.x} ${b.y} ${b.w} ${b.h}">${defs.join('')}${clips.join('')}${body.join('')}</svg>`
}

export async function exportSelectionSVG() {
  const snap = collectSelection()
  const svg = await buildSelectionSVG()
  if (!svg || !snap) return
  download(new Blob([svg], { type: 'image/svg+xml' }), `${sanitizeName(snap.nodes[snap.roots[0]]?.name, 'petals-export')}.svg`)
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
    s.rotation || s.flipX || s.flipY
      ? `gsave ${fmt(b.x + b.w / 2)} ${fmt(b.y + b.h / 2)} translate` +
        (s.rotation ? ` ${fmt(s.rotation)} rotate` : '') +
        (s.flipX || s.flipY ? ` ${s.flipX ? -1 : 1} ${s.flipY ? -1 : 1} scale` : '') +
        ` ${fmt(-(b.x + b.w / 2))} ${fmt(-(b.y + b.h / 2))} translate\n${body}\ngrestore\n`
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

  const name = sanitizeName(nodes[roots[0]]?.name, 'petals-export')
  const eps = [
    '%!PS-Adobe-3.0 EPSF-3.0',
    `%%BoundingBox: 0 0 ${W} ${Hh}`,
    `%%HiResBoundingBox: 0 0 ${fmt(b.w)} ${fmt(b.h)}`,
    '%%Creator: Petals',
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

/* ------------------------------ React + Tailwind code export ------------------------------ */

const CODE_FONT = "'Geist Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"

/** Turn a shape name into a legal JSX component name (PascalCase, identifier-safe). */
function pascalName(v: string | undefined): string {
  const s = (v ?? '')
    .trim()
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('')
  if (!s) return 'PetalsExport'
  if (!/^[A-Za-z]/.test(s)) return `Petals${s}`
  return s
}

const r1 = (v: number) => Math.round(v * 100) / 100
/** design-tool px are noisy; exported CSS should be whole pixels */
const px = (v: number) => Math.round(v)
/** standard Tailwind names exactly matching the v4 radius scale; arbitrary px otherwise */
function radiusClass(r: number): string | null {
  const m: Record<number, string> = { 2: 'rounded-xs', 4: 'rounded-sm', 6: 'rounded-md', 8: 'rounded-lg', 12: 'rounded-xl', 16: 'rounded-2xl', 24: 'rounded-3xl' }
  return m[Math.round(r)] ?? null
}

/** Node + Tailwind builders produce "class list" plus extra inline style entries. */
function tailwindFillClass(fill: Shape['fill']): string | null {
  if (typeof fill === 'string') {
    if (!fill || fill === 'transparent' || fill === 'none') return null
    return `bg-[${fill.toLowerCase()}]`
  }
  return null
}

function tailwindGradientStyle(fill: Shape['fill']): string | null {
  if (!fill || typeof fill === 'string' || fill.type === 'image') return null
  const css = fillToCss(fill)
  return css && css !== 'transparent' ? `background: '${css.replace(/'/g, "\\'")}'` : null
}

function codeBoxShadow(s: Shape): string | null {
  const parts: string[] = []
  const outer = shadowToCss(s.shadow)
  if (outer) parts.push(outer)
  const inner = shadowToCss(s.innerShadow, true)
  if (inner) parts.push(inner)
  return parts.length ? `boxShadow: '${parts.join(', ').replace(/'/g, "\\'")}'` : null
}

/** An image the zip export will ship as a real file (`import image1 from ...`). */
type CodeAsset = { imp: string; file: string }

/**
 * Emit JSX for one shape; ret = lines pushed with `ind` as base indentation.
 * `ox/oy` is the container origin in page space, `flow` set when the shape is
 * a flex item inside an auto-layout frame (then absolute + offsets are gone),
 * `standalone` for a single-shape export (no positioning at all).
 */
function codeEmit(
  nodes: Record<string, Shape>,
  s: Shape,
  ox: number,
  oy: number,
  ind: string,
  lines: string[],
  assets?: Map<string, CodeAsset>,
  flow?: 'v' | 'h',
  standalone?: boolean,
) {
  if (!s.visible || s.opacity === 0) return
  const cls: string[] = []
  const css: string[] = []
  const left = px(ox + s.x)
  const top = px(oy + s.y)

  // geometry: local coordinates after the container origin (ox/oy is page-space)
  if (s.type === 'line') {
    const e = lineEnds(s)
    const len = Math.hypot(e.x2 - e.x1, e.y2 - e.y1) || 1
    const angle = (Math.atan2(e.y2 - e.y1, e.x2 - e.x1) * 180) / Math.PI
    cls.push('absolute')
    if (left) cls.push(`left-[${left}px]`)
    if (top) cls.push(`top-[${top}px]`)
    cls.push(`h-[${px(s.strokeWidth ?? 2)}px]`, `w-[${px(len)}px]`, 'transform-gpu', 'origin-left')
    cls.push('rounded-full')
    if (angle) cls.push(`rotate-[${px(angle)}deg]`)
    if (s.stroke) cls.push(`bg-[${s.stroke.toLowerCase()}]`)
  } else if (!flow) {
    if (!standalone) cls.push('absolute')
    if (!standalone) {
      // dropped when 0: an absolutely positioned element starts at the container origin
      if (left) cls.push(`left-[${left}px]`)
      if (top) cls.push(`top-[${top}px]`)
    }
    cls.push(`w-[${px(s.w)}px]`, `h-[${px(s.h)}px]`)
  } else {
    // flow item: fills replace the fixed main/cross size (main = w in a row, h in a column)
    if (s.mainFill) cls.push('flex-1')
    else cls.push(flow === 'h' ? `w-[${px(s.w)}px]` : `h-[${px(s.h)}px]`)
    if (s.crossFill) cls.push('self-stretch')
    else cls.push(flow === 'h' ? `h-[${px(s.h)}px]` : `w-[${px(s.w)}px]`)
  }
  if (s.type !== 'line') {
    const radii = cornersOf(s)
    const uniform = radii.every((v) => Math.abs(v - radii[0]) < 1e-6)
    if (uniform) {
      if (radii[0] > 0) {
        const rCls = radiusClass(radii[0])
        cls.push(s.type === 'ellipse' ? 'rounded-full' : (rCls ?? `rounded-[${px(radii[0])}px]`))
      } else if (s.type === 'ellipse') cls.push('rounded-full')
    } else {
      css.push(
        `borderRadius: '${px(radii[0])}px ${px(radii[1])}px ${px(radii[2])}px ${px(radii[3])}px'`,
      )
    }
    const solid = tailwindFillClass(s.fill)
    if (solid) cls.push(solid)
    else if (s.type !== 'image') {
      const grad = tailwindGradientStyle(s.fill)
      if (grad) css.push(grad)
    }
    if (s.rotation) cls.push(`rotate-[${px(s.rotation)}deg]`)
    if (s.flipX || s.flipY) {
      const sx = s.flipX ? -1 : 1
      const sy = s.flipY ? -1 : 1
      const scale = sx === sy ? `${sx}` : `${sx}, ${sy}`
      css.push('transform: ' + (s.rotation ? `'scale(${scale}) rotate(${px(s.rotation)}deg)'` : `'scale(${scale})'`))
    }
  }
  if (s.opacity < 1) css.push(`opacity: ${r1(s.opacity)}`)
  const shadow = codeBoxShadow(s)
  if (shadow) css.push(shadow)
  if (s.filters && Object.keys(s.filters).length) {
    const f = filtersToCss(s.filters)
    if (f) css.push(`filter: '${f.replace(/'/g, "\\'")}'`)
  }
  if (s.stroke && s.type !== 'line') css.push(`border: '${px(s.strokeWidth ?? 1)}px solid ${s.stroke}'`)

  const styleAttr = css.length ? ` style={{ ${css.join(', ')} }}` : ''
  const open = (tag: string, extra = '') => {
    const ca = cls.length ? ` className="${cls.join(' ')}"` : ''
    return `${ind}<${tag}${ca}${extra}${styleAttr}`
  }

  if (s.type === 'frame') {
    cls.push('relative')
    if (s.clip) cls.push('overflow-hidden')
    if (s.layoutFlow) {
      cls.push('flex', s.layoutFlow === 'v' ? 'flex-col' : 'flex-row')
      const main = s.layoutMain === 1 ? 'justify-center' : s.layoutMain === 2 ? 'justify-end' : 'justify-start'
      const cross = s.layoutCross === 1 ? 'items-center' : s.layoutCross === 2 ? 'items-end' : 'items-start'
      cls.push(main, cross)
      if (s.gap) cls.push(`gap-[${px(s.gap)}px]`)
      if (s.sizingMain === 'hug') {
        // the hugged axis sizes from content: drop the fixed class
        const drop = s.layoutFlow === 'v' ? `h-[${px(s.h)}px]` : `w-[${px(s.w)}px]`
        const i = cls.indexOf(drop)
        if (i >= 0) cls.splice(i, 1)
      }
    }
    const m = s.margin
    if (m) {
      const vals = [m.t, m.r, m.b, m.l]
      if (vals.every((v) => v > 0 && v === vals[0])) cls.push(`p-[${px(vals[0])}px]`)
      else {
        if (m.t > 0) cls.push(`pt-[${px(m.t)}px]`)
        if (m.r > 0) cls.push(`pr-[${px(m.r)}px]`)
        if (m.b > 0) cls.push(`pb-[${px(m.b)}px]`)
        if (m.l > 0) cls.push(`pl-[${px(m.l)}px]`)
      }
    }
    const kids: string[] = []
    for (const c of childrenSortedOf(nodes, s.id)) {
      // free children live in the frame's margin-inset content box; flex children don't need coords
      codeEmit(
        nodes,
        c,
        s.layoutFlow ? ox + s.x : ox + s.x + (m?.l ?? 0),
        s.layoutFlow ? oy + s.y : oy + s.y + (m?.t ?? 0),
        ind + '  ',
        kids,
        assets,
        (s.layoutFlow ?? undefined) as 'v' | 'h' | undefined,
      )
    }
    if (!kids.length) {
      lines.push(`${open('div')} />`)
    } else {
      lines.push(`${open('div')}>`)
      lines.push(...kids)
      lines.push(`${ind}</div>`)
    }
    return lines
  }

  if (s.type === 'image') {
    const fit = (s.fit ?? 'cover') === 'contain' ? 'object-contain' : 'object-cover'
    const all = cls.concat([fit])
    const asset = assets ? assets.get(s.src ?? '') : undefined
    const srcAttr = asset ? `{${asset.imp}}` : `"${(s.src ?? '').replace(/"/g, '&quot;')}"`
    lines.push(`${ind}<img${all.length ? ` className="${all.join(' ')}"` : ''}${styleAttr} src=${srcAttr} />`)
    return lines
  }
  if (s.type === 'text') {
    const fontSize = s.fontSize ?? 24
    css.push(`fontSize: '${px(fontSize)}px'`, `fontWeight: ${s.fontWeight ?? 500}`)
    if (s.color) css.push(`color: '${s.color}'`)
    if (s.lineHeight && s.lineHeight !== 1.4) css.push(`lineHeight: ${r1(s.lineHeight)}`)
    if (s.letterSpacing) css.push(`letterSpacing: '${px(s.letterSpacing)}px'`)
    if (s.align && s.align !== 'left') css.push(`textAlign: '${s.align}'`)
    css.push(`fontFamily: "${CODE_FONT.replace(/"/g, "'")}"`)
    cls.push('whitespace-pre-wrap')
    const cab = cls.length ? ` className="${cls.join(' ')}"` : ''
    const styleAttrText = ` style={{ ${css.join(', ')} }}`
    lines.push(`${ind}<p${cab}${styleAttrText}>{${JSON.stringify(s.text ?? '')}}</p>`)
    return lines
  }

  lines.push(`${open('div')} />`)
  return lines
}

/**
 * React + Tailwind JSX for the current selection (frames as relative boxes,
 * shapes as absolute children). Auto-layout frames emit flex + gap + padding
 * instead of absolute children. `assets` swaps image data URLs for imports.
 */
export function buildSelectionCode(assets?: Map<string, CodeAsset>): string | null {
  const snap = collectSelection()
  if (!snap) return null
  const { nodes, roots } = snap
  const valid = flatSelection(snap)
  const b = boundsOfRects(valid.map((s) => pageAABB(nodes, s)))
  if (!b || b.w <= 0 || b.h <= 0) return null
  const name = pascalName(nodes[roots[0]]?.name)
  // a single root IS the exported component; a wrapper would be redundant
  const standalone = roots.length === 1

  const lines: string[] = ['// Generated by Petals — paste into your React + Tailwind project.']
  if (assets) {
    for (const a of assets.values()) lines.push(`import ${a.imp} from './assets/${a.file}'`)
    lines.push('')
  }
  lines.push(`export default function ${name}() {`)
  lines.push('  return (')
  if (standalone) {
    codeEmit(nodes, nodes[roots[0]], 0, 0, '    ', lines, assets, undefined, true)
  } else {
    lines.push(`    <div className="relative w-[${px(b.w)}px] h-[${px(b.h)}px]">`)
    for (const root of roots) codeEmit(nodes, nodes[root], -b.x, -b.y, '      ', lines, assets)
    lines.push('    </div>')
  }
  lines.push('  )')
  lines.push('}')
  return lines.join('\n') + '\n'
}

async function copyBlobToClipboard(blob: Blob): Promise<boolean> {
  try {
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
    return true
  } catch {
    return false
  }
}

/** Copy the selection as a PNG straight to the system clipboard (falls back to download). */
export async function copySelectionPNG(scale = 2): Promise<void> {
  const snap = collectSelection()
  if (!snap) return
  const name = sanitizeName(snap.nodes[snap.roots[0]]?.name, 'petals-export')
  const blob = await rasterBlob('png', scale)
  if (!blob) return
  if (!(await copyBlobToClipboard(blob))) download(blob, `${name}.png`)
}

/** Copy the selection as an SVG document to the system clipboard (falls back to download). */
export async function copySelectionSVG(): Promise<void> {
  const svg = await buildSelectionSVG()
  if (!svg) return
  try {
    await navigator.clipboard.writeText(svg)
  } catch {
    download(new Blob([svg], { type: 'image/svg+xml' }), 'petals-export.svg')
  }
}

/** Download the selection as a zip: Component.tsx + real image files under assets/. */
export async function exportSelectionCodeZip(): Promise<void> {
  const snap = collectSelection()
  if (!snap) return
  const assets: Map<string, CodeAsset> = new Map()
  const files: Array<{ name: string; data: Uint8Array }> = []
  const seen = new Set<string>()
  let n = 0
  for (const s of flatSelection(snap)) {
    if (s.type !== 'image' || !s.src || seen.has(s.src)) continue
    seen.add(s.src)
    const bytes = await imageFileBytes(s.src)
    if (!bytes) continue
    n++
    const file = `image-${n}.${extFromSrc(s.src)}`
    assets.set(s.src, { imp: `image${n}`, file })
    files.push({ name: 'assets/' + file, data: bytes })
  }
  const code = buildSelectionCode(assets)
  if (!code) return
  files.unshift({ name: 'Component.tsx', data: new TextEncoder().encode(code) })
  const name = sanitizeName(snap.nodes[snap.roots[0]]?.name, 'petals-export')
  download(buildZipArchive(files), `${name}.zip`)
}

/** Copy the React + Tailwind JSX of the selection to the system clipboard (falls back to download). */
export async function copySelectionCode(): Promise<void> {
  const code = buildSelectionCode()
  if (!code) return
  try {
    await navigator.clipboard.writeText(code)
  } catch {
    download(new Blob([code], { type: 'text/plain' }), 'petals-export.tsx')
  }
}

/* --------------------------------- zip --------------------------------- */

let ZIP_CRC_TABLE: Uint32Array | null = null
function zipCrc(data: Uint8Array): number {
  if (!ZIP_CRC_TABLE) {
    const t = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[i] = c >>> 0
    }
    ZIP_CRC_TABLE = t
  }
  let crc = ~0
  for (let i = 0; i < data.length; i++) crc = (crc >>> 8) ^ ZIP_CRC_TABLE[(crc ^ data[i]) & 0xff]
  return ~crc >>> 0
}

/** Minimal STORE-method zip (no compression) so exports carry real image files. */
function buildZipArchive(files: Array<{ name: string; data: Uint8Array }>): Blob {
  const time = 0x4800 // fixed DOS timestamp so builds are reproducible
  const date = 0x5821
  const enc = new TextEncoder()
  const local: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  for (const f of files) {
    const name = enc.encode(f.name)
    const size = f.data.length
    const crc = zipCrc(f.data)
    const hdr = new Uint8Array(30 + name.length)
    const v = new DataView(hdr.buffer)
    v.setUint32(0, 0x04034b50, true)
    v.setUint16(4, 20, true) // zip version
    v.setUint16(6, 0x0800, true) // UTF-8 names
    v.setUint16(8, 0, true) // STORE
    v.setUint16(10, time, true)
    v.setUint16(12, date, true)
    v.setUint32(14, crc, true)
    v.setUint32(18, size, true)
    v.setUint32(22, size, true)
    v.setUint16(26, name.length, true)
    hdr.set(name, 30)
    local.push(hdr, f.data)
    const c = new Uint8Array(46 + name.length)
    const cv = new DataView(c.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(8, 0x0800, true)
    cv.setUint16(10, 0, true)
    cv.setUint16(12, time, true)
    cv.setUint16(14, date, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, size, true)
    cv.setUint32(24, size, true)
    cv.setUint16(28, name.length, true)
    cv.setUint32(42, offset, true)
    c.set(name, 46)
    central.push(c)
    offset += hdr.length + size
  }
  const cSize = central.reduce((a, c) => a + c.length, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, files.length, true)
  ev.setUint16(10, files.length, true)
  ev.setUint32(12, cSize, true)
  ev.setUint32(16, offset, true)
  return new Blob([...local, ...central, end] as BlobPart[], { type: 'application/zip' })
}

function extFromSrc(src: string): string {
  const m = /^data:image\/([\w.+-]+)[;,]/.exec(src)
  const kind = m?.[1] ?? 'png'
  if (kind === 'jpeg') return 'jpg'
  if (kind === 'svg+xml') return 'svg'
  return kind.split('.')[0] || 'png'
}

/** Image source → raw file bytes: base64 for data URLs, fetch for the rest. */
async function imageFileBytes(src: string): Promise<Uint8Array | null> {
  try {
    if (src.startsWith('data:')) {
      const b64 = src.slice(src.indexOf(',') + 1)
      const bin = atob(b64)
      const out = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
      return out
    }
    const r = await fetch(src)
    if (!r.ok) return null
    return new Uint8Array(await r.arrayBuffer())
  } catch {
    return null
  }
}
