/**
 * Right-panel interaction checks: inspector fields select-all on focus, hover tooltips wait 3s,
 * dropdown triggers toggle, and the pattern row keeps four motifs plus a library door.
 *
 * Run (dev server up on :5173):  node scripts/panelVerify.mjs
 */
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync } from 'node:fs'

const BASE = 'http://localhost:5173'
const PROJECT = 'panelverify'

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

const browser = await chromium.launch({ executablePath: exe, headless: true })
const page = await browser.newPage({ viewport: { width: 1520, height: 900 }, acceptDownloads: true })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

section('boot')
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.evaluate(() => localStorage.clear())
await page.evaluate(
  (id) => localStorage.setItem('petal.projects.v1', JSON.stringify([{ id, name: 'Panel Verify', createdAt: Date.now(), updatedAt: Date.now() }])),
  PROJECT,
)
await page.goto(`${BASE}/board/${PROJECT}`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('[aria-label="New page"]', { timeout: 15000 })
await page.keyboard.press('r')
await page.mouse.move(500, 300)
await page.mouse.down()
await page.mouse.move(760, 470, { steps: 8 })
await page.mouse.up()
await sleep(500)
const aside = page.locator('aside').last()
ok((await aside.locator('input[inputmode="decimal"]').count()) > 0, 'panel shows numeric fields')

section('a click on a value selects it')
const widthInput = aside.locator('input[inputmode="decimal"]').first()
await widthInput.click()
await sleep(150)
const sel = await widthInput.evaluate((el) => ({ start: el.selectionStart, end: el.selectionEnd, len: el.value.length }))
ok(sel.len > 0 && sel.start === 0 && sel.end === sel.len, `whole value selected (${sel.start}..${sel.end} of ${sel.len})`)

section('the value tooltip waits three seconds')
await page.mouse.move(10, 10)
await sleep(400)
await widthInput.hover()
await sleep(1200)
const early = await page.locator('[role="tooltip"]').count()
ok(early === 0, 'no tooltip after 1.2s')
await sleep(2400)
const late = await page.locator('[role="tooltip"]').filter({ hasText: /:/ }).count()
ok(late > 0, 'tooltip appears after ~3s')
const tipText = late ? await page.locator('[role="tooltip"]').first().innerText() : ''
ok(/^[^:]+:\s*[\d.-]/.test(tipText), `tooltip names the value (${tipText.replace(/\s+/g, ' ').slice(0, 40)})`)
await page.mouse.move(10, 10)

section('a dropdown trigger toggles')
const exportBtn = page.locator('button[aria-label="Export"]').first()
const nativeItem = page.locator('div.fixed button', { hasText: /^Native/ }).first()
let opened = false
for (let i = 0; i < 3 && !opened; i++) {
  await exportBtn.click()
  await sleep(300)
  opened = (await nativeItem.count()) > 0
}
ok(opened, 'dropdown opens')
await exportBtn.click()
await sleep(350)
ok((await nativeItem.count()) === 0, 'clicking the same trigger closes it')
await exportBtn.click()
await sleep(300)
ok((await nativeItem.count()) > 0, 'and it opens again')
await exportBtn.click()

section('the pattern row is four motifs + the library')
const addPattern = page.locator('button[aria-label="Add Pattern"]')
await addPattern.click()
await sleep(500)
const more = page.locator('button[aria-label="View more patterns"]')
ok((await more.count()) === 1, 'a library button sits at the end of the row')
const motifRow = more.locator('..')
const motifs = motifRow.locator('button[aria-pressed]')
ok((await motifs.count()) === 4, `four motifs inline (${await motifs.count()})`)
const groupLabels = aside.locator('p', { hasText: /^(Grid|Ink|Fade|Alternate)$/ })
ok((await groupLabels.count()) >= 2, `group headings read as words, not caps (${await groupLabels.count()})`)
await page.screenshot({ path: 'test-artifacts/panel-pattern.png' })

await more.click()
await sleep(600)
ok((await page.locator('[aria-label="Library"]').count()) > 0, 'the library opens from the row')

console.log(`\nconsole/page errors: ${errors.length}`)
for (const e of errors.slice(0, 5)) console.log('  ', e.slice(0, 160))
failures += errors.length

await browser.close()
console.log(failures === 0 ? '\nPANEL CHECKS PASSED' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
