/**
 * Petals library verification — drives the asset library (patterns, logos, icons), the
 * inspector sections that tune them, and the font panel they share chrome with, in headless
 * Edge. The persisted doc JSON is the oracle throughout.
 *
 * The pattern half runs entirely offline: the motif engine is local, so those assertions are
 * deterministic. Brand logos come from jsDelivr and icons from the Iconify API, so those are
 * the parts that need the network.
 *
 * Run (dev server up):  node scripts/libraryVerify.mjs
 * Screenshots land in test-artifacts/; non-zero exit on failure.
 */
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync } from 'node:fs'

const BROWSERS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
]
const exe = BROWSERS.find(existsSync)
if (!exe) {
  console.error('No Edge/Chrome install found')
  process.exit(1)
}
mkdirSync('test-artifacts', { recursive: true })

const BASE = 'http://localhost:5173'
const PROJECT = 'libraryverify'
/** The fill `createShape` gives a fresh rectangle — what "borrow the shape's colour" must pick up. */
const DEFAULT_FILL = 'd9d9d9'

let failures = 0
const ok = (cond, label) => {
  console.log(cond ? `ok   ${label}` : `FAIL ${label}`)
  if (!cond) failures++
}
const section = (n) => console.log(`\n— ${n} —`)

const browser = await chromium.launch({ executablePath: exe, headless: true })
const page = await browser.newPage({ viewport: { width: 1520, height: 900 } })
const errors = []
let step = 'boot'
/**
 * Iconify's generator throttles bursts per IP with a bare 429 and no CORS headers, so the
 * browser logs a load failure that says nothing about this app. Every other console error is
 * still a failure.
 */
const isIconifyNoise = (m) => (m.location()?.url ?? '').includes('iconify') || /iconify/i.test(m.text())
page.on('console', (m) => m.type() === 'error' && !isIconifyNoise(m) && errors.push(`[${step}] ${m.text()}`))
page.on('pageerror', (e) => errors.push(`[${step}] pageerror: ${e.message}`))
/** How many requests the panel has made to Iconify — the search's cost is asserted below. */
let iconifyRequests = 0
page.on('request', (r) => {
  if (r.url().includes('api.iconify.design')) iconifyRequests++
})

const sleep = (ms) => page.waitForTimeout(ms)
const shot = (n) => page.screenshot({ path: `test-artifacts/lib-${n}.png` })
const doc = async () => {
  await sleep(400)
  return page.evaluate((id) => JSON.parse(localStorage.getItem(`petal.doc.v1.${id}`) ?? '{"nodes":{}}'), PROJECT)
}
const shapes = async () => Object.values((await doc()).nodes)
const decode = (dataUrl) => Buffer.from(dataUrl.split(',')[1] ?? '', 'base64').toString('utf8')
const find = async (id) => (await shapes()).find((s) => s.id === id)

const dialog = page.locator('[role="dialog"][aria-label="Library"]')
const fontDialog = page.locator('[role="dialog"][aria-label="Fonts"]')
// exact: the seeded project is called "Library Verify", which would otherwise also match
const libraryButton = page.getByRole('button', { name: 'Library', exact: true })
const libraryOpen = async () => (await dialog.count()) > 0
const openLibrary = async () => {
  if (await libraryOpen()) return
  await libraryButton.click()
  await dialog.waitFor({ timeout: 10000 })
}
const closeLibrary = async () => {
  if (await libraryOpen()) await page.keyboard.press('Escape')
}
const tab = async (name) => {
  await page.getByRole('tab', { name }).click()
  await sleep(150)
}
/** Wait until the source's index has arrived and the grid has options. */
const waitForOptions = async (timeout = 25000) => {
  await page.locator('[role="option"]').first().waitFor({ timeout })
}
const applyFirstMotif = async () => {
  await tab('Patterns')
  await page.locator('[role="option"]').first().click()
  await sleep(500)
}
/** Poll until a predicate holds, so slow CDN image loads do not decide the outcome. */
const waitUntil = async (fn, timeout = 30000, every = 250) => {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    if (await fn()) return true
    await sleep(every)
  }
  return false
}
/** The inspector section whose header carries `Toggle <title>`. */
const panelSection = (title) =>
  page.locator('section').filter({ has: page.getByRole('button', { name: `Toggle ${title}` }) })
