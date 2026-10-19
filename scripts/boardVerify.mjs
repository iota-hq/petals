/**
 * Petals board verification — drives /board in headless Edge and encodes the
 * README's promises as assertions, using the persisted doc JSON as oracle.
 *
 * Run (dev server up):  node scripts/boardVerify.mjs
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
const PROJECT = 'boardverify1'

let failures = 0
const ok = (cond, label) => {
  console.log(cond ? `ok   ${label}` : `FAIL ${label}`)
  if (!cond) failures++
}
const section = (n) => console.log(`\n— ${n} —`)

const browser = await chromium.launch({ executablePath: exe, headless: true })
const page = await browser.newPage({ viewport: { width: 1520, height: 900 } })
await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE })
const errors = []
let step = 'boot'
page.on('console', (m) => m.type() === 'error' && errors.push(`[${step}] ${m.text()}`))
page.on('pageerror', (e) => errors.push(`[${step}] pageerror: ${e.message}`))

const sleep = (ms) => page.waitForTimeout(ms)
const shot = (n) => page.screenshot({ path: `test-artifacts/bv-${n}.png` })

const doc = async () => {
  await sleep(500)
  return page.evaluate((id) => JSON.parse(localStorage.getItem(`petal.doc.v1.${id}`) ?? '{"nodes":{}}'), PROJECT)
}
const shapes = async () => Object.values((await doc()).nodes)
const byId = async (id) => (await doc()).nodes[id]
const roots = (all) => all.filter((s) => !s.parentId)
const ids = (all) => new Set(all.map((s) => s.id))
const bbOf = async (id) => page.locator(`[data-node-id="${id}"]:not([data-handle])`).first().boundingBox()
const selId = async () => page.evaluate(() => document.querySelector('[data-handle]')?.getAttribute('data-node-id') ?? null)
const zoomPct = async () =>
  page.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find((s) => /^\d+%$/.test(s.textContent ?? ''))
    return el ? el.textContent : null
  })

const draw = async (x1, y1, x2, y2) => {
  await page.mouse.move(x1, y1)
  await page.mouse.down()
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(x1 + ((x2 - x1) * i) / 6, y1 + ((y2 - y1) * i) / 6)
    await sleep(10)
  }
  await page.mouse.up()
  await sleep(150)
}
const center = async (id) => {
  const b = await bbOf(id)
  return [b.x + b.width / 2, b.y + b.height / 2]
}
const clickShape = async (id) => {
  const [x, y] = await center(id)
  await page.mouse.click(x, y)
  await sleep(150)
}
const selectRow = async (id, mods = []) => {
  await page.locator(`[data-layer-row="${id}"]`).click({ modifiers: mods })
  await sleep(130)
}
const selectRows = async (list) => {
  await selectRow(list[0])
  for (const id of list.slice(1)) await selectRow(id, ['Shift'])
}
/** Right-click empty canvas: opens the menu without disturbing the current selection. */
const ctxMenu = async () => {
  await page.mouse.click(700, 700, { button: 'right' })
  await sleep(300)
}
const ctxClick = async (label) => {
  await page.locator('[data-context-menu]').getByRole('button', { name: label, exact: true }).click()
  await sleep(250)
}

// ---- seed ----
await page.goto(BASE)
await page.evaluate(() => localStorage.clear())
await page.evaluate((id) => {
  localStorage.setItem(
    'petal.projects.v1',
    JSON.stringify([{ id, name: 'BoardVerify', createdAt: Date.now(), updatedAt: Date.now() }]),
  )
}, PROJECT)
await page.goto(`${BASE}/board/${PROJECT}`)
await sleep(900)

/* ---------------------------------------------------------------- drawing */
section('drawing tools create the documented shapes')
step = 'draw-rect'
await page.keyboard.press('r')
await draw(420, 220, 560, 340)
let all = await shapes()
ok(all.length === 1 && all[0].type === 'rect', `rect created (n=${all.length})`)
ok(all[0]?.fill === '#D9D9D9', `rect fill #D9D9D9 (got ${all[0]?.fill})`)
const rectId = all[0]?.id

step = 'draw-ellipse'
await page.keyboard.press('o')
await draw(620, 220, 760, 340)
all = await shapes()
const ellipseId = all.find((s) => s.type === 'ellipse')?.id
ok(!!ellipseId, `ellipse created (n=${all.length})`)

step = 'draw-line'
await page.keyboard.press('l')
await draw(420, 400, 760, 440)
all = await shapes()
const lineId = all.find((s) => s.type === 'line')?.id
ok(!!lineId, `line created (n=${all.length})`)

