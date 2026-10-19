/**
 * SVG plumbing for the asset library: sanitise markup that arrives from a CDN, read the
 * colours it actually paints with, and repaint it. Those three things are what turn an
 * inserted logo from a frozen picture into something you can edit on the canvas.
 *
 * Adapted from iOTA-WIP (`lib/svg/parse.ts`, `lib/svg/palette.ts`), this project's own
 * earlier codebase — no third-party code is involved.
 */

const NS = 'http://www.w3.org/2000/svg'
/** Everything that paints: what we can read a colour from, and rewrite. */
const DRAWABLE = 'path,line,polyline,polygon,circle,ellipse,rect'

export interface ParsedSvg {
  /** sanitised markup: no scripts, no event handlers, a viewBox, and no fixed size */
  markup: string
  viewBox: string
  width: number
  height: number
}

/** A self-contained SVG data URL. `fillToCss` strips newlines, so nothing needs escaping. */
export function svgDataUrl(markup: string): string {
  const bytes = new TextEncoder().encode(markup)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return `data:image/svg+xml;base64,${btoa(bin)}`
}

/** `#rrggbb` for a solid colour; null for everything we cannot meaningfully replace. */
export function normalizeColor(color: string): string | null {
  const v = color.trim().toLowerCase()
  if (!v || v === 'none' || v === 'transparent' || v === 'currentcolor' || v.startsWith('url(')) return null
  if (/^#[0-9a-f]{3}$/.test(v)) return '#' + [...v.slice(1)].map((c) => c + c).join('')
  if (/^#[0-9a-f]{6}$/.test(v)) return v
  const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(v)
  if (!m) return null
  return '#' + [1, 2, 3].map((i) => Math.round(Number(m[i])).toString(16).padStart(2, '0')).join('')
}

function resolveViewBox(root: Element): string {
  const vb = root.getAttribute('viewBox')
  if (vb && vb.split(/[\s,]+/).filter(Boolean).length === 4) return vb.trim()
  const w = parseFloat(root.getAttribute('width') ?? '') || 100
  const h = parseFloat(root.getAttribute('height') ?? '') || 100
  return `0 0 ${w} ${h}`
}

/** Drop anything that could execute, phone home, or hide behind a handler. */
function sanitize(root: Element) {
  for (const bad of root.querySelectorAll('script, foreignObject')) bad.remove()
  for (const el of root.querySelectorAll('*')) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      if (name.startsWith('on')) el.removeAttribute(attr.name)
      else if ((name === 'href' || name === 'xlink:href') && !attr.value.trim().startsWith('#')) el.removeAttribute(attr.name)
    }
  }
}

/** Parse and sanitise an SVG string; null when it is not usable SVG. */
export function parseSvg(source: string): ParsedSvg | null {
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml')
  if (doc.querySelector('parsererror')) return null
  const root = doc.querySelector('svg')
  if (!root) return null
  sanitize(root)
  const viewBox = resolveViewBox(root)
  const [, , w, h] = viewBox.split(/\s+/).map(Number)
  // The shape's own sizing should win, so a fixed width/height on the root has to go;
  // the viewBox is what keeps the art proportional.
  root.removeAttribute('width')
  root.removeAttribute('height')
  if (!root.getAttribute('xmlns')) root.setAttribute('xmlns', NS)
  return {
    markup: new XMLSerializer().serializeToString(root),
    viewBox,
    width: w || 100,
    height: h || 100,
  }
}

/**
 * Attach the markup to the document off-screen so the browser resolves inheritance,
 * `currentColor` and presentation attributes exactly as it will when painting. Forced to
 * black text colour: that is what `currentColor` resolves to inside an `<img>`, and the
 * colour swatches would otherwise disagree with what is on the canvas.
 */
function mount(markup: string): SVGSVGElement | null {
  const parsed = parseSvg(markup)
  if (!parsed) return null
  const host = document.createElementNS(NS, 'svg')
  host.setAttribute('viewBox', parsed.viewBox)
  host.innerHTML = parsed.markup.replace(/^<svg[^>]*>|<\/svg>$/g, '')
  host.setAttribute('style', 'position:fixed;left:-99999px;top:0;width:64px;height:64px;opacity:0;pointer-events:none;color:#000')
  document.body.appendChild(host)
  return host
}

const colorCache = new Map<string, string[]>()

/**
 * The distinct colours the art paints with, in the order they appear — the swatch row the
 * logo inspector edits, one per part colour.
 */
export function svgColors(markup: string): string[] {
  const hit = colorCache.get(markup)
  if (hit) return hit
  const host = mount(markup)
  const out: string[] = []
  if (host) {
    const seen = new Set<string>()
    for (const el of host.querySelectorAll(DRAWABLE)) {
      const cs = getComputedStyle(el)
      for (const raw of [cs.fill, cs.stroke]) {
        const hex = normalizeColor(raw)
        if (hex && !seen.has(hex)) {
          seen.add(hex)
          out.push(hex)
        }
      }
    }
    host.remove()
  }
  // A token cache, not a store: the library only ever shows a handful at once.
  if (colorCache.size > 24) colorCache.clear()
  colorCache.set(markup, out)
  return out
}

/**
 * Repaint the art. `mono` gives every part one colour; otherwise `palette` replaces
 * individual colours, keyed by the original. Always applied to the pristine source, so
 * edits never compound.
 */
export function recolorSvg(markup: string, opts: { mono?: string; palette?: Record<string, string> }): string {
  const mono = opts.mono?.trim()
  const palette = opts.palette
  if (!mono && (!palette || !Object.keys(palette).length)) return markup
  const host = mount(markup)
  if (!host) return markup
  for (const el of host.querySelectorAll(DRAWABLE)) {
    const cs = getComputedStyle(el)
    for (const kind of ['fill', 'stroke'] as const) {
      const computed = kind === 'fill' ? cs.fill : cs.stroke
      const original = normalizeColor(computed)
      if (!original) continue
      const next = mono ?? palette?.[original]
      if (next) el.setAttribute(kind, next)
    }
  }
  host.removeAttribute('style')
  const out = new XMLSerializer().serializeToString(host)
  host.remove()
  return out
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Fetch markup from a CDN, as text. Null on any failure, so callers can fall back.
 *
 * `retries` is for one particular partner. Iconify throttles bursts of its SVG endpoint with
 * a 429, and a grid of thumbnails is exactly a burst, so a fetch that follows one is worth
 * re-asking for — with a widening gap, so the retry cannot be what keeps the limiter hot. A
 * 404 is never retried: that answer will not change.
 */
export async function fetchSvgText(url: string, retries = 0): Promise<string | null> {
  for (let attempt = 0; ; attempt++) {
    let worthRetrying = false
    try {
      const res = await fetch(url)
      if (res.ok) return await res.text()
      worthRetrying = res.status === 429 || res.status >= 500
    } catch {
      worthRetrying = true // no answer at all: offline, DNS, or blocked
    }
    if (!worthRetrying || attempt >= retries) return null
    await wait(500 * (attempt + 1))
  }
}
