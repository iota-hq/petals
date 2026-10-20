# Scene 04 · Prompt Home — exports and field notes

This note accompanies one design — the "Prompt Home" scene from the reference — built **live in
the Petals canvas over the MCP bridge** (no human at the keyboard), then exported in every format
the app's Export menu offers.

The artwork itself is in `export/` at the repo root. That folder is git-ignored (the EPS/AI writers
embed rasterised assets, so two of the files are ~48 MB each); this note is checked in so the
findings survive.

## What's in `export/`

| File | What it is |
| --- | --- |
| `Scene_04_Prompt_Home.png` | 2× raster (2880×1640) — the one to post |
| `Scene_04_Prompt_Home.jpg` | 2× JPEG |
| `Scene_04_Prompt_Home.webp` | 2× WebP |
| `Scene_04_Prompt_Home.avif` | 2× AVIF |
| `Scene_04_Prompt_Home.svg` | vector SVG of the frame |
| `Scene_04_Prompt_Home.eps` | EPS (≈48 MB — see note below) |
| `Scene_04_Prompt_Home.ai` | Illustrator (≈48 MB — see note below) |
| `Scene_04_Prompt_Home.zip` | React + Tailwind component for the frame (`code` export) |
| `petals-app.png` | screenshot of the whole app with the frame fitted on the canvas |
| `petals-canvas.png` | crop of the canvas area around the frame |

The raster frames are rendered by the editor through `html-to-image`, so the PNG is the canvas as
the editor draws it (text, shadows, gradients and the icon artwork all included).

### The EPS/AI files are large on purpose

Both are ~48 MB because the eight toolbar/logo icons are inline `data:` URL SVGs and the EPS/AI
writers have to embed the bitmaps they rasterise from. They are real, valid files — just not
something to put in git. `export/` is git-ignored for that reason; the small formats are what you
want to move around.

## How the design was built

Everything went through the `petals` MCP tools:

1. `list_boards` → the live editor tab for project `Gd8cGJQ8uS`.
2. `create_shapes` — the whole tree in **one** call (30 shapes, caller-supplied ids): the outer
   frame, an inner page, four background cards, the nav pill (mark, wordmark, `beta` chrome,
   four links, avatar), the two-line headline, the prompt card with its toolbar, and the send
   button.
3. Icons: fetched from the Iconify `lucide` **collection** endpoint (the per-icon endpoint
   rate-limits this host), recoloured by rewriting `stroke="currentColor"`, and inlined as
   `data:image/svg+xml;base64,…`.
4. `update_shapes` — several passes: calm the background cards, wrap the headline to two lines,
   and lay out the icons (this last one became the bug below).
5. `export_shapes` is the tool for this, but the *running* bridge server in that session predated
   it, so the files here were driven through the app's own Export menu instead (see notes).

## Things that did not work, and what they are now

**1. Image shapes paint from `src`, not `fill` — invisible shapes (fixed).**
The first icon pass used `fill: { type: 'image', src: … }`, which is valid on rects and frames.
`createShape` merged it, the shape existed, the layer was listed, and nothing rendered: an image
shape reads its artwork from `src` only. Fix: `createShape` now hoists an image `fill` onto `src`
(and carries `fit` across) so this mistake can't silently produce a blank shape. The MCP spec text
for `fill`/`src` now says which field paints what, and `scripts/mcpVerify.mjs` grew a check that
creates an image shape with a `fill` object and asserts both the document `src` and a real `<img>`
in the DOM.

**2. `export_shapes` unknown to an already-running MCP server.**
The tool is in `mcp-server/petal-mcp.ts` and is covered by `mcpVerify` (which starts its own
server and sees all seven tools). A session that connected to a server started *before* the tool
was added never picks it up — MCP clients cache the tool list, and this harness can't respawn the
host-owned server. Restart the bridge (restart the host/client) and the tool appears. Until then,
`export_shapes` (svg / png / png2x / code, straight to base64/JSON) is the deterministic export
path; the Export menu is the human path and gives you jpg/webp/avif/eps/ai as well.

**3. A dev-server HMR reload can blank the in-memory store.**
Editing source while the live tab is open can hot-replace a module and leave the editor's store
empty even though the document is intact in `localStorage`. Nothing is lost — reload the tab and
the document comes back (the exports here were made after exactly that recovery). Worth knowing
when a "saved" design looks empty: reload before assuming the worst.

**4. Driving the Export menu from a script can steal the selection.**
A click aimed at the Export toggle occasionally lands on the canvas after the panel re-lays out
and selects whatever is under the cursor, so the export comes back named after the wrong shape
(`Avatar.png`, `Nav.jpg`). The reliable order is: reload the tab → set the selection with MCP
`select_shapes` → then click through the menu. Selecting by clicking a *layers* row is racy for
the same reason (the list scrolls as the row is brought into view).

**5. A plain link cannot show you the design.**
Documents live in `localStorage`, which belongs to one browser profile. The live window was
opened as a separate, disposable Edge profile, so the board exists in *that* profile only. To open
it in your own browser, add the bridge flag to the URL — `…/board/<id>?mcp=<port>` — and the tab
attaches to your running MCP server; without the flag it opens an empty board. The `MCP` page in
the app's Menu lists the port and the boards it knows about.

## Re-exporting

With the dev server on `:5173` and a bridge connected:

- **Over MCP** (preferred, no clicking): `export_shapes` with `ids: ['hero']` and
  `kinds: ['svg','png','png2x','code']`.
- **In the app**: select the frame → Export in the inspector → pick a format.

The scratch drivers used for this run were deleted; the checked-in suites (`scripts/mcpVerify.mjs`,
`scripts/boardVerify.mjs`) cover the same machinery.
