/**
 * Petals board verification #2 — inspector field commits, fills, shadows,
 * auto-layout fill children, text re-edit and rename.
 * Run (dev server up):  node scripts/boardVerify2.mjs
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
if (!exe) { console.error('No Edge/Chrome install found'); process.exit(1) }
mkdirSync('test-artifacts', { recursive: true })

const BASE = 'http://localhost:5173'
const PROJECT = 'boardverify2'

let failures = 0
const ok = (cond, label) => { console.log(cond ? `ok   ${label}` : `FAIL ${label}`); if (!cond) failures++ }
const section = (n) => console.log(`\n— ${n} —`)

const browser = await chromium.launch({ executablePath: exe, headless: true })
const page = await browser.newPage({ viewport: { width: 1520, height: 900 } })
await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE })
const errors = []
let step = 'boot'
page.on('console', (m) => m.type() === 'error' && errors.push(`[${step}] ${m.text()}`))
page.on('pageerror', (e) => errors.push(`[${step}] pageerror: ${e.message}`))

const sleep = (ms) => page.waitForTimeout(ms)
const shot = (n) => page.screenshot({ path: `test-artifacts/bv2-${n}.png` })
const doc = async () => { await sleep(500); return page.evaluate((id) => JSON.parse(localStorage.getItem(`petal.doc.v1.${id}`) ?? '{"nodes":{}}'), PROJECT) }
const shapes = async () => Object.values((await doc()).nodes)
const byId = async (id) => (await doc()).nodes[id]
const bbOf = async (id) => page.locator(`[data-node-id="${id}"]:not([data-handle])`).first().boundingBox()
const center = async (id) => { const b = await bbOf(id); return [b.x + b.width / 2, b.y + b.height / 2] }
const clickShape = async (id) => { const [x, y] = await center(id); await page.mouse.click(x, y); await sleep(150) }
const selectRow = async (id) => { await page.locator(`[data-layer-row="${id}"]`).click(); await sleep(150) }
const ctxMenu = async () => { await page.mouse.click(700, 700, { button: 'right' }); await sleep(300) }
const ctxClick = async (label) => { await page.locator('[data-context-menu]').getByRole('button', { name: label, exact: true }).click(); await sleep(250) }
const field = (sectionTitle, idx) => page.locator(`section:has([aria-label="Toggle ${sectionTitle}"]) input[inputMode="decimal"]`).nth(idx)
const typeField = async (loc, value) => { await loc.click(); await page.keyboard.press('Control+a'); await page.keyboard.type(String(value)); await page.keyboard.press('Enter'); await sleep(300) }
const draw = async (x1, y1, x2, y2) => {
  await page.mouse.move(x1, y1); await page.mouse.down()
  for (let i = 1; i <= 6; i++) { await page.mouse.move(x1 + ((x2 - x1) * i) / 6, y1 + ((y2 - y1) * i) / 6); await sleep(10) }
  await page.mouse.up(); await sleep(150)
}

await page.goto(BASE)
await page.evaluate(() => localStorage.clear())
await page.evaluate((id) => localStorage.setItem('petal.projects.v1', JSON.stringify([{ id, name: 'BV2', createdAt: Date.now(), updatedAt: Date.now() }])), PROJECT)
await page.goto(`${BASE}/board/${PROJECT}`)
await sleep(900)

// draw a rect and a frame with two children
await page.keyboard.press('r')
await draw(420, 220, 560, 340)
let all = await shapes()
const rectId = all[0].id

await page.keyboard.press('f')
await draw(880, 180, 1240, 420)
all = await shapes()
const frameId = all.find((s) => s.type === 'frame').id
await page.keyboard.press('r')
await draw(920, 240, 1020, 310)
await page.keyboard.press('r')
await draw(1060, 240, 1160, 310)
all = await shapes()
const kidIds = all.filter((s) => s.parentId === frameId).map((s) => s.id)
ok(kidIds.length === 2, `frame has 2 children (${kidIds.length})`)

/* ------------------------------------------------- position & size fields */
section('position & size field commits')
step = 'pos'
await selectRow(rectId)
await typeField(field('Position & size', 0), 100)
ok((await byId(rectId)).x === 100, `X field commits (x=${(await byId(rectId)).x})`)
await typeField(field('Position & size', 1), 50)
ok((await byId(rectId)).y === 50, `Y field commits (y=${(await byId(rectId)).y})`)
await typeField(field('Position & size', 2), 200)
ok((await byId(rectId)).w === 200, `W field commits (w=${(await byId(rectId)).w})`)
await typeField(field('Position & size', 3), 150)
ok((await byId(rectId)).h === 150, `H field commits (h=${(await byId(rectId)).h})`)

/* -------------------------------------------------------- appearance */
section('appearance field commits')
step = 'appearance'
await typeField(field('Appearance', 0), 50)
ok(Math.abs((await byId(rectId)).opacity - 0.5) < 0.001, `opacity field commits (${(await byId(rectId)).opacity})`)
await typeField(field('Appearance', 1), 12)
ok((await byId(rectId)).radius === 12, `radius field commits (${(await byId(rectId)).radius})`)
await typeField(field('Appearance', 2), 45)
ok((await byId(rectId)).rotation === 45, `rotation field commits (${(await byId(rectId)).rotation})`)
const borderRadius = await page.evaluate((id) => getComputedStyle(document.querySelector(`[data-node-id="${id}"]:not([data-handle])`)).borderRadius, rectId)
ok(borderRadius === '12px', `radius reflected in DOM (${borderRadius})`)
const transform = await page.evaluate((id) => getComputedStyle(document.querySelector(`[data-node-id="${id}"]:not([data-handle])`)).transform, rectId)
ok(transform !== 'none' && transform.includes('matrix'), `rotation reflected in DOM (${transform})`)

