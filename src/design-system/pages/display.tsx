import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Circle,
  Droplet,
  Eye,
  EyeOff,
  File,
  Frame,
  Image as ImageIcon,
  Lock,
  LockOpen,
  Minus,
  Plus,
  Square,
  Type,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { Page, Section, Stage, Tiles, Usage, Rows, Note } from '../Doc'
import { Field, Kbd, LayerRow, PanelFrame, SegRow, Swatch } from '../bits'
import { cn } from '@/lib/utils'

/* ---------------------------------- shared --------------------------------- */

/** The four-petal mark, inline so a demo never depends on a public asset. */
function Flower({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} fill="currentColor" aria-hidden="true" className={className}>
      <path d="M36 36Q51.12 16.2 36 0Q20.88 16.2 36 36Z" />
      <path d="M36 36Q55.8 51.12 72 36Q55.8 20.88 36 36Z" />
      <path d="M36 36Q20.88 55.8 36 72Q51.12 55.8 36 36Z" />
      <path d="M36 36Q16.2 20.88 0 36Q16.2 51.12 36 36Z" />
    </svg>
  )
}

/* ----------------------------------- Kbd ----------------------------------- */

function KbdPage() {
  return (
    <Page
      title="Kbd"
      lead="A key you can press. Small, neutral, and never a button."
      meta="20px · radius 4 · Geist 10px"
    >
      <Section title="Sequences" note="1–3 keys">
        <Tiles
          min={150}
          items={[
            { label: 'single', note: 'K', node: <Kbd>K</Kbd> },
            {
              label: 'combo',
              note: '⌘ K',
              node: (
                <span className="flex items-center gap-1">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </span>
              ),
            },
            {
              label: 'three',
              note: '⇧ ⌘ Z',
              node: (
                <span className="flex items-center gap-1">
                  <Kbd>⇧</Kbd>
                  <Kbd>⌘</Kbd>
                  <Kbd>Z</Kbd>
                </span>
              ),
            },
            {
              label: 'arrows',
              note: '↑ ↓',
              node: (
                <span className="flex items-center gap-1">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                </span>
              ),
            },
          ]}
        />
      </Section>

      <Section title="In place" note="trailing a menu row">
        <Tiles
          min={280}
          items={[
            {
              label: 'menu row',
              note: '28px row',
              wide: true,
              node: (
                <div className="w-full max-w-[300px] rounded-lg border border-[#27272f] bg-[#1a1a20] p-1 shadow-2xl shadow-black/40">
                  {[
                    ['Duplicate', <Kbd key="d">⌘ D</Kbd>],
                    ['Bring to front', <Kbd key="b">⇧ ⌘ ]</Kbd>],
                    ['Export frame', <Kbd key="e">⇧ ⌘ E</Kbd>],
                  ].map(([label, key]) => (
                    <div key={String(label)} className="flex h-7 items-center gap-3 rounded px-2 text-[12px] text-foreground/80">
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      <span className="shrink-0">{key}</span>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              label: 'dark surface',
              note: '#1c1c1c',
              node: (
                <div className="flex h-[92px] w-full items-center justify-center gap-1 rounded-lg bg-[#1c1c1c]">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Anatomy">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'height', value: '20px', note: 'min-width 20px' },
            { name: 'padding', value: '0 6px', note: 'grows for wide glyphs' },
            { name: 'radius', value: '4px', note: 'not a pill' },
            { name: 'border', value: '1px white/12', note: 'no shadow' },
            { name: 'surface', value: '#1a1a1f', note: 'sits on panels and menus' },
            { name: 'type', value: '10px / 500 Geist', note: 'never Geist Mono' },
            { name: 'gap', value: '4px', note: 'between keys in a combo' },
          ]}
        />
      </Section>

      <Usage
        when="A shortcut the user can press right now. Put it where the command is named: a menu row, a tooltip, a command list. A keycap is a label, not a control."
        rules={[
          'Render the platform modifier: ⌘ on macOS, Ctrl on Windows and Linux.',
          'A sequence is one to three keys, in the order they are pressed.',
          'Use Geist, not Geist Mono. A keycap is chrome typography.',
          'The keycap never sits in a button label; the tooltip or the menu row carries it.',
          'Never put a keycap on an action that has no keyboard handler.',
        ]}
        checks={[
          'The glyph is readable by a screen reader as text, not as an image.',
          'The keycap has 4.5:1 text contrast on #1a1a1f.',
          'A shortcut shown in a tooltip is also reachable from the menu.',
        ]}
        keys={[
          '⌘ K opens the command menu.',
          '⌘ Z undoes; ⇧ ⌘ Z redoes.',
          'Escape closes the open popover and returns focus to its field.',
        ]}
        edges={[
          'A four-key sequence does not fit; move it to the command menu without a keycap.',
          'On touch there is no keyboard, so the same action keeps a visible button.',
          'A shortcut that the browser owns (⌘ W) is never advertised.',
        ]}
      />
    </Page>
  )
}

/* ----------------------------------- Card ---------------------------------- */

function ProjectCard({
  name,
  edited,
  hovered,
  focused,
}: {
  name: string
  edited: string
  hovered?: boolean
  focused?: boolean
}) {
  return (
    <a
      href="#rosewood"
      onClick={(e) => e.preventDefault()}
      aria-label={`Open ${name}`}
      className={cn(
        'group block w-[220px] rounded-[20px] border bg-[#141418] p-3 transition-colors duration-150',
        hovered ? 'border-white/15' : 'border-[#27272f]',
        focused && 'ring-2 ring-[#52525b] ring-offset-2 ring-offset-[#0b0b0d]',
      )}
    >
      <div className="flex h-[104px] items-center justify-center rounded-xl bg-[#1b1b1b]">
        <Flower
          size={40}
          className={cn(
            'transition-colors duration-150',
            hovered ? 'text-[#e063bb]' : 'text-[#4c2d43] group-hover:text-[#e063bb]',
          )}
        />
      </div>
      <div className="px-0.5 pb-0.5 pt-3">
        <p className="truncate text-[14px] font-semibold text-foreground">{name}</p>
        <p className="mt-0.5 truncate text-[11px] text-[#9a9aa4]">Edited {edited}</p>
      </div>
    </a>
  )
}

function NewProjectCard() {
  return (
    <button
      type="button"
      className="group flex min-h-[187px] w-[220px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed border-white/15 text-[#9a9aa4] transition-colors duration-150 hover:border-white/25 hover:bg-white/[0.02] hover:text-foreground"
    >
      <Plus size={18} />
      <span className="text-[12px] font-medium">New project</span>
    </button>
  )
}

function ProjectListRow({ name, edited }: { name: string; edited: string }) {
  return (
    <a
      href="#rosewood"
      onClick={(e) => e.preventDefault()}
      className="group flex w-full max-w-[520px] items-center gap-3 rounded-[20px] border border-[#27272f] bg-[#141418] px-3 py-2.5 transition-colors duration-150 hover:border-white/15"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#1b1b1b]">
        <Flower size={20} className="text-[#4c2d43] transition-colors duration-150 group-hover:text-[#e063bb]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-foreground">{name}</span>
        <span className="mt-0.5 block truncate text-[11px] text-[#9a9aa4]">Edited {edited}</span>
      </span>
    </a>
  )
}

function CardPage() {
  return (
    <Page
      title="Card"
      lead="A project on the shelf. One link, one mark, one line of metadata."
      meta="220px · radius 20 · 3 states + empty"
    >
      <Section title="States" note="the card is a link">
        <Tiles
          min={268}
          items={[
            { label: 'rest', note: '#4c2d43', node: <ProjectCard name="Rosewood" edited="2 min ago" /> },
            { label: 'hover', note: '#e063bb', node: <ProjectCard name="Rosewood" edited="2 min ago" hovered /> },
            { label: 'focus', note: '2px #52525b', node: <ProjectCard name="Rosewood" edited="2 min ago" focused /> },
            { label: 'new', note: 'button', node: <NewProjectCard /> },
          ]}
        />
      </Section>

      <Section title="Grid and list" note="two sizes, one anatomy">
        <Stage caption="Grid cards are 220px wide. The list row spans the shelf and keeps the same radius and mark.">
          <div className="flex flex-wrap items-start gap-4">
            <ProjectCard name="Rosewood" edited="2 min ago" />
            <ProjectCard name="Icons — spring set" edited="yesterday" />
          </div>
          <div className="mt-4">
            <ProjectListRow name="Rosewood — spring campaign" edited="2 min ago" />
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'width', value: '220px', note: 'grid; list spans the shelf' },
            { name: 'radius', value: '20px', note: 'both sizes' },
            { name: 'surface', value: '#141418', note: 'thumbnail #1b1b1b' },
            { name: 'mark', value: '40px', note: '#4c2d43 → #e063bb' },
            { name: 'name', value: '14px / 600', note: 'one line, truncated' },
            { name: 'meta', value: '11px', note: '“Edited …” always' },
            { name: 'element', value: '<a>', note: 'never a button' },
          ]}
        />
      </Section>

      <Usage
        when="A board the user owns, shown as something to reopen. The card is navigation: it opens the board in the editor."
        rules={[
          'The card is an anchor, not a button. A menu inside it is a sibling, never nested in the link.',
          'The whole card is the target. No separate Open action.',
          'Only the mark changes colour on hover; the surface stays #141418.',
          'The name is one line and truncates; the meta line stays “Edited …” and never becomes a second title.',
          'New project is the dashed slot and a real button, because it creates instead of opening.',
          'Grid cards are 220px. Do not stretch one to fill a row with a single project.',
        ]}
        checks={[
          'The link takes its accessible name from the project name, not the mark.',
          'Focus draws the neutral ring on the card edge, visible against black.',
          'Hover and focus change colour only; nothing moves or resizes.',
        ]}
        edges={[
          'A 60-character project name truncates; its title keeps the full string.',
          'A board with no thumbnail falls back to the flower tile, never a blank grey block.',
          'Renaming in place keeps the click inside the input instead of opening the board.',
          'Deleting the last project leaves the empty grid, not a link to nothing.',
        ]}
      />
    </Page>
  )
}

/* ---------------------------------- Panel ---------------------------------- */

/** The real section head: one +/− slot, and it is the control. */
function FoldSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children?: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[#27272f] px-3.5 py-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-5 w-full cursor-pointer items-center gap-2 text-left text-[13px] font-semibold tracking-[0.01em] text-foreground/90"
      >
        <span className="min-w-0 flex-1 truncate">{title}</span>
        <span className="shrink-0 text-[11px] font-normal text-muted-foreground">{open ? '−' : '+'}</span>
      </button>
      {open && children && <div className="mt-2 space-y-1.5">{children}</div>}
    </div>
  )
}

function PropertiesPanel() {
  const [align, setAlign] = useState('left')
  return (
    <PanelFrame title="Frame 1" width={240} className="bg-[#1c1c1c]">
      <FoldSection title="Fill">
        <div className="flex items-center gap-1.5">
          <Swatch color="#e063bb" size={24} radius={4} />
          <Field value="E063BB" className="min-w-0 flex-1" />
          <Field value="100" unit="%" className="w-[58px] shrink-0" />
        </div>
      </FoldSection>
      <FoldSection title="Appearance">
        <div className="flex items-center gap-1.5">
          <Field icon={<Droplet size={11} />} value="100" unit="%" className="min-w-0 flex-1" />
          <Field icon={<Square size={11} />} value="12" unit="px" className="min-w-0 flex-1" />
        </div>
        <Field label="Rotation" value="0" unit="°" />
      </FoldSection>
      <FoldSection title="Align">
        <SegRow
          value={align}
          onChange={setAlign}
          items={[
            { id: 'left', icon: <AlignLeft size={12} /> },
            { id: 'center', icon: <AlignCenter size={12} /> },
            { id: 'right', icon: <AlignRight size={12} /> },
          ]}
        />
      </FoldSection>
    </PanelFrame>
  )
}

function LayersPanel() {
  return (
    <PanelFrame width={240} className="bg-[#1c1c1c]">
      <div className="flex h-9 items-center justify-between border-b border-[#27272f] px-3.5">
        <span className="text-[13px] font-semibold text-foreground/90">Layers</span>
        <Plus size={13} className="text-muted-foreground" />
      </div>
      <div className="px-2.5 py-2">
        <LayerRow icon={<Frame size={12} />} name="Hero" />
        <LayerRow icon={<Type size={12} />} name="Headline" depth={1} active />
        <LayerRow icon={<Square size={12} />} name="Button" depth={1} />
        <LayerRow icon={<ImageIcon size={12} />} name="Avatar" depth={1} />
        <LayerRow icon={<Frame size={12} />} name="Footer" />
        <LayerRow icon={<Circle size={12} />} name="Dot" depth={1} />
      </div>
    </PanelFrame>
  )
}

function FillPopoverDemo() {
  return (
    <div className="relative h-[206px] w-[240px]">
      <div className="w-[240px] overflow-hidden rounded-lg border border-[#27272f] bg-[#1c1c1c]">
        <div className="border-b border-[#27272f] px-3.5 py-3 text-[13px] font-semibold text-foreground/90">Fill</div>
        <div className="space-y-1.5 px-3.5 py-3">
          <div className="flex items-center gap-1.5">
            <Swatch color="#e063bb" size={24} radius={4} />
            <Field value="E063BB" state="focus" className="min-w-0 flex-1" />
          </div>
          <Field value="100" unit="%" />
        </div>
      </div>
      <div className="absolute left-8 top-[78px] z-10 w-[184px] rounded-lg border border-[#27272f] bg-[#1a1a20] p-2 shadow-2xl shadow-black/60">
        <div className="grid grid-cols-5 gap-1.5">
          {['#e063bb', '#f472b6', '#ececf1', '#9a9aa4', '#2b2b2b'].map((c) => (
            <Swatch key={c} color={c} size={24} radius={4} />
          ))}
        </div>
        <div className="mt-2">
          <Field value="E063BB" state="focus" />
        </div>
      </div>
    </div>
  )
}

function PanelPage() {
  return (
    <Page
      title="Panel"
      lead="Persistent chrome for the document. Both sides use one anatomy."
      meta="240px · #1c1c1c · rows 26 / fields 28"
    >
      <Section title="Properties" note="right panel">
        <Stage caption="Selection pink only marks the frame on the canvas; the panel itself stays neutral. Section heads carry one +/− slot.">
          <div className="flex items-start gap-4">
            <div className="relative h-[264px] w-[200px] overflow-hidden rounded-lg border border-[#27272f] bg-[#141418]">
              <div className="absolute inset-6 rounded bg-[#1b1b1b]" />
              <div className="absolute left-6 top-6 h-[120px] w-[152px] rounded border-2 border-[#f472b6]" />
              <span className="absolute left-6 top-1 font-mono text-[9px] text-[#f472b6]">Hero</span>
            </div>
            <PropertiesPanel />
          </div>
        </Stage>
      </Section>

      <Section title="Sides" note="left 240 · right 240">
        <Stage caption="The left panel lists pages and layers; the right panel edits the selection. Same surface, same hairlines, no shadow.">
          <div className="flex flex-wrap items-start gap-6">
            <LayersPanel />
            <PropertiesPanel />
          </div>
        </Stage>
      </Section>

      <Section title="Collapsed and floating" note="the only shadow">
        <Tiles
          min={286}
          items={[
            {
              label: 'collapsed section',
              note: '+ / −',
              node: (
                <div className="w-[240px] overflow-hidden rounded-lg border border-[#27272f] bg-[#1c1c1c]">
                  <FoldSection title="Fill">
                    <Field value="E063BB" />
                  </FoldSection>
                  <FoldSection title="Appearance" defaultOpen={false} />
                  <FoldSection title="Align" defaultOpen={false} />
                </div>
              ),
            },
            {
              label: 'field popover',
              note: 'shadow only here',
              node: <FillPopoverDemo />,
            },
          ]}
        />
        <div className="mt-4">
          <Note>
            Panels never cast shadows. They sit flush against the canvas and are separated by the
            #27272f hairline. Only popovers, menus, toasts and the toolbar float.
          </Note>
        </div>
      </Section>

      <Section title="Anatomy">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'width', value: '240px', note: 'both sides' },
            { name: 'surface', value: '#1c1c1c', note: 'no shadow, no radius on the edge' },
            { name: 'hairline', value: '1px #27272f', note: 'under every section' },
            { name: 'section', value: 'px-3.5 py-3', note: 'title 13px / 600' },
            { name: 'row', value: '26px', note: 'pages and layers' },
            { name: 'field', value: '28px', note: 'radius 6' },
            { name: 'indicator', value: '+ / −', note: 'one slot per head' },
          ]}
        />
      </Section>

      <Usage
        when="Persistent chrome around the document: pages and layers on the left, properties on the right, both 240px. A panel holds controls, not content."
        rules={[
          'Both panels are 240px and flush to the viewport edge; they never overlap the canvas.',
          'One surface per panel: #1c1c1c, no shadow, no rounding on the outer edge.',
          'Sections use px-3.5 py-3 and keep their bottom hairline, including the last one.',
          'A section head is 13px semibold with exactly one +/− slot. Adding content and collapsing share it.',
          'Rows are 26px and fields are 28px. Nothing inside a section is taller except its head.',
          'A popover attached to a field floats with a shadow; the panel never gains one.',
        ]}
        checks={[
          'A collapsed section removes its content from the tab order and reports aria-expanded.',
          'The +/− control says Collapse Fill or Expand Fill, not just +.',
          'Scrolling stays inside the panel; the canvas does not scroll under a hovering pointer.',
          'Focus returns from a field popover to the field on Escape.',
        ]}
        edges={[
          'A long section title truncates before the +/− slot, which never moves.',
          'At 200% zoom the panel scrolls vertically instead of widening over the canvas.',
          'With nothing selected the right panel shows the document section, not an empty stack.',
          'A collapsed section keeps its hairline so the stack still reads as sections.',
        ]}
      />
    </Page>
  )
}

