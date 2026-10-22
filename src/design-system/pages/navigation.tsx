import { useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { Check, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Page, Section, Stage, Tiles, Usage, Rows } from '../Doc'
import { PanelFrame } from '../bits'

/* ----------------------------------- Tabs ---------------------------------- */

const LIB_TABS: Array<{ id: string; label: string; count: number }> = [
  { id: 'patterns', label: 'Patterns', count: 23 },
  { id: 'logos', label: 'Logos', count: 14 },
  { id: 'icons', label: 'Icons', count: 32 },
]

function LibraryTabs() {
  const [tab, setTab] = useState('patterns')
  return (
    <div className="w-[340px] max-w-full overflow-hidden rounded-lg border border-[#27272f] bg-[#141418]">
      <div role="tablist" aria-label="Asset library" className="flex h-9 items-center gap-4 border-b border-[#27272f] px-3">
        {LIB_TABS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`library-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`library-panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => {
              if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return
              e.preventDefault()
              const next =
                e.key === 'Home'
                  ? 0
                  : e.key === 'End'
                    ? LIB_TABS.length - 1
                    : (i + (e.key === 'ArrowRight' ? 1 : -1) + LIB_TABS.length) % LIB_TABS.length
              setTab(LIB_TABS[next].id)
              const tabs = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
              tabs?.[next]?.focus()
            }}
            className={cn(
              'relative h-9 cursor-pointer text-[12.5px] transition-colors',
              tab === t.id ? 'font-medium text-foreground' : 'text-[#9a9aa4] hover:text-foreground/85',
            )}
          >
            {t.label}
            <span className="ml-1 font-mono text-[10px] font-normal text-muted-foreground/50">{t.count}</span>
            {tab === t.id && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-foreground" />}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`library-panel-${tab}`}
        aria-labelledby={`library-tab-${tab}`}
        className="flex h-14 items-center justify-between px-3"
      >
        <span className="text-[11.5px] text-muted-foreground">
          {LIB_TABS.find((t) => t.id === tab)?.count} {LIB_TABS.find((t) => t.id === tab)?.label.toLowerCase()}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/45">assets</span>
      </div>
    </div>
  )
}

function PanelTabs() {
  return (
    <PanelFrame title="Design" width={240}>
      <div className="flex h-8 items-center gap-3 border-b border-[#27272f] px-3">
        {['Layout', 'Grid'].map((label, i) => (
          <span
            key={label}
            className={cn(
              'relative flex h-8 items-center text-[11.5px]',
              i === 0 ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {label}
            {i === 0 && <span className="absolute inset-x-0 bottom-0 h-px bg-foreground/70" />}
          </span>
        ))}
      </div>
      <div className="flex h-14 flex-col justify-center gap-1 px-3.5">
        <span className="text-[11.5px] text-foreground/80">Auto layout</span>
        <span className="text-[10.5px] text-muted-foreground/60">Vertical · gap 24</span>
      </div>
    </PanelFrame>
  )
}

function CanvasTabs() {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-[#27272f] bg-[#141418]">
      <div className="flex h-9 items-end gap-1 border-b border-[#27272f] px-2">
        {['Cover', 'Pricing', 'Archive'].map((name, i) => (
          <span
            key={name}
            className={cn(
              'flex h-7 items-center gap-1.5 rounded-t-md px-2.5 text-[11.5px]',
              i === 0 ? 'bg-[#2b2b2b] text-foreground' : 'text-muted-foreground',
            )}
          >
            {name}
            {i === 0 && <X size={10} className="text-muted-foreground/70" />}
          </span>
        ))}
        <span className="mb-1 flex size-6 items-center justify-center rounded text-muted-foreground/60">
          <Plus size={12} />
        </span>
      </div>
      <div className="flex h-14 items-center justify-center font-mono text-[10px] text-muted-foreground/40">
        canvas
      </div>
    </div>
  )
}

function TabState({ state }: { state: 'rest' | 'hover' | 'active' | 'disabled' }) {
  return (
    <div className={cn('flex h-9 items-center rounded-md px-3', state === 'hover' && 'bg-white/[0.03]')}>
      <span className={cn('relative flex h-9 items-center gap-1 text-[12.5px]', state === 'disabled' && 'opacity-45')}>
        <span
          className={cn(
            state === 'rest' && 'text-[#9a9aa4]',
            state === 'hover' && 'text-foreground/90',
            (state === 'active' || state === 'disabled') && 'text-foreground',
          )}
        >
          Patterns
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/50">24</span>
        {state === 'active' && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-foreground" />}
      </span>
    </div>
  )
}

function TabsPage() {
  return (
    <Page
      title="Tabs"
      lead="Switches the contents of one region. A tab never navigates and never moves the canvas."
      meta="36px · 2px underline · 3 levels"
    >
      <Section title="Library tabs" note="text · underline">
        <Stage caption="The asset library's three tabs. Counts are optional and sit in mono beside the label; the active underline is foreground, never pink.">
          <div className="flex justify-center">
            <LibraryTabs />
          </div>
        </Stage>
        <div className="mt-4">
          <Rows
            head={['Part', 'Value', 'Note']}
            items={[
              { name: 'height', value: '36px', note: 'the whole strip' },
              { name: 'font', value: '12.5px / 500', note: 'active only is medium' },
              { name: 'gap', value: '16px', note: 'between tabs' },
              { name: 'underline', value: '2px #ececf1', note: 'inset to the label' },
              { name: 'count', value: '10px mono', note: 'optional, muted' },
              { name: 'inactive', value: '#9a9aa4', note: 'hover lifts to foreground' },
              { name: 'panel', value: 'no scrim, no shadow', note: 'tabs are structure' },
            ]}
          />
        </div>
      </Section>

      <Section title="Levels" note="library · panel · canvas">
        <Tiles
          min={260}
          items={[
            { label: 'panel tabs', note: '28px · underline 1px', node: <PanelTabs /> },
            { label: 'canvas tabs', note: 'page strip', wide: true, node: <CanvasTabs /> },
          ]}
        />
      </Section>

      <Section title="States" note="hover · active · disabled">
        <Tiles
          min={150}
          items={[
            { label: 'rest', node: <TabState state="rest" /> },
            { label: 'hover', node: <TabState state="hover" /> },
            { label: 'active', note: 'underline', node: <TabState state="active" /> },
            { label: 'disabled', node: <TabState state="disabled" /> },
          ]}
        />
      </Section>

      <Usage
        when="Two to five views of the same region that the user switches between without losing context: asset types, a panel's sections, open pages. The content changes; the surface stays."
        rules={[
          'One tab row per surface. Do not nest a tab row inside another.',
          'The active tab is text plus a 2px foreground underline. Never pink, never a filled pill.',
          'Counts are optional and go after the label in 10px mono; they never replace the label.',
          'Hover changes the text colour only; the underline belongs to the active tab.',
          'Panel tabs are 28px and canvas page tabs are 28px chips with a close affordance. Neither is the library tab row.',
          'Disabled tabs stay in place at 45% and keep their count.',
          'Tab switching is local view state; it never writes the document or adds an undo step.',
        ]}
        checks={[
          'role="tablist", role="tab" and aria-selected; the panel is role="tabpanel" and labelled by its tab.',
          'Left and Right arrows move between tabs; Tab leaves the strip and lands in the panel.',
          'The underline is not the only signal: the label also changes weight and colour.',
          'A disabled tab exposes aria-disabled and stays reachable so its reason can be read.',
        ]}
        keys={['← → — previous or next tab', 'Home / End — first or last tab']}
        edges={[
          'A long label truncates at 120px with the count still visible.',
          'Closing the active canvas tab activates the neighbour to the right, or the left at the end.',
          'Zero items in a tab keeps the tab enabled and shows the empty state in the panel.',
          'A tab that becomes unavailable while active falls back to the first available tab.',
        ]}
      />
    </Page>
  )
}

/* -------------------------------- Breadcrumb ------------------------------- */

function EditorBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-11 items-center gap-3 rounded-lg border border-[#27272f] bg-[#141418] px-3">
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
      <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50">100%</span>
    </div>
  )
}

function Crumb({ name, last, max }: { name: string; last?: boolean; max?: number }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {last ? (
        <span className="truncate text-foreground" style={max ? { maxWidth: max } : undefined}>
          {name}
        </span>
      ) : (
        <span
          className="cursor-pointer truncate text-[#9a9aa4] transition-colors hover:text-foreground"
          style={max ? { maxWidth: max } : undefined}
        >
          {name}
        </span>
      )}
    </span>
  )
}

function CrumbBar({ items, truncate = false }: { items: string[]; truncate?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[12px]">
      {items.map((name, i) => (
        <span key={name} className="flex min-w-0 items-center gap-1.5">
          {i > 0 && <ChevronRight size={10} className="shrink-0 text-muted-foreground/40" />}
          <Crumb name={name} last={i === items.length - 1} max={truncate && i === 1 ? 120 : undefined} />
        </span>
      ))}
    </div>
  )
}

function BreadcrumbPage() {
  return (
    <Page
      title="Breadcrumb"
      lead="Shows where the open page sits. Three levels in the editor bar, no deeper."
      spec
      meta="12px · 10px chevrons · 3 levels"
    >
      <Section title="In the editor bar" note="projects / board / page">
        <Stage caption="Projects is the only level above a board. The last item is plain text, never a link; long board names truncate before the page name does.">
          <div className="flex flex-col gap-5">
            <div>
              <div className="mb-1.5 font-mono text-[10px] text-muted-foreground/45">default</div>
              <EditorBar>
                <CrumbBar items={['Projects', 'Q4 launch', 'Cover']} />
              </EditorBar>
            </div>
            <div>
              <div className="mb-1.5 font-mono text-[10px] text-muted-foreground/45">long board name</div>
              <EditorBar>
                <CrumbBar items={['Projects', 'Website redesign for the spring launch', 'Pricing']} truncate />
              </EditorBar>
            </div>
            <div>
              <div className="mb-1.5 font-mono text-[10px] text-muted-foreground/45">collapsed middle</div>
              <EditorBar>
                <CrumbBar items={['Projects', '…', 'Cover']} />
              </EditorBar>
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy" note="three levels">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'font', value: '12px / 400', note: 'last item 500' },
            { name: 'chevron', value: '10px · #52525b', note: '4px gap either side' },
            { name: 'height', value: '44px bar', note: 'centred, never wraps' },
            { name: 'link', value: '#9a9aa4 → foreground', note: 'hover only' },
            { name: 'last item', value: 'plain text', note: 'not a link, no hover' },
            { name: 'board name', value: 'max 120px', note: 'truncate with ellipsis' },
            { name: 'depth', value: '3 levels', note: 'Projects / board / page' },
          ]}
        />
      </Section>

      <Usage
        when="The editor bar, to say which board and page are open and to get back one or two levels. It is a location, not a history and not a file tree."
        rules={[
          'Exactly three levels: Projects, the board, the page. Stop there.',
          'The last item is plain text with no hover and no pointer. Everything before it is a link.',
          'Chevrons are 10px and sit at #52525b; they are separators, not buttons.',
          'A long board name truncates at 120px before the page name does.',
          'If the middle level is removed for space, show an ellipsis button, never a gap.',
          'Never use a breadcrumb for a deep document structure — the layers panel is the tree.',
          'The bar does not scroll and does not wrap; the page title truncates first.',
        ]}
        checks={[
          'The trail is a nav with aria-label="Breadcrumb" and an ordered list.',
          'The current page uses aria-current="page" and is not a link.',
          'The ellipsis button has an accessible name and opens the hidden levels, not a tooltip.',
          'Every link keeps a visible focus ring in the 44px bar.',
        ]}
        edges={[
          'A board renamed while open updates the crumb without moving the page.',
          'A deleted board leaves Projects and an error toast; never a dead link.',
          'A page with no board (a template preview) shows only Projects / page.',
          'At 320px the board name shrinks to 60px, then collapses to the ellipsis.',
          'Opening a second board replaces the trail; it does not append to it.',
        ]}
      />
    </Page>
  )
}

/* ----------------------------------- Steps --------------------------------- */

type StepState = 'done' | 'current' | 'upcoming'

function StepDot({ state }: { state: StepState }) {
  if (state === 'done') {
    return (
      <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#2b2b2b] text-foreground/80">
        <Check size={10} />
      </span>
    )
  }
  if (state === 'current') {
    return (
      <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#f472b6]">
        <span className="size-1.5 rounded-full bg-[#2b0a1c]" />
      </span>
    )
  }
  return <span className="size-[18px] shrink-0 rounded-full border border-[#3f3f46]" />
}

const EXPORT_FLOW = [
  { label: 'Check', note: '3 frames · 1 page' },
  { label: 'Choose', note: 'PNG, 2×' },
  { label: 'Import', note: 'After Effects' },
]

function ExportSteps() {
  const current = 1
  return (
    <div className="w-[420px] max-w-full rounded-lg border border-[#27272f] bg-[#141418] p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] font-semibold text-foreground/90">Export</span>
        <span className="font-mono text-[10px] text-muted-foreground/50">step 2 of 3</span>
      </div>
      <ol className="mt-4 flex">
        {EXPORT_FLOW.map((s, i) => {
          const state: StepState = i < current ? 'done' : i === current ? 'current' : 'upcoming'
          return (
            <li key={s.label} className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <StepDot state={state} />
                {i < EXPORT_FLOW.length - 1 && (
                  <span className={cn('h-px flex-1', state === 'done' ? 'bg-[#3f3f46]' : 'bg-[#27272f]')} />
                )}
              </div>
              <div className="min-w-0 pr-3">
                <div
                  className={cn(
                    'truncate text-[12px]',
                    state === 'upcoming' ? 'text-muted-foreground/60' : 'font-medium text-foreground/90',
                  )}
                >
                  {s.label}
                </div>
                <div className="mt-0.5 truncate text-[10.5px] text-muted-foreground/55">{s.note}</div>
              </div>
            </li>
          )
        })}
      </ol>
      <div className="mt-4 flex h-8 items-center justify-between border-t border-[#27272f] pt-3">
        <span className="text-[10.5px] text-muted-foreground/55">Native · PNG · 2×</span>
        <span className="inline-flex h-7 items-center rounded-md bg-[#f472b6] px-2.5 text-[11.5px] font-medium text-[#2b0a1c]">
          Continue
        </span>
      </div>
    </div>
  )
}

const ONBOARDING = [
  { label: 'Name the board', note: 'Q4 launch' },
  { label: 'Pick a template', note: 'Blank' },
  { label: 'Add layers', note: '2 of 3' },
  { label: 'Invite the team', note: 'Later' },
]

function OnboardingSteps() {
  const current = 2
  return (
    <div className="w-[240px] overflow-hidden rounded-lg border border-[#27272f] bg-[#141418]">
      <div className="flex h-9 items-center justify-between border-b border-[#27272f] px-3.5">
        <span className="text-[12px] font-semibold text-foreground/90">New board</span>
        <X size={12} className="text-muted-foreground/60" />
      </div>
      <ol className="px-3.5 py-3">
        {ONBOARDING.map((s, i) => {
          const state: StepState = i < current ? 'done' : i === current ? 'current' : 'upcoming'
          return (
            <li key={s.label} className="flex gap-2.5">
              <div className="flex flex-col items-center">
                <StepDot state={state} />
                {i < ONBOARDING.length - 1 && (
                  <span className={cn('mt-1 w-px flex-1', state === 'done' ? 'bg-[#3f3f46]' : 'bg-[#27272f]')} />
                )}
              </div>
              <div className={cn('min-w-0', i < ONBOARDING.length - 1 ? 'pb-4' : '')}>
                <div
                  className={cn(
                    'truncate text-[12px]',
                    state === 'upcoming' ? 'text-muted-foreground/60' : 'font-medium text-foreground/90',
                  )}
                >
                  {s.label}
                </div>
                <div className="mt-0.5 truncate text-[10.5px] text-muted-foreground/55">{s.note}</div>
              </div>
            </li>
          )
        })}
      </ol>
      <div className="border-t border-[#27272f] p-2.5">
        <span className="flex h-7 items-center justify-center rounded-md bg-[#2b2b2b] text-[11.5px] font-medium text-foreground/90">
          Continue
        </span>
      </div>
    </div>
  )
}

function StepsPage() {
  return (
    <Page
      title="Steps"
      lead="Shows how far a short flow has come and what is left. Three or four stops, no branches."
      spec
      meta="18px dots · 3–4 steps · one current"
    >
      <Section title="Export flow" note="horizontal">
        <Stage caption="Check, choose, import. Done uses a check, current a filled pink dot, upcoming an outline; the connector darkens as steps complete.">
          <div className="flex justify-center">
            <ExportSteps />
          </div>
        </Stage>
      </Section>

      <Section title="Onboarding" note="vertical · 240px">
        <Stage caption="The same component in a 240px sheet. Labels and connectors stack; the connector runs between dots, never around them.">
          <div className="flex justify-center">
            <OnboardingSteps />
          </div>
        </Stage>
      </Section>

      <Section title="States" note="done · current · upcoming">
        <Tiles
          min={170}
          items={[
            {
              label: 'done',
              note: 'check',
              node: (
                <div className="flex items-center gap-2">
                  <StepDot state="done" />
                  <span className="text-[12px] text-foreground/80">Check</span>
                </div>
              ),
            },
            {
              label: 'current',
              note: 'filled pink',
              node: (
                <div className="flex items-center gap-2">
                  <StepDot state="current" />
                  <span className="text-[12px] font-medium text-foreground">Choose</span>
                </div>
              ),
            },
            {
              label: 'upcoming',
              note: 'outline',
              node: (
                <div className="flex items-center gap-2">
                  <StepDot state="upcoming" />
                  <span className="text-[12px] text-muted-foreground/60">Import</span>
                </div>
              ),
            },
          ]}
        />
        <div className="mt-4">
          <Rows
            head={['Part', 'Value', 'Note']}
            items={[
              { name: 'dot', value: '18px', note: '14px inside a vertical sheet' },
              { name: 'connector', value: '1px #27272f', note: 'done segment #3f3f46' },
              { name: 'label', value: '12px · 500 current', note: 'upcoming #9a9aa4 at 60%' },
              { name: 'note', value: '10.5px', note: 'optional, one line' },
              { name: 'horizontal gap', value: '8px dot → connector', note: 'labels under the dots' },
              { name: 'vertical gap', value: '16px below each label', note: 'connector fills it' },
              { name: 'count', value: '3–4 steps', note: 'no scrolling flow' },
              { name: 'motion', value: '220ms connector fill', note: 'no bouncing dots' },
            ]}
          />
        </div>
      </Section>

      <Usage
        when="A short linear flow with a visible end: the export steps, first-run onboarding, a three-part setup. Use it when the user benefits from seeing what remains."
        rules={[
          'Three or four steps. Past four it is a form or a page, not a steps strip.',
          'Exactly one current step. Done steps are before it; upcoming after.',
          'The dot, the label weight and the connector all carry state — never colour alone.',
          'Labels are one or two words; the note under them carries the detail.',
          'Horizontal in a wide panel, vertical in a 240px sheet. Never both in one surface.',
          'A step is not a button. Do not let users jump ahead by clicking it.',
          'The primary action advances one step and is labelled with the next step, not Next.',
        ]}
        checks={[
          'The flow is an ordered list with aria-label naming it; the current step has aria-current="step".',
          'Done steps announce their state in text, not only the check glyph.',
          'The connector is decorative and hidden from the accessibility tree.',
          'Reduced motion turns the 220ms fill into an instant state change.',
        ]}
        edges={[
          'A failed step stays current with the error beside its note; earlier steps stay done.',
          'Going back keeps later steps reachable but marks them upcoming again.',
          'A long label truncates to one line in the vertical sheet; the note truncates first.',
          'A two-step flow renders without connectors.',
          'Closing and reopening the flow starts from the first incomplete step.',
        ]}
      />
    </Page>
  )
}

/* -------------------------------- Pagination ------------------------------- */

const PAGE_COUNT = 4

const PAGE_ROWS: Record<number, Array<{ name: string; layers: number; updated: string }>> = {
  1: [
    { name: 'Cover', layers: 12, updated: '2m ago' },
    { name: 'Pricing', layers: 24, updated: '1h ago' },
    { name: 'Archive', layers: 6, updated: '3d ago' },
  ],
  2: [
    { name: 'About', layers: 18, updated: '4h ago' },
    { name: 'Careers', layers: 9, updated: '1d ago' },
    { name: 'Press', layers: 4, updated: '5d ago' },
  ],
  3: [
    { name: 'Changelog', layers: 21, updated: '6h ago' },
    { name: 'Roadmap', layers: 14, updated: '2d ago' },
    { name: 'Docs', layers: 31, updated: '1w ago' },
  ],
  4: [
    { name: 'Brand', layers: 42, updated: '1d ago' },
    { name: 'Tokens', layers: 8, updated: '2w ago' },
    { name: 'Icons', layers: 112, updated: '1mo ago' },
  ],
}

function PaginationFooter() {
  const [page, setPage] = useState(1)
  const [jump, setJump] = useState('1')

  const go = (next: number) => {
    const clamped = Math.max(1, Math.min(PAGE_COUNT, next))
    setPage(clamped)
    setJump(String(clamped))
  }

  return (
    <div className="w-[520px] max-w-full overflow-hidden rounded-lg border border-[#27272f] bg-[#141418]">
      <div className="grid grid-cols-[1fr_64px_72px] gap-3 border-b border-[#27272f] px-3 py-2 text-[10px] text-muted-foreground/55">
        <span>Page</span>
        <span className="text-right">Layers</span>
        <span className="text-right">Updated</span>
      </div>
      {PAGE_ROWS[page].map((r) => (
        <div
          key={r.name}
          className="grid grid-cols-[1fr_64px_72px] gap-3 border-b border-[#27272f]/60 px-3 py-2 text-[12px]"
        >
          <span className="truncate text-foreground/85">{r.name}</span>
          <span className="text-right font-mono text-[11px] text-muted-foreground">{r.layers}</span>
          <span className="text-right text-[11px] text-muted-foreground/60">{r.updated}</span>
        </div>
      ))}
      <div className="flex h-11 items-center justify-between px-3">
        <span className="text-[11.5px] text-muted-foreground" aria-live="polite">
          Page {page} of {PAGE_COUNT}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => go(page - 1)}
            className="flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronLeft size={13} />
          </button>
          <label className="flex items-center gap-1 pl-1 font-mono text-[10.5px] text-muted-foreground/50">
            <input
              aria-label="Go to page"
              inputMode="numeric"
              value={jump}
              onChange={(e) => setJump(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') go(Number.parseInt(jump, 10) || page)
              }}
              onBlur={() => setJump(String(page))}
              className="h-6 w-8 rounded border border-[#27272f] bg-[#2b2b2b] text-center text-[10.5px] text-foreground/85 outline-none focus:ring-2 focus:ring-[#52525b]/70"
            />
            <span>/ {PAGE_COUNT}</span>
          </label>
          <button
            type="button"
            aria-label="Next page"
            disabled={page === PAGE_COUNT}
            onClick={() => go(page + 1)}
            className="flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

function PageChip({ n, active }: { n: number; active?: boolean }) {
  return (
    <span
      className={cn(
        'flex size-6 items-center justify-center rounded text-[11px]',
        active ? 'bg-[#2b2b2b] font-medium text-foreground' : 'text-muted-foreground',
      )}
    >
      {n}
    </span>
  )
}

function PaginationPage() {
  return (
    <Page
      title="Pagination"
      lead="Moves through a long list without losing it. Counts and arrows, not a row of numbers."
      spec
      meta="24px buttons · 1 count · no canvas"
    >
      <Section title="Footer" note="Page 1 of 4">
        <Stage caption="A table footer. Prev and next are 24px; the compact jump field sits between them and clamps on Enter.">
          <div className="flex justify-center">
            <PaginationFooter />
          </div>
        </Stage>
      </Section>

      <Section title="Numbered" note="up to 7 pages">
        <Tiles
          min={240}
          items={[
            {
              label: 'up to 7 pages',
              note: 'numbered',
              node: (
                <div className="flex items-center gap-1">
                  <span className="flex size-6 items-center justify-center text-muted-foreground/40">
                    <ChevronLeft size={13} />
                  </span>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <PageChip key={n} n={n} active={n === 3} />
                  ))}
                  <span className="flex size-6 items-center justify-center text-muted-foreground/40">
                    <ChevronRight size={13} />
                  </span>
                </div>
              ),
            },
            {
              label: 'more than 7 pages',
              note: 'never 1–12',
              node: (
                <div className="flex items-center gap-2 font-mono text-[10.5px] text-muted-foreground/60">
                  <span className="flex size-6 items-center justify-center text-muted-foreground">
                    <ChevronLeft size={13} />
                  </span>
                  <span>Page 12 of 40</span>
                  <span className="flex size-6 items-center justify-center text-muted-foreground">
                    <ChevronRight size={13} />
                  </span>
                </div>
              ),
            },
          ]}
        />
        <div className="mt-4">
          <Rows
            head={['Part', 'Value', 'Note']}
            items={[
              { name: 'footer height', value: '44px', note: 'one hairline above' },
              { name: 'count', value: '11.5px', note: '"Page 1 of 4"' },
              { name: 'prev / next', value: '24px', note: '13px icon' },
              { name: 'active page', value: '24px chip #2b2b2b', note: 'not pink' },
              { name: 'jump field', value: '24px · 32px wide', note: 'mono, centred' },
              { name: 'numbered limit', value: '7', note: 'more uses counts and arrows' },
              { name: 'gap', value: '4px', note: 'buttons and chips' },
            ]}
          />
        </div>
      </Section>

      <Usage
        when="A list longer than one viewport that the user scans page by page: a table, the gallery, search results. Not the canvas, the layers panel or the pages list — those scroll."
        rules={[
          'Always show the position and total: Page 1 of 4.',
          'Prev and next are 24px icon buttons and disabled at the ends.',
          'A jump field appears between them; Enter clamps to the valid range, blur restores the current page.',
          'Never render a row of numbers when there are more than 7 pages. Use arrows and the count.',
          'Up to 7 pages may be numbered; the active page is a #2b2b2b chip, never pink.',
          'Pagination changes the view, not the document; it never adds an undo step.',
          'A one-page list hides the footer entirely.',
        ]}
        checks={[
          'The footer is a nav with aria-label="Pagination"; the current page has aria-current="page".',
          'Changing page announces “Page 2 of 4” through a polite live region.',
          'The jump field has a label and accepts digits only.',
          'Disabled arrows use the disabled attribute and are skipped by Tab.',
        ]}
        edges={[
          'The last row of the last page is deleted: clamp to the new last page, never show an empty page.',
          'Jumping to 0, 99 or a letter clamps or restores on Enter; nothing is submitted.',
          'The total changes while the user is on page 3 of 4: keep the page if it still exists.',
          'A filter that shortens the list returns to page 1 and says so.',
          'Keyboard only: Tab reaches arrows and the field in order, Enter jumps.',
        ]}
      />
    </Page>
  )
}

export const navigationPages: Record<string, ComponentType> = {
  'components/tabs': TabsPage,
  'components/breadcrumb': BreadcrumbPage,
  'components/steps': StepsPage,
  'components/pagination': PaginationPage,
}