/** Click a shape where it actually sits on the canvas (Escape may have cleared selection). */
const clickShape = async (id) => {
  const at = await page.evaluate((n) => {
    const el = document.querySelector(`[data-node-id="${n}"]:not([data-handle])`)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }, id)
  if (at) await page.mouse.click(at.x, at.y)
  await sleep(300)
}
/** Drive a NumField the way a person would: click it, type a value, press Enter to commit. */
const setField = async (loc, v) => {
  await loc.click()
  await loc.fill(String(v))
  await loc.press('Enter')
  await sleep(350)
}
/** Type a hex into the currently open colour popover and commit it. */
const setHex = async (hex) => {
  const input = page.getByLabel('Hex')
  await input.fill(hex)
  await input.press('Enter')
  await sleep(350)
}
const panelRect = (label) =>
  page.evaluate((l) => {
    const p = document.querySelector(`[role="dialog"][aria-label="${l}"]`).getBoundingClientRect()
    const bar = document.querySelector('[data-toolbar]').getBoundingClientRect()
    const aside = document.querySelector('[data-props-panel]').getBoundingClientRect()
    return {
      left: Math.round(p.left),
      right: Math.round(p.right),
      top: Math.round(p.top),
      bottom: Math.round(p.bottom),
      w: Math.round(p.width),
      h: Math.round(p.height),
      barTop: Math.round(bar.top),
      asideLeft: Math.round(aside.left),
      vw: innerWidth,
      vh: innerHeight,
    }
  }, label)

/* ---------------- boot ---------------- */

section('boot')
step = 'boot'
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.evaluate(() => localStorage.clear())
await page.evaluate(
  (id) => localStorage.setItem('petal.projects.v1', JSON.stringify([{ id, name: 'Library Verify', createdAt: Date.now(), updatedAt: Date.now() }])),
  PROJECT,
)
await page.goto(`${BASE}/board/${PROJECT}`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('[aria-label="New page"]', { timeout: 15000 })
ok(true, 'board opened')

/* ---------------- the panel ---------------- */

section('the library opens from the toolbar')
step = 'open'
await libraryButton.click()
await dialog.waitFor({ timeout: 10000 })
ok(true, 'toolbar button opens the panel')
ok((await page.getByRole('tab', { name: 'Patterns' }).getAttribute('aria-selected')) === 'true', 'patterns is the default source')
ok((await page.getByRole('tab').allInnerTexts()).join() === 'Patterns,Logos,Icons', 'patterns, logos and icons are offered, in that order')
ok((await page.getByText('Emoji', { exact: true }).count()) === 0, 'the emoji source is gone')
ok((await page.getByLabel('shape colour').count()) === 0, 'the shape-colour checkbox is gone — it did nothing legible')
await shot('panel')

section('the panel sits bottom-right, clear of the toolbar and the inspector')
step = 'geometry'
const g = await panelRect('Library')
ok(g.bottom < g.barTop, 'it sits above the floating toolbar')
ok(g.barTop - g.bottom <= 24, `and clears it by a margin, not a chasm (${g.barTop - g.bottom}px)`)
ok(Math.abs(g.right - (g.asideLeft - 8)) < 2, 'its right edge is flush with the properties sidebar')
ok(g.bottom > g.vh - 140, 'it is anchored to the bottom')
ok(g.w === 256 && g.h === 380, `compact — about the inspector's own column (${g.w}×${g.h})`)
ok(g.w < g.asideLeft && g.left > 200, 'and it stays out of the layers panel')

section('a tile is the artwork itself, not a box around it')
step = 'tiles'
const first = page.locator('[role="option"]').first()
const tile = await first.evaluate((el) => {
  const img = el.querySelector('img')
  const cs = getComputedStyle(el)
  const ics = img ? getComputedStyle(img) : null
  return {
    tileBg: cs.backgroundColor,
    tileTransition: cs.transitionProperty,
    imgRadius: ics?.borderRadius,
    imgW: Math.round(img?.getBoundingClientRect().width ?? 0),
    plateBg: img?.parentElement === el ? 'none' : getComputedStyle(img.parentElement).backgroundColor,
  }
})
ok(tile.tileBg === 'rgba(0, 0, 0, 0)', `the cell paints no box of its own (${tile.tileBg})`)
ok(tile.plateBg === 'none' || tile.plateBg === 'rgba(0, 0, 0, 0)', `and there is no plate behind the artwork (${tile.plateBg})`)
ok(parseFloat(tile.imgRadius) >= 4, `the artwork carries the rounding itself (${tile.imgRadius})`)
ok(tile.tileTransition.includes('opacity'), `hover is an opacity change, not a box (${tile.tileTransition})`)
ok(tile.imgW === 40, `thumbnails are smaller than they were (${tile.imgW}px)`)
const firstName = await first.getAttribute('aria-label')
ok((await first.innerText()).trim() === '', 'nothing is written under the artwork')
await first.hover()
const tip = page.getByRole('tooltip').first()
let tipOk = true
try {
  await tip.waitFor({ timeout: 5000 })
} catch {
  tipOk = false
}
ok(tipOk && (await tip.innerText()) === firstName, `the name is a hover hint instead (${firstName})`)
const dimmed = Number(await first.evaluate((el) => getComputedStyle(el).opacity))
ok(dimmed < 0.8 && dimmed > 0.1, `and hovering dims it (opacity ${dimmed})`)
await page.mouse.move(700, 780)
await sleep(200)

section('patterns are local — no fetch, no bundle')
step = 'patterns'
const motifCount = await page.locator('[role="option"]').count()
ok(motifCount >= 20, `every motif is listed (${motifCount})`)
const thumbSrc = await page.locator('[role="option"] img').first().getAttribute('src')
ok(!!thumbSrc?.startsWith('data:image/svg+xml;base64,'), 'thumbnails are generated in the browser, not fetched')
const gridCols = await page.locator('[role="listbox"] > div').first().evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length)
ok(gridCols >= 4, `thumbnails lay out as a grid (${gridCols} columns in a ${g.w}px panel)`)

