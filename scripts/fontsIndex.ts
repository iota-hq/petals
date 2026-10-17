/**
 * Regenerates public/fonts/google-fonts.json — the index the Petals font picker browses.
 * Run manually when you want to pick up newly released families:
 *
 *   bun run fonts:index
 *
 * The output is committed, deliberately. Fetching this at build time would make every
 * build depend on api.fontsource.org being up, and the library only changes when
 * Google ships a new family.
 *
 * Only `type: "google"` families are kept. That is the licensing guarantee: the Google
 * Fonts library is entirely open-licensed (OFL-1.1, Apache-2.0, UFL-1.0) and free for
 * commercial use. Fontsource also indexes "other" families from elsewhere, which are
 * excluded — not because they are unfree, but because we only want to have to defend
 * one license story. The script re-checks the licenses on every run and refuses to
 * write anything unexpected.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const API = 'https://api.fontsource.org/v1/fonts'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'fonts', 'google-fonts.json')

// Every license we are willing to ship. Anything outside this aborts the run.
const ALLOWED = new Set(['OFL-1.1', 'Apache-2.0', 'UFL-1.0'])

interface FontsourceFont {
  id: string
  family: string
  type: string
  category: string
  subsets: string[]
  weights: number[]
  license: string
  defSubset: string
}

const all = (await fetch(API).then((r) => {
  if (!r.ok) throw new Error(`fontsource index: HTTP ${r.status}`)
  return r.json() as Promise<FontsourceFont[]>
})) as FontsourceFont[]

// Icon fonts render as boxes and squiggles in design tooling.
const google = all.filter((f) => f.type === 'google' && f.category !== 'icons')

const offenders = google.filter((f) => !ALLOWED.has(f.license))
if (offenders.length) {
  console.error(`Refusing to write: ${offenders.length} families carry an unexpected license.`)
  for (const f of offenders.slice(0, 20)) console.error(`  ${f.id} — ${f.license}`)
  process.exit(1)
}

// Fontsource ships static instances per weight, so we ask for the one nearest the
// regular weight rather than assuming 400 exists (some display faces start at 700).
// Same for the subset: use the family's own default.
const pickWeight = (f: FontsourceFont) =>
  f.weights.includes(400) ? 400 : f.weights.reduce((a, b) => (Math.abs(b - 400) < Math.abs(a - 400) ? b : a))
const pickSubset = (f: FontsourceFont) => (f.subsets.includes(f.defSubset) ? f.defSubset : f.subsets[0])

// Tuples, not objects: ~1,970 entries as objects with full keys is roughly 3x the
// bytes for no benefit, and this file is fetched by the browser.
const fonts = google
  .map((f) => [f.id, f.family, pickSubset(f), pickWeight(f), f.category] as [string, string, string, number, string])
  .sort((a, b) => a[1].localeCompare(b[1]))

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(
  OUT,
  JSON.stringify({
    generated: new Date().toISOString().slice(0, 10),
    source: API,
    licenses: [...ALLOWED],
    fields: ['id', 'name', 'subset', 'weight', 'category'],
    fonts,
  }),
)

const byCategory: Record<string, number> = {}
for (const f of google) byCategory[f.category] = (byCategory[f.category] ?? 0) + 1
const licenses: Record<string, number> = {}
for (const f of google) licenses[f.license] = (licenses[f.license] ?? 0) + 1

console.log(`wrote ${fonts.length} families -> ${OUT}`)
console.log('categories:', JSON.stringify(byCategory))
console.log('licenses  :', JSON.stringify(licenses))
