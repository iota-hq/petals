#!/usr/bin/env bun
/**
 * Petals MCP server.
 *
 * Exposes a running Petals editor to any MCP host (Claude Desktop, Claude Code,
 * OpenCode, …). Tools read the document and create / update / delete shapes; the
 * changes land in the editor tab live and enter its undo history like any other
 * edit.
 *
 * One process, one port, two ways in:
 *
 *   stdio        command: bun run mcp-server/petal-mcp.ts     (Claude Desktop/Code, OpenCode)
 *   HTTP /mcp    url:     http://127.0.0.1:8765/mcp           (same port as the bridge)
 *
 * Both are always on, so a host can use whichever it prefers. The browser
 * bridge (see ./bridge.ts) is mounted on the same port; open the board with the
 * bridge flag so a tab connects and becomes the document the tools act on:
 *
 *   http://localhost:5173/board/<projectId>?mcp=8765
 *
 * NOTE: on stdio, stdout is the JSON-RPC channel — every log goes to stderr.
 */

// This file runs on Bun (`bun run mcp-server/petal-mcp.ts`); Bun's HTTP server
// speaks the Web Request/Response API that the SDK's Web-standard MCP transport
// needs — the Node wrapper mis-handles repeated requests under Bun.
declare const Bun: {
  serve(opts: { port: number; hostname?: string; idleTimeout?: number; fetch: (req: Request) => Response | Promise<Response> }): {
    port: number
    stop(force?: boolean): void
  }
}

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import { Bridge, corsFor, defaultAllowOrigin, type BridgeOp } from './bridge.js'

/* ---------------- args ---------------- */

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  if (i >= 0) return process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : 'true'
  return undefined
}

const bridgePort = Number(flag('port') ?? process.env.PETALS_BRIDGE_PORT ?? 8765)
const log = (...args: unknown[]) => console.error('[petals-mcp]', ...args)

/**
 * `--origin a,b` / `PETALS_MCP_ORIGINS` replaces the default allow-list (any
 * local origin) so you can pin the bridge to one exact dev server.
 */
