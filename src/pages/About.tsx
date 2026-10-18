import { motion } from 'motion/react'
import { InfoShell } from '@/components/InfoShell'
import { pillDark } from '@/components/PageMenu'
import { go } from '@/App'

const easeOut = [0.22, 1, 0.36, 1] as const

/** inline link pill sitting inside prose, like the Menu pill family */
const inlineLink = pillDark + ' !h-7 !px-3 !text-[12px]'

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
          <button onClick={() => go('/design-system')} className={inlineLink}>
            Design system
          </button>{' '}
          or see how the pieces come together in the{' '}
          <button onClick={() => go('/gallery')} className={inlineLink}>
            Gallery
          </button>
          .
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.33 }}
        >
          Have a suggestion, spotted something broken, or need to raise a copyright concern?
          <br />
          mail us at{' '}
          <a href="mailto:divyanshsoni919@gmail.com" className="underline decoration-border underline-offset-4 hover:decoration-foreground/40">
            divyanshsoni919@gmail.com
          </a>
        </motion.p>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: easeOut, delay: 0.4 }}
        className="mt-12"
      >
        <h2 className="text-[20px] font-medium tracking-[-0.01em]">Team Members</h2>
        <div className="mt-4 flex gap-2">
          {[
            ['Bikash', 'https://github.com'],
            ['Divyansh', 'https://github.com'],
          ].map(([name, href]) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex w-[132px] cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-border bg-[#141418] p-4 transition-colors hover:bg-[#1a1a20]"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-[#2b2b2b] text-[13px] font-medium text-foreground/85">
                {name[0]}
              </span>
              <span className="text-[12px] text-foreground/90">{name}</span>
            </a>
          ))}
        </div>
      </motion.section>

      <p className="mt-12 text-[11px] text-white/40">© 2026 iota-hq. All rights reserved.</p>
    </InfoShell>
  )
}
