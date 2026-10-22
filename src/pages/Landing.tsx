import { useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Check, Copy, Terminal } from 'lucide-react'
import { go } from '@/App'
import { PageMenu, pillDark } from '@/components/PageMenu'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { MOTIFS } from '@/lib/patterns/registry'
import { motifThumb } from '@/lib/patterns/fill'

/** Hero pill (larger primary CTA). */
const pillHero =
  'inline-flex h-11 items-center gap-2.5 rounded-full bg-white px-6 text-[14px] font-medium text-neutral-950 transition-colors hover:bg-white/90 cursor-pointer'

const EASE = [0.22, 1, 0.36, 1] as const

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

/** Shared entrance: gentle rise + fade. */
const rise = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
}

/** Sections sit still: the page is content, not an entrance. */
function Band({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`border-t border-white/10 ${className}`}>
      <div className="mx-auto w-full max-w-[1072px] px-6 py-16 md:py-20">{children}</div>
    </section>
  )
}

/** Heading + lead, the opening of a feature band. The lead sits at heading size in the muted ink. */
function Head({ title, lead, badge }: { title: string; lead: string; badge?: ReactNode }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="max-w-[430px] text-[23px] font-normal leading-[1.3] tracking-[-0.02em] text-white/95 md:text-[26px]">
          {title}
        </h2>
        {badge}
      </div>
      <p className="mt-1.5 max-w-[470px] text-[23px] font-normal leading-[1.3] tracking-[-0.02em] text-[#8B8C8D] md:text-[26px]">
        {lead}
      </p>
    </div>
  )
}

/* -------------------------------- patterns -------------------------------- */

// Twelve that read differently at thumbnail size; the long tail lives in the picker.
const FEATURED = [
  'sunburst',
  'seigaiha',
  'prism',
  'honeycomb',
  'petal',
  'chevron',
  'meander',
  'clover',
  'spiral',
  'halo',
  'peak',
  'ripple',
]
const MOTIFS_FEATURED = FEATURED.flatMap((id) => {
  const motif = MOTIFS.find((m) => m.id === id)
  return motif ? [motif] : []
})

