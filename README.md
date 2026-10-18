<div align="center">

<img src="public/petal-flower.svg" alt="Petals logo" width="88" />

# Petals

**A browser-based design tool — canvas, frames, layers and a full inspector, in the spirit of Figma.**

Local-first: no backend, no accounts, nothing leaves the device. Every document, page and UI
state lives in `localStorage`, right in your browser.

[Stack](#stack) · [Capabilities](#capabilities) · [Getting started](#getting-started) · [Architecture](#architecture) · [MCP](#making-petals-scriptable--mcp)

</div>

---

## Stack

- **Vite + React 19 + TypeScript**, **Tailwind 4** + **shadcn/ui** (Button, Input, Tooltip, plus
  in-house `MiniSelect` / `MiniSwitch` so no web-default dropdowns, checkboxes or radios are shown)
- **zustand** stores: `docStore` (Immer document + structured history), `uiStore` (camera, selection, gestures, clipboard)
- **Geist Variable / Geist Mono Variable** via `@fontsource-variable` (wired as `--font-sans` / `--font-mono`)
- Custom **DOM-based rendering engine** — memoized per-shape `NodeView`, camera transform applied
  outside React, fractional `order` z-index — so hundreds of shapes stay interactive
- **bun** for all tooling (never npm)

## Capabilities

### Canvas & shapes
- Frame / rectangle / ellipse / line / image / text tools; draw into frames (nesting) or the page
- Frame presets (incl. **Desktop 1080p**, 1920×1080) that **auto-fit on screen** when created
- Multi-select, marquee, shift-click; align panel; position & size with constraint-aware scrub fields
- **Drill-down selection** (Figma-style): a click selects the outermost shape, a double-click drills
  one level deeper; text takes one more double-click to enter inline editing. A plain click on the
  same nested stack keeps your drilled depth (so deep children stay movable) — anything else resets
- **Right-click context menu on the canvas**: bring to front / send to back, flip H / flip V,
  copy, paste, **copy as ▸ Code / PNG / SVG**, group selection, duplicate, lock/unlock, hide/show,
  rename, delete — every op implemented for real against the document model
- **Alt + hover measurement** (Figma-style): hold Alt and hover another element to see dotted pink
  distance labels to the selection on every side, plus solid edge-alignment markers
- Keyboard: Ctrl+C/V/X/D, arrow nudge, Escape cascade, delete

### Appearance
- Fill: solid, **linear / radial / conic gradients** (thin gradient bar, stops as color rows,
  icon-only gradient-type switcher), **image fills** (cover / contain)
- Border with width + color, **outer / inner shadows** (X / Y / blur / spread), 8 CSS filters
- **Text parity**: text nodes carry the same surface as every other shape — fill, outline,
  shadows, radius, filters, rotation (and auto-height still works)
- Fonts: Geist + system faces locally, plus **the full Google Fonts library** (~2,000 families)
  browsed Figma-style — searchable, category-filtered, self-previewing rows; faces load on demand
  from the Fontsource CDN (`bun run fonts:index` regenerates the index)
- Opacity, corner radius (uniform or per-corner), rotation + flips applied to every renderer
  (DOM, canvas, SVG, EPS alike) — via one shared transform helper

### Auto layout
- Frames can take a **flow**: vertical / horizontal, with **gap** and alignment controls
  (justify / align, progressively disclosed after a flow is chosen)
- **Sizing per frame**: fixed or **hug contents**; children can **fill** the leftover space along
  the main axis and/or stretch across it — Figma semantics (toggling fill back to fixed keeps the
  current size)
- A reflow engine repositions and resizes children deepest-frames-first, so hug results propagate
  through nesting; margins are respected as inset origins
- The exported code mirrors the model: flow frames emit `flex flex-col/row` + `gap`, fill children
  emit `flex-1` / `self-stretch`, and hugged axes drop their size class

### Layers & documents
- Multi-page documents; layers panel with drag-reorder (above / below / nest-in), hide & lock
  toggles, inline rename (double-click, or via the context menu)
- Dense panel layout with **auto-hiding ultra-thin scrollbars**
- Undo/redo with structured history snapshots (never captures Immer drafts)
- Persistence to `localStorage` with debounced saves; docs survive reloads and hash-deep links
- Dashboard with **randomly generated stub names** (`Sleepy-Walrus-3902`-style) so you can start
  sketching in one click

### Export
- Raster: PNG / JPG / WEBP / AVIF at 1×–4×
- Vector: **SVG**, plus a hand-written PostScript writer — **EPS** (and `.ai` interop) with solid
  fills, PS shading for gradients, rounded corners, embedded rasters and Helvetica text
- **Code**: right-click ▸ Copy as ▸ Code, or Export menu — produces a React component styled with
  **Tailwind** (+ inline style only where Tailwind can't express gradients/filters/typography);
  the Export menu variant ships a **zip** with `Component.tsx` plus real `assets/image-N.png` files
  and clean `import image1 from './assets/image-1.png'` statements instead of base64. Output aims
  to be honest markup: whole-pixel rounding, standard radius utilities, semantic `<p>` text,
  flex classes for auto-layout frames, and a single shape exports standalone with no wrapper

### The site around the tool
- Marketing pages baked into the app: **landing**, **About**, **Careers** (applications post to
  Formspree) and a **Gallery** of starter canvases, sharing one info-shell chrome and the
  pink-gradient identity
- SEO/OG meta + image, anonymized analytics
- **Sponsors**: iota and "+" tiles in the editor's sidebar footer (the plus opens the Contra
  sponsor page), plus a timed on-canvas sponsor bubble — appears 10 s after you open the board,
  stays 30 s, links to Contra

## Getting started

```bash
bun install        # bun only — never npm
bun run dev        # dev server on localhost:5173
bun run build      # tsc --noEmit + production bundle
bun run fonts:index  # regenerate public/fonts/google-fonts.json from api.fontsource.org
bun run preview    # serve the production build
```

## Architecture

```
src/
  model/       types, zod schema, defaults, geometry, shared styles/transforms
  store/       docStore (Immer doc + history), uiStore (camera/selection/clipboard), projectsStore
  editor/      CanvasRoot (pointer/wheel camera), NodeView renderer, SelectionOverlay,
               HoverMeasure (alt-measure), LeftPanel, PropertiesPanel, ContextMenu, exporters
  pages/       Landing, Dashboard (project list), EditorPage wiring
```

Rules of the codebase: every document mutation goes through the commands / `docStore` tx APIs;
history snapshots are `structuredClone`d; the camera transform lives outside React; visibility,
locks and flips are plain shape fields respected by every renderer.

## Verification

Full browser suites driving an installed Edge/Chromium (playwright-core, headless):

```bash
bun build scripts/e2eVerify.ts  --target=node --external=playwright-core --outfile=scripts/e2eVerify.mjs && node scripts/e2eVerify.mjs   # drawing, frames, panels, undo/redo, stores
bun build scripts/menuVerify.ts --target=node --external=playwright-core --outfile=scripts/menuVerify.mjs && node scripts/menuVerify.mjs  # context menu ops, copy/paste, group, lambdas, alt-measure
```

Also in `scripts/`, run the same way: `popVerify` (popovers/inspector rows), `textCommitVerify`
(text editing + commit), `fontVerify` (Google Fonts browser), `dockVerify` (panel docking) and
export checks. Every suite ends with a pass/fail summary, a console-error report and a non-zero
exit code on failure. Screenshots land in `test-artifacts/`.

## Making Petals scriptable — MCP

Petal's document is a plain serializable tree, which makes it a natural fit for
[Model Context Protocol](https://modelcontextprotocol.io) (MCP): AI hosts (Claude Desktop, Claude
Code, OpenCode, …) connect over stdio and get tools to read and edit designs. Nothing in this repo
bound to a server today — here is the full recipe to build it.

### 1. Add the SDK

```bash
bun add @modelcontextprotocol/sdk zod
```

### 2. Write the server (`mcp-server/petal-mcp.ts`)

Register tools with zod schemas, serve over stdio. Each tool is a thin wrapper over the same
structures the editor uses (see `src/model/types.ts` and `src/editor/commands.ts`):

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { readDoc, writeDoc } from './bridge.js' // step 3

const server = new McpServer({ name: 'petals', version: '0.1.0' })

server.registerTool('get_doc', {
  description: 'Read the current Petals document as a node tree',
  inputSchema: { projectId: z.string() },
}, async ({ projectId }) => ({
  content: [{ type: 'text', text: JSON.stringify(await readDoc(projectId)) }],
}))

server.registerTool('update_elements', {
  description: 'Patch one or more shapes: position, size, fill, visible, locked, name…',
  inputSchema: {
    projectId: z.string(),
    patches: z.array(z.object({ id: z.string(), fields: z.record(z.unknown()) })),
  },
}, async ({ projectId, patches }) => {
  const doc = await readDoc(projectId)
  for (const { id, fields } of patches) Object.assign(doc.nodes[id], fields)
  await writeDoc(projectId, doc)
  return { content: [{ type: 'text', text: `updated ${patches.length} shape(s)` }] }
})

server.registerTool('delete_elements', {
  description: 'Delete shapes (and their subtrees) by id',
  inputSchema: { projectId: z.string(), ids: z.array(z.string()) },
}, async ({ projectId, ids }) => {
  const doc = await readDoc(projectId)
  for (const id of ids) delete doc.nodes[id]
  await writeDoc(projectId, doc)
  return { content: [{ type: 'text', text: `deleted ${ids.length}` }] }
})

await server.connect(new StdioServerTransport())
```

Follow the same pattern for `create_frame`, `duplicate_elements`, `rename_elements`,
`export_selection` (reusing `exporters.ts`) and a read-only `doc://<projectId>` resource via
`server.resource(...)`.

### 3. Bridge the browser storage to the server

MCP runs as a Node process, but documents live in the browser's `localStorage`. Two clean options:

- **File exchange (simplest):** add "Export project JSON / Import" to the dashboard; the server
  reads/writes those JSON files on disk. Perfect for batch AI edits and CI-style tools.
- **Live editor bridge:** run a small WebSocket relay inside the MCP process; the editor page
  connects to it on load and forwards every `docStore` change. Tools then mutate the *live*
  document through the existing commands (the store already reacts to incoming messages).
  Sketch of the client side, dropped into `EditorPage`:

```ts
// one-way live sync of the serialized doc
const ws = new WebSocket('ws://localhost:8765')
ws.onopen = () => ws.send(JSON.stringify({ type: 'doc', doc: serialize(docStore.getState()) }))
```

(Debounce and reconcile with the history model — the relay is the only stateful piece.)

### 4. Register it with an MCP host

Claude Desktop (`claude_desktop_config.json`), Claude Code, or OpenCode's `mcp` config:

```json
{
  "mcpServers": {
    "petals": {
      "command": "bun",
      "args": ["run", "mcp-server/petal-mcp.ts"],
      "cwd": "D:/Projects/iota-draw"
    }
  }
}
```

### 5. Test it

```bash
bunx @modelcontextprotocol/inspector bun run mcp-server/petal-mcp.ts
```

…opens the interactive inspector: connect, call `get_doc`, patch a fill, confirms in the browser.

## Roadmap — what's still missing

Audited against the Wonder design-platform tool surface; each group is a capability Petals
does not have yet:

- **File & workspace management** — multi-file workspaces with folders, file thumbnails for the
  dashboard, cloud persistence + version history browser
- **Design system** — design tokens (named color/type/spacing) with token output in code export,
  shared icon library, global styles
- **Canvas intelligence** — layer search ("all fills #f472b6"), structural query API for tooling,
  rulers/guides/snap-to-grid, prototyping links between frames
- **Elements & drawing** — constraint-based resizing, boolean ops, pen/vector editing,
  component + variants, rich text
- **Auto layout v2** — grid flow, reverse direction, wrapping, per-child spacing overrides
- **Assets & media** — AI image generation, SVG authoring/vectorize, image crop/mask mode
- **Design ↔ code bridge** — live round-trip (push code/artboards onto the canvas, pull updates back)
- **Code export polish** — design-token output (CSS vars / Tailwind theme), `<button>` inference,
  component-name dedupe across multi-component exports
- **Formats** — PDF export, per-node batch export marks

Petal is an independent project. The Atelier codebase (`D:\Projects\reference\atelier`) was used
as a *reference only* — no GPL-3.0 code was copied (see `ATTRIBUTION.md`).
