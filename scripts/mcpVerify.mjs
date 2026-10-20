/**
 * Petals MCP verification.
 *
 * Drives the entire chain a real agent would use:
 *
 *   MCP client ──HTTP /mcp──▶ petals-mcp ──SSE+POST bridge──▶ editor tab ──▶ docStore
 *
 * Starts the server itself, opens a board with the ?mcp flag, then calls the
 * tools and checks both the returned values and what actually lands in the
 * browser (DOM + persisted document).
 *
 * Run (dev server up on :5173):  node scripts/mcpVerify.mjs
 */
import { chromium } from 'playwright-core'
import { existsSync, mkdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BASE = 'http://localhost:5173'
const PROJECT = 'mcpverify'
const BRIDGE_PORT = 8791

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

// never leave the server process behind, whatever happens below
const killServer = () => {
  try {
    server.kill()
  } catch {
    /* already gone */
  }
}
process.on('exit', killServer)

/* ---------------- MCP server process ---------------- */

const bun = process.env.BUN ?? 'bun'
const server = spawn(
  bun,
  ['run', 'mcp-server/petal-mcp.ts', '--port', String(BRIDGE_PORT), '--no-stdio'],
  { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
)
let serverLog = ''
server.stdout.on('data', (d) => (serverLog += d))
server.stderr.on('data', (d) => (serverLog += d))
server.on('exit', (code) => {
  if (code) console.log(`  [mcp server exited ${code}]\n${serverLog.slice(-800)}`)
})

async function waitForServer(timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      await fetch(`http://127.0.0.1:${BRIDGE_PORT}/bridge/boards`)
      return true
    } catch {
      await sleep(200)
    }
  }
  return false
}

if (!(await waitForServer())) {
  console.error('MCP server never came up:\n' + serverLog)
  server.kill()
  process.exit(1)
}

/* ---------------- MCP client ---------------- */

