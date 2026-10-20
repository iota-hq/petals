import { useEffect, useRef, useState } from 'react'
import type { ComponentType, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  Command as CommandIcon,
  FileText,
  Frame,
  Image as ImageIcon,
  Layers,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { Hint } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Page, Section, Stage, Tiles, Usage, Rows, Note } from '../Doc'
import { Kbd, LayerRow, Swatch } from '../bits'

/* ----------------------------------------------------------------------------
 * A board behind the overlays. Document content, so it may hold colour; the
 * chrome on top of it stays on the palette.
 * ------------------------------------------------------------------------- */
function MockBoard({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('relative overflow-hidden bg-[#3a3a3a]', className)}>
      <div className="absolute left-7 top-7 h-[92px] w-[124px] rounded-sm bg-[#f4f4f5] p-2.5">
        <div className="h-1.5 w-12 rounded-full bg-black/70" />
        <div className="mt-2 h-1 w-16 rounded-full bg-black/25" />
        <div className="mt-1 h-1 w-10 rounded-full bg-black/25" />
      </div>
      <div className="absolute left-[190px] top-12 h-[104px] w-[86px] rounded-sm bg-[#ded7f2]" />
      <div className="absolute left-10 top-[150px] size-16 rounded-full bg-[#f3cfe2]" />
      <div className="absolute left-[170px] top-[170px] h-14 w-24 rounded-sm bg-[#cfd6ea]" />
    </div>
  )
}

/* ---------------------------------- Dialog --------------------------------- */

function DialogCard({
  onCancel,
  onConfirm,
}: {
  onCancel?: () => void
  onConfirm?: () => void
}) {
  return (
    <div
      role="alertdialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
      className="w-[380px] max-w-full rounded-lg border border-[#27272f] bg-[#141418] p-4 shadow-2xl shadow-black/60"
    >
      <div id="confirm-title" className="text-[14px] font-medium tracking-[0.01em] text-foreground">
        Delete board?
      </div>
      <p id="confirm-body" className="mt-1.5 text-[12.5px] leading-relaxed text-[#9a9aa4]">
        “Q4 launch” and its 4 pages will be removed. This cannot be undone.
      </p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-8 cursor-pointer items-center rounded-md border border-border px-3 text-[12.5px] font-medium text-foreground transition-colors hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex h-8 cursor-pointer items-center rounded-md bg-[#ef4444] px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-[#ef4444]/90"
        >
          Delete board
        </button>
      </div>
    </div>
  )
}

function ConfirmDemo() {
  const [open, setOpen] = useState(true)
  const cardRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const mounted = useRef(false)

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    if (mounted.current) cardRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    mounted.current = true
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
        return
      }
      if (e.key !== 'Tab') return
      const buttons = Array.from(cardRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
      if (buttons.length < 2) return
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (!cardRef.current?.contains(document.activeElement)) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open])

  return (
    <div className="relative h-[340px] w-full overflow-hidden rounded-lg">
      <MockBoard className="absolute inset-0" />
      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-[#232329] py-1 pl-2.5 pr-1 shadow-lg ring-1 ring-white/[0.06]">
        <Frame size={12} className="text-muted-foreground/70" />
        <span className="text-[11.5px] text-foreground/85">Q4 launch</span>
        <button
          ref={triggerRef}
          type="button"
          title="Delete board"
          aria-label="Delete board"
          onClick={() => setOpen(true)}
          className="flex size-7 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
        >
          <Trash2 size={12} />
        </button>
      </div>
      {open && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 backdrop-blur-[2px]"
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div ref={cardRef} onPointerDown={(e) => e.stopPropagation()}>
            <DialogCard onCancel={close} onConfirm={close} />
          </div>
        </div>
      )}
    </div>
  )
}