step = 'draw-frame'
await page.keyboard.press('f')
await draw(880, 180, 1240, 520)
all = await shapes()
const frame = all.find((s) => s.type === 'frame')
ok(!!frame, 'frame created')
ok(frame?.fill === '#ffffff' && frame?.clip === true, `frame white + clipping (fill=${frame?.fill} clip=${frame?.clip})`)

step = 'draw-inside-frame'
await page.keyboard.press('r')
await draw(920, 240, 1020, 320)
await page.keyboard.press('o')
await draw(1070, 240, 1170, 320)
all = await shapes()
const kids = all.filter((s) => s.parentId === frame?.id)
ok(kids.length === 2, `shapes drawn inside frame adopt parent (kids=${kids.length})`)
ok((await page.locator('[data-layer-row]').count()) === all.length, `layers rows match node count (${all.length})`)

step = 'draw-text'
await page.keyboard.press('t')
await page.mouse.click(440, 520)
await sleep(200)
await page.keyboard.type('Hello Petals')
await sleep(150)
await page.mouse.click(300, 840) // commit outside
await sleep(250)
all = await shapes()
const text = all.find((s) => s.type === 'text')
ok(!!text && text.text === 'Hello Petals', `text tool + typing commits (text="${text?.text}")`)
await shot('draw')

/* -------------------------------------------------------- drill-down sel */
section('drill-down selection')
step = 'drill'
const innerRect = kids.find((s) => s.type === 'rect')
await clickShape(innerRect.id)
ok((await selId()) === frame.id, `click selects outermost frame (got ${await selId()})`)
const [ix, iy] = await center(innerRect.id)
await page.mouse.dblclick(ix, iy)
await sleep(250)
ok((await selId()) === innerRect.id, `double-click drills one level deeper (got ${await selId()})`)

/* ------------------------------------------------------------ z-order ops */
section('context-menu layer ops')
step = 'bring-to-front'
await selectRow(rectId)
await ctxMenu()
await ctxClick('Bring to front')
let sibs = roots(await shapes()).filter((s) => s.id !== rectId)
ok((await byId(rectId)).order > Math.max(...sibs.map((s) => s.order)), 'Bring to front raises order above siblings')

step = 'send-to-back'
await ctxMenu()
await ctxClick('Send to back')
sibs = roots(await shapes()).filter((s) => s.id !== rectId)
ok((await byId(rectId)).order < Math.min(...sibs.map((s) => s.order)), 'Send to back lowers order below siblings')

step = 'flip-h'
await ctxMenu()
await ctxClick('Flip horizontal')
ok((await byId(rectId)).flipX === true, 'Flip horizontal sets flipX')

/* ------------------------------------------------------------- clipboard */
section('copy / paste / duplicate')
step = 'duplicate'
await selectRow(rectId)
const beforeDup = ids(await shapes())
await page.keyboard.press('Control+d')
let afterAll = await shapes()
const dupNew = afterAll.filter((s) => !beforeDup.has(s.id))
ok(afterAll.length === beforeDup.size + 1, `Ctrl+D duplicates (${beforeDup.size} → ${afterAll.length})`)
ok(dupNew[0] && Math.round(dupNew[0].x - (await byId(rectId)).x) === 12, `duplicate offsets 12px (dx=${dupNew[0] ? Math.round(dupNew[0].x - (await byId(rectId)).x) : 'n/a'})`)
await page.keyboard.press('Control+z') // remove the clone before the paste test
await sleep(250)

step = 'copy-paste'
await selectRow(rectId)
const beforePaste = ids(await shapes())
await page.keyboard.press('Control+c')
await page.keyboard.press('Control+v')
afterAll = await shapes()
const pasteNew = afterAll.filter((s) => !beforePaste.has(s.id))
ok(afterAll.length === beforePaste.size + 1, `Ctrl+C/V pastes (${beforePaste.size} → ${afterAll.length})`)
ok(pasteNew[0] && Math.round(pasteNew[0].x - (await byId(rectId)).x) === 16, `paste offsets 16px (dx=${pasteNew[0] ? Math.round(pasteNew[0].x - (await byId(rectId)).x) : 'n/a'})`)
await page.keyboard.press('Control+z') // clean up
await sleep(250)