function Patterns() {
  const [activeId, setActiveId] = useState('sunburst')
  const active = MOTIFS_FEATURED.find((m) => m.id === activeId) ?? MOTIFS_FEATURED[0]

  return (
    <Band>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center lg:gap-14">
        <div>
          <Head
            title="Fill anything with a pattern."
            lead="Twenty-three motifs, sharp from a 16px icon to a 1920×1080 frame."
          />
          <button onClick={() => go('/projects')} className={pillHero + ' mt-7'}>
            Try a pattern
            <Arrow />
          </button>
        </div>

        <div className="min-w-0">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0d]">
            <div className="relative aspect-[16/11] overflow-hidden">
              <motion.img
                key={active.id}
                src={motifThumb(active.id, 880, 6)}
                alt={`${active.name} pattern fill`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="absolute inset-0 size-full object-cover"
                draggable={false}
              />
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-3.5 py-2.5">
              <span className="text-[12px] font-medium text-white/85">{active.name}</span>
              <span className="font-mono text-[10px] text-white/35">pattern fill</span>
            </div>
          </div>

          <div className="pattern-strip mt-3">
            <div className="pattern-marquee flex w-max">
              {[0, 1].map((copy) => (
                <div key={copy} className="flex">
                  {MOTIFS_FEATURED.map((m) => {
                    const selected = m.id === active.id
                    return (
                      <button
                        key={`${copy}-${m.id}`}
                        onClick={() => setActiveId(m.id)}
                        aria-pressed={selected}
                        aria-label={`${m.name} pattern`}
                        title={m.name}
                        className={
                          'mr-2 size-[64px] shrink-0 overflow-hidden rounded-lg transition-opacity focus-visible:opacity-100 focus-visible:outline-none sm:size-[80px] ' +
                          (selected ? 'opacity-100' : 'opacity-40 hover:opacity-100')
                        }
                      >
                        <img
                          src={motifThumb(m.id, 120, 3)}
                          alt=""
                          className="size-full object-cover"
                          draggable={false}
                        />
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Band>
  )
}

/* --------------------------------- canvas --------------------------------- */

function Canvas() {
  return (
    <Band>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-14">
        <div className="relative mx-auto flex aspect-square w-full max-w-[340px] items-center justify-center">
          <div className="absolute size-[82%] rounded-full border border-white/[0.08]" />
          <div className="absolute size-[58%] rounded-full border border-white/[0.06]" />
          <img
            src="/petal-flower.svg"
            alt=""
            className="relative size-[36%] motion-safe:animate-[spin_44s_linear_infinite]"
          />
        </div>

        <div>
          <Head
            title="Every piece stays editable."
            lead="Frames, text, vectors and images — grouped the way you drew them."
          />

          <dl className="mt-7 flex flex-col">
            {[
              ['Canvas', 'Nested groups, snapping and measurement, and pages for every direction.'],
              ['Type', 'Google fonts, real alignment, and text that stays text.'],
              ['Shape', 'Vectors, gradients, images and filters, with every control kept live.'],
            ].map(([term, desc]) => (
              <div
                key={term}
                className="grid gap-1 border-t border-white/[0.07] py-3 first:border-t-0 first:pt-0 sm:grid-cols-[88px_1fr] sm:gap-5"
              >
                <dt className="text-[12.5px] font-medium text-white/85">{term}</dt>
                <dd className="text-[13px] leading-[1.65] text-[#8B8C8D]">{desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Band>
  )
}

/* ---------------------------------- MCP ----------------------------------- */

const MCP_COMMAND =
  'claude mcp add --transport http petals http://127.0.0.1:8765/mcp'

function CopyCommand() {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(MCP_COMMAND)
        } catch {
          /* clipboard denied — the command is selectable anyway */
        }
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      }}
      className="inline-flex cursor-pointer items-center gap-1.5 text-[10.5px] text-white/40 transition-colors hover:text-white/80"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function Mcp() {
  return (
    <Band>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-14">
        <div>
          <Head
            title="An agent can hold the pen."
            lead="Read the board, add shapes, move the selection, and export what it made."
            badge={
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/60">
                <span className="size-1.5 rounded-full bg-[#f472b6]" />
                Coming soon
              </span>
            }
          />

          <button onClick={() => go('/mcp')} className={pillHero + ' mt-7'}>
            Connect an agent
            <Arrow />
          </button>
        </div>

        <div className="min-w-0">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0d]">
            <div className="flex h-10 items-center gap-2 border-b border-white/10 px-3.5">
              <Terminal size={12} className="text-white/35" />
              <span className="font-mono text-[10.5px] text-white/50">terminal</span>
              <span className="ml-auto flex items-center gap-1.5 font-mono text-[9.5px] text-white/30">
                <span className="size-1.5 rounded-full bg-emerald-400/80" />
                local
              </span>
            </div>

            <pre className="whitespace-pre-wrap break-words px-3.5 py-4 font-mono text-[10.5px] leading-[1.8] text-white/80 sm:text-[11px]">
              <span className="text-white/30">$ </span>
              {MCP_COMMAND}
            </pre>

            <div className="flex items-center gap-3 border-t border-white/10 px-3.5 py-2.5">
              <span className="font-mono text-[9.5px] text-white/30">127.0.0.1:8765</span>
              <span className="font-mono text-[9.5px] text-white/30">·</span>
              <span className="font-mono text-[9.5px] text-white/30">7 tools</span>
              <span className="ml-auto">
                <CopyCommand />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Band>
  )
}

/* -------------------------------- closing --------------------------------- */

function Close() {
  return (
    <section className="border-t border-white/10">
      <div className="relative mx-auto flex w-full max-w-[1072px] flex-col items-center px-6 py-20 text-center md:py-24">
        <h2 className="text-[28px] font-normal leading-tight tracking-[-0.02em] md:text-[32px]">
          Start with a blank board.
        </h2>
        <p className="mt-3 text-[13.5px] text-[#8B8C8D]">No install. Your boards stay in this browser.</p>
        <button onClick={() => go('/projects')} className={pillHero + ' mt-7'}>
          Try out
          <Arrow />
        </button>
        <button
          onClick={() => go('/about')}
          className="mt-5 cursor-pointer text-[12px] text-white/50 transition-colors hover:text-white/80"
        >
          About Petals
        </button>
      </div>
    </section>
  )
}

export default function Landing() {
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-black text-foreground">
      {/* Rose Twilight — pink glow rising from the top */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(244, 114, 182, 0.25), transparent 70%), #000000' }}
      />
      {/* the same rose, rising off the bottom edge */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[540px]"
        style={{
          background:
            'radial-gradient(ellipse 40% 100% at 50% 100%, rgba(244, 114, 182, 0.24), rgba(244, 114, 182, 0.06) 45%, transparent 72%)',
        }}
      />

      {/* nav */}
      <motion.header {...rise} transition={{ duration: 0.5, ease: 'easeOut' }} className="relative z-20 flex h-14 items-center border-b border-white/10 px-5 md:px-7">
      <PageMenu />
      {/* rotating single bloom, dead-center like the mock's wordmark */}
        <img
          src="/petal-flower.svg"
          alt="Petals"
          className="pointer-events-none absolute left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2"
        />
        <motion.button
          {...rise}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          onClick={() => go('/projects')}
          className={pillDark + ' ml-auto'}
        >
          Open app
          <Arrow />
        </motion.button>
      </motion.header>

      <main className="relative z-10">
        {/* hero */}
        <div className="relative z-10 flex flex-col items-center px-6 pb-16 pt-28 text-center md:pt-32">
          <h1 className="text-balance text-[34px] font-normal leading-[1.18] tracking-[-0.02em] md:text-[38px]">
            <motion.span {...rise} transition={{ duration: 0.65, ease: EASE, delay: 0.2 }} className="block">
              Design, prototype, and ship,
            </motion.span>
            <motion.span
              {...rise}
              transition={{ duration: 0.65, ease: EASE, delay: 0.34 }}
              className="block text-[#8B8C8D]"
            >
              all in your browser.
            </motion.span>
          </h1>
          <motion.button
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.55 }}
            onClick={() => go('/projects')}
            className={pillHero + ' mt-7'}
          >
            Try out
            <Arrow />
          </motion.button>
        </div>

        {/* product demo film, autoplaying — on small screens it runs wider than the viewport (half bleeds off each side) */}
        <motion.section
          {...rise}
          transition={{ duration: 0.7, ease: EASE, delay: 0.7 }}
          className="relative z-10 px-6 pb-16"
        >
          <div className="w-[190vw] max-w-none overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/50 lg:mx-auto lg:w-full lg:max-w-5xl">
            <video
              src="/demo.mp4"
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              className="block aspect-video w-full bg-black object-cover"
            />
          </div>
        </motion.section>

        {/* what it is, in one breath */}
        <section className="border-t border-white/10">
          <div className="mx-auto w-full max-w-[1072px] px-6 py-14 md:py-16">
            <h2 className="max-w-[720px] text-[23px] font-normal leading-[1.4] tracking-[-0.015em] text-white/90 md:text-[27px]">
              A canvas that keeps up — <span className="text-[#8B8C8D]">from the first shape to the final file.</span>
            </h2>
          </div>
        </section>

        <Patterns />
        <Canvas />
        <Mcp />
        <Close />
      </main>

      <ProgressiveBlur
        direction="bottom"
        blurLayers={8}
        blurIntensity={0.3}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-[15vh]"
      />

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="relative z-50 flex h-12 items-center justify-center border-t border-white/5 text-[11px] text-white/40"
      >
        petals is under development
      </motion.footer>
    </div>
  )
}
