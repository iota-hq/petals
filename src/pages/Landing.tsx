import { go } from '@/App'

/** Compact pill: label + icon together. */
const pillDark =
  'inline-flex h-9 items-center gap-2 rounded-full bg-[#262626] px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-[#333333] cursor-pointer'
const pillLight =
  'inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-medium text-neutral-950 transition-colors hover:bg-white/90 cursor-pointer'

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

export default function Landing() {
  return (
    <div className="relative min-h-dvh overflow-x-clip bg-[#111111] text-foreground">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-48 left-[20%] h-[560px] w-[560px] rounded-full bg-primary/12 blur-[140px]" />
      <div className="pointer-events-none absolute top-[30%] right-[8%] h-[520px] w-[520px] rounded-full bg-fuchsia-600/10 blur-[150px]" />
      {/* film-grain-ish vignette like the mock */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px]"
        style={{ background: 'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 60%)' }}
      />

      {/* nav */}
      <header className="relative z-10 flex h-14 items-center border-b border-white/10 px-5 md:px-7">
        <nav className="flex items-center gap-6">
          {(
            [
              ['About', '#'],
              ['Careers', '#'],
              ['Gallery', '#'],
            ] as const
          ).map(([label, href]) => (
            <a
              key={label}
              href={href}
              onClick={(e) => e.preventDefault()}
              className="cursor-pointer text-[12.5px] font-medium text-foreground/90 transition-colors hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>
        {/* rotating single bloom, dead-center like the mock's wordmark */}
        <img
          src="/petal-flower.svg"
          alt="Petal"
          className="pointer-events-none absolute left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2"
        />
        <button onClick={() => go('/projects')} className={pillDark + ' ml-auto'}>
          Open app
          <Arrow />
        </button>
      </header>

      {/* hero */}
      <main className="relative z-10 flex flex-col items-center px-6 pb-16 pt-28 text-center md:pt-32">
        <h1 className="text-[34px] font-medium leading-[1.15] tracking-[-0.015em] md:text-[38px]">Petals is for everyone</h1>
        <button onClick={() => go('/projects')} className={pillLight + ' mt-7'}>
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
