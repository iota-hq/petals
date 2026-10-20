import { useId, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Page, Section, Stage, Tiles, Usage, Rows, Note } from '../Doc'
import { Field, Swatch } from '../bits'

/* ----------------------------------------------------------------------------
 * The panel Section: one indicator, a 220ms fold, and closed sections that sit
 * closer. This mirrors src/editor/PropertiesPanel.tsx.
 * ------------------------------------------------------------------------- */

function PanelCollapse({
  title,
  subtitle,
  open,
  onToggle,
  aside,
  inset,
  children,
}: {
  title: string
  subtitle?: string
  open: boolean
  onToggle: () => void
  aside?: ReactNode
  inset?: boolean
  children?: ReactNode
}) {
  const bodyId = useId()
  return (
    <section
      className={cn(
        'border-b border-[#27272f]',
        open ? 'px-3.5 py-3' : 'px-3.5 py-2',
        inset && 'pl-6 pr-3',
      )}
    >
      <div className="flex min-h-5 cursor-pointer items-center justify-between gap-1" onClick={onToggle}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggle()
          }}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex min-w-0 cursor-pointer items-baseline gap-1.5 text-left"
        >
          <span className="truncate text-[13px] font-semibold tracking-[0.01em] text-foreground/90">{title}</span>
          {subtitle && <span className="truncate text-[11px] font-normal text-muted-foreground">{subtitle}</span>}
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {aside}
          <span className="text-muted-foreground" aria-hidden="true">
            {open ? <Minus size={13} /> : <Plus size={13} />}
          </span>
        </div>
      </div>
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden" id={bodyId} inert={!open}>
          <div className="space-y-1.5 pt-2">{children}</div>
        </div>
      </div>
    </section>
  )
}

const FILL_ROW = (
  <div className="flex h-7 items-center gap-2 rounded-md bg-[#2b2b2b] px-1.5">
    <Swatch color="#f472b6" size={16} radius={4} />
    <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] uppercase text-foreground/85">F472B6</span>
    <span className="text-[10.5px] text-muted-foreground">100%</span>
  </div>
)

type PanelKey = 'position' | 'fill' | 'stroke' | 'effects'

function PanelStage() {
  const [open, setOpen] = useState<Record<PanelKey, boolean>>({
    position: true,
    fill: true,
    stroke: false,
    effects: false,
  })
  const toggle = (key: PanelKey) => setOpen((s) => ({ ...s, [key]: !s[key] }))

  return (
    <div className="w-[240px] overflow-hidden rounded-lg border border-[#27272f] bg-[#1c1c1c]">
      <div className="flex h-8 items-center justify-between border-b border-[#27272f] px-3.5">
        <span className="text-[12px] font-semibold text-foreground/90">Properties</span>
        <span className="font-mono text-[10px] text-muted-foreground/50">1 selected</span>
      </div>
      <PanelCollapse title="Position" open={open.position} onToggle={() => toggle('position')}>
        <div className="grid grid-cols-2 gap-1.5">
          <Field label="X" value="128" unit="px" />
          <Field label="Y" value="64" unit="px" />
        </div>
      </PanelCollapse>
      <PanelCollapse title="Fill" open={open.fill} onToggle={() => toggle('fill')}>
        {FILL_ROW}
      </PanelCollapse>
      <PanelCollapse title="Stroke" open={open.stroke} onToggle={() => toggle('stroke')}>
        <p className="text-[11px] text-muted-foreground/60">No stroke</p>
      </PanelCollapse>
      <PanelCollapse title="Effects" open={open.effects} onToggle={() => toggle('effects')}>
        <p className="text-[11px] text-muted-foreground/60">No effects</p>
      </PanelCollapse>
    </div>
  )
}

function PlainDemo() {
  const [fill, setFill] = useState(true)
  const [stroke, setStroke] = useState(false)
  return (
    <div className="w-[220px] overflow-hidden rounded-lg border border-[#27272f] bg-[#1c1c1c]">
      <PanelCollapse title="Fill" open={fill} onToggle={() => setFill((v) => !v)}>
        {FILL_ROW}
      </PanelCollapse>
      <PanelCollapse title="Stroke" open={stroke} onToggle={() => setStroke((v) => !v)}>
        <p className="text-[11px] text-muted-foreground/60">No stroke</p>
      </PanelCollapse>
    </div>
  )
}