const client = new Client({ name: 'petals-verify', version: '0.0.0' })
await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${BRIDGE_PORT}/mcp`)))

const callTool = async (name, args = {}) => {
  const res = await client.callTool({ name, arguments: args })
  const txt = res.content?.find((c) => c.type === 'text')?.text ?? ''
  try {
    return JSON.parse(txt)
  } catch {
    return txt
  }
}

/* ---------------- browser ---------------- */

const browser = await chromium.launch({ executablePath: exe, headless: true })
const page = await browser.newPage({ viewport: { width: 1520, height: 900 } })
const errors = []
let step = 'boot'
page.on('console', (m) => m.type() === 'error' && errors.push(`[${step}] ${m.text()}`))
page.on('pageerror', (e) => errors.push(`[${step}] pageerror: ${e.message}`))
const shot = (n) => page.screenshot({ path: `test-artifacts/mcp-${n}.png` })
const rendered = () => page.$$eval('[data-node-id]:not([data-handle])', (els) => els.map((e) => e.getAttribute('data-node-id')))
const doc = () => page.evaluate((id) => JSON.parse(localStorage.getItem(`petal.doc.v1.${id}`) ?? '{"nodes":{}}'), PROJECT)

section('boot')
step = 'boot'
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.evaluate(() => localStorage.clear())
await page.evaluate(
  (id) => localStorage.setItem('petal.projects.v1', JSON.stringify([{ id, name: 'MCP Verify', createdAt: Date.now(), updatedAt: Date.now() }])),
  PROJECT,
)
await page.goto(`${BASE}/board/${PROJECT}?mcp=${BRIDGE_PORT}`, { waitUntil: 'domcontentloaded' })
// the bridge's EventSource stays open, so 'load' is not a reliable signal here
await page.waitForSelector('[aria-label="New page"]', { timeout: 15000 })
await sleep(600)
ok(true, 'board opened with the ?mcp bridge flag')

section('tools advertise themselves')
step = 'list-tools'
const toolNames = (await client.listTools()).tools.map((t) => t.name)
const wanted = ['list_boards', 'get_doc', 'create_shapes', 'update_shapes', 'delete_shapes', 'select_shapes', 'export_shapes']
ok(wanted.every((n) => toolNames.includes(n)), `all tools present (${toolNames.join(', ')})`)

section('the tab registers itself over the bridge')
step = 'list_boards'
let boards = { boards: [] }
for (let i = 0; i < 25 && !boards.boards.some((b) => b.projectId === PROJECT && b.live); i++) {
  await sleep(300)
  boards = await callTool('list_boards')
}
ok(boards.boards.length === 1, `one board is known (${boards.boards.length})`)
ok(boards.boards[0]?.projectId === PROJECT, `board id matches (${boards.boards[0]?.projectId})`)
ok(boards.boards[0]?.live === true, 'board reports a live editor tab')

section('create_shapes lands in the browser')
step = 'create'
const made = await callTool('create_shapes', {
  projectId: PROJECT,
  shapes: [
    { type: 'frame', name: 'MCP Card', x: 200, y: 140, w: 420, h: 300, fill: '#ffffff', radius: 16 },
    { type: 'rect', name: 'MCP Swatch', x: 40, y: 40, w: 120, h: 120, fill: '#3b82f6', radius: 12 },
    { type: 'text', text: 'Hello from MCP', x: 40, y: 190, w: 300, fontSize: 28, color: '#111111' },
  ],
})
ok(made.count === 3 && made.created.length === 3, `created 3 shapes (${made.created?.length})`)
const frameId = made.created[0]
const swatchId = made.created[1]
// nest the rect + text inside the frame using a second call
const gone = await callTool('update_shapes', {
  projectId: PROJECT,
  patches: [
    { id: swatchId, fields: { parentId: frameId } },
    { id: made.created[2], fields: { parentId: frameId } },
  ],
})
ok(gone.updated === 2, `re-parented 2 shapes into the frame (${gone.updated})`)
await sleep(600)
await shot('created')
const domIds = await rendered()
ok(made.created.every((id) => domIds.includes(id)), `all three render on the canvas (${domIds.length} nodes)`)
const persisted = await doc()
ok(made.created.every((id) => persisted.nodes[id]), 'all three are in the persisted document')
ok(persisted.nodes[swatchId].parentId === frameId, 'the swatch really is a child of the frame')

section('update_shapes mutates the live document')
step = 'update'
const upd = await callTool('update_shapes', {
  projectId: PROJECT,
  patches: [
    { id: swatchId, fields: { fill: '#f97316', x: 200, y: 40, w: 180 } },
    { id: frameId, fields: { name: 'MCP Card (edited)', layoutFlow: 'v', gap: 16 } },
  ],
})
ok(upd.updated === 2, `two shapes patched (${upd.updated})`)
await sleep(600)
const after = await doc()
ok(after.nodes[swatchId].fill === '#f97316', `fill updated in the doc (${after.nodes[swatchId].fill})`)
const paint = await page
  .locator(`[data-node-id="${swatchId}"]`)
  .first()
  .evaluate((el) => getComputedStyle(el).backgroundColor)
ok(paint === 'rgb(249, 115, 22)', `fill painted in the DOM (${paint})`)
ok(after.nodes[frameId].layoutFlow === 'v', 'frame picked up the auto-layout flow')
await shot('updated')

section('get_doc reflects the browser')
step = 'get_doc'
const snapped = await callTool('get_doc', { projectId: PROJECT })
ok(Object.keys(snapped.nodes).length === 3, `get_doc sees 3 shapes (${Object.keys(snapped.nodes).length})`)
ok(snapped.nodes[frameId].name === 'MCP Card (edited)', 'get_doc sees the renamed frame')

section('select_shapes drives the editor selection')
step = 'select'
await callTool('select_shapes', { projectId: PROJECT, ids: [swatchId] })
await sleep(300)
const selected = await page.$$eval('[data-handle]', (els) => els.length)
ok(selected > 0, `selection handles appeared (${selected})`)

section('MCP edits are ordinary, undoable edits')
step = 'undo'
await page.locator('body').click({ position: { x: 700, y: 700 } })
await page.keyboard.press('Control+z')
await sleep(500)
const undone = await doc()
ok(undone.nodes[swatchId].fill === '#3b82f6', `Ctrl+Z reverted the MCP fill change (${undone.nodes[swatchId]?.fill})`)
ok(undone.nodes[frameId].layoutFlow !== 'v', 'the whole update_shapes call was one undo step')

section('an image shape keeps its artwork (fill → src)')
step = 'image'
// a 1×1 PNG — the trap this guards: image shapes paint from `src`, so an artwork object handed
// over as `fill` used to be dropped and leave an invisible shape on the canvas.
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=='
const img = await callTool('create_shapes', {
  projectId: PROJECT,
  shapes: [{ type: 'image', name: 'MCP Pixel', x: 300, y: 60, w: 80, h: 80, fill: { type: 'image', src: PIXEL } }],
})
const imgId = img.created?.[0]
ok(img.count === 1 && Boolean(imgId), `created an image shape (${img.count})`)
await sleep(600)
const imgDoc = await doc()
ok(imgDoc.nodes[imgId]?.src === PIXEL, 'the fill image object was hoisted onto src')
const painted = await page.locator(`img[data-node-id="${imgId}"]`).count()
ok(painted === 1, `the artwork actually paints in the DOM (${painted} <img>)`)
await shot('image')
await callTool('delete_shapes', { projectId: PROJECT, ids: [imgId] })
await sleep(600)

section('export_shapes renders the selection back')
step = 'export'
const exp = await callTool('export_shapes', { projectId: PROJECT, ids: [frameId], kinds: ['svg', 'png', 'code'] })
ok(exp.count === 3 && exp.name === 'MCP Card', `three files came back for "${exp.name}" (${exp.count})`)
const byKind = Object.fromEntries((exp.files ?? []).map((f) => [f.kind, f]))
ok(String(byKind.svg?.text ?? '').startsWith('<svg') && byKind.svg.text.length > 200, `the SVG is real markup (${byKind.svg?.text?.length} chars)`)
ok(String(byKind.png?.data ?? '').startsWith('data:image/png;base64,') && byKind.png.data.length > 500, `the PNG is an inline data URL (${byKind.png?.data?.length} chars)`)
ok(String(byKind.code?.text ?? '').includes('Generated by Petals'), 'the code is a React component')
ok(byKind.png?.name === 'MCP Card.png', `files are named after the shape (${byKind.png?.name})`)
const expSelected = await doc()
ok(expSelected.nodes[frameId] && Object.keys(expSelected.nodes).length === 3, 'exporting did not disturb the document')

section('delete_shapes removes the subtree')
step = 'delete'
const del = await callTool('delete_shapes', { projectId: PROJECT, ids: [frameId] })
ok(del.deleted === 1, `delete reported 1 root (${del.deleted})`)
await sleep(600)
const left = await doc()
ok(!left.nodes[frameId] && !left.nodes[swatchId], 'frame and its children are gone')

section('read-only resource')
step = 'resource'
const res = await client.readResource({ uri: `petal://board/${PROJECT}` })
const resourceDoc = JSON.parse(res.contents[0].text)
ok(typeof resourceDoc.projectId === 'string', 'petal://board/<id> returns the document')

