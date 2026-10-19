/**
 * Iconify's public API — the collection behind icones.js.org: roughly 300,000 icons across
 * 200+ open-source sets, searchable from the browser with no key and no proxy (the CDN sends
 * `access-control-allow-origin: *` and caches for a week).
 *
 * Deliberately *not* the icones.js.org approach. Icones is fast because it downloads the
 * entire catalogue at build time — `@iconify/json` is about 500 MB unpacked — and searches it
 * locally. That is the wrong trade for an editor that should stay light: here the search
 * endpoint is queried on demand and results are memoised per session.
 *
 * ## Why the drawings come from the collection endpoint, not the SVG endpoint
 *
 * Iconify's obvious way to get one icon is its **SVG generator** — `/{prefix}/{name}.svg` — and
 * that is the endpoint it rate-limits: a grid of thumbnails is one request per icon, a burst
 * trips a 429 per address, and the block then lasts for hours (search keeps answering 200 while
 * every generated SVG is refused). The generator is also per-icon by nature, so nothing can be
 * batched.
 *
 * The **collection endpoint** — `/{prefix}.json?icons=a,b,c` — answers the same drawings out of
 * CDN-cached data, and takes a whole batch of names at once. So a search for 32 icons spread
 * over a dozen sets costs a dozen requests instead of 32, the drawings arrive *with* the search
 * rather than on click, thumbnails are data URLs that cannot fail to load, and clicking an icon
 * needs no network call at all. The markup it returns is Iconify's raw icon body, which is
 * sanitised and inlined like any other logo.
 *
 * Heavy or production use is what their self-hosted API is for:
 * https://iconify.design/docs/api/hosting.html
 */

import { parseSvg } from './svg'

const API = 'https://api.iconify.design'
/** The API clamps `limit` to 32..999; below 32 it silently returns 32. */
const DEFAULT_LIMIT = 32
/** The size an icon falls back to when neither it nor its set declares a box (Iconify's spec). */
const FALLBACK_BOX = 16
/** A name list travels in the query string, so it is sent in shippable slices. */
const BATCH = 100
/** An alias pointing at an alias is legal; Iconify's own tools follow a few links, then stop. */
const ALIAS_DEPTH = 3

export interface IconHit {
  /** `prefix:name`, the canonical Iconify id */
  id: string
  prefix: string
  name: string
}

/** Raised when Iconify refuses us — throttled (429), down, or unreachable. */
export class IconifyUnavailable extends Error {
  constructor(readonly status: number) {
    super(status ? `iconify ${status}` : 'iconify unreachable')
    this.name = 'IconifyUnavailable'
  }
}

/**
 * One icon's drawing, as Iconify's data spec describes it. `left`/`top` move the art outside
 * its box and `rotate`/`hFlip`/`vFlip` turn it; a search hit almost never uses the latter two
 * (none of 376 icons sampled across 28 sets did), so they are carried but nothing depends on
 * them.
 */
interface IconBody {
  body: string
  width?: number
  height?: number
  rotate?: number
  hFlip?: boolean
  vFlip?: boolean
}

interface IconSetData {
  prefix: string
  width?: number
  height?: number
  icons?: Record<string, IconBody>
  aliases?: Record<string, IconBody & { parent: string }>
}

/** What has been fetched of one set so far, by name — the session's slice of the catalogue. */
interface SetSlice {
  width?: number
  height?: number
  icons: Map<string, IconBody>
  aliases: Map<string, IconBody & { parent: string }>
}

function toHit(id: string): IconHit {
  const [prefix, ...rest] = id.split(':')
  const name = rest.join(':') || prefix
  return { id, prefix, name }
}

