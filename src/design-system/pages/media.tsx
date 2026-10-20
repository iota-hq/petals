import { useId, useState } from 'react'
import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { CircleAlert, Loader2, RefreshCw, X } from 'lucide-react'
import { Page, Section, Stage, Tiles, Usage, Rows, Note } from '../Doc'
import { PanelFrame, SegRow } from '../bits'
import { cn } from '@/lib/utils'

/* -------------------------------- Attachment ------------------------------- */

const CHECKER: CSSProperties = {
  backgroundImage: 'conic-gradient(#26262c 25%, #17171b 0 50%, #26262c 0 75%, #17171b 0)',
  backgroundSize: '8px 8px',
}

const BLOB = 'M32 4C47 4 59 15 59 31C59 48 47 60 32 60C17 60 5 48 5 31C5 15 17 4 32 4Z'

function Artwork({ className }: { className?: string }) {
  const raw = useId()
  const gid = `art-${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg viewBox="0 0 64 64" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${gid}-sky`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f9a8d4" />
          <stop offset="0.55" stopColor="#f472b6" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={`${gid}-dune`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#fde68a" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fca5a5" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${gid}-clip`}>
          <path d={BLOB} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${gid}-clip)`}>
        <path d={BLOB} fill={`url(#${gid}-sky)`} />
        <circle cx="46" cy="17" r="15" fill="#fde68a" opacity="0.8" />
        <path
          d="M-4 48C10 34 22 40 34 30C42 23 52 22 68 26V64H-4Z"
          fill={`url(#${gid}-dune)`}
          opacity="0.9"
        />
        <path
          d="M-4 54C12 44 24 50 38 42C48 36 58 38 68 42V64H-4Z"
          fill="#7c2d5a"
          opacity="0.35"
        />
        <path
          d="M8 40C18 24 30 28 42 18"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="8" y="8" width="17" height="17" rx="7" fill="#ffffff" opacity="0.18" />
      </g>
    </svg>
  )
}

type AssetState = 'rest' | 'hover' | 'uploading' | 'error'

function AssetAction({
  label,
  onClick,
  children,
}: {
  label: string
  onClick?: () => void
  children: ReactNode
}) {
  const shared = 'flex size-5 items-center justify-center rounded bg-black/40 text-foreground/80'
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        className={cn(shared, 'cursor-pointer transition-colors hover:bg-white/15 hover:text-foreground')}
      >
        {children}
      </button>
    )
  }
  return (
    <span title={label} aria-hidden="true" className={cn(shared, 'cursor-default')}>
      {children}
    </span>
  )
}

function Asset({
  state,
  name = 'hero-cover.png',
  onRemove,
  onReplace,
}: {
  state: AssetState
  name?: string
  onRemove?: () => void
  onReplace?: () => void
}) {
  const meta =
    state === 'uploading'
      ? 'Uploading · 64%'
      : state === 'error'
        ? 'Upload failed'
        : '1440 × 900 · 284 KB'

  return (
    <div className="flex w-full items-center gap-3">
      <div
        className={cn(
          'group relative size-16 shrink-0 overflow-hidden rounded-md ring-1 ring-inset ring-white/10',
          state === 'error' && 'ring-[#ef4444]/50',
        )}
        style={CHECKER}
      >
        <Artwork className="absolute inset-0 size-full" />
        {(state === 'rest' || state === 'hover') && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center gap-1 bg-black/55 transition-opacity group-focus-within:opacity-100',
              state === 'hover' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}
          >
            <AssetAction label={`Replace ${name}`} onClick={onReplace}>
              <RefreshCw size={11} />
            </AssetAction>
            <AssetAction label={`Remove ${name}`} onClick={onRemove}>
              <X size={11} />
            </AssetAction>
          </div>
        )}
        {state === 'uploading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/60 text-foreground">
            <Loader2 size={13} className="animate-spin" />
            <span className="font-mono text-[9px]">64%</span>
          </div>
        )}
        {state === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55">
            <CircleAlert size={15} className="text-[#ef4444]" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] text-foreground/85">{name}</p>
        <p
          className={cn(
            'mt-0.5 truncate font-mono text-[10px]',
            state === 'error' ? 'text-[#ef4444]' : 'text-muted-foreground/55',
          )}
        >
          {meta}
        </p>
        {state === 'uploading' && (
          <span
            role="progressbar"
            aria-label={`Uploading ${name}`}
            aria-valuenow={64}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-1.5 block h-0.5 w-full max-w-[140px] overflow-hidden rounded-full bg-white/10"
          >
            <span className="block h-full w-[64%] bg-foreground/50" />
          </span>
        )}
        {state === 'error' && (
          <span
            title="Retry upload"
            className="mt-1 inline-block cursor-default text-[10px] text-[#ef4444]"
          >
            Retry upload
          </span>
        )}
      </div>
    </div>
  )
}

