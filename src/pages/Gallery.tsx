import { motion } from 'motion/react'
import { InfoShell, InfoTitle, InfoSection } from '@/components/InfoShell'

const easeOut = [0.22, 1, 0.36, 1] as const

/** Nine looks, all drawn only with Petals' own fills — gradients, patterns and shapes. */
const ART: Array<[string, string, React.CSSProperties]> = [
  ['Petal pink', 'radial', { background: 'radial-gradient(circle at 30% 25%, #f472b6, #a855f7 60%, #1b1b1f)' }],
  ['Grid frame', 'linear', { background: 'linear-gradient(135deg, #26262c, #3f3f46 45%, #f4f4f5 150%)' }],
  ['Soft mint', 'radial', { background: 'radial-gradient(circle at 65% 75%, #86efac, #15803d 70%, #101012)' }],
  ['Conic wheel', 'conic', { background: 'conic-gradient(from 40deg, #f472b6, #818cf8, #34d399, #fbbf24, #f472b6)' }],
  ['Night stops', 'linear', { background: 'linear-gradient(180deg, #0d0d10, #26262c 55%, #52525b)' }],
  ['Tilted petals', 'pattern', { background: 'url(/petal-pattern.svg), #1c1c1c', backgroundSize: '46px', backgroundPosition: 'center' }],
  ['Warm dusk', 'radial', { background: 'radial-gradient(circle at 70% 20%, #fbbf24, #f97316 45%, #7c2d12 85%)' }],
  ['Blur field', 'linear', { background: 'linear-gradient(120deg, #60a5fa55, transparent 40%), linear-gradient(300deg, #f472b655, transparent 45%), #141418' }],
  ['Deep forest', 'radial', { background: 'radial-gradient(circle at 50% 90%, #4ade80, #14532d 65%, #0c0c0e)' }],
]

export default function Gallery() {
  return (
    <InfoShell>
      <InfoTitle
        title="Pieces drawn in Petals"
        intro="Starter canvases from the team and the community — every one of these is pure Petals output: frames, fills, shadows and nothing else."
      />

      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        {ART.map(([name, kind, style], i) => (
          <motion.figure
            key={name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut, delay: 0.08 + (i % 3) * 0.08 + Math.floor(i / 3) * 0.1 }}
            className="overflow-hidden rounded-lg border border-border bg-[#141418]"
          >
            <div className="aspect-[4/3]" style={style} />
            <figcaption className="flex items-center justify-between px-3 py-2.5">
              <span className="text-[12px] font-medium">{name}</span>
              <span className="font-mono text-[10px] text-muted-foreground/70">{kind}</span>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      <InfoSection>
        <p className="text-[12px] text-[#8B8C8D]">
          Have a canvas worth showing? Export it as PNG and send it over — the gallery opens for community work too.
        </p>
      </InfoSection>
    </InfoShell>
  )
}
