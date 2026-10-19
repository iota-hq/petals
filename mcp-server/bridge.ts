/**
 * Petals browser bridge.
 *
 * The editor is a client-only SPA: documents live in `localStorage`, so no
 * server can reach them on its own. This bridge is the missing half — a tiny
 * localhost endpoint the open editor tab dials into. The tab pushes a snapshot
 * of its document, subscribes to an event stream, and applies the mutations an
 * MCP client sends back through the normal `docStore` commands (so they show up
 * live, and Ctrl+Z undoes them).
 *
 * Wire format — POSTs up, one SSE stream down:
 *
 *   POST /bridge/hello   { projectId, name, nodes, pages, activePage }  → { ok }
 *   POST /bridge/doc     { projectId, nodes, pages, activePage }        → { ok }
 *   POST /bridge/result  { rid, ok, result?, error? }                   → { ok }
 *   GET  /bridge/events?projectId=<id>                                  → text/event-stream
 *
 * The server writes `{ type: 'apply', rid, ops }` down every stream for a board
 * and waits for the first matching `/bridge/result`. No `ws` dependency: SSE
 * plus POST is enough for a single localhost peer.
 *
 * Streams are many-per-board on purpose. `EventSource` reconnects by itself when
 * a stream ends, so evicting an older tab would start an endless takeover war
 * between two tabs (or React's development double-mount) on the same document.
 *
 * Reachability: the socket binds `127.0.0.1`, and requests that carry a browser
 * `Origin` must name a local origin. Without that check any website you happened
 * to have open could read your document, because CORS is enforced on the read
 * side but the request itself still arrives.
 *
 * Written against the Web `Request`/`Response` API so `petal-mcp.ts` can mount
 * it on a Bun HTTP server next to the MCP `/mcp` endpoint.
 */

import { randomUUID } from 'node:crypto'

const encoder = new TextEncoder()

/** A document snapshot as the editor sees it (serialized `docStore` state). */
export interface BoardSnapshot {
  projectId: string
  name?: string
  nodes: Record<string, Record<string, unknown>>
  pages: { id: string; name: string }[]
  activePage: string
}

/** Mutations the editor knows how to apply, plus the one read-back (render → bytes). */
export type BridgeOp =
  | { op: 'create'; shapes: (Record<string, unknown> & { type: string })[] }
  | { op: 'update'; patches: { id: string; fields: Record<string, unknown> }[] }
  | { op: 'delete'; ids: string[] }
  | { op: 'select'; ids: string[] }
  | { op: 'export'; kinds?: ('svg' | 'png' | 'png2x' | 'code')[]; ids?: string[] }

export interface BoardSummary {
  projectId: string
  name: string
  pages: number
  shapes: number
  activePage: string
  /** true while at least one editor tab is on the event stream and can be mutated. */
  live: boolean
  /** how many editor tabs are attached. */
  tabs: number
  lastSeen: number
}

interface Pending {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}

interface Subscription {
  ctrl: ReadableStreamDefaultController<Uint8Array>
  ping: ReturnType<typeof setInterval>
}

interface Board extends BoardSnapshot {
  lastSeen: number
  subs: Map<string, Subscription>
  pending: Map<string, Pending>
}

/** `http://localhost:5173`, `http://127.0.0.1:9000`, … */
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/

/**
 * May this caller reach the bridge? A request with no `Origin` header is not a
 * browser — that is the MCP client or curl, so let it through. A browser must be
 * running the app from a local origin.
 */
export function defaultAllowOrigin(origin: string | null): boolean {
  return origin === null || LOCAL_ORIGIN.test(origin)
}

export interface BridgeOptions {
  /** How long a tool waits for the editor to acknowledge a mutation. */
  timeoutMs?: number
  /** Reject a request when this returns false. Defaults to local origins only. */
  allowOrigin?: (origin: string | null) => boolean
}