section('opening the panel leaves the rest of the app alone')
step = 'non-blocking'
// The panel used to sit under a full-viewport shield that caught every press and wheel
// meant for the app behind it. It is an outside-press listener now, so nothing is covered.
const under = await page.evaluate(() => {
  const at = (x, y) => {
    const el = document.elementFromPoint(x, y)
    if (!el) return null
    if (el.closest('[data-canvas-root]')) return 'canvas'
    if (el.closest('[data-props-panel]')) return 'inspector'
    if (el.closest('aside')) return 'sidebar'
    return el.closest('[role="dialog"]') ? 'panel' : 'other'
  }
  const r = document.querySelector('[data-props-panel]').getBoundingClientRect()
  return { canvas: at(700, 400), left: at(120, 500), right: at(r.left + 20, 300) }
})
ok(under.canvas === 'canvas', `the canvas is not covered (${under.canvas})`)
ok(under.left === 'sidebar', `nor is the layers panel (${under.left})`)
ok(under.right === 'inspector', `nor is the inspector (${under.right})`)
await sleep(100)
ok((await dialog.count()) === 1, 'and nothing has closed it just by looking')

/* ---------------- applying a pattern ---------------- */

section('with nothing selected, a pattern makes its own shape')
step = 'apply-empty'
await applyFirstMotif()
const made = await shapes()
ok(made.length === 1, `a rectangle was created to carry it (${made.length})`)
const carried = made[0]
ok(carried?.type === 'rect', `it is a rect (${carried?.type})`)
ok(carried?.fill?.type === 'image', 'the fill became an image fill')
ok(carried?.fill?.fit === 'cover', 'with cover fit, so it paints 1:1')
ok(!!carried?.fill?.src?.startsWith('data:image/svg+xml;base64,'), 'the pattern is inlined as an SVG data URL')
ok(!!carried?.pattern?.motif, `the params ride along so it stays editable (${carried?.pattern?.motif})`)

const painted = await page.evaluate((id) => {
  const el = document.querySelector(`[data-node-id="${id}"]:not([data-handle])`)
  return el ? getComputedStyle(el).backgroundImage : ''
}, carried.id)
ok(painted.includes('data:image/svg+xml'), `the canvas paints it (${painted.slice(19, 47)}…)`)
await shot('applied')

