import { useEffect, useMemo, useState } from 'react'
import { InfoShell, InfoTitle, InfoSection, CardRow } from '@/components/InfoShell'
import { useProjects } from '@/store/projectsStore'
import { go } from '@/App'

const PORT_KEY = 'petal.mcp.port'
const DEFAULT_PORT = 8765

type Board = {
  projectId: string
  name: string
  pages: number
  shapes: number
  live: boolean
  tabs: number
  lastSeen: number
}

type Status = { kind: 'checking' } | { kind: 'down' } | { kind: 'up'; boards: Board[] }

const TOOLS: Array<[string, string, string]> = [
  ['list_boards', 'Boards the connected tabs announced, with shape counts and whether a tab is live.', 'read'],
  ['get_doc', 'The board’s pages and every shape, as the editor currently has it.', 'read'],
  ['create_shapes', 'Add frames, rects, ellipses, lines, text and images. Returns the new ids.', 'write'],
  ['update_shapes', 'Patch shapes by id — position, size, fill, text, layout, pattern, logo, visible, locked…', 'write'],
  ['delete_shapes', 'Delete shapes and everything nested inside them.', 'write'],
  ['select_shapes', 'Move the editor’s selection, so you can see what the agent is pointing at.', 'write'],
  ['export_shapes', 'Render the selection back as SVG, PNG at 1×/2× and the React + Tailwind source.', 'read'],
]

/** One copyable command / config block. */
function Code({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      /* clipboard denied — the text is selectable anyway */
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="rounded-xl border border-border bg-[#141418]">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">{label}</span>
        <button onClick={copy} className="ml-auto cursor-pointer text-[11px] text-foreground/60 hover:text-foreground">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[11px] leading-relaxed text-foreground/85">{code}</pre>
    </div>
  )
}

function Dot({ tone }: { tone: 'ok' | 'off' | 'wait' }) {
  const color = tone === 'ok' ? 'bg-emerald-400' : tone === 'off' ? 'bg-white/25' : 'bg-amber-400'
  return <span className={`inline-block size-2 shrink-0 rounded-full ${color}`} />
}

/**
 * Connect-an-agent page: what the local MCP connector is, whether it is running
 * right now, and the exact snippet for each host. See `mcp-server/` for the
 * server and `README.md` for the long form.
 */
