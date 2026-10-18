import { motion } from 'motion/react'
import { InfoShell } from '@/components/InfoShell'
import { go } from '@/App'

const easeOut = [0.22, 1, 0.36, 1] as const

/** inline link inside prose, matching the other underlined text links */
const inlineLink =
  'inline cursor-pointer underline decoration-border underline-offset-4 hover:decoration-foreground/40'

export default function About() {
  return (
    <InfoShell>
      <div className="flex flex-col gap-7 text-[15px] leading-relaxed text-foreground/90">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.05 }}
        >
          <span className="inline-flex translate-y-0.5 items-center gap-2 align-baseline">
            <img src="/petal-flower.svg" alt="" width={20} height={20} aria-hidden="true" />
            <span className="font-semibold tracking-tight">Petals</span>
          </span>{' '}
          is an expanding board of handcrafted drawing tools, built to make designing in the browser effortless and utility first.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.12 }}
        >
          What started as a small experiment quickly grew into a canvas where you can draw any shape, fill it with solids,
          gradients or images, stack pages into one document, and export SVG, PNG, PDF or HTML in seconds.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.19 }}
        >
          Parts of Petals make use of{' '}
          <a href="https://motion.dev" target="_blank" rel="noreferrer" className="underline decoration-border underline-offset-4 hover:decoration-foreground/40">
            Motion
          </a>{' '}
          and{' '}
          <a href="https://www.radix-ui.com" target="_blank" rel="noreferrer" className="underline decoration-border underline-offset-4 hover:decoration-foreground/40">
            Radix UI
          </a>
          , and we&rsquo;d like to thank their creators for making their work available.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.26 }}
        >
          You can also dive deeper in our{' '}
          <button onClick={() => go('/gallery')} className={inlineLink}>
            Gallery
          </button>{' '}
          or join the team — the{' '}
          <button onClick={() => go('/careers')} className={inlineLink}>
            Careers
          </button>{' '}
          page is open.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.33 }}
        >
          Have a suggestion, spotted something broken, or need to raise a copyright concern?
          <br />
          mail us at{' '}
          <a href="mailto:bikash13763@gmail.com" className="underline decoration-border underline-offset-4 hover:decoration-foreground/40">
            bikash13763@gmail.com
          </a>
        </motion.p>
      </div>
    </InfoShell>
  )
}
