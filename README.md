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
- Frame presets (incl. **Desktop 1080p**, 1920×1080) that **auto-fit on screen** when created, from a
  menu that expands into place (93% → 100%, fading in) rather than flashing open
- Multi-select, marquee, shift-click; align panel; position & size with constraint-aware scrub fields
- **Drill-down selection** (Figma-style): a click selects the outermost shape, a double-click drills
  one level deeper; text takes one more double-click to enter inline editing. A plain click on the
  same nested stack keeps your drilled depth (so deep children stay movable) — anything else resets
- **Right-click context menu on the canvas**: bring to front / send to back, flip H / flip V,
  copy, paste, **copy as ▸ Code / PNG / SVG**, **Library ▸ Patterns / Logos / Icons** (opens the
  asset panel on that tab), group selection, duplicate, lock/unlock, hide/show, rename, delete —
  every op implemented for real against the document model. The menu flips itself up from the
  bottom edge rather than run off screen
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

### The asset library
- **Library panel** in the toolbar — or **right-click ▸ Library** — with **Patterns**, **Logos** and
  **Icons** as separate tabs behind one search box. It opens as a compact 256×380 panel docked just
  above the floating toolbar and flush with the left edge of the properties sidebar, so the canvas,
  the layers panel and the inspector all stay visible and usable while you pick
- The **search you type survives a tab switch** — only the placeholder re-words itself — so one idea
  can carry across patterns, logos and icons without retyping; opening the panel fresh from the
  toolbar clears it
- **Patterns** — 23 generative motifs from a local engine, applied as an ordinary image fill that is
  generated once at the shape's own size. A patterned canvas therefore renders as cheaply as a
  photographic one, and there is no per-frame geometry to go wrong
- A pattern lands with **the motif's own palette**, exactly as the thumbnail showed it (recolour it
  afterwards in the inspector), and applying one is a **single undo step**, whether it colours what
  you have selected or creates a rectangle to carry it
- The inspector's **Pattern** section tunes the motif that was applied, grouped as *Grid* (zoom,
  motif size, gap, detail, offset, rotation, twist), *Ink* (ground and ink colours, derived or by
  hand, opacity, stroke, paint mode), *Fade* and *Alternate*. Every control is a number field you can
  type into, scrub, or pick from icon buttons — no sliders, and the params stay on the shape, so
  reopening the document finds them editable
- **Logos** are the gilbarbara brand marks only — the index is fetched once, then browsable offline
- **Icons** are their own tab: Iconify's drawings, about 300,000 across 200+ sets, searched live
- Brand marks and icons are both **inlined as data URLs**, so a document renders without reaching a
  CDN, and both stay editable: the inspector's **Logo** section reads the colours the mark actually
  paints with, offers *mono* or per-colour repainting, and can restore the original artwork
- Icon drawings are fetched with the search, **batched one request per icon set**, rather than from
  Iconify's per-icon SVG endpoint — the one it rate-limits, where a grid of thumbnails trips a 429
  that lasts hours. A search that could not be made says so and offers a retry, and the thumbnails
  are local, so tapping one is instant
- Tiles on all three tabs are **the artwork itself**: no plate behind it and no box on hover —
  hovering dims the thumbnail and shows the name in a small pill above it, so the grid stays quiet
  and five columns wide
- **Text** boxes open hugging their content — type and the box grows, press Enter for a new line;
  drag a side handle and the width you choose sticks
- Offline, the fetched sources say so and offer a retry; patterns keep working

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
  fills, PS shading for gradients, rounded corners, embedded rasters and Helvetica text. Both are
  print formats: After Effects imports them as **one flat image**, so they are not the motion path
- **Native** (After Effects): a zip with `import-native.jsx` — run it with *File ▸ Scripts ▸ Run
  Script File…* and it **builds** the design as real AE layers: text layers you can double-click and
  retype, shape layers with editable rect/ellipse paths, fills, strokes, corner roundness, Drop
  Shadow effects and two-stop Gradient Ramp effects. Icons, logos, photos and complex gradients
  arrive as transparent PNGs on their own layers. No interchange file can do this — AI/EPS flatten,
  SVG drops text — so the layers are constructed from `scene.json` instead
- **Layers** (After Effects): a zip with one transparent, full-frame PNG per layer
  (`layers/01 Name.png`…), a `layers.json` manifest (frame size, names, boxes, text properties),
  `import.jsx` and `IMPORT-AFTER-EFFECTS.txt`. Drop the PNGs into a comp of that size and every layer
  lands already in position. Pixel-exact, but raster — use it when a shadow/filter/pattern must look
  identical, or when you want one import that needs no scripting
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

**Where your work lives**: every document sits in the `localStorage` of the browser profile you open
the app in, under `petal.doc.v1.<projectId>` — so `http://localhost:5173/projects` in *that* browser
is the only place your boards exist. A different browser, a different port, a private window or a
cleared profile is a different, empty set of documents. `/board/<projectId>` is the link to one
document, and the id in it is the storage key.

