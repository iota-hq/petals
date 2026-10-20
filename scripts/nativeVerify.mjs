/**
 * Petals native-export verification.
 *
 * The native export is not a picture import: `import-native.jsx` builds real text layers and
 * shape layers in After Effects. This suite drives the real Export menu, unpacks the zip and
 * checks the scene + builder it ships.
 *
 * Run (dev server up on :5173):  node scripts/nativeVerify.mjs
 */
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = 'http://localhost:5173'
const PROJECT = 'nativeverify'

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
  (id) => localStorage.setItem('petal.projects.v1', JSON.stringify([{ id, name: 'Native Verify', createdAt: Date.now(), updatedAt: Date.now() }])),
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
await page.keyboard.type('Editable text')
await page.keyboard.press('Escape')
await sleep(600)

all = await shapes()
const kids = all.filter((s) => s.parentId === frameId)
ok(kids.length === 3, `frame holds three layers (${kids.map((k) => k.type).join(', ')})`)

section('export → Native writes a scene + a layer builder')
step = 'export'
await page.locator(`[data-layer-row="${frameId}"]`).click()
await sleep(250)
const nativeItem = page.locator('div.fixed button', { hasText: /^Native/ }).first()
let opened = false
for (let i = 0; i < 3 && !opened; i++) {
  await page.locator('button[aria-label="Export"]').first().click()
  await sleep(350)
  opened = (await nativeItem.count()) > 0
}
ok(opened, 'the menu offers Native')

const [download] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), nativeItem.click()])
const zipPath = path.join('test-artifacts', 'native.zip')
await download.saveAs(zipPath)
ok(/-native\.zip$/.test(download.suggestedFilename()), `download is named after the frame (${download.suggestedFilename()})`)

const files = readZip(readFileSync(zipPath))
ok(files.has('scene.json'), 'scene present')
ok(files.has('import-native.jsx'), 'builder present')
ok(files.has('README.txt'), 'readme present')

const scene = JSON.parse(files.get('scene.json').toString('utf8'))
ok(scene.format === 'petals-native@1', `scene format (${scene.format})`)
ok(
  Math.abs(scene.frame.width - frame.w) < 1 && Math.abs(scene.frame.height - frame.h) < 1,
  `scene frame matches the frame (${scene.frame.width}×${scene.frame.height})`,
)

const textLayer = scene.layers.find((l) => l.kind === 'text')
ok(!!textLayer && textLayer.text === 'Editable text', `text is a native text layer (${textLayer?.text})`)
ok(!!textLayer && textLayer.fontSize > 0 && textLayer.font.includes('-'), `text carries font + size (${textLayer?.font} ${textLayer?.fontSize})`)
ok(!!textLayer && Array.isArray(textLayer.color) && textLayer.color.length === 4, 'text carries an editable colour')
ok(!!textLayer && textLayer.w > 0 && textLayer.h > 0, `text keeps its measured box (${Math.round(textLayer?.w)}×${Math.round(textLayer?.h)})`)

const shapeLayers = scene.layers.filter((l) => l.kind === 'shape')
ok(shapeLayers.some((l) => l.geom === 'rect'), 'rect stays a shape layer')
ok(shapeLayers.some((l) => l.geom === 'ellipse'), 'ellipse stays a shape layer')
ok(!!!scene.layers.find((l) => l.kind === 'shape' && !l.fill && !l.stroke), 'no empty shape layers')
ok(scene.layers.length >= 3, `every visible layer is represented (${scene.layers.length})`)

const jsx = files.get('import-native.jsx').toString('utf8')
ok(/addText\(/.test(jsx) && /addShape\(/.test(jsx), 'builder creates text + shape layers')
ok(/ADBE Vector Shape - Rect/.test(jsx) && /ADBE Vector Shape - Ellipse/.test(jsx), 'builder writes vector paths')
ok(/ADBE Ramp/.test(jsx) && /ADBE Drop Shadow/.test(jsx), 'builder writes gradient + shadow effects')
ok(!/getFiles|\.read\(/.test(jsx), 'builder reads nothing from disk')
ok(jsx.includes(String(scene.frame.width)) && jsx.includes(String(scene.frame.height)), 'builder knows the frame size')

writeFileSync(path.join('test-artifacts', 'native-scene.json'), JSON.stringify(scene, null, 2))

// the same design as a flat PNG, so the native render can be compared with it
step = 'png'
const pngItem = page.locator('div.fixed button', { hasText: /^PNG/ }).first()
opened = false
for (let i = 0; i < 3 && !opened; i++) {
  await page.locator('button[aria-label="Export"]').first().click()
  await sleep(350)
  opened = (await pngItem.count()) > 0
}
if (opened) {
  const [png] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), pngItem.click()])
  await png.saveAs(path.join('test-artifacts', 'native-app.png'))
}
ok(opened, 'reference PNG exported for comparison')

console.log(`\nconsole/page errors: ${errors.length}`)
for (const e of errors.slice(0, 6)) console.log('  ', e.slice(0, 200))
failures += errors.length

await browser.close()
console.log(failures === 0 ? '\nNATIVE EXPORT CHECKS PASSED' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
