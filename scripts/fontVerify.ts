/**
 * Smoke test for the text property parity: Outline section on text, FontPicker
 * (google fonts index loads, search + pick Inter), text fill/shadow UI presence.
 * Bun-built variant: bun build scripts/fontVerify.ts --target=node --external=playwright-core --outfile=scripts/fontVerify.mjs && node scripts/fontVerify.mjs
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
    JSON.stringify([{ id: 'fonttest1', name: 'Font Test', createdAt: Date.now(), updatedAt: Date.now() }]),
  )
})
await page.goto('http://localhost:5173/board/fonttest1')
await page.waitForTimeout(900)

/** The persisted document. The store writes it on a short debounce, so wait for the key. */
const waitDoc = async (): Promise<{ nodes: Record<string, Record<string, unknown>> }> => {
  for (let i = 0; i < 20; i++) {
    const raw = await page.evaluate(() => localStorage.getItem('petal.doc.v1.fonttest1'))
    if (raw) return JSON.parse(raw)
    await page.waitForTimeout(150)
  }
  return { nodes: {} }
}

// draw a text node
await page.keyboard.press('t')
await page.mouse.click(500, 400)
await page.waitForTimeout(200)
await page.keyboard.type('Hello Petals')
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

console.log('— text panel parity —')
const section = (t: string) => page.locator('aside >> text=' + t).first()
ok((await section('Outline').count()) > 0, 'Outline section present for text')
ok((await section('Fill').count()) > 0, 'Fill section present for text')
ok((await section('Shadow').count()) > 0, 'Shadow section present for text')

console.log('— outline round-trip on text —')
// addable sections activate from the whole row: one click on the row adds the border
const hasStroke = Object.values((await waitDoc()).nodes).some((s) => s.type === 'text' && s.stroke)
if (!hasStroke) {
  const outlineRow = page.locator('aside div', { hasText: /^Outline\s*$/ }).last()
  await outlineRow.locator('button').last().click()
  await page.waitForTimeout(500)
}
const strokeAfterAdd = Object.values((await waitDoc()).nodes)
  .map((s) => s.stroke)
  .find(Boolean)
ok(!!strokeAfterAdd, 'outline row activation writes stroke onto the text shape')
ok(strokeAfterAdd === '#d9d9d9', 'added stroke uses the border color token')

await page.screenshot({ path: 'test-artifacts/text-panel.png' })

console.log('— a text box hugs its own text —')
type TextShape = { id: string; type: string; w: number; h: number; text?: string; autoWidth?: boolean }
/** The persisted text shape. The store writes on a 400 ms debounce, so wait past it. */
const box = async (): Promise<TextShape | undefined> => {
  await page.waitForTimeout(600)
  const nodes = (await waitDoc()).nodes
  return Object.values(nodes).find((s) => s.type === 'text') as TextShape | undefined
}
const born = await box()
ok(born?.autoWidth === true, 'a new text opens hugging its text, not as a fixed 320px box')
ok(!!born && born.w > 40 && born.w < 300, `and is only as wide as what was typed (${Math.round(born?.w ?? 0)}px)`)
ok(!!born && born.h < 60, `one line tall (${Math.round(born?.h ?? 0)}px)`)

// the second double-click on a text enters inline editing (the first only selects it)
const at = await page.evaluate((id) => {
  const el = document.querySelector(`[data-node-id="${id}"]:not([data-handle])`)!
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}, born!.id)
await page.mouse.dblclick(at.x, at.y)
await page.waitForTimeout(150)
await page.mouse.dblclick(at.x, at.y)
await page.waitForTimeout(300)
ok((await page.locator('[contenteditable="true"]').count()) === 1, 'a double-click on a text enters inline editing')