function DialogPage() {
  return (
    <Page
      title="Dialog"
      lead="Asks before it removes. A stop for what undo cannot take back, not an edit."
      meta="380px · 2 states · alertdialog"
    >
      <Section title="States" note="rest → open">
        <Tiles
          items={[
            {
              label: 'rest',
              note: 'the board toolbar',
              wide: true,
              node: (
                <div className="relative h-[120px] w-full overflow-hidden rounded-lg">
                  <MockBoard className="absolute inset-0" />
                  <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-[#232329] py-1 pl-2.5 pr-1 shadow-lg ring-1 ring-white/[0.06]">
                    <Frame size={12} className="text-muted-foreground/70" />
                    <span className="text-[11.5px] text-foreground/85">Q4 launch</span>
                    <span className="flex size-7 items-center justify-center rounded text-muted-foreground">
                      <Trash2 size={12} />
                    </span>
                  </div>
                </div>
              ),
            },
            { label: 'open', note: 'Esc or outside cancels · then Delete board', wide: true, node: <ConfirmDemo /> },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one card, two buttons">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'width', value: '380px', note: 'viewport minus 32px at most' },
            { name: 'surface', value: '#141418', note: 'one step above the scrim' },
            { name: 'radius', value: '8px', note: 'no pill' },
            { name: 'padding', value: '16px', note: 'all sides' },
            { name: 'title', value: '14px / 500', note: 'names the object' },
            { name: 'body', value: '12.5px · #9a9aa4', note: 'one paragraph' },
            { name: 'actions', value: '32px · gap 8px · right', note: 'Cancel, then the verb' },
            { name: 'danger', value: '#ef4444 · text white', note: 'never pink' },
            { name: 'scrim', value: 'black/70 + 2px blur', note: 'blocks the canvas' },
            { name: 'focus', value: '2px #52525b', note: 'Cancel on open' },
          ]}
        />
        <div className="mt-4">
          <Note>
            A property edit applies live and undo holds it. If a change needs a dialog, it is an action, not
            an edit.
          </Note>
        </div>
      </Section>

      <Usage
        when="Before an action undo cannot restore: deleting a board or a page, discarding unsaved changes, leaving a flow. The user must be able to name what will disappear."
        rules={[
          'Only for irreversible actions. Everything undo covers applies without a dialog.',
          'The title names the object and is a question: Delete board? Delete page?',
          'One body sentence with the count and the consequence. No second paragraph, no checkbox.',
          'Two buttons only: Cancel in outline, then the destructive verb in #ef4444. Never pink.',
          'Open with focus on Cancel. Escape, a click outside and Cancel all dismiss.',
          'One dialog at a time; a second request resolves the first as cancelled.',
        ]}
        checks={[
          'role="alertdialog" with aria-labelledby on the title and aria-describedby on the body.',
          'Focus moves to Cancel on open, stays inside the card, and returns to the trigger on close.',
          'Escape cancels; focus never escapes behind the scrim.',
          'The red button meets 4.5:1 against #141418, and its label carries the meaning, not the colour.',
        ]}
        keys={[
          'Escape — cancel and return focus',
          'Tab / Shift+Tab — cycle between Cancel and Delete',
          'Enter — activate the focused button only',
        ]}
        edges={[
          'A long board name wraps in the body, never in the title.',
          'A delete that fails after the dialog closes returns the board and opens an error toast with retry.',
          'A second delete request while one is open resolves the first as cancelled.',
          'Triggered from a menu, the menu closes before the dialog opens; the dialog is never stacked on it.',
          'Below 412px the card is the viewport minus 32px, never wider.',
        ]}
      />
    </Page>
  )
}

/* ----------------------------------- Sheet --------------------------------- */

type AssetTab = 'patterns' | 'logos' | 'icons'

const ASSETS: Record<AssetTab, Array<{ name: string; image: string; size?: string }>> = {
  patterns: [
    { name: 'Dots', image: 'radial-gradient(#f472b6 1px, transparent 1px)', size: '8px 8px' },
    { name: 'Lines', image: 'repeating-linear-gradient(45deg, #4b4b57 0 1px, transparent 1px 7px)' },
    { name: 'Grid', image: 'linear-gradient(#3f3f46 1px, transparent 1px), linear-gradient(90deg, #3f3f46 1px, transparent 1px)', size: '10px 10px' },
    { name: 'Waves', image: 'repeating-radial-gradient(circle at 0 0, transparent 0 6px, #4b4b57 6px 7px)' },
    { name: 'Checks', image: 'repeating-conic-gradient(#2b2b33 0 25%, #1c1c22 0 50%)', size: '12px 12px' },
    { name: 'Halftone', image: 'radial-gradient(#7c3aed 1.5px, transparent 1.5px)', size: '7px 7px' },
  ],
  logos: [
    { name: 'Petal', image: 'radial-gradient(circle at 50% 50%, #f472b6 0 32%, transparent 33%), #1f1f25' },
    { name: 'Orbit', image: 'radial-gradient(circle at 50% 50%, transparent 0 38%, #9a9aa4 39% 44%, transparent 45%), #1f1f25' },
    { name: 'Block', image: 'linear-gradient(135deg, #ececf1 0 45%, transparent 45%), #1f1f25' },
    { name: 'Arch', image: 'radial-gradient(circle at 50% 100%, #ececf1 0 48%, transparent 49%), #1f1f25' },
    { name: 'Stack', image: 'repeating-linear-gradient(0deg, #ececf1 0 4px, transparent 4px 10px)', size: '100% 40%' },
  ],
  icons: [
    { name: 'Frame', image: 'linear-gradient(#9a9aa4, #9a9aa4) center / 14px 1px no-repeat, linear-gradient(#9a9aa4, #9a9aa4) center / 1px 14px no-repeat, #1f1f25' },
    { name: 'Circle', image: 'radial-gradient(circle, transparent 0 5px, #9a9aa4 5px 6px, transparent 6px)', size: '100% 100%' },
    { name: 'Arrow', image: 'linear-gradient(45deg, transparent 46%, #9a9aa4 46% 54%, transparent 54%)', size: '60% 60%' },
    { name: 'Grid', image: 'linear-gradient(#9a9aa4 1px, transparent 1px), linear-gradient(90deg, #9a9aa4 1px, transparent 1px)', size: '8px 8px' },
    { name: 'Type', image: 'linear-gradient(#ececf1, #ececf1) center / 10px 1px no-repeat, linear-gradient(#ececf1, #ececf1) center / 1px 14px no-repeat, #1f1f25' },
  ],
}

const ASSET_TABS: Array<{ id: AssetTab; label: string }> = [
  { id: 'patterns', label: 'Patterns' },
  { id: 'logos', label: 'Logos' },
  { id: 'icons', label: 'Icons' },
]

function AssetLibrary() {
  const [tab, setTab] = useState<AssetTab>('patterns')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(true)
  const [picked, setPicked] = useState<string | null>(null)
  const [width, setWidth] = useState(256)
  const [resizing, setResizing] = useState(false)
  const drag = useRef<{ x: number; w: number } | null>(null)

  const visible = ASSETS[tab].filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="relative h-[380px] w-full overflow-hidden rounded-lg bg-[#3a3a3a]">
      <MockBoard className="absolute inset-0" />
      {open && <div className="absolute inset-0 bg-black/45" />}
      {open ? (
        <aside
          aria-label="Asset library"
          className="absolute right-0 top-0 z-10 flex h-full flex-col border-l border-[#27272f] bg-[#141418]/90 backdrop-blur-xl"
          style={{ width }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
          }}
        >
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize asset library"
            aria-valuenow={width}
            aria-valuemin={220}
            aria-valuemax={340}
            tabIndex={0}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              drag.current = { x: e.clientX, w: width }
              setResizing(true)
            }}
            onPointerMove={(e) => {
              if (!drag.current) return
              setWidth(Math.max(220, Math.min(340, drag.current.w - (e.clientX - drag.current.x))))
            }}
            onPointerUp={() => {
              drag.current = null
              setResizing(false)
            }}
            onPointerCancel={() => {
              drag.current = null
              setResizing(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault()
                setWidth((w) => Math.min(340, w + 8))
              }
              if (e.key === 'ArrowRight') {
                e.preventDefault()
                setWidth((w) => Math.max(220, w - 8))
              }
            }}
            className="group absolute -left-1 top-0 h-full w-2 cursor-col-resize touch-none outline-none"
          >
            <span className="absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/15 transition-colors group-hover:bg-white/35" />
          </div>

          <div className="flex h-9 shrink-0 items-center gap-2 border-b border-[#27272f] px-3">
            <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-foreground/90">Assets</span>
            {resizing && (
              <span className="font-mono text-[10px] text-muted-foreground/60">{width}px</span>
            )}
            <button
              type="button"
              aria-label="Close assets"
              onClick={() => setOpen(false)}
              className="flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground/70 hover:bg-white/5 hover:text-foreground"
            >
              <X size={12} />
            </button>
          </div>

          <div role="tablist" aria-label="Asset type" className="flex h-9 shrink-0 items-center gap-4 border-b border-[#27272f] px-3">
            {ASSET_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative h-9 cursor-pointer text-[12px] transition-colors',
                  tab === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80',
                )}
              >
                {t.label}
                <span className="ml-1 font-mono text-[10px] text-muted-foreground/50">{ASSETS[t.id].length}</span>
                {tab === t.id && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-foreground" />}
              </button>
            ))}
          </div>

          <div className="shrink-0 p-2.5">
            <label className="flex h-7 items-center gap-1.5 rounded-md bg-[#2b2b2b] px-2 focus-within:ring-2 focus-within:ring-[#52525b]/70">
              <Search size={12} className="shrink-0 text-muted-foreground/70" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search assets"
                aria-label="Search assets"
                className="min-w-0 flex-1 bg-transparent text-[12px] text-foreground/90 outline-none placeholder:text-muted-foreground/50"
              />
            </label>
          </div>

          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2.5 pb-2.5">
            {visible.length === 0 ? (
              <p className="px-1 py-6 text-center text-[11.5px] text-muted-foreground/60">
                No assets match “{query}”.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {visible.map((a) => (
                  <button
                    key={a.name}
                    type="button"
                    aria-pressed={picked === a.name}
                    onClick={() => setPicked(a.name)}
                    className={cn(
                      'group cursor-pointer overflow-hidden rounded-md border border-[#27272f] text-left transition-colors hover:border-white/25',
                      picked === a.name && 'ring-2 ring-[#f472b6]',
                    )}
                  >
                    <span
                      className="block h-14 w-full"
                      style={{ backgroundImage: a.image, backgroundSize: a.size ?? 'auto', backgroundColor: '#1f1f25' }}
                    />
                    <span className="block truncate px-1.5 py-1 text-[10.5px] text-foreground/70 group-hover:text-foreground">
                      {a.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex h-7 shrink-0 items-center justify-between border-t border-[#27272f] px-3 font-mono text-[10px] text-muted-foreground/50">
            <span>{visible.length} assets</span>
            <span>{picked ?? 'none selected'}</span>
          </div>
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute right-3 top-3 flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-[#232329] px-3 text-[11.5px] text-foreground/85 shadow-lg ring-1 ring-white/[0.06] hover:bg-[#2b2b31]"
        >
          <ImageIcon size={13} />
          Assets
        </button>
      )}
    </div>
  )
}

const LEFT_LAYERS = ['Cover', 'Hero', 'Nav / logo', 'Pricing card', 'Footer']

function LeftSheet() {
  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-lg bg-[#3a3a3a]">
      <MockBoard className="absolute inset-0" />
      <div className="absolute inset-0 bg-black/40" />
      <aside className="absolute left-0 top-0 z-10 flex h-full w-[240px] flex-col border-r border-[#27272f] bg-[#141418]/95 backdrop-blur-xl">
        <div className="flex h-9 items-center gap-2 border-b border-[#27272f] px-3">
          <span className="flex-1 text-[12px] font-semibold text-foreground/90">Layers</span>
          <X size={12} className="text-muted-foreground/60" />
        </div>
        <div className="flex h-9 items-center gap-3 border-b border-[#27272f] px-3 text-[12px]">
          <span className="text-muted-foreground">Pages</span>
          <span className="relative text-foreground">
            Layers
            <span className="absolute inset-x-0 -bottom-[10px] h-[2px] bg-foreground" />
          </span>
        </div>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-1.5">
          {LEFT_LAYERS.map((name, i) => (
            <LayerRow
              key={name}
              name={name}
              depth={i === 2 || i === 3 ? 1 : 0}
              active={i === 1}
              icon={i < 2 ? <Frame size={12} /> : <Layers size={12} />}
            />
          ))}
        </div>
        <div className="flex h-7 items-center border-t border-[#27272f] px-3 font-mono text-[10px] text-muted-foreground/50">
          12 layers
        </div>
      </aside>
    </div>
  )
}

function SheetPage() {
  return (
    <Page
      title="Sheet"
      lead="Slides in from an edge for one task, over the canvas. It leaves when the task is done."
      meta="256px · 3 states · right or left edge"
    >
      <Section title="Placement" note="edge · width">
        <Stage
          pad={false}
          caption="Asset library over the canvas. The scrim is there because the sheet blocks the board; drag the left edge or use ← → to resize."
        >
          <div className="p-4">
            <AssetLibrary />
          </div>
        </Stage>
        <div className="mt-2.5">
          <Tiles
            items={[
              {
                label: 'left · layers on mobile',
                note: '240px',
                wide: true,
                node: <LeftSheet />,
              },
              {
                label: 'closed',
                note: 'edge trigger',
                wide: true,
                node: (
                  <div className="relative h-[120px] w-full overflow-hidden rounded-lg bg-[#3a3a3a]">
                    <MockBoard className="absolute inset-0" />
                    <div className="absolute inset-y-0 right-0 flex w-14 items-center justify-center border-l border-white/10 bg-[#141418]/80">
                      <span className="flex h-8 items-center gap-1.5 rounded-full bg-[#232329] px-3 text-[11.5px] text-foreground/85 ring-1 ring-white/[0.06]">
                        <ImageIcon size={13} />
                        Assets
                      </span>
                    </div>
                  </div>
                ),
              },
              {
                label: 'resizing',
                note: '220–340px',
                wide: true,
                node: (
                  <div className="relative h-[140px] w-full overflow-hidden rounded-lg bg-[#3a3a3a]">
                    <MockBoard className="absolute inset-0" />
                    <div className="absolute inset-0 bg-black/45" />
                    <div className="absolute inset-y-0 right-0 w-[256px] border-l border-[#27272f] bg-[#141418]/90 backdrop-blur-xl">
                      <div className="absolute -left-1 top-0 h-full w-2 cursor-col-resize">
                        <span className="absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/35" />
                      </div>
                      <div className="flex h-9 items-center justify-between border-b border-[#27272f] px-3">
                        <span className="text-[12px] font-semibold text-foreground/90">Assets</span>
                        <span className="rounded bg-[#2b2b2b] px-1.5 py-0.5 font-mono text-[10px] text-foreground/80">
                          256px
                        </span>
                      </div>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </Section>

      <Section title="Anatomy" note="one panel, one edge">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'width', value: '256px (220–340)', note: 'resizable, never full-screen' },
            { name: 'surface', value: '#141418/90', note: 'frosted over the canvas' },
            { name: 'blur', value: '24px', note: 'backdrop only' },
            { name: 'scrim', value: 'black/45', note: 'only when it blocks the canvas' },
            { name: 'radius', value: '0', note: 'attached to the viewport edge' },
            { name: 'header', value: '36px', note: 'title and close' },
            { name: 'tabs', value: '36px · 2px underline', note: 'active is foreground' },
            { name: 'search', value: '28px', note: 'field tokens' },
            { name: 'motion', value: '220ms · x from 24 → 0', note: 'ease [0.22, 1, 0.36, 1]' },
          ]}
        />
      </Section>

      <Usage
        when="A single task that needs the canvas in view: the asset library, filters for a board, layers on a narrow screen. It slides over the board instead of taking a column from it."
        rules={[
          'One sheet at a time. Opening another replaces it rather than stacking.',
          'A scrim appears only when the sheet blocks the canvas. A docked panel is never a sheet.',
          'Default 256px, resizable between 220 and 340. The header and tabs stay fixed; only the content scrolls.',
          'The close button, Escape and finishing the task all dismiss it.',
          'Never put a document-level form in a sheet; property edits belong in the panel.',
          'The sheet covers the canvas, not the toolbar or the zoom control.',
        ]}
        checks={[
          'With a scrim the sheet is role="dialog" aria-modal="true"; without one it is a complementary region.',
          'Focus moves into the sheet on open and returns to the trigger on close; Escape works from anywhere inside.',
          'The resize separator is keyboard operable with arrow keys and reports its width.',
          'The close button has a name; the tab strip uses tablist / tab / aria-selected.',
        ]}
        edges={[
          'A viewport narrower than 400px makes the sheet full width, and the scrim stays.',
          'A resize that would leave less than 120px of canvas snaps back to the last valid width.',
          'Zero search results keep the query visible with one line of explanation, not an empty grid.',
          'A long asset name truncates in the tile; the full name is the tile title.',
          'The board changes underneath while the sheet is open; selecting an asset inserts into the current page.',
        ]}
      />
    </Page>
  )
}

/* ---------------------------------- Popover -------------------------------- */

const DIRECTIONS = [
  { id: 'right', label: 'Right', icon: ArrowRight, deg: '90deg' },
  { id: 'down', label: 'Down', icon: ArrowDown, deg: '180deg' },
  { id: 'left', label: 'Left', icon: ArrowLeft, deg: '270deg' },
  { id: 'up', label: 'Up', icon: ArrowUp, deg: '0deg' },
]

function FillPopoverDemo() {
  const [open, setOpen] = useState(true)
  const [dir, setDir] = useState('right')
  const popRef = useRef<HTMLDivElement>(null)
  const trigRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (popRef.current?.contains(target) || trigRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const focused = document.activeElement
      if (!popRef.current?.contains(focused) && !trigRef.current?.contains(focused)) return
      setOpen(false)
      trigRef.current?.focus()
    }
    const onScroll = (e: Event) => {
      if (popRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onDown, true)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', onDown, true)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  const current = DIRECTIONS.find((d) => d.id === dir) ?? DIRECTIONS[0]

  return (
    <div className="relative h-[380px] w-full overflow-hidden rounded-lg bg-[#3a3a3a]">
      <MockBoard className="absolute inset-0" />
      <div className="absolute inset-y-0 right-0 w-[240px] border-l border-[#27272f] bg-[#141418]">
        <div className="flex h-9 items-center justify-between border-b border-[#27272f] px-3.5">
          <span className="text-[12px] font-semibold text-foreground/90">Fill</span>
          <span className="text-[11px] text-muted-foreground">−</span>
        </div>
        <div className="p-3.5">
          <div className="flex h-7 items-center gap-1.5 rounded-md bg-[#2b2b2b] pl-1.5 pr-0.5">
            <Swatch color="#f472b6" size={16} radius={4} />
            <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] uppercase text-foreground/85">F472B6</span>
            <span className="text-[10.5px] text-muted-foreground">100%</span>
            <button
              ref={trigRef}
              type="button"
              aria-label="Gradient options"
              aria-haspopup="dialog"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <ChevronDown size={12} />
            </button>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground/70">
            <span>Gradient</span>
            <span className="font-mono text-[10px] text-muted-foreground/50">{current.label}</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg, #f472b6, #7c3aed)' }} />
        </div>
      </div>

      {open && (
        <div
          ref={popRef}
          role="dialog"
          aria-label="Gradient direction"
          className="absolute right-[240px] top-[50px] z-20 w-[192px] rounded-lg border border-[#27272f] bg-[#1a1a20] p-2.5 shadow-2xl shadow-black/60"
        >
          <div className="text-[11px] font-medium text-foreground/85">Gradient direction</div>
          <div
            className="mt-2 h-6 rounded border border-white/10"
            style={{ background: `linear-gradient(${current.deg}, #f472b6, #7c3aed)` }}
          />
          <div className="mt-2 grid grid-cols-4 gap-1">
            {DIRECTIONS.map((d) => {
              const Icon = d.icon
              return (
                <button
                  key={d.id}
                  type="button"
                  aria-label={d.label}
                  aria-pressed={dir === d.id}
                  onClick={() => setDir(d.id)}
                  className={cn(
                    'flex h-7 cursor-pointer items-center justify-center rounded transition-colors',
                    dir === d.id
                      ? 'bg-[#353535] text-foreground'
                      : 'text-muted-foreground/70 hover:bg-white/5 hover:text-foreground',
                  )}
                >
                  <Icon size={13} />
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function PopoverPage() {
  return (
    <Page
      title="Popover"
      lead="A small choice attached to its field. Flush to the panel and dismissed by the next click."
      meta="192px · anchored · 3 dismissals"
    >
      <Section title="The pair" note="Fill → gradient direction">
        <Stage
          pad={false}
          caption="Click the chevron on the Fill row to toggle. The popover sits against the panel's left edge, aligned to the field; Escape, an outside pointerdown or a scroll closes it."
        >
          <div className="p-4">
            <FillPopoverDemo />
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy" note="no caret">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'width', value: '192px', note: 'fixed; one choice group' },
            { name: 'anchor', value: 'panel left edge · 0px gap', note: 'top aligned to the field' },
            { name: 'surface', value: '#1a1a20', note: 'popover token' },
            { name: 'radius', value: '8px', note: 'all corners' },
            { name: 'padding', value: '10px', note: 'content sits close to the edge' },
            { name: 'header', value: '11px / 500', note: 'sentence case' },
            { name: 'shadow', value: '2xl black/60', note: 'separates it from the canvas' },
            { name: 'offset', value: '0px · no arrow', note: 'a panel popover is not a bubble' },
            { name: 'dismiss', value: 'outside pointerdown · Esc · scroll', note: 'all three' },
            { name: 'motion', value: '150ms opacity + 2px y', note: 'ease out' },
          ]}
        />
      </Section>

      <Usage
        when="A short choice that belongs to one field but needs more room than the row has: gradient direction, corner radius per corner, a blend mode. The field stays the toggle."
        rules={[
          'One trigger, one popover. It opens flush against the properties panel and over the canvas, never inside the panel.',
          '192px wide. If the content needs a form, it belongs in the panel, not a popover.',
          'The trigger is a toggle: a second press closes it, and aria-expanded tracks the state.',
          'Header in sentence case, 11px, naming the choice — Gradient direction.',
          'Close on outside pointerdown, Escape and any scroll. Return focus to the trigger on Escape.',
          'No caret or arrow. The flush edge is the relationship.',
          'Pink appears only as the value being edited, never as the popover chrome.',
        ]}
        checks={[
          'role="dialog" with an accessible name from its header; the trigger has aria-haspopup="dialog" and aria-expanded.',
          'Focus moves into the popover on open and returns to the trigger on Escape, so keyboard users are never dropped.',
          'Outside pointerdown is not the only exit: Escape works and focus is restored.',
          'The 1px hairline plus shadow keep the surface readable against both the panel and the canvas.',
        ]}
        edges={[
          'A 240px panel on a narrow viewport: the popover clamps to the viewport instead of overflowing left.',
          'Scrolling the canvas dismisses it; scrolling inside the popover does not.',
          'The value changes underneath (undo, another user): the preview follows the current value, not the opening value.',
          'Escape closes the popover first; a second Escape clears the selection.',
          'On touch, a tap outside dismisses and the trigger grows to a 32px hit area.',
        ]}
      />
    </Page>
  )
}

/* ---------------------------------- Tooltip -------------------------------- */

const HINT_BTN =
  'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md bg-[#262626] px-2.5 text-[12px] font-medium text-foreground/90 transition-colors hover:bg-[#333333]'

function TooltipPage() {
  return (
    <Page
      title="Tooltip"
      lead="Names an icon or a shortcut on hover. A hint, never the only place an action exists."
      meta="12px · 250ms · 6px offset"
    >
      <Section title="Delay" note="hover · field">
        <Tiles
          min={200}
          items={[
            {
              label: 'hover or focus',
              note: '250ms',
              node: (
                <Hint label="Frame (F)">
                  <button type="button" className={HINT_BTN}>
                    <Frame size={13} />
                    Frame
                  </button>
                </Hint>
              ),
            },
            {
              label: 'field',
              note: '3000ms · hover only',
              node: (
                <Hint label="Type a hex or pick a colour" delay={3000} hoverOnly>
                  <input
                    readOnly
                    defaultValue="F472B6"
                    aria-label="Fill hex"
                    className="h-7 w-[116px] cursor-text rounded-md bg-[#2b2b2b] px-2 font-mono text-[11px] text-foreground/85 outline-none"
                  />
                </Hint>
              ),
            },
            {
              label: 'surface',
              note: 'one line',
              node: (
                <span className="rounded-md border border-[#27272f] bg-[#1a1a20] px-2 py-1 text-[12px] text-foreground/90 shadow-md">
                  Frame (F)
                </span>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Placement" note="side">
        <Tiles
          min={150}
          items={[
            { label: 'top', node: <Hint label="Undo (⌘Z)" side="top"><button type="button" className={HINT_BTN}>Undo</button></Hint> },
            { label: 'right', node: <Hint label="Send to back" side="right"><button type="button" className={HINT_BTN}><Layers size={13} />Send</button></Hint> },
            { label: 'bottom', node: <Hint label="Frame (F)" side="bottom"><button type="button" className={HINT_BTN}><Frame size={13} />Frame</button></Hint> },
            { label: 'left', node: <Hint label="Delete (⌫)" side="left"><button type="button" className={HINT_BTN}><Trash2 size={13} />Delete</button></Hint> },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one line, no interaction">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'surface', value: '#1a1a20', note: 'popover token' },
            { name: 'border', value: '1px #27272f', note: 'holds on light canvas content' },
            { name: 'text', value: '12px / 400', note: '11px is the floor' },
            { name: 'padding', value: '4px 8px', note: 'radius 6px' },
            { name: 'offset', value: '6px', note: 'never covers the target' },
            { name: 'delay', value: '250ms', note: 'hover and focus' },
            { name: 'field delay', value: '3000ms · hover only', note: 'typing is never covered' },
            { name: 'width', value: 'one line', note: 'truncate past ~40 chars' },
            { name: 'shadow', value: 'md', note: 'floats, so it has one' },
          ]}
        />
      </Section>

      <Usage
        when="An icon-only control, a truncated layer name, or a shortcut worth learning. If the action is not visible anywhere else, it needs a label or a menu, not a tooltip."
        rules={[
          'Never the only copy of an action. Every icon button also has an aria-label.',
          'One line, two to four words, shortcut in parentheses: Frame (F).',
          '250ms on hover and focus. Fields wait 3000ms and ignore focus so the value being typed stays visible.',
          '6px offset, never over the thing being pointed at.',
          'No interactive content, no rich text, no second paragraph.',
          'No tooltips on touch; the accessible name carries it there.',
          'One at a time. Leaving the trigger closes it immediately.',
        ]}
        checks={[
          'The trigger has its own accessible name; the tooltip is a description, not the name.',
          'Opens on keyboard focus as well as hover, except on fields where it is decorative.',
          'Escape dismisses it without moving focus or closing the panel.',
          '12px text on #1a1a20 meets 4.5:1; the 6px gap keeps the pointer path clear.',
        ]}
        keys={['Tab — focus the trigger and show the hint', 'Escape — dismiss without moving focus']}
        edges={[
          'A long layer name truncates in the hint, which stays one line.',
          'Near a viewport edge the hint flips side and keeps its 6px offset.',
          'A disabled button wrapped in a span still fires its hint; the span owns the hover.',
          'A scrolling grid under the pointer opens only the trigger that settles under it.',
          'A hint that repeats the visible label is noise — remove it.',
        ]}
      />
    </Page>
  )
}

/* -------------------------------- Dropdown menu ---------------------------- */

type MenuRow =
  | { type: 'label'; label: string }
  | { type: 'sep' }
  | { type: 'note'; label: string }
  | { type: 'item'; label: string; shortcut?: string; danger?: boolean; checked?: boolean }

const CONTEXT_MENU: MenuRow[] = [
  { type: 'label', label: 'Arrange' },
  { type: 'item', label: 'Bring to front', shortcut: '⌘]' },
  { type: 'item', label: 'Send to back', shortcut: '⌘[' },
  { type: 'sep' },
  { type: 'label', label: 'Transform' },
  { type: 'item', label: 'Flip horizontal', shortcut: '⇧H' },
  { type: 'item', label: 'Flip vertical', shortcut: '⇧V' },
  { type: 'sep' },
  { type: 'item', label: 'Library…', shortcut: '⌘L' },
  { type: 'sep' },
  { type: 'item', label: 'Delete', shortcut: '⌫', danger: true },
]

const EXPORT_MENU: MenuRow[] = [
  { type: 'label', label: 'Format' },
  { type: 'item', label: 'Native', shortcut: '⌘E', checked: true },
  { type: 'item', label: 'Layers', shortcut: '⇧⌘E' },
  { type: 'sep' },
  { type: 'note', label: 'After Effects: import the layers zip at 100% and keep the frame name.' },
]

function DropdownDemo({ items, trigger, defaultOpen = false }: { items: MenuRow[]; trigger: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [active, setActive] = useState(-1)
  const [chosen, setChosen] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstOpen = useRef(true)
  const typed = useRef('')
  const typedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectable = items.reduce<number[]>((acc, it, i) => {
    if (it.type === 'item') acc.push(i)
    return acc
  }, [])

  useEffect(() => {
    if (!open) return
    if (firstOpen.current) {
      firstOpen.current = false
      return
    }
    panelRef.current?.focus()
  }, [open])

  useEffect(() => () => {
    if (typedTimer.current) clearTimeout(typedTimer.current)
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => document.removeEventListener('pointerdown', onDown, true)
  }, [open])

  const pick = (index: number) => {
    const it = items[index]
    if (it.type !== 'item') return
    setChosen(it.label)
    setOpen(false)
    setActive(-1)
    triggerRef.current?.focus()
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const at = selectable.indexOf(active)
      if (e.key === 'ArrowDown') {
        setActive(at < 0 ? selectable[0] : selectable[(at + 1) % selectable.length])
      } else {
        setActive(at < 0 ? selectable[selectable.length - 1] : selectable[(at - 1 + selectable.length) % selectable.length])
      }
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (active >= 0) {
        e.preventDefault()
        pick(active)
      }
      return
    }
    if (e.key.length !== 1) return
    typed.current += e.key.toLowerCase()
    if (typedTimer.current) clearTimeout(typedTimer.current)
    typedTimer.current = setTimeout(() => {
      typed.current = ''
    }, 600)
    const hit = selectable.find((i) => {
      const it = items[i]
      return it.type === 'item' && it.label.toLowerCase().startsWith(typed.current)
    })
    if (hit !== undefined) setActive(hit)
  }

  return (
    <div ref={rootRef} className="relative h-[340px] w-full rounded-lg bg-[#3a3a3a]">
      <MockBoard className="absolute inset-0 rounded-lg" />
      <div className="relative flex flex-col items-center pt-4">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => {
            setOpen((v) => !v)
            setActive(-1)
          }}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md bg-[#232329] px-3 text-[12px] text-foreground/90 shadow-lg ring-1 ring-white/[0.06] hover:bg-[#2b2b31]"
        >
          {trigger}
          <ChevronDown size={12} className="text-muted-foreground" />
        </button>

        {open && (
          <div
            ref={panelRef}
            role="menu"
            tabIndex={-1}
            aria-label={trigger}
            onKeyDown={onKeyDown}
            className="absolute left-1/2 top-[52px] w-[240px] -translate-x-1/2 rounded-lg border border-[#27272f] bg-[#1a1a20] py-1.5 shadow-2xl shadow-black/70 outline-none"
          >
            {items.map((it, i) => {
              if (it.type === 'label') {
                return (
                  <div key={`l-${i}`} className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-medium text-muted-foreground/60">
                    {it.label}
                  </div>
                )
              }
              if (it.type === 'sep') return <div key={`s-${i}`} className="my-1 h-px bg-[#27272f]" />
              if (it.type === 'note') {
                return (
                  <div key={`n-${i}`} className="px-2.5 pb-1 pt-2 text-[10.5px] leading-relaxed text-muted-foreground/55">
                    {it.label}
                  </div>
                )
              }
              return (
                <button
                  key={`i-${i}`}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(i)}
                  className={cn(
                    'flex h-7 w-full cursor-pointer items-center gap-2 px-2.5 text-left text-[12px] transition-colors',
                    it.danger ? 'text-[#ef4444]' : 'text-foreground/85',
                    active === i && (it.danger ? 'bg-[#ef4444]/10' : 'bg-white/[0.06]'),
                  )}
                >
                  <span className="flex w-3.5 shrink-0 items-center justify-center">
                    {it.checked && <Check size={11} />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{it.label}</span>
                  {it.shortcut && (
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50">{it.shortcut}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
      <div aria-live="polite" className="absolute bottom-2.5 left-3 font-mono text-[10px] text-white/55">
        {chosen ? `ran · ${chosen}` : open ? '↑↓ move · ↵ run · esc close · type to jump' : 'closed'}
      </div>
    </div>
  )
}

function DropdownMenuPage() {
  return (
    <Page
      title="Dropdown menu"
      lead="A short list of actions for one object. Scoped, named, and closed before anything else."
      meta="240px · 2 menus · one danger row"
    >
      <Section title="Menus" note="scope">
        <Tiles
          min={300}
          items={[
            { label: 'canvas context menu', note: 'selection', wide: true, node: <DropdownDemo items={CONTEXT_MENU} trigger="Canvas actions" defaultOpen /> },
            { label: 'export menu', note: 'frame', wide: true, node: <DropdownDemo items={EXPORT_MENU} trigger="Export" defaultOpen /> },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="rows and labels">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'width', value: '220–260px', note: '240px in the editor' },
            { name: 'surface', value: '#1a1a20', note: 'popover token' },
            { name: 'radius', value: '8px', note: 'padding 6px vertical' },
            { name: 'row', value: '28px · 12px text', note: 'one line, no descriptions' },
            { name: 'section label', value: '10.5px / 500', note: 'sentence case' },
            { name: 'shortcut', value: '10px mono · right', note: 'muted, never moves' },
            { name: 'check', value: '11px · leading slot', note: 'on the active option' },
            { name: 'danger', value: '#ef4444 · last row', note: 'after a hairline' },
            { name: 'shadow', value: '2xl black/70', note: 'floats over the canvas' },
            { name: 'type-ahead', value: '600ms buffer', note: 'starts-with match' },
          ]}
        />
      </Section>

      <Usage
        when="Two to ten actions that share a scope: the selected layers, one frame's export, the board's page list. A menu is attached to the thing it acts on; the command palette is not."
        rules={[
          'A canvas menu lists canvas actions only. Document and app commands live in the palette.',
          '220–260px, one line per row, no descriptions. The label and the shortcut are enough.',
          'Section labels in sentence case at 10.5px — Arrange, Transform, Format. Never uppercase.',
          'Shortcuts sit right-aligned in mono and never move when the active row changes.',
          'Exactly one danger row, last, after a hairline, in #ef4444. Delete, not Remove.',
          'A check marks the active option and the row keeps its label.',
          'The menu closes before it opens a dialog, a sheet or a rename field.',
        ]}
        checks={[
          'role="menu" and role="menuitem", with the trigger carrying aria-haspopup and aria-expanded.',
          'Focus enters the menu on open, arrows move, Escape closes and returns focus to the trigger.',
          'A checked row exposes its state with aria-checked, not only the glyph.',
          'The danger row is named with its verb; colour is the second signal.',
        ]}
        keys={[
          '↑ ↓ — move between rows',
          'Enter — run the active row',
          'Escape — close and restore focus',
          'a–z — type-ahead within 600ms',
        ]}
        edges={[
          'Near the bottom edge the menu flips above the trigger and keeps the 8px gap.',
          'A long label truncates before the shortcut; the shortcut never disappears.',
          'An action unavailable for the selection stays visible and disabled, with the reason in its tooltip.',
          'Right-click during a drag cancels the drag, then opens the menu at the pointer.',
          'A menu opened from a menu closes the first before the second appears.',
        ]}
      />
    </Page>
  )
}

/* ---------------------------------- Command -------------------------------- */

type PaletteGroup = 'Recent' | 'Pages' | 'Layers' | 'Commands'

type PaletteItem = {
  id: string
  label: string
  group: PaletteGroup
  icon: ReactNode
  shortcut?: string
}

const COMMAND_ITEMS: PaletteItem[] = [
  { id: 'recent-hero', label: 'Hero heading', group: 'Recent', icon: <FileText size={13} /> },
  { id: 'recent-export', label: 'Export frame…', group: 'Recent', icon: <CommandIcon size={13} />, shortcut: '⌘E' },
  { id: 'recent-pricing', label: 'Pricing', group: 'Recent', icon: <FileText size={13} /> },
  { id: 'page-cover', label: 'Cover', group: 'Pages', icon: <FileText size={13} /> },
  { id: 'page-pricing', label: 'Pricing', group: 'Pages', icon: <FileText size={13} /> },
  { id: 'page-archive', label: 'Archive', group: 'Pages', icon: <FileText size={13} /> },
  { id: 'layer-hero', label: 'Hero heading', group: 'Layers', icon: <Layers size={13} /> },
  { id: 'layer-logo', label: 'Nav / logo', group: 'Layers', icon: <Layers size={13} /> },
  { id: 'layer-card', label: 'Pricing card', group: 'Layers', icon: <Layers size={13} /> },
  { id: 'cmd-export', label: 'Export frame…', group: 'Commands', icon: <CommandIcon size={13} />, shortcut: '⌘E' },
  { id: 'cmd-add-page', label: 'Add page', group: 'Commands', icon: <CommandIcon size={13} /> },
  { id: 'cmd-grid', label: 'Toggle grid', group: 'Commands', icon: <CommandIcon size={13} />, shortcut: '⇧G' },
  { id: 'cmd-paste', label: 'Paste in place', group: 'Commands', icon: <CommandIcon size={13} />, shortcut: '⇧⌘V' },
]

const GROUP_ORDER: PaletteGroup[] = ['Recent', 'Pages', 'Layers', 'Commands']

function CommandDemo() {
  const [open, setOpen] = useState(true)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [picked, setPicked] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const firstOpen = useRef(true)

  useEffect(() => {
    if (!open) return
    if (firstOpen.current) {
      firstOpen.current = false
      return
    }
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return
      const root = rootRef.current
      if (!root) return
      if (!root.contains(document.activeElement) && !root.matches(':hover')) return
      e.preventDefault()
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const q = query.trim().toLowerCase()
  const matches = COMMAND_ITEMS.filter(
    (it) => (q === '' || it.group !== 'Recent') && (q === '' || it.label.toLowerCase().includes(q)),
  )
  const groups = GROUP_ORDER.map((group) => ({
    group,
    items: matches.filter((it) => it.group === group),
  })).filter((g) => g.items.length > 0)
  const rows = groups.flatMap((g) => g.items)
  const current = rows[Math.min(active, rows.length - 1)]

  const run = (item: PaletteItem | undefined) => {
    if (!item) return
    setPicked(item.label)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative h-[440px] w-full overflow-hidden rounded-lg bg-[#3a3a3a]">
      <MockBoard className="absolute inset-0" />
      {open ? (
        <>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute left-1/2 top-5 w-[540px] max-w-[calc(100%-32px)] -translate-x-1/2 overflow-hidden rounded-xl border border-[#27272f] bg-[#141418] shadow-2xl shadow-black/70">
            <div className="flex h-11 items-center gap-2 border-b border-[#27272f] px-3">
              <Search size={14} className="shrink-0 text-muted-foreground/70" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setActive((a) => Math.min(rows.length - 1, a + 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActive((a) => Math.max(0, a - 1))
                  } else if (e.key === 'Enter') {
                    e.preventDefault()
                    run(current)
                  } else if (e.key === 'Escape') {
                    e.preventDefault()
                    setOpen(false)
                  }
                }}
                placeholder="Search pages, layers and commands"
                aria-label="Search pages, layers and commands"
                role="combobox"
                aria-expanded="true"
                aria-controls="command-results"
                aria-activedescendant={current ? `cmd-${current.id}` : undefined}
                className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50"
              />
              <Kbd>esc</Kbd>
            </div>

            <div id="command-results" role="listbox" aria-label="Results" className="scrollbar-thin max-h-[330px] overflow-y-auto p-1.5">
              {rows.length === 0 ? (
                <div className="px-3 py-10 text-center">
                  <p className="text-[12.5px] text-foreground/80">No results for “{query.trim()}”</p>
                  <p className="mt-1 text-[11.5px] text-muted-foreground/60">
                    Try a layer name, a page, or a command such as Export.
                  </p>
                </div>
              ) : (
                groups.map((g) => (
                  <div key={g.group} className="mb-1 last:mb-0">
                    <div className="px-2.5 pb-1 pt-1.5 text-[10.5px] font-medium text-muted-foreground/60">{g.group}</div>
                    {g.items.map((it) => {
                      const isActive = current?.id === it.id
                      return (
                        <button
                          key={it.id}
                          id={`cmd-${it.id}`}
                          type="button"
                          role="option"
                          tabIndex={-1}
                          aria-selected={isActive}
                          onMouseEnter={() => setActive(rows.indexOf(it))}
                          onClick={() => run(it)}
                          className={cn(
                            'flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-left text-[12.5px] transition-colors',
                            isActive ? 'bg-white/[0.06] text-foreground' : 'text-foreground/80 hover:bg-white/[0.04]',
                          )}
                        >
                          <span className="shrink-0 text-muted-foreground/70">{it.icon}</span>
                          <span className="min-w-0 flex-1 truncate">{it.label}</span>
                          {it.shortcut && (
                            <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50">{it.shortcut}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex h-8 items-center gap-3 border-t border-[#27272f] px-3 font-mono text-[10px] text-muted-foreground/50">
              <span>↑↓ move</span>
              <span>↵ run</span>
              <span>esc close</span>
              <span className="ml-auto">{rows.length} results</span>
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full bg-[#232329] px-3.5 text-[12px] text-foreground/85 shadow-xl ring-1 ring-white/[0.06] hover:bg-[#2b2b31]"
          >
            <CommandIcon size={13} />
            <Kbd>⌘K</Kbd>
            <span>{picked ? `ran · ${picked}` : 'Open command palette'}</span>
          </button>
        </div>
      )}
    </div>
  )
}

function CommandPage() {
  return (
    <Page
      title="Command"
      lead="The keyboard index over the whole document. Pages, layers and commands in one field."
      spec
      meta="540px · 32px rows · ⌘K"
    >
      <Section title="Palette" note="⌘K">
        <Stage
          pad={false}
          caption="Hover the demo and press ⌘K (Ctrl+K), or use the field. Empty query shows recent items first; typing filters pages, layers and commands."
        >
          <div className="p-4">
            <CommandDemo />
          </div>
        </Stage>
      </Section>

      <Section title="Empty" note="no results">
        <Tiles
          items={[
            {
              label: 'empty results',
              note: 'query stays visible',
              wide: true,
              node: (
                <div className="w-[540px] max-w-full overflow-hidden rounded-xl border border-[#27272f] bg-[#141418] shadow-2xl">
                  <div className="flex h-11 items-center gap-2 border-b border-[#27272f] px-3">
                    <Search size={14} className="text-muted-foreground/70" />
                    <span className="flex-1 text-[13px] text-foreground">brand book</span>
                    <Kbd>esc</Kbd>
                  </div>
                  <div className="px-3 py-10 text-center">
                    <p className="text-[12.5px] text-foreground/80">No results for “brand book”</p>
                    <p className="mt-1 text-[11.5px] text-muted-foreground/60">
                      Try a layer name, a page, or a command such as Export.
                    </p>
                  </div>
                  <div className="flex h-8 items-center gap-3 border-t border-[#27272f] px-3 font-mono text-[10px] text-muted-foreground/50">
                    <span>↑↓ move</span>
                    <span>↵ run</span>
                    <span>esc close</span>
                    <span className="ml-auto">0 results</span>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="search, groups, rows">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'width', value: '540px', note: 'centred, 24px from the top' },
            { name: 'surface', value: '#141418', note: 'scrim black/50 behind' },
            { name: 'search row', value: '44px', note: 'icon, field, esc' },
            { name: 'row', value: '32px', note: 'icon, label, shortcut' },
            { name: 'group label', value: '10.5px / 500', note: 'Recent, Pages, Layers, Commands' },
            { name: 'max height', value: '330px', note: 'scrolls, never the page' },
            { name: 'shortcut', value: '10px mono · right', note: 'commands only' },
            { name: 'recent', value: '3 items', note: 'only when the query is empty' },
            { name: 'empty', value: 'query + one line', note: 'never a blank box' },
          ]}
        />
        <div className="mt-4">
          <Note>
            A menu answers “what can I do to this object?” and is anchored to it. The palette answers “where is
            it, anywhere in the document?” and has no anchor. The export and context menus stay small because
            the palette exists.
          </Note>
        </div>
      </Section>

      <Usage
        when="A board holds hundreds of layers, several pages and dozens of commands; most are off-screen and have no permanent control. The palette reaches all of them from the keyboard, from anywhere on the canvas."
        rules={[
          'One palette per app, opened with ⌘K (Ctrl+K). It is global; never scope it to a panel or a selection.',
          'Groups in order: Recent, Pages, Layers, Commands. Recent appears only while the query is empty.',
          'Rows are 32px and one line. No descriptions, no previews, no nested actions.',
          'Commands show their shortcut. Pages and layers do not — they have no global key.',
          'A run command goes through the same transaction as its menu item, so undo still holds one snapshot.',
          'Arrow keys move, Enter runs, Escape closes and returns focus to where it was.',
          'The palette is an index, not an editor: it never asks for a value inline.',
        ]}
        checks={[
          'The field is a combobox with aria-controls and aria-activedescendant pointing at the active row.',
          'Results are a listbox; the result count is announced politely as the query changes.',
          'Escape closes and restores focus to the canvas or the control that opened it.',
          'The scrim is presentational; focus stays inside the palette while it is open.',
        ]}
        keys={[
          '⌘K / Ctrl+K — open the palette',
          '↑ ↓ — move the active row',
          'Enter — run the active row',
          'Escape — close and restore focus',
        ]}
        edges={[
          'No results: keep the query visible, say so once, and offer the closest command.',
          'A layer renamed while the palette is open re-filters; keep the active id, not the row index.',
          'A command that opens a dialog closes the palette first so the dialog owns the next Escape.',
          'Duplicate layer names show their page or parent path; never make the user guess.',
          'The browser shortcut is only captured while the palette is open or the canvas is hovered.',
        ]}
      />
    </Page>
  )
}

export const overlayPages: Record<string, ComponentType> = {
  'components/dialog': DialogPage,
  'components/sheet': SheetPage,
  'components/popover': PopoverPage,
  'components/tooltip': TooltipPage,
  'components/dropdown-menu': DropdownMenuPage,
  'components/command': CommandPage,
}
