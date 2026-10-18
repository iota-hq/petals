import type { ReactNode } from 'react'
import { PageMenu, pillDark, pillLight, FlowerLogo, LoginPill } from '@/components/PageMenu'
import { go } from '@/App'

/**
 * Shared chrome for the informational pages (About / Careers / Gallery):
 * sticky header with the page menu, a dead-center wordmark and the right actions,
 * one soft pink glow from the top and the same footer line as everywhere.
 */
export function InfoShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-black text-foreground">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(244,114,182,0.14), transparent 70%)' }}
      />
      <header className="sticky top-0 z-20 flex h-14 items-center border-b border-white/10 bg-black/80 px-5 backdrop-blur">
        <PageMenu />
        <button
          onClick={() => go('/')}
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-2"
        >
          <FlowerLogo size={18} />
          <span className="text-[13px] font-semibold tracking-tight">Petals</span>
        </button>
        <div className="ml-auto flex items-center gap-3">
          <LoginPill />
          <button onClick={() => go('/projects')} className={pillLight}>
            Projects
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-6 pb-20 pt-12">{children}</main>

      <footer className="relative z-10 flex h-12 items-center justify-center border-t border-white/5 text-[11px] text-white/40">
        petals is under development
      </footer>
    </div>
  )
}

/** Big page title + one-line intro, the standard opening block of an info page. */
export function InfoTitle({ title, intro }: { title: string; intro: string }) {
  return (
    <div className="mb-10">
      <h1 className="text-[34px] font-normal leading-tight tracking-[-0.02em]">{title}</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-[#8B8C8D]">{intro}</p>
    </div>
  )
}

/** Section block: small caps-free heading over a bordered top, airy padding. */
export function InfoSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="border-t border-border pt-8 pb-2">
      {title && <h2 className="mb-5 text-[20px] font-medium tracking-[-0.01em]">{title}</h2>}
      {children}
    </section>
  )
}

/** A quiet place to mention something: three-up card row used on About / Careers. */
export function CardRow({ items }: { items: Array<[string, string, string]> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {items.map(([name, blurb, where]) => (
        <div key={name} className="rounded-xl border border-border bg-[#141418] p-4">
          <div className="text-[13px] font-medium">{name}</div>
          <div className="mt-1.5 text-[12px] leading-relaxed text-foreground/80">{blurb}</div>
          <div className="mt-2 font-mono text-[10px] text-muted-foreground/70">{where}</div>
        </div>
      ))}
    </div>
  )
}

export { pillDark, pillLight }