/* ---------------------------------- Badge ---------------------------------- */

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger'

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-[#2b2b2b] text-[#b9b9c2]',
  success: 'bg-[#182b20] text-[#7ddba3]',
  warning: 'bg-[#2a2113] text-[#f0c674]',
  danger: 'bg-[#2b1719] text-[#f2a0a0]',
}

function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-2 text-[10.5px] font-medium leading-none',
        BADGE_TONE[tone],
      )}
    >
      {children}
    </span>
  )
}

function BadgePage() {
  return (
    <Page
      title="Badge"
      lead="A quiet label on a thing. One word, one tone, no interaction."
      meta="20px · radius full · 4 tones"
    >
      <Section title="Tones" note="tone means something">
        <Tiles
          min={140}
          items={[
            { label: 'neutral', note: '#2b2b2b', node: <Badge>Local</Badge> },
            { label: 'neutral', note: 'label', node: <Badge>Spec</Badge> },
            { label: 'success', note: 'green tint', node: <Badge tone="success">Saved</Badge> },
            { label: 'warning', note: 'amber tint', node: <Badge tone="warning">Beta</Badge> },
            { label: 'danger', note: 'red tint', node: <Badge tone="danger">Failed</Badge> },
            {
              label: 'count',
              note: 'min-w 20',
              node: <Badge>3</Badge>,
            },
          ]}
        />
      </Section>

      <Section title="In place" note="trailing a noun">
        <Stage caption="A count sits beside the noun it counts. A project label sits in the meta line, after the name.">
          <div className="flex flex-wrap items-start gap-6">
            <div className="w-[240px] overflow-hidden rounded-lg border border-[#27272f] bg-[#1c1c1c]">
              <div className="flex items-center gap-2 px-3.5 py-3">
                <span className="text-[13px] font-semibold text-foreground/90">Pages</span>
                <Badge>3</Badge>
                <Plus size={13} className="ml-auto text-muted-foreground" />
              </div>
              <div className="px-2.5 pb-3">
                <LayerRow icon={<File size={12} />} name="Home" active />
                <LayerRow icon={<File size={12} />} name="Checkout" />
              </div>
            </div>
            <div className="w-[280px] rounded-[20px] border border-[#27272f] bg-[#141418] p-3">
              <p className="truncate text-[14px] font-semibold text-foreground">Rosewood — spring campaign</p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#9a9aa4]">
                <Badge>Local</Badge>
                <Badge tone="warning">Beta</Badge>
                <span className="truncate">· 12 layers</span>
              </div>
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'height', value: '20px', note: 'never wraps' },
            { name: 'radius', value: '9999px', note: 'full' },
            { name: 'padding', value: '0 8px', note: 'count uses min-w 20' },
            { name: 'type', value: '10.5px / 500', note: 'Geist' },
            { name: 'neutral', value: '#2b2b2b · #b9b9c2', note: 'surface · text' },
            { name: 'success', value: '#182b20 · #7ddba3', note: 'saved' },
            { name: 'warning', value: '#2a2113 · #f0c674', note: 'experimental' },
            { name: 'danger', value: '#2b1719 · #f2a0a0', note: 'failed' },
          ]}
        />
      </Section>

      <Usage
        when="A short label that qualifies the thing it sits on: a count, an environment, a state the user did not cause. Read it once and move on."
        rules={[
          'A badge labels a thing. It is not a control: no hover, focus, click or pointer cursor.',
          'One word or a number. If the label needs a sentence, it is a status line or an alert.',
          'Tone has to mean something: green saved, amber experimental, red failed. Never decoration.',
          'Saved is the past tense of a write. While writing, the status line says Saving — not a badge.',
          'Counts sit beside the noun and cap at 99+.',
          'Never use pink. Pink is selection or the primary action.',
        ]}
        checks={[
          'The label is read in document order, as text; it is not an aria-label on a dot.',
          'Colour is never the only signal — the word carries the meaning.',
          'The 10.5px text keeps 4.5:1 against its tint at the shipped values.',
        ]}
        edges={[
          'A count over 99 reads 99+; the exact number stays in the title attribute.',
          'A badge beside a truncated name does not shrink; the name truncates first.',
          'Two badges in a row is the limit; a third becomes a line of meta text.',
          'A translated label longer than 12 characters grows the pill instead of clipping.',
        ]}
      />
    </Page>
  )
}

