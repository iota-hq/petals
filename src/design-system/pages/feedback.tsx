import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CircleAlert, Info, Plus, TriangleAlert, X } from 'lucide-react'
import type { ComponentType } from 'react'
import { Page, Section, Stage, Tiles, Usage, Rows, Note } from '../Doc'
import { Btn, CanvasToolbar, Dot } from '../bits'
import { cn } from '@/lib/utils'

/* ---------------------------------- shared --------------------------------- */

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

/* ---------------------------------- Status --------------------------------- */

type SaveState = 'saved' | 'saving' | 'offline'

const SAVE: Record<SaveState, { word: string; color: string }> = {
  saved: { word: 'Saved', color: '#4ade80' },
  saving: { word: 'Saving', color: '#9a9aa4' },
  offline: { word: 'Offline', color: '#ef4444' },
}

function SaveStatus({ state, live }: { state: SaveState; live?: boolean }) {
  const s = SAVE[state]
  return (
    <span
      role={live ? 'status' : undefined}
      aria-live={live ? 'polite' : undefined}
      className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-[#9a9aa4]"
    >
      <Dot color={s.color} size={6} pulse={state === 'saving'} />
      <span>{s.word}</span>
    </span>
  )
}

function SaveDemo() {
  const [state, setState] = useState<SaveState>('saved')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  const edit = () => {
    setState('saving')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('saved'), 1400)
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="w-[300px] overflow-hidden rounded-lg border border-[#27272f] bg-[#1c1c1c]">
        <div className="flex h-10 items-center gap-2 border-b border-[#27272f] px-3">
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">Rosewood</span>
          <SaveStatus state={state} live />
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-3">
          <span className="truncate text-[12px] text-muted-foreground">Renamed “Hero”</span>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50">v12</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Btn size="sm" variant="subtle" onClick={edit}>
          Make an edit
        </Btn>
        <Btn size="sm" variant="ghost" onClick={() => setState('offline')}>
          Go offline
        </Btn>
        <Btn size="sm" variant="ghost" onClick={() => setState('saved')}>
          Reconnect
        </Btn>
      </div>
    </div>
  )
}

function StatusPage() {
  return (
    <Page
      title="Status"
      lead="The write state of the document, in the panel header where the name is."
      meta="6px dot · 3 states · 1s pulse"
    >
      <Section title="States" note="one word each">
        <Tiles
          min={160}
          items={[
            { label: 'saved', note: '#4ade80', node: <SaveStatus state="saved" /> },
            { label: 'saving', note: 'pulse', node: <SaveStatus state="saving" /> },
            { label: 'offline', note: '#ef4444', node: <SaveStatus state="offline" /> },
          ]}
        />
      </Section>

      <Section title="In a header" note="trailing the project name">
        <Stage caption="One write: Saving, then Saved. Offline holds edits locally and stays until a write succeeds.">
          <SaveDemo />
        </Stage>
      </Section>

      <Section title="Anatomy">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'dot', value: '6px', note: 'circle, no ring' },
            { name: 'gap', value: '6px', note: 'dot → word' },
            { name: 'word', value: '11px', note: 'sentence case' },
            { name: 'saved', value: '#4ade80', note: 'after the write lands' },
            { name: 'saving', value: '#9a9aa4', note: 'neutral, not warning' },
            { name: 'offline', value: '#ef4444', note: 'stays until reconnect' },
            { name: 'pulse', value: '1s', note: 'Saving only' },
          ]}
        />
      </Section>

      <Usage
        when="The write state of the open document. It sits at the trailing edge of the panel header, beside the project or frame name, and answers one question: is my work safe?"
        rules={[
          'Dot plus one word. The word carries the state; colour is the second signal.',
          'Saved appears only after the write lands, never on keystroke.',
          'Saving is neutral grey. A save in progress is not a warning.',
          'Offline is red, holds edits locally, and stays until a write succeeds.',
          'Never wrap the save state in a badge, and never announce it in a toast.',
          'Do not announce every save to a screen reader; announce Offline and failures only.',
        ]}
        checks={[
          'The header state sits in a role=status region with aria-live=polite.',
          'The dot is decorative; the word is the accessible name.',
          'Colour is never the only signal: Saved, Saving and Offline are distinct words.',
        ]}
        edges={[
          'A save that fails after Saving returns to Offline, never to Saved.',
          'Offline for an hour, then reconnect: one Saving state covers the whole queue.',
          'The project name truncates before the status; the status never wraps.',
          'Two panels on the same document show the same state.',
          'A read-only board shows no save state at all.',
        ]}
      />
    </Page>
  )
}

