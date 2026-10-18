import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bubble, BubbleContent } from '@/components/ui/bubble'

const CONTRA_URL = 'https://contra.com/products/bfrEtU52-sponsor-petals'

/**
 * One-time sponsor nudge on the board: appears after 10 s on the page,
 * closes itself 8 s later. Fixed so it may overlap the left sidebar.
 */
export function SponsorBubble() {
  const [phase, setPhase] = useState<'wait' | 'show' | 'done'>('wait')
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 10000)
    const t2 = setTimeout(() => setPhase('done'), 18000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])
  return (
    <div className="pointer-events-none fixed bottom-16 left-4 z-50">
      <AnimatePresence>
        {phase === 'show' && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="pointer-events-auto"
          >
            <Bubble variant="tinted" align="start">
              <BubbleContent className="rounded-2xl border-0 bg-[#e063bb]/15 text-[12.5px] text-foreground">
                Want to become a sponsor?{' '}
                <a href={CONTRA_URL} target="_blank" rel="noreferrer" className="cursor-pointer font-medium text-[#e063bb] hover:underline">
                  click here
                </a>
              </BubbleContent>
            </Bubble>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
