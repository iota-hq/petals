# Hosted MCP — parked work

Not built. The shipped connector (`mcp-server/`, `.mcp.json`, `opencode.json`) is a **local**
developer tool: it binds `127.0.0.1` and acts on a board tab running on your own machine. This
document is the plan for the thing that would work against `https://petalsapp.vercel.app` for any
user, so it isn't lost.

## The goal

> Add Petals to Claude Code / OpenCode / any agent, run one command, watch the agent edit my design
> live in the browser — against the deployed app, not a local dev server.

## Why it is not a flag on what exists

Three separate blockers, in increasing order of difficulty:

1. **The browser wall.** Chrome's [Local Network Access](https://developer.chrome.com/blog/local-network-access)
   (Chrome 142+) gates requests *from a public page to loopback* behind a user permission prompt.
   A page on the deployed origin reaching `http://127.0.0.1:8765` needs that grant.
2. **The origin allow-list.** The bridge refuses browser origins it doesn't know. Single-flag fix
   (`--origin https://petalsapp.vercel.app`), but it is fixing the wrong layer.
3. **The storage wall — the real one.** Documents live in the browser's `localStorage`. A server on
   Vercel has nothing to read. No amount of auth changes that. Either the documents move to the
   server, or the browser keeps an outbound link to a relay.

## Architecture that would work

```
agent CLI ──MCP (OAuth 2.1)──> hosted MCP endpoint ──> relay/session ──WS──> open Petals tab
                                        │                                        │
                                   Postgres + accounts                    applies ops via
                                   (documents, projects)                  docStore commands
```

Two halves, and both are needed:

- **Documents move server-side.** Projects and boards become rows owned by an account, with the
  browser as a client that subscribes to changes. This is the substantial refactor: today
  `src/store/docStore.ts` persists to `localStorage` under `petal.doc.v1.<id>` and
  `src/store/projectsStore.ts` under `petal.projects.v1`. Both need a server-backed implementation
  behind the same store API, plus a migration path for existing local documents.
- **A relay the open tab subscribes to.** The deployed page opens an outbound WebSocket/SSE to the
  relay and registers `(userId, boardId)`. MCP tool calls are routed to whichever socket holds that
  board — the same shape as the current `Bridge`, lifted onto the network. Live editing for free,
  because the tab still applies ops through `docStore`.

## Auth

- **MCP endpoint: OAuth 2.1 + PKCE + dynamic client registration**, per the MCP spec, so an agent
  can onboard itself and the user sees a single browser consent screen. The server also publishes
  RFC 9728 protected-resource metadata.
- **Petals itself: accounts.** There are none today; this is the prerequisite for everything above
  (and for the file/workspace management already on the roadmap).

## One-click agent setup

The deliverable the local `.mcp.json` can only approximate. Once the endpoint is hosted and
self-registering, setup is one command per host — `claude mcp add --transport http petals
https://<host>/mcp`, `opencode mcp add petals --url …` — or a copy button on `/mcp` that emits the
right line per host. No token pasting, because OAuth handles it.

## Runtime choice

The user asked for Express. Worth revisiting at that point rather than assuming: the
[`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/modelcontextprotocol) has both
a Node/Express mountable transport and a Web-standard one, and the relay wants long-lived
connections. Vercel functions cannot hold WebSockets, so this wants Cloudflare Workers + Durable
Objects (which is also where `WebStandardStreamableHTTPServerTransport` is the native fit) or a
small always-on Node/Express host. Decide when the documents actually live server-side.

## What would NOT be needed

- A token in the config: OAuth replaces it.
- A locally-run helper: that is the current design, and it is what holding the documents in the
  browser forces. Hosted documents remove the need.

## Stays as-is meanwhile

The local connector keeps working and keeps being useful for developing Petals itself. Nothing in
this plan changes `mcp-server/bridge.ts`, `src/editor/mcpBridge.ts`, or the `/mcp` page — they are
the working local path, and the bridge protocol is a good rehearsal of the relay's.