section('the pattern is an ordinary, single-step undoable edit')
step = 'undo'
await closeLibrary()
await page.locator('body').click({ position: { x: 1100, y: 700 } })
await page.keyboard.press('Control+z')
await sleep(500)
ok((await shapes()).length === 0, 'one Ctrl+Z removed the shape the pattern created')
await page.keyboard.press('Control+Shift+z')
await sleep(500)
const redone = await shapes()
ok(redone.length === 1, 'redo restores it')
ok(!!redone[0]?.fill?.src?.startsWith('data:image/svg+xml;base64,'), 'the restored shape kept its pattern')

/* ---------------- the motif's own colours ---------------- */

section('a pattern arrives in its own colours')
step = 'palette'
// Draw a plain rectangle, then pattern it: the generated SVG must NOT be tinted to its fill.
await page.keyboard.press('Escape')
await page.keyboard.press('r')
await page.mouse.move(300, 250)
await page.mouse.down()
await page.mouse.move(500, 400, { steps: 8 })
await page.mouse.up()
await sleep(400)
const drawn = await shapes()
const rect = drawn.find((s) => typeof s.fill === 'string' && s.fill.toLowerCase().includes(DEFAULT_FILL))
ok(!!rect, `a plain rectangle was drawn (${drawn.length} shapes)`)

await openLibrary()
await applyFirstMotif()
const patterned = await find(rect?.id)
const patternedSvg = decode(patterned?.fill?.src ?? '')
ok(!patternedSvg.toLowerCase().includes(DEFAULT_FILL), `the shape's own colour does not tint the motif (${DEFAULT_FILL})`)
ok(/fill="#[0-9a-f]{6}"/i.test(patternedSvg), 'it arrives painted in the palette its thumbnail advertises')
ok((await page.getByLabel('shape colour').count()) === 0, 'and there is no switch left to change that silently')
const beforeCount = (await shapes()).length

step = 'palette-again'
await applyFirstMotif()
const again = await find(rect?.id)
ok(decode(again?.fill?.src ?? '') === patternedSvg, 're-applying draws exactly the same artwork')
ok((await shapes()).length === beforeCount, 're-applying recoloured the shape rather than adding another')

/* ---------------- the inspector's pattern controls ---------------- */

section('the inspector exposes the pattern engine’s settings')
step = 'pattern-section'
await closeLibrary()
// The re-apply left the shape selected; click it anyway so Escape's selection behaviour
// cannot decide the outcome of this section.
await clickShape(rect.id)
const pat = panelSection('Pattern')
ok((await pat.count()) === 1, 'the selected shape has a Pattern section')
ok((await pat.getByLabel('Zoom').count()) === 1, 'it carries the grid controls (Zoom)')
ok((await pat.getByLabel('Detail').count()) === 1, 'and the motif’s detail control')
ok((await pat.getByLabel('Motif size').count()) === 1, 'and the motif size, separate from the grid')
ok((await pat.getByRole('button', { name: 'Toggle Pattern' }).count()) === 1, 'the header is collapsible')
ok((await pat.getByRole('button', { name: 'Remove Pattern' }).count()) === 1, 'and offers a remove control while a pattern is on')
// the controls follow the inspector's own idiom: numbered fields and icon buttons, no sliders
ok((await pat.locator('input[type="range"]').count()) === 0, 'no range sliders are left in the pattern controls')
ok((await pat.getByText('Grid', { exact: true }).count()) === 1, 'related controls are grouped (Grid)')
ok((await pat.getByText('Ink', { exact: true }).count()) === 1, 'and so are the ink controls')
ok((await pat.getByText('Fade', { exact: true }).count()) === 1, 'and the fade controls')
ok((await pat.getByText('Alternate', { exact: true }).count()) === 1, 'and the alternates')
ok((await pat.getByRole('group', { name: 'Pattern paint' }).count()) === 1, 'a mode is chosen from icon buttons')
await shot('pattern-section')

