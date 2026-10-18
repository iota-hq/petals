import { motion } from 'motion/react'
import { InfoShell, InfoTitle } from '@/components/InfoShell'

const easeOut = [0.22, 1, 0.36, 1] as const

export default function Gallery() {
  return (
    <InfoShell>
      <InfoTitle
        title="Pieces drawn in Petals"
        intro="Starter canvases from the team and the community — every one of these is pure Petals output."
      />

      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
        {/* the demo reel, full width */}
        <motion.figure
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="overflow-hidden rounded-lg border border-border bg-[#141418] md:col-span-2 md:col-start-1"
        >
          <video src="/demo.mp4" autoPlay muted loop playsInline className="aspect-video w-full bg-black object-cover" />
          <figcaption className="flex items-center justify-between px-3 py-2.5">
            <span className="text-[12px] font-medium">Demo reel</span>
            <span className="font-mono text-[10px] text-muted-foreground/70">video</span>
          </figcaption>
        </motion.figure>

        <GalleryImg src="/petals-mobile.png" name="Mobile landing" kind="png" delay={0.08} />

        <GalleryImg src="/petals-mobile-board.png" name="Mobile board" kind="png" delay={0.16} />

        <GalleryImg src="/petals-og.png" name="Postcard" kind="png" delay={0.24} />

        <GalleryImg src="/ellipse.png" name="Ellipse" kind="png" delay={0.32} />

        <GalleryTile
          name="Petal pattern"
          kind="tile"
          delay={0.4}
          style={{ backgroundImage: 'url(/petal-pattern-tile.svg)', backgroundSize: '46px', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-black/35" />
        </GalleryTile>

        <GalleryTile
          name="Single petal"
          kind="svg"
          delay={0.48}
          style={{ background: '#101013' }}
        >
          <img src="/petal-flower.svg" alt="" className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2" />
        </GalleryTile>

        <GalleryTile
          name="Mark on black"
          kind="svg"
          delay={0.56}
          style={{ background: '#141418' }}
        >
          <img src="/logo.svg" alt="" className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2" />
        </GalleryTile>
      </div>
    </InfoShell>
  )
}

function GalleryImg({ src, name, kind, delay }: { src: string; name: string; kind: string; delay: number }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOut, delay }}
      className="overflow-hidden rounded-lg border border-border bg-[#141418]"
    >
      <img src={src} alt={name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
      <figcaption className="flex items-center justify-between px-3 py-2.5">
        <span className="text-[12px] font-medium">{name}</span>
        <span className="font-mono text-[10px] text-muted-foreground/70">{kind}</span>
      </figcaption>
    </motion.figure>
  )
}

function GalleryTile({
  name,
  kind,
  delay,
  style,
  children,
}: {
  name: string
  kind: string
  delay: number
  style: React.CSSProperties
  children?: React.ReactNode
}) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOut, delay }}
      className="overflow-hidden rounded-lg border border-border bg-[#141418]"
    >
      <div className="relative aspect-[4/3]" style={style}>
        {children}
      </div>
      <figcaption className="flex items-center justify-between px-3 py-2.5">
        <span className="text-[12px] font-medium">{name}</span>
        <span className="font-mono text-[10px] text-muted-foreground/70">{kind}</span>
      </figcaption>
    </motion.figure>
  )
}