/* --------------------------------- Avatar ---------------------------------- */

function Avatar({
  size = 24,
  kind = 'letter',
  label,
}: {
  size?: number
  kind?: 'flower' | 'letter'
  label: string
}) {
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden ring-1 ring-inset ring-white/[0.08]',
        kind === 'flower' ? 'bg-[#1c1c1c]' : 'bg-[#2b2b2b]',
      )}
      style={{ width: size, height: size, borderRadius: 6 }}
    >
      {kind === 'flower' ? (
        <Flower size={Math.round(size * 0.6)} className="text-[#e063bb]" />
      ) : (
        <span className="font-medium text-foreground/80" style={{ fontSize: Math.max(9, Math.round(size * 0.42)) }}>
          {label.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  )
}

function ImageAvatar({ size = 32, src, label }: { size?: number; src: string; label: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <Avatar size={size} label={label} />
  return (
    <img
      src={src}
      alt={label}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className="shrink-0 object-cover ring-1 ring-inset ring-white/10"
      style={{ width: size, height: size, borderRadius: 6 }}
    />
  )
}

function AvatarPage() {
  const sizes = [20, 24, 32, 40]
  return (
    <Page
      title="Avatar"
      lead="A project or workspace mark. Identity at a glance, no presence."
      meta="4 sizes · radius 6 · 3 sources"
    >
      <Section title="Sizes" note="height = width">
        <Tiles
          min={140}
          items={sizes.map((s) => ({
            label: String(s),
            note: `${s}px`,
            node: (
              <div className="flex items-center gap-2">
                <Avatar size={s} kind="flower" label="petals mark" />
                <Avatar size={s} label="Rosewood" />
              </div>
            ),
          }))}
        />
      </Section>

      <Section title="Marks" note="flower · letter · image">
        <Tiles
          min={160}
          items={[
            { label: 'flower tile', note: 'petals', node: <Avatar size={32} kind="flower" label="petals" /> },
            { label: 'letter tile', note: 'project name', node: <Avatar size={32} label="Rosewood" /> },
            {
              label: 'image',
              note: '32px',
              node: <ImageAvatar src="/iota-hq-sponsor.png" label="iota workspace" />,
            },
            {
              label: 'missing image',
              note: 'falls back',
              node: <ImageAvatar src="/no-such-workspace.png" label="Icons workspace" />,
            },
            {
              label: 'stacked',
              note: 'max 3 + count',
              wide: true,
              node: (
                <span className="flex items-center">
                  <span className="flex -space-x-1.5">
                    <Avatar size={28} kind="flower" label="petals" />
                    <span className="inline-flex rounded-md ring-2 ring-[#0b0b0d]">
                      <Avatar size={28} label="Rosewood" />
                    </span>
                    <span className="inline-flex rounded-md ring-2 ring-[#0b0b0d]">
                      <Avatar size={28} label="Icons" />
                    </span>
                  </span>
                  <span className="ml-2 font-mono text-[10px] text-muted-foreground/60">+3</span>
                </span>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Anatomy">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'sizes', value: '20 / 24 / 32 / 40px', note: 'rows / cards / headers' },
            { name: 'radius', value: '6px', note: 'never round' },
            { name: 'flower', value: '60% of the tile', note: '#e063bb' },
            { name: 'letter', value: '42% / 500', note: 'first character' },
            { name: 'letter surface', value: '#2b2b2b', note: 'text #ececf1 / 80' },
            { name: 'image', value: 'object-cover', note: 'ring 1px white/10' },
            { name: 'stack', value: '-6px overlap', note: 'ring 2px in tile surface' },
          ]}
        />
      </Section>

      <Usage
        when="A project, a workspace or the petals mark itself, where the name is already nearby or the space is a row. Not a person, not a presence indicator."
        rules={[
          'Flower for the petals mark, a letter for a project without an image, the image when one exists.',
          'A missing or broken image falls back to the letter tile, never a broken icon.',
          'Four sizes only. A bigger mark belongs to the page header, not a row.',
          'Never add an online dot, a status ring or a coloured presence border.',
          'A stack shows three marks and a +N count; the count is text, not another avatar.',
          'When the name is visible beside the mark, the mark is decorative and aria-hidden.',
        ]}
        checks={[
          'The letter or image has an accessible name from the project, not the letter itself.',
          'A decorative avatar is aria-hidden so the name is not read twice.',
          'The 6px radius and 1px ring stay visible against #141418 and #1c1c1c.',
        ]}
        edges={[
          'A project named in a non-Latin script still takes its first character.',
          'An image that 404s after the list renders swaps to the letter tile without a layout shift.',
          'A stack with more than three workspaces shows three and +N.',
          'At 20px the letter is 9px; below that the avatar is not used.',
        ]}
      />
    </Page>
  )
}

/* ----------------------------------- Item ---------------------------------- */

type Glyph = 'frame' | 'rect' | 'ellipse' | 'text' | 'image'

const GLYPH: Record<Glyph, ReactNode> = {
  frame: <Frame size={12} />,
  rect: <Square size={12} />,
  ellipse: <Circle size={12} />,
  text: <Type size={12} />,
  image: <ImageIcon size={12} />,
}

function ItemRow({
  name,
  glyph = 'rect',
  depth = 0,
  active,
  hidden,
  locked,
  editing,
  autoFocus,
  drag,
  revealActions,
  onSelect,
  onStartRename,
  onRename,
  onCancelRename,
  onToggleHidden,
  onToggleLocked,
}: {
  name: string
  glyph?: Glyph
  depth?: number
  active?: boolean
  hidden?: boolean
  locked?: boolean
  editing?: boolean
  autoFocus?: boolean
  drag?: boolean
  revealActions?: boolean
  onSelect?: () => void
  onStartRename?: () => void
  onRename?: (value: string) => void
  onCancelRename?: () => void
  onToggleHidden?: () => void
  onToggleLocked?: () => void
}) {
  const actionOpacity = active || hidden || locked ? 'opacity-70' : revealActions ? 'opacity-60' : 'opacity-0 group-hover:opacity-60'
  return (
    <div
      role={onSelect ? 'treeitem' : undefined}
      aria-selected={onSelect ? active : undefined}
      onClick={onSelect}
      onDoubleClick={onStartRename}
      className={cn(
        'group flex h-[26px] cursor-default items-center gap-1.5 rounded-md pr-1.5 text-[12px] select-none',
        active ? 'bg-[#2b2b2b] text-foreground' : 'text-foreground/70 hover:bg-white/[0.04]',
        drag && 'opacity-50',
      )}
      style={{ marginLeft: depth * 12, paddingLeft: 6 }}
    >
      <span className={cn('shrink-0', hidden ? 'text-muted-foreground/40' : 'text-muted-foreground/70')}>
        {GLYPH[glyph]}
      </span>
      {editing ? (
        <input
          autoFocus={autoFocus}
          defaultValue={name}
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => onRename?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') onCancelRename?.()
          }}
          className="min-w-0 flex-1 rounded bg-[#1c1c1c] px-1 text-[12px] text-foreground outline-none ring-1 ring-[#52525b]"
        />
      ) : (
        <span className={cn('min-w-0 flex-1 truncate', hidden && 'italic text-muted-foreground/50')}>{name}</span>
      )}
      <button
        type="button"
        aria-label={hidden ? `Show ${name}` : `Hide ${name}`}
        onClick={(e) => {
          e.stopPropagation()
          onToggleHidden?.()
        }}
        className={cn('shrink-0 cursor-pointer text-muted-foreground hover:text-foreground', actionOpacity)}
      >
        {hidden ? <EyeOff size={11} /> : <Eye size={11} />}
      </button>
      <button
        type="button"
        aria-label={locked ? `Unlock ${name}` : `Lock ${name}`}
        onClick={(e) => {
          e.stopPropagation()
          onToggleLocked?.()
        }}
        className={cn('shrink-0 cursor-pointer text-muted-foreground hover:text-foreground', actionOpacity)}
      >
        {locked ? <Lock size={11} /> : <LockOpen size={11} />}
      </button>
    </div>
  )
}

const LAYERS: Array<{ id: string; glyph: Glyph; depth: number }> = [
  { id: 'hero', glyph: 'frame', depth: 0 },
  { id: 'nav', glyph: 'frame', depth: 1 },
  { id: 'headline', glyph: 'text', depth: 1 },
  { id: 'button', glyph: 'rect', depth: 1 },
  { id: 'bg', glyph: 'image', depth: 0 },
  { id: 'dot', glyph: 'ellipse', depth: 0 },
]

function LayerTree() {
  const [selected, setSelected] = useState('headline')
  const [hidden, setHidden] = useState<string[]>([])
  const [locked, setLocked] = useState<string[]>(['bg'])
  const [editing, setEditing] = useState<string | null>(null)
  const [names, setNames] = useState<Record<string, string>>({
    hero: 'Hero',
    nav: 'Nav',
    headline: 'Headline — spring sale',
    button: 'Button',
    bg: 'Background',
    dot: 'Dot',
  })
  return (
    <div className="w-[240px] overflow-hidden rounded-lg border border-[#27272f] bg-[#1c1c1c]">
      <div className="flex h-9 items-center justify-between border-b border-[#27272f] px-3.5">
        <span className="text-[13px] font-semibold text-foreground/90">Layers</span>
        <span className="font-mono text-[10px] text-muted-foreground/50">{LAYERS.length}</span>
      </div>
      <div role="tree" aria-label="Layers" className="px-2 py-2">
        {LAYERS.map((l) => (
          <ItemRow
            key={l.id}
            name={names[l.id]}
            glyph={l.glyph}
            depth={l.depth}
            active={selected === l.id}
            hidden={hidden.includes(l.id)}
            locked={locked.includes(l.id)}
            editing={editing === l.id}
            autoFocus
            onSelect={() => setSelected(l.id)}
            onStartRename={() => setEditing(l.id)}
            onCancelRename={() => setEditing(null)}
            onRename={(value) => {
              const v = value.trim()
              if (v) setNames((n) => ({ ...n, [l.id]: v }))
              setEditing(null)
            }}
            onToggleHidden={() =>
              setHidden((v) => (v.includes(l.id) ? v.filter((x) => x !== l.id) : [...v, l.id]))
            }
            onToggleLocked={() =>
              setLocked((v) => (v.includes(l.id) ? v.filter((x) => x !== l.id) : [...v, l.id]))
            }
          />
        ))}
      </div>
    </div>
  )
}

function ItemPage() {
  return (
    <Page
      title="Item"
      lead="One row in the layers tree. The atom of the left panel."
      meta="26px · 12px indent · 4 states"
    >
      <Section title="States" note="hover · selected · hidden · drag">
        <Tiles
          min={240}
          items={[
            { label: 'rest', note: '26px', node: <ItemRow name="Headline" glyph="text" /> },
            { label: 'hover', note: 'white/4', node: <ItemRow name="Headline" glyph="text" revealActions /> },
            { label: 'selected', note: '#2b2b2b', node: <ItemRow name="Headline" glyph="text" active /> },
            { label: 'hidden', note: 'opacity 50', node: <ItemRow name="Headline" glyph="text" active hidden /> },
            {
              label: 'drag',
              note: 'opacity 50',
              node: (
                <div className="relative w-full">
                  <span className="absolute -top-0.5 left-0 right-0 h-0.5 rounded-full bg-[#f472b6]" />
                  <ItemRow name="Headline" glyph="text" drag />
                </div>
              ),
            },
            { label: 'rename', note: 'inline input', node: <ItemRow name="Headline" glyph="text" editing /> },
          ]}
        />
      </Section>

      <Section title="In the panel" note="click, rename, hide, lock">
        <Stage caption="Click to select, double-click to rename, Enter commits and Escape restores. Nested frames indent by 12px; eye and lock appear on the selected row.">
          <div className="flex flex-wrap items-start gap-6">
            <LayerTree />
            <div className="max-w-[280px] space-y-2 text-[12px] leading-relaxed text-[#9a9aa4]">
              <p>The tree is flattened for display: a frame and its children are adjacent rows, sorted by z-order.</p>
              <p>Selected rows keep their eye and lock visible. Every other row reveals them on hover.</p>
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'height', value: '26px', note: 'never grows' },
            { name: 'radius', value: '6px', note: 'row surface' },
            { name: 'padding', value: '6px left', note: 'plus 12px per depth' },
            { name: 'gap', value: '6px', note: 'glyph → name → actions' },
            { name: 'name', value: '12px', note: 'truncates' },
            { name: 'selected', value: '#2b2b2b', note: 'no pink' },
            { name: 'hover', value: 'white/4', note: '150ms' },
            { name: 'actions', value: '11px', note: 'eye then lock' },
          ]}
        />
      </Section>

      <Usage
        when="A layer inside a frame on the current page. The row is selection, visibility and lock in one 26px line; the canvas shows the rest."
        rules={[
          'Selection is the #2b2b2b fill, never a pink border.',
          'Double-click renames; Enter commits through a Rename command and Escape restores the old name.',
          'Eye and lock sit at the trailing edge, in that order, on every row.',
          'Hidden names go italic and 50% opacity; a locked layer keeps its name bright.',
          'Nest by 12px per level and never past the panel width.',
          'A drag shows the row at 50% opacity with a 2px drop line at the target.',
        ]}
        checks={[
          'Rows expose role=treeitem with aria-selected; frames expose aria-expanded.',
          'Eye and lock buttons have names that include the layer, not just Hide.',
          'Arrow keys move selection, Enter starts rename, and focus stays visible on the row.',
        ]}
        edges={[
          'A 200-character layer name truncates; the rename input scrolls instead of clipping.',
          'A frame dragged into its own child is refused without a drop line.',
          'A locked layer can still be selected and inspected; it cannot be moved.',
          'Undo after a rename restores the old name and keeps the row selected.',
        ]}
      />
    </Page>
  )
}

