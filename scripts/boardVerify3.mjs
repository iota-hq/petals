/**
 * Petals board verification #3 — layers drag-reorder, image insertion, file
 * exports (downloads) and page deletion.
 * Run (dev server up):  node scripts/boardVerify3.mjs
 */
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'

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
const PROJECT = 'boardverify3'

let failures = 0
const ok = (cond, label) => { console.log(cond ? `ok   ${label}` : `FAIL ${label}`); if (!cond) failures++ }
const section = (n) => console.log(`\n— ${n} —`)

const browser = await chromium.launch({ executablePath: exe, headless: true })
const page = await browser.newPage({ viewport: { width: 1520, height: 900 }, acceptDownloads: true })
await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE })
const errors = []
let step = 'boot'
page.on('console', (m) => m.type() === 'error' && errors.push(`[${step}] ${m.text()}`))
page.on('pageerror', (e) => errors.push(`[${step}] pageerror: ${e.message}`))

const sleep = (ms) => page.waitForTimeout(ms)
const shot = (n) => page.screenshot({ path: `test-artifacts/bv3-${n}.png` })
const doc = async () => { await sleep(500); return page.evaluate((id) => JSON.parse(localStorage.getItem(`petal.doc.v1.${id}`) ?? '{"nodes":{}}'), PROJECT) }
const shapes = async () => Object.values((await doc()).nodes)
const byId = async (id) => (await doc()).nodes[id]
const selectRow = async (id) => { await page.locator(`[data-layer-row="${id}"]`).click(); await sleep(150) }
const draw = async (x1, y1, x2, y2) => {
  await page.mouse.move(x1, y1); await page.mouse.down()
  for (let i = 1; i <= 6; i++) { await page.mouse.move(x1 + ((x2 - x1) * i) / 6, y1 + ((y2 - y1) * i) / 6); await sleep(10) }
  await page.mouse.up(); await sleep(150)
}

await page.goto(BASE)
await page.evaluate(() => localStorage.clear())
await page.evaluate((id) => localStorage.setItem('petal.projects.v1', JSON.stringify([{ id, name: 'BV3', createdAt: Date.now(), updatedAt: Date.now() }])), PROJECT)
await page.goto(`${BASE}/board/${PROJECT}`)
await sleep(900)

/* ------------------------------------------------- layers drag reorder */
section('layers drag reorder')
step = 'reorder'
await page.keyboard.press('r')
await draw(420, 220, 560, 340)
await page.keyboard.press('r')
await draw(620, 220, 760, 340)
let all = await shapes()
const A = all[0].id
const B = all[1].id
ok((await byId(B)).order > (await byId(A)).order, 'second rect sits above the first')
const rowA = await page.locator(`[data-layer-row="${A}"]`).boundingBox()
const rowB = await page.locator(`[data-layer-row="${B}"]`).boundingBox()
// drag A onto the top edge of B (the "above" drop zone)
await page.mouse.move(rowA.x + 40, rowA.y + rowA.height / 2)
await page.mouse.down()
await page.mouse.move(rowA.x + 40, rowA.y + rowA.height / 2 - 6, { steps: 4 })
await page.mouse.move(rowB.x + 40, rowB.y + 4, { steps: 12 })
await page.mouse.move(rowB.x + 40, rowB.y + 3, { steps: 3 })
await page.mouse.up()
await sleep(400)
ok((await byId(A)).order > (await byId(B)).order, `dragging A above B raises its order (A=${(await byId(A)).order} B=${(await byId(B)).order})`)
await shot('reorder')

/* ------------------------------------------------------ image insertion */
section('image insertion')
step = 'image'
const [chooser] = await Promise.all([
  page.waitForEvent('filechooser'),
  (async () => { await page.keyboard.press('i'); await page.mouse.click(1000, 640) })(),
])
await chooser.setFiles('public/ellipse.png')
await sleep(1200)
all = await shapes()
const img = all.find((s) => s.type === 'image')
ok(!!img, `image node inserted (${img ? img.type : 'none'})`)
ok(!!img?.src && img.src.startsWith('data:'), `image carries a data URL (${img?.src?.slice(0, 22)}…)`)
ok((await page.locator(`img[data-node-id="${img?.id}"]`).count()) === 1, 'image renders as an <img>')
await shot('image')

/* ----------------------------------------------------------- exports */
section('file exports (downloads)')
step = 'export-png'
await selectRow(A)
await page.locator('[aria-label="Export"]').click()
await sleep(250)
const [pngDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^PNG/ }).click()])
const pngPath = 'test-artifacts/bv3-export.png'
await pngDl.saveAs(pngPath)
const pngBuf = readFileSync(pngPath)
ok(pngBuf.length > 100, `PNG export downloaded (${pngBuf.length} bytes)`)
ok(pngBuf[0] === 0x89 && pngBuf[1] === 0x50, 'PNG magic bytes correct')

step = 'export-svg'
await page.locator('[aria-label="Export"]').click()
await sleep(250)
const [svgDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^SVG/ }).click()])
const svgPath = 'test-artifacts/bv3-export.svg'
await svgDl.saveAs(svgPath)
const svg = readFileSync(svgPath, 'utf8')
ok(svg.includes('<svg') && svg.includes('</svg>'), `SVG export is well-formed (${svg.length} chars)`)

step = 'export-eps'
await page.locator('[aria-label="Export"]').click()
await sleep(250)
const [epsDl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^EPS/ }).click()])
const epsPath = 'test-artifacts/bv3-export.eps'
await epsDl.saveAs(epsPath)
const eps = readFileSync(epsPath, 'utf8')
ok(eps.includes('%!PS-Adobe'), `EPS export is PostScript (${eps.length} chars)`)

/* --------------------------------------------------------- page delete */
section('page deletion')
step = 'delete-page'
await page.locator('[aria-label="New page"]').click()
await sleep(300)
let pages = await page.locator('section:has-text("Pages") [aria-label^="Delete "]').count()
ok(pages === 2, `every page shows a delete control while >1 page (${pages})`)
await page.locator('[aria-label="Delete Page 2"]').click()
await sleep(300)
ok((await page.locator('[role="alertdialog"]').count()) === 1, 'confirm dialog appears')
await page.getByRole('button', { name: 'Delete', exact: true }).click()
await sleep(400)
const pageNames = await page.evaluate(() => [...document.querySelectorAll('section')].filter((s) => s.textContent?.includes('Pages')).map((s) => s.textContent).join('|'))
ok(!pageNames.includes('Page 2'), `page removed from the list (${pageNames.replace(/\s+/g, ' ').slice(0, 60)})`)

console.log(`\nconsole/page errors: ${errors.length}`)
for (const e of errors.slice(0, 8)) console.log('  ', e.slice(0, 200))
failures += errors.length
await browser.close()
console.log(failures === 0 ? '\nBOARD CHECKS 3 PASSED' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