/* ------------------------------------------------------------- fills */
section('fill modes')
step = 'gradient'
await page.locator('[aria-label="Gradient fill"]').click()
await sleep(250)
await page.getByRole('button', { name: 'Linear', exact: true }).click()
await sleep(300)
let fill = (await byId(rectId)).fill
ok(fill && typeof fill === 'object' && fill.type === 'linear' && fill.stops?.length >= 2, `linear gradient applied (${typeof fill === 'object' ? fill.type + ' x' + fill.stops?.length : fill})`)
const bg = await page.evaluate((id) => getComputedStyle(document.querySelector(`[data-node-id="${id}"]:not([data-handle])`)).backgroundImage, rectId)
ok(bg.includes('linear-gradient'), `gradient painted in DOM (${bg.slice(0, 40)}…)`)
step = 'solid'
await page.locator('[aria-label="Solid fill"]').click()
await sleep(300)
fill = (await byId(rectId)).fill
ok(typeof fill === 'string', `back to solid fill (${typeof fill})`)

/* ----------------------------------------------------------- shadows */
section('shadows & filters')
step = 'shadow'
await page.locator('[aria-label="Add shadow"]').click()
await sleep(250)
await page.getByRole('button', { name: 'Box shadow', exact: true }).click()
await sleep(300)
let sh = (await byId(rectId)).shadows
ok(Array.isArray(sh) && sh.length === 1 && sh[0].kind === 'box', `shadow added (${sh?.length})`)
const boxShadow = await page.evaluate((id) => getComputedStyle(document.querySelector(`[data-node-id="${id}"]:not([data-handle])`)).boxShadow, rectId)
ok(boxShadow && boxShadow !== 'none', `shadow painted in DOM (${boxShadow?.slice(0, 40)}…)`)

step = 'filter'
await page.locator('[aria-label="Add filter"]').click()
await sleep(250)
await page.getByRole('button', { name: /Blur/i }).first().click()
await sleep(300)
const filters = (await byId(rectId)).filters
ok(filters && typeof filters.blur === 'number', `blur filter added (${JSON.stringify(filters)})`)

/* ------------------------------------------------------------ outline */
section('outline')
step = 'outline'
const outlineToggle = page.locator('[aria-label="Toggle Outline"]')
if (await outlineToggle.count()) {
  await outlineToggle.click()
  await sleep(300)
}
ok(!!(await byId(rectId)).stroke, `outline/stroke added (${(await byId(rectId)).stroke})`)

/* -------------------------------------------------------- auto layout */
section('auto-layout: gap + fill child')
step = 'gap'
await selectRow(frameId)
await page.locator('[aria-label="Horizontal flow"]').click()
await sleep(300)
await typeField(field('Layout', 0), 20)
ok((await byId(frameId)).gap === 20, `gap field commits (${(await byId(frameId)).gap})`)
let kids = (await shapes()).filter((s) => s.parentId === frameId).sort((a, b) => a.order - b.order)
ok(Math.abs(kids[1].x - (kids[0].x + kids[0].w + 20)) < 2, `gap spaces children (${kids[1].x} vs ${kids[0].x + kids[0].w + 20})`)

step = 'fill-child'
await selectRow(kids[0].id)
const innerW = (await byId(frameId)).w
await page.locator('[aria-label="Fill width"]').click()
await sleep(350)
const filled = await byId(kids[0].id)
ok(filled.mainFill === true, 'fill-width flag set')
const other = await byId(kids[1].id)
ok(Math.abs(filled.w - (innerW - 20 - other.w)) < 2, `fill child takes leftover width (w=${filled.w}, expected ${innerW - 20 - other.w})`)
await shot('layout')

/* ------------------------------------------------------- text re-edit */
section('text re-edit')
step = 'text'
await page.keyboard.press('t')
await page.mouse.click(440, 560)
await sleep(200)
await page.keyboard.type('first')
await sleep(150)
await page.mouse.click(300, 840)
await sleep(300)
all = await shapes()
let textNode = all.find((s) => s.type === 'text')
ok(!!textNode && textNode.text === 'first', `text created (${textNode?.text})`)
// two double-clicks enter inline editing
const [tx, ty] = await center(textNode.id)
await page.mouse.dblclick(tx, ty)
await sleep(200)
await page.mouse.dblclick(tx, ty)
await sleep(300)
const editing = await page.evaluate(() => !!document.querySelector('[contenteditable="true"]'))
ok(editing, 'double-click opens inline editing')
await page.keyboard.press('Control+a')
await page.keyboard.type('second')
await page.keyboard.press('Escape')
await sleep(300)
textNode = (await shapes()).find((s) => s.type === 'text')
ok(textNode?.text === 'second', `committed re-edit (${textNode?.text})`)

/* ------------------------------------------------------------ rename */
section('rename via context menu')
step = 'rename'
await selectRow(rectId)
await ctxMenu()
await ctxClick('Rename')
await sleep(300)
const input = page.locator(`[data-layer-row="${rectId}"] input`)
ok((await input.count()) === 1, 'rename input appears in the layers panel')
if ((await input.count()) === 1) {
  await input.fill('Hero Card')
  await input.press('Enter')
  await sleep(300)
  ok((await byId(rectId)).name === 'Hero Card', `rename committed (${(await byId(rectId)).name})`)
}

console.log(`\nconsole/page errors: ${errors.length}`)
for (const e of errors.slice(0, 8)) console.log('  ', e.slice(0, 200))
failures += errors.length
await browser.close()
console.log(failures === 0 ? '\nBOARD CHECKS 2 PASSED' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