/* -------------------------------- Data list -------------------------------- */

function PageRow({
  name,
  active,
  editing,
  autoFocus,
  confirming,
  canDelete = true,
  revealDelete,
  onSelect,
  onStartRename,
  onRename,
  onCancelRename,
  onRequestDelete,
  onKeep,
  onConfirmDelete,
}: {
  name: string
  active?: boolean
  editing?: boolean
  autoFocus?: boolean
  confirming?: boolean
  canDelete?: boolean
  revealDelete?: boolean
  onSelect?: () => void
  onStartRename?: () => void
  onRename?: (value: string) => void
  onCancelRename?: () => void
  onRequestDelete?: () => void
  onKeep?: () => void
  onConfirmDelete?: () => void
}) {
  if (confirming) {
    return (
      <div className="flex h-[26px] items-center gap-1.5 rounded-md bg-[#2b1719] px-1.5 text-[11px] text-[#f2a0a0]">
        <span className="min-w-0 flex-1 truncate">Delete “{name}”?</span>
        <button type="button" onClick={onKeep} className="shrink-0 cursor-pointer rounded px-1 text-[11px] text-foreground/70 hover:bg-white/5">
          Keep
        </button>
        <button
          type="button"
          onClick={onConfirmDelete}
          className="shrink-0 cursor-pointer rounded px-1 text-[11px] font-medium text-[#f2a0a0] hover:bg-white/5"
        >
          Delete
        </button>
      </div>
    )
  }
  return (
    <div
      onClick={onSelect}
      className={cn(
        'group flex h-[26px] items-center gap-1.5 rounded-md px-1.5',
        active ? 'bg-[#2b2b2b] text-foreground' : 'text-foreground/80 hover:bg-white/[0.04]',
      )}
    >
      <File size={12} className="shrink-0 text-muted-foreground/70" />
      {editing ? (
        <input
          autoFocus={autoFocus}
          defaultValue={name}
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => onRename?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
            if (e.key === 'Escape') onCancelRename?.()
          }}
          className="min-w-0 flex-1 rounded bg-[#1c1c1c] px-1 text-[12px] font-medium text-foreground outline-none ring-1 ring-[#52525b]"
        />
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.()
          }}
          onDoubleClick={onStartRename}
          className="min-w-0 flex-1 cursor-pointer truncate text-left text-[12px] font-medium"
        >
          {name}
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          aria-label={`Delete ${name}`}
          onClick={(e) => {
            e.stopPropagation()
            onRequestDelete?.()
          }}
          className={cn(
            'shrink-0 cursor-pointer text-muted-foreground hover:text-foreground',
            revealDelete || active ? 'opacity-60' : 'opacity-0 group-hover:opacity-60',
          )}
        >
          <Minus size={12} />
        </button>
      )}
    </div>
  )
}