/* --------------------------------- Skeleton -------------------------------- */

const PULSE = 'animate-[petals-skeleton_1.2s_ease-in-out_infinite] motion-reduce:animate-none motion-reduce:opacity-[0.45]'

function Bar({ w, h = 8, className }: { w: number | string; h?: number; className?: string }) {
  return <span className={cn('block rounded-[3px] bg-[#2a2a2a]', PULSE, className)} style={{ width: w, height: h }} />
}

function PanelSkeleton() {
  return (
    <div className="w-[240px] overflow-hidden rounded-lg border border-[#27272f] bg-[#1c1c1c]">
      <div className="flex h-10 items-center gap-2 border-b border-[#27272f] px-3">
        <Bar w={86} h={8} />
        <Bar w={38} h={8} className="ml-auto" />
      </div>
      <div className="border-b border-[#27272f] px-3.5 py-3">
        <Bar w={48} h={7} />
        <div className="mt-3 space-y-2">
          {[72, 58, 64].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <Bar w={12} h={12} />
              <Bar w={`${w}%`} h={8} />
            </div>
          ))}
        </div>
      </div>
      <div className="px-3.5 py-3">
        <Bar w={58} h={7} />
        <div className="mt-3 space-y-2">
          {[64, 80, 52, 70].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <Bar w={12} h={12} />
              <Bar w={`${w}%`} h={8} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="w-[220px] rounded-[20px] border border-[#27272f] bg-[#141418] p-3">
      <Bar w="100%" h={104} className="rounded-xl" />
      <div className="px-0.5 pb-0.5 pt-3">
        <Bar w={118} h={10} />
        <Bar w={74} h={7} className="mt-2" />
      </div>
    </div>
  )
}

