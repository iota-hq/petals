# Attribution & Reference Hygiene

> Last updated: 2026-10-17

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

## Our own dependencies (all permissive)

Vite, React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Radix-based), Zustand,
Immer, lucide-react, nanoid, Zod, react-colorful, @dnd-kit — permissive licenses
(MIT/Apache-2.0/ISC), no GPL obligations.
