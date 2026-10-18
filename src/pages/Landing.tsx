import { motion } from 'motion/react'
import { go } from '@/App'
import { PageMenu, pillDark } from '@/components/PageMenu'

/** Hero pill (larger primary CTA). */
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

/** Shared entrance: gentle rise + fade. */
const rise = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
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

      {/* hero */}
      <main className="relative z-10 flex flex-col items-center px-6 pb-16 pt-28 text-center md:pt-32">
        {/* sponsors strip: iota today, plus opens the contra page */}
        <motion.div
          {...rise}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.15 }}
          className="mb-8 flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] py-1.5 pl-4 pr-1.5 backdrop-blur"
        >
          <span className="text-[11px] font-medium tracking-[0.14em] text-[#8B8C8D]">Sponsors</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-[#8B8C8D]">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
          <a
            href="https://useiota.space/?ref=petals&utm_source=petals&utm_medium=referral&utm_campaign=landing-hero"
            target="_blank"
            rel="noreferrer"
            aria-label="iota"
            className="flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded-full transition-transform duration-150 hover:scale-105"
          >
            <img src="/iota-hq-sponsor.png" alt="iota" className="size-7 rounded-full" draggable={false} />
          </a>
          <a
            href="https://contra.com/products/bfrEtU52-sponsor-petals"
            target="_blank"
            rel="noreferrer"
            aria-label="Become a sponsor"
            className="flex size-7 cursor-pointer items-center justify-center rounded-full border border-white/15 text-[#8B8C8D] transition-colors hover:border-white/30 hover:text-foreground"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </a>
        </motion.div>
        <h1 className="text-[34px] font-normal leading-[1.18] tracking-[-0.02em] md:text-[38px]">
          <motion.span {...rise} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} className="block">
            Design, prototype, and ship,
          </motion.span>
          <motion.span
            {...rise}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.34 }}
            className="block text-[#8B8C8D]"
          >
            all in your browser.
          </motion.span>
        </h1>
        <motion.button
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
          onClick={() => go('/projects')}
          className={pillHero + ' mt-7'}
        >
          Try out
          <Arrow />
        </motion.button>
      </main>

      {/* product demo film, autoplaying — on small screens it runs wider than the viewport (half bleeds off each side) */}
      <motion.section
        {...rise}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
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

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="relative z-10 flex h-12 items-center justify-center border-t border-white/5 text-[11px] text-white/40"
      >
        petals is under development
      </motion.footer>
    </div>
  )
}
