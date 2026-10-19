/**
 * Full-colour brand logos — the gilbarbara/logos collection, the data behind svglogos.dev.
 * These are the browsable half of the library's Logos tab; the searchable half is Iconify's
 * ~400,000 monochrome icons (see `iconify.ts`).
 *
 * Ported from iOTA-WIP (`lib/svg-logos.ts`). Nothing is bundled: the index is about a
 * megabyte of JSON and the SVGs are served straight from jsDelivr, so the library costs a
 * design nothing until it is opened.
 */

export type LogoEntry = { title: string; file: string }

const DATA_URL = 'https://cdn.jsdelivr.net/gh/gilbarbara/logos@main/logos.json'

// jsDelivr rather than cdn.svglogos.dev: the svglogos CDN sends no CORS header, which would
// stop the SVG being fetched (and inlined) rather than merely displayed.
export const logoSvgUrl = (file: string) => `https://cdn.jsdelivr.net/gh/gilbarbara/logos@main/logos/${file}`

type RawLogo = { name: string; shortname?: string; files: string[] }

let cache: LogoEntry[] | null = null
let inflight: Promise<LogoEntry[]> | null = null

/** One representative file per brand: the `<shortname>.svg` full logo, else the first listed. */
function primaryFile(logo: RawLogo): string {
  const preferred = logo.shortname ? `${logo.shortname}.svg` : null
  if (preferred && logo.files.includes(preferred)) return preferred
  return logo.files[0] ?? ''
}

/** The full brand list, fetched once per session and cached. */
export function loadLogoIndex(): Promise<LogoEntry[]> {
  if (cache) return Promise.resolve(cache)
  if (inflight) return inflight
  inflight = fetch(DATA_URL)
    .then((r) => r.json())
    .then((data: RawLogo[]) => {
      const next: LogoEntry[] = data
        .filter((d) => d.files?.length)
        .map((d) => ({ title: d.name, file: primaryFile(d) }))
      cache = next
      return next
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

/** Prefix matches first, then substring matches. */
export function searchLogos(index: LogoEntry[], query: string, limit = 8): LogoEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const starts: LogoEntry[] = []
  const contains: LogoEntry[] = []
  for (const e of index) {
    const t = e.title.toLowerCase()
    if (t.startsWith(q)) starts.push(e)
    else if (t.includes(q)) contains.push(e)
    if (starts.length >= limit) break
  }
  return [...starts, ...contains].slice(0, limit)
}
