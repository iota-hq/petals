import type { Shape } from '@/model/types'
import { boundsOfRects, lineEnds, pageAABB, selectionRoots, subtreeIds } from '@/model/geometry'
import type { Rect } from '@/model/geometry'
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

function childrenSortedOf(nodes: Record<string, Shape>, parentId: string): Shape[] {
  const out: Shape[] = []
  for (const s of Object.values(nodes)) if (s.parentId === parentId) out.push(s)
  out.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
  return out
}

function selectionSnapshot(): { nodes: Record<string, Shape>; roots: string[] } | null {
  const { nodes } = useDoc.getState()
  const roots = selectionRoots(nodes, useUi.getState().selection)
  if (!roots.length) return null
  return { nodes, roots }
}

/* ------------------------------ PNG ------------------------------ */

async function paintShape(
  ctx: CanvasRenderingContext2D,
  nodes: Record<string, Shape>,
  s: Shape,
  images: Map<string, HTMLImageElement | null>,
  ox: number,
  oy: number,
) {
  if (!s.visible || s.opacity === 0) return
  ctx.save()
  ctx.globalAlpha = s.opacity

  if (s.type === 'frame') {
    const b = absBox(s, ox, oy)
    if (s.fill && s.fill !== 'transparent') {
      ctx.fillStyle = s.fill
      if (s.radius) {
        ctx.beginPath()
        ctx.roundRect(b.x, b.y, b.w, b.h, s.radius)
        ctx.fill()
      } else ctx.fillRect(b.x, b.y, b.w, b.h)
    }
    if (s.clip) {
      ctx.beginPath()
      ctx.rect(b.x, b.y, b.w, b.h)
      ctx.clip()
    }
    for (const c of childrenSortedOf(nodes, s.id)) paintShape(ctx, nodes, c, images, ox + s.x, oy + s.y)
    ctx.restore()
    return
  }

  if (s.type === 'rect') {
    const b = absBox(s, ox, oy)
    const r = Math.min(s.radius ?? 0, Math.min(b.w, b.h) / 2)
    ctx.beginPath()
    ctx.roundRect(b.x, b.y, b.w, b.h, r)
    if (s.fill && s.fill !== 'transparent') {
      ctx.fillStyle = s.fill
      ctx.fill()
    }
    if (s.stroke) {
      ctx.lineWidth = s.strokeWidth ?? 1
      ctx.strokeStyle = s.stroke
      ctx.stroke()
    }
    ctx.restore()
    return
  }

  if (s.type === 'ellipse') {
    const b = absBox(s, ox, oy)
    ctx.beginPath()
    ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, Math.max(0.5, b.w / 2), Math.max(0.5, b.h / 2), 0, 0, Math.PI * 2)
    if (s.fill && s.fill !== 'transparent') {
      ctx.fillStyle = s.fill
      ctx.fill()
    }
    if (s.stroke) {
      ctx.lineWidth = s.strokeWidth ?? 1
      ctx.strokeStyle = s.stroke
      ctx.stroke()
    }
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
    const src = s.src
    const img = src ? (images.get(src) ?? (await loadImage(src).then((i) => (images.set(src, i), i)))) : null
    if (img) {
      const iw = img.naturalWidth
      const ih = img.naturalHeight
      const fit = s.fit ?? 'cover'
      let sx = 0
      let sy = 0
      let sw = iw
      let sh = ih
      if (fit === 'cover') {
        const scale = Math.max(b.w / iw, b.h / ih)
        sw = b.w / scale
        sh = b.h / scale
        sx = (iw - sw) / 2
        sy = (ih - sh) / 2
      }
      ctx.beginPath()
      ctx.roundRect(b.x, b.y, b.w, b.h, s.radius ?? 0)
      ctx.save()
      if (s.radius) {
        ctx.clip()
        ctx.drawImage(img, sx, sy, sw, sh, b.x, b.y, b.w, b.h)
      } else {
        ctx.drawImage(img, sx, sy, sw, sh, b.x, b.y, b.w, b.h)
      }
      ctx.restore()
    }
    ctx.restore()
    return
  }

  if (s.type === 'text') {
    const b = absBox(s, ox, oy)
    const fontSize = s.fontSize ?? 24
    const lh = fontSize * (s.lineHeight ?? 1.4)
    ctx.font = `${s.fontWeight ?? 500} ${fontSize}px ${s.fontFamily ?? UI_FONT}`
    ctx.fillStyle = s.color ?? '#ececf1'
    ctx.textBaseline = 'top'
    const words = (s.text ?? '').split('\n')
    const lines: string[] = []
    for (const raw of words) {
      let line = raw
      // width-only wrap emulation
      if (s.w > 0 && ctx.measureText(line).width > s.w) {
        line = ''
        for (const w of raw.split(' ')) {
          const test = line ? `${line} ${w}` : w
          if (line && ctx.measureText(test).width > s.w) {
            lines.push(line)
            line = w
          } else line = test
        }
      }
      if (line) lines.push(line)
    }
    lines.forEach((line, i) => {
      const tw = ctx.measureText(line).width
      const x = b.x + (s.align === 'center' ? (s.w - tw) / 2 : s.align === 'right' ? s.w - tw : 0)
      ctx.fillText(line, x, b.y + i * lh)
    })
    ctx.restore()
    return
  }

  ctx.restore()
}

