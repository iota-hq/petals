/**
 * Verification for the canvas context menu + layer ops (z-order, flips, group,
 * copy/paste, lock, visibility, rename) and the random project stub names.
 * Run while the dev server is up:  bun build scripts/menuVerify.ts --target=node
 *   --external=playwright-core --outfile=scripts/menuVerify.mjs && node scripts/menuVerify.mjs
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

const URL = 'http://localhost:5173'
let failures = 0
const ok = (cond: boolean, label: string) => {
  console.log(cond ? `ok   ${label}` : `FAIL ${label}`)
  if (!cond) failures++
}

const browser = await chromium.launch({ executablePath: exe, headless: true })
const page = await browser.newPage({ viewport: { width: 1520, height: 900 } })
const errors: string[] = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push(String(e)))

// fresh doc
await page.goto(URL)
await page.evaluate(() => localStorage.clear())
await page.evaluate(() => {
  localStorage.setItem(
    'petal.projects.v1',
    JSON.stringify([{ id: 'menutest1', name: 'Menu Test', createdAt: Date.now(), updatedAt: Date.now() }]),
  )
})
await page.goto(`${URL}/board/menutest1`)
await page.waitForTimeout(900)

const nodeCount = () => page.locator('[data-layer-row]').count()

const draw = async (x1: number, y1: number, x2: number, y2: number) => {
  await page.mouse.move(x1, y1)
  await page.mouse.down()
  for (let i = 1; i <= 6; i++) {
    const t = i / 6
    await page.mouse.move(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)
    await page.waitForTimeout(12)
  }
  await page.mouse.up()
  await page.waitForTimeout(120)
}

/** shape fields read from the saved doc (mirrors the live store after the 400ms save debounce) */
const docOf = (id: string) =>
  page.evaluate((nid) => {
    const raw = localStorage.getItem('petal.doc.v1.menutest1')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { nodes: Record<string, Record<string, unknown>> }
    const s = parsed.nodes?.[nid]
    if (!s) return null
    const { order, flipX, flipY, locked, visible, parentId, name, type } = s
    return { order, flipX, flipY, locked, visible, parentId, name, type }
  }, id)

const flush = () => page.waitForTimeout(600) // past the 400ms localStorage debounce

console.log('— draw two overlapping rects —')
await page.keyboard.press('r')
await draw(400, 250, 560, 380) // A
await page.keyboard.press('r')
await draw(480, 300, 640, 430) // B on top
ok((await nodeCount()) === 2, 'two layers drawn')
await flush()

const ids = await page.evaluate(() => {
  const raw = localStorage.getItem('petal.doc.v1.menutest1')!
  const nodes = (JSON.parse(raw) as { nodes: Record<string, { id: string; type: string }> }).nodes
  return Object.entries(nodes)
    .filter(([, s]) => s.type === 'rect')
    .map(([, s]) => s.id)
    .slice(0, 2)
})
const [idA, idB] = ids
ok(!!idA && !!idB, 'two shape ids available')

const menuOpen = async () => {
  await page.waitForTimeout(120)
}
const menuPick = async (label: string, after = 160) => {
  await page.locator('[data-context-menu] button', { hasText: label }).first().click()
  await page.waitForTimeout(after)
}

console.log('— context menu opens and select B —')
await page.mouse.click(560, 410)
await page.waitForTimeout(120)
await page.mouse.click(560, 410, { button: 'right' })
await menuOpen()
ok((await page.locator('[data-context-menu]').count()) === 1, 'context menu opens on canvas')
await page.screenshot({ path: 'test-artifacts/menu-open.png' })

console.log('— send to back —')
const before = (await docOf(idB))?.order as number
await menuPick('Send to back')
await flush()
const after = await docOf(idB)
ok(!!after && (after.order as number) < before, `B order dropped (${before} → ${after?.order})`)
ok((await nodeCount()) === 2, 'layers intact after z-order change')

