import { chromium } from 'playwright-core'
import { existsSync } from 'node:fs'
const exe = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
].find(existsSync)
const browser = await chromium.launch({ executablePath: exe, headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))
for (const s of process.argv.slice(2)) {
  const [slug, name, full] = s.split('|')
  await page.goto('http://localhost:5173/design-system' + (slug ? '/' + slug : ''), { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  await page.screenshot({ path: `test-artifacts/${name}.png`, fullPage: full === 'full' })
  console.log('shot', name)
}
console.log('errors', errors.slice(0, 6))
await browser.close()
