import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { go } from '@/App'
import { Hint } from '@/components/ui/tooltip'

/** Compact dark pill (same style as "Open app"). */
export const pillDark =
  'inline-flex h-9 items-center gap-2 rounded-full bg-[#262626] px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-[#333333] cursor-pointer'
/** Compact white pill (primary CTA, e.g. "Try out"). */
export const pillLight =
  'inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-medium text-neutral-950 transition-colors hover:bg-white/90 cursor-pointer'

const LINKS = [
  ['About', '/about'],
  ['Careers', '/careers'],
  ['Gallery', '/gallery'],
] as const

/**
 * "Menu" pill (absolute left of the page header) opening the page links stacked
 * below it — secondary dark pills that ease in slowly, one after another.
 */
export function PageMenu() {
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
    <div ref={rootRef} data-page-menu="" className="absolute left-5 top-2.5 z-30 flex items-center">
      <button onClick={() => setOpen((v) => !v)} className={pillDark} aria-expanded={open}>
        {open ? 'Close' : 'Menu'}
      </button>
      <AnimatePresence>
        {open && (
          <div className="absolute left-0 top-11 flex w-max flex-col items-stretch gap-1.5 md:static md:ml-1.5 md:flex-row md:items-center">
            {LINKS.map(([label, href], i) => (
              <motion.button
                key={label}
                onClick={() => {
                  setOpen(false)
                  go(href)
                }}
                className={pillDark + ' justify-center'}
                initial={{ opacity: 0, x: -10, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -6, transition: { duration: 0.14 } }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.12 + i * 0.1 }}
              >
                {label}
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Log-in stays closed for now — hovering explains why. */
export function LoginPill() {
  return (
    <Hint label="Coming soon" side="bottom">
      <button onClick={(e) => e.preventDefault()} className={pillDark}>
        Log in
      </button>
    </Hint>
  )
}

/** Small helper: petals flower mark. */
export function FlowerLogo({ size = 18, className }: { size?: number; className?: string }) {
  return <img src="/petal-flower.svg" alt="" width={size} height={size} className={className} aria-hidden="true" />
}

/** Navigate to the app root page. */
export function goToAppRoot(): void {
  go('/')
}
