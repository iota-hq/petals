# Petals design system docs — page brief

How `/design-system` is built, and what a page owes a reader. Read this with
`src/design-system/Doc.tsx`, `src/design-system/bits.tsx` and
`src/design-system/pages/actions.tsx`, which is the reference page.

## Scope

The docs cover **what ships in the editor today** — no roadmaps, no speculative
components. The nav is:

```
Introduction
Foundations  color, typography, space, radius, borders and lines,
             elevation, motion, iconography, anti-slop
Actions      button, toolbar, copy button
Inputs       field, input, textarea, chip, number input, color picker, select
Selection    segmented control, switch
Display      kbd, card, panel, item, data list, truncate
Feedback     empty state, alert
Overlays     dialog, sheet, popover, tooltip, dropdown menu
Navigation   tabs
Layout       collapsible
Data         filter bar
Media        attachment
```

A component with no page is a component nobody can find. A page with no
component is a promise the code does not keep. Add and remove both together.

`design.how/systems/glaze` is the model for **structure**, never for looks or
copy. Each component page is:

1. **Title** and a one-line lead ("Starts an action.").
2. Example groups — *Styles*, *Sizes*, *States* — one bordered tile per variant
   with a caption strip (`primary / default`).
3. **Usage** — *When to use it* (a paragraph), then collapsed lists with counts:
   *Rules*, *Accessibility*, *Edge cases* (and *Keyboard* where keys exist).

We do **not** copy Glaze's black-and-white flat look, its words, or its
components. These docs are Petals: black page, hairlines, pink used only where
the product uses pink, Geist.

## The surface

- Page `#000000`; tiles and stages `#0b0b0d`; hairline `#27272f` (the app's border).
- Card `#141418`; popover `#1a1a20`; panel `#1c1c1c`; field `#2b2b2b`.
- Text `#ececf1`; secondary copy `#9a9aa4`; quiet mono captions `white/50`.
- Brand mark pink `#e063bb`; action/selection pink `#f472b6`; focus ring `#52525b`.
- Danger `#ef4444`. No other colours unless a demo is showing document content
  (a pattern, a photo) rather than chrome.
- Font: Geist Variable for everything, Geist Mono for hex, tokens, numbers and
  code. Page title 32px/500/-0.025em. Section titles 13px/600. Body 12.5–13px.

## Voice

Short, concrete, a little dry. Write what the thing does and when to use it.
Sentence case everywhere. Lowercase "petals" in prose. No emoji, exclamation
marks, "simply", "just", "delightful", "seamless". No marketing. A rule is a
sentence a reviewer could enforce, not a vibe.

Use the product's nouns: board, canvas, frame, layer, page, panel, selection,
export, command, transaction. Values in px, ms, hex.

## The page contract

Every page is a function component returning `<Page>…</Page>` and is exported in
one map per group file:

```tsx
import type { ComponentType } from 'react'
import { Page, Section, Stage, Tiles, Usage, Rows, Note, Snippet } from '../Doc'
import { Btn, Field, SelectField, Swatch, Kbd, Dot, LayerRow, PanelFrame, PanelSection, SegRow } from '../bits'

function ExamplePage() {
  return (
    <Page title="Example" lead="Does one thing." meta="2 sizes · 3 states">
      <Section title="Sizes" note="height">
        <Tiles items={[{ label: 'sm', note: '28px', node: <Btn size="sm">Save</Btn> }]} />
      </Section>
      <Usage when="…" rules={[…]} checks={[…]} edges={[…]} />
    </Page>
  )
}

export const xxxPages: Record<string, ComponentType> = { 'components/example': ExamplePage }
```

Rules for the page body:

- 1–3 example sections, then **Usage** (always last) — the shell builds the TOC
  from `data-toc`, the prev/next footer and the search index.
- Use `Tiles` for variants; add `wide: true` to a tile that needs the full row.
- Use `Stage` for one composed demo (a panel, a canvas moment) with a caption.
- Use `Rows` for anatomy/spec and token tables. Use `Note` at most once per page.
- Interactive demos use `useState` (hover/press/open/copied). No timers unless the
  behaviour is the point (copy confirmation); clean them up.
- Keep demos inside the tile: never let one set page width, scroll horizontally,
  or depend on the real editor store.
- A page for something that has not shipped yet is out of scope. When a surface
  is decided before it is built, keep it in the design file, not here.
- Every page: `lead` ≤ 90 characters; 4–7 rules; 3–5 accessibility checks; 3–6
  edge cases. Counts come from the arrays.
- No page repeats another page's demo or copy. If two components share a moment,
  each page shows its own side of it.
- Accessibility copy is specific: focus order, roles, labels, announcements,
  contrast, reduced motion. Not "make it accessible".
- Edge cases are real failure modes: long text, empty data, missing permission,
  keyboard-only, narrow panel, undo, duplicate action.

## Things that are true about Petals

- A browser design tool: infinite canvas, frames that export, pages, layers,
  a left pages/layers panel and a right properties panel (both 240px).
- Every document mutation goes through a command / transaction. Undo holds
  snapshots. The UI never writes the document directly.
- Pink means selection or the one primary action. It never borders a field;
  field focus is neutral `#52525b`.
- 1px hairlines do the structural work; panels have no drop shadows. Only
  popovers, menus, toasts and the toolbar float, with shadows.
- Fields are 28px tall, radius 6, 13px. Layer/page rows are 26px. Panel sections
  are `px-3.5 py-3` with 1.5 gaps and a bottom hairline.
- No uppercase labels, no helper paragraphs under fields, no gradients on chrome.
- Motion: `cubic-bezier(0.22, 1, 0.36, 1)`, 150ms hovers, 220ms route fades,
  500ms staged entrances.
- Marketing pages are black with a pink radial wash; docs are plain black.

## Before handing off

- `bun run typecheck` (Bun only, never npm).
- `node scripts/designVerify.mjs` with the dev server up — it walks every nav
  route and checks title, sections, TOC, usage block, current nav item and
  horizontal overflow.
- Screenshots land in `test-artifacts/` and are ignored by git.