function EmptyPageRow({ onAdd }: { onAdd?: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex h-[26px] w-full cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-white/12 px-1.5 text-[11px] text-muted-foreground/60 transition-colors hover:border-white/20 hover:text-foreground"
    >
      <Plus size={11} />
      Add a page
    </button>
  )
}

function PagesListDemo() {
  const [pages, setPages] = useState<Array<{ id: string; name: string }>>([
    { id: 'home', name: 'Home' },
    { id: 'checkout', name: 'Checkout' },
    { id: 'icons', name: 'Icons' },
  ])
  const [active, setActive] = useState('home')
  const [editing, setEditing] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const nextId = useRef(4)

  const add = () => {
    const id = `page-${nextId.current}`
    const page = { id, name: `Page ${nextId.current}` }
    nextId.current += 1
    setPages((p) => [...p, page])
    setActive(id)
    setEditing(id)
  }
  const rename = (id: string, value: string) => {
    const v = value.trim()
    if (v) setPages((p) => p.map((x) => (x.id === id ? { ...x, name: v } : x)))
    setEditing(null)
  }
  const remove = (id: string) => {
    const rest = pages.filter((x) => x.id !== id)
    setPages(rest)
    setConfirming(null)
    if (active === id) setActive(rest[0]?.id ?? '')
  }

  return (
    <div className="w-[240px] overflow-hidden rounded-lg border border-[#27272f] bg-[#1c1c1c]">
      <div className="flex items-center gap-2 px-3.5 pb-1.5 pt-3">
        <span className="text-[13px] font-semibold text-foreground/90">Pages</span>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2b2b2b] px-1.5 text-[10.5px] font-medium text-[#b9b9c2]">
          {pages.length}
        </span>
        <button
          type="button"
          aria-label="New page"
          onClick={add}
          className="ml-auto cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <Plus size={13} />
        </button>
      </div>
      <div className="space-y-0.5 px-2.5 pb-3">
        {pages.map((p) => (
          <PageRow
            key={p.id}
            name={p.name}
            active={active === p.id}
            editing={editing === p.id}
            autoFocus
            confirming={confirming === p.id}
            canDelete={pages.length > 1}
            onSelect={() => setActive(p.id)}
            onStartRename={() => setEditing(p.id)}
            onCancelRename={() => setEditing(null)}
            onRename={(v) => rename(p.id, v)}
            onRequestDelete={() => setConfirming(p.id)}
            onKeep={() => setConfirming(null)}
            onConfirmDelete={() => remove(p.id)}
          />
        ))}
        {pages.length === 0 && <EmptyPageRow onAdd={add} />}
      </div>
    </div>
  )
}

