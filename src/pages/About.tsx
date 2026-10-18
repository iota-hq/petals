import { motion } from 'motion/react'
import { InfoShell, InfoSection } from '@/components/InfoShell'
import { go } from '@/App'

const easeOut = [0.22, 1, 0.36, 1] as const

/** inline link inside prose, matching the other underlined text links */
const inlineLink =
  'inline cursor-pointer underline decoration-border underline-offset-4 hover:decoration-foreground/40'

const ROADMAP: Array<[string, string]> = [
  ['Image and logo library', 'browse and drop in ready-made assets'],
  ['MCP', 'connect any AI agent and design on the fly'],
  ['Shaders', 'gradients, noise, and effects you can apply to any shape'],
]

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
          is a free Figma alternative for creating designs in your browser.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.12 }}
        >
          I&rsquo;m building Petals so that any AI agent can connect to it through MCP and design beautiful things on the
          fly. You can draw shapes, fill them with colors, gradients, or images, work across multiple pages, and export
          to SVG, PNG, PDF, or HTML, which makes it useful for storyboarders, design engineers, motion designers, graphic
          designers, and more.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.19 }}
        >
          Petals is fully vibe coded, so you may run into bugs. If you do, I&rsquo;d love to hear about it. Send bugs,
          feedback, and copyright concerns to{' '}
          <a href="mailto:bikash13763@gmail.com" className="underline decoration-border underline-offset-4 hover:decoration-foreground/40">
            bikash13763@gmail.com
          </a>.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: easeOut, delay: 0.26 }}
        >
          Thanks to the creators of{' '}
          <a href="https://motion.dev" target="_blank" rel="noreferrer" className={inlineLink}>
            Motion
          </a>{' '}
          and{' '}
          <a href="https://www.radix-ui.com" target="_blank" rel="noreferrer" className={inlineLink}>
            Radix UI
          </a>
          , which Petals is built on.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: easeOut, delay: 0.33 }}
        className="mt-12"
      >
        <InfoSection title="Roadmap">
          <div className="flex flex-col gap-3">
            {ROADMAP.map(([name, blurb]) => (
              <div key={name} className="text-[15px] leading-relaxed text-foreground/90">
                <span className="font-medium text-foreground">{name}</span>
                <span>: {blurb}</span>
              </div>
            ))}
          </div>
        </InfoSection>
      </motion.div>
    </InfoShell>
  )
}
