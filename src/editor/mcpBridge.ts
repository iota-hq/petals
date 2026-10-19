/**
 * Browser side of the Petals MCP bridge (see `mcp-server/bridge.ts`).
 *
 * Opt-in and inert by default: it does nothing unless the URL carries an `mcp`
 * flag, so normal use and the verify suites are unaffected. Open a board as
 *
 *   /board/<projectId>?mcp        (bridge on 8765)
 *   /board/<projectId>?mcp=9000   (custom bridge port)
 *
 * and the tab announces its document, streams later changes, and applies the
 * mutations an MCP client sends back — through the normal commands, so they land
 * in the undo history like any hand edit.
 */

import { createShape } from '@/model/defaults'
import { selectionRoots } from '@/model/geometry'
import type { Shape, ShapeType } from '@/model/types'
import { useDoc } from '@/store/docStore'
import { useProjects } from '@/store/projectsStore'
import { useUi } from '@/store/uiStore'
import { setPropsBatch } from './commands'
import { buildSelectionCode, buildSelectionSVG, rasterBlob } from './exporters'

const SHAPE_TYPES = new Set<string>(['frame', 'rect', 'ellipse', 'line', 'text', 'image'])

/** What `export_shapes` can render out of the live selection. */
type ExportKind = 'svg' | 'png' | 'png2x' | 'code'

type BridgeOp =
  | { op: 'create'; shapes: (Partial<Shape> & { type: string })[] }
  | { op: 'update'; patches: { id: string; fields: Partial<Shape> }[] }
  | { op: 'delete'; ids: string[] }
  | { op: 'select'; ids: string[] }
  | { op: 'export'; kinds?: ExportKind[]; ids?: string[] }

/** `?mcp` → 8765, `?mcp=9000` → 9000, absent → null (bridge off). */
function bridgePort(): number | null {
  const url = new URL(window.location.href)
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
  const raw = url.searchParams.get('mcp') ?? hash.get('mcp')
  if (raw === null) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 8765
}

function snapshot(projectId: string) {
  const { nodes, pages, activePage } = useDoc.getState()
  const name = useProjects.getState().projects.find((p) => p.id === projectId)?.name
  return { projectId, name, nodes, pages, activePage }
}

/** Read a rendered blob back as a data URL, so it can ride the JSON result. */
function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('could not read the render'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Render what is selected back to the caller: the same SVG, PNG and React + Tailwind
 * source the Export menu and *Copy as* produce, but with no human at the keyboard.
 * Passing `ids` selects them first — the exporters work off the live selection.
 */
async function collectExports(op: { kinds?: ExportKind[]; ids?: string[] }) {
  const nodes = useDoc.getState().nodes
  if (op.ids?.length) {
    const ids = op.ids.filter((id) => nodes[id])
    if (!ids.length) throw new Error('none of those ids are in the document')
    useUi.setState({ selection: ids })
  }
  const roots = selectionRoots(nodes, useUi.getState().selection)
  if (!roots.length) throw new Error('nothing is selected — pass ids, or select the shapes first')
  const kinds: ExportKind[] = op.kinds?.length ? op.kinds : ['svg', 'png', 'code']
  const name = (nodes[roots[0]]?.name ?? 'petals-export').trim() || 'petals-export'
  const files: { kind: ExportKind; name: string; mime: string; text?: string; data?: string }[] = []
  for (const kind of kinds) {
    if (kind === 'svg' || kind === 'code') {
      const text = kind === 'svg' ? await buildSelectionSVG() : buildSelectionCode()
      if (!text) throw new Error(`could not render ${kind} for the selection`)
      files.push({ kind, name: kind === 'svg' ? `${name}.svg` : `${name}.tsx`, mime: kind === 'svg' ? 'image/svg+xml' : 'text/plain', text })
    } else {
      const blob = await rasterBlob('png', kind === 'png2x' ? 2 : 1)
      if (!blob) throw new Error('could not rasterise the selection')
      files.push({ kind, name: `${name}${kind === 'png2x' ? '@2x' : ''}.png`, mime: 'image/png', data: await dataUrl(blob) })
    }
  }
  return { name, files }
}

/** Run one batch of bridge ops against the live document. */
async function applyOps(ops: BridgeOp[]) {
  const doc = useDoc.getState()
  const out: Record<string, unknown> = {}
  for (const op of ops) {
    if (op.op === 'create') {
      const made = op.shapes
        .filter((s) => SHAPE_TYPES.has(s.type))
        .map((s) => createShape({ ...s, type: s.type as ShapeType }))
      if (made.length) doc.insertShapes(made, 'MCP: create')
      out.created = made.map((m) => m.id)
    } else if (op.op === 'update') {
      // one batch, one undo step — a single MCP call should be a single Ctrl+Z
      out.updated = setPropsBatch(op.patches, 'MCP: update')
    } else if (op.op === 'delete') {
      const ids = op.ids.filter((id) => useDoc.getState().nodes[id])
      if (ids.length) useDoc.getState().deleteShapes(ids, 'MCP: delete')
      out.deleted = ids.length
    } else if (op.op === 'select') {
      useUi.setState({ selection: op.ids.filter((id) => useDoc.getState().nodes[id]) })
      out.selected = useUi.getState().selection.length
    } else if (op.op === 'export') {
      out.exported = await collectExports(op)
    }
  }
  return out
}

/** Returns a cleanup function; a no-op when the bridge flag is absent. */
export function startMcpBridge(projectId: string): () => void {
  const port = bridgePort()
  if (port === null || typeof EventSource === 'undefined') return () => {}

  const base = `http://127.0.0.1:${port}`
  const post = (path: string, body: unknown) => {
    void fetch(base + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {
      /* bridge not running — the tab simply keeps working */
    })
  }

  const announce = () => post('/bridge/hello', snapshot(projectId))

  let stopped = false
  let saveTimer: number | undefined
  const unsubscribe = useDoc.subscribe(() => {
    if (saveTimer) window.clearTimeout(saveTimer)
    saveTimer = window.setTimeout(() => {
      if (!stopped) post('/bridge/doc', snapshot(projectId))
    }, 150)
  })

  const events = new EventSource(`${base}/bridge/events?projectId=${encodeURIComponent(projectId)}`)
  events.onmessage = async (event) => {
    let message: { type?: string; rid?: string; ops?: BridgeOp[] }
    try {
      message = JSON.parse(event.data)
    } catch {
      return
    }
    // re-announce on every (re)connect so a restarted bridge gets a fresh snapshot
    if (message.type === 'ready') return announce()
    if (message.type !== 'apply' || !message.rid) return
    try {
      post('/bridge/result', { rid: message.rid, ok: true, result: await applyOps(message.ops ?? []) })
    } catch (err) {
      post('/bridge/result', { rid: message.rid, ok: false, error: err instanceof Error ? err.message : String(err) })
    }
  }
  // EventSource reconnects on its own; a failed dial is expected when no bridge runs.

  console.info(`[petals] MCP bridge → ${base} (board ${projectId})`)
  return () => {
    stopped = true
    if (saveTimer) window.clearTimeout(saveTimer)
    unsubscribe()
    events.close()
  }
}