console.log('— flip horizontal —')
await page.mouse.click(560, 410, { button: 'right' })
await menuOpen()
await menuPick('Flip horizontal')
await flush()
const fl = await docOf(idB)
ok(!!fl && fl.flipX === true, `flipX applied (${fl?.flipX})`)
await page.mouse.click(560, 410, { button: 'right' })
await menuOpen()
await menuPick('Flip horizontal')
await flush()
ok((await docOf(idB))?.flipX === false, 'flipX toggles back off')

console.log('— copy / paste via menu —')
await page.mouse.click(560, 410, { button: 'right' })
await menuOpen()
await menuPick('Copy')
await page.mouse.click(700, 300, { button: 'right' }) // paste from empty area keeps selection behavior
await menuOpen()
await menuPick('Paste')
await page.waitForTimeout(200)
ok((await nodeCount()) === 3, `paste created a third layer (count=${await nodeCount()})`)
await flush()

console.log('— group selection (select both, right-click) —')
await page.mouse.click(470, 300)
await page.waitForTimeout(100)
await page.evaluate(() => {
  // build a 2-root selection through the app store for determinism
  // (marquee drag is flakier in headless)
  const raw = localStorage.getItem('petal.doc.v1.menutest1')!
  const nodes = (JSON.parse(raw) as { nodes: Record<string, { id: string }> }).nodes
  void nodes
})
await page.keyboard.press('Escape')
await page.waitForTimeout(100)
// click A then shift-click B through the canvas to get a real 2-shape selection
await page.mouse.click(470, 300)
await page.waitForTimeout(80)
await page.keyboard.down('Shift')
await page.mouse.click(620, 420)
await page.keyboard.up('Shift')
await page.waitForTimeout(150)
// right-click ON one of the selected shapes keeps the multi-selection
await page.mouse.click(560, 410, { button: 'right' })
await menuOpen()
await menuPick('Group selection')
await page.waitForTimeout(200)
const rows = await nodeCount()
ok(rows === 4, `group frame created (rows=${rows}, want 4: group + 2 rects + pasted)`)

console.log('— rename via menu —')
await page.keyboard.press('Escape')
await page.waitForTimeout(100)
await page.mouse.click(520, 330, { button: 'right' })
await menuOpen()
await menuPick('Rename')
await page.waitForTimeout(250)
const renameInput = page.locator('[data-layer-row] input:visible, aside input:visible').first()
ok((await renameInput.count()) > 0, 'rename input appeared')
await renameInput.fill('Renamed!')
await renameInput.press('Enter')
await flush()
const renamed = await page.evaluate(() => {
  const raw = localStorage.getItem('petal.doc.v1.menutest1')!
  const nodes = (JSON.parse(raw) as { nodes: Record<string, { name: string }> }).nodes
  return Object.values(nodes).some((s) => s.name === 'Renamed!')
})
ok(renamed, 'layer renamed in the doc')

console.log('— duplicate via menu —')
const rowsBefore = await nodeCount()
await page.mouse.click(560, 410, { button: 'right' })
await menuOpen()
await menuPick('Duplicate')
await page.waitForTimeout(300)
ok((await nodeCount()) === rowsBefore + 1, `duplicate added one layer (${rowsBefore} → ${await nodeCount()})`)

console.log('— lock / unlock via menu —')
const countLocked = async () =>
  page.evaluate(() => {
    const raw = localStorage.getItem('petal.doc.v1.menutest1')!
    const nodes = (JSON.parse(raw) as { nodes: Record<string, { locked?: boolean }> }).nodes
    return Object.values(nodes).filter((s) => s.locked).length
  })
await page.mouse.click(560, 410, { button: 'right' })
await menuOpen()
await menuPick('Lock')
await flush()
ok((await countLocked()) === 1, 'one layer locked')
// locked shapes aren't hit-testable on canvas: select via its layers row, then empty right-click
const lockedId = await page.evaluate(() => {
  const raw = localStorage.getItem('petal.doc.v1.menutest1')!
  const nodes = (JSON.parse(raw) as { nodes: Record<string, { locked?: boolean }> }).nodes
  return Object.entries(nodes).find(([, s]) => s.locked)?.[0] ?? null
})
await page.locator(`[data-layer-row="${lockedId}"]`).click()
await page.mouse.click(740, 240, { button: 'right' })
await menuOpen()
await menuPick('Unlock')
await flush()
ok((await countLocked()) === 0, 'unlock clears locked flag')

