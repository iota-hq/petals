import { useState, type ComponentType, type ReactNode } from 'react'
import { motion } from 'motion/react'
import {
  AlignLeft,
  Ban,
  Blend,
  Check,
  Circle,
  Copy,
  Download,
  Eye,
  Frame,
  Grid2x2,
  Image as ImageIcon,
  Layers,
  Lock,
  Minus,
  MousePointer2,
  Palette,
  PenTool,
  Plus,
  Search,
  Settings,
  Square,
  Type,
  Undo2,
  Redo2,
  Zap,
} from 'lucide-react'
import { Page, Section, Stage, Tiles, Rows, Note, Snippet } from '../Doc'
import { Btn, Field, Kbd, LayerRow, PanelFrame, PanelSection, SelectField, Swatch } from '../bits'

/* -------------------------------- shared ---------------------------------- */

function Rules({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((r) => (
        <li key={r} className="flex gap-2.5 text-[12.5px] leading-relaxed text-[#b9b9c2]">
          <span className="mt-[8px] h-px w-2.5 shrink-0 bg-muted-foreground/35" />
          <span>{r}</span>
        </li>
      ))}
    </ul>
  )
}

function Surface({ hex, name, role }: { hex: string; name: string; role: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[#0b0b0d]">
      <div className="h-[74px] w-full border-b border-border/80" style={{ background: hex }} />
      <div className="px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[12px] font-medium text-foreground/85">{name}</span>
          <span className="font-mono text-[10px] uppercase text-muted-foreground/55">{hex}</span>
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/65">{role}</p>
      </div>
    </div>
  )
}

/* --------------------------------- Color ---------------------------------- */

function ColorPage() {
  return (
    <Page
      title="Color"
      lead="Ink and paper for the chrome, and exactly one pink. Colour in the document belongs to the document."
      meta="7 surfaces · 4 text alphas · 1 signal"
    >
      <Section title="Surfaces" note="dark only">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <Surface hex="#000000" name="Page" role="Marketing pages, docs, the editor behind the canvas" />
          <Surface hex="#101013" name="App shell" role="Window chrome, sidebar behind panels" />
          <Surface hex="#1c1c1c" name="Panel" role="Left pages/layers, right properties" />
          <Surface hex="#141418" name="Card" role="Project cards, history entries, docs cards" />
          <Surface hex="#1a1a20" name="Popover" role="Menus, tooltips, dialogs above the panel" />
          <Surface hex="#2b2b2b" name="Field" role="Inputs, chips, selected layer rows" />
          <Surface hex="#424242" name="Canvas" role="Default board background, under the artwork" />
          <Surface hex="#27272f" name="Hairline" role="Every border and divider in the chrome" />
          <Surface hex="#0b0b0d" name="Tile" role="Docs demo tiles and code surfaces" />
        </div>
      </Section>

      <Section title="Text" note="alphas on black">
        <div className="overflow-hidden rounded-xl border border-border bg-[#0b0b0d]">
          {[
            ['100%', '#ececf1', 'foreground — headings, values, the thing being said'],
            ['85%', 'rgba(236,236,241,0.85)', 'panel titles, labels beside a value'],
            ['70%', '#9a9aa4', 'secondary copy, descriptions, row names'],
            ['55%', 'rgba(236,236,241,0.55)', 'metadata, captions, trailing counts'],
            ['35%', 'rgba(236,236,241,0.35)', 'disabled, placeholders, hairlines of text'],
          ].map(([alpha, color, use]) => (
            <div key={alpha} className="flex items-center gap-4 border-b border-border/60 px-4 py-3 last:border-b-0">
              <span className="w-10 shrink-0 font-mono text-[10px] text-muted-foreground/50">{alpha}</span>
              <span className="min-w-0 flex-1 truncate text-[14px]" style={{ color }}>
                Refunds over $500 need a second approval
              </span>
              <span className="hidden w-[210px] shrink-0 text-right text-[10.5px] text-muted-foreground/55 sm:block">
                {use}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Signal" note="where pink is allowed">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-[#0b0b0d] p-3">
            <div className="flex h-16 items-center justify-center rounded-lg" style={{ background: '#e063bb' }}>
              <img src="/petal-flower.svg" alt="" className="size-8" />
            </div>
            <div className="mt-2.5 text-[12px] font-medium">Brand</div>
            <div className="font-mono text-[10px] uppercase text-muted-foreground/55">#E063BB</div>
            <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground/65">Mark, OG art, card logo on hover.</p>
          </div>
          <div className="rounded-xl border border-border bg-[#0b0b0d] p-3">
            <div className="flex h-16 items-center justify-center rounded-lg" style={{ background: '#f472b6' }}>
              <span className="text-[11px] font-semibold text-[#2b0a1c]">Add</span>
            </div>
            <div className="mt-2.5 text-[12px] font-medium">Primary</div>
            <div className="font-mono text-[10px] uppercase text-muted-foreground/55">#F472B6</div>
            <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground/65">Selection, primary action, cursor.</p>
          </div>
          <div className="rounded-xl border border-border bg-[#0b0b0d] p-3">
            <div className="flex h-16 items-center justify-center rounded-lg border border-[#f472b6] bg-[#f472b6]/15">
              <span className="text-[10.5px] text-[#f472b6]">selected</span>
            </div>
            <div className="mt-2.5 text-[12px] font-medium">Selection tint</div>
            <div className="font-mono text-[10px] uppercase text-muted-foreground/55">#F472B6 / 15%</div>
            <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground/65">Row highlight, reorder bars, handles.</p>
          </div>
          <div className="rounded-xl border border-border bg-[#0b0b0d] p-3">
            <div className="flex h-16 items-center justify-center rounded-lg" style={{ background: '#ef4444' }}>
              <span className="text-[11px] font-semibold text-white">Delete</span>
            </div>
            <div className="mt-2.5 text-[12px] font-medium">Danger</div>
            <div className="font-mono text-[10px] uppercase text-muted-foreground/55">#EF4444</div>
            <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground/65">Destructive confirmation only.</p>
          </div>
        </div>
      </Section>

      <Section title="In use" note="two panels, one selection">
        <Stage caption="Pink appears twice: the selected layer and the one action that adds to the board.">
          <div className="flex flex-wrap gap-3">
            <div className="w-[210px] overflow-hidden rounded-lg border border-border bg-[#1c1c1c]">
              <div className="flex h-8 items-center gap-2 border-b border-border px-3 text-[11.5px] font-semibold text-foreground/85">
                <Layers size={11} className="text-muted-foreground/60" /> Layers
              </div>
              <div className="p-1.5">
                <LayerRow icon={<Frame size={10} />} name="Frame 1" />
                <LayerRow icon={<Square size={10} />} name="Card" active />
                <LayerRow icon={<Type size={10} />} name="Title" depth={1} />
                <LayerRow icon={<ImageIcon size={10} />} name="Petals logo" depth={1} />
              </div>
            </div>
            <div className="w-[210px] overflow-hidden rounded-lg border border-border bg-[#1c1c1c]">
              <div className="flex h-8 items-center gap-2 border-b border-border px-3 text-[11.5px] font-semibold text-foreground/85">
                <Square size={11} className="text-muted-foreground/60" /> Card
              </div>
              <div className="space-y-2 p-2.5">
                <div className="flex items-center gap-1.5">
                  <Swatch color="#e063bb" size={18} />
                  <span className="font-mono text-[10px] uppercase text-foreground/80">E063BB</span>
                </div>
                <Btn variant="primary" size="sm" className="w-full">Add to canvas</Btn>
                <Btn variant="outline" size="sm" className="w-full !border-white/10">Duplicate</Btn>
              </div>
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Contrast" note="WCAG AA, dark values">
        <Rows
          head={['Pair', 'Ratio', 'Holds']}
          items={[
            { name: 'text 100 on page', value: '17.8 : 1', note: 'AA' },
            { name: 'text 100 on card', value: '15.6 : 1', note: 'AA' },
            { name: 'text 70 on page', value: '7.5 : 1', note: 'AA' },
            { name: 'text 70 on panel', value: '6.1 : 1', note: 'AA' },
            { name: 'text 70 on field', value: '5.1 : 1', note: 'AA' },
            { name: 'primary on page', value: '7.9 : 1', note: 'AA' },
            { name: 'button ink on primary', value: '6.8 : 1', note: 'AA' },
            { name: 'brand on page', value: '6.7 : 1', note: 'AA' },
            { name: 'danger on page', value: '5.6 : 1', note: 'AA' },
          ]}
        />
        <div className="mt-4">
          <Note>
            Text 55% and 35% are metadata and disabled states only — never a sentence someone has to
            read. The focus ring (#52525b on #2b2b2b) sits at 1.8:1, under the 3:1 non-text minimum;
            raising <code className="font-mono text-[11px]">--ring</code> is a known fix for the next pass.
          </Note>
        </div>
      </Section>

      <Section title="Tokens" note="index.css">
        <Rows
          head={['Token', 'Value', 'Use']}
          items={[
            { name: '--background', value: '#000000 / #101013', note: 'page · app shell' },
            { name: '--card', value: '#141418', note: 'cards, history' },
            { name: '--popover', value: '#1a1a20', note: 'menus, tooltips' },
            { name: '--primary', value: '#f472b6', note: 'selection, action' },
            { name: '--primary-foreground', value: '#2b0a1c', note: 'ink on pink' },
            { name: '--foreground', value: '#ececf1', note: 'text 100' },
            { name: '--muted-foreground', value: '#9a9aa4', note: 'text 70' },
            { name: '--border', value: '#27272f', note: 'every hairline' },
            { name: '--ring', value: '#52525b', note: 'focus (see note)' },
            { name: '--destructive', value: '#ef4444', note: 'delete only' },
          ]}
        />
      </Section>
    </Page>
  )
}

/* ------------------------------- Typography -------------------------------- */

const SCALE: Array<{ name: string; sample: string; cls: string; spec: string; use: string }> = [
  { name: 'Display', sample: 'Design, prototype, ship,', cls: 'text-[34px] font-normal leading-[1.18] tracking-[-0.02em]', spec: '34–38 / 400 / −0.02', use: 'Landing hero only' },
  { name: 'Page title', sample: 'Projects', cls: 'text-[30px] font-medium leading-[1.1] tracking-[-0.02em]', spec: '30 / 500 / −0.02', use: 'Page and docs titles' },
  { name: 'Section', sample: 'Appearance', cls: 'text-[20px] font-medium leading-[1.3] tracking-[-0.01em]', spec: '20 / 500 / −0.01', use: 'Marketing sections' },
  { name: 'Panel', sample: 'Position & size', cls: 'text-[13px] font-semibold leading-[1.4] tracking-[0.01em]', spec: '13 / 600 / +0.01', use: 'Panel sections, layer headers' },
  { name: 'Body', sample: 'Everything stays editable after export.', cls: 'text-[13px] font-normal leading-[1.55]', spec: '13 / 400 / 0', use: 'Default body, fields, copy' },
  { name: 'Row', sample: 'Petals logo', cls: 'text-[12px] font-normal leading-[1.4]', spec: '12 / 400 / 0', use: 'Layer rows, menus, data' },
  { name: 'Meta', sample: 'Edited 2 min ago', cls: 'text-[11px] font-normal leading-[1.4]', spec: '11 / 400 / 0', use: 'Captions, counts, timestamps' },
  { name: 'Micro', sample: 'Gradient direction', cls: 'text-[10px] font-normal leading-[1.4] text-muted-foreground/70', spec: '10 / 400 / 0', use: 'Popover headers only' },
]

function TypographyPage() {
  return (
    <Page
      title="Typography"
      lead="Geist for everything, Geist Mono for values. Two weights, one tracking rule per size, no exceptions."
      meta="Geist Variable · Geist Mono Variable · local files"
    >
      <Section title="Scale" note="size / weight / tracking">
        <div className="overflow-hidden rounded-xl border border-border bg-[#0b0b0d]">
          {SCALE.map((s) => (
            <div key={s.name} className="grid grid-cols-[88px_1fr] items-center gap-4 border-b border-border/60 px-4 py-3.5 last:border-b-0 sm:grid-cols-[88px_1fr_150px]">
              <span className="font-mono text-[10px] text-muted-foreground/55">{s.name}</span>
              <div className="min-w-0">
                <div className={'truncate text-foreground ' + s.cls}>{s.sample}</div>
                <div className="mt-1 font-mono text-[9.5px] text-muted-foreground/40 sm:hidden">{s.spec}</div>
              </div>
              <div className="hidden text-right sm:block">
                <div className="font-mono text-[10px] text-muted-foreground/60">{s.spec}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground/40">{s.use}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Families" note="two files, no network">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-[#0b0b0d] p-4">
            <div className="text-[11px] text-muted-foreground/60">Sans · Geist Variable</div>
            <div className="mt-2 text-[30px] font-medium leading-none tracking-[-0.02em]">Aa Bb Cc</div>
            <div className="mt-2 text-[26px] leading-none">0123456789</div>
            <div className="mt-3 flex gap-4 text-[12px] text-muted-foreground/70">
              <span className="font-normal">400 Regular</span>
              <span className="font-medium">500 Medium</span>
              <span className="font-semibold">600 Semibold</span>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground/60">
              Everything: UI, prose, headings, document text. No italics in chrome.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-[#0b0b0d] p-4">
            <div className="text-[11px] text-muted-foreground/60">Mono · Geist Mono Variable</div>
            <div className="mt-2 font-mono text-[24px] leading-none tracking-[-0.01em]">#F472B6</div>
            <div className="mt-2 font-mono text-[12px] leading-relaxed text-muted-foreground/70">
              X 140 · Y 72 · W 236 · H 148
            </div>
            <div className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground/60">
              Hex, token names, ids, sizes and code. Never a sentence. Numerals are tabular where they
              change in place.
            </div>
          </div>
        </div>
      </Section>

      <Section title="In use" note="one panel, four steps">
        <Stage caption="Panel title 13/600, row 12/400, field value 13/500 tabular, hex in mono 11.">
          <div className="flex flex-wrap gap-3">
            <PanelFrame title="Fill" width={230}>
              <div className="space-y-2 p-2.5">
                <div className="flex items-center gap-1.5">
                  <Swatch color="#e063bb" size={20} />
                  <span className="font-mono text-[11px] uppercase text-foreground/85">E063BB</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground/55">100%</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Field label="X" value="140" />
                  <Field label="Y" value="72" />
                  <Field label="W" value="236" />
                  <Field label="H" value="148" />
                </div>
              </div>
            </PanelFrame>
            <div className="min-w-[210px] flex-1 rounded-lg border border-border bg-[#1c1c1c] p-3">
              <div className="text-[10px] text-muted-foreground/60">Micro header</div>
              <div className="mt-1 text-[13px] font-semibold tracking-[0.01em] text-foreground/90">Position &amp; size</div>
              <div className="mt-2 text-[12px] text-foreground/75">Row label — layers, pages, menus</div>
              <div className="mt-1 text-[11px] text-muted-foreground/60">Meta — edited 2 min ago</div>
              <div className="mt-3 text-[13px] leading-relaxed text-[#b9b9c2]">
                Body copy stays at 13px. A panel does not need a 15px paragraph to be readable; it needs
                a tighter measure.
              </div>
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Rules">
        <Rules
          items={[
            'Sentence case everywhere. No uppercase labels, no small caps, no all-caps section heads.',
            'Two weights per surface: 400 for content, 500/600 for the one thing that names it.',
            'Tracking goes negative only above 20px. Panel labels keep +0.01em.',
            'Numbers that can change are tabular and usually mono: sizes, coordinates, percentages, hex.',
            'One ellipsis character (…) and one en dash (–); no double hyphens, no three dots.',
            'Long text is truncated, not wrapped, inside rows and fields. Body copy wraps at 62–68ch.',
            'No justified text, no letter-spacing on body, no text shadows.',
          ]}
        />
      </Section>
    </Page>
  )
}

/* ---------------------------------- Space ---------------------------------- */

const SPACE = [
  { px: 2, name: '0.5', use: 'Hairline gaps inside a chip' },
  { px: 4, name: '1', use: 'Icon → label, tight stacks' },
  { px: 6, name: '1.5', use: 'Panel row gap, field gap, tile gap' },
  { px: 8, name: '2', use: 'Row padding, button gap' },
  { px: 12, name: '3', use: 'Panel body padding, card insets' },
  { px: 14, name: '3.5', use: 'Panel section horizontal padding' },
  { px: 16, name: '4', use: 'Card padding, page gutter (mobile)' },
  { px: 24, name: '6', use: 'Page gutter, section gaps' },
  { px: 32, name: '8', use: 'Docs section spacing' },
  { px: 48, name: '12', use: 'Marketing block spacing' },
  { px: 96, name: '24', use: 'Landing hero top' },
]

function SpacePage() {
  return (
    <Page
      title="Space"
      lead="A 4px base with a 2px step where the panel is tight. Space is the only thing separating sections — there are no boxes inside boxes."
      meta="4px base · 2px tight step · 11 steps"
    >
      <Section title="Scale" note="px">
        <div className="overflow-hidden rounded-xl border border-border bg-[#0b0b0d]">
          {SPACE.map((s) => (
            <div key={s.name} className="flex items-center gap-4 border-b border-border/60 px-4 py-2.5 last:border-b-0">
              <span className="w-9 shrink-0 font-mono text-[10px] text-muted-foreground/55">{s.name}</span>
              <span className="w-9 shrink-0 font-mono text-[10px] text-foreground/60">{s.px}</span>
              <span className="h-2 shrink-0 rounded-sm bg-[#f472b6]/35" style={{ width: s.px * 2 }} />
              <span className="min-w-0 flex-1 text-right text-[10.5px] text-muted-foreground/60">{s.use}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Panel rhythm" note="the densest surface">
        <div className="grid gap-3 sm:grid-cols-[240px_1fr]">
          <PanelFrame title="Card">
            <PanelSection title="Fill">
              <div className="flex gap-1.5">
                <Swatch color="#f472b6" size={24} />
                <Swatch color="#e063bb" size={24} />
                <Swatch color="#2b2b2b" size={24} />
              </div>
            </PanelSection>
            <PanelSection title="Appearance">
              <div className="grid grid-cols-2 gap-1.5">
                <Field label="X" value="140" />
                <Field label="Y" value="72" />
                <Field label="W" value="236" />
                <Field label="H" value="148" />
              </div>
            </PanelSection>
          </PanelFrame>
          <Rows
            head={['Part', 'Value', 'Note']}
            items={[
              { name: 'section padding', value: '14px / 12px', note: 'x / y' },
              { name: 'section gap', value: '1px hairline', note: 'no margin' },
              { name: 'content gap', value: '6px', note: 'space-y-1.5' },
              { name: 'field height', value: '28px', note: 'compact 26' },
              { name: 'field gap', value: '6px', note: 'between inputs' },
              { name: 'row height', value: '26px', note: 'layers and pages' },
              { name: 'panel width', value: '240px', note: 'both sides' },
            ]}
          />
        </div>
      </Section>

      <Section title="Layout" note="page level">
        <Rows
          head={['Surface', 'Measure', 'Note']}
          items={[
            { name: 'docs article', value: '760px', note: 'one column' },
            { name: 'docs sidebar', value: '236px', note: '+ 190px toc' },
            { name: 'marketing', value: 'max-w-5xl', note: '72rem, px-6' },
            { name: 'projects', value: 'max-w-6xl', note: 'px-6, pt-14' },
            { name: 'editor panels', value: '240px', note: 'hidden under lg' },
            { name: 'card grid', value: 'minmax(220px, 1fr)', note: 'gap 16' },
          ]}
        />
        <div className="mt-4">
          <Note>
            When in doubt, take the next step down. A panel that breathes at 14px does not need 18px;
            it needs a hairline and a smaller label.
          </Note>
        </div>
      </Section>
    </Page>
  )
}

/* --------------------------------- Radius ---------------------------------- */

function RadiusPage() {
  const radii = [
    { px: 4, cls: 'rounded', name: 'Small', use: 'Colour swatches, stop handles' },
    { px: 6, cls: 'rounded-md', name: 'Control', use: 'Fields, buttons, menus, panel popovers' },
    { px: 8, cls: 'rounded-lg', name: 'Surface', use: 'Toolbar popovers, code blocks, demo tiles' },
    { px: 12, cls: 'rounded-xl', name: 'Card', use: 'Docs cards, video card, panels in docs' },
    { px: 16, cls: 'rounded-2xl', name: 'Large', use: 'Marketing media, dialogs' },
    { px: 20, cls: 'rounded-[20px]', name: 'Project', use: 'Project cards on /projects' },
    { px: 999, cls: 'rounded-full', name: 'Pill', use: 'Toolbar, page pills, avatars, badges' },
  ]
  return (
    <Page
      title="Radius"
      lead="Six steps by role, plus the pill. Controls are 6px forever; the toolbar is the one thing that never follows."
      meta="4 · 6 · 8 · 12 · 16 · 20 · full"
    >
      <Section title="Steps" note="px">
        <Tiles
          min={150}
          items={radii.map((r) => ({
            label: r.name,
            note: `${r.px}px`,
            node: (
              <div className="flex flex-col items-center gap-2">
                <span className={r.cls + ' size-14 border border-white/15 bg-[#232329]'} />
                <span className="text-[10px] text-muted-foreground/55">{r.use.split(',')[0]}</span>
              </div>
            ),
          }))}
        />
      </Section>

      <Section title="By role" note="never improvise">
        <Rows
          head={['Element', 'Radius', 'Note']}
          items={[
            { name: 'field / button / chip', value: '6px', note: 'rounded-md' },
            { name: 'panel popover', value: '6px', note: 'anchored to a field' },
            { name: 'menu / tooltip', value: '6–8px', note: 'popover surface' },
            { name: 'docs tile / code', value: '8–12px', note: 'reading surfaces' },
            { name: 'project card', value: '20px', note: 'one large radius' },
            { name: 'toolbar', value: '9999px', note: 'never changes with panels' },
            { name: 'avatar / badge', value: '9999px', note: 'or 6px when it is a logo tile' },
          ]}
        />
      </Section>

      <Section title="Nesting">
        <Stage caption="Inner radius = outer radius − padding. 6px fields inside a 12px card stay 6px; a 20px card uses 14px media inside a 6px inset.">
          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-xl border border-white/12 bg-[#141418] p-2">
              <div className="rounded-md bg-[#2b2b2b] px-4 py-2 text-[11px] text-foreground/75">6 inside 12</div>
            </div>
            <div className="rounded-[20px] border border-white/12 bg-[#141418] p-2">
              <div className="rounded-[14px] bg-[#232329] px-5 py-3 text-[11px] text-foreground/75">14 inside 20</div>
            </div>
            <div className="rounded-full border border-white/12 bg-[#141418] p-1">
              <div className="rounded-full bg-[#2b2b2b] px-4 py-1.5 text-[11px] text-foreground/75">pill in pill</div>
            </div>
          </div>
        </Stage>
        <div className="mt-4">
          <Note>
            Fields never become pills because a panel is tall, and cards never borrow the toolbar's
            full radius. A radius describes the surface, not the mood.
          </Note>
        </div>
      </Section>
    </Page>
  )
}

/* ---------------------------- Borders and lines ---------------------------- */

function BordersPage() {
  return (
    <Page
      title="Borders and lines"
      lead="One hairline does the separating; everything else is space. There are no double borders and no 2px neutrals."
      meta="1px #27272f · 1.5px selection · 2px focus"
    >
      <Section title="Weights" note="px">
        <div className="grid gap-2.5 sm:grid-cols-3">
          {[
            { label: 'Hairline', spec: '1px · #27272f', width: 1, color: '#27272f' },
            { label: 'Selection', spec: '1.5px · #f472b6', width: 1.5, color: '#f472b6' },
            { label: 'Focus', spec: '2px · #52525b', width: 2, color: '#52525b' },
          ].map((l) => (
            <div key={l.label} className="rounded-xl border border-border bg-[#0b0b0d] p-4">
              <div className="flex h-16 items-center justify-center">
                <span className="h-10 w-full rounded-md border" style={{ borderWidth: l.width, borderColor: l.color }} />
              </div>
              <div className="mt-2 text-[12px] font-medium">{l.label}</div>
              <div className="font-mono text-[10px] text-muted-foreground/55">{l.spec}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="In use" note="panel · selection · focus">
        <Stage caption="Hairlines separate sections, a pink outline marks the document selection, a neutral ring marks focus. They never swap jobs.">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-[220px] overflow-hidden rounded-lg border border-border bg-[#1c1c1c]">
              <div className="flex h-8 items-center border-b border-border px-3 text-[11.5px] font-semibold text-foreground/85">
                Appearance
              </div>
              <div className="space-y-2 p-2.5">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2 text-[11px] text-foreground/70">
                  <span className="flex-1">Opacity</span>
                  <span className="font-mono text-[10px]">100%</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-foreground/70">
                  <span className="flex-1">Blend</span>
                  <span className="font-mono text-[10px]">Normal</span>
                </div>
              </div>
            </div>
            <div className="rounded-md border-[1.5px] border-[#f472b6] p-0.5">
              <div className="flex h-20 w-28 items-center justify-center rounded bg-[#232329] text-[10px] text-foreground/70">
                selected
              </div>
            </div>
            <div className="flex h-8 items-center rounded-md bg-[#2b2b2b] px-3 text-[12px] ring-2 ring-[#52525b]">
              140
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Rules">
        <Rules
          items={[
            'A divider is a hairline, never a 1px box with its own radius.',
            'One border per surface. If it needs a shadow to separate, it is floating, not docked.',
            'Focus is a 2px neutral ring outside the field; it never uses pink and never shifts layout.',
            'Selection on the canvas is pink, 1.5px, with 4px square handles. Selection in a list is a fill, not an outline.',
            'Marketing pages use white/10 hairlines on black; the editor uses #27272f on panels. Do not mix them in one surface.',
            'Dashed borders exist for two things only: an empty add slot, and a spec marker.',
          ]}
        />
      </Section>
    </Page>
  )
}

/* -------------------------------- Elevation -------------------------------- */

function ElevationPage() {
  return (
    <Page
      title="Elevation"
      lead="Docked surfaces are flat. Only what floats over the canvas casts a shadow, and it never goes further than two levels."
      meta="4 levels · 1 scrim · no coloured shadows"
    >
      <Section title="Levels" note="shadow stack">
        <div className="flex flex-col gap-2.5">
          {[
            { name: '0 · Flat', spec: 'none', use: 'Panels, cards, fields, page surfaces', node: (
              <div className="flex h-16 w-full items-center justify-center rounded-md border border-border bg-[#1c1c1c] text-[10px] text-muted-foreground/60">panel</div>
            ) },
            { name: '1 · Floating', spec: '0 12px 40px black/50 + 1px border', use: 'Menus, popovers, tooltips', node: (
              <div className="flex h-16 w-full items-center justify-center rounded-md border border-border bg-[#1a1a20] text-[10px] text-muted-foreground/60 shadow-2xl shadow-black/50">popover</div>
            ) },
            { name: '2 · Bar', spec: '0 20px 50px black/50 + ring', use: 'The canvas toolbar, bulk bar', node: (
              <div className="flex h-10 w-full items-center justify-center rounded-full bg-[#232329] text-[10px] text-muted-foreground/60 shadow-2xl shadow-black/50 ring-1 ring-white/[0.06]">toolbar pill</div>
            ) },
            { name: '3 · Modal', spec: 'scrim black/70 + blur 2px + shadow', use: 'Dialog, sheet over the canvas', node: (
              <div className="flex h-16 w-full items-center justify-center rounded-md border border-border bg-[#141418] text-[10px] text-muted-foreground/60 shadow-2xl shadow-black/60">dialog</div>
            ) },
          ].map((l) => (
            <div key={l.name} className="grid gap-3 rounded-xl border border-border bg-[#0b0b0d] p-3 sm:grid-cols-[1fr_180px_200px] sm:items-center">
              <div className="rounded-md bg-[#151519] p-3">{l.node}</div>
              <div>
                <div className="text-[12px] font-medium text-foreground/85">{l.name}</div>
                <div className="mt-0.5 text-[10.5px] text-muted-foreground/55">{l.use}</div>
              </div>
              <div className="font-mono text-[10px] leading-relaxed text-muted-foreground/55">{l.spec}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="In use" note="one popover over one panel">
        <Stage caption="The panel stays flat; the menu it opens floats. Nothing else on screen moves.">
          <div className="flex flex-wrap items-start gap-4">
            <PanelFrame title="Fill" width={220}>
              <div className="space-y-2 p-2.5">
                <SelectField value="Gradient" state="open" />
                <div className="h-5 rounded bg-gradient-to-r from-[#f472b6] to-white" />
              </div>
            </PanelFrame>
            <div className="w-[192px] rounded-md border border-border bg-[#1a1a20] py-1.5 shadow-2xl shadow-black/60">
              <div className="px-2.5 pb-1 pt-0.5 text-[10px] text-muted-foreground/60">Gradient direction</div>
              {['Linear 90°', 'Radial', 'Conic'].map((d, i) => (
                <div key={d} className={'flex h-7 items-center gap-2 px-2.5 text-[11.5px] ' + (i === 0 ? 'bg-[#1e1e25] text-foreground' : 'text-foreground/70')}>
                  <span className="size-2.5 rounded-full border border-muted-foreground/60" />
                  {d}
                </div>
              ))}
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Rules">
        <Rules
          items={[
            'Docked panels never cast shadows. If it has a shadow, it is floating and must dismiss.',
            'One floating surface at a time. A popover does not open a popover; it replaces it.',
            'No coloured shadows, no glow, no inner glow on chrome.',
            'The scrim is black/70 with a 2px blur; a sheet that docks beside the canvas needs no scrim.',
            'A toolbar shadow is stronger than a menu shadow because it sits over artwork.',
            'Elevation never animates on hover — only on open and close, 180–220ms.',
          ]}
        />
      </Section>
    </Page>
  )
}

/* --------------------------------- Motion ---------------------------------- */

function MotionPage() {
  const [n, setN] = useState(0)
  return (
    <Page
      title="Motion"
      lead="Motion explains where a surface came from. One easing, three durations, no bounce."
      meta="cubic-bezier(0.22, 1, 0.36, 1) · 150 / 220 / 500ms"
    >
      <Section title="Timing" note="ms">
        <Rows
          head={['Moment', 'Duration', 'Easing']}
          items={[
            { name: 'hover colour', value: '150ms', note: 'ease-out' },
            { name: 'field / chip press', value: '120ms', note: 'ease-out' },
            { name: 'popover, menu, tooltip', value: '180ms', note: 'ease-out' },
            { name: 'route change', value: '220ms', note: 'cross-fade' },
            { name: 'panel section', value: '220ms', note: 'height auto' },
            { name: 'marketing entrance', value: '500ms + 100ms stagger', note: 'ease [0.22,1,0.36,1]' },
            { name: 'board loader', value: '1000ms hold', note: 'flower spin 6.67s' },
            { name: 'copy confirmation', value: '1200ms hold', note: 'no animation out' },
          ]}
        />
      </Section>

      <Section title="Easing" note="one curve">
        <Stage caption="Entrances decelerate hard and settle. Exits are shorter (140ms) and linear enough to disappear.">
          <div className="flex flex-wrap items-center gap-6">
            <svg width="220" height="110" viewBox="0 0 220 110" fill="none" aria-hidden="true">
              <path d="M10 100H210M10 100V10" stroke="#27272f" />
              <path d="M10 100C70 100 78 14 210 12" stroke="#f472b6" strokeOpacity="0.75" strokeWidth="1.5" />
              <circle cx="10" cy="100" r="2.5" fill="#9a9aa4" />
              <circle cx="210" cy="12" r="2.5" fill="#f472b6" />
              <text x="12" y="108" fill="#9a9aa4" fontSize="7" fontFamily="monospace">0ms</text>
              <text x="176" y="108" fill="#9a9aa4" fontSize="7" fontFamily="monospace">220ms</text>
            </svg>
            <div className="flex flex-col gap-1.5 font-mono text-[11px] text-muted-foreground/70">
              <span>entrance · cubic-bezier(0.22, 1, 0.36, 1)</span>
              <span>exit · cubic-bezier(0.4, 0, 1, 1) · 140ms</span>
              <span>spin · linear · 1s</span>
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="In use" note="replay">
        <Stage>
          <div className="flex flex-col items-center gap-5 py-2">
            <div className="flex h-[104px] w-full max-w-[380px] items-center justify-center rounded-lg bg-[#151519]">
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-[180px] rounded-lg border border-border bg-[#141418] p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="size-5 rounded-full bg-[#e063bb]" />
                  <div className="h-1.5 w-16 rounded-full bg-white/25" />
                </div>
                <div className="mt-2 h-1 w-24 rounded-full bg-white/12" />
                <div className="mt-1 h-1 w-20 rounded-full bg-white/12" />
              </motion.div>
            </div>
            <Btn variant="subtle" size="sm" onClick={() => setN((v) => v + 1)}>Replay entrance</Btn>
          </div>
        </Stage>
        <div className="mt-4">
          <Note>
            With <code className="font-mono text-[11px]">prefers-reduced-motion</code>, entrances keep the
            fade and drop the travel. Nothing loops, nothing parallaxes, and no motion runs longer than
            500ms except the board loader the user asked for.
          </Note>
        </div>
      </Section>

      <Section title="Rules">
        <Rules
          items={[
            'Animate opacity and transform only. Never width, height, top or left (panel height is the one exception).',
            'Hover changes colour in 150ms. It never lifts, scales or glows.',
            'A surface enters from where it belongs: menus drop 4px, sheets slide from their edge, routes fade.',
            'No bounce, no spring, no overshoot, no stagger longer than 400ms total.',
            'A loading state that resolves under 150ms shows nothing at all.',
            'Every animated surface must also work with motion disabled.',
          ]}
        />
      </Section>
    </Page>
  )
}

/* ------------------------------- Iconography ------------------------------- */

const ICONS: Array<{ icon: typeof Square; name: string; use: string }> = [
  { icon: MousePointer2, name: 'Select', use: 'Default tool' },
  { icon: Frame, name: 'Frame', use: 'Create a frame' },
  { icon: Square, name: 'Rectangle', use: 'Shape tool' },
  { icon: Circle, name: 'Ellipse', use: 'Shape tool' },
  { icon: Type, name: 'Text', use: 'Text tool' },
  { icon: PenTool, name: 'Pen', use: 'Draw' },
  { icon: Layers, name: 'Layers', use: 'Left panel' },
  { icon: Eye, name: 'Visibility', use: 'Layer row' },
  { icon: Lock, name: 'Lock', use: 'Layer row' },
  { icon: Plus, name: 'Add', use: 'Section add slot' },
  { icon: Minus, name: 'Remove', use: 'Section remove slot' },
  { icon: Download, name: 'Export', use: 'Menu action' },
  { icon: Copy, name: 'Copy', use: 'Hex, ids' },
  { icon: Search, name: 'Search', use: 'Library, docs' },
  { icon: Settings, name: 'Settings', use: 'Menu' },
  { icon: Undo2, name: 'Undo', use: 'Toolbar' },
  { icon: Redo2, name: 'Redo', use: 'Toolbar' },
  { icon: Palette, name: 'Ink', use: 'Pattern group' },
  { icon: Grid2x2, name: 'Grid', use: 'Pattern group' },
  { icon: Blend, name: 'Fade', use: 'Pattern group' },
  { icon: AlignLeft, name: 'Align', use: 'Panel section' },
  { icon: Zap, name: 'Motion', use: 'Effects' },
  { icon: Ban, name: 'None', use: 'Clear a value' },
  { icon: ImageIcon, name: 'Image', use: 'Fill kind' },
]

function IconsPage() {
  return (
    <Page
      title="Iconography"
      lead="One family for chrome, a few custom glyphs where the family has no word for it. Icons sit at 13px in panels and never carry meaning alone."
      meta="lucide 0.577 · 13 / 14 / 16px · stroke 2"
    >
      <Section title="Chrome set" note="lucide">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {ICONS.map(({ icon: I, name, use }) => (
            <div key={name} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-[#0b0b0d] px-2 py-3" title={use}>
              <I size={16} className="text-foreground/80" />
              <span className="text-center text-[9.5px] leading-tight text-muted-foreground/60">{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Sizes" note="px">
        <Tiles
          min={150}
          items={[
            { label: 'Panel', note: '13px', node: <Square size={13} className="text-foreground/80" /> },
            { label: 'Toolbar', note: '14px', node: <Square size={14} className="text-foreground/80" /> },
            { label: 'Header / docs', note: '16px', node: <Square size={16} className="text-foreground/80" /> },
            { label: 'Inside a field', note: '11px', node: <Square size={11} className="text-muted-foreground/70" /> },
          ]}
        />
        <div className="mt-4">
          <Note>
            Icons align to the text's cap height, not its box. A 13px icon beside 13px semibold text
            reads as one line; a 16px icon beside it reads as a bullet.
          </Note>
        </div>
      </Section>

      <Section title="Custom glyphs" note="proIcons.tsx">
        <div className="grid gap-2.5 sm:grid-cols-3">
          {[
            { name: 'Gradient', body: 'A square with a direction line and two stops.' },
            { name: 'Box shadow', body: 'A stacked square offset down-right.' },
            { name: 'Inner shadow', body: 'The same square, offset inward.' },
            { name: 'Corner radius', body: 'Corner mark, rotated per corner (PNG).' },
            { name: 'Spread', body: 'Arrows out of a dashed square.' },
            { name: 'Blur', body: 'Three soft circles in a row.' },
          ].map((g) => (
            <div key={g.name} className="rounded-lg border border-border bg-[#0b0b0d] p-3">
              <div className="mb-2 flex h-8 items-center justify-center">
                <span className="flex size-7 items-center justify-center rounded-md bg-[#2b2b2b]">
                  <span className="size-3 rounded-[2px] border border-muted-foreground/70" />
                </span>
              </div>
              <div className="text-[11.5px] font-medium text-foreground/80">{g.name}</div>
              <p className="mt-0.5 text-[10.5px] leading-snug text-muted-foreground/55">{g.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Rules">
        <Rules
          items={[
            'Icons never replace a label in a primary button. Icon-only buttons need a tooltip and an aria-label.',
            'One family per surface. Do not mix lucide with a filled set.',
            'Stroke stays at lucide default 2; icons are optical-sized per size step, not scaled from one file.',
            'Pink icons appear only in the cursor chip and the selected tool. Everywhere else an icon inherits text colour.',
            'Icons sit 6px from their label; a trailing chevron sits 2px from the edge.',
            'No emoji, no stickers, no emoji-as-icon.',
            'Do not redraw a lucide glyph to “fit” a space — move the space.',
          ]}
        />
      </Section>
    </Page>
  )
}

/* -------------------------------- Anti-slop -------------------------------- */

function AntiSlopPage() {
  return (
    <Page
      title="Anti-slop"
      lead="Twelve things this system does not do. They are cheap to add and expensive to live with."
      meta="the shortest page in the system"
    >
      <Section title="Never" note="12">
        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {[
            'Gradients on chrome. Gradients belong to the artwork, plus the one pink wash on marketing.',
            'Drop shadows on docked panels. Flat boards, floating menus.',
            'Uppercase micro-labels. Sentence case, always.',
            'Helper text under every field. A tooltip explains once; a paragraph is noise.',
            'Glassmorphism. The asset panel frosts its edge; nothing else does.',
            'Emoji, stickers, or an illustration set for empty states.',
            'Purple-blue “AI” gradients. The assistant is chrome, not a light show.',
            'Two pink actions on one surface. One signal per decision.',
            'Border + fill + shadow on the same chip. Pick one separator.',
            'Fake loading for a synchronous action. Under 150ms, show nothing.',
            'Centred long paragraphs. Reading happens at 62–68ch on the left.',
            'Motion as decoration. If it does not explain where something came from, it is gone.',
          ].map((r, i) => (
            <div key={r} className="flex gap-3 border-t border-border pt-2.5">
              <span className="font-mono text-[10px] text-[#f472b6]">{String(i + 1).padStart(2, '0')}</span>
              <p className="text-[12.5px] leading-relaxed text-[#b9b9c2]">{r}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="The same card, twice" note="before · after">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-white/15 bg-gradient-to-br from-[#7c3aed]/40 via-[#1b1b2b] to-[#0b0b0d] p-4 shadow-[0_0_40px_rgba(124,58,237,0.35)]">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/60">Premium feature</div>
            <div className="mt-2 text-[16px] font-bold text-white">Make it ✨ pop ✨</div>
            <p className="mt-1 text-[12px] leading-relaxed text-white/60">
              Our AI-powered platform seamlessly transforms your workflow.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="rounded-lg bg-gradient-to-r from-fuchsia-500 to-violet-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg shadow-fuchsia-500/50">Get started</span>
              <span className="rounded-lg bg-gradient-to-r from-pink-500 to-orange-400 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg shadow-pink-500/50">Learn more</span>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-[#141418] p-4">
            <div className="text-[10px] text-muted-foreground/60">Patterns</div>
            <div className="mt-1 text-[14px] font-semibold tracking-[-0.01em] text-foreground/90">Repeating fills, drawn live</div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#9a9aa4]">
              Choose a motif, scrub the spacing, and the fill redraws with the shape's own palette.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Btn variant="primary" size="sm">Add pattern</Btn>
              <Btn variant="ghost" size="sm">View library</Btn>
            </div>
          </div>
        </div>
        <div className="mt-3 font-mono text-[10px] text-muted-foreground/45">
          left: four colours, two gradients, two shadows, one emoji, uppercase caps. right: the system.
        </div>
      </Section>

      <Section title="The test" note="four questions">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {[
            ['Would it survive without colour?', 'If the hierarchy collapses to grey, it was carried by pink.'],
            ['Is it saying one thing?', 'Two primary actions, two helper lines, two gradients — pick one.'],
            ['Does it belong to the canvas?', 'Chrome that competes with the artwork is decoration, not tooling.'],
            ['Could a reviewer enforce it?', 'Write rules you can point at in a screenshot, not adjectives.'],
          ].map(([q, a]) => (
            <div key={q} className="rounded-lg border border-border bg-[#0b0b0d] p-3.5">
              <div className="text-[12px] font-medium text-foreground/85">{q}</div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground/60">{a}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Snippet" note="focus">
        <Snippet label="tailwind">{`<button className="h-8 rounded-md bg-[#f472b6] px-3 text-[13px] font-medium text-[#2b0a1c]
  transition-colors hover:bg-[#f472b6]/90 focus-visible:ring-2 focus-visible:ring-[#52525b]">
  Add to canvas
</button>`}</Snippet>
      </Section>
    </Page>
  )
}

export const foundationPages: Record<string, ComponentType> = {
  'foundations/color': ColorPage,
  'foundations/typography': TypographyPage,
  'foundations/space': SpacePage,
  'foundations/radius': RadiusPage,
  'foundations/borders-and-lines': BordersPage,
  'foundations/elevation': ElevationPage,
  'foundations/motion': MotionPage,
  'foundations/iconography': IconsPage,
  'foundations/anti-slop': AntiSlopPage,
}