## Architecture

```
src/
  model/       types, zod schema, defaults, geometry, shared styles/transforms
  store/       docStore (Immer doc + history), uiStore (camera/selection/clipboard), projectsStore
  lib/         googleFonts index; iconify (batched icon data), brandLogos, svg (sanitise/recolour);
               patterns/ — the motif engine plus the fill helper that turns a motif into a shape fill
  editor/      CanvasRoot (pointer/wheel camera), NodeView renderer, SelectionOverlay,
               HoverMeasure (alt-measure), LeftPanel, PropertiesPanel, ContextMenu, AssetPanel
               (the shared picker chrome) with LibraryPanel and FontPicker, exporters, mcpBridge
  design-system/ docs: nav tree, Doc primitives, demo bits, one page file per nav group
  pages/       Landing, Dashboard (project list), EditorPage wiring, DesignSystem docs shell
```

Rules of the codebase: every document mutation goes through the commands / `docStore` tx APIs;
history snapshots are `structuredClone`d; the camera transform lives outside React; visibility,
locks and flips are plain shape fields respected by every renderer.

## Verification

Full browser suites driving an installed Edge/Chromium (playwright-core, headless):

```bash
bun build scripts/e2eVerify.ts  --target=node --external=playwright-core --outfile=scripts/e2eVerify.mjs && node scripts/e2eVerify.mjs   # drawing, frames, panels, undo/redo, stores
bun build scripts/menuVerify.ts --target=node --external=playwright-core --outfile=scripts/menuVerify.mjs && node scripts/menuVerify.mjs  # context menu ops, copy/paste, group, lambdas, alt-measure
node scripts/boardVerify.mjs   # /board tools: draw, select/drill, z-order, clipboard, lock/hide, group, undo/redo, auto-layout, align, nudge, frame presets, zoom, pages, copy-as-code, persistence
node scripts/boardVerify2.mjs  # /board inspector: position/size commits, opacity/radius/rotation, gradient+solid fills, shadows, filters, outline, layout gap/fill, text re-edit, rename
node scripts/boardVerify3.mjs  # /board: layer drag reorder, image insertion, PNG/SVG/EPS downloads, page deletion
bun build scripts/fontVerify.ts   --target=node --external=playwright-core --outfile=scripts/fontVerify.mjs && node scripts/fontVerify.mjs   # text panel + hugging/auto-width text boxes, font picker
bun build scripts/textCommitVerify.ts --target=node --external=playwright-core --outfile=scripts/textCommitVerify.mjs && node scripts/textCommitVerify.mjs # text edit commit on outside click
node scripts/libraryVerify.mjs # asset library: panel geometry + tabs, tiles and their hover hint, pattern palette + undo, the inspector's Pattern section, brand-logo and icon sources, search kept across tabs
node scripts/mcpVerify.mjs     # MCP: starts the server, drives client → /mcp → bridge → tab → docStore, checks the DOM
node scripts/popVerify.mjs     # popovers, tooltips, drag-scrub number fields, the assets panel, dock items
node scripts/dockVerify.mjs    # sidebar dock: park, restore, persisted layout
node scripts/designVerify.mjs  # /design-system: every nav route, sections, TOC, usage, current item, overflow
```

The `boardVerify*` suites need the dev server up (`bun run dev`, `http://localhost:5173`) and drive
real pointer/keyboard input against an installed headless Edge/Chromium. Every suite ends with a
pass/fail summary, a console-error report and a non-zero exit code on failure.

## Making Petals scriptable — MCP

An AI host — Claude Code, OpenCode, Claude Desktop, anything that speaks
[Model Context Protocol](https://modelcontextprotocol.io) — can read and edit the design in your
open `/board` tab. It is already built:

| File | Role |
| --- | --- |
| `mcp-server/petal-mcp.ts` | the MCP server: seven tools + one resource, over stdio *and* Streamable HTTP |
| `mcp-server/bridge.ts` | the localhost bridge between that server and the browser tab |
| `src/editor/mcpBridge.ts` | the browser side, inert unless the board URL carries `?mcp` |
| `src/pages/Mcp.tsx` | the in-app page at `/mcp`: live bridge status and the snippet for each host |
| `scripts/mcpVerify.mjs` | end-to-end suite: MCP client → `/mcp` → bridge → tab → `docStore` |

### Why a separate process

A browser page cannot host an MCP server. MCP clients talk to a *process* (stdio) or an HTTP
endpoint, a client-only SPA has neither, and nothing outside the page can reach `localStorage`. So
the connector is a small local companion process, and your open tab is the document it acts on.

It lives in this repo (two files, no build step, run straight from source with `bun`) so the tool
vocabulary stays in step with `src/model/types.ts` and `src/editor/commands.ts`. It is *not* part of
the Vite bundle: normal use downloads nothing extra, and `mcpBridge.ts` no-ops without `?mcp`.

### Use it

```bash
bun run mcp      # one process serves the bridge and /mcp on 127.0.0.1:8765
```

Then open the board with the bridge flag. This is the step that makes the tab reachable:

```
http://localhost:5173/board/<projectId>?mcp=8765
```

Now point a host at the same port. **Claude Code**, over HTTP:

```bash
claude mcp add --transport http petals http://127.0.0.1:8765/mcp
claude mcp list
```

…or over stdio, letting the host own the process (the bridge still listens on 8765, so don't also
run `bun run mcp`):

```bash
claude mcp add --transport stdio petals -- bun run D:/Projects/iota-draw/mcp-server/petal-mcp.ts
```

**OpenCode** — `oauth: false` matters, or OpenCode tries OAuth against the localhost URL and reports
`needs authentication`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "petals": {
        "type": "remote",
        "url": "http://127.0.0.1:8765/mcp",
        "oauth": false
      }
    }
  },
}
```

**Anything else** — plain stateless Streamable HTTP (no session header, JSON responses):

```bash
curl -s http://127.0.0.1:8765/mcp \
  -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### The tools