function AttachmentPage() {
  const [removed, setRemoved] = useState(false)
  const [name, setName] = useState('hero-cover.png')
  const [compactName, setCompactName] = useState('hero-cover.png')
  const [fill, setFill] = useState('image')

  return (
    <Page
      title="Attachment"
      lead="An image on a layer or fill: preview, dimensions, and a way to swap it."
      meta="64px thumbnail · 28px compact row · checkerboard behind"
    >
      <Section title="Asset" note="64px thumbnail">
        <Tiles
          min={280}
          items={[
            {
              label: 'rest',
              note: 'hover for actions',
              node: removed ? (
                <div className="flex h-16 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border text-[11px] text-muted-foreground/50">
                  Image removed
                  <button
                    type="button"
                    onClick={() => {
                      setRemoved(false)
                      setName('hero-cover.png')
                    }}
                    className="cursor-pointer text-foreground/70 underline-offset-2 hover:underline"
                  >
                    Undo
                  </button>
                </div>
              ) : (
                <Asset
                  state="rest"
                  name={name}
                  onRemove={() => setRemoved(true)}
                  onReplace={() => setName('hero-cover-2.png')}
                />
              ),
            },
            {
              label: 'hover',
              note: 'replace · remove',
              node: <Asset state="hover" name={name} />,
            },
            {
              label: 'uploading',
              note: '64%',
              node: <Asset state="uploading" />,
            },
            {
              label: 'error',
              note: 'retry',
              node: <Asset state="error" />,
            },
          ]}
        />
      </Section>

      <Section title="Compact" note="fill section · 28px">
        <Stage pad={false} className="flex justify-center px-6 py-8">
          <PanelFrame title="Fill" width={240}>
            <div className="space-y-2 px-3.5 py-3">
              <SegRow
                items={[
                  { id: 'solid', label: 'Solid' },
                  { id: 'image', label: 'Image' },
                  { id: 'none', label: 'None' },
                ]}
                value={fill}
                onChange={setFill}
              />
              {fill === 'image' ? (
                <div className="group flex h-7 items-center gap-2 rounded-md px-1 transition-colors hover:bg-white/[0.04]">
                  <span
                    className="relative size-5 shrink-0 overflow-hidden rounded ring-1 ring-inset ring-white/10"
                    style={CHECKER}
                  >
                    <Artwork className="absolute inset-0 size-full" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-foreground/80">
                    {compactName}
                  </span>
                  <span className="shrink-0 font-mono text-[9.5px] text-muted-foreground/45">284 KB</span>
                  <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <AssetAction
                      label={`Replace ${compactName}`}
                      onClick={() =>
                        setCompactName((current) =>
                          current === 'hero-cover.png' ? 'hero-cover-2.png' : 'hero-cover.png',
                        )
                      }
                    >
                      <RefreshCw size={10} />
                    </AssetAction>
                    <AssetAction
                      label={`Remove ${compactName}`}
                      onClick={() => setFill('none')}
                    >
                      <X size={10} />
                    </AssetAction>
                  </span>
                </div>
              ) : (
                <p className="px-1 py-1 text-[11px] text-muted-foreground/50">
                  {fill === 'solid' ? 'Color fill · #08080a' : 'No fill'}
                </p>
              )}
            </div>
          </PanelFrame>
        </Stage>
      </Section>

      <Usage
        when="An image attached to a layer, a fill or a board: the user needs to see which file it is, its dimensions, its size, and how to swap it. Not for avatars or logos with a fixed frame."
        rules={[
          'The thumbnail is 64px in an asset row and 20px inside a fill row. Nothing in between.',
          'Show the file name, pixel dimensions and file size, in that order.',
          'Replace and remove appear on hover or focus, never as a permanent pair of buttons.',
          'A transparent image always sits on the checkerboard, never on the panel colour.',
          'Never recolour, tint or crop the artwork; only the thumbnail frame has a radius.',
          'Upload progress replaces the meta line. It never adds a second row.',
        ]}
        checks={[
          'The thumbnail names the file, or is aria-hidden with the name on the row.',
          'Hover actions are reachable by keyboard and appear on focus-within.',
          'Upload progress uses progressbar semantics, not just a spinner.',
          'Replace and remove have distinct names that include the file name.',
        ]}
        edges={[
          'A long file name truncates in the middle and keeps the extension visible.',
          'A 0-byte or broken image shows the error state with retry, never an empty grey box.',
          'Removing the only fill leaves the layer transparent and keeps undo.',
          'Uploads over 20 MB warn before they start and can be cancelled.',
          'Replacing an image keeps the layer crop and corner radius; only the source changes.',
          'An image that fails after attaching keeps its dimensions and offers Relink.',
        ]}
      />
    </Page>
  )
}