function SkeletonPage() {
  return (
    <Page
      title="Skeleton"
      lead="The shape of a panel before its content lands. Bars hold the layout still."
      spec
      meta="1.2s pulse · opacity only · static under reduced motion"
    >
      <style>{`@keyframes petals-skeleton { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>
      <Section title="Shapes" note="line · row · block">
        <Tiles
          min={170}
          items={[
            { label: 'line', note: '120 × 8', node: <Bar w={120} /> },
            {
              label: 'layer row',
              note: '26px',
              node: (
                <span className="flex items-center gap-2">
                  <Bar w={12} h={12} />
                  <Bar w={104} />
                </span>
              ),
            },
            { label: 'thumbnail', note: '160 × 80', node: <Bar w={160} h={80} className="rounded-lg" /> },
            {
              label: 'card text',
              note: 'two lines',
              node: (
                <span className="flex w-[160px] flex-col gap-2">
                  <Bar w="72%" h={10} />
                  <Bar w="46%" h={7} />
                </span>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Composition" note="panel + card">
        <Stage caption="A skeleton copies the layout it replaces: the same 240px panel, the same 26px rows, the same 220px card. Nothing jumps when the data arrives.">
          <div className="flex flex-wrap items-start gap-6">
            <PanelSkeleton />
            <CardSkeleton />
          </div>
        </Stage>
      </Section>

      <Section title="Motion" note="opacity, not travel">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'pulse', value: '1.2s ease-in-out', note: 'opacity only' },
            { name: 'opacity', value: '40% ↔ 80%', note: 'no gradient sweep' },
            { name: 'tone', value: '#2a2a2a', note: 'on #1c1c1c' },
            { name: 'radius', value: '3px / 8px', note: 'line / block' },
            { name: 'row', value: '26px', note: 'matches the layer row' },
            { name: 'reduced motion', value: 'static 45%', note: 'same layout' },
          ]}
        />
        <div className="mt-4">
          <Note>
            A gradient sweeping across the panel is a second moving surface in a product that
            already has a canvas. Pulse the opacity and leave the layout alone.
          </Note>
        </div>
      </Section>

      <Usage
        when="A panel, list or card that has a known shape but no data yet: a first load, a project opening, a layer list rebuilding after undo."
        rules={[
          'Draw the layout that is coming, not a generic stack of bars. A layer list gets layer rows.',
          'Pulse opacity only. No gradient sweep, no highlight travelling across the surface.',
          '1.2s ease-in-out, and the pulse is the only motion on screen.',
          'Respect prefers-reduced-motion: hold at 45% opacity and keep the layout.',
          'The skeleton keeps the height of the content it replaces so nothing jumps.',
          'Replace the whole block at once; do not fill rows in one at a time.',
        ]}
        checks={[
          'The skeleton is aria-hidden and the region carries aria-busy=true.',
          'A status line names what is loading; the bars are not the only message.',
          'With reduced motion the surface is static and still reads as a placeholder.',
        ]}
        edges={[
          'A load over 10s gets a status line, not a longer skeleton.',
          'An empty project gets the empty state, never a permanent skeleton.',
          'Content with a different row count resizes once; the skeleton does not promise a count.',
          'A failed load replaces the skeleton with an alert and a retry.',
        ]}
      />
    </Page>
  )
}

/* --------------------------------- Progress -------------------------------- */

function ProgressBar({
  value = 0,
  tone = 'neutral',
  indeterminate,
}: {
  value?: number
  tone?: 'neutral' | 'selection'
  indeterminate?: boolean
}) {
  const fill = tone === 'selection' ? 'bg-[#f472b6]' : 'bg-[#ececf1]'
  return (
    <span
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuetext={indeterminate ? 'Working' : `${value}%`}
      className="relative block h-0.5 w-full overflow-hidden rounded-full bg-white/10"
    >
      {indeterminate ? (
        <span
          className={cn(
            'absolute inset-y-0 left-0 w-1/3 rounded-full',
            fill,
            'animate-[petals-progress_1.4s_ease-in-out_infinite] motion-reduce:animate-none',
          )}
        />
      ) : (
        <span className={cn('absolute inset-y-0 left-0 rounded-full', fill)} style={{ width: `${value}%` }} />
      )}
    </span>
  )
}

function ProgressLabel({ label, right }: { label: string; right?: string }) {
  return (
    <span className="mb-2 flex items-baseline justify-between gap-3">
      <span className="min-w-0 truncate text-[11px] text-foreground/80">{label}</span>
      {right && <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{right}</span>}
    </span>
  )
}

function ProgressPage() {
  return (
    <Page
      title="Progress"
      lead="One bar, two pixels tall, for work the user is waiting on."
      spec
      meta="2px · determinate + indeterminate · neutral unless selection"
    >
      <style>{`@keyframes petals-progress { 0% { transform: translateX(-110%); } 100% { transform: translateX(310%); } }`}</style>

      <Section title="Styles" note="determinate first">
        <Tiles
          min={230}
          items={[
            {
              label: 'determinate',
              note: '62%',
              node: (
                <span className="block w-[180px]">
                  <ProgressLabel label="Exporting PNG" right="62%" />
                  <ProgressBar value={62} />
                </span>
              ),
            },
            {
              label: 'selection',
              note: '#f472b6',
              node: (
                <span className="block w-[180px]">
                  <ProgressLabel label="Applying to 12 layers" right="40%" />
                  <ProgressBar value={40} tone="selection" />
                </span>
              ),
            },
            {
              label: 'indeterminate',
              note: 'unknown total',
              node: (
                <span className="block w-[180px]">
                  <ProgressLabel label="Preparing frames" />
                  <ProgressBar indeterminate />
                </span>
              ),
            },
            {
              label: 'inline label',
              note: 'row',
              node: (
                <span className="flex w-[200px] items-center gap-3">
                  <span className="shrink-0 text-[11px] text-foreground/80">Uploading</span>
                  <span className="min-w-0 flex-1">
                    <ProgressBar value={75} />
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">6/8</span>
                </span>
              ),
            },
          ]}
        />
      </Section>

      <Section title="In place" note="export popover">
        <Stage caption="A 2px line under the work it describes. The label says what is being worked on; the percent is mono and trailing.">
          <div className="w-[300px] rounded-lg border border-[#27272f] bg-[#1a1a20] p-3 shadow-2xl shadow-black/50">
            <div className="text-[12px] font-medium text-foreground/90">Exporting 3 frames</div>
            <div className="mt-3 space-y-4">
              <div>
                <ProgressLabel label="Rendering PNG" right="62%" />
                <ProgressBar value={62} />
              </div>
              <div>
                <ProgressLabel label="Uploading images" right="2/8" />
                <ProgressBar indeterminate />
              </div>
              <div>
                <ProgressLabel label="Applying pattern to 12 layers" right="40%" />
                <ProgressBar value={40} tone="selection" />
              </div>
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'height', value: '2px', note: 'a line, not a block' },
            { name: 'track', value: 'white/10', note: 'radius full' },
            { name: 'fill', value: '#ececf1', note: 'neutral work' },
            { name: 'selection fill', value: '#f472b6', note: 'applying to a selection' },
            { name: 'indeterminate', value: '1.4s', note: 'one third of the track' },
            { name: 'label', value: '11px', note: 'above or inline' },
            { name: 'percent', value: '10px mono', note: 'trailing edge' },
          ]}
        />
      </Section>

      <Usage
        when="Waiting that has a shape: exporting frames, uploading images, applying a style to a selection. The bar sits under the work it describes, in the popover or panel that started it."
        rules={[
          '2px tall. A progress bar is a line, not a block.',
          'Determinate whenever the total is known; indeterminate only for an unknown wait.',
          'The label names the work, not “Loading”.',
          'Neutral white by default. Pink only when the work applies to the current selection.',
          'The percent sits at the trailing edge in mono and disappears for indeterminate work.',
          'Leave the bar in place when it completes; do not swap it for a checkmark.',
        ]}
        checks={[
          'role=progressbar with aria-valuemin, aria-valuemax and aria-valuenow; indeterminate omits valuenow.',
          'The label is programmatically associated with the bar.',
          'The fill and track both keep 3:1 against the panel behind them.',
        ]}
        edges={[
          'A failed export stops the bar and shows an alert with a retry.',
          'A 0% bar that sits for 10s becomes indeterminate with a status line.',
          'Work that finishes instantly does not flash the bar.',
          'At 200% zoom the bar stays 2px and the label wraps above it.',
        ]}
      />
    </Page>
  )
}

/* -------------------------------- Empty state ------------------------------- */

function PanelEmpty() {
  return (
    <div className="w-[240px] overflow-hidden rounded-lg border border-[#27272f] bg-[#1c1c1c]">
      <div className="flex h-9 items-center justify-between border-b border-[#27272f] px-3.5">
        <span className="text-[13px] font-semibold text-foreground/90">Pages</span>
        <Plus size={13} className="text-muted-foreground" />
      </div>
      <div className="flex flex-col items-center gap-2.5 px-6 py-8 text-center">
        <Flower size={28} className="text-[#4c2d43]" />
        <p className="text-[12px] leading-snug text-[#9a9aa4]">No pages yet — every board starts with one.</p>
        <Btn size="sm" variant="subtle">
          <Plus size={12} />
          New page
        </Btn>
      </div>
    </div>
  )
}

function GridEmpty() {
  return (
    <div className="flex w-full max-w-[480px] flex-col items-center gap-3 rounded-xl border border-dashed border-white/15 px-6 py-14 text-center">
      <Flower size={48} className="text-[#e063bb] opacity-80" />
      <p className="text-[13px] text-[#9a9aa4]">Your petals bloom here.</p>
      <Btn variant="white" size="sm">
        <Plus size={13} />
        Create your first project
      </Btn>
    </div>
  )
}

function EmptyStatePage() {
  return (
    <Page
      title="Empty state"
      lead="Nothing here yet, and one way forward. One sentence, one action."
      meta="240px panel · 480px grid · flower only"
    >
      <Section title="In a panel" note="240px wide">
        <Stage caption="The panel keeps its header and its + so the way back is never only the empty state's button. The copy stays under two lines at 240px.">
          <PanelEmpty />
        </Stage>
      </Section>

      <Section title="Empty grid" note="projects">
        <Stage caption="The projects grid draws a dashed shelf the size of the content that will fill it, with the flower mark as the only illustration.">
          <GridEmpty />
        </Stage>
      </Section>

      <Section title="Anatomy">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'panel copy', value: '12px', note: 'two lines at 240px' },
            { name: 'grid copy', value: '13px', note: 'one sentence' },
            { name: 'mark', value: '28px / 48px', note: 'flower only' },
            { name: 'panel padding', value: '24px 24px 32px', note: 'centred' },
            { name: 'grid border', value: '1px dashed white/15', note: 'not a shadow' },
            { name: 'action', value: '28px', note: 'one per state' },
          ]}
        />
      </Section>

      <Usage
        when="A surface that has no content because none exists yet: a board with no pages, a workspace with no projects, a layer list after everything is deleted."
        rules={[
          'One sentence and one action. The sentence says what is missing, not how the product works.',
          'No illustration unless it is the flower mark. No spot art, no empty box cartoon.',
          'The panel variant stays under two lines at 240px and never widens the panel.',
          'Keep the panel header and its + visible; the empty state is not the only way out.',
          'The action is the one primary action for that surface, or a quiet button inside chrome.',
          'Empty is not loading. Never show an empty state while a request is still open.',
        ]}
        checks={[
          'The action is a real button with a name that says what it creates.',
          'The state is announced once when it replaces a loading region, not on every render.',
          'The flower mark is decorative and aria-hidden; the sentence carries the meaning.',
        ]}
        edges={[
          'A search with no matches says “No pages match” and offers Clear search, not New page.',
          'A failed load shows an alert and a retry, never the empty state.',
          'The last page cannot be deleted, so the pages panel never reaches its empty state in the editor.',
          'At 240px a translated sentence wraps to four lines; the copy shortens before the panel grows.',
        ]}
      />
    </Page>
  )
}

/* ---------------------------------- Alert ---------------------------------- */

type AlertTone = 'info' | 'warning' | 'error'

const ALERT: Record<AlertTone, { box: string; icon: string }> = {
  info: { box: 'border-[#27272f] bg-[#1a1a20] text-[#b9b9c2]', icon: 'text-[#9a9aa4]' },
  warning: { box: 'border-[#f0c674]/20 bg-[#241d10] text-[#e8d3a3]', icon: 'text-[#f0c674]' },
  error: { box: 'border-[#ef4444]/25 bg-[#2b1416] text-[#f2b0b0]', icon: 'text-[#ef4444]' },
}

const ALERT_ICON: Record<AlertTone, ReactNode> = {
  info: <Info size={13} />,
  warning: <TriangleAlert size={13} />,
  error: <CircleAlert size={13} />,
}

function Alert({ tone, children, action }: { tone: AlertTone; children: string; action?: string }) {
  return (
    <div className={cn('flex items-start gap-2 rounded-lg border px-3 py-2.5 text-[12px] leading-relaxed', ALERT[tone].box)}>
      <span className={cn('mt-px shrink-0', ALERT[tone].icon)}>{ALERT_ICON[tone]}</span>
      <span className="min-w-0 flex-1">
        {children}
        {action && (
          <button type="button" className="ml-1 cursor-pointer font-medium text-foreground/90 underline decoration-white/25 underline-offset-2 hover:decoration-white/60">
            {action}
          </button>
        )}
      </span>
    </div>
  )
}

function AlertPage() {
  return (
    <Page
      title="Alert"
      lead="Something the user needs to read before acting. Inline, never a modal."
      meta="12px · 3 tones · one sentence"
    >
      <Section title="Tones" note="warning · error · info">
        <Tiles
          min={340}
          items={[
            {
              label: 'info',
              note: 'neutral',
              wide: true,
              node: <Alert tone="info">Undo holds 50 steps. Older edits are dropped.</Alert>,
            },
            {
              label: 'warning',
              note: 'amber',
              wide: true,
              node: (
                <Alert tone="warning" action="Learn more">
                  After Effects flattens AI/EPS to one image. Native keeps text and shape layers.
                </Alert>
              ),
            },
            {
              label: 'error',
              note: 'red',
              wide: true,
              node: <Alert tone="error">Export failed. The frame is unchanged.</Alert>,
            },
          ]}
        />
      </Section>

      <Section title="In place" note="export menu">
        <Stage caption="The warning sits under the export choices it qualifies, where the decision is made. It is not repeated in a dialog after the click.">
          <div className="w-[320px] rounded-lg border border-[#27272f] bg-[#1a1a20] p-1 shadow-2xl shadow-black/50">
            <div className="text-[10px] font-medium tracking-[0.02em] text-muted-foreground/60 px-2 pb-1 pt-1.5">
              Export frame
            </div>
            {[
              ['Native', 'editable text and shapes'],
              ['Layers', 'pixel-exact PNG stack'],
              ['SVG', 'vectors, no effects'],
            ].map(([label, sub], i) => (
              <div
                key={label}
                className={cn(
                  'flex h-8 items-center gap-2 rounded px-2 text-[12px]',
                  i === 0 ? 'bg-[#25252b] text-foreground' : 'text-foreground/75',
                )}
              >
                <span className="font-medium">{label}</span>
                <span className="ml-auto truncate text-[10px] text-muted-foreground">{sub}</span>
              </div>
            ))}
            <div className="p-1 pt-1.5">
              <Alert tone="warning" action="Learn more">
                After Effects flattens AI/EPS to one image. Native keeps text and shape layers.
              </Alert>
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'padding', value: '10px 12px', note: 'radius 8' },
            { name: 'text', value: '12px', note: 'one sentence' },
            { name: 'icon', value: '13px', note: 'aligned to line one' },
            { name: 'info', value: '#1a1a20', note: 'context' },
            { name: 'warning', value: '#241d10 · #f0c674', note: 'reversible caution' },
            { name: 'error', value: '#2b1416 · #ef4444', note: 'failed or lost work' },
            { name: 'action', value: 'Learn more', note: 'optional, inline' },
          ]}
        />
      </Section>

      <Usage
        when="A condition that changes what the next click will do: a format that loses layers, a file that failed to write, a limit the user just hit. Read it in place, next to the control."
        rules={[
          'Inline, in the surface where the decision happens. Never a modal for something readable in place.',
          'One sentence, 12px, one icon. The icon and the tone agree.',
          'Amber for a caution the user can accept; red only for a failure or lost work; neutral for context.',
          'The action is a link to more detail, not a second primary button.',
          'Never auto-dismiss an alert. It stays until the condition or the surface goes away.',
          'Do not repeat the same warning in the menu and again in a dialog after the click.',
        ]}
        checks={[
          'The alert is read in document order when the user reaches it; a result that appears after an action uses role=alert.',
          'The icon is decorative and the sentence is the message.',
          'Warning and error text keep 4.5:1 on their tinted surfaces.',
        ]}
        edges={[
          'A warning longer than two lines at 320px becomes a short sentence plus Learn more.',
          'An error after export keeps the export menu open and the frame unchanged.',
          'Two warnings in one surface collapse into the one that changes the decision.',
          'A translated warning never truncates; the surface grows vertically.',
        ]}
      />
    </Page>
  )
}

/* ---------------------------------- Toast ---------------------------------- */

type ToastItem = { id: number; text: string; action: string | null }

function Toast({
  text,
  action,
  onAction,
  onDismiss,
}: {
  text: string
  action?: string | null
  onAction?: () => void
  onDismiss?: () => void
}) {
  return (
    <div className="flex min-h-10 w-[320px] items-center gap-3 rounded-[10px] border border-white/[0.08] bg-[#232329] py-2 pl-3 pr-2 shadow-2xl shadow-black/50">
      <span title={text} className="min-w-0 flex-1 truncate text-[12px] text-foreground/90">
        {text}
      </span>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className={cn(
            'shrink-0 cursor-pointer text-[12px] font-medium',
            action === 'Undo' ? 'text-[#f472b6] hover:text-[#f472b6]/80' : 'text-foreground/80 hover:text-foreground',
          )}
        >
          {action}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-muted-foreground/70 hover:bg-white/5 hover:text-foreground"
      >
        <X size={12} />
      </button>
    </div>
  )
}

function ToastStackDemo() {
  const [items, setItems] = useState<ToastItem[]>([])
  const [paused, setPaused] = useState(false)
  const seq = useRef(0)

  const push = (text: string, action: string | null) => {
    seq.current += 1
    const item = { id: seq.current, text, action }
    setItems((v) => [...v.slice(-2), item])
  }
  const dismiss = (id: number) => setItems((v) => v.filter((t) => t.id !== id))

  useEffect(() => {
    if (paused || items.length === 0) return
    const t = setTimeout(() => setItems((v) => v.slice(1)), 4000)
    return () => clearTimeout(t)
  }, [items, paused])

  return (
    <div className="relative h-[320px] overflow-hidden bg-[#202024]">
      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
        <Btn size="sm" variant="subtle" onClick={() => push('Layer deleted.', 'Undo')}>
          Delete layer
        </Btn>
        <Btn size="sm" variant="subtle" onClick={() => push('Board published.', 'View')}>
          Publish
        </Btn>
        <Btn size="sm" variant="subtle" onClick={() => push('Export saved to Downloads.', null)}>
          Export
        </Btn>
      </div>
      {items.length === 0 && (
        <p className="absolute right-4 top-5 font-mono text-[10px] text-white/35">4s · pause on hover</p>
      )}
      <div className="absolute inset-x-0 bottom-[76px] flex justify-center px-4">
        <div
          className="flex w-[320px] flex-col gap-2"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {items.map((t) => (
            <Toast key={t.id} text={t.text} action={t.action} onAction={() => dismiss(t.id)} onDismiss={() => dismiss(t.id)} />
          ))}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-4 flex justify-center">
        <CanvasToolbar />
      </div>
    </div>
  )
}

function ToastPage() {
  return (
    <Page
      title="Toast"
      lead="A receipt for an action that just happened, above the toolbar."
      meta="320px · 4s · stack 3"
    >
      <Section title="Styles" note="one line">
        <Tiles
          min={372}
          items={[
            { label: 'message', note: 'no action', node: <Toast text="Export saved to Downloads." /> },
            { label: 'undo', note: 'pink text', node: <Toast text="Layer deleted." action="Undo" /> },
            { label: 'action', note: 'neutral', node: <Toast text="Board published." action="View" /> },
          ]}
        />
      </Section>

      <Section title="Stack" note="bottom centre, above the toolbar">
        <Stage pad={false} caption="Trigger three actions. The stack holds three, the oldest drops, and hovering or focusing the stack pauses the 4s clock.">
          <ToastStackDemo />
        </Stage>
      </Section>

      <Section title="Anatomy">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'width', value: '320px', note: 'one line' },
            { name: 'height', value: 'min 40px', note: 'padding 8px 12px' },
            { name: 'radius', value: '10px', note: 'floats' },
            { name: 'surface', value: '#232329', note: 'shadow 2xl black/50' },
            { name: 'text', value: '12px', note: 'truncates' },
            { name: 'action', value: '12px / 500', note: 'Undo is #f472b6' },
            { name: 'lifetime', value: '4000ms', note: 'paused on hover' },
            { name: 'stack', value: '3', note: 'newest at the bottom' },
          ]}
        />
      </Section>

      <Usage
        when="An action just completed and the surface that shows the result is not where the user is looking: a layer deleted with Undo, a board published, an export written to disk."
        rules={[
          'Bottom centre, 320px, one line, above the floating toolbar. Never top-right.',
          'Auto-dismiss after 4s; pause on hover and on focus so the action can be reached.',
          'Stack at most three. A fourth drops the oldest, not the newest.',
          'Confirmations that already have a receipt do not toast: copy, save state, inline rename.',
          'Undo is the only pink text in a toast. Every other action is neutral.',
          'A toast is not for errors that need a decision, and never for a destructive action without Undo.',
        ]}
        checks={[
          'The stack is a polite live region; each message is announced once.',
          'The action and dismiss buttons are reachable by keyboard before the 4s expires, because focus pauses it.',
          'The dismiss button has the name Dismiss, not an unlabelled X.',
        ]}
        edges={[
          'A 120-character message truncates and keeps the full string in its title.',
          'Ten rapid actions leave three toasts, not ten; the newest is visible.',
          'An undo that fails replaces the toast with an alert, never a second toast.',
          'With reduced motion the toast appears without sliding and still dismisses in 4s.',
          'A toast triggered while the tab is hidden waits for the tab to be visible.',
        ]}
      />
    </Page>
  )
}

export const feedbackPages: Record<string, ComponentType> = {
  'components/status': StatusPage,
  'components/skeleton': SkeletonPage,
  'components/progress': ProgressPage,
  'components/empty-state': EmptyStatePage,
  'components/alert': AlertPage,
  'components/toast': ToastPage,
}