function AddableDemo() {
  const [present, setPresent] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const bodyOpen = present && !collapsed
  return (
    <div className="w-[220px] overflow-hidden rounded-lg border border-[#27272f] bg-[#1c1c1c]">
      <section className={cn('border-b border-[#27272f]', bodyOpen ? 'px-3.5 py-3' : 'px-3.5 py-2')}>
        <div className="flex min-h-5 items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => present && setCollapsed((c) => !c)}
            className="min-w-0 flex-1 cursor-pointer truncate text-left text-[13px] font-semibold tracking-[0.01em] text-foreground/90"
          >
            Pattern
          </button>
          <button
            type="button"
            aria-label={present ? 'Remove pattern' : 'Add pattern'}
            title={present ? 'Remove pattern' : 'Add pattern'}
            onClick={() => {
              setPresent((v) => !v)
              setCollapsed(false)
            }}
            className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
          >
            {present ? <Minus size={13} /> : <Plus size={13} />}
          </button>
        </div>
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
            bodyOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center gap-2">
                <span
                  className="size-7 rounded"
                  style={{
                    backgroundColor: '#1f1f25',
                    backgroundImage: 'radial-gradient(#f472b6 1px, transparent 1px)',
                    backgroundSize: '7px 7px',
                  }}
                />
                <span className="text-[11px] text-muted-foreground/70">Dots · 7px</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function AddSlotDemo() {
  const [open, setOpen] = useState(true)
  const [filters, setFilters] = useState<string[]>(['Live'])
  return (
    <div className="w-[220px] overflow-hidden rounded-lg border border-[#27272f] bg-[#1c1c1c]">
      <section className={cn('border-b border-[#27272f]', open ? 'px-3.5 py-3' : 'px-3.5 py-2')}>
        <div className="flex min-h-5 items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="min-w-0 flex-1 cursor-pointer truncate text-left text-[13px] font-semibold tracking-[0.01em] text-foreground/90"
          >
            Filters
          </button>
          <button
            type="button"
            title="Add filter"
            onClick={() => {
              if (filters.length < 3) setFilters((f) => [...f, `Filter ${f.length + 1}`])
              setOpen(true)
            }}
            className="shrink-0 cursor-pointer text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            + Filter
          </button>
        </div>
        <div
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
            open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-1.5 pt-2">
              {filters.map((f) => (
                <div key={f} className="flex h-6 items-center rounded bg-[#2b2b2b] px-2 text-[11px] text-foreground/80">
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function NestedDemo() {
  const [text, setText] = useState(true)
  const [type, setType] = useState(true)
  const [fill, setFill] = useState(true)
  return (
    <div className="w-[220px] overflow-hidden rounded-lg border border-[#27272f] bg-[#1c1c1c]">
      <PanelCollapse title="Text" open={text} onToggle={() => setText((v) => !v)}>
        <div className="-mx-3.5 -mb-3 border-t border-[#27272f]/70">
          <PanelCollapse title="Typography" subtitle="Inter" open={type} onToggle={() => setType((v) => !v)} inset>
            <Field label="Size" value="32" unit="px" />
          </PanelCollapse>
          <PanelCollapse title="Fill" open={fill} onToggle={() => setFill((v) => !v)} inset>
            {FILL_ROW}
          </PanelCollapse>
        </div>
      </PanelCollapse>
    </div>
  )
}

function StateRow({ state }: { state: 'open' | 'closed' | 'hover' }) {
  const closed = state === 'closed'
  return (
    <div className={cn('w-full rounded-md', state === 'hover' && 'bg-white/[0.03]')}>
      <div className={cn('flex items-center justify-between gap-1 border-b border-[#27272f] px-3.5', closed ? 'py-2' : 'py-3')}>
        <span className="text-[13px] font-semibold tracking-[0.01em] text-foreground/90">Fill</span>
        <span className="text-muted-foreground">{closed ? <Plus size={13} /> : <Minus size={13} />}</span>
      </div>
      {!closed && (
        <div className="px-3.5 pt-2">
          <div className="h-7 rounded bg-[#2b2b2b]" />
        </div>
      )}
    </div>
  )
}

function CollapsiblePage() {
  return (
    <Page
      title="Collapsible"
      lead="A panel section that folds away. Several stay open; nothing closes behind your back."
      meta="220ms · one indicator · 240px panel"
    >
      <Section title="In the panel" note="open · closed">
        <Stage caption="Click a title to fold it. Open sections use py-3, closed ones py-2, so a long stack scans without gaps. More than one can be open at a time.">
          <div className="flex justify-center">
            <PanelStage />
          </div>
        </Stage>
        <div className="mt-4">
          <Rows
            head={['Part', 'Value', 'Note']}
            items={[
              { name: 'padding · open', value: '12px 14px', note: 'py-3 px-3.5' },
              { name: 'padding · closed', value: '8px 14px', note: 'py-2 px-3.5 — sits closer' },
              { name: 'title', value: '13px / 600', note: 'truncates, never wraps' },
              { name: 'subtitle', value: '11px / 400', note: 'muted, truncates first' },
              { name: 'indicator', value: '13px + / −', note: 'exactly one per header' },
              { name: 'hairline', value: '1px #27272f', note: 'bottom of every section' },
              { name: 'body gap', value: '6px · top 8px', note: 'space-y-1.5 pt-2' },
              { name: 'motion', value: '220ms height + opacity', note: 'ease [0.22, 1, 0.36, 1]' },
            ]}
          />
        </div>
        <div className="mt-4">
          <Note>
            This is not an accordion. Opening Fill never closes Stroke, and the state belongs to the panel, not
            the document — collapsing a section adds no undo step.
          </Note>
        </div>
      </Section>

      <Section title="Variants" note="plain · addable · addSlot · nested">
        <Tiles
          min={240}
          items={[
            { label: 'plain', note: 'title toggles', node: <PlainDemo /> },
            { label: 'addable', note: 'add / remove', node: <AddableDemo /> },
            { label: 'addSlot', note: 'add filter', node: <AddSlotDemo /> },
            { label: 'nested', note: 'indent 24px', node: <NestedDemo /> },
          ]}
        />
      </Section>

      <Section title="States" note="open · closed · hover">
        <Tiles
          min={190}
          items={[
            { label: 'open', note: 'py-3 · −', node: <StateRow state="open" /> },
            { label: 'closed', note: 'py-2 · +', node: <StateRow state="closed" /> },
            { label: 'hover', note: 'row tint 3%', node: <StateRow state="hover" /> },
          ]}
        />
      </Section>

      <Usage
        when="A properties panel has more groups than fit at once. The collapsible keeps every group one click away without turning the panel into a wizard or a settings page."
        rules={[
          'Clicking the title toggles; the header holds exactly one +/− indicator.',
          'Open sections are px-3.5 py-3, closed are px-3.5 py-2. Closed sections sit closer together on purpose.',
          'Not an accordion. Several sections stay open and opening one never closes another.',
          'An addable section reuses the same slot: + adds the content, − removes it. Never show both.',
          'An addSlot action replaces the indicator entirely and must stop its click from toggling the section.',
          'Collapse is view state. It is per panel, is not saved to the document and adds no undo step.',
          'Never hide a required field in a closed section without a summary in the header.',
        ]}
        checks={[
          'The header button has aria-expanded and aria-controls pointing at the body.',
          'Closed content is removed from the tab order (hidden/inert), rather than clipped to zero height.',
          'Focus stays on the header after toggling, so a keyboard user can keep folding.',
          'The indicator has an accessible name — Collapse Fill / Expand Fill — and is not the only state signal.',
        ]}
        keys={['Enter / Space — toggle the focused section', 'Tab — move from the title into the open body']}
        edges={[
          'Two sections with the same title need distinct ids; the header list is not unique by name.',
          'A long title truncates; the subtitle truncates before the title does.',
          'Nesting stops at two levels; a third level becomes a group with its own heading.',
          'A section closed mid-drag keeps the drag alive; the field does not lose pointer capture.',
          'A panel restored from a saved layout opens with the last open sections, not all expanded.',
        ]}
      />
    </Page>
  )
}

export const layoutPages: Record<string, ComponentType> = {
  'components/collapsible': CollapsiblePage,
}