function DataListPage() {
  return (
    <Page
      title="Data list"
      lead="The Pages list: switch, rename, delete. Rows are 26px and never bordered."
      meta="26px rows · header 24 · count + active"
    >
      <Section title="Pages" note="live">
        <Stage caption="Single click switches, double-click renames, minus asks first. The last page cannot be deleted, so the confirm never appears for it.">
          <PagesListDemo />
        </Stage>
      </Section>

      <Section title="States" note="row">
        <Tiles
          min={250}
          items={[
            { label: 'rest', note: '26px', node: <PageRow name="Checkout" /> },
            { label: 'active', note: '#2b2b2b', node: <PageRow name="Checkout" active revealDelete /> },
            { label: 'delete on hover', note: '12px glyph', node: <PageRow name="Checkout" revealDelete /> },
            { label: 'rename', note: 'inline input', node: <PageRow name="Checkout" editing /> },
            {
              label: 'confirm',
              note: 'in place',
              node: <PageRow name="Checkout" confirming onKeep={() => {}} onConfirmDelete={() => {}} />,
            },
            { label: 'empty slot', note: 'dashed', node: <EmptyPageRow /> },
          ]}
        />
      </Section>

      <Section title="Anatomy">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'row height', value: '26px', note: 'radius 6' },
            { name: 'row padding', value: '0 6px', note: 'gap 6px' },
            { name: 'header', value: '13px / 600', note: 'count + add' },
            { name: 'count', value: '20px pill', note: '10.5px / 500' },
            { name: 'page glyph', value: '12px', note: 'muted' },
            { name: 'active', value: '#2b2b2b', note: 'no dot, no pink' },
            { name: 'delete', value: '12px', note: 'hover or active only' },
          ]}
        />
      </Section>

      <Usage
        when="The page stack of one board, at the top of the left panel. Pages are top-level frames; switching one changes the canvas."
        rules={[
          'Pages keep their order. The list is moved, not sorted.',
          'Single click switches; double-click renames; Enter commits and Escape restores.',
          'Delete appears on hover and on the active row, and always asks first.',
          'The last page cannot be deleted. The affordance is absent, not disabled.',
          'The active page is a #2b2b2b fill. No dot and no pink.',
          'The count is the number of pages, not layers.',
        ]}
        checks={[
          'Rows are buttons in a list; the active page reports aria-current=page.',
          'Rename is reachable without a mouse: F2 opens it, Enter commits, Escape cancels.',
          'The confirm names the page and says the action can be undone.',
        ]}
        edges={[
          'An 80-character page name truncates in the row; the input scrolls instead of widening the panel.',
          'Renaming to empty restores the old name instead of creating a nameless page.',
          'Deleting the active page activates the next one down, then the one above.',
          'Undo after delete restores the page, its layers and its position in the stack.',
          'A slow double-click selects first; it must never delete.',
        ]}
      />
    </Page>
  )
}