section('the in-app connect-an-agent page')
step = 'mcp-page'
await page.evaluate((p) => localStorage.setItem('petal.mcp.port', String(p)), BRIDGE_PORT)
// reach it the way a user does: Menu → MCP
await page.goto(`${BASE}/projects`, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('text=Menu', { timeout: 15000 })
await page.getByRole('button', { name: 'Menu', exact: true }).click()
await page.getByRole('button', { name: 'MCP', exact: true }).click()
await page.waitForSelector('text=Connect an agent', { timeout: 15000 })
ok(page.url().endsWith('/mcp'), `the Menu links to it (${new URL(page.url()).pathname})`)
await page.waitForSelector('text=Bridge is running', { timeout: 15000 })
ok(true, 'the page sees the running bridge')
const listed = await page.getByText(`/board/${PROJECT}`).count()
ok(listed > 0, `the connected board is listed (${PROJECT})`)
const snippets = await page.locator('pre').count()
ok(snippets >= 4, `host snippets render (${snippets})`)
await shot('mcp-page')

console.log(`\nconsole/page errors: ${errors.length}`)
for (const e of errors.slice(0, 8)) console.log('  ', e.slice(0, 200))
failures += errors.length

await client.close().catch(() => {})
await browser.close()
server.kill()
console.log(failures === 0 ? '\nMCP CHECKS PASSED' : `\n${failures} FAILURES`)
process.exit(failures === 0 ? 0 : 1)