export async function exportSelectionPNG(scale = 2) {
  const snap = selectionSnapshot()
  if (!snap) return
  const { nodes, roots } = snap
  const all: Shape[] = []
  for (const r of roots) {
    all.push(nodes[r])
    for (const d of subtreeIds(nodes, [r])) {
      if (d !== r) all.push(nodes[d])
    }
  }
  const valid = all.filter(Boolean)
  const b = boundsOfRects(valid.map((s) => pageAABB(nodes, s)))
  if (!b || b.w <= 0 || b.h <= 0) return

  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(b.w * scale))
  c.height = Math.max(1, Math.round(b.h * scale))
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.scale(scale, scale)
  // pre-load images
  const srcs = new Set(valid.map((s) => s.src).filter(Boolean) as string[])
  const images = new Map<string, HTMLImageElement | null>()
  await Promise.all(Array.from(srcs).map(async (src) => images.set(src, await loadImage(src))))
  for (const root of roots) {
    const s = nodes[root]
    if (s) await paintShape(ctx, nodes, s, images, 0, 0)
  }

  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'))
  if (!blob) return
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${sanitizeName(nodes[roots[0]]?.name, 'petal-export')}.png`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}

/* ------------------------------ SVG ------------------------------ */

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function shapeToSvg(
  nodes: Record<string, Shape>,
  s: Shape,
  ox: number,
  oy: number,
  out: string[],
  clips: string[],
  clipIndex: { n: number },
) {
  if (!s.visible || s.opacity === 0) return
  const b = absBox(s, ox, oy)
  const op = s.opacity < 1 ? ` opacity="${s.opacity}"` : ''
  const stroke = s.stroke ? ` stroke="${esc(s.stroke)}" stroke-width="${s.strokeWidth ?? 1}"` : ''

  if (s.type === 'frame') {
    let clipAttr = ''
    if (s.clip) {
      const id = `clip${clipIndex.n++}`
      const rx = s.radius ? ` rx="${s.radius}"` : ''
      clips.push(`<clipPath id="${id}"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"${rx}/></clipPath>`)
      clipAttr = ` clip-path="url(#${id})"`
    }
    const fill = s.fill && s.fill !== 'transparent' ? ` fill="${esc(s.fill)}"` : ' fill="none"'
    const rx = s.radius ? ` rx="${Math.min(s.radius, Math.min(b.w, b.h) / 2)}"` : ''
    out.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"${rx}${fill}${stroke ? stroke.replace('stroke-width', 'stroke-width') : ''}${op}${clipAttr}/>`)
    for (const c of childrenSortedOf(nodes, s.id)) shapeToSvg(nodes, c, ox + s.x, oy + s.y, out, clips, clipIndex)
    return
  }
  if (s.type === 'rect') {
    const fill = s.fill && s.fill !== 'transparent' ? ` fill="${esc(s.fill)}"` : ' fill="none"'
    out.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${Math.min(s.radius ?? 0, Math.min(b.w, b.h) / 2)}"${fill}${stroke}${op}/>`)
    return
  }
  if (s.type === 'ellipse') {
    const fill = s.fill && s.fill !== 'transparent' ? ` fill="${esc(s.fill)}"` : ' fill="none"'
    out.push(`<ellipse cx="${b.x + b.w / 2}" cy="${b.y + b.h / 2}" rx="${Math.max(0.5, b.w / 2)}" ry="${Math.max(0.5, b.h / 2)}"${fill}${stroke}${op}/>`)
    return
  }
  if (s.type === 'line') {
    const e = lineEnds(s)
    out.push(`<line x1="${ox + e.x1}" y1="${oy + e.y1}" x2="${ox + e.x2}" y2="${oy + e.y2}" stroke="${esc(s.stroke ?? '#ececf1')}" stroke-width="${s.strokeWidth ?? 2}" stroke-linecap="round"${op}/>`)
    return
  }
  if (s.type === 'image' && s.src) {
    out.push(`<image x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" preserveAspectRatio="${s.fit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice'}" href="${s.src}"${s.radius ? ` clip-path="url(#clipr)"` : ''}${op}/>`)
    if (s.radius) out.push(`<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${s.radius}" fill="none"/>`)
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
    out.push(`<text font-family="${esc(family)}" font-size="${fontSize}" font-weight="${s.fontWeight ?? 500}" text-anchor="${anchor}" fill="${esc(s.color ?? '#ececf1')}"${op}>${tspans}</text>`)
    return
  }
}

export function exportSelectionSVG() {
  const snap = selectionSnapshot()
  if (!snap) return
  const { nodes, roots } = snap
  const all: Shape[] = []
  for (const r of roots) {
    all.push(nodes[r])
    for (const d of subtreeIds(nodes, [r])) if (d !== r) all.push(nodes[d])
  }
  const valid = all.filter(Boolean)
  const b = boundsOfRects(valid.map((s) => pageAABB(nodes, s)))
  if (!b || b.w <= 0 || b.h <= 0) return

  const body: string[] = []
  const clips: string[] = []
  const clipIndex = { n: 0 }
  for (const root of roots) shapeToSvg(nodes, nodes[root], 0, 0, body, clips, clipIndex)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(b.w)}" height="${Math.round(b.h)}" viewBox="${b.x} ${b.y} ${b.w} ${b.h}">${clips.join('')}${body.join('')}</svg>`

  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${sanitizeName(nodes[roots[0]]?.name, 'petal-export')}.svg`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}