// Editing selects the text, so collapse the caret to the end before typing into it.
await page.keyboard.press('End')
await page.keyboard.press('Enter')
await page.keyboard.type('and a much longer second line')
await page.waitForTimeout(200)
const typing = await box()
ok(!!typing && typing.h > (born?.h ?? 0) * 1.6, `the box grows while the second line is typed (${Math.round(typing?.h ?? 0)}px)`)
await page.keyboard.press('Escape')
const two = await box()
ok(two?.text === 'Hello Petals\nand a much longer second line', `Enter starts a new line (${JSON.stringify(two?.text)})`)
ok(!!two && two.h > (born?.h ?? 0) * 1.6, `and the box is two lines tall (${Math.round(two?.h ?? 0)}px)`)
ok(!!two && two.w > (born?.w ?? 0) + 40, `its width follows the longer line (${Math.round(born?.w ?? 0)} → ${Math.round(two?.w ?? 0)}px)`)

// A dragged side handle is the user overruling the hug: the chosen width has to stick.
const handle = page.locator(`[data-handle="e"][data-node-id="${two!.id}"]`)
const hb = (await handle.boundingBox())!
await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2)
await page.mouse.down()
await page.mouse.move(hb.x + hb.width / 2 + 120, hb.y + hb.height / 2, { steps: 6 })
await page.mouse.up()
const sized = await box()
ok(!sized?.autoWidth, 'dragging a side handle clears the hug')
ok(!!sized && sized.w > (two?.w ?? 0) + 80, `and the width the person chose is kept (${Math.round(sized?.w ?? 0)}px)`)

console.log('— font picker —')
const trigger = page.locator('aside button[aria-label="Font family"]').first()
await trigger.click()
await page.waitForTimeout(1800) // let the google index load
const panel = page.locator('[role="dialog"][aria-label="Fonts"]')
ok((await panel.count()) === 1, 'the font list opens as a panel')
const search = page.getByLabel('Search fonts')
ok((await search.count()) === 1, 'font list opens with search')
ok((await search.getAttribute('placeholder')) === 'Search fonts', 'the search box is labelled like the library’s')

// The panel is anchored bottom-right: above the floating toolbar, flush to the left of the
// properties sidebar, so the inspector stays usable while the list is open.
const geom = await page.evaluate(() => {
  const p = document.querySelector('[role="dialog"][aria-label="Fonts"]')!.getBoundingClientRect()
  const bar = document.querySelector('[data-toolbar]')!.getBoundingClientRect()
  const aside = document.querySelector('[data-props-panel]')!.getBoundingClientRect()
  return { p: { l: p.left, t: p.top, r: p.right, b: p.bottom, w: p.width, h: p.height }, bar: { t: bar.top }, aside: aside.left, vw: innerWidth, vh: innerHeight }
})
ok(geom.p.b < geom.bar.t, 'it sits above the toolbar')
ok(Math.abs(geom.p.r - (geom.aside - 8)) < 2, 'its right edge is flush with the properties sidebar')
ok(geom.p.b > geom.vh - 140, 'it is anchored to the bottom')
ok(geom.p.w === 256 && Math.abs(geom.p.h - 380) < 2, `the same box as the asset library, clear of the canvas (${Math.round(geom.p.w)}×${Math.round(geom.p.h)})`)

await search.fill('Inter')
await page.waitForTimeout(250)
const rows = page.locator('[role="listbox"][aria-label="Fonts"] [role="option"]', { hasText: 'Inter' })
ok((await rows.count()) > 0, `search finds Inter (${await rows.count()} rows)`)
await page.screenshot({ path: 'test-artifacts/font-picker.png' }) // panel open, over the canvas
await rows.first().click()
await page.waitForTimeout(700)
const applied = Object.values((await waitDoc()).nodes).find((s) => s.type === 'text')?.fontFamily ?? ''
ok(applied.includes('Inter'), `fontFamily applied (${applied})`)

console.log(`console/page errors: ${errors.length}`)
ok(errors.length === 0, 'no console/page errors')

await browser.close()
if (failures) {
  console.log(`\n${failures} FAILURES`)
  process.exit(1)
}
console.log('\nFONT CHECKS PASSED')
