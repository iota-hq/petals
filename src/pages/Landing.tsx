import { useEffect, useRef, useState } from 'react'
import { go } from '@/App'

/** Compact pill: label + icon together. */
const pillDark =
  'inline-flex h-9 items-center gap-2 rounded-full bg-[#262626] px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-[#333333] cursor-pointer'
const pillLight =
  'inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-medium text-neutral-950 transition-colors hover:bg-white/90 cursor-pointer'

const pillHero =
  'inline-flex h-11 items-center gap-2.5 rounded-full bg-white px-6 text-[14px] font-medium text-neutral-950 transition-colors hover:bg-white/90 cursor-pointer'

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

const LINKS = [
  ['About', '#'],
  ['Careers', '#'],
  ['Gallery', '#'],
] as const

/** Secondary pill (same style as "Open app") opening the page links. Used on every viewport. */
function PageMenu() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest('[data-page-menu]')) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close, true)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close, true)
      document.removeEventListener('keydown', esc)
    }
  }, [open])
  return (
    <div ref={rootRef} data-page-menu="" className="absolute left-5 top-2.5 z-10">
      <button onClick={() => setOpen((v) => !v)} className={pillDark} aria-expanded={open}>
        {open ? 'Close' : 'Menu'}
      </button>
      {open && (
        <div className="absolute left-0 top-11 flex w-max flex-col items-stretch gap-1.5">
          {LINKS.map(([label, href]) => (
            <a key={label} href={href} onClick={(e) => e.preventDefault()} className={pillLight + ' justify-center'}>
              {label}
            </a>
          ))}
        </div>
      )}
    </div>
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

      {/* nav */}
      <header className="relative z-10 flex h-14 items-center border-b border-white/10 px-5 md:px-7">
      <PageMenu />
      {/* rotating single bloom, dead-center like the mock's wordmark */}
        <img
          src="/petal-flower.svg"
          alt="Petals"
          className="pointer-events-none absolute left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2"
        />
        <button onClick={() => go('/projects')} className={pillDark + ' ml-auto'}>
          Open app
          <Arrow />
        </button>
      </header>

      {/* hero */}
      <main className="relative z-10 flex flex-col items-center px-6 pb-16 pt-28 text-center md:pt-32">
        <h1 className="text-[34px] font-normal leading-[1.18] tracking-[-0.02em] md:text-[38px]">
          Design, prototype, and ship,
          <br />
          <span className="text-[#8B8C8D]">all in your browser.</span>
        </h1>
        <button onClick={() => go('/projects')} className={pillHero + ' mt-7'}>
          Try out
          <Arrow />
        </button>
      </main>

      {/* product demo film, autoplaying */}
      <section className="relative z-10 px-6 pb-16">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/50">
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
      </section>

      <footer className="relative z-10 flex h-12 items-center justify-center border-t border-white/5 text-[11px] text-white/40">
        petals is under development
      </footer>
    </div>
  )
}