const originList = (flag('origin') ?? process.env.PETALS_MCP_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const allowOrigin = originList.length
  ? (origin: string | null) => origin === null || originList.includes(origin)
  : defaultAllowOrigin

/** Extra headers so a browser-based MCP client can also reach `/mcp`. */
function mcpCors(origin: string | null): Record<string, string> {
  return {
    ...corsFor(origin),
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, mcp-session-id, mcp-protocol-version',
    'Access-Control-Expose-Headers': 'mcp-session-id',
  }
}

/* ---------------- shapes ---------------- */

const SHAPE_TYPES = ['frame', 'rect', 'ellipse', 'line', 'text', 'image'] as const

/** Mirrors `Shape` in src/model/types.ts; unknown fields are dropped. */
const shapeSpec = z.object({
  type: z.enum(SHAPE_TYPES).describe('Shape kind'),
  id: z.string().optional().describe('Reuse an id to make the call idempotent'),
  name: z.string().optional(),
  parentId: z.string().nullable().optional().describe('Frame id to nest inside, or null for the page root'),
  pageId: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  w: z.number().optional(),
  h: z.number().optional(),
  order: z.number().optional().describe('Fractional z-order among siblings; higher is in front'),
  opacity: z.number().optional(),
  visible: z.boolean().optional(),
  locked: z.boolean().optional(),
  // painting
  fill: z
    .union([z.string(), z.record(z.string(), z.unknown())])
    .optional()
    .describe('CSS color, or a gradient/image object (image objects fill rects/frames — image shapes paint from `src`)'),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  radius: z.number().optional().describe('Uniform corner radius in px'),
  radii: z.record(z.string(), z.number()).optional().describe('Per-corner radii { tl, tr, br, bl }'),
  rotation: z.number().optional().describe('Degrees, clockwise'),
  flipX: z.boolean().optional(),
  flipY: z.boolean().optional(),
  clip: z.boolean().optional().describe('frame: clip children to the box'),
  filters: z.record(z.string(), z.number()).optional(),
  shadows: z.array(z.record(z.string(), z.unknown())).optional(),
  margin: z.record(z.string(), z.number()).optional().describe('frame padding { t, r, b, l }'),
  // frame auto-layout
  layoutFlow: z.enum(['v', 'h']).optional().describe('Stack children vertically/horizontally'),
  gap: z.number().optional(),
  layoutMain: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  layoutCross: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  sizingMain: z.enum(['fixed', 'hug']).optional(),
  mainFill: z.boolean().optional().describe('Child: stretch along the parent flow axis'),
  crossFill: z.boolean().optional().describe('Child: stretch across the parent flow axis'),
  // line
  x1: z.number().optional(),
  y1: z.number().optional(),
  x2: z.number().optional(),
  y2: z.number().optional(),
  // text
  text: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.number().optional(),
  fontFamily: z.string().optional(),
  align: z.enum(['left', 'center', 'right', 'justify']).optional(),
  color: z.string().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  autoWidth: z
    .boolean()
    .optional()
    .describe('text: hug the text instead of holding a fixed width (set false to give it a width)'),
  // image
  src: z.string().optional().describe('image shape: the artwork URL or data URL it paints'),
  fit: z.enum(['cover', 'contain']).optional(),
  // the asset library
  pattern: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Generative pattern params (motif, scale, ink…); pair with a regenerated image `fill`'),
  logo: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Inserted SVG mark: { source: "<svg…>", mono?, colors? }, kept so it stays recolourable'),
})

type ShapeSpec = z.infer<typeof shapeSpec>

/* ---------------- tool result helpers ---------------- */

const text = (s: string) => ({ content: [{ type: 'text' as const, text: s }] })
const json = (v: unknown) => text(JSON.stringify(v, null, 2))

/**
 * Set false when another `petals-mcp` already owns the bridge port. With stdio
 * the session keeps working for everything except the browser, so this is a
 * warning rather than a crash — but the tools have to say so plainly instead of
 * blaming a missing tab.
 */
let bridgeBound = true

/** The board a tool should act on, or a honest reason there is none. */
function resolveBoard(projectId?: string) {
  if (!bridgeBound) {
    throw new Error(
      `this petals-mcp could not bind 127.0.0.1:${bridgePort} (another agent host owns it), so no browser tab ` +
        `reaches this session. Run that host alone, or give this one its own bridge with --port <n>.`,
    )
  }
  return bridge.resolve(projectId)
}

/* ---------------- server factory ---------------- */

function buildServer(bridge: Bridge): McpServer {
  const server = new McpServer(
    { name: 'petals', version: '0.1.0' },
    {
      instructions:
        'Petals is a browser design canvas. Documents live in the user\'s open editor tab, which must be ' +
        'connected through the bridge (the user opens the board with the ?mcp flag). Call list_boards first ' +
        'to see what is open, then get_doc to read it. create/update/delete_shapes apply instantly in the ' +
        'user\'s tab and are undoable there. Omit projectId when exactly one board is live.',
    },
  )

  server.registerTool(
    'list_boards',
    {
      title: 'List boards',
      description: 'Boards (documents) the connected editor tabs have announced, with shape counts.',
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => json({ boards: bridge.list() }),
  )

  server.registerTool(
    'get_doc',
    {
      title: 'Read a board',
      description: 'Read a board\'s pages and every shape, as the editor currently has it.',
      inputSchema: { projectId: z.string().optional() },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ projectId }) => {
      const board = resolveBoard(projectId)
      return json(bridge.snapshot(board.projectId))
    },
  )

  server.registerTool(
    'create_shapes',
    {
      title: 'Create shapes',
      description:
        'Add shapes to a board: frames, rectangles, ellipses, lines, text and images. They appear in the ' +
        'editor immediately. Returns the new ids (children need to be created after their frame).',
      inputSchema: {
        projectId: z.string().optional(),
        shapes: z.array(shapeSpec).min(1).describe('Shapes to add, in z-order'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ projectId, shapes }) => {
      const board = resolveBoard(projectId)
      const result = (await bridge.applyTokens(board.projectId, [
        { op: 'create', shapes: shapes as ShapeSpec[] },
      ])) as { created?: string[] } | undefined
      const created = result?.created ?? []
      return json({ projectId: board.projectId, created, count: created.length })
    },
  )

  server.registerTool(
    'update_shapes',
    {
      title: 'Update shapes',
      description:
        'Patch existing shapes by id — position, size, fill, text, opacity, layout flags, visibility, lock… ' +
        'Only the fields you pass change. Pattern and logo fills carry their params, so a shaped pattern fill ' +
        'can be re-tuned in place.',
      inputSchema: {
        projectId: z.string().optional(),
        patches: z
          .array(z.object({ id: z.string(), fields: z.record(z.string(), z.unknown()) }))
          .min(1),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ projectId, patches }) => {
      const board = resolveBoard(projectId)
      const op: BridgeOp = { op: 'update', patches: patches as { id: string; fields: Record<string, unknown> }[] }
      const result = (await bridge.applyTokens(board.projectId, [op])) as { updated: number } | undefined
      return json({ projectId: board.projectId, updated: result?.updated ?? 0 })
    },
  )

  server.registerTool(
    'delete_shapes',
    {
      title: 'Delete shapes',
      description: 'Delete shapes by id, together with everything nested inside them.',
      inputSchema: { projectId: z.string().optional(), ids: z.array(z.string()).min(1) },
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
    },
    async ({ projectId, ids }) => {
      const board = resolveBoard(projectId)
      const result = (await bridge.applyTokens(board.projectId, [
        { op: 'delete', ids },
      ])) as { deleted: number } | undefined
      return json({ projectId: board.projectId, deleted: result?.deleted ?? 0 })
    },
  )

  server.registerTool(
    'select_shapes',
    {
      title: 'Select shapes',
      description: 'Set the editor selection (highlights the shapes in the user\'s canvas).',
      inputSchema: { projectId: z.string().optional(), ids: z.array(z.string()) },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ projectId, ids }) => {
      const board = resolveBoard(projectId)
      await bridge.applyTokens(board.projectId, [{ op: 'select', ids }])
      return text(`selected ${ids.length} shape(s)`)
    },
  )

  server.registerTool(
    'export_shapes',
    {
      title: 'Export shapes',
      description:
        'Render the selection (or the ids you pass) the way the Export menu would, and return the files ' +
        'inline: SVG source, PNG at 1× and/or 2× as data URLs, and the React + Tailwind source. Use it to ' +
        'save or hand on what the board shows without a human driving the UI.',
      inputSchema: {
        projectId: z.string().optional(),
        ids: z.array(z.string()).optional().describe('shapes to export; omit to use whatever is selected'),
        kinds: z
          .array(z.enum(['svg', 'png', 'png2x', 'code']))
          .optional()
          .describe('what to render; defaults to svg + png + code'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ projectId, ids, kinds }) => {
      const board = resolveBoard(projectId)
      const result = (await bridge.applyTokens(board.projectId, [{ op: 'export', ids, kinds }])) as
        | { exported?: { name: string; files: unknown[] } }
        | undefined
      const files = result?.exported?.files ?? []
      return json({ projectId: board.projectId, name: result?.exported?.name, count: files.length, files })
    },
  )

  server.registerResource(
    'board',
    new ResourceTemplate('petal://board/{projectId}', { list: undefined }),
    { title: 'Petals board', description: 'The live document of a connected board', mimeType: 'application/json' },
    async (uri, { projectId }) => ({
      contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(bridge.snapshot(String(projectId))) }],
    }),
  )

  return server
}