/* --------------------------------- Truncate -------------------------------- */

function Truncated({
  text,
  width = 160,
  mode = 'end',
  lines = 2,
  tooltip = true,
}: {
  text: string
  width?: number
  mode?: 'end' | 'middle' | 'clamp'
  lines?: number
  tooltip?: boolean
}) {
  const head = mode === 'middle' ? text.slice(0, Math.max(8, Math.floor(text.length * 0.45))) : ''
  const tail = mode === 'middle' ? text.slice(-Math.max(6, Math.floor(text.length * 0.3))) : ''
  return (
    <span
      tabIndex={0}
      title={text}
      className="group/tt relative inline-flex max-w-full align-top outline-none"
      style={{ width }}
    >
      {mode === 'middle' ? (
        <span className="flex min-w-0 items-baseline text-[12px] text-foreground/85">
          <span className="min-w-0 truncate">{head}</span>
          <span className="shrink-0 text-muted-foreground/60">…</span>
          <span className="shrink-0">{tail}</span>
        </span>
      ) : mode === 'clamp' ? (
        <span className="line-clamp-2 block text-[12px] leading-snug text-foreground/85" style={{ WebkitLineClamp: lines }}>
          {text}
        </span>
      ) : (
        <span className="block truncate text-[12px] text-foreground/85">{text}</span>
      )}
      {tooltip && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-0 top-full z-20 mt-1.5 w-max max-w-[260px] rounded-md border border-[#27272f] bg-[#1a1a20] px-2 py-1 text-[11px] leading-snug text-foreground/85 opacity-0 shadow-xl shadow-black/40 transition-opacity duration-150 group-hover/tt:opacity-100 group-focus/tt:opacity-100"
        >
          {text}
        </span>
      )}
    </span>
  )
}

