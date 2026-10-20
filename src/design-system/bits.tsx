import { useState, type ReactNode } from 'react'
import {
  ChevronDown,
  Circle,
  Frame,
  Hand,
  Image as ImageIcon,
  LayoutGrid,
  Minus,
  MousePointer2,
  Redo2,
  Square,
  Type,
  Undo2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ----------------------------------------------------------------------------
 * Small, honest replicas of the editor's chrome. The real components live in
 * the editor (NumField, MiniSelect, Section) and are not importable without a
 * store, so docs draw the same pixels from the same tokens.
 * ------------------------------------------------------------------------- */

export type BtnVariant = 'primary' | 'white' | 'dark' | 'outline' | 'ghost' | 'subtle' | 'danger'
export type BtnSize = 'sm' | 'md' | 'lg' | 'icon'

const BTN: Record<BtnVariant, string> = {
  primary: 'bg-[#f472b6] text-[#2b0a1c] hover:bg-[#f472b6]/90',
  white: 'bg-white text-neutral-950 hover:bg-white/90',
  dark: 'bg-[#262626] text-foreground hover:bg-[#333333]',
  outline: 'border border-border bg-transparent text-foreground hover:bg-white/5',
  ghost: 'text-foreground hover:bg-white/[0.06]',
  subtle: 'bg-[#2b2b2b] text-foreground/90 hover:bg-[#333333]',
  danger: 'bg-[#ef4444] text-white hover:bg-[#ef4444]/90',
}
const SIZE: Record<BtnSize, string> = {
  sm: 'h-7 gap-1.5 px-2.5 text-[11.5px]',
  md: 'h-8 gap-1.5 px-3 text-[12.5px]',
  lg: 'h-10 gap-2 px-5 text-[13.5px]',
  icon: 'size-7',
}

export function Btn({
  children,
  variant = 'dark',
  size = 'md',
  pill,
  disabled,
  className,
  onClick,
  title,
}: {
  children: ReactNode
  variant?: BtnVariant
  size?: BtnSize
  pill?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void
  title?: string
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center whitespace-nowrap font-medium transition-colors select-none disabled:pointer-events-none disabled:opacity-45',
        pill ? 'rounded-full' : 'rounded-md',
        BTN[variant],
        SIZE[size],
        className,
      )}
    >
      {children}
    </button>
  )
}

/** A 28px panel field: optional leading glyph, value, optional trailing unit. */
export function Field({
  label,
  value,
  unit,
  icon,
  state = 'rest',
  className,
}: {
  label?: string
  value: ReactNode
  unit?: string
  icon?: ReactNode
  state?: 'rest' | 'hover' | 'focus' | 'disabled' | 'error'
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex h-7 min-w-0 items-center gap-1.5 rounded-md bg-[#2b2b2b] px-1.5 text-[13px] font-medium text-foreground/90',
        state === 'hover' && 'bg-[#313131]',
        state === 'focus' && 'ring-2 ring-[#52525b]/70',
        state === 'error' && 'ring-1 ring-[#ef4444]/70',
        state === 'disabled' && 'opacity-45',
        className,
      )}
    >
      {icon && <span className="flex shrink-0 items-center text-muted-foreground/75">{icon}</span>}
      {label && <span className="shrink-0 text-[11px] text-muted-foreground/70">{label}</span>}
      <span className="min-w-0 flex-1 truncate text-right tabular-nums">{value}</span>
      {unit && <span className="shrink-0 text-[11px] text-muted-foreground/60">{unit}</span>}
    </span>
  )
}

/** The MiniSelect trigger, with the chevron and neutral focus it has in the panel. */
export function SelectField({
  value,
  state = 'rest',
  className,
}: {
  value: string
  state?: 'rest' | 'hover' | 'focus' | 'open' | 'disabled'
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex h-7 min-w-0 items-center gap-2 rounded-md bg-[#2b2b2b] px-2 text-[12.5px] text-foreground/90',
        state === 'hover' && 'bg-[#313131]',
        state === 'focus' && 'ring-2 ring-[#52525b]/70',
        state === 'open' && 'bg-[#25252b] ring-1 ring-white/10',
        state === 'disabled' && 'opacity-45',
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate">{value}</span>
      <ChevronDown size={12} className="shrink-0 text-muted-foreground/70" />
    </span>
  )
}

export function Swatch({
  color,
  size = 28,
  radius = 6,
  ring = true,
}: {
  color: string
  size?: number
  radius?: number
  ring?: boolean
}) {
  return (
    <span
      className={cn('inline-block shrink-0', ring && 'ring-1 ring-inset ring-white/10')}
      style={{ background: color, width: size, height: size, borderRadius: radius }}
    />
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-white/12 bg-[#1a1a1f] px-1.5 font-sans text-[10px] font-medium text-foreground/75">
      {children}
    </kbd>
  )
}

export function Dot({ color = '#f472b6', size = 6, pulse }: { color?: string; size?: number; pulse?: boolean }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      {pulse && (
        <span
          className="absolute inset-0 animate-ping rounded-full opacity-50"
          style={{ background: color }}
        />
      )}
      <span className="absolute inset-0 rounded-full" style={{ background: color }} />
    </span>
  )
}

/** A panel section heading with the one +/− slot the real Section has. */
export function PanelSection({
  icon,
  title,
  open = true,
  children,
}: {
  icon?: ReactNode
  title: string
  open?: boolean
  children?: ReactNode
}) {
  return (
    <div className="border-b border-[#27272f] px-3.5 py-3">
      <div className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.01em] text-foreground/90">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="min-w-0 flex-1 truncate">{title}</span>
        <span className="text-[11px] font-normal text-muted-foreground">{open ? '−' : '+'}</span>
      </div>
      {open && children && <div className="mt-2 space-y-1.5">{children}</div>}
    </div>
  )
}

