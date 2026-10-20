import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ----------------------------------------------------------------------------
 * The docs skeleton. Styling is Petals' own: black page, hairline borders,
 * Geist, pink only where the product uses pink (selection, brand).
 * ------------------------------------------------------------------------- */

export function Page({
  title,
  lead,
  spec,
  meta,
  children,
}: {
  title: string
  lead: string
  /** documented and drawn, but not in the editor yet */
  spec?: boolean
  /** short trailing facts, e.g. "6 sizes · 4 states" */
  meta?: string
  children: ReactNode
}) {
  return (
    <div>
      <header>
        <div className="flex items-center gap-2.5">
          <h1 className="text-[32px] font-medium leading-none tracking-[-0.025em] text-foreground">{title}</h1>
          {spec && (
            <span className="rounded-full border border-dashed border-white/20 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
              spec
            </span>
          )}
        </div>
        <p className="mt-3 max-w-[60ch] text-[14px] leading-relaxed text-[#9a9aa4]">{lead}</p>
        {meta && <p className="mt-2 font-mono text-[10px] text-muted-foreground/50">{meta}</p>}
        {spec && (
          <p className="mt-3 max-w-[60ch] border-l-2 border-white/15 pl-3 text-[12px] leading-relaxed text-muted-foreground/70">
            Documented so the next screen has one answer. Nothing here ships in the editor yet.
          </p>
        )}
      </header>
      <div className="mt-12 flex flex-col gap-12">{children}</div>
    </div>
  )
}

export function Section({
  title,
  note,
  id,
  children,
}: {
  title: string
  note?: string
  id?: string
  children: ReactNode
}) {
  const key = id ?? slugify(title)
  return (
    <section id={key} data-toc={title} className="scroll-mt-24">
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2.5">
        <h2 className="text-[13px] font-semibold tracking-[0.01em] text-foreground/90">{title}</h2>
        {note && <span className="truncate font-mono text-[10px] text-muted-foreground/50">{note}</span>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export type Tile = {
  label: string
  note?: string
  node: ReactNode
  /** a demo that needs room (a whole panel, a card grid) */
  wide?: boolean
}

/** The Glaze-style option grid: one bordered surface per variant, a caption strip under it. */
export function Tiles({ items, min = 200 }: { items: Tile[]; min?: number }) {
  return (
    <div
      className="grid gap-2.5"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` }}
    >
      {items.map((t) => (
        <div
          key={t.label + (t.note ?? '')}
          className={cn(
            'flex flex-col overflow-hidden rounded-xl border border-border bg-[#0b0b0d]',
            t.wide && 'col-span-full',
          )}
        >
          <div className="flex min-h-[104px] flex-1 items-center justify-center px-3 py-2.5">{t.node}</div>
          <div className="flex items-center justify-between gap-2 border-t border-border/80 px-3 py-2.5">
            <span className="truncate text-[11px] text-foreground/75">{t.label}</span>
            {t.note && <span className="shrink-0 font-mono text-[10px] text-muted-foreground/50">{t.note}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

/** A wide framed surface for one composition, with an optional caption underneath. */
export function Stage({
  children,
  caption,
  pad = true,
  className,
}: {
  children: ReactNode
  caption?: string
  pad?: boolean
  className?: string
}) {
  return (
    <figure className="overflow-hidden rounded-xl border border-border bg-[#0b0b0d]">
      <div className={cn('overflow-x-auto', pad && 'p-6', className)}>{children}</div>
      {caption && (
        <figcaption className="border-t border-border/80 px-3 py-2.5 text-[11px] text-muted-foreground/70">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

export function Usage({
  when,
  rules,
  checks,
  edges,
  keys,
}: {
  when: string | ReactNode
  rules?: string[]
  checks?: string[]
  edges?: string[]
  keys?: string[]
}) {
  return (
    <Section title="Usage" id="usage">
      <div className="flex flex-col gap-8">
        <div>
          <h3 className="text-[12px] font-semibold text-foreground/80">When to use it</h3>
          <p className="mt-2 max-w-[62ch] text-[13px] leading-relaxed text-[#9a9aa4]">{when}</p>
        </div>
        <div className="flex flex-col gap-2">
          {rules && rules.length > 0 && <List title="Rules" items={rules} />}
          {checks && checks.length > 0 && <List title="Accessibility" items={checks} />}
          {keys && keys.length > 0 && <List title="Keyboard" items={keys} mono />}
          {edges && edges.length > 0 && <List title="Edge cases" items={edges} />}
        </div>
      </div>
    </Section>
  )
}

export function List({ title, items, mono }: { title: string; items: string[]; mono?: boolean }) {
  const [open, setOpen] = useState(false)
  const noun =
    title === 'Rules'
      ? 'rules'
      : title === 'Accessibility'
        ? 'checks'
        : title === 'Keyboard'
          ? 'keys'
          : 'edge cases'
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="text-[12px] font-medium text-foreground/85">{title}</span>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground/50">
          {items.length} {noun}
        </span>
        <ChevronDown
          size={13}
          className={cn('shrink-0 text-muted-foreground/60 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <ul className="border-t border-border/70 px-3.5 py-2">
            {items.map((r) => (
              <li
                key={r}
                className={cn(
                  'flex gap-2.5 py-1.5 text-[12.5px] leading-relaxed text-[#b9b9c2]',
                  mono && 'font-mono text-[11.5px]',
                )}
              >
                <span className="mt-[7px] h-px w-2.5 shrink-0 bg-muted-foreground/35" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

/** name / value / where — the table every token and API page uses. */
export function Rows({
  items,
  head,
  mono = true,
}: {
  items: Array<{ name: string; value: string; note?: string }>
  head?: [string, string, string]
  mono?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px]">
        {head && (
          <div className="grid grid-cols-[190px_1fr_150px] gap-4 border-b border-border pb-2 text-[10px] font-medium text-muted-foreground/45">
            <span>{head[0]}</span>
            <span>{head[1]}</span>
            <span className="text-right">{head[2]}</span>
          </div>
        )}
        {items.map((r) => (
          <div
            key={r.name + r.value}
            className="grid grid-cols-[190px_1fr_150px] items-baseline gap-4 border-b border-border/60 py-2.5"
          >
            <code className={cn('truncate text-[11.5px] text-foreground/85', !mono && 'font-sans text-[12px]')}>
              {r.name}
            </code>
            <span className={cn('min-w-0 text-[12px] text-foreground/80', mono && 'font-mono text-[11.5px]')}>
              {r.value}
            </span>
            <span className="text-right text-[10.5px] text-muted-foreground/55">{r.note ?? ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Snippet({ children, label }: { children: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), [])
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#08080a]">
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-1.5">
        <span className="font-mono text-[10px] text-muted-foreground/50">{label ?? 'jsx'}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(children).catch(() => {})
            setCopied(true)
            if (timer.current) clearTimeout(timer.current)
            timer.current = setTimeout(() => setCopied(false), 1200)
          }}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className="flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground/60 hover:bg-white/5 hover:text-foreground"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
      <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[11.5px] leading-relaxed text-[#c9c9d2]">
        <code>{children}</code>
      </pre>
    </div>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-r-md border-l-2 border-[#f472b6]/60 bg-white/[0.02] py-2.5 pl-3.5 pr-4 text-[12.5px] leading-relaxed text-[#b9b9c2]">
      {children}
    </div>
  )
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
