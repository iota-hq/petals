import type { ComponentType } from 'react'
import { ArrowUpRight, Circle, Frame, Image as ImageIcon, Square, Type } from 'lucide-react'
import { go } from '@/App'
import { FlowerLogo } from '@/components/PageMenu'
import { NAV } from '../nav'
import { Page, Section, Stage } from '../Doc'
import { Swatch } from '../bits'

/* ------------------------------ editor mock ------------------------------- */

function Field({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <span className="flex h-6 items-center gap-1 rounded bg-[#2b2b2b] px-1.5 text-[10px]">
      <span className="text-[9px] text-muted-foreground/70">{label}</span>
      <span className="ml-auto tabular-nums text-foreground/85">{value}</span>
      {unit && <span className="text-[8.5px] text-muted-foreground/50">{unit}</span>}
    </span>
  )
}

function EditorMock() {
  return (
    <div className="min-w-[620px]">
      <div className="flex h-[248px] overflow-hidden rounded-lg border border-[#27272f] bg-[#101013]">
        {/* left panel */}
        <div className="flex w-[164px] shrink-0 flex-col border-r border-[#27272f] bg-[#1c1c1c]">
          <div className="flex h-8 items-center gap-1.5 border-b border-[#27272f] px-2.5 text-[10.5px] font-semibold text-foreground/85">
            <span className="text-muted-foreground/60">▤</span> Pages
            <span className="ml-auto text-[10px] text-muted-foreground/55">+</span>
          </div>
          <div className="px-1.5 pt-1.5">
            <div className="flex h-[22px] items-center gap-1.5 rounded bg-[#2b2b2b] px-1.5 text-[10px] text-foreground/85">
              <span className="size-1 rounded-full bg-[#f472b6]" /> Page 1
            </div>
            <div className="flex h-[22px] items-center gap-1.5 rounded px-1.5 text-[10px] text-muted-foreground/60">
              <span className="size-1 rounded-full bg-transparent" /> Cover
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 border-y border-[#27272f] px-2.5 py-1 text-[10.5px] font-semibold text-foreground/85">
            Layers <span className="ml-auto text-[10px] text-muted-foreground/55">+</span>
          </div>
          <div className="flex flex-col gap-px px-1.5 pt-1.5">
            {([
              ['Frame', Frame],
              ['Card', Square],
              ['Petals logo', ImageIcon],
              ['Title', Type],
            ] as Array<[string, typeof Frame]>).map(([name, I], i) => (
              <div
                key={name}
                className={
                  'flex h-[21px] items-center gap-1.5 rounded px-1.5 text-[10px] ' +
                  (i === 1 ? 'bg-[#2b2b2b] text-foreground' : 'text-foreground/65')
                }
              >
                <I size={9} className="shrink-0 text-muted-foreground/60" />
                <span className="truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* canvas */}
        <div className="relative flex-1 bg-[#424242]">
          <div className="absolute inset-0 opacity-[0.5]" style={{ backgroundImage: 'radial-gradient(#4c4c4c 0.5px, transparent 0.5px)', backgroundSize: '12px 12px' }} />
          <div className="absolute left-1/2 top-6 w-[236px] -translate-x-1/2">
            <div className="mb-1 text-[8px] text-white/55">Frame · 1200 × 800</div>
            <div className="relative rounded-sm bg-white p-3 shadow-lg shadow-black/20">
              <div className="flex items-center gap-2">
                <span className="size-6 rounded-full bg-[#e063bb]" />
                <div className="flex-1">
                  <div className="h-1.5 w-16 rounded-full bg-neutral-800/85" />
                  <div className="mt-1 h-1 w-24 rounded-full bg-neutral-300" />
                </div>
              </div>
              <div className="mt-3 h-[58px] rounded bg-[#f4f1f4]">
                <div className="flex h-full items-end gap-1 px-2 pb-2">
                  {[18, 30, 24, 40, 34, 48].map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{ height: h, background: i === 5 ? '#e063bb' : '#d8d4d9' }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="h-1 w-12 rounded-full bg-neutral-300" />
                <span className="rounded-full bg-neutral-900 px-1.5 py-0.5 text-[5px] text-white">Open</span>
              </div>
              {/* selection */}
              <div className="pointer-events-none absolute inset-0 rounded-sm border border-[#f472b6]" />
              {[
                'left-0 top-0 -translate-x-1/2 -translate-y-1/2',
                'right-0 top-0 translate-x-1/2 -translate-y-1/2',
                'left-0 bottom-0 -translate-x-1/2 translate-y-1/2',
                'right-0 bottom-0 translate-x-1/2 translate-y-1/2',
              ].map((c) => (
                <span key={c} className={'absolute size-[4px] border border-[#f472b6] bg-white ' + c} />
              ))}
            </div>
          </div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1 rounded-full bg-[#232329] px-1.5 py-1 shadow-xl shadow-black/40">
              <span className="flex size-4 items-center justify-center rounded-full bg-[#f472b6] text-black">
                <span className="size-2 border border-black" />
              </span>
              {[Square, Circle, Type].map((I, i) => (
                <span key={i} className={'flex size-4 items-center justify-center rounded ' + (i === 0 ? 'bg-white/10 text-white' : 'text-white/45')}>
                  <I size={7} />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* right panel */}
        <div className="flex w-[170px] shrink-0 flex-col border-l border-[#27272f] bg-[#1c1c1c]">
          <div className="flex h-8 items-center gap-1.5 border-b border-[#27272f] px-2.5 text-[10.5px] font-semibold text-foreground/85">
            <Square size={9} className="text-muted-foreground/60" /> Card
            <span className="ml-auto text-[10px] text-muted-foreground/55">−</span>
          </div>
          <div className="flex flex-col gap-1.5 px-2.5 py-2">
            <div className="text-[10px] font-semibold text-foreground/85">Fill</div>
            <div className="flex items-center gap-1">
              {['#f472b6', '#e063bb', '#2b2b2b'].map((c) => (
                <span key={c} className="size-3.5 rounded border border-white/10" style={{ background: c }} />
              ))}
              <span className="ml-1 font-mono text-[8px] text-muted-foreground/60">E063BB</span>
            </div>
            <div className="mt-1 text-[10px] font-semibold text-foreground/85">Position & size</div>
            <div className="grid grid-cols-2 gap-1">
              <Field label="X" value="40" />
              <Field label="Y" value="72" />
              <Field label="W" value="236" />
              <Field label="H" value="148" />
            </div>
            <div className="mt-1 text-[10px] font-semibold text-foreground/85">Radius</div>
            <div className="grid grid-cols-4 gap-1">
              {['0', '0', '0', '0'].map((v, i) => (
                <Field key={i} label="⌜" value={v} />
              ))}
            </div>
            <div className="mt-1 text-[10px] font-semibold text-foreground/85">Align</div>
            <div className="grid grid-cols-3 gap-0.5 rounded bg-[#262626] p-0.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} className={'flex h-3.5 items-center justify-center rounded-sm ' + (i === 0 ? 'bg-[#353535]' : '')}>
                  <span className="h-1 w-1 rounded-[1px] bg-muted-foreground/50" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* --------------------------------- page ----------------------------------- */

function IntroPage() {
  const componentCount = NAV.filter((g) => g.label && g.label !== 'Foundations').reduce(
    (n, g) => n + g.items.length,
    0,
  )
  const groups = NAV.filter((g) => g.label && g.label !== 'Foundations')
  return (
    <Page
      title="Petals"
      lead="A compact design system for a browser design tool. One pink, hairline structure, Geist, and a canvas that stays the loudest thing on screen."
      meta={`9 foundations · ${componentCount} component pages · v0.1`}
    >
      <Stage pad={false} className="p-3 sm:p-4" caption="The editor at rest — panels 240px, canvas #424242, one floating toolbar.">
        <EditorMock />
      </Stage>

      <Section title="Principles" note="four rules that decide the rest">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {[
            ['Pink is a signal', 'Selection, the brand mark, and the one action that moves the document forward. Never decoration, never a field border.'],
            ['Hairlines hold the structure', '1px #27272f rules do the work of boxes. Panels are flat; only things that float over the canvas cast a shadow.'],
            ['The canvas is the hero', 'Chrome recedes: near-black surfaces, 13px type, no colour outside the artwork. The tool never competes with the work.'],
            ['Everything is undoable', 'The UI and the assistant go through the same commands. No change reaches the document without a transaction behind it.'],
          ].map(([title, body], i) => (
            <div key={title} className="rounded-xl border border-border bg-[#0b0b0d] p-4">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-[10px] text-[#f472b6]">0{i + 1}</span>
                <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-foreground/90">{title}</h3>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[#9a9aa4]">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Foundations" note="tokens first">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {[
            { slug: 'foundations/color', title: 'Color', body: 'Seven surfaces, four text alphas, one pink.', node: (
              <div className="flex gap-1.5">
                <Swatch color="#000000" size={30} />
                <Swatch color="#1c1c1c" size={30} />
                <Swatch color="#2b2b2b" size={30} />
                <Swatch color="#f472b6" size={30} />
                <Swatch color="#e063bb" size={30} />
              </div>
            ) },
            { slug: 'foundations/typography', title: 'Typography', body: 'Geist and Geist Mono. Ten steps, two weights.', node: (
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-medium leading-none tracking-[-0.03em]">Aa</span>
                <span className="font-mono text-[15px] text-muted-foreground">Aa</span>
              </div>
            ) },
            { slug: 'foundations/space', title: 'Space', body: 'A 4px base, 2px when the panel is tight.', node: (
              <div className="flex items-end gap-1">
                {[4, 8, 12, 16, 24, 32].map((h) => (
                  <span key={h} className="w-2 rounded-sm bg-white/25" style={{ height: h }} />
                ))}
              </div>
            ) },
            { slug: 'foundations/motion', title: 'Motion', body: 'One easing. 150ms for hovers, 220ms for surfaces.', node: (
              <svg width="76" height="30" viewBox="0 0 76 30" fill="none" aria-hidden="true">
                <path d="M2 28C22 28 24 3 74 2" stroke="#f472b6" strokeOpacity="0.7" strokeWidth="1.5" />
                <circle cx="2" cy="28" r="2" fill="#9a9aa4" />
                <circle cx="74" cy="2" r="2" fill="#f472b6" />
              </svg>
            ) },
          ].map((f) => (
            <button
              key={f.slug}
              onClick={() => go('/design-system/' + f.slug)}
              className="group flex cursor-pointer flex-col rounded-xl border border-border bg-[#0b0b0d] text-left transition-colors hover:border-white/20"
            >
              <div className="flex min-h-[64px] items-center px-3 pt-2.5">{f.node}</div>
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-semibold text-foreground/90">{f.title}</span>
                  <ArrowUpRight size={11} className="text-muted-foreground/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-[#9a9aa4]">{f.body}</p>
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Components" note={`${componentCount} pages`}>
        <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="flex items-baseline justify-between border-b border-border pb-1.5">
                <span className="text-[12px] font-semibold text-foreground/85">{g.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground/45">{g.items.length}</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
                {g.items.map((it) => (
                  <button
                    key={it.slug}
                    onClick={() => go('/design-system/' + it.slug)}
                    className="cursor-pointer text-[11.5px] text-muted-foreground/70 transition-colors hover:text-foreground"
                  >
                    {it.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="How to read this" note="shipped only">
        <div className="flex flex-col gap-3 text-[12.5px] leading-relaxed text-[#b9b9c2]">
          <p>
            Every page documents something that exists in petals today — a component, a token, or a
            rule the code already follows. Nothing here is a proposal.
          </p>
          <p>
            Each page is drawn with the same tokens the editor uses — the same field heights, the same
            hairlines, the same pink. Nothing is a screenshot.
          </p>
          <p className="text-muted-foreground/70">
            Start with <button onClick={() => go('/design-system/foundations/color')} className="cursor-pointer text-foreground/85 underline decoration-white/25 underline-offset-2 hover:decoration-white/60">Color</button>,{' '}
            <button onClick={() => go('/design-system/foundations/typography')} className="cursor-pointer text-foreground/85 underline decoration-white/25 underline-offset-2 hover:decoration-white/60">Typography</button>, and{' '}
            <button onClick={() => go('/design-system/components/panel')} className="cursor-pointer text-foreground/85 underline decoration-white/25 underline-offset-2 hover:decoration-white/60">Panel</button>.
          </p>
        </div>
        <div className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground/55">
          <FlowerLogo size={14} />
          Petals is under development. This system changes with it.
        </div>
      </Section>
    </Page>
  )
}

export const introPages: Record<string, ComponentType> = {
  '': IntroPage,
}
