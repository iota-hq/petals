import { go } from '@/App'

/** Pill buttons in the 2026 nav style: rounded-full, label right + arrow far right. */
const pillDark =
  'inline-flex h-10 w-[168px] items-center justify-between rounded-full bg-[#262626] px-4.5 text-[14px] font-medium text-foreground transition-colors hover:bg-[#333333] cursor-pointer'
const pillLight =
  'inline-flex h-11 w-[190px] items-center justify-between rounded-full bg-white px-5 text-[14px] font-medium text-neutral-950 transition-colors hover:bg-white/90 cursor-pointer'

function Arrow() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

export default function Landing() {
  return (
    <div className="relative min-h-dvh bg-[#111111] text-foreground">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-48 left-[20%] h-[560px] w-[560px] rounded-full bg-primary/12 blur-[140px]" />
      <div className="pointer-events-none absolute top-[30%] right-[8%] h-[520px] w-[520px] rounded-full bg-fuchsia-600/10 blur-[150px]" />
      {/* film-grain-ish vignette like the mock */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px]"
        style={{ background: 'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 60%)' }}
      />

      {/* nav */}
      <header className="relative z-10 flex h-[72px] items-center border-b border-white/10 px-6 md:px-8">
        <nav className="flex items-center gap-7">
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
              className="cursor-pointer text-[14px] font-medium text-foreground/90 transition-colors hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>
        {/* rotating single bloom, dead-center like the mock's wordmark */}
        <img
          src="/petal-flower.svg"
          alt="Petal"
          className="pointer-events-none absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-1/2"
        />
        <button onClick={() => go('/projects')} className={pillDark + ' ml-auto'}>
          Open app
          <Arrow />
        </button>
      </header>

      {/* hero */}
      <main className="relative z-10 flex flex-col items-center px-6 pb-24 pt-36 text-center md:pt-44">
        <h1 className="max-w-3xl text-balance text-[40px] font-medium leading-[1.14] tracking-[-0.015em] md:text-[48px]">
          Design at the speed of thought —
          <br />
          local-first, impossible to overthink
        </h1>
        <p className="mt-6 max-w-md text-pretty text-[15px] leading-relaxed text-white/55">
          Petal is a tiny canvas for frames, shapes, gradients and text — drawn with real React components.
          No account, no setup, just draw.
        </p>
        <button onClick={() => go('/projects')} className={pillLight + ' mt-10'}>
          Try out
          <Arrow />
        </button>
      </main>

      {/* product demo film, autoplaying */}
      <section className="relative z-10 px-6 pb-20">
        <p className="mb-6 text-center text-[11px] font-medium uppercase tracking-[0.28em] text-white/40">
          Runs entirely in your browser
        </p>
        <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-white/10 shadow-2xl shadow-black/50">
          <video src="/demo.mp4" autoPlay loop muted playsInline className="block w-full" />
        </div>
      </section>

      <footer className="relative z-10 flex h-14 items-center justify-center border-t border-white/5 text-[11px] text-white/35">
        local-first · offline-friendly · v0.1
      </footer>
    </div>
  )
}
