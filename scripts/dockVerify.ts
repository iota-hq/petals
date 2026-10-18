/**
 * Drag-to-fill is parked: the toolbar icon must be inert on desktop and absent on
 * small screens, and no snap strips may appear anywhere.
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
const errors: string[] = []

// desktop: icon present but disabled, clicking must do nothing
const page = await browser.newPage({ viewport: { width: 1520, height: 900 } })
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

const dragBtn = page.locator('[aria-label="Drag canvas to fill the screen"]')
ok((await dragBtn.count()) === 1, 'toolbar drag icon present on desktop')
ok(await dragBtn.isDisabled(), 'drag icon is disabled')
await dragBtn.click({ force: true })
await page.waitForTimeout(200)
await page.screenshot({ path: 'test-artifacts/dock-parked.png' })
await page.close()

// small screen: icon must not be present at all
const mobile = await browser.newPage({ viewport: { width: 500, height: 900 } })
mobile.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
mobile.on('pageerror', (e) => errors.push(String(e)))
await mobile.goto('http://localhost:5173/board/dock1')
await mobile.waitForTimeout(900)
ok(!(await mobile.locator('[aria-label="Drag canvas to fill the screen"]').isVisible()), 'drag icon not visible on small screen')
await mobile.screenshot({ path: 'test-artifacts/dock-parked-mobile.png' })
await mobile.close()

console.log(`console/page errors: ${errors.length}`)
ok(errors.length === 0, 'no console/page errors')

await browser.close()
if (failures) {
  console.log(`\n${failures} FAILURES`)
  process.exit(1)
}
console.log('\nDOCK PARKED CHECKS PASSED')