step = 'pattern-zoom'
const zoomedFrom = (await find(rect?.id))?.fill?.src
await setField(pat.getByLabel('Zoom'), 200)
const zoomed = await find(rect?.id)
ok(zoomed?.pattern?.scale === 200, `the field writes the param (scale ${zoomed?.pattern?.scale})`)
ok(zoomed?.fill?.src !== zoomedFrom, 'and the stored SVG is regenerated from it')
const beforeSvg = decode(zoomedFrom ?? '')
ok(decode(zoomed?.fill?.src).length !== beforeSvg.length, 'the new artwork differs from the old')

step = 'pattern-motif-size'
await setField(pat.getByLabel('Motif size'), 150)
const sized = await find(rect?.id)
ok(Math.abs((sized?.pattern?.motifScale ?? 0) - 1.5) < 0.001, `motif size is stored as a fraction (${sized?.pattern?.motifScale})`)

step = 'pattern-fade'
await setField(pat.getByLabel('Fade amount'), 40)
const faded = await find(rect?.id)
ok(Math.abs((faded?.pattern?.fade ?? 0) - 0.4) < 0.001, `fade is stored as a fraction (${faded?.pattern?.fade})`)
// radial is the one mode that fades from an outline rather than along a direction
const angleBefore = (await find(rect?.id))?.pattern?.fadeAngle
await pat.getByRole('button', { name: 'Fade: radial' }).click()
await sleep(400)
const radial = await find(rect?.id)
ok(radial?.pattern?.fadeMode === 'radial', `a mode button switches the fade (${radial?.pattern?.fadeMode})`)
ok(radial?.pattern?.fadeAngle === angleBefore, 'and the direction it no longer uses is left alone')
await pat.getByRole('button', { name: 'Fade: soft ramp' }).click()
await sleep(400)

step = 'pattern-motif'
const motifFrom = zoomed?.pattern?.motif
await pat.getByRole('button', { name: 'Seigaiha' }).click()
await sleep(400)
const switched = await find(rect?.id)
ok(switched?.pattern?.motif !== motifFrom, `a motif can be swapped in place (${motifFrom} → ${switched?.pattern?.motif})`)
ok(switched?.fill?.type === 'image', 'and the fill follows')

