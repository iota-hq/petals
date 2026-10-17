# Petal 🌸

A browser-based design tool in the spirit of Figma — canvas, frames, layers and a full
properties inspector — built as a local-first app with no backend. Everything (documents,
pages, UI state) lives in `localStorage`.

## Stack

- **Vite + React 19 + TypeScript**, **Tailwind 4** + **shadcn/ui** (Button, Input, Tooltip, plus
  in-house `MiniSelect` / `MiniSwitch` so no web-default dropdowns, checkboxes or radios are ever shown)
- **zustand** stores: `docStore` (Immer document + history), `uiStore` (camera, selection, panels)
- **Geist Variable / Geist Mono Variable** via `@fontsource-variable` (wired as `--font-sans` / `--font-mono`)
- Custom DOM-based rendering engine (memoized per-shape `NodeView`, camera transform outside React,
  fractional `order` z-index) so hundreds of shapes stay interactive
- bun for all tooling (`bun run dev`, `bun run build`, `bunx tsc --noEmit`)

## Scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Dev server on `localhost:5173` |
| `bun run build` | `tsc --noEmit` + production bundle |
| `bun run scripts/docTest.ts` | Headless document-model checks (history, schema, selection) |
| `bun build scripts/e2eVerify.ts --target=node --external=playwright-core --outfile=scripts/e2eVerify.mjs && node scripts/e2eVerify.mjs` | Browser E2E suite (drives installed Edge) |

## Shipped today

- Frame / rectangle / ellipse / line / image / text tools, drawing into frames (nesting) or the page
- Multi-select with align panel, position & size, opacity, corner radius (uniform or per-corner), rotation
- Fill: solid, **linear / radial / conic gradients** (with gradient bar + stops), **image fills** (cover/contain)
- Border with width + color, **outer / inner shadows with X / Y / blur / spread**, 8 CSS filters
- Frame margin, clip toggle, canvas background color
- Layers panel with multi-page documents, rename, reorder, hide/lock
- Undo/redo with structured history snapshots, localStorage persistence
- Exports: PNG / JPG / WEBP / AVIF (2× raster), SVG (vector), **EPS / AI** (hand-written PostScript writer
  with solid fills, PS shading for gradients, rounded corners, embedded raster images and Helvetica text)
- Custom color picker popovers (react-colorful) with alpha, boxed color rows, constraint-aware scrub fields

## Roadmap — features we're missing

Audited against the Wonder design-platform tool surface (41 tools, grouped by job); each group below maps
to product capability Petal does not have yet:

### File & workspace management
Wonder: `list_files / create_file / rename_file / move_file / create_folder / move_page / rename_page`
- [ ] Multi-file workspace with folders (today: one dashboard list, flat)
- [ ] File rename/rename in place, file thumbnails for the dashboard (`take_screenshot` equivalent)
- [ ] File organization / move between workspaces
- [ ] Cloud persistence + branching history (we only snapshot to `localStorage`)
- [ ] Version history browser with restore points

### Design system
Wonder: `create_design_tokens / update_design_tokens / delete_design_tokens / get_design_tokens / create_icons / update_icons / delete_icons / get_icons`
- [ ] **Design tokens** — named color/typography/spacing tokens that styles reference (our fills are raw values)
- [ ] Shared **icon library** inside a file (reusable, recolorable SVG components)
- [ ] Global type styles & color styles referenced by shape properties

### Canvas intelligence
Wonder: `get_artboards / find_elements / get_element_tree / get_design_context / get_design_guidelines`
- [ ] Find/search layers by name or property (e.g. "all fills #f472b6")
- [ ] Structural query API over the document tree (tree/element introspection used by tooling)
- [ ] Artboard presets / layout guidelines toolbar (grid, columns), rulers, guide lines, snap-to-grid
- [ ] Zoom-to-fit shortcuts parity, measure/inspect mode (spec readout of spacing)

### Elements & drawing
Wonder: `update_elements / delete_elements / duplicate_elements / rename_elements`
- [ ] **Auto layout** (flexbox-like stacking, padding/gap driven by frame margin — we only have static margin)
- [ ] Constraint-based resizing (pin left/right/top/bottom)
- [ ] Boolean operations (union / subtract / intersect / flatten)
- [ ] Vector/pen tool: point-level path editing (our shapes are parametric only)
- [ ] Component system: create component, instances, propagate changes, variants
- [ ] Prototyping: link frames with transitions, hotspot overlays, preview mode
- [ ] Rich text (mixed-weight spans within one text node), vertical text alignment, auto-width boxes

### Assets & media
Wonder: `generate_image / generate_svg / vectorize_image / prepare_image_upload / fetch_image_content / fetch_image_description`
- [ ] AI image generation & in-app image search
- [ ] SVG *authoring*/vectorize: import SVG as editable paths; raster→vector trace
- [ ] Image crop/mask mode on image shapes

### Design ↔ code bridge
Wonder: `get_element_code / get_design_context / skills (code-to-design, design-to-code)`
- [ ] Read a selection into code (symbol/JSX/Tailwind readout)
- [ ] Push code/artboards into the canvas from a repository ("code to design")
- [ ] Plugin/extension API exposing the document (`get_element_tree`-style) to outside tools — **this is also
  the entry point for making Petal scriptable via an MCP server** (see next section)

### Formats & batch export
- [ ] PDF export, per-node export marks (batch export at 1×/2×/… with prefixes)
- [ ] Export transparency/format presets stored on the node

## Making Petal scriptable (MCP notes)

Research summary from the [Model Context Protocol TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk):

- Use `@modelcontextprotocol/sdk`-style registration: an `McpServer` instance, `registerTool(name, schema, handler)`
  with zod schemas, then `connect(new StdioServerTransport())` — one TS file is enough.
- The natural Petal tool set mirrors the list above: `get_doc` / `find_elements` / `create_frame` / `update_elements` /
  `delete_elements` / `export_selection` — all thin wrappers over the existing `commands.ts` mutations.
- Hosts connect to it by pointing their MCP config at a stdio command (`bunx tsx petal-mcp.ts`); a read-only
  document resource can be exposed alongside the tools.
- Editing the *live* editor (the canvas you have open) needs a second channel: a WebSocket bridge from the dev
  page (`docStore` already reacts to messages) — the MCP process becomes a relay to that socket.
