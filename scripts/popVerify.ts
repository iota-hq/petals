/**
 * Popover placement: sidebar color popup must open over the canvas (left of the panel).
 * bun build scripts/popVerify.ts --target=node --external=playwright-core --outfile=scripts/popVerify.mjs && node scripts/popVerify.mjs
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
    JSON.stringify([{ id: 'poptest1', name: 'Pop Test', createdAt: Date.now(), updatedAt: Date.now() }]),
  )
})
await page.goto('http://localhost:5173/board/poptest1')
await page.waitForTimeout(900)

// draw a rect so the properties panel shows Fill
await page.keyboard.press('r')
await page.mouse.move(500, 400)
await page.mouse.down()
for (let i = 1; i <= 6; i++) await page.mouse.move(500 + i * 25, 400 + i * 18)
await page.mouse.up()
await page.waitForTimeout(250)

// open the fill color popover via the boxed row swatch (role=button inside the Fill section)
const boxRow = page.locator('aside div[role="button"]').first()
await boxRow.click()
await page.waitForTimeout(350)
const popup = page.locator('div.fixed.z-50').first()
const visible = (await popup.count()) > 0
ok(visible, 'color popover opens')
if (visible) {
  const panelLeft = await page.evaluate(() => {
    const asides = document.querySelectorAll('aside')
    return asides.length > 1 ? asides[1].getBoundingClientRect().left : window.innerWidth
  })
  const b = await popup.boundingBox()
  ok(!!b && b.x + b.width <= panelLeft, `popover sits over the canvas (x=${b?.x}, right panel starts at ${panelLeft})`)
  await page.screenshot({ path: 'test-artifacts/popover-canvas.png' })
}

console.log(`console/page errors: ${errors.length}`)
ok(errors.length === 0, 'no console/page errors')

await browser.close()
if (failures) {
  console.log(`\n${failures} FAILURES`)
  process.exit(1)
}
console.log('\nPOP CHECKS PASSED')
