import { useEffect, useRef, useState } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  ChevronDown,
  Circle,
  Copy,
  Frame,
  Loader2,
  MousePointer2,
  PenTool,
  Plus,
  Redo2,
  Square,
  SquareDashed,
  Type,
  Undo2,
} from 'lucide-react'
import type { ComponentType } from 'react'
import { Page, Section, Stage, Tiles, Usage, Rows, Note } from '../Doc'
import { Btn, CanvasToolbar, Kbd } from '../bits'

/* ---------------------------------- Button --------------------------------- */

function ButtonPage() {
  const [pending, setPending] = useState(false)
  return (
    <Page
      title="Button"
      lead="Starts an action. One pink button per surface, everything else is quiet."
      meta="5 variants · 4 sizes · 5 states"
    >
      <Section title="Styles" note="variant">
        <Tiles
          items={[
            { label: 'primary', note: 'default', node: <Btn variant="primary">Add to canvas</Btn> },
            { label: 'solid', note: 'solid', node: <Btn variant="outline" className="bg-foreground text-background hover:bg-foreground/90 border-transparent">Publish</Btn> },
            { label: 'outline', note: 'outline', node: <Btn variant="outline">Not now</Btn> },
            { label: 'ghost', note: 'ghost', node: <Btn variant="ghost">Retry</Btn> },
            { label: 'subtle', note: 'subtle', node: <Btn variant="subtle">Duplicate</Btn> },
          ]}
        />
      </Section>

      <Section title="Sizes" note="height">
        <Tiles
          min={132}
          items={[
            { label: 'sm', note: '28px', node: <Btn size="sm" variant="subtle">Choose image</Btn> },
            { label: 'default', note: '32px', node: <Btn variant="subtle">Export</Btn> },
            { label: 'lg', note: '40px', node: <Btn size="lg" variant="primary">Try out</Btn> },
            { label: 'icon-sm', note: '24px', node: <Btn size="icon" variant="ghost" title="Undo"><Undo2 size={13} /></Btn> },
            { label: 'icon', note: '28px', node: <Btn size="icon" variant="ghost" title="Redo"><Redo2 size={14} /></Btn> },
            { label: 'icon-lg', note: '32px', node: <Btn size="lg" className="!size-8 !px-0" variant="subtle" title="Add"><Plus size={14} /></Btn> },
          ]}
        />
      </Section>

      <Section title="States" note="highest wins: pending → disabled → focus → hover">
        <Tiles
          min={146}
          items={[
            { label: 'rest', node: <Btn variant="subtle">Duplicate</Btn> },
            { label: 'hover', node: <Btn variant="subtle" className="!bg-[#333333]">Duplicate</Btn> },
            { label: 'focus', node: <Btn variant="subtle" className="ring-2 ring-[#52525b]/80">Duplicate</Btn> },
            { label: 'disabled', node: <Btn variant="subtle" disabled>Duplicate</Btn> },
            {
              label: 'pending',
              node: (
                <Btn variant="primary" onClick={() => setPending((v) => !v)}>
                  {pending ? <Loader2 size={13} className="animate-spin" /> : null}
                  {pending ? 'Saving' : 'Save'}
                </Btn>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one button">
        <Rows
          head={['Property', 'Value', 'Applies to']}
          items={[
            { name: 'height', value: '28 / 32 / 40px', note: 'sm / default / lg' },
            { name: 'padding', value: '10 / 12 / 20px', note: 'horizontal' },
            { name: 'radius', value: '6px (rounded-md)', note: 'all sizes' },
            { name: 'gap', value: '6px', note: 'icon → label' },
            { name: 'font', value: '13px / 500', note: 'Geist' },
            { name: 'primary', value: '#f472b6 · text #2b0a1c', note: 'selection pink' },
            { name: 'focus ring', value: '2px #52525b', note: 'never pink' },
          ]}
        />
        <div className="mt-4">
          <Note>
            Pink marks the one action that moves the document forward — add, publish, export. A panel
            with two pink buttons has no primary action.
          </Note>
        </div>
      </Section>

      <Usage
        when="An action that changes the document, opens a surface, or leaves the current screen. Use a button when the result is immediate; use a menu item when the action needs a name and a keyboard shortcut."
        rules={[
          'One primary button per surface. It is the action the screen exists for.',
          'Label with a verb in sentence case — Add to canvas, Export, Choose image. Never OK.',
          'Icon-only buttons always carry a tooltip and an aria-label.',
          'A destructive action never gets the pink; it uses #ef4444 and confirms first.',
          'Pending disables the button and keeps its width — swap the label, do not reflow the row.',
          'Shortcuts go in the tooltip, not in the label.',
        ]}
        checks={[
          'Reachable and operable with Tab and Enter/Space.',
          'Focus ring is visible on the black page and on #2b2b2b fields.',
          'Disabled buttons use aria-disabled and stay out of the tab order only when the action is truly unavailable.',
          'An icon-only button has an accessible name that matches its tooltip.',
        ]}
        edges={[
          'A long label truncates at the panel edge with the icon still visible.',
          'Pending state longer than 10s becomes a failure toast with a retry.',
          'Double click must not fire the action twice — the first press latches pending.',
          'A disabled button with a tooltip explains why it is disabled rather than hiding the tooltip.',
        ]}
      />
    </Page>
  )
}

/* --------------------------------- Toolbar --------------------------------- */

function ToolbarPage() {
  return (
    <Page
      title="Toolbar"
      lead="The floating instrument row: 46px over the canvas, tools first, library and history last."
      meta="46px · radius 16 · 16px above the edge"
    >
      <Section title="States" note="tool">
        <Tiles
          min={280}
          items={[
            {
              label: 'default',
              note: 'select active',
              wide: true,
              node: (
                <div className="flex w-full justify-center rounded-lg bg-[#424242] py-10">
                  <CanvasToolbar active="select" />
                </div>
              ),
            },
            {
              label: 'tool active',
              note: 'rect',
              wide: true,
              node: (
                <div className="flex w-full justify-center rounded-lg bg-[#3a3a3a] py-10">
                  <CanvasToolbar active="rect" />
                </div>
              ),
            },
            {
              label: 'frame presets',
              note: 'menu above the bar',
              node: (
                <div className="flex w-full flex-col items-center gap-2 py-2">
                  <div className="w-[256px] rounded-xl border border-border bg-[#1a1a20] p-1.5 shadow-2xl">
                    <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] text-foreground">
                      <SquareDashed size={14} className="text-muted-foreground" />
                      <span className="flex-1">Frame</span>
                      <span className="text-[11px] text-muted-foreground">drag to draw</span>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        ['Desktop', '1440 × 900'],
                        ['Laptop', '1280 × 800'],
                        ['Mobile', '390 × 844'],
                        ['Square', '1080 × 1080'],
                      ].map(([name, size]) => (
                        <span key={name} className="flex flex-col gap-0.5 rounded-lg bg-[#232329] px-2 py-1.5">
                          <span className="text-[11px] text-foreground/85">{name}</span>
                          <span className="font-mono text-[9px] text-muted-foreground/60">{size}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <CanvasToolbar active="frame" />
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Anatomy">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'height', value: '46px', note: '32px tools + 12px padding + border' },
            { name: 'surface', value: '#1a1a20 / 95', note: 'popover tone over the canvas' },
            { name: 'radius', value: '16px', note: 'rounded-2xl, not a pill' },
            { name: 'tool', value: '32px · radius 8', note: 'icon 15, active pink fill' },
            { name: 'divider', value: '1px #27272f', note: '20px tall, mx 4' },
            { name: 'menu', value: '256px · radius 12', note: 'frame presets, above the bar' },
            { name: 'position', value: '16px above the edge', note: 'centred on the viewport' },
            { name: 'shadow', value: '2xl black/50', note: 'the one floating surface' },
          ]}
        />
      </Section>

      <Usage
        when="The canvas is open and the user needs tools, the library, or undo without leaving the board. It is the only navigation the editor keeps on screen."
        rules={[
          'Tools on the left, library and history on the right, separated by one hairline.',
          'The active tool is shown by a filled pink chip, not by colour alone — the icon stays visible.',
          'Never add text labels to the floating toolbar; the tooltip carries the name and shortcut.',
          'The bar stays centred 16px above the bottom edge, never inside a panel.',
          'The frame-preset caret belongs to the frame button and never opens on hover.',
          'Undo and redo stay present at 30% when there is nothing to undo.',
        ]}
        checks={[
          'Each tool is a button with an accessible name and a pressed state.',
          'The frame menu returns focus to its trigger on Escape and closes on an outside press.',
          'Keyboard shortcuts are announced in the tooltip in parentheses.',
        ]}
        edges={[
          'With no history, undo and redo disable instead of disappearing; the row keeps its width.',
          'Hiding a side panel must not move the toolbar — it centres on the viewport.',
          'On touch, the hit area grows to 36px without changing the visual size.',
          'The library panel opens above the bar and keeps 16px clearance from it.',
        ]}
      />
    </Page>
  )
}

/* -------------------------------- CopyButton ------------------------------- */

function CopyButtonPage() {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), [])
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1200)
  }
  return (
    <Page
      title="Copy button"
      lead="One value, one click, no confirmation dialog. The icon becomes a check for a breath."
      meta="24px icon target · 1200ms confirmation"
    >
      <Section title="Styles" note="variant">
        <Tiles
          items={[
            {
              label: 'icon',
              note: 'ghost',
              node: (
                <Btn size="icon" variant="ghost" onClick={() => copy('#f472b6')} title="Copy hex">
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </Btn>
              ),
            },
            {
              label: 'icon on field',
              note: 'subtle',
              node: (
                <span className="flex h-7 items-center gap-2 rounded-md bg-[#2b2b2b] pl-2 pr-0.5 font-mono text-[11px] uppercase text-foreground/80">
                  F472B6
                  <button
                    onClick={() => copy('#F472B6')}
                    aria-label="Copy hex"
                    className="flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </span>
              ),
            },
            {
              label: 'with label',
              note: 'sm',
              node: (
                <Btn size="sm" variant="outline" onClick={() => copy('petals')}>
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy link'}
                </Btn>
              ),
            },
          ]}
        />
      </Section>

      <Section title="States" note="no disabled state">
        <Tiles
          items={[
            { label: 'rest', node: <Copy size={14} className="text-muted-foreground" /> },
            { label: 'hover', node: <span className="flex size-7 items-center justify-center rounded bg-white/5"><Copy size={14} className="text-foreground" /></span> },
            { label: 'copied', node: <Check size={14} className="text-[#f472b6]" /> },
          ]}
        />
      </Section>

      <Usage
        when="A short, exact value the user will paste elsewhere: a hex, a token name, a node id, a link. Not for copying a whole document — that belongs in the export menu."
        rules={[
          'Copy the value without decoration: no labels, quotes or trailing whitespace.',
          'Swap the icon, never the layout — the button keeps its box.',
          'The confirmation lasts 1.2s and then returns on its own.',
          'Never open a toast for a copy; the icon is the receipt.',
          'Copy buttons sit at the trailing edge of the field or row they belong to.',
        ]}
        checks={[
          'The button has an accessible name that changes to “Copied” while confirmed.',
          'A screen reader hears the confirmation through a polite live region.',
        ]}
        edges={[
          'Clipboard permission denied: keep the value selected and say “Press ⌘C to copy”.',
          'Copying the same value again retriggers the confirmation.',
          'A long value still copies whole even when the field truncates it.',
        ]}
      />
    </Page>
  )
}

/* -------------------------------- ButtonGroup ------------------------------ */

function ButtonGroupPage() {
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left')
  return (
    <Page
      title="Button group"
      lead="A row of actions that share one job. One box, many choices — not a pile of buttons."
      spec
      meta="28px · 6px radius · joined edges"
    >
      <Section title="Styles" note="variant">
        <Tiles
          min={220}
          items={[
            {
              label: 'attached',
              note: 'segmented',
              node: (
                <div className="flex items-center rounded-md bg-[#262626] p-0.5">
                  {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([v, I]) => (
                    <button
                      key={v}
                      aria-label={`Align ${v}`}
                      aria-pressed={align === v}
                      onClick={() => setAlign(v)}
                      className={
                        'flex size-7 cursor-pointer items-center justify-center rounded ' +
                        (align === v ? 'bg-[#353535] text-foreground' : 'text-muted-foreground/70 hover:text-foreground')
                      }
                    >
                      <I size={13} />
                    </button>
                  ))}
                </div>
              ),
            },
            {
              label: 'split',
              note: 'action + menu',
              node: (
                <div className="flex items-center">
                  <Btn variant="subtle" className="!rounded-r-none">Duplicate</Btn>
                  <span className="h-7 w-px bg-black/30" />
                  <Btn variant="subtle" size="icon" className="!w-7 !rounded-l-none" title="More"><ChevronDown size={12} /></Btn>
                </div>
              ),
            },
            {
              label: 'cluster',
              note: 'ghost',
              node: (
                <div className="flex items-center gap-0.5 rounded-md bg-[#262626] p-0.5">
                  <Btn variant="ghost" size="icon" title="Select"><MousePointer2 size={13} /></Btn>
                  <Btn variant="ghost" size="icon" title="Frame"><Frame size={13} /></Btn>
                  <Btn variant="ghost" size="icon" title="Rectangle"><Square size={13} /></Btn>
                  <Btn variant="ghost" size="icon" title="Ellipse"><Circle size={13} /></Btn>
                  <Btn variant="ghost" size="icon" title="Text"><Type size={13} /></Btn>
                  <Btn variant="ghost" size="icon" title="Pen"><PenTool size={13} /></Btn>
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Usage
        when="Two to five related actions that read as one control: alignment, view switches, an action with its own menu. If the actions are unrelated, they are buttons, spaced apart."
        rules={[
          'One group, one surface. Do not nest a group inside a group.',
          'Selected state is a filled chip; unselected stays quiet.',
          "The split group's chevron opens a menu, it never performs the main action.",
          'Keep labels out of joined icon groups — the tooltip names each item.',
          'Groups do not exceed five items; past that use a menu.',
        ]}
        checks={[
          'The group exposes role=group with a label when more context is needed.',
          'Arrow keys move between items in a segmented group, Tab leaves it.',
          'Every icon item has its own accessible name.',
        ]}
        edges={[
          'A group with one available action collapses to a single button.',
          'Wrapping is never allowed — shrink the labels or move to a menu at narrow widths.',
          'Disabled items stay in the group with 45% opacity; the group does not reflow.',
        ]}
      />
    </Page>
  )
}

export const actionPages: Record<string, ComponentType> = {
  'components/button': ButtonPage,
  'components/toolbar': ToolbarPage,
  'components/copy-button': CopyButtonPage,
  'components/button-group': ButtonGroupPage,
}