step = 'pattern-ink'
await pat.getByRole('button', { name: 'Set ink by hand' }).click()
await sleep(400)
const custom = await find(rect?.id)
ok(custom?.pattern?.autoTint === false, 'ink can be driven by hand instead of by tint')
ok(typeof custom?.pattern?.ink === 'string' && /^#[0-9a-f]{6}$/i.test(custom.pattern.ink), `seeded from the tinted colour (${custom?.pattern?.ink})`)

step = 'pattern-remove-add'
const beforeRemove = (await find(rect?.id))?.pattern
await pat.getByRole('button', { name: 'Remove Pattern' }).click()
await sleep(400)
const removed = await find(rect?.id)
ok(removed?.pattern === undefined, 'removing the pattern clears the params')
ok(removed?.fill === beforeRemove?.bg, `and hands the shape back the pattern’s own backdrop (${removed?.fill})`)
ok((await pat.getByRole('button', { name: 'Add Pattern' }).count()) === 1, 'the header now offers to add one back')
await pat.getByRole('button', { name: 'Add Pattern' }).click()
await sleep(400)
const readded = await find(rect?.id)
ok(!!readded?.pattern, 'adding it back restores a pattern')
ok(!!readded?.fill?.src?.startsWith('data:image/svg+xml'), 'and a rendered fill')
await page.mouse.click(1100, 700)
await sleep(200)
await page.keyboard.press('Control+z')
await sleep(400)
await page.keyboard.press('Control+Shift+z')
await sleep(400)
ok(!!(await find(rect?.id))?.pattern, 'and the round trip survives undo/redo')

/* ---------------- the fetched sources ---------------- */

section('brand logos and icons are separate sources')
step = 'logos'
await openLibrary()
const searchBox = page.getByLabel('Search library')
ok((await searchBox.getAttribute('placeholder')) === 'Search patterns…', 'the search row is worded for the tab that is open')
await tab('Logos')
ok((await searchBox.getAttribute('placeholder')) === 'Search brand logos…', 'and re-words itself on Logos')
let logoOk = true
try {
  await waitForOptions()
} catch {
  logoOk = false
}
ok(logoOk, 'the brand logo index arrived')
if (logoOk) {
  const browsed = await page.locator('[role="option"]').count()
  ok(browsed > 30, `the brand library is browsable before typing (${browsed})`)
  await page.getByLabel('Search library').fill('github')
  await sleep(1200)
  const hits = await page.locator('[role="option"]').count()
  ok(hits > 0 && hits < 80, `the brand filter is a local one (${hits} hits)`)
  ok((await page.getByRole('option', { name: /^github$/i }).count()) > 0, 'the brand is in the results')

  // The query must ride across the tabs — one search, three views of it.
  await tab('Icons')
  ok((await page.getByLabel('Search library').inputValue()) === 'github', 'the search survives a tab change')
  await tab('Patterns')
  ok((await page.getByLabel('Search library').inputValue()) === 'github', 'and survives the way back')
  await tab('Logos')
  await sleep(200)
  ok((await page.getByRole('option', { name: /^github$/i }).count()) > 0, 'and the tab still shows what it was filtered to')
  await shot('logos')

  const before = (await shapes()).length
  await page.getByRole('option', { name: /^github$/i }).first().click()
  await sleep(3000)
  const after = await shapes()
  ok(after.length === before + 1, `clicking inserted one shape (${after.length})`)
  const logoShape = after.find((s) => s.name?.toLowerCase() === 'github')
  ok(!!logoShape, `it is named after the logo (${logoShape?.name})`)
  ok(!!logoShape?.src?.startsWith('data:image/svg+xml;base64,'), 'the SVG was inlined, so the document is self-contained')
  ok(typeof logoShape?.logo?.source === 'string' && logoShape.logo.source.includes('<svg'), 'its pristine markup is kept for recolouring')
  ok(logoShape?.w === 160 && logoShape?.h === 160, `inserted at the expected size (${logoShape?.w}×${logoShape?.h})`)

  /* ------------- recolouring an inserted logo ------------- */
  section('a logo can be recoloured from the inspector')
  step = 'logo-section'
  await closeLibrary()
  await clickShape(logoShape.id)
  const logo = panelSection('Logo')
  ok((await logo.count()) === 1, 'the inserted logo has a Logo section')
  const swatches = logo.locator('button[aria-label^="Logo colour #"]')
  ok((await swatches.count()) >= 1, `one swatch per colour the mark paints with (${await swatches.count()})`)
  const srcFrom = (await find(logoShape.id))?.src

  step = 'logo-mono'
  await logo.getByRole('button', { name: 'Paint it one colour' }).click()
  await sleep(400)
  const monoed = await find(logoShape.id)
  ok(!!monoed?.logo?.mono, `mono paints every part one colour (${monoed?.logo?.mono})`)
  ok(monoed?.src !== srcFrom, 'and the rendered artwork is rebuilt')
  ok(decode(monoed?.src).includes(monoed.logo.mono), 'the SVG actually carries that colour')
  await shot('logo-section')

  step = 'logo-colour'
  await logo.getByRole('button', { name: 'Logo ink' }).click()
  await sleep(300)
  await setHex('#ff0000')
  const recoloured = await find(logoShape.id)
  ok(recoloured?.logo?.mono === '#ff0000', `the swatch drives the colour (${recoloured?.logo?.mono})`)
  ok(recoloured?.src !== monoed?.src, 'and the artwork follows it')
  ok(decode(recoloured?.src).toLowerCase().includes('#ff0000'), 'the rendered SVG is the recoloured one')

  step = 'logo-original'
  await logo.getByRole('button', { name: 'Its own colours' }).click()
  await sleep(400)
  const back = await find(logoShape.id)
  ok(back?.logo?.mono === undefined, 'original gives the mark its own colours back')
  ok(decode(back?.src) === decode(logoShape.src), 'and it renders exactly as inserted — edits never compound')

  step = 'icons'
  section('icons are searched live against Iconify')
  await openLibrary()
  await tab('Icons')
  const requestsBefore = iconifyRequests
  ok((await page.locator('[role="option"]').count()) === 0, 'the icons tab does not pay for a request until you type')
  await page.getByLabel('Search library').fill('rocket')
  // The drawings arrive with the search — batched per icon set, not one request per icon —
  // so a tile is a local data URL and there is nothing left to load.
  const iconImg = '[role="option"] img[src^="data:image/svg+xml"]'
  const iconOk = await waitUntil(() => page.locator(iconImg).count().then((n) => n > 0), 25000)
  if (!iconOk) {
    console.log('   debug: panel open =', await dialog.count(), 'query =', JSON.stringify(await page.getByLabel('Search library').inputValue()))
    console.log('   debug: options =', await page.locator('[role="option"]').count())
    console.log('   debug: text =', (await page.locator('[role="dialog"][aria-label="Library"]').innerText()).replace(/\n/g, ' | ').slice(0, 400))
  }
  ok(iconOk, 'the icon search returns drawings from the Iconify API')
  if (iconOk) {
    await sleep(600)
    const iconHits = await page.locator(iconImg).count()
    ok(iconHits > 0, `the icons tab is icons and nothing else (${iconHits} icons)`)
    ok(
      iconifyRequests - requestsBefore < iconHits,
      `the drawings come batched, fewer requests than icons (${iconifyRequests - requestsBefore} for ${iconHits})`,
    )
    const painted = await page.locator(iconImg).evaluateAll((els) => els.every((e) => e.naturalWidth > 0))
    ok(painted, 'the icon thumbnails actually paint')
    await shot('icons')

    const before = (await shapes()).length
    const settled = iconifyRequests
    await page.locator('[role="option"]', { has: page.locator('img[src^="data:image/svg+xml"]') }).first().click()
    await sleep(1500)
    const after = await shapes()
    ok(after.length === before + 1, `clicking inserted one icon (${after.length})`)
    ok(iconifyRequests === settled, 'and needed no further request — the drawing was already here')
    const iconShape = after.find((s) => s.w === 96)
    ok(!!iconShape, `it arrives at icon size (${iconShape?.w}×${iconShape?.h})`)
    ok(!!iconShape?.src?.startsWith('data:image/svg+xml;base64,'), 'the icon was inlined too')
    ok(typeof iconShape?.logo?.source === 'string', 'and is recolourable like any other logo')
  } else {
    // What must never happen is a silent blank: a refused search has to say so.
    const said = await page.getByText(/rate-limiting|Could not reach Iconify/).count()
    ok(said > 0, 'a refused icon search is reported, never rendered as an empty result')
    await shot('icons-refused')
  }
}

section('search that matches nothing says so')
step = 'empty'
await tab('Patterns')
await page.getByLabel('Search library').fill('zzzzzzz')
await sleep(400)
const empty = await page.getByText(/Nothing matches/).count()
ok(empty > 0, 'the empty state is shown')

/* ---------------- one chrome for both panels ---------------- */

section('the font panel is the same panel')
step = 'fonts'
await closeLibrary()
await page.keyboard.press('Escape')
await page.keyboard.press('t')
await page.mouse.click(700, 300)
await sleep(200)
await page.keyboard.type('Hello')
await page.keyboard.press('Escape')
await sleep(300)
await page.locator('aside button[aria-label="Font family"]').first().click()
await fontDialog.waitFor({ timeout: 10000 })
ok((await page.getByLabel('Search fonts').getAttribute('placeholder')) === 'Search fonts', 'it opens the same search row, worded for fonts')
const fg = await panelRect('Fonts')
ok(fg.left === g.left && fg.w === g.w && fg.bottom === g.bottom, `it lands in exactly the same place (${fg.left},${fg.bottom} ${fg.w}×${fg.h})`)
await page.getByLabel('Search fonts').fill('Inter')
await sleep(300)
ok((await page.locator('[role="listbox"][aria-label="Fonts"] [role="option"]').count()) > 0, 'and its search works against the google index')
await shot('fonts')
await page.keyboard.press('Escape')
await sleep(200)

await shot('final')

/* ---------------- report ---------------- */

console.log(`\nconsole/page errors: ${errors.length}`)
for (const e of errors.slice(0, 8)) console.log(`  ${e}`)

await browser.close()
if (failures || errors.length) {
  console.log(`\nLIBRARY CHECKS FAILED (${failures} assertion(s), ${errors.length} error(s))`)
  process.exit(1)
}
console.log('\nLIBRARY CHECKS PASSED')
