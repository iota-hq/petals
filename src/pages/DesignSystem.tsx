import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronLeft, Menu, Search, X } from 'lucide-react'
import { go } from '@/App'
import { FlowerLogo } from '@/components/PageMenu'
import { FLAT, NAV } from '@/design-system/nav'
import { PAGES } from '@/design-system/registry'
import { cn } from '@/lib/utils'

/** `/design-system` and everything under it; the slug is the part after the root. */
function currentSlug() {
  const p = window.location.pathname.replace(/\/+$/, '')
  return p.startsWith('/design-system') ? p.slice('/design-system'.length).replace(/^\//, '') : ''
}

function href(slug: string) {
  return '/design-system' + (slug ? '/' + slug : '')
}

export default function DesignSystem() {
  const [slug, setSlug] = useState(currentSlug)
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [toc, setToc] = useState<Array<{ id: string; title: string }>>([])
  const article = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sync = () => setSlug(currentSlug())
    window.addEventListener('popstate', sync)
    window.addEventListener('petal:navigate', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('petal:navigate', sync)
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
    setMenuOpen(false)
    // a deep link may carry a section hash
    const id = window.location.hash.slice(1)
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
  }, [slug])

  // The table of contents is read from the page itself, so a page never has to
  // declare its own outline twice.
  useLayoutEffect(() => {
    const root = article.current
    if (!root) return
    setToc(
      Array.from(root.querySelectorAll<HTMLElement>('[data-toc]')).map((el) => ({
        id: el.id,
        title: el.dataset.toc ?? el.id,
      })),
    )
  }, [slug])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return NAV
    return NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.title.toLowerCase().includes(q)) })).filter(
      (g) => g.items.length > 0,
    )
  }, [query])

  const item = FLAT.find((i) => i.slug === slug) ?? FLAT[0]
  const Page = PAGES[slug] ?? PAGES['']
  const idx = FLAT.findIndex((i) => i.slug === item.slug)
  const prev = idx > 0 ? FLAT[idx - 1] : undefined
  const next = idx >= 0 && idx < FLAT.length - 1 ? FLAT[idx + 1] : undefined

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-4 pt-5">
        <div className="flex h-8 items-center gap-2 rounded-md border border-border bg-[#101013] px-2.5 focus-within:border-white/20">
          <Search size={12} className="shrink-0 text-muted-foreground/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search the design system"
            className="h-full w-full min-w-0 border-0 bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground/45"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="flex size-5 cursor-pointer items-center justify-center rounded text-muted-foreground/60 hover:text-foreground"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>
      <nav className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 pb-8">
        {groups.length === 0 && <p className="px-2 py-3 text-[12px] text-muted-foreground/60">No matches.</p>}
        {groups.map((g) => (
          <div key={g.label || 'intro'} className="mb-5">
            {g.label && (
              <p className="px-2 pb-1.5 text-[10.5px] font-medium tracking-[0.02em] text-muted-foreground/55">
                {g.label}
              </p>
            )}
            <ul className="flex flex-col">
              {g.items.map((it) => {
                const active = it.slug === slug
                return (
                  <li key={it.slug || 'intro'}>
                    <button
                      onClick={() => {
                        setQuery('')
                        go(href(it.slug))
                      }}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group flex h-[26px] w-full cursor-pointer items-center gap-2 rounded px-2 text-left text-[12.5px] transition-colors',
                        active
                          ? 'bg-white/[0.06] text-foreground'
                          : 'text-muted-foreground/80 hover:bg-white/[0.03] hover:text-foreground/90',
                      )}
                    >
                      <span
                        className={cn(
                          'h-3 w-px shrink-0 rounded-full transition-colors',
                          active ? 'bg-[#f472b6]' : 'bg-transparent',
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{it.title}</span>
                      {it.spec && (
                        <span className="shrink-0 font-mono text-[8.5px] uppercase tracking-[0.08em] text-muted-foreground/35">
                          spec
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )

  return (
    <div className="min-h-dvh bg-black text-foreground">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-black/85 px-4 backdrop-blur-md">
        <button
          onClick={() => go('/')}
          aria-label="Back to petals"
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <ChevronLeft size={16} />
        </button>
        <button onClick={() => go('/design-system')} className="flex min-w-0 cursor-pointer items-center gap-2">
          <FlowerLogo size={18} />
          <span className="truncate text-[13px] font-semibold tracking-[-0.01em]">petals</span>
          <span className="hidden text-[13px] text-muted-foreground/45 sm:inline">/ design system</span>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden font-mono text-[10px] text-muted-foreground/40 md:block">v0.1</span>
          <button
            onClick={() => go('/projects')}
            className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-full bg-[#262626] px-3.5 text-[12px] font-medium transition-colors hover:bg-[#333333]"
          >
            Open app <span className="font-mono text-[10px] text-muted-foreground">→</span>
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open the contents"
            className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground lg:hidden"
          >
            <Menu size={16} />
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1400px]">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[236px] shrink-0 border-r border-border lg:block">
          {sidebar}
        </aside>

        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-[280px] border-r border-border bg-[#070708]">
              <div className="flex h-14 items-center justify-between border-b border-border px-3">
                <span className="text-[12px] font-medium text-foreground/80">Contents</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close the contents"
                  className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-white/5"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="h-[calc(100%-3.5rem)]">{sidebar}</div>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-5 pb-24 pt-10 sm:px-8 lg:px-10 xl:px-14">
          <div ref={article} className="mx-auto max-w-[760px]">
            <Page />
          </div>

          <div className="mx-auto mt-20 grid max-w-[760px] grid-cols-2 gap-3 border-t border-border pt-6">
            {[prev, next].map((n, i) =>
              n ? (
                <button
                  key={n.slug || 'intro'}
                  onClick={() => go(href(n.slug))}
                  className={cn(
                    'group flex cursor-pointer flex-col gap-1.5 rounded-lg border border-border p-3.5 text-left transition-colors hover:border-white/20 hover:bg-white/[0.02]',
                    i === 1 && 'items-end text-right',
                  )}
                >
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground/55">
                    {i === 0 ? <ArrowLeft size={11} /> : null}
                    {i === 0 ? 'Previous' : 'Next'}
                    {i === 1 ? <ArrowRight size={11} /> : null}
                  </span>
                  <span className="text-[12.5px] font-medium text-foreground/85 group-hover:text-foreground">
                    {n.title}
                  </span>
                </button>
              ) : (
                <span key={i} />
              ),
            )}
          </div>
        </main>

        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[190px] shrink-0 overflow-y-auto py-10 pr-5 xl:block">
          {toc.length > 1 && (
            <>
              <p className="pb-2.5 text-[10.5px] font-medium text-muted-foreground/55">On this page</p>
              <ul className="flex flex-col gap-0.5 border-l border-border">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        window.history.replaceState({}, '', `#${t.id}`)
                      }}
                      className="-ml-px block border-l border-transparent py-1 pl-3 text-[11.5px] leading-snug text-muted-foreground/65 transition-colors hover:border-white/30 hover:text-foreground/90"
                    >
                      {t.title}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>

      <footer className="flex h-12 items-center justify-center border-t border-white/5 text-[11px] text-white/35">
        petals is under development
      </footer>
    </div>
  )
}