export default function Mcp() {
  const [port, setPort] = useState(() => Number(localStorage.getItem(PORT_KEY)) || DEFAULT_PORT)
  const [status, setStatus] = useState<Status>({ kind: 'checking' })

  useEffect(() => {
    localStorage.setItem(PORT_KEY, String(port))
  }, [port])

  // Poll the local server so the page shows the truth, not a claim.
  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/bridge/boards`)
        const data = (await res.json()) as { boards?: Board[] }
        if (alive) setStatus({ kind: 'up', boards: data.boards ?? [] })
      } catch {
        if (alive) setStatus({ kind: 'down' })
      }
    }
    void tick()
    const id = window.setInterval(tick, 2000)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [port])

  const base = `http://127.0.0.1:${port}`
  const boards = status.kind === 'up' ? status.boards : []
  const projects = useProjects((s) => s.projects)

  // Every project, annotated with whatever the bridge knows — so a board that has
  // never been bridged can still be opened with the flag from right here.
  const rows = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; board?: Board }>()
    for (const p of projects) byId.set(p.id, { id: p.id, name: p.name })
    for (const b of boards) {
      const hit = byId.get(b.projectId)
      if (hit) hit.board = b
      else byId.set(b.projectId, { id: b.projectId, name: b.name, board: b })
    }
    return [...byId.values()]
  }, [projects, boards])

  return (
    <InfoShell>
      <InfoTitle
        title="Connect an agent"
        intro="Petals speaks Model Context Protocol, so Claude Code, OpenCode or any MCP host can read and edit the design in your open board tab. It runs as a small process on your own machine — nothing is uploaded anywhere."
      />

      <InfoSection title="1 · Start the connector">
        <p className="mb-4 text-[13px] leading-relaxed text-foreground/80">
          A project that carries Petals' own MCP config starts the connector for you, so there is
          normally nothing to run by hand. To serve it yourself, or to drive it over HTTP, one
          process serves both the browser bridge and the MCP endpoint:
        </p>
        <div className="flex flex-col gap-2">
          <Code label="terminal" code="bun run mcp" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[13px]">
          <span className="flex items-center gap-2">
            <Dot tone={status.kind === 'up' ? 'ok' : status.kind === 'down' ? 'off' : 'wait'} />
            {status.kind === 'up' ? 'Bridge is running' : status.kind === 'down' ? 'Nothing is listening' : 'Checking…'}
          </span>
          <label className="flex items-center gap-2 text-foreground/70">
            port
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(Number(e.target.value) || DEFAULT_PORT)}
              className="h-8 w-20 rounded-lg border border-border bg-[#141418] px-2 font-mono text-[12px] text-foreground outline-none focus:border-white/25"
            />
          </label>
          <span className="font-mono text-[11px] text-muted-foreground/70">{base}</span>
        </div>
      </InfoSection>

      <InfoSection title="2 · Open a board so the agent has something to edit">
        <p className="mb-4 text-[13px] leading-relaxed text-foreground/80">
          Documents live in this browser, so a tab has to hand the page to the bridge. Adding <code className="font-mono text-[11px] text-[#f472b6]">?mcp</code> to a board URL
          does exactly that — and nothing at all without it.
        </p>
        {rows.length > 0 ? (
          <div className="flex flex-col gap-2">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-[#141418] px-3 py-2.5">
                <Dot tone={r.board?.live ? 'ok' : 'off'} />
                <span className="text-[13px] font-medium">{r.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground/70">/board/{r.id}</span>
                <span className="text-[11px] text-foreground/60">
                  {r.board
                    ? `${r.board.shapes} shapes · ${r.board.live ? `${r.board.tabs} tab${r.board.tabs === 1 ? '' : 's'} connected` : 'no live tab'}`
                    : 'not connected yet'}
                </span>
                <button
                  onClick={() => go(`/board/${r.id}?mcp=${port}`)}
                  className="ml-auto cursor-pointer text-[11px] text-foreground/60 hover:text-foreground"
                >
                  open with the bridge ↗
                </button>
              </div>
            ))}
            <p className="mt-1 text-[11px] text-muted-foreground/70">
              Opening reopens the same document in this tab with the bridge attached — saved exactly as usual.
            </p>
          </div>
        ) : (
          <Code label="board url" code={`${window.location.origin}/board/<projectId>?mcp=${port}`} />
        )}
      </InfoSection>

      <InfoSection title="3 · Point your host at it">
        <div className="flex flex-col gap-4">
          <Code label="claude code · http" code={`claude mcp add --transport http petals ${base}/mcp\nclaude mcp list`} />
          <Code
            label="claude code · stdio (host owns the process)"
            code={`claude mcp add --transport stdio petals -- bun run ${'<path-to-repo>'}/mcp-server/petal-mcp.ts`}
          />
          <Code
            label="opencode · opencode.jsonc"
            code={`{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "petals": {
        "type": "remote",
        "url": "${base}/mcp",
        "oauth": false
      }
    }
  },
}`}
          />
          <Code
            label="anything else · curl"
            code={`curl -s ${base}/mcp \\
  -H 'content-type: application/json' \\
  -H 'accept: application/json, text/event-stream' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`}
          />
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-muted-foreground">
          <code className="font-mono text-[11px] text-foreground/70">oauth: false</code> matters for OpenCode — otherwise it tries OAuth against the localhost URL and reports
          “needs authentication”. There is no login to give it: see the note at the end.
        </p>
      </InfoSection>

      <InfoSection title="What the agent can do">
        <CardRow items={TOOLS} />
        <p className="mt-5 text-[13px] leading-relaxed text-foreground/80">
          Every edit runs through the editor’s own commands, so it appears instantly, persists like any other change, and undoes with{' '}
          <kbd className="rounded border border-border bg-[#141418] px-1.5 py-0.5 font-mono text-[10px]">Ctrl</kbd>{' '}
          <kbd className="rounded border border-border bg-[#141418] px-1.5 py-0.5 font-mono text-[10px]">Z</kbd> — one tool call is one undo step.
        </p>
      </InfoSection>

      <InfoSection title="Why there is no login">
        <p className="text-[13px] leading-relaxed text-foreground/80">
          The connector binds <code className="font-mono text-[11px] text-foreground/70">127.0.0.1</code>, so it is reachable only from this machine, and a request carrying a browser
          origin has to be a local one — a website you happen to have open cannot read your design. MCP’s OAuth machinery is for <em>remote</em> servers; a loopback server is meant to be
          unauthenticated, which is why your host needs no token. A hosted Petals would need real accounts and OAuth before it could expose any of this, which is why this stays local.
        </p>
      </InfoSection>
    </InfoShell>
  )
}