function TruncatePage() {
  return (
    <Page
      title="Truncate"
      lead="A value that does not fit. Ends for names, middles for paths."
      meta="160–220px · 1–2 lines · tooltip on focus"
    >
      <Section title="Modes" note="end · middle · clamp">
        <Tiles
          min={270}
          items={[
            {
              label: 'end ellipsis',
              note: '160px',
              node: <Truncated text="Checkout — empty cart illustration v3" width={160} />,
            },
            {
              label: 'middle ellipsis',
              note: '200px path',
              node: <Truncated text="petals/boards/rosewood/frames/hero-header" width={200} mode="middle" />,
            },
            {
              label: 'two-line clamp',
              note: '220px',
              node: (
                <Truncated
                  text="Frame with a clipped image fill, two shadows and a pattern overlay that needs to stay in the export"
                  width={220}
                  mode="clamp"
                />
              ),
            },
          ]}
        />
      </Section>

      <Section title="In place" note="hover or focus a row">
        <Stage
          pad={false}
          className="px-6 pb-24 pt-8"
          caption="The title attribute and the tooltip both carry the full value. Nothing under 160px is asked to truncate — the panel grows instead."
        >
          <div className="flex flex-wrap items-start gap-10">
            <div className="w-[240px] overflow-hidden rounded-lg border border-[#27272f] bg-[#1c1c1c]">
              <div className="border-b border-[#27272f] px-3.5 py-3 text-[13px] font-semibold text-foreground/90">Layers</div>
              <div className="space-y-0.5 px-2.5 py-2">
                {['Checkout — empty cart illustration v3', 'Headline — spring sale, second pass', 'Hero'].map((name, i) => (
                  <div
                    key={name}
                    className={cn(
                      'flex h-[26px] items-center gap-1.5 rounded-md px-1.5',
                      i === 0 ? 'bg-[#2b2b2b]' : 'hover:bg-white/[0.04]',
                    )}
                  >
                    <Type size={12} className="shrink-0 text-muted-foreground/70" />
                    <Truncated text={name} width={i === 2 ? 176 : 172} />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <p className="font-mono text-[10px] text-muted-foreground/50">middle</p>
              <Truncated text="petals/boards/rosewood/frames/hero-header" width={210} mode="middle" />
              <Truncated text="/Users/admin/Projects/iota-draw/public/petal-flower.svg" width={210} mode="middle" />
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy">
        <Rows
          head={['Case', 'Value', 'Note']}
          items={[
            { name: 'name', value: '160px', note: 'end ellipsis' },
            { name: 'path', value: '200–210px', note: 'middle, last segment kept' },
            { name: 'description', value: '220px', note: '2-line clamp' },
            { name: 'line height', value: '1.45', note: 'clamp keeps both lines' },
            { name: 'tooltip', value: '260px max', note: '150ms, hover and focus' },
            { name: 'full value', value: 'title + tooltip', note: 'never tooltip only' },
          ]}
        />
      </Section>

      <Usage
        when="A value that has a correct full form but no room: a layer name in a 240px panel, a path in a field, a description in a card. Truncation is a layout decision, not a content edit."
        rules={[
          'End ellipsis for names. Middle ellipsis for paths, URLs and ids where the last segment identifies the thing.',
          'Never truncate the only identifier without a title or a rename field nearby.',
          'One truncated line per row. A name and its meta never both truncate.',
          'Clamp body text at two lines; never clamp a name to save height.',
          'The full value lives in the title attribute and the tooltip, never only in the tooltip.',
          'Truncate at the layout width. Never hard-code an ellipsis into the string.',
        ]}
        checks={[
          'The truncated element is focusable and reveals the full value on focus, not only hover.',
          'A screen reader reads the full text; CSS ellipsis does not change the text node.',
          'The tooltip does not cover the row it describes and closes on Escape.',
        ]}
        edges={[
          'A 300-character name truncates in the row; the rename input still holds all of it.',
          'A path with one segment falls back to end ellipsis.',
          'At 200% zoom the truncation point moves; the tooltip caps at 260px.',
          'Touch has no hover, so the full value must also be in the rename field or a details view.',
        ]}
      />
    </Page>
  )
}

/* ------------------------------ Relative time ------------------------------ */

function relative(at: number, now: number) {
  const diff = Math.max(0, now - at)
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hr ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} ${d === 1 ? 'day' : 'days'} ago`
  return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function RelativeTime({ offset, prefix }: { offset: number; prefix?: string }) {
  const at = useRef(Date.now() - offset)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  return (
    <time
      dateTime={new Date(at.current).toISOString()}
      title={new Date(at.current).toLocaleString()}
      className="text-[11px] text-[#9a9aa4]"
    >
      {prefix ? `${prefix} ` : ''}
      {relative(at.current, now)}
    </time>
  )
}

function RelativeTimePage() {
  return (
    <Page
      title="Relative time"
      lead="How long ago it happened. Ticks every 30 seconds, never future."
      meta="30s tick · 6 thresholds · title = absolute"
    >
      <Section title="Formats" note="live">
        <Tiles
          min={160}
          items={[
            { label: 'just now', note: '< 60s', node: <RelativeTime offset={20_000} /> },
            { label: 'minutes', note: '2 min', node: <RelativeTime offset={125_000} /> },
            { label: 'days', note: '3 days', node: <RelativeTime offset={3 * 86_400_000} /> },
            { label: 'with prefix', note: 'Edited', node: <RelativeTime offset={125_000} prefix="Edited" /> },
          ]}
        />
      </Section>

      <Section title="In place" note="version history">
        <Stage caption="The title attribute holds 21 Oct 2026, 09:14 — the browser shows it on hover. A 30s tick moves 2 min ago to 3 min ago without a reload.">
          <div className="flex flex-wrap items-start gap-6">
            <div className="w-[280px] overflow-hidden rounded-lg border border-[#27272f] bg-[#1c1c1c]">
              <div className="border-b border-[#27272f] px-3.5 py-3 text-[13px] font-semibold text-foreground/90">
                Version history
              </div>
              <div className="divide-y divide-[#27272f]">
                {[
                  ['Autosave', 20_000],
                  ['Renamed “Hero”', 125_000],
                  ['Duplicated board', 3 * 86_400_000],
                ].map(([label, offset]) => (
                  <div key={String(label)} className="flex items-baseline justify-between gap-3 px-3.5 py-2">
                    <span className="min-w-0 truncate text-[12px] text-foreground/80">{label}</span>
                    <RelativeTime offset={Number(offset)} />
                  </div>
                ))}
              </div>
            </div>
            <div className="w-[260px] rounded-[20px] border border-[#27272f] bg-[#141418] p-3">
              <p className="truncate text-[14px] font-semibold text-foreground">Rosewood</p>
              <p className="mt-1">
                <RelativeTime offset={125_000} prefix="Edited" />
              </p>
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Thresholds">
        <Rows
          head={['Elapsed', 'Renders', 'Note']}
          items={[
            { name: '0–59s', value: 'just now', note: 'also for clock skew' },
            { name: '60s–59m', value: 'N min ago', note: 'no seconds' },
            { name: '1–23h', value: 'N hr ago', note: 'one unit' },
            { name: '1–6d', value: 'N days ago', note: '1 day, not yesterday' },
            { name: '7d+', value: '12 Mar', note: 'absolute date' },
            { name: 'tick', value: '30s', note: 'not 1s' },
            { name: 'title', value: 'absolute local', note: 'always' },
          ]}
        />
      </Section>

      <Usage
        when="Metadata that ages while the screen is open: project cards, version history, an autosave row. Not for a timestamp the user must compare exactly."
        rules={[
          'Relative while recent, absolute after seven days. Never mix both styles in one column.',
          'Prefix the verb when the time is not obviously an edit: Edited, Saved, Renamed.',
          'The title attribute carries the absolute local time on every value.',
          'Tick every 30s, not every second. Nothing here needs second precision.',
          'Never render a future time; clock skew clamps to just now.',
          'Do not use relative time for billing, audit or legal values.',
        ]}
        checks={[
          'The time element carries a machine-readable dateTime.',
          'A screen reader hears one value, relative or absolute, not both twice.',
          'The 30s tick does not move focus or re-announce through a live region.',
        ]}
        edges={[
          'A laptop asleep for a day updates on the first tick after wake.',
          'Clock skew of two minutes shows just now, not in 2 minutes.',
          'A locale without a short month falls back to a numeric date.',
          'A page left open past midnight moves 23 hr ago to 1 day ago on the next tick.',
        ]}
      />
    </Page>
  )
}

export const displayPages: Record<string, ComponentType> = {
  'components/kbd': KbdPage,
  'components/card': CardPage,
  'components/panel': PanelPage,
  'components/badge': BadgePage,
  'components/avatar': AvatarPage,
  'components/item': ItemPage,
  'components/data-list': DataListPage,
  'components/truncate': TruncatePage,
  'components/relative-time': RelativeTimePage,
}