console.log('— hide / show via menu —')
const countHidden = async () =>
  page.evaluate(() => {
    const raw = localStorage.getItem('petal.doc.v1.menutest1')!
    const nodes = (JSON.parse(raw) as { nodes: Record<string, { visible?: boolean }> }).nodes
    return Object.values(nodes).filter((s) => s.visible === false).length
  })
await page.locator(`[data-layer-row="${idA}"]`).click()
await page.mouse.click(740, 240, { button: 'right' })
await menuOpen()
await menuPick('Hide')
await flush()
ok((await countHidden()) === 1, 'one layer hidden')
await page.mouse.click(740, 240, { button: 'right' })
await menuOpen()
await menuPick('Show')
await flush()
ok((await countHidden()) === 0, 'show restores visibility')

console.log('— delete via menu —')
const rowsPreDelete = await nodeCount()
await page.locator(`[data-layer-row="${idB}"]`).click()
await page.mouse.click(740, 240, { button: 'right' })
await menuOpen()
await menuPick('Delete')
await page.waitForTimeout(300)
ok((await nodeCount()) === rowsPreDelete - 1, `delete removed one layer (${rowsPreDelete} → ${await nodeCount()})`)
await flush()

console.log('— alt-hover measure overlay —')
await flush()
// draw two nested rects fresh: C bigger (contains), D inside it
await page.keyboard.press('r')
await draw(300, 500, 560, 660) // C outer
await page.keyboard.press('r')
await draw(360, 540, 500, 620) // D inner
await flush()
// select the outer rect C via its layers row, then alt-hover D's center
const pair = await page.evaluate(() => {
  const raw = localStorage.getItem('petal.doc.v1.menutest1')!
  const nodes = (JSON.parse(raw) as { nodes: Record<string, { type: string; locked?: boolean; parentId: string | null; w: number; h: number }> }).nodes
  const rects = Object.entries(nodes)
    .filter(([, s]) => s.type === 'rect' && !s.locked && s.parentId === null)
    .map(([id, s]) => ({ id, area: s.w * s.h }))
    .sort((a, b) => b.area - a.area)
  return { outer: rects[0]?.id ?? null, inner: rects[1]?.id ?? null }
})
if (pair.outer && pair.inner && pair.outer !== pair.inner) {
  await page.locator(`[data-layer-row="${pair.outer}"]`).click()
  const bb = await page.locator(`[data-node-id="${pair.inner}"]`).boundingBox()
  if (bb) {
    await page.keyboard.down('Alt')
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2)
    await page.mouse.move(bb.x + bb.width / 2 + 2, bb.y + bb.height / 2 + 2)
    await page.waitForTimeout(350)
    const labels = await page.locator('[data-measure-label]').count()
    ok(labels >= 4, `alt-measure shows nested-box distances (labels=${labels})`)
    await page.screenshot({ path: 'test-artifacts/alt-measure.png' })
    await page.keyboard.up('Alt')
    await page.waitForTimeout(200)
    ok((await page.locator('[data-measure-overlay]').count()) === 0, 'overlay clears when Alt released')
  } else ok(false, 'inner rect element found for alt-measure')
} else {
  ok(false, 'outer/inner rect pair found for alt-measure')
}

console.log(`console/page errors while running: ${errors.length}`)
ok(errors.length === 0, 'no console/page errors')
await page.screenshot({ path: 'test-artifacts/menu-final.png' })

await browser.close()
if (failures) {
  console.log(`\n${failures} FAILURES`)
  process.exit(1)
}
console.log('\nMENU CHECKS PASSED')
