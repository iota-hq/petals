/**
 * Design-system docs checks: every route in the nav renders a page with a title,
 * at least one section and a table of contents, with no console errors and no
 * horizontal overflow. Also walks the sidebar and takes reference screenshots.
 *
 * Run with the dev server up:  node scripts/designVerify.mjs
 */
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync } from 'node:fs'

const BASE = 'http://localhost:5173'
const ROUTES = [
  ['', 'Petals'],
  ['foundations/color', 'Color'],
  ['foundations/typography', 'Typography'],
  ['foundations/space', 'Space'],
  ['foundations/radius', 'Radius'],
  ['foundations/borders-and-lines', 'Borders and lines'],
  ['foundations/elevation', 'Elevation'],
  ['foundations/motion', 'Motion'],
  ['foundations/iconography', 'Iconography'],
  ['foundations/anti-slop', 'Anti-slop'],
  ['components/button', 'Button'],
  ['components/toolbar', 'Toolbar'],
  ['components/copy-button', 'Copy button'],
  ['components/field', 'Field'],
  ['components/input', 'Input'],
  ['components/textarea', 'Textarea'],
  ['components/chip', 'Chip'],
  ['components/number-input', 'Number input'],
  ['components/color-picker', 'Color picker'],
  ['components/select', 'Select'],
  ['components/segmented-control', 'Segmented control'],
  ['components/switch', 'Switch'],
  ['components/kbd', 'Kbd'],
  ['components/card', 'Card'],
  ['components/panel', 'Panel'],
  ['components/item', 'Item'],
  ['components/data-list', 'Data list'],
  ['components/truncate', 'Truncate'],
  ['components/empty-state', 'Empty state'],
  ['components/alert', 'Alert'],
  ['components/dialog', 'Dialog'],
  ['components/sheet', 'Sheet'],
  ['components/popover', 'Popover'],
  ['components/tooltip', 'Tooltip'],
  ['components/dropdown-menu', 'Dropdown menu'],
  ['components/tabs', 'Tabs'],
  ['components/collapsible', 'Collapsible'],
  ['components/filter-bar', 'Filter bar'],
  ['components/attachment', 'Attachment'],
]

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

const browser = await chromium.launch({ executablePath: exe, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

/** in-page navigation keeps the shell mounted, like a reader would move */
async function go(slug, title) {
  try {
    await page.goto(`${BASE}/design-system${slug ? '/' + slug : ''}`, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction((t) => {
      const h = document.querySelector('main h1')
      return !!h && h.textContent?.trim() === t
    }, title, { timeout: 12000 })
    await page.waitForTimeout(100)
    return true
  } catch {
    return false
  }
}

await go('', 'Petals')
const groups = await page.locator('aside nav > div').count()
ok(groups >= 12, `sidebar shows the nav groups (${groups})`)
ok((await page.locator('aside nav button').count()) >= ROUTES.length, 'every nav item is listed')
await page.screenshot({ path: 'test-artifacts/ds-intro.png', fullPage: false })

for (const [slug, title] of ROUTES.slice(1)) {
  const landed = await go(slug, title)
  if (!landed) {
    ok(false, `${title}: page missing at ${slug}`)
    continue
  }
  const h1 = (await page.locator('main h1').first().innerText()).trim()
  const sections = await page.locator('main section[data-toc]').count()
  const toc = await page.locator('aside a[href^="#"]').count()
  const usage = await page.locator('main section#usage').count()
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  ok(h1 === title, `${title}: heading`)
  ok(sections >= 1, `${title}: ${sections} sections`)
  ok(toc >= 1, `${title}: ${toc} toc entries`)
  ok(overflow <= 1, `${title}: no horizontal overflow (${overflow}px)`)
  if (!slug.startsWith('foundations/') && slug !== '') ok(usage === 1, `${title}: usage block`)
  const active = await page.locator('aside nav button[aria-current="page"]').innerText()
  ok(active.trim().startsWith(title), `${title}: sidebar marks it current`)
}

// mobile pass: drawer opens, page stays inside the viewport
await page.setViewportSize({ width: 390, height: 844 })
await go('components/panel', 'Panel')
const menu = page.locator('button[aria-label="Open the contents"]')
ok((await menu.count()) === 1, 'mobile: contents button')
await menu.click()
await page.waitForTimeout(250)
ok((await page.locator('button[aria-label="Close the contents"]').count()) === 1, 'mobile: drawer opens')
const mOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
)
ok(mOverflow <= 1, `mobile: no horizontal overflow (${mOverflow}px)`)
await page.screenshot({ path: 'test-artifacts/ds-mobile.png' })
await page.locator('button[aria-label="Close the contents"]').click()

await page.setViewportSize({ width: 1440, height: 900 })
await go('components/color-picker', 'Color picker')
await page.screenshot({ path: 'test-artifacts/ds-color-picker.png' })
await go('components/panel', 'Panel')
await page.screenshot({ path: 'test-artifacts/ds-panel.png' })
await go('foundations/typography', 'Typography')
await page.screenshot({ path: 'test-artifacts/ds-type.png' })

console.log(`\nconsole/page errors: ${errors.length}`)
for (const e of errors.slice(0, 8)) console.log('  ', e.slice(0, 180))
failures += errors.length

await browser.close()
console.log(failures === 0 ? '\nDESIGN SYSTEM CHECKS PASSED' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
