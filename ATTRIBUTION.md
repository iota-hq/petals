# Attribution & Reference Hygiene

> Last updated: 2026-10-19

## Atelier (oskarglauser/atelier)

Iota Draw's interaction model, panel layout, and feature checklist are informed
by studying **[Atelier](https://github.com/oskarglauser/atelier)** by Oskar Glauser
(**GPL-3.0** © Oskar Glauser). Ideas and architecture were studied; no source code
was copied.

- A sanitized, read-only reference clone lives at `D:\Projects\reference\atelier`
  **deliberately outside this repository**. It is marked `atelier-reference-only`,
  `private: true`, `UNLICENSED`, and contains a `README-REFERENCE-NOTICE.md`.
- **Never copy code from that folder into Iota Draw.** Studying how it works is
  fine;GPL-3.0 source that lands in this repo would obligate Iota Draw to adopt
  the same license when distributed.
- If any project ever copies Atelier code (now or later), that must be a
  deliberate, documented decision and Iota Draw is GPL from then on.

## Other inspiration

- **tldraw / excalidraw / Figma** — interaction conventions (tools, marquee,
  space-pan, zoom-to-cursor).
- **Wonder (wonder.design)** — product direction for canvas-built React output
  and an MCP-driven editor.

## Asset library sources

The asset library (`src/lib/brandLogos.ts`, `src/lib/iconify.ts`) fetches its artwork from public
CDNs **at runtime** — none of it is vendored into this repository, and nothing is bundled into the
app.

| Source | What | License |
| --- | --- | --- |
| [gilbarbara/logos](https://github.com/gilbarbara/logos) | full-colour brand logos | CC0-1.0 (the marks remain trademarks of their owners) |
| [Iconify](https://iconify.design) / [icones.js.org](https://icones.js.org) | monochrome icons from 200+ open sets, searched live | the API and index are MIT; each icon set keeps its own licence (shown by Iconify per set) |

Icons come from Iconify's collection endpoint (`/{prefix}.json?icons=…`), batched one request per
icon set, rather than its per-icon SVG generator, which rate-limits bursts. Each icon's drawing is
sanitised and inlined as a data URL; the licence of the set it came from is the set's own.

The pattern engine in `src/lib/patterns/` is ported from **iOTA-WIP**, this project's own earlier
codebase — no third-party licence is involved.

## Our own dependencies (all permissive)

Vite, React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Radix-based), Zustand,
Immer, lucide-react, nanoid, Zod, react-colorful, @dnd-kit — permissive licenses
(MIT/Apache-2.0/ISC), no GPL obligations.