/** A tiny, static layer row for lists and panels. */
export function LayerRow({
  icon,
  name,
  active,
  depth = 0,
  trailing,
}: {
  icon?: ReactNode
  name: string
  active?: boolean
  depth?: number
  trailing?: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex h-[26px] items-center gap-1.5 rounded-md pr-1.5 text-[12px]',
        active ? 'bg-[#2b2b2b] text-foreground' : 'text-foreground/70 hover:bg-white/[0.04]',
      )}
      style={{ marginLeft: depth * 12 }}
    >
      <span className="w-1.5 shrink-0" />
      {icon && <span className="shrink-0 text-muted-foreground/70">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {trailing}
    </div>
  )
}

/** The floating canvas toolbar, rendered as it sits over a board: 44px tall,
 *  radius 16, one pink chip for the active tool, 32px tool targets. */
export function CanvasToolbar({
  active = 'select',
  className,
}: {
  active?: string
  className?: string
}) {
  const tools: Array<[string, ReactNode, boolean?]> = [
    ['select', <MousePointer2 key="i" size={15} />],
    ['hand', <Hand key="i" size={15} />, true],
    ['frame', <Frame key="i" size={15} />],
    ['rect', <Square key="i" size={15} />],
    ['ellipse', <Circle key="i" size={15} />],
    ['line', <Minus key="i" size={15} />, true],
    ['text', <Type key="i" size={15} />],
    ['image', <ImageIcon key="i" size={15} />],
  ]
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-2xl border border-border bg-popover/95 p-1.5 shadow-2xl shadow-black/50 backdrop-blur',
        className,
      )}
    >
      {tools.map(([id, icon, divider]) => (
        <span key={id} className="flex items-center gap-0.5">
          <span
            title={id}
            className={cn(
              'flex size-8 items-center justify-center rounded-lg',
              active === id
                ? 'bg-[#f472b6] text-[#2b0a1c]'
                : 'text-muted-foreground',
            )}
          >
            {icon}
          </span>
          {id === 'frame' && (
            <span className="flex h-8 w-4 items-center justify-center rounded-lg text-muted-foreground/70">
              <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                <path d="M1 3 L4 6 L7 3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          )}
          {divider && <span className="mx-1 h-5 w-px shrink-0 bg-border" />}
        </span>
      ))}
      <span className="mx-1 h-5 w-px shrink-0 bg-border" />
      <span className="flex size-8 items-center justify-center rounded-lg text-muted-foreground">
        <LayoutGrid size={15} />
      </span>
      <span className="mx-1 h-5 w-px shrink-0 bg-border" />
      <span className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/45">
        <Undo2 size={15} />
      </span>
      <span className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/45">
        <Redo2 size={15} />
      </span>
    </div>
  )
}

/** A compact window frame for demos that need a surface inside the docs. */
export function PanelFrame({
  title,
  children,
  width = 240,
  className,
}: {
  title?: string
  children: ReactNode
  width?: number
  className?: string
}) {
  return (
    <div
      className={cn('overflow-hidden rounded-lg border border-[#27272f] bg-[#141418]', className)}
      style={{ width }}
    >
      {title && (
        <div className="flex h-8 items-center gap-2 border-b border-[#27272f] px-3 text-[12px] font-semibold text-foreground/85">
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

/** Live/static segmented row used by the fill and align demos. */
export function SegRow({
  items,
  value,
  onChange,
  className,
}: {
  items: Array<{ id: string; label?: string; icon?: ReactNode }>
  value: string
  onChange?: (id: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex w-full items-center gap-0.5 rounded-md bg-[#262626] p-0.5', className)}>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          aria-label={it.label ?? it.id}
          aria-pressed={value === it.id}
          onClick={() => onChange?.(it.id)}
          className={cn(
            'flex h-6 flex-1 cursor-pointer items-center justify-center gap-1 rounded text-[11px] font-medium transition-colors',
            value === it.id
              ? 'bg-[#353535] text-foreground'
              : 'text-muted-foreground/70 hover:text-foreground',
          )}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </div>
  )
}

/** For pages that need a toggled demo without repeating useState. */
export function useDemo(initial = false) {
  const [on, setOn] = useState(initial)
  return [on, () => setOn((v) => !v)] as const
}