/* ---------------- boot ---------------- */

const bridge = new Bridge({ allowOrigin })

/**
 * Stateless Streamable HTTP. The SDK requires a *fresh* transport per request
 * for stateless mode, so each call builds its own server + transport; the small
 * JSON body is buffered so both can be torn down immediately.
 */
async function handleMcp(req: Request): Promise<Response> {
  const origin = req.headers.get('origin')
  if (!allowOrigin(origin)) {
    return new Response(JSON.stringify({ error: `origin ${origin} is not allowed` }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: mcpCors(origin) })
  const server = buildServer(bridge)
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  transport.onerror = (err) => log('transport error:', err.message)
  await server.connect(transport)
  try {
    const res = await transport.handleRequest(req)
    const body = res.body ? await res.arrayBuffer() : null
    const headers = new Headers(res.headers)
    for (const [k, v] of Object.entries(mcpCors(origin))) headers.set(k, v)
    return new Response(body, { status: res.status, statusText: res.statusText, headers })
  } catch (err) {
    log('mcp error:', err instanceof Error ? (err.stack ?? err.message) : String(err))
    return new Response(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: String(err) }, id: null }), {
      status: 500,
      headers: { ...mcpCors(origin), 'Content-Type': 'application/json' },
    })
  } finally {
    void transport.close()
    void server.close()
  }
}

// stdio is attached whenever a host is driving us (stdin is a pipe, not a TTY),
// so `{ command: "bun", args: ["run", "mcp-server/petal-mcp.ts"] }` just works.
const useStdio = flag('no-stdio') !== undefined ? false : flag('stdio') !== undefined ? true : !process.stdin.isTTY

let server: ReturnType<typeof Bun.serve> | undefined
try {
  server = Bun.serve({
    port: bridgePort,
    hostname: '127.0.0.1',
    // SSE streams sit idle between mutations; Bun's default idle timeout would cut them.
    idleTimeout: 255,
    async fetch(req) {
      const url = new URL(req.url)
      if (url.pathname === '/mcp') return handleMcp(req)
      return bridge.handle(req)
    },
  })
} catch (err) {
  bridgeBound = false
  log(`cannot listen on 127.0.0.1:${bridgePort} — ${err instanceof Error ? err.message : String(err)}`)
  if (!useStdio) {
    log('this process has nothing to serve without the bridge; pass --port <n> for a different port')
    process.exit(1)
  }
  // Two hosts on one project (say Claude Code and OpenCode) both spawn this
  // server. The first one keeps the bridge; this session stays useful over stdio
  // and says why the tools cannot reach a tab.
  log('another petals-mcp already owns the bridge — this session runs stdio-only.')
  log('browsers connect through that host; pass --port <n> to give this one its own bridge.')
}

if (server) {
  log(`listening on http://127.0.0.1:${server.port}`)
  log(`  bridge → open a board as /board/<id>?mcp=${server.port}`)
  log(`  mcp    → http://127.0.0.1:${server.port}/mcp`)
}

if (useStdio) {
  const stdio = buildServer(bridge)
  await stdio.connect(new StdioServerTransport())
  log('stdio transport ready')
}

const shutdown = () => {
  bridge.close()
  server?.stop(true)
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