/* ---------------------------------- Chart ---------------------------------- */

type Point = { label: string; value: number }

const READS: Point[] = [
  { label: 'Thu 8', value: 520 },
  { label: 'Fri 9', value: 610 },
  { label: 'Sat 10', value: 480 },
  { label: 'Sun 11', value: 390 },
  { label: 'Mon 12', value: 720 },
  { label: 'Tue 13', value: 810 },
  { label: 'Wed 14', value: 760 },
  { label: 'Thu 15', value: 690 },
  { label: 'Fri 16', value: 940 },
  { label: 'Sat 17', value: 880 },
  { label: 'Sun 18', value: 640 },
  { label: 'Mon 19', value: 1020 },
  { label: 'Tue 20', value: 1180 },
  { label: 'Wed 21', value: 1120 },
]

const TREND = [12, 18, 14, 22, 19, 27, 24, 31, 28, 36]
const TOTAL_READS = READS.reduce((sum, point) => sum + point.value, 0)

function formatAxis(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return String(Math.round(value))
}

function Sparkline({
  data,
  width = 160,
  height = 44,
}: {
  data: number[]
  width?: number
  height?: number
}) {
  const raw = useId()
  const gid = `spark-${raw.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const pad = 3
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const step = data.length > 1 ? (width - pad * 2) / (data.length - 1) : 0
  const points = data.map((value, i) => {
    const x = pad + i * step
    const y = height - pad - ((value - min) / span) * (height - pad * 2)
    return [x, y] as const
  })
  const line = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ')
  const area = `${line} L${(width - pad).toFixed(1)} ${height} L${pad} ${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Daily renders, rising trend"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f472b6" stopOpacity="0.22" />
          <stop offset="1" stopColor="#f472b6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke="#f472b6"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BarChart({
  data,
  width = 340,
  height = 140,
  hovered = null,
  onHover,
}: {
  data: Point[]
  width?: number
  height?: number
  hovered?: number | null
  onHover?: (index: number | null) => void
}) {
  const gutter = 30
  const top = 6
  const bottom = 22
  const plotW = width - gutter
  const plotH = height - top - bottom
  const max = Math.max(...data.map((point) => point.value), 1)
  const gap = 1
  const barW = (plotW - gap * (data.length - 1)) / data.length
  const baseline = top + plotH

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Renders per day, ${data.length} days`}
    >
      {[0.5, 1].map((tick) => {
        const y = baseline - tick * plotH
        return (
          <line
            key={tick}
            x1={gutter}
            x2={width}
            y1={y}
            y2={y}
            stroke="#27272f"
            strokeWidth={1}
          />
        )
      })}
      {[0, 0.5, 1].map((tick) => (
        <text
          key={tick}
          x={gutter - 8}
          y={baseline - tick * plotH + 3}
          textAnchor="end"
          fontSize={10}
          fill="#9a9aa4"
          opacity={0.65}
        >
          {formatAxis(tick * max)}
        </text>
      ))}

      {data.map((point, i) => {
        const h = Math.max(1, (point.value / max) * plotH)
        const x = gutter + i * (barW + gap)
        return (
          <g key={point.label}>
            <rect
              x={x}
              y={baseline - h}
              width={barW}
              height={h}
              rx={1}
              fill="#f472b6"
              opacity={hovered === i ? 1 : 0.45}
            />
            <rect
              x={x}
              y={top}
              width={barW}
              height={plotH}
              fill="transparent"
              pointerEvents="all"
              onPointerEnter={() => onHover?.(i)}
              onPointerLeave={() => onHover?.(null)}
            />
          </g>
        )
      })}

      <line
        x1={gutter}
        x2={width}
        y1={baseline}
        y2={baseline}
        stroke="#27272f"
        strokeWidth={1}
      />
      {data.map((point, i) =>
        i % 2 === 0 ? (
          <text
            key={point.label}
            x={gutter + i * (barW + gap) + barW / 2}
            y={height - 6}
            textAnchor="middle"
            fontSize={10}
            fill="#9a9aa4"
            opacity={0.65}
          >
            {point.label}
          </text>
        ) : null,
      )}
    </svg>
  )
}

function EmptyChart({ width = 200, height = 104 }: { width?: number; height?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-md border border-dashed border-border bg-[#0b0b0d]"
      style={{ width, height }}
    >
      <span className="text-[10.5px] text-muted-foreground/50">No data for this period</span>
    </div>
  )
}

function ChartCard({
  hovered,
  onHover,
}: {
  hovered: number | null
  onHover: (index: number | null) => void
}) {
  const read = hovered === null ? null : READS[hovered]
  return (
    <div className="w-full max-w-[380px] rounded-xl border border-border bg-[#0b0b0d] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11.5px] text-muted-foreground/70">Renders</p>
          <p className="mt-1 text-[22px] font-medium leading-none tabular-nums text-foreground">
            {TOTAL_READS.toLocaleString('en-US')}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] text-muted-foreground/45">
            {read ? read.label : 'Last 14 days'}
          </p>
          <p className="mt-1 text-[11px] tabular-nums text-foreground/70">
            {read ? `${read.value} renders` : '+18%'}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <BarChart data={READS} hovered={hovered} onHover={onHover} />
      </div>

      <div className="mt-2 flex items-center gap-2 border-t border-border/60 pt-2">
        <Sparkline data={TREND} width={84} height={20} />
        <span className="text-[10px] text-muted-foreground/50">Daily renders</span>
        <span className="ml-auto font-mono text-[9.5px] text-muted-foreground/40">UTC</span>
      </div>
    </div>
  )
}

function ChartPage() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <Page
      title="Chart"
      lead="Usage analytics on /projects: one pink series, hairline axes, SVG only."
      spec
      meta="2px sparkline · 1px bar gap · 3 gridlines max"
    >
      <Section title="Forms" note="sparkline · bars · empty">
        <Tiles
          min={250}
          items={[
            {
              label: 'sparkline',
              note: '2px + area',
              node: <Sparkline data={TREND} width={200} height={44} />,
            },
            {
              label: 'bars',
              note: '1px gap',
              node: <BarChart data={READS.slice(7)} width={200} height={104} />,
            },
            {
              label: 'empty',
              note: 'no data',
              node: <EmptyChart width={200} height={104} />,
            },
          ]}
        />
        <div className="mt-4">
          <Note>
            One pink series per chart. A second series is neutral grey; a third belongs in a table,
            not in another hue.
          </Note>
        </div>
      </Section>

      <Section title="Analytics" note="hover reads a day">
        <Stage caption="The hovered day replaces the range in the header. The chart never animates its axes.">
          <div className="flex justify-center">
            <ChartCard hovered={hovered} onHover={setHovered} />
          </div>
        </Stage>
      </Section>

      <Section title="Anatomy" note="one series">
        <Rows
          head={['Part', 'Value', 'Note']}
          items={[
            { name: 'sparkline', value: '2px #f472b6', note: 'rounded joins' },
            { name: 'area', value: '22% → 0', note: 'soft fill below' },
            { name: 'bars', value: '1px gap', note: 'rx 1px' },
            { name: 'gridlines', value: '3 max', note: '#27272f' },
            { name: 'labels', value: '10px', note: 'muted #9a9aa4' },
            { name: 'series', value: '1 pink max', note: 'a second is grey' },
            { name: 'empty', value: 'dashed', note: 'never a flat line' },
          ]}
        />
      </Section>

      <Usage
        when="A trend the user reads at a glance on /projects or in the docs: renders, exports, storage. Never in the editor, where the canvas is the data."
        rules={[
          'SVG only. No chart library, no canvas element.',
          'One pink series. A second series is neutral grey and the third belongs in a table.',
          'A sparkline is 2px with a soft area and no axes.',
          'Bars sit 1px apart and gridlines stop at three.',
          'Labels are 10px muted. One series means no legend.',
          'An empty period shows the empty state, not a flat line that reads as zero.',
        ]}
        checks={[
          'The chart is role=img; its label names the period and the header carries the total.',
          'Hover is enhancement only: the axis scale and total already state what a bar means.',
          'Colour is not the only cue: the range is labelled and the axis carries the scale.',
          'Any entrance motion is under 200ms and honours reduced motion.',
        ]}
        edges={[
          'A single data point draws one centred bar, not a full-width line.',
          'All values zero show the empty state instead of a baseline.',
          'A negative value clamps to zero; no series draws below the axis.',
          'Ninety days thin the labels to every seventh day instead of overlapping them.',
          'Hovering the last bar keeps the readout inside the card.',
          'A large total abbreviates on the axis while the header keeps the exact number.',
        ]}
      />
    </Page>
  )
}

export const mediaPages: Record<string, ComponentType> = {
  'components/attachment': AttachmentPage,
  'components/chart': ChartPage,
}
