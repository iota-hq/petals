import { go } from '@/App'
import PetalMark from '@/components/PetalMark'
import { Button } from '@/components/ui/button'

export default function Landing() {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-48 left-[15%] h-[560px] w-[560px] rounded-full bg-primary/15 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-56 right-[10%] h-[620px] w-[620px] rounded-full bg-fuchsia-600/10 blur-[140px]" />

      {/* drifting petals */}
      <PetalMark size={110} className="pointer-events-none absolute left-[8%] top-[22%] -rotate-12 opacity-[0.13]" />
      <PetalMark size={64} className="pointer-events-none absolute right-[12%] top-[16%] rotate-12 opacity-[0.10]" />
      <PetalMark size={90} className="pointer-events-none absolute bottom-[18%] right-[22%] -rotate-6 opacity-[0.15]" />
      <PetalMark size={48} className="pointer-events-none absolute bottom-[30%] left-[18%] rotate-45 opacity-[0.08]" />

      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-2">
          <PetalMark size={24} />
          <span className="text-sm font-semibold tracking-tight">Petal</span>
        </div>
        <nav>
          <Button size="sm" variant="ghost" onClick={() => go('/projects')}>
            Open app
          </Button>
        </nav>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-lg">
          <PetalMark size={40} />
        </div>
        <h1 className="max-w-3xl text-[44px] font-semibold leading-[1.05] tracking-tighter md:text-6xl">
          Design at the speed
          <br />
          of thought.
        </h1>
        <p className="max-w-md text-pretty text-[15px] leading-relaxed text-muted-foreground">
          Petal is a tiny, local-first canvas for frames, shapes and text —
          drawn with real React components. No account, no setup, just draw.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <Button size="lg" onClick={() => go('/projects')} className="px-7">
            Open Petal
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/60">Runs entirely in your browser — nothing to install, nothing to sign.</p>
      </main>

      <footer className="relative z-10 flex h-12 shrink-0 items-center justify-center text-[11px] text-muted-foreground/50">
        local-first · offline-friendly · v0.1
      </footer>
    </div>
  )
}