/* ------------------------------------------------------- visibility/lock */
section('lock / hide')
step = 'lock'
await selectRow(rectId)
await ctxMenu()
await ctxClick('Lock')
ok((await byId(rectId)).locked === true, 'Lock sets locked')
await page.mouse.click(300, 840)
await sleep(150)
await clickShape(rectId)
ok((await selId()) !== rectId, 'locked shape cannot be selected by click')
// marquee across the locked shape must skip it too
await page.mouse.move(280, 130)
await page.mouse.down()
await page.mouse.move(1000, 700, { steps: 8 })
await page.mouse.up()
await sleep(250)
const marqueeSel = await page.evaluate(() => [...document.querySelectorAll('[data-layer-row]')].filter((r) => r.className.includes('bg-primary/15')).map((r) => r.dataset.layerRow))
ok(!marqueeSel.includes(rectId), `marquee skips the locked shape (${marqueeSel.length} selected)`)
await page.mouse.click(300, 840)
await page.keyboard.press('Control+a')
await sleep(200)
const allSel = await page.evaluate(() => [...document.querySelectorAll('[data-layer-row]')].filter((r) => r.className.includes('bg-primary/15')).map((r) => r.dataset.layerRow))
ok(!allSel.includes(rectId), `Ctrl+A skips the locked shape (${allSel.length} selected)`)
await selectRow(rectId)
await ctxMenu()
await ctxClick('Unlock')
ok((await byId(rectId)).locked === false, 'Unlock clears locked')

step = 'hide'
await selectRow(rectId)
await ctxMenu()
await ctxClick('Hide')
ok((await byId(rectId)).visible === false, 'Hide sets visible=false')
ok((await page.locator(`[data-node-id="${rectId}"]:not([data-handle])`).count()) === 0, 'hidden shape leaves the DOM')
await selectRow(rectId)
await ctxMenu()
await ctxClick('Show')
ok((await byId(rectId)).visible === true, 'Show restores visible')

step = 'group'
await selectRows([rectId, ellipseId])
await ctxMenu()
await ctxClick('Group selection')
all = await shapes()
const group = all.find((s) => s.name === 'Group')
ok(!!group, 'Group creates a frame named Group')
if (group) {
  ok(all.filter((s) => s.parentId === group.id).length === 2, `group adopts both shapes (${all.filter((s) => s.parentId === group.id).length})`)
  ok(group.fill === 'transparent', 'group frame is transparent')
}
await shot('ops')

/* ------------------------------------------------------------ undo/redo */
section('undo / redo history')
step = 'undo-redo'
const n0 = (await shapes()).length
await page.keyboard.press('Control+z')
await sleep(300)
const nUndo = (await shapes()).length
ok(nUndo === n0 - 1, `undo removes the group frame (${n0} → ${nUndo})`)
ok((await byId(rectId)).parentId === null, 'undo restores the children to the page')
await page.keyboard.press('Control+Shift+z')
await sleep(300)
ok((await shapes()).length === n0, 'redo restores the group')

/* --------------------------------------------------------------- layout */
section('auto layout: vertical flow + hug')
step = 'layout'
await selectRow(frame.id)
await page.locator('[aria-label="Vertical flow"]').click()
await sleep(300)
let f = await byId(frame.id)
ok(f.layoutFlow === 'v', `frame takes vertical flow (flow=${f.layoutFlow})`)
const fkids = (await shapes()).filter((s) => s.parentId === frame.id)
ok(fkids.length === 2, `frame has 2 children to lay out (${fkids.length})`)
if (fkids.length === 2) {
  const sorted = [...fkids].sort((a, b) => a.order - b.order)
  ok(Math.abs(sorted[1].y - (sorted[0].y + sorted[0].h)) < 2, `children stack vertically (y2=${sorted[1].y} vs y1+h=${sorted[0].y + sorted[0].h})`)
}
await page.locator('[aria-label="Hug frame"]').click()
await sleep(300)
f = await byId(frame.id)
const contentH = (await shapes()).filter((s) => s.parentId === frame.id).reduce((a, s) => a + s.h, 0)
ok(f.sizingMain === 'hug', 'hug sizing set')
ok(Math.abs(f.h - contentH) < 3, `hug frame height tracks content (h=${f.h}, content=${contentH})`)
await shot('layout')

/* ---------------------------------------------------------------- align */
section('align inside a frame')
step = 'align'
await selectRow(frame.id)
const kidIds = (await shapes()).filter((s) => s.parentId === frame.id).map((s) => s.id)
await selectRows(kidIds)
await page.locator('[aria-label="Align left"]').click()
await sleep(300)
const after = (await shapes()).filter((s) => kidIds.includes(s.id))
ok(new Set(after.map((s) => Math.round(s.x))).size === 1, `align left equalises x (${after.map((s) => Math.round(s.x)).join(',')})`)

