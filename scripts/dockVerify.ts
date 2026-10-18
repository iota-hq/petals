/**
 * Drag-to-fill (edge strips): toolbar toggle shows dashed pink strips, dragging the
 * canvas onto one docks the view (fit along that axis) and turns the mode off.
 * bun build scripts/dockVerify.ts --target=node --external=playwright-core --outfile=scripts/dockVerify.mjs && node scripts/dockVerify.mjs
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

let failures = 0
const ok = (cond: boolean, label: string) => {
  console.log(cond ? `ok   ${label}` : `FAIL ${label}`)
  if (!cond) failures++
}

const browser = await chromium.launch({ executablePath: exe, headless: true })
const page = await browser.newPage({ viewport: { width: 1520, height: 900 } })
const errors: string[] = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto('http://localhost:5173')
await page.evaluate(() => localStorage.clear())
await page.evaluate(() => {
  localStorage.setItem(
    'petal.projects.v1',
    JSON.stringify([{ id: 'dock1', name: 'Dock', createdAt: Date.now(), updatedAt: Date.now() }]),
  )
})
await page.goto('http://localhost:5173/board/dock1')
await page.waitForTimeout(900)

// a tall-ish rect so fit-height docking visibly changes zoom
await page.keyboard.press('r')
await page.mouse.move(600, 300)
await page.mouse.down()
for (let i = 1; i <= 5; i++) await page.mouse.move(600 + i * 40, 300 + i * 70)
await page.mouse.up()
await page.waitForTimeout(300)

const zoomOf = () =>
  page.evaluate(() => {
    const root = document.querySelector('[data-canvas-root]')
    const world = root?.firstElementChild as HTMLElement | null
    const m = /scale\(([\d.]+)\)/.exec(world?.style.transform ?? '')
    return m ? Number(m[1]) : null
  })
const zoomBefore = await zoomOf()

// toggle the drag-to-fill mode (toolbar button after redo)
const dragBtn = page.locator('[aria-label="Drag canvas to fill the screen"]')
ok((await dragBtn.count()) === 1, 'toolbar drag-to-fill button present')
await dragBtn.click()
await page.waitForTimeout(200)
ok((await page.locator('[data-dock-zone]').count()) === 4, 'four dashed strips appear')

// hover lights the left strip (canvas starts right of the ~264px layers panel)
await page.mouse.move(320, 450)
await page.waitForTimeout(120)
const leftBg = await page.evaluate(
  () => document.querySelector('[data-dock-zone="left"]')?.className ?? '',
)
ok(/bg-\[#f472b6\]\/15/.test(leftBg), 'left strip lights on hover')

// drag the canvas (any pointerdown pans in this mode) and drop on the left strip
await page.mouse.move(900, 500)
await page.mouse.down()
for (let i = 1; i <= 6; i++) await page.mouse.move(900 - i * 97, 500)
await page.mouse.up()
await page.waitForTimeout(500)

const zoomAfter = await zoomOf()
const rootH = await page.evaluate(
  () => (document.querySelector('[data-canvas-root]') as HTMLElement)?.clientHeight ?? 0,
)
const expected = (rootH - 48) / 350 // drop rect height drawn above: 350
ok(
  zoomAfter != null && Math.abs(zoomAfter - expected) < 0.02,
  `left drop fits full height (zoom ${zoomAfter}, expected ~${expected.toFixed(3)})`,
)
ok((await page.locator('[data-dock-zone]').count()) === 0, 'mode turns off after docking')

// right strip round-trip
await dragBtn.click()
await page.waitForTimeout(150)
ok((await page.locator('[data-dock-zone]').count()) === 4, 're-toggle shows strips again')
await page.mouse.move(900, 500)
await page.mouse.down()
for (let i = 1; i <= 6; i++) await page.mouse.move(900 + i * 50, 500)
await page.mouse.up()
await page.waitForTimeout(500)
ok((await page.locator('[data-dock-zone]').count()) === 0, 'right drop docks and closes mode')
await page.screenshot({ path: 'test-artifacts/dock-right.png' })

console.log(`console/page errors: ${errors.length}`)
ok(errors.length === 0, 'no console/page errors')

await browser.close()
if (failures) {
  console.log(`\n${failures} FAILURES`)
  process.exit(1)
}
console.log('\nDOCK CHECKS PASSED')