| Tool | Does |
| --- | --- |
| `list_boards` | boards the connected tabs announced, shape counts, whether a tab is live |
| `get_doc` | the board's pages and every shape, as the editor currently has it |
| `create_shapes` | add frames/rects/ellipses/lines/text/images; returns the new ids |
| `update_shapes` | patch shapes by id — position, size, fill, text, layout, visible, locked… |
| `delete_shapes` | delete shapes and everything nested inside them |
| `select_shapes` | move the editor's selection, so the user sees what changed |
| `export_shapes` | render the selection back as SVG, PNG (1×/2×) and React + Tailwind source |

Plus a read-only resource, `petal://board/<projectId>`.

Edits run through the editor's own commands, so they appear instantly, persist like any other
change, and undo with Ctrl+Z — one tool call is one undo step, which is what `setPropsBatch` in
`src/editor/commands.ts` exists for.

### Safety, and why there is no login

The socket binds `127.0.0.1`, and any request carrying a browser `Origin` must name a local origin,
so a website you happen to have open cannot read your design: CORS blocks the *read* of a
cross-origin response but not the request itself, so the request has to be refused as well. Tighten
it with `--origin http://localhost:5173` or `PETALS_MCP_ORIGINS`.

There is no authentication because this shape does not need it — the endpoint is reachable only from
your own machine, MCP clients send no `Origin` (they are not browsers), and MCP's OAuth story is for
*remote* servers. A hosted Petals would need a backend, real accounts and OAuth 2.1 + PKCE before it
could expose any of this, which is exactly why the connector is local-only. That hosted work is
scoped — and deliberately not started — in [`docs/hosted-mcp-plan.md`](docs/hosted-mcp-plan.md).

`--port <n>` or `PETALS_BRIDGE_PORT` moves the port; the bridge and `/mcp` share it.

### Test it

```bash
bun run dev                    # in another terminal
node scripts/mcpVerify.mjs     # starts its own server, drives the whole chain, checks the DOM
bunx @modelcontextprotocol/inspector bun run mcp-server/petal-mcp.ts   # interactive inspector
```

## Roadmap — what's still missing

Audited against the Wonder design-platform tool surface; each group is a capability Petals
does not have yet:

- **File & workspace management** — multi-file workspaces with folders, file thumbnails for the
  dashboard, cloud persistence + version history browser
- **Design system** — design tokens (named color/type/spacing) with token output in code export,
  global styles
- **Canvas intelligence** — layer search ("all fills #f472b6"), structural query API for tooling,
  rulers/guides/snap-to-grid, prototyping links between frames
- **Elements & drawing** — constraint-based resizing, boolean ops, pen/vector editing,
  component + variants, rich text
- **Auto layout v2** — grid flow, reverse direction, wrapping, per-child spacing overrides
- **Assets & media** — AI image generation, SVG authoring/vectorize, image crop/mask mode (the
  searchable pattern / logo / icon library is in; these are the parts still missing)
- **Design ↔ code bridge** — live round-trip (push code/artboards onto the canvas, pull updates back)
- **Code export polish** — design-token output (CSS vars / Tailwind theme), `<button>` inference,
  component-name dedupe across multi-component exports
- **Formats** — PDF export, per-node batch export marks
- **Hosted MCP** — the connector above works against your own machine. Making it work against a
  deployed Petals, with accounts, OAuth 2.1 and one-command agent setup, is scoped in
  [`docs/hosted-mcp-plan.md`](docs/hosted-mcp-plan.md) — parked, not started.

Petal is an independent project. The Atelier codebase (`D:\Projects\reference\atelier`) was used
as a *reference only* — no GPL-3.0 code was copied (see `ATTRIBUTION.md`).