/** `arrow-left-circle` → `Arrow left circle` — what a layer should be called. */
export function iconTitle(hit: IconHit): string {
  const words = hit.name.replace(/[-_]/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

const cache = new Map<string, IconHit[]>()
const inflight = new Map<string, Promise<IconHit[]>>()

/**
 * Search every icon set. Debounce at the call site and pass an `AbortSignal`: one request in
 * flight per paused keystroke is the whole etiquette the public API asks for. Throws
 * `IconifyUnavailable` when the API refuses, so a picker can say so instead of pretending
 * there were no matches.
 */
export function searchIcons(query: string, limit = DEFAULT_LIMIT, signal?: AbortSignal): Promise<IconHit[]> {
  const q = query.trim().toLowerCase()
  if (!q) return Promise.resolve([])
  const key = `${q}@${limit}`
  const hit = cache.get(key)
  if (hit) return Promise.resolve(hit)
  const pending = inflight.get(key)
  if (pending) return pending
  const run = fetch(`${API}/search?query=${encodeURIComponent(q)}&limit=${limit}`, { signal })
    .then((res) => {
      if (!res.ok) throw new IconifyUnavailable(res.status)
      return res.json()
    })
    .then((data: { icons?: string[] }) => {
      const out = (data.icons ?? []).map(toHit)
      cache.set(key, out)
      return out
    })
    .catch((err) => {
      if (err instanceof IconifyUnavailable) throw err
      // an abort is the caller's business; anything else means we could not ask
      if (err?.name === 'AbortError') throw err
      throw new IconifyUnavailable(0)
    })
    .finally(() => {
      inflight.delete(key)
    })
  inflight.set(key, run)
  return run
}

/* ------------------------------ drawings ------------------------------ */

const sets = new Map<string, SetSlice>()
const markup = new Map<string, string>()

function slice(prefix: string): SetSlice {
  let found = sets.get(prefix)
  if (!found) {
    found = { icons: new Map(), aliases: new Map() }
    sets.set(prefix, found)
  }
  return found
}

function absorb(target: SetSlice, data: IconSetData) {
  target.width ??= data.width
  target.height ??= data.height
  for (const [name, icon] of Object.entries(data.icons ?? {})) target.icons.set(name, icon)
  for (const [name, alias] of Object.entries(data.aliases ?? {})) target.aliases.set(name, alias)
}

/** One batch of names out of one set. Refusals are the caller's to report. */
async function fetchNames(prefix: string, names: string[], signal?: AbortSignal): Promise<SetSlice> {
  const target = slice(prefix)
  const wanted = [...new Set(names)].filter((n) => !target.icons.has(n) && !target.aliases.has(n))
  for (let i = 0; i < wanted.length; i += BATCH) {
    const chunk = wanted.slice(i, i + BATCH)
    const res = await fetch(`${API}/${prefix}.json?icons=${chunk.map(encodeURIComponent).join(',')}`, { signal })
    if (!res.ok) throw new IconifyUnavailable(res.status)
    absorb(target, await res.json())
  }
  // A set's synonym (`mdi:settings` is `cog`) names its target rather than carrying the art,
  // so the first batch can leave those drawings one link away.
  const parents = wanted
    .map((n) => target.aliases.get(n)?.parent)
    .filter((p): p is string => !!p && !target.icons.has(p) && !target.aliases.has(p))
  if (parents.length) {
    const res = await fetch(`${API}/${prefix}.json?icons=${[...new Set(parents)].map(encodeURIComponent).join(',')}`, { signal })
    if (!res.ok) throw new IconifyUnavailable(res.status)
    absorb(target, await res.json())
  }
  return target
}

/** Follow an alias to the icon it points at, composing the turn or flip it adds. */
function resolve(set: SetSlice, name: string, depth = 0): IconBody | null {
  const own = set.icons.get(name)
  if (own) return own
  const alias = set.aliases.get(name)
  if (!alias || depth >= ALIAS_DEPTH) return null
  const base = resolve(set, alias.parent, depth + 1)
  if (!base) return null
  return {
    body: base.body,
    width: alias.width ?? base.width,
    height: alias.height ?? base.height,
    rotate: ((base.rotate ?? 0) + (alias.rotate ?? 0)) % 360,
    // two flips on one axis cancel, exactly as composing the transforms would
    hFlip: !!base.hFlip !== !!alias.hFlip,
    vFlip: !!base.vFlip !== !!alias.vFlip,
  }
}

/** Serialise one drawing as a standalone SVG: a viewBox, and no fixed size to fight the shape. */
function serialize(set: SetSlice, icon: IconBody): string {
  const w = icon.width ?? set.width ?? FALLBACK_BOX
  const h = icon.height ?? set.height ?? FALLBACK_BOX
  const moves: string[] = []
  if (icon.hFlip) moves.push(`translate(${w} 0) scale(-1 1)`)
  if (icon.vFlip) moves.push(`translate(0 ${h}) scale(1 -1)`)
  if (icon.rotate) moves.push(`rotate(${icon.rotate} ${w / 2} ${h / 2})`)
  const body = moves.length ? `<g transform="${moves.join(' ')}">${icon.body}</g>` : icon.body
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`
}

/**
 * The drawings behind a set of search hits, batched one request per icon *set*. Markup comes
 * back sanitised and ready to inline, so a click needs no network call. Throws
 * `IconifyUnavailable` when nothing could be fetched at all; a set that fails on its own is
 * left out rather than failing the whole search.
 */
export async function loadIconMarkups(hits: IconHit[], signal?: AbortSignal): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  const byPrefix = new Map<string, string[]>()
  for (const hit of hits) {
    const done = markup.get(hit.id)
    if (done) {
      out.set(hit.id, done)
      continue
    }
    const names = byPrefix.get(hit.prefix) ?? []
    names.push(hit.name)
    byPrefix.set(hit.prefix, names)
  }

  const results = await Promise.allSettled(
    [...byPrefix].map(async ([prefix, names]) => {
      const set = await fetchNames(prefix, names, signal)
      for (const name of names) {
        const id = `${prefix}:${name}`
        if (markup.has(id)) {
          out.set(id, markup.get(id)!)
          continue
        }
        const icon = resolve(set, name)
        // Sanitised on the way in: it is about to be inlined into the document, mounted for
        // colour reading, and kept on the shape for later recolouring.
        const parsed = icon ? parseSvg(serialize(set, icon)) : null
        if (parsed) {
          markup.set(id, parsed.markup)
          out.set(id, parsed.markup)
        }
      }
    }),
  )

  // An abort is the caller's business: whatever did arrive is still theirs to keep.
  if (signal?.aborted) return out
  if (!out.size) {
    const refused = results.find((r) => r.status === 'rejected')
    if (refused) throw refused.reason
  }
  return out
}

/**
 * Paint an icon's `currentColor` marks a given colour. Only useful for a thumbnail on a dark
 * tile: inside an `<img>` there is no page colour to inherit, so an icon drawn with
 * `currentColor` would resolve to black and vanish. `currentColor` is a colour token in an
 * attribute — it cannot occur inside path data — so replacing the word is exact.
 */
export function tintIconMarkup(markup: string, color: string): string {
  return markup.replaceAll('currentColor', color)
}
