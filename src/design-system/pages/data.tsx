import { useEffect, useRef, useState } from 'react'
import type { ComponentType, KeyboardEvent, PointerEvent, ReactNode } from 'react'
import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalSpaceAround,
  ChevronDown,
  Group,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { Page, Section, Stage, Tiles, Usage, Rows, Note } from '../Doc'
import { Btn, CanvasToolbar, Kbd, PanelFrame, Swatch } from '../bits'
import { cn } from '@/lib/utils'

/* -------------------------------- Filter bar ------------------------------- */

const FILTERS = [
  { name: 'Blur', value: '8' },
  { name: 'Saturate', value: '120' },
  { name: 'Hue rotate', value: '45°' },
  { name: 'Drop shadow', value: '12' },
  { name: 'Noise', value: '6%' },
] as const

type FilterName = (typeof FILTERS)[number]['name']

type AppliedFilter = {
  id: number
  name: FilterName
  value: string
}

function FilterChip({
  item,
  onRemove,
  hover,
}: {
  item: AppliedFilter
  onRemove?: () => void
  hover?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded border border-white/10 bg-white/[0.06] pl-2 pr-1 text-[11px] text-foreground/80 backdrop-blur-[8px] backdrop-saturate-[120%] transition-colors',
        hover && 'border-white/20',
      )}
    >
      {item.name}
      <span className="font-mono text-[10px] text-muted-foreground/60">{item.value}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${item.name} filter`}
          className={cn(
            'flex size-4 cursor-pointer items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-white/10 hover:text-foreground',
            hover && 'text-foreground',
          )}
        >
          <X size={9} />
        </button>
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            'flex size-4 items-center justify-center text-muted-foreground/50',
            hover && 'text-foreground',
          )}
        >
          <X size={9} />
        </span>
      )}
    </span>
  )
}

function FilterBarPage() {
  const [applied, setApplied] = useState<AppliedFilter[]>([
    { id: 1, name: 'Blur', value: '8' },
    { id: 2, name: 'Saturate', value: '120' },
  ])
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  function add(f: (typeof FILTERS)[number]) {
    setApplied((prev) => {
      const id = prev.reduce((max, item) => Math.max(max, item.id), 0) + 1
      return [...prev, { id, name: f.name, value: f.value }]
    })
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <Page
      title="Filter bar"
      lead="Filters the selected layer's paint. Chips in one row, not a query builder."
      meta="240px panel · 24px chips · blur 8 · saturate 120%"
    >
      <Section title="Row" note="selected layer · paint">
        <Stage pad={false} className="flex justify-center px-6 py-8" caption="Add filter appends a chip. Clear all sits at the trailing edge of the row.">
          <div className="w-[240px] rounded-lg border border-[#27272f] bg-[#141418]">
            <div className="flex h-8 items-center border-b border-[#27272f] px-3 text-[12px] font-semibold text-foreground/85">
              Filters
            </div>
            <div
              className={cn('relative px-3.5 py-3', open && 'min-h-[206px]')}
              onKeyDown={(event) => {
                if (event.key === 'Escape' && open) {
                  setOpen(false)
                  triggerRef.current?.focus()
                }
              }}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                {applied.map((f) => (
                  <FilterChip
                    key={f.id}
                    item={f}
                    onRemove={() => {
                      setApplied((prev) => prev.filter((item) => item.id !== f.id))
                      triggerRef.current?.focus()
                    }}
                  />
                ))}
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-expanded={open}
                  className="inline-flex h-6 cursor-pointer items-center gap-1 rounded border border-dashed border-white/15 px-1.5 text-[10.5px] text-muted-foreground/70 transition-colors hover:border-white/25 hover:text-foreground"
                >
                  <Plus size={10} />
                  Add filter
                </button>
                {applied.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setApplied([])
                      triggerRef.current?.focus()
                    }}
                    aria-label={`Clear all ${applied.length} ${
                      applied.length === 1 ? 'filter' : 'filters'
                    }`}
                    className="ml-auto cursor-pointer text-[10px] text-muted-foreground/50 transition-colors hover:text-foreground"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {open && (
                <div className="absolute left-3.5 top-[38px] z-20 w-[156px] rounded-lg border border-border bg-[#1a1a20] py-1 shadow-2xl shadow-black/60">
                  <p className="px-2.5 pb-1 pt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground/40">
                    Filter
                  </p>
                  {FILTERS.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => add(f)}
                      className="flex h-7 w-full cursor-pointer items-center justify-between px-2.5 text-[11.5px] text-foreground/75 transition-colors hover:bg-white/[0.05] hover:text-foreground"
                    >
                      {f.name}
                      <span className="font-mono text-[10px] text-muted-foreground/45">{f.value}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-[#27272f] px-3.5 py-2.5 text-[10.5px] text-muted-foreground/50">
              <span>Applies to</span>
              <span className="truncate pl-2 font-mono text-[10px] text-foreground/70">Hero / image</span>
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Parts" note="chip · trigger · clear">
        <Tiles
          min={150}
          items={[
            {
              label: 'chip',
              note: 'blur 8',
              node: <FilterChip item={{ id: 1, name: 'Blur', value: '8' }} />,
            },
            {
              label: 'chip hover',
              note: 'remove',
              node: <FilterChip item={{ id: 2, name: 'Saturate', value: '120' }} hover />,
            },
            {
              label: 'add filter',
              note: 'disclosure',
              node: (
                <span className="inline-flex h-6 items-center gap-1 rounded border border-dashed border-white/15 px-1.5 text-[10.5px] text-muted-foreground/70">
                  <Plus size={10} />
                  Add filter
                </span>
              ),
            },
            {
              label: 'clear all',
              note: 'trailing',
              node: <span className="cursor-default text-[10px] text-muted-foreground/50">Clear all</span>,
            },
          ]}
        />
        <div className="mt-4">
          <Note>
            Three chips are three effects, not three conditions. There is no field, operator or
            AND/OR — the row never queries anything.
          </Note>
        </div>
      </Section>

      <Usage
        when="The selected layer already has paint and the user wants to change its finish without opening a full effects panel. Filters apply to the layer, never to a list of rows."
        rules={[
          'Chips apply to the selected layer, left to right; order is part of the result.',
          'Add filter opens one fixed list. Picking a name appends a chip and closes the list.',
          'Every chip can be removed alone; Clear all appears only when a chip exists.',
          'The chip shows the effect name and its current value; editing the value opens the chip, not the row.',
          'Chips wrap at the panel edge. The row never scrolls sideways.',
          'A new chip goes at the end. Do not reorder chips by name.',
        ]}
        checks={[
          'The row is a list; each remove button names the effect it removes.',
          'Add filter is a disclosure with aria-expanded, and Escape closes the list and returns focus to it.',
          'Clear all says how many filters it clears and keeps its place after the chips in DOM order.',
          'A removed chip returns focus to Add filter, not to the document body.',
        ]}
        edges={[
          'Ten filters grow the row by wrapping; the properties panel scrolls, the page does not.',
          'The same effect can be added twice — two blurs are two chips and both stay.',
          'Removing the last chip leaves Add filter in place and hides Clear all.',
          'An effect the layer cannot take is disabled in the list with the reason in its title.',
          'Escape with the list open closes the list, not the panel around it.',
        ]}
      />
    </Page>
  )
}

/* ---------------------------------- Table ---------------------------------- */

type TokenRow = { name: string; value: string; uses: number }

const TOKENS: TokenRow[] = [
  { name: 'surface.page', value: '#000000', uses: 18 },
  { name: 'surface.tile', value: '#0b0b0d', uses: 42 },
  { name: 'line.hairline', value: '#27272f', uses: 96 },
  { name: 'text.primary', value: '#ececf1', uses: 73 },
  { name: 'text.secondary', value: '#9a9aa4', uses: 51 },
  { name: 'action.pink', value: '#f472b6', uses: 12 },
]

function TablePage() {
  const [ascending, setAscending] = useState(false)
  const [selected, setSelected] = useState('line.hairline')
  const rows = [...TOKENS].sort((a, b) => (ascending ? a.uses - b.uses : b.uses - a.uses))

  return (
    <Page
      title="Table"
      lead="Rows of tokens or layers. Hairlines, numbers in mono, one quiet sort."
      spec
      meta="32px header · 34px rows · no zebra stripes"
    >
      <Section title="Table" note="tokens · sorted by uses">
        <Stage caption="Click a row to select it, or the Uses header to sort. Numbers stay right-aligned.">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="h-8">
                <th
                  scope="col"
                  className="pl-2 text-[11px] font-normal text-muted-foreground/70"
                >
                  Token
                </th>
                <th
                  scope="col"
                  className="text-[11px] font-normal text-muted-foreground/70"
                  style={{ width: 124 }}
                >
                  Value
                </th>
                <th
                  scope="col"
                  aria-sort={ascending ? 'ascending' : 'descending'}
                  className="pr-2 text-right text-[11px] font-normal text-muted-foreground/70"
                  style={{ width: 64 }}
                >
                  <button
                    type="button"
                    onClick={() => setAscending((v) => !v)}
                    aria-label="Sort by uses"
                    className="inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-foreground"
                  >
                    Uses
                    <ChevronDown
                      size={10}
                      className={cn('transition-transform duration-150', ascending && 'rotate-180')}
                    />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSelected = selected === row.name
                return (
                  <tr
                    key={row.name}
                    tabIndex={0}
                    onClick={() => setSelected(row.name)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelected(row.name)
                      }
                    }}
                    aria-current={isSelected ? 'true' : undefined}
                    className={cn(
                      'h-[34px] cursor-pointer border-b border-border/60 transition-colors last:border-b-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-2px] focus-visible:outline-[#52525b]',
                      isSelected ? 'bg-[#2b2b2b]' : 'hover:bg-white/[0.03]',
                    )}
                  >
                    <td className="pl-2">
                      <span
                        title={row.name}
                        className="block truncate font-mono text-[11.5px] text-foreground/80"
                      >
                        {row.name}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1.5 font-mono text-[11.5px] text-muted-foreground/80">
                        <Swatch color={row.value} size={12} radius={3} />
                        {row.value}
                      </span>
                    </td>
                    <td className="pr-2 text-right font-mono text-[11px] tabular-nums text-foreground/75">
                      {row.uses}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Stage>
      </Section>

      <Section title="States" note="empty · loading">
        <Tiles
          min={280}
          items={[
            {
              label: 'empty',
              note: 'no tokens',
              node: (
                <div className="w-full overflow-hidden rounded-lg border border-border">
                  <div className="grid h-8 grid-cols-[1fr_110px_56px] items-center border-b border-border px-2 text-[11px] text-muted-foreground/70">
                    <span>Token</span>
                    <span>Value</span>
                    <span className="text-right">Uses</span>
                  </div>
                  <div className="flex h-[120px] flex-col items-center justify-center gap-1 px-4 text-center">
                    <p className="text-[12px] text-foreground/80">No tokens yet</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground/55">
                      Color tokens appear here once a fill uses one.
                    </p>
                  </div>
                </div>
              ),
            },
            {
              label: 'loading',
              note: 'aria-busy',
              node: (
                <div
                  role="status"
                  aria-busy="true"
                  aria-label="Loading tokens"
                  className="w-full overflow-hidden rounded-lg border border-border"
                >
                  <div className="grid h-8 grid-cols-[1fr_110px_56px] items-center border-b border-border px-2 text-[11px] text-muted-foreground/70">
                    <span>Token</span>
                    <span>Value</span>
                    <span className="text-right">Uses</span>
                  </div>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex h-[34px] items-center gap-3 border-b border-border/60 px-2 last:border-b-0"
                    >
                      <span className="h-2 w-28 animate-pulse rounded bg-white/[0.07]" />
                      <span className="h-2 w-14 animate-pulse rounded bg-white/[0.05]" />
                      <span className="ml-auto h-2 w-5 animate-pulse rounded bg-white/[0.05]" />
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />
      </Section>

      <Section title="Anatomy" note="one row">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'header', value: '32px · 11px', note: 'muted, sentence case' },
            { name: 'row', value: '34px', note: '1px hairline below' },
            { name: 'numbers', value: '11px Geist Mono', note: 'right-aligned, tabular' },
            { name: 'selected row', value: '#2b2b2b', note: 'hover white/3' },
            { name: 'sort', value: '10px chevron', note: 'one column at a time' },
            { name: 'stripes', value: 'none', note: 'the hairline is the rhythm' },
          ]}
        />
      </Section>

      <Usage
        when="Comparing like values across many rows: tokens, layers, exports. The reader scans a column or sorts it; they do not read every row as a sentence."
        rules={[
          'Rows are 34px and never zebra-striped. One hairline does the separating.',
          'Text aligns left, numbers align right and use Geist Mono.',
          'The selected row is #2b2b2b; hover is one step quieter at white/3.',
          'One sort at a time. The chevron shows direction and the header stays sentence case.',
          'Selection is a row, not a checkbox, unless bulk editing is on.',
          'Empty and loading states replace the body and keep the header.',
        ]}
        checks={[
          'Use a real table with th scope="col"; the sorted header carries aria-sort.',
          'The selected row is marked with aria-current, not by colour alone.',
          'The sort button has a name that includes the column: “Sort by uses”.',
          'Header and cell text keep 4.5:1 against #0b0b0d, including the 11px header.',
        ]}
        edges={[
          'A long token name truncates with the full name in its title; the value never wraps.',
          'Zero uses shows 0, never a dash or an empty cell.',
          'Two hundred rows scroll under a sticky header; the page itself does not grow.',
          'A reload with cached rows keeps them dimmed instead of blanking the body.',
          'Duplicate names are allowed only across scopes, and the row shows the scope.',
        ]}
      />
    </Page>
  )
}

/* -------------------------------- Data grid -------------------------------- */

type Cell = { r: number; c: number }
type LayerValue = { name: string; x: number; w: number }

const LAYERS: LayerValue[] = [
  { name: 'Hero / headline', x: 96, w: 720 },
  { name: 'Hero / subhead', x: 96, w: 520 },
  { name: 'Hero / cta', x: 96, w: 148 },
  { name: 'Nav / logo', x: 48, w: 96 },
  { name: 'Nav / links', x: 780, w: 300 },
  { name: 'Footer / note', x: 96, w: 410 },
]

function valueAt(row: LayerValue, c: number) {
  if (c === 0) return row.name
  if (c === 1) return String(row.x)
  return String(row.w)
}

function rangeOf(selection: { a: Cell; b: Cell }) {
  return {
    r0: Math.min(selection.a.r, selection.b.r),
    r1: Math.max(selection.a.r, selection.b.r),
    c0: Math.min(selection.a.c, selection.b.c),
    c1: Math.max(selection.a.c, selection.b.c),
  }
}

function DataGridPage() {
  const [rows, setRows] = useState<LayerValue[]>(LAYERS)
  const [selection, setSelection] = useState<{ a: Cell; b: Cell }>({
    a: { r: 0, c: 0 },
    b: { r: 0, c: 0 },
  })
  const [drag, setDrag] = useState<Cell | null>(null)
  const [edit, setEdit] = useState<Cell | null>(null)
  const [draft, setDraft] = useState('')
  const [colW, setColW] = useState(132)
  const [resize, setResize] = useState<{ x: number; width: number } | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const cancelEdit = useRef(false)

  const { r0, r1, c0, c1 } = rangeOf(selection)
  const inSelection = (r: number, c: number) => r >= r0 && r <= r1 && c >= c0 && c <= c1

  function startEdit(cell: Cell) {
    cancelEdit.current = false
    setDraft(valueAt(rows[cell.r], cell.c))
    setEdit(cell)
  }

  function commitEdit() {
    if (!edit) return
    if (cancelEdit.current) {
      cancelEdit.current = false
      setEdit(null)
      gridRef.current?.focus()
      return
    }
    const target = edit
    const value = draft
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== target.r) return row
        if (target.c === 0) return value.trim() ? { ...row, name: value } : row
        const parsed = Number(value)
        if (value.trim() === '' || !Number.isFinite(parsed)) return row
        if (target.c === 1) return { ...row, x: parsed }
        return { ...row, w: parsed }
      }),
    )
    setEdit(null)
    gridRef.current?.focus()
  }

  function onGridKey(e: KeyboardEvent<HTMLDivElement>) {
    if (edit) return
    const cur = selection.b
    if (e.key === 'Enter') {
      e.preventDefault()
      startEdit(cur)
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.currentTarget.blur()
      return
    }
    const next = { ...cur }
    if (e.key === 'ArrowDown') next.r = Math.min(rows.length - 1, cur.r + 1)
    else if (e.key === 'ArrowUp') next.r = Math.max(0, cur.r - 1)
    else if (e.key === 'ArrowRight') next.c = Math.min(2, cur.c + 1)
    else if (e.key === 'ArrowLeft') next.c = Math.max(0, cur.c - 1)
    else return
    e.preventDefault()
    setSelection({ a: next, b: next })
  }

  function cellDown(e: PointerEvent<HTMLDivElement>, cell: Cell) {
    e.preventDefault()
    if (edit) commitEdit()
    gridRef.current?.focus()
    setSelection({ a: cell, b: cell })
    setDrag(cell)
  }

  function cellEnter(cell: Cell) {
    if (drag) setSelection({ a: drag, b: cell })
  }

  function startResize(e: PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setResize({ x: e.clientX, width: colW })
  }

  function moveResize(e: PointerEvent<HTMLDivElement>) {
    if (!resize) return
    setColW(Math.min(190, Math.max(88, resize.width + e.clientX - resize.x)))
  }

  function endResize(e: PointerEvent<HTMLDivElement>) {
    setResize(null)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const colStart = (c: number) => (c === 0 ? 0 : colW + (c - 1) * 84)
  const colEnd = (c: number) => (c === 0 ? colW : colW + c * 84)

  return (
    <Page
      title="Data grid"
      lead="Editable cells over table rows. Frozen first column, keyboard first, drag to select."
      spec
      meta="28px rows · 28px header · 1px pink marquee"
    >
      <Section title="Grid" note="layer values · frozen first column">
        <Stage caption="Drag across cells to select a range. Arrows move, Enter edits, Escape cancels. Drag the header edge to resize.">
          <div className="overflow-x-auto rounded-md border border-border bg-[#0b0b0d]">
            <div
              ref={gridRef}
              role="grid"
              aria-label="Layer values"
              aria-rowcount={rows.length + 1}
              aria-colcount={3}
              tabIndex={0}
              onKeyDown={onGridKey}
              onPointerUp={() => setDrag(null)}
              onPointerLeave={() => setDrag(null)}
              className="outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#52525b]/70"
              style={{ width: colW + 168 }}
            >
              <div role="row" className="flex h-7 border-b border-border bg-[#0b0b0d]">
                <div
                  role="columnheader"
                  className="sticky left-0 z-20 flex h-full items-center border-r border-border/60 bg-[#0b0b0d] px-2 text-[10.5px] text-muted-foreground/60"
                  style={{ width: colW }}
                >
                  Layer
                  <div
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize layer column"
                    aria-valuemin={88}
                    aria-valuemax={190}
                    aria-valuenow={colW}
                    tabIndex={0}
                    onPointerDown={startResize}
                    onPointerMove={moveResize}
                    onPointerUp={endResize}
                    onKeyDown={(event) => {
                      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
                      event.preventDefault()
                      event.stopPropagation()
                      const delta = event.key === 'ArrowRight' ? 8 : -8
                      setColW((width) => Math.min(190, Math.max(88, width + delta)))
                    }}
                    className="absolute inset-y-0 right-0 w-1 cursor-col-resize touch-none hover:bg-white/25 focus-visible:bg-[#52525b] focus-visible:outline-none"
                  />
                </div>
                {[1, 2].map((c) => (
                  <div
                    key={c}
                    role="columnheader"
                    className="flex h-full items-center justify-end px-2 text-[10.5px] text-muted-foreground/60"
                    style={{ width: 84 }}
                  >
                    {c === 1 ? 'X' : 'W'}
                  </div>
                ))}
              </div>

              <div className="relative">
                {rows.map((row, r) => (
                  <div
                    key={r}
                    role="row"
                    aria-rowindex={r + 2}
                    className="group flex h-7 border-b border-border/60 last:border-b-0 hover:bg-white/[0.03]"
                  >
                    <div
                      role="gridcell"
                      aria-selected={inSelection(r, 0)}
                      onPointerDown={(e) => cellDown(e, { r, c: 0 })}
                      onPointerEnter={() => cellEnter({ r, c: 0 })}
                      className="sticky left-0 z-10 flex h-full min-w-0 cursor-default items-center border-r border-border/60 bg-[#0b0b0d] px-2 font-mono text-[10.5px] text-foreground/80 transition-colors group-hover:bg-white/[0.03]"
                      style={{ width: colW }}
                    >
                      <span className="truncate">{row.name}</span>
                    </div>
                    {[1, 2].map((c) => (
                      <div
                        key={c}
                        role="gridcell"
                        aria-selected={inSelection(r, c)}
                        onPointerDown={(e) => cellDown(e, { r, c })}
                        onPointerEnter={() => cellEnter({ r, c })}
                        className="flex h-full min-w-0 cursor-default items-center justify-end px-2 font-mono text-[10.5px] tabular-nums text-muted-foreground/75"
                        style={{ width: 84 }}
                      >
                        {edit && edit.r === r && edit.c === c ? (
                          <input
                            autoFocus
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              e.stopPropagation()
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                commitEdit()
                              } else if (e.key === 'Escape') {
                                e.preventDefault()
                                cancelEdit.current = true
                                setEdit(null)
                                gridRef.current?.focus()
                              }
                            }}
                            aria-label={c === 1 ? 'X value' : 'W value'}
                            className="h-[24px] w-full min-w-0 rounded border border-white/10 bg-[#1a1a20] px-1 text-right font-mono text-[10.5px] text-foreground outline-none ring-2 ring-[#52525b]/70"
                          />
                        ) : (
                          valueAt(row, c)
                        )}
                      </div>
                    ))}
                  </div>
                ))}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute z-20 border border-[#f472b6] bg-[#f472b6]/[0.05]"
                  style={{
                    left: colStart(c0),
                    top: r0 * 28,
                    width: colEnd(c1) - colStart(c0),
                    height: (r1 - r0 + 1) * 28,
                  }}
                />
              </div>
            </div>
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy" note="one cell">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'row', value: '28px', note: 'header is also 28px' },
            { name: 'cell padding', value: '8px', note: 'numbers right-aligned' },
            { name: 'frozen column', value: '132px default', note: 'drag 88–190px' },
            { name: 'marquee', value: '1px #f472b6', note: 'selection only' },
            { name: 'edit ring', value: '2px #52525b', note: 'never pink' },
            { name: 'keyboard', value: '↑ ↓ ← → · Enter · Esc', note: 'the grid keeps focus' },
          ]}
        />
      </Section>

      <Usage
        when="Editing many values at once — a token table or a batch of layer positions — inside a panel or sheet. The canvas stays direct manipulation; this is for values."
        rules={[
          'Rows and cells are 28px with one hairline per row. No zebra stripes.',
          'The first column stays frozen while the rest scrolls.',
          'Selection is a range with a 1px pink marquee; a single cell is a 1×1 range.',
          'Enter edits, Escape cancels, arrows move. The mouse is never the only path.',
          'Numbers right-align in Geist Mono and commit on Enter or blur.',
          'A resize handle sits on the frozen column edge; drag or use the arrow keys.',
        ]}
        checks={[
          'Use role=grid with row and gridcell roles, and aria-selected on the cells in the range.',
          'Focus stays on the grid; the edit input takes focus on Enter and returns it on commit.',
          'The marquee is decoration; announce the range as “3 rows, 2 columns selected”.',
          'Column resize is operable from the keyboard and announces the new width.',
        ]}
        edges={[
          'A value that does not parse reverts to the previous number instead of becoming 0.',
          'Dragging past the last row clamps to the edge, never selects outside the grid.',
          'Editing while sorted commits to that row, not to its position.',
          'A column narrower than its header truncates the label and keeps the title.',
          'Paste over a range writes every cell in one transaction or refuses the whole paste.',
          'Escape cancels the edit; a second Escape leaves the grid.',
        ]}
      />
    </Page>
  )
}

/* ------------------------------ Bulk action bar ---------------------------- */

function BarAction({
  icon,
  label,
  disabled,
}: {
  icon: ReactNode
  label: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[11.5px] text-foreground/70 transition-colors hover:bg-white/[0.07] hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {icon}
      {label}
    </button>
  )
}

const FRAMES = [
  { name: 'Hero', left: '6%', top: '10%', width: '44%', height: '60%' },
  { name: 'Headline', left: '54%', top: '10%', width: '36%', height: '24%' },
  { name: 'Cards', left: '54%', top: '40%', width: '36%', height: '14%' },
  { name: 'Nav', left: '54%', top: '60%', width: '36%', height: '10%' },
]

function BulkActionBarPage() {
  const [count, setCount] = useState(4)

  return (
    <Page
      title="Bulk action bar"
      lead="Four selected layers, one pill: align, distribute, group or delete in place."
      meta="40px tall · 16px above the toolbar · 2+ selection"
    >
      <Section title="Bar" note="4 layers selected">
        <Stage
          pad={false}
          className="p-6"
          caption="The bar only exists with 2+ selected. Click the board and press Escape to clear the selection."
        >
          <div
            role="group"
            tabIndex={0}
            aria-label="Canvas demo with selected layers"
            onKeyDown={(e) => {
              if (e.key === 'Escape' && count > 0) {
                e.preventDefault()
                setCount(0)
              }
            }}
            className="relative h-[280px] w-full overflow-hidden rounded-lg bg-[#1c1c1c] outline-none focus-visible:ring-2 focus-visible:ring-[#52525b]/70"
          >
            <span role="status" className="sr-only">
              {count === 0
                ? 'Selection cleared'
                : count === 1
                  ? '1 layer selected'
                  : `${count} layers selected`}
            </span>

            {FRAMES.map((frame, i) => (
              <div
                key={frame.name}
                className={cn(
                  'absolute rounded-sm border transition-colors',
                  i < count ? 'border-[#f472b6]' : 'border-white/10',
                )}
                style={{
                  left: frame.left,
                  top: frame.top,
                  width: frame.width,
                  height: frame.height,
                }}
              >
                <span className="absolute -top-4 left-0 font-mono text-[9px] text-foreground/45">
                  {frame.name}
                </span>
                {i === 0 && (
                  <div className="flex h-full flex-col justify-center gap-2 p-4">
                    <span className="h-2 w-2/3 rounded bg-white/15" />
                    <span className="h-2 w-1/2 rounded bg-white/10" />
                    <span className="h-2 w-1/3 rounded bg-white/10" />
                  </div>
                )}
                {i > 0 && (
                  <div className="flex h-full flex-col justify-center gap-1.5 p-3">
                    <span className="h-1.5 w-2/3 rounded bg-white/10" />
                    <span className="h-1.5 w-1/2 rounded bg-white/[0.08]" />
                  </div>
                )}
              </div>
            ))}

            <div className="absolute right-3 top-3 flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
              <span>Esc clears</span>
              <Kbd>Esc</Kbd>
            </div>

            <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-4">
              {count >= 2 && (
                <div
                  role="toolbar"
                  aria-label={`${count} layers selected`}
                  className="flex h-10 items-center gap-0.5 rounded-full bg-[#1c1c1c] p-1 shadow-2xl shadow-black/50 ring-1 ring-white/[0.06]"
                >
                  <span className="px-2.5 font-mono text-[10.5px] tabular-nums text-muted-foreground">
                    {count} layers
                  </span>
                  <span className="mx-1 h-5 w-px bg-white/10" />
                  <BarAction icon={<AlignHorizontalJustifyCenter size={13} />} label="Align" />
                  <BarAction
                    icon={<AlignHorizontalSpaceAround size={13} />}
                    label="Distribute"
                    disabled={count < 3}
                  />
                  <button
                    type="button"
                    className="ml-0.5 flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-[#f472b6] px-3 text-[11.5px] font-medium text-black transition-colors hover:bg-[#f472b6]/90"
                  >
                    <Group size={13} />
                    Group
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${count} layers`}
                    className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[11.5px] text-[#ef4444] transition-colors hover:bg-[#ef4444]/10"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              )}
              <CanvasToolbar />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] text-muted-foreground/50">Selection</span>
              <div className="w-[172px]">
                <div className="flex items-center gap-0.5 rounded-md bg-white/[0.06] p-0.5">
                  {[
                    { id: 'one', label: '1 layer' },
                    { id: 'four', label: '4 layers' },
                  ].map((item) => {
                    const active = item.id === 'one' ? count === 1 : count === 4
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setCount(item.id === 'one' ? 1 : 4)}
                        className={cn(
                          'h-6 flex-1 cursor-pointer rounded text-[10.5px] transition-colors',
                          active
                            ? 'bg-[#2b2b2b] text-foreground'
                            : 'text-muted-foreground/70 hover:text-foreground',
                        )}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground/40">bar appears at 2+</span>
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy" note="one pill">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'height', value: '40px', note: 'p-1 around 32px buttons' },
            { name: 'offset', value: '16px', note: 'above the toolbar' },
            { name: 'surface', value: '#1c1c1c', note: 'panel, black/50 shadow' },
            { name: 'count', value: '10.5px mono', note: 'first item, never an icon' },
            { name: 'pink', value: '1 action', note: 'Group' },
            { name: 'delete', value: '#ef4444', note: 'text only, undoable' },
            { name: 'Escape', value: 'clears selection', note: 'the board owns the key' },
          ]}
        />
      </Section>

      <Usage
        when="Two or more layers are selected on the canvas and the next action applies to all of them. One selected layer belongs in the properties panel; zero has no bar."
        rules={[
          'The bar exists only for 2+ selected layers and disappears the moment the selection reaches one.',
          'It floats 16px above the canvas toolbar and stays centred on the viewport.',
          'Lead with the count: “4 layers”, not an icon and not “Selection”.',
          'Exactly one action is pink. Align and distribute are immediate; they never open menus.',
          'Distribute needs three or more; below that it disables instead of disappearing.',
          'Escape clears the selection and dismisses the bar. It does not undo.',
        ]}
        checks={[
          'The bar is role=toolbar with a name that includes the count.',
          'Appearing announces the count politely without moving focus off the canvas.',
          'Delete is named “Delete 4 layers” so the scope is not inferred from the bar.',
          'Escape works while focus is on the canvas, not only inside the bar.',
        ]}
        edges={[
          'Two layers: Distribute is disabled and the pill keeps its width.',
          'Sixty layers: the count truncates at the first separator while the actions stay put.',
          'Delete is immediate and undoable; there is no confirm for a selection that can be restored.',
          'A locked layer in the selection disables Align with the reason in its tooltip.',
          'Selection cleared elsewhere removes the bar without waiting for an animation.',
          'A narrow viewport drops the labels to icons and keeps the count.',
        ]}
      />
    </Page>
  )
}