/** CORS headers to mirror back for an accepted browser origin. */
export function corsFor(origin: string | null): Record<string, string> {
  if (!origin) return {}
  return { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
}

/** `Origin` is not a CORS-safelisted header, so browsers preflight writes. */
function preflightHeaders(origin: string | null): Record<string, string> {
  return {
    ...corsFor(origin),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
  }
}

export class Bridge {
  private readonly timeoutMs: number
  private readonly allowOrigin: (origin: string | null) => boolean
  private readonly boards = new Map<string, Board>()

  constructor(opts: BridgeOptions = {}) {
    this.timeoutMs = opts.timeoutMs ?? 10000
    this.allowOrigin = opts.allowOrigin ?? defaultAllowOrigin
  }

  /* ---------------- read side ---------------- */

  list(): BoardSummary[] {
    return [...this.boards.values()]
      .sort((a, b) => b.lastSeen - a.lastSeen)
      .map((b) => ({
        projectId: b.projectId,
        name: b.name ?? b.projectId,
        pages: b.pages?.length ?? 0,
        shapes: Object.keys(b.nodes ?? {}).length,
        activePage: b.activePage,
        live: b.subs.size > 0,
        tabs: b.subs.size,
        lastSeen: b.lastSeen,
      }))
  }

  snapshot(projectId: string): BoardSnapshot | null {
    const b = this.boards.get(projectId)
    if (!b) return null
    return { projectId: b.projectId, name: b.name, nodes: b.nodes, pages: b.pages, activePage: b.activePage }
  }

  /**
   * Pick the board a tool should act on: the named one, else the single live
   * board (so an agent can omit `projectId` with one tab open).
   */
  resolve(projectId?: string): Board {
    if (projectId) {
      const b = this.boards.get(projectId)
      if (!b) throw new Error(`no board "${projectId}" is connected (call list_boards)`)
      if (!b.subs.size) throw new Error(`board "${projectId}" is known but has no live editor tab`)
      return b
    }
    const live = [...this.boards.values()].filter((b) => b.subs.size > 0)
    if (!live.length) throw new Error('no editor tab is connected — open a board with the ?mcp query flag')
    if (live.length > 1) throw new Error(`several boards are live (${live.map((b) => b.projectId).join(', ')}); pass projectId`)
    return live[0]
  }

  /* ---------------- write side ---------------- */

  /**
   * Send a mutation batch to every attached tab and resolve when one of them
   * acknowledges it. Extra acknowledgements are ignored, so a second tab on the
   * same document is harmless.
   */
  applyTokens(projectId: string | undefined, ops: BridgeOp[]): Promise<unknown> {
    const board = this.resolve(projectId)
    const rid = randomUUID()
    return new Promise<unknown>((resolve, reject) => {
      const timer = setTimeout(() => {
        board.pending.delete(rid)
        reject(new Error('the editor did not acknowledge the change in time'))
      }, this.timeoutMs)
      board.pending.set(rid, { resolve, reject, timer })
      const payload = encoder.encode(`data: ${JSON.stringify({ type: 'apply', rid, ops })}\n\n`)
      for (const [id, sub] of board.subs) {
        try {
          sub.ctrl.enqueue(payload)
        } catch {
          this.dropSub(board, id)
        }
      }
      if (!board.subs.size) {
        clearTimeout(timer)
        board.pending.delete(rid)
        reject(new Error('the editor tab went away before the change was applied'))
      }
    })
  }

  close() {
    for (const board of this.boards.values()) {
      for (const id of [...board.subs.keys()]) this.dropSub(board, id)
      for (const p of board.pending.values()) {
        clearTimeout(p.timer)
        p.reject(new Error('bridge closed'))
      }
      board.pending.clear()
    }
    this.boards.clear()
  }

  /* ---------------- request routing ---------------- */

  /** Handle a `/bridge/*` request. Returns 404 for anything else (the caller owns `/mcp`). */
  async handle(req: Request): Promise<Response> {
    const url = new URL(req.url)
    const origin = req.headers.get('origin')
    if (!this.allowOrigin(origin)) {
      return new Response(JSON.stringify({ error: `origin ${origin} is not allowed` }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: preflightHeaders(origin) })
    try {
      const paths = url.pathname
      if (paths === '/bridge/hello' && req.method === 'POST') return await this.onSnapshot(req, origin, true)
      if (paths === '/bridge/doc' && req.method === 'POST') return await this.onSnapshot(req, origin, false)
      if (paths === '/bridge/result' && req.method === 'POST') return await this.onResult(req, origin)
      if (paths === '/bridge/events' && req.method === 'GET') return this.onEvents(url, origin)
      if (paths === '/bridge/boards' && req.method === 'GET') return json(origin, { boards: this.list() })
      return json(origin, { error: 'not found' }, 404)
    } catch (err) {
      return json(origin, { error: err instanceof Error ? err.message : String(err) }, 500)
    }
  }

  private async onSnapshot(req: Request, origin: string | null, hello: boolean): Promise<Response> {
    const body = (await req.json().catch(() => null)) as Partial<BoardSnapshot> | null
    if (!body || typeof body.projectId !== 'string') return json(origin, { error: 'projectId is required' }, 400)
    const existing = this.boards.get(body.projectId)
    const next: Board = {
      projectId: body.projectId,
      name: body.name ?? existing?.name,
      nodes: body.nodes ?? existing?.nodes ?? {},
      pages: body.pages ?? existing?.pages ?? [],
      activePage: body.activePage ?? existing?.activePage ?? '',
      lastSeen: Date.now(),
      subs: existing?.subs ?? new Map(),
      pending: existing?.pending ?? new Map(),
    }
    this.boards.set(body.projectId, next)
    return json(origin, { ok: true, projectId: body.projectId, hello })
  }

  private async onResult(req: Request, origin: string | null): Promise<Response> {
    const body = (await req.json().catch(() => null)) as
      | { rid?: string; ok?: boolean; result?: unknown; error?: string }
      | null
    const board = body?.rid ? [...this.boards.values()].find((b) => b.pending.has(body.rid!)) : undefined
    if (!board) return json(origin, { ok: true, ignored: true })
    const p = board.pending.get(body.rid!)!
    clearTimeout(p.timer)
    board.pending.delete(body.rid!)
    board.lastSeen = Date.now()
    if (body!.ok) p.resolve(body!.result)
    else p.reject(new Error(body!.error ?? 'editor rejected the change'))
    return json(origin, { ok: true })
  }

  private onEvents(url: URL, origin: string | null): Response {
    const projectId = url.searchParams.get('projectId')
    if (!projectId) return json(origin, { error: 'projectId is required' }, 400)

    let board = this.boards.get(projectId)
    if (!board) {
      board = { projectId, nodes: {}, pages: [], activePage: '', lastSeen: Date.now(), subs: new Map(), pending: new Map() }
      this.boards.set(projectId, board)
    }
    board.lastSeen = Date.now()

    const host = board
    const drop = (id: string) => this.dropSub(host, id)
    const id = randomUUID()
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(encoder.encode(': connected\n\n'))
        c.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'ready', projectId })}\n\n`))
        const ping = setInterval(() => {
          try {
            c.enqueue(encoder.encode(': ping\n\n'))
          } catch {
            drop(id)
          }
        }, 15000)
        host.subs.set(id, { ctrl: c, ping })
      },
      cancel() {
        drop(id)
      },
    })

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsFor(origin),
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  }

  /** Detach one subscriber (and stop its keep-alive ping). */
  private dropSub(board: Board, id: string): void {
    const sub = board.subs.get(id)
    if (!sub) return
    board.subs.delete(id)
    clearInterval(sub.ping)
    try {
      sub.ctrl.close()
    } catch {
      /* the tab already went away */
    }
  }
}

function json(origin: string | null, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsFor(origin), 'Content-Type': 'application/json' },
  })
}
