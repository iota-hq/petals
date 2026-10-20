/**
 * Petals layered-export verification.
 *
 * The .ai/.eps exports are a single flat PostScript stream, which After Effects
 * imports as one image. The layered export is the answer: one transparent,
 * full-frame PNG per top-level layer. This suite drives the real Export menu and
 * inspects the zip it produces.
 *
 * Run (dev server up on :5173):  node scripts/layersVerify.mjs
 */
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = 'http://localhost:5173'
const PROJECT = 'layersverify'

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

let failures = 0
const ok = (cond, label) => {
  console.log(cond ? `ok   ${label}` : `FAIL ${label}`)
  if (!cond) failures++
}
const section = (n) => console.log(`\n— ${n} —`)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Our zip writer stores entries uncompressed, so a local-header walk is enough. */
function readZip(buf) {
  const files = new Map()
  let i = 0
  while (i + 30 <= buf.length) {
    if (buf.readUInt32LE(i) !== 0x04034b50) break
    const method = buf.readUInt16LE(i + 8)
    const size = buf.readUInt32LE(i + 18)
    const nameLen = buf.readUInt16LE(i + 26)
    const extraLen = buf.readUInt16LE(i + 28)
    const name = buf.toString('utf8', i + 30, i + 30 + nameLen)
    const start = i + 30 + nameLen + extraLen
    if (method !== 0) throw new Error(`expected STORE, got method ${method} for ${name}`)
    files.set(name, buf.subarray(start, start + size))
    i = start + size
  }
  return files
}

const pngSize = (b) => ({ w: b.readUInt32BE(16), h: b.readUInt32BE(20) })

const browser = await chromium.launch({ executablePath: exe, headless: true })
const page = await browser.newPage({ viewport: { width: 1520, height: 900 }, acceptDownloads: true })
const errors = []
let step = 'boot'
page.on('console', (m) => m.type() === 'error' && errors.push(`[${step}] ${m.text()}`))
page.on('pageerror', (e) => errors.push(`[${step}] pageerror: ${e.message}`))

const doc = async () => {
  await sleep(500)
  return page.evaluate((id) => JSON.parse(localStorage.getItem(`petal.doc.v1.${id}`) ?? '{"nodes":{}}'), PROJECT)
}
const shapes = async () => Object.values((await doc()).nodes)
const draw = async (x1, y1, x2, y2) => {
  await page.mouse.move(x1, y1)
  await page.mouse.down()
  await page.mouse.move(x2, y2, { steps: 8 })
  await page.mouse.up()
  await sleep(220)
}

section('boot')
step = 'boot'
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.evaluate(() => localStorage.clear())
await page.evaluate(
  (id) => localStorage.setItem('petal.projects.v1', JSON.stringify([{ id, name: 'Layers Verify', createdAt: Date.now(), updatedAt: Date.now() }])),
  PROJECT,
)
await page.goto(`${BASE}/board/${PROJECT}`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('[aria-label="New page"]', { timeout: 15000 })
await sleep(700)
ok(true, 'board opened')

section('a frame with three layers')
step = 'draw'
await page.keyboard.press('f')
await draw(360, 160, 1160, 620)
let all = await shapes()
const frameId = all.find((s) => s.type === 'frame').id
const frame = all.find((s) => s.id === frameId)
ok(frame.w > 700 && frame.h > 400, `frame drawn (${Math.round(frame.w)}×${Math.round(frame.h)})`)

await page.keyboard.press('r')
await draw(420, 230, 640, 400)
await page.keyboard.press('o')
await draw(700, 230, 900, 400)
await page.keyboard.press('t')
await page.mouse.click(440, 470)
await page.keyboard.type('Layered text')
await page.keyboard.press('Escape')
await sleep(600)

all = await shapes()
const kids = all.filter((s) => s.parentId === frameId)
ok(kids.length === 3, `frame holds three layers (${kids.map((k) => k.type).join(', ')})`)

section('export → Layers writes a zip of full-frame PNGs')
step = 'export'
await page.locator(`[data-layer-row="${frameId}"]`).click()
await sleep(250)
const layerItem = page.locator('div.fixed button', { hasText: /^Layers/ }).first()
let opened = false
for (let i = 0; i < 3 && !opened; i++) {
  await page.locator('button[aria-label="Export"]').first().click()
  await sleep(350)
  opened = (await layerItem.count()) > 0
}
ok(opened, 'the menu offers Layers')
ok((await page.locator('div.fixed', { hasText: 'After Effects flattens' }).count()) > 0, 'the menu warns AI/EPS are flat')

const [download] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), layerItem.click()])
const zipPath = path.join('test-artifacts', 'layers.zip')
await download.saveAs(zipPath)
ok(/-layers\.zip$/.test(download.suggestedFilename()), `download is named after the frame (${download.suggestedFilename()})`)

const files = readZip(readFileSync(zipPath))
const pngs = [...files.keys()].filter((n) => n.startsWith('layers/') && n.endsWith('.png'))
ok(pngs.length === 4, `four layer PNGs (${pngs.length})`)
ok(files.has('layers.json'), 'manifest present')
ok(files.has('import.jsx'), 'one-step importer present')
ok(files.has('IMPORT-AFTER-EFFECTS.txt'), 'import notes present')

const manifest = JSON.parse(files.get('layers.json').toString('utf8'))
ok(manifest.format === 'petals-layers@1', `manifest format (${manifest.format})`)
ok(
  Math.abs(manifest.frame.width - frame.w) < 1 && Math.abs(manifest.frame.height - frame.h) < 1,
  `manifest frame matches the frame (${manifest.frame.width}×${manifest.frame.height})`,
)
ok(manifest.layers.length === 4, `manifest lists four layers (${manifest.layers.length})`)
ok(manifest.layers.map((l) => l.name).join(',') === [frame.name, ...kids.map((k) => k.name)].join(','), 'layer names come from the doc, frame first')
const textLayer = manifest.layers.find((l) => l.type === 'text')
ok(!!textLayer && textLayer.text === 'Layered text', `text metadata survives (${textLayer?.text})`)

const sizes = pngs.map((n) => pngSize(files.get(n)))
ok(
  sizes.every((s) => s.w === Math.round(frame.w) && s.h === Math.round(frame.h)),
  `every PNG is frame-sized (${sizes.map((s) => `${s.w}×${s.h}`).join(', ')})`,
)
ok(
  pngs.every((n) => files.get(n).subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))),
  'entries are real PNGs',
)
ok(pngs.every((n, i) => /^\d\d /.test(n.split('/')[1]) && n.split('/')[1].startsWith(String(i + 1).padStart(2, '0'))), 'files are numbered in stack order')

// the importer must be self-contained: no Folder.getFiles, no manifest read, every layer inlined
const jsx = files.get('import.jsx').toString('utf8')
ok(/addComp\(/.test(jsx) && /ImportAsType\.FOOTAGE/.test(jsx), 'importer builds a comp and imports footage')
ok(!/getFiles|\.read\(/.test(jsx), 'importer reads nothing from disk')
ok(pngs.every((n) => jsx.includes(n)), 'importer lists every PNG')
ok(
  jsx.includes(String(Math.round(manifest.frame.width))) && jsx.includes(String(Math.round(manifest.frame.height))),
  `importer knows the frame size (${Math.round(manifest.frame.width)}×${Math.round(manifest.frame.height)})`,
)

console.log(`\nconsole/page errors: ${errors.length}`)
for (const e of errors.slice(0, 6)) console.log('  ', e.slice(0, 200))
failures += errors.length

await browser.close()
console.log(failures === 0 ? '\nLAYER EXPORT CHECKS PASSED' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