/* ------------------------------------------------------------ nudge/keys */
section('keyboard nudge')
step = 'nudge'
await selectRow(rectId)
const x0 = (await byId(rectId)).x
await page.keyboard.press('ArrowRight')
await sleep(200)
ok((await byId(rectId)).x === x0 + 1, `arrow nudges 1px (${x0} → ${(await byId(rectId)).x})`)
await page.keyboard.press('Shift+ArrowRight')
await sleep(200)
ok((await byId(rectId)).x === x0 + 11, 'shift+arrow nudges 10px')

/* ------------------------------------------------------- frame preset */
section('frame presets')
step = 'preset'
const beforePreset = ids(await shapes())
// Sample every frame the menu is up for: it should grow from 93% and fade in, not appear flat.
const flight = page.evaluate(
  () =>
    new Promise((resolve) => {
      const seen = []
      const t0 = performance.now()
      const tick = () => {
        const el = document.querySelector('[data-frame-menu]')
        if (el) {
          const s = getComputedStyle(el)
          const m = new DOMMatrixReadOnly(s.transform === 'none' ? undefined : s.transform)
          seen.push({ o: Number(s.opacity), scale: Math.round(m.a * 1000) / 1000 })
        }
        if (performance.now() - t0 < 400) requestAnimationFrame(tick)
        else resolve(seen)
      }
      requestAnimationFrame(tick)
    }),
)
await page.locator('[aria-label="Frame presets"]').click()
const frames = await flight
const mins = frames.reduce((a, f) => ({ o: Math.min(a.o, f.o), scale: Math.min(a.scale, f.scale) }), { o: 1, scale: 1 })
const last = frames[frames.length - 1]
ok(frames.length > 2, `the menu was sampled while it animated (${frames.length} frames)`)
ok(mins.o < 0.9, `it fades in rather than appearing (min opacity ${mins.o})`)
ok(mins.scale < 0.99 && mins.scale > 0.9, `and expands from just under full size (min scale ${mins.scale})`)
ok(last.o === 1 && last.scale > 0.999, `settling at full size and full opacity (${last.o}, ${last.scale})`)
await page.getByRole('button', { name: 'Desktop 1080p' }).click()
await sleep(400)
all = await shapes()
const preset = all.find((s) => !beforePreset.has(s.id))
ok(!!preset && preset.w === 1920 && preset.h === 1080, `Desktop 1080p preset is 1920×1080 (${preset?.w}×${preset?.h})`)
ok(Number((await zoomPct())?.replace('%', '')) < 100, `preset auto-fits on screen (zoom=${await zoomPct()})`)

section('zoom cluster')
step = 'zoom'
await page.keyboard.press('Control+0')
await sleep(250)
ok((await zoomPct()) === '100%', `Ctrl+0 resets zoom to 100% (${await zoomPct()})`)

/* ------------------------------------------------------------- pages */
section('multi-page isolation')
step = 'pages'
await page.keyboard.press('Control+0')
const beforePageNodes = (await shapes()).length
await page.locator('[aria-label="New page"]').click()
await sleep(300)
ok((await page.locator('[data-layer-row]').count()) === 0, 'new page starts empty')
await page.getByRole('button', { name: /Page 1/ }).first().click()
await sleep(300)
ok((await page.locator('[data-layer-row]').count()) === beforePageNodes, 'switching back restores page 1 layers')

/* ------------------------------------------------------------- export */
section('copy as code')
step = 'export'
await selectRow(rectId)
await ctxMenu()
await ctxClick('Copy as')
await ctxClick('Code · React + Tailwind')
await sleep(400)
const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''))
ok(clip.includes('className') || clip.includes('export') || clip.includes('<'), `code export produces JSX ("${clip.slice(0, 50).replace(/\n/g, ' ')}…")`)

/* -------------------------------------------------------------- reload */
section('persistence')
step = 'reload'
const beforeReload = (await shapes()).length
await page.reload()
await sleep(900)
ok((await shapes()).length === beforeReload, `doc survives reload (${beforeReload})`)
ok((await page.locator('[data-layer-row]').count()) === beforeReload, 'layers repopulate after reload')
await shot('reloaded')

/* ------------------------------------------------------------------ end */
console.log(`\nconsole/page errors: ${errors.length}`)
for (const e of errors.slice(0, 8)) console.log('  ', e.slice(0, 200))
failures += errors.length

await browser.close()
console.log(failures === 0 ? '\nBOARD CHECKS PASSED' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