/* --------------------------------- Timeline -------------------------------- */

type Version = {
  id: string
  name: string
  time: string
  iso: string
  author: string
}

const VERSIONS: Version[] = [
  { id: 'v18', name: 'Moved hero grid', time: 'Just now', iso: '2026-03-04T10:12:00Z', author: 'Mira' },
  { id: 'v17', name: 'Spacing pass', time: '12m ago', iso: '2026-03-04T10:00:00Z', author: 'Mira' },
  {
    id: 'v16',
    name: 'Added pricing section',
    time: '2h ago',
    iso: '2026-03-04T08:12:00Z',
    author: 'Jon',
  },
  {
    id: 'v15',
    name: 'Autosave',
    time: 'Yesterday',
    iso: '2026-03-03T18:40:00Z',
    author: 'Petals',
  },
  { id: 'v14', name: 'First frame', time: 'Mar 4', iso: '2026-03-01T09:00:00Z', author: 'Jon' },
]

function TimelinePage() {
  const [versions, setVersions] = useState<Version[]>(VERSIONS)
  const [current, setCurrent] = useState('v18')
  const [confirm, setConfirm] = useState<string | null>(null)
  const [restored, setRestored] = useState<string | null>(null)
  const restoreTrigger = useRef<HTMLButtonElement | null>(null)
  const confirmRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (confirm) confirmRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }, [confirm])

  function closeConfirm() {
    setConfirm(null)
    restoreTrigger.current?.focus()
  }

  return (
    <Page
      title="Timeline"
      lead="Saved versions in a 280px sheet. Newest first, restore behind a confirm."
      spec
      meta="280px sheet · 6px dots · 48px rows"
    >
      <Section title="Sheet" note="version history · newest first">
        <Stage pad={false} className="flex justify-center px-6 py-8">
          <PanelFrame title="Version history" width={280}>
            {restored && (
              <div
                role="status"
                className="border-b border-[#27272f] px-3.5 py-1.5 text-[10.5px] text-muted-foreground/70"
              >
                Restored “{restored}”
              </div>
            )}
            <div className="relative px-3.5 py-2">
              <span className="pointer-events-none absolute bottom-5 left-[25px] top-5 w-px bg-[#27272f]" />
              <ol>
                {versions.map((v) => {
                  const isCurrent = current === v.id
                  return (
                    <li key={v.id}>
                      <div
                        aria-current={isCurrent ? 'true' : undefined}
                        className="group relative flex h-12 items-start gap-2 rounded-md pl-6 pr-1.5 transition-colors hover:bg-white/[0.04]"
                      >
                        <span
                          className={cn(
                            'absolute left-[9px] top-[20px] size-1.5 rounded-full ring-2 ring-[#141418]',
                            isCurrent ? 'bg-[#f472b6]' : 'bg-[#52525b]',
                          )}
                        />
                        <div className="min-w-0 flex-1 pt-2">
                          <p className="truncate text-[12px] text-foreground/85">{v.name}</p>
                          <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground/55">
                            <time dateTime={v.iso} title={v.iso}>
                              {v.time}
                            </time>{' '}
                            · {v.author}
                          </p>
                        </div>
                        {isCurrent ? (
                          <span className="mt-[18px] shrink-0 rounded-full border border-white/10 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/60">
                            current
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(event) => {
                              restoreTrigger.current = event.currentTarget
                              setConfirm(v.id)
                            }}
                            className="mt-[15px] shrink-0 cursor-pointer rounded px-1.5 py-0.5 text-[10.5px] text-muted-foreground/50 opacity-0 transition-opacity hover:bg-white/5 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                      {confirm === v.id && (
                        <div
                          ref={confirmRef}
                          onKeyDown={(event) => {
                            if (event.key === 'Escape') {
                              event.preventDefault()
                              closeConfirm()
                            }
                          }}
                          className="mb-1 ml-6 mt-1 rounded-md border border-border bg-[#1a1a20] p-2.5 shadow-lg shadow-black/40"
                        >
                          <p className="text-[11.5px] text-foreground/85">Restore “{v.name}”?</p>
                          <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted-foreground/55">
                            The current version stays in history.
                          </p>
                          <div className="mt-2 flex justify-end gap-1.5">
                            <Btn size="sm" variant="ghost" onClick={closeConfirm}>
                              Cancel
                            </Btn>
                            <Btn
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                const next: Version = {
                                  id: `v${19 + (versions.length - VERSIONS.length)}`,
                                  name: `Restored “${v.name}”`,
                                  time: 'Just now',
                                  iso: new Date().toISOString(),
                                  author: 'You',
                                }
                                setVersions((prev) => [next, ...prev])
                                setCurrent(next.id)
                                setRestored(v.name)
                                setConfirm(null)
                                restoreTrigger.current?.focus()
                              }}
                            >
                              Restore
                            </Btn>
                          </div>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
            <div className="border-t border-[#27272f] px-3.5 py-2 text-[10px] text-muted-foreground/45">
              Newest first · {18 + versions.length - VERSIONS.length} versions
            </div>
          </PanelFrame>
        </Stage>
      </Section>

      <Section title="Anatomy" note="one version">
        <Rows
          head={['Property', 'Value', 'Note']}
          items={[
            { name: 'sheet', value: '280px', note: 'a sheet, not a panel' },
            { name: 'rail', value: '1px #27272f', note: 'one line, no branches' },
            { name: 'dot', value: '6px', note: 'current #f472b6' },
            { name: 'row', value: '48px', note: 'hover white/4' },
            { name: 'row text', value: 'name · time · author', note: 'one line each' },
            { name: 'restore', value: 'inline confirm', note: 'never one click' },
            { name: 'order', value: 'newest first', note: 'no lanes, no merges' },
          ]}
        />
        <div className="mt-4">
          <Note>
            History is a list. Branching and merges belong in a graph, not in a version sheet
            beside the canvas.
          </Note>
        </div>
      </Section>

      <Usage
        when="A board has saved versions and the user needs to see what changed or go back. Not an activity feed: every row is a restorable point, not a comment or an event."
        rules={[
          'Newest first, always. The current version sits at the top with the pink dot.',
          'One vertical hairline carries every dot; dots are 6px and never labels.',
          'A row is name, relative time, author — in that order, one line each.',
          'Restore opens a confirm inside the sheet; it never restores on a single click.',
          'No branches, lanes or merge marks. History is a list.',
          'Autosaves fold into the nearest manual version instead of adding a row per save.',
        ]}
        checks={[
          'The list is an ordered list; the current row is marked aria-current.',
          'Each time is a time element with the absolute date in its title.',
          'Restore moves focus into the confirm, Escape closes it, and focus returns to the row.',
          'The sheet heading says newest first once, so the order is not colour-only.',
        ]}
        edges={[
          'More than 50 versions load 50, then a “Show older versions” row at the bottom.',
          'A version with no name uses its timestamp as the name.',
          'Another collaborator restores while the sheet is open: the dot moves without stealing focus.',
          'Relative times older than seven days become dates; the exact time stays in the title.',
          'A new board with no history shows “Initial version” with the current dot.',
          'Restoring the current version is not offered at all.',
        ]}
      />
    </Page>
  )
}

export const dataPages: Record<string, ComponentType> = {
  'components/filter-bar': FilterBarPage,
  'components/table': TablePage,
  'components/data-grid': DataGridPage,
  'components/bulk-action-bar': BulkActionBarPage,
  'components/timeline': TimelinePage,
}
