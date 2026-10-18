import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { InfoShell, InfoTitle } from '@/components/InfoShell'

const easeOut = [0.22, 1, 0.36, 1] as const

interface Zoom {
  name: string
  kind: string
  src: string
  /** render the asset as its native size (svg marks / pattern tiles) instead of a cover crop */
  contain?: boolean
  tile?: boolean
}

export default function Gallery() {
  const [zoom, setZoom] = useState<Zoom | null>(null)

  useEffect(() => {
    if (!zoom) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setZoom(null)
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [zoom])

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

        <GalleryImg src="/petals-mobile.png" name="Mobile landing" delay={0.08} onZoom={setZoom} />
        <GalleryImg src="/petals-mobile-board.png" name="Mobile board" delay={0.16} onZoom={setZoom} />
        <GalleryImg src="/petals-og.png" name="Postcard" delay={0.24} onZoom={setZoom} />
        <GalleryImg src="/ellipse.png" name="Ellipse" delay={0.32} onZoom={setZoom} />

        <GalleryTile
          name="Petal pattern"
          kind="tile"
          delay={0.4}
          view={{ name: 'Petal pattern', kind: 'tile', src: '/petal-pattern-tile.svg', tile: true }}
          onZoom={setZoom}
        >
          <div
            className="absolute inset-0"
            style={{ backgroundImage: 'url(/petal-pattern-tile.svg)', backgroundSize: '46px', backgroundPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-black/35" />
        </GalleryTile>

        <GalleryTile
          name="Single petal"
          kind="svg"
          delay={0.48}
          view={{ name: 'Single petal', kind: 'svg', src: '/petal-flower.svg', contain: true }}
          onZoom={setZoom}
          style={{ background: '#101013' }}
        >
          <img src="/petal-flower.svg" alt="" className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2" />
        </GalleryTile>

        <GalleryTile
          name="Mark on black"
          kind="svg"
          delay={0.56}
          view={{ name: 'Mark on black', kind: 'svg', src: '/logo.svg', contain: true }}
          onZoom={setZoom}
          style={{ background: '#141418' }}
        >
          <img src="/logo.svg" alt="" className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2" />
        </GalleryTile>
      </div>

      {/* expanded view */}
      <AnimatePresence>
        {zoom && (
          <motion.div
            key="zoom-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-6 backdrop-blur-sm"
            onPointerDown={() => setZoom(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: easeOut }}
              className="flex max-h-full flex-col overflow-hidden rounded-lg border border-border bg-[#141418]"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {zoom.tile ? (
                <div
                  className="h-[70vh] w-[min(80vw,900px)]"
                  style={{ backgroundImage: `url(${zoom.src})`, backgroundSize: '46px', backgroundPosition: 'center' }}
                />
              ) : (
                <img
                  src={zoom.src}
                  alt={zoom.name}
                  className={zoom.contain ? 'mx-auto h-[70vh] w-auto' : 'max-h-[80vh] w-auto max-w-full object-contain'}
                />
              )}
              <figcaption className="flex items-center justify-between px-3.5 py-2.5">
                <span className="text-[12px] font-medium">{zoom.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground/70">{zoom.kind}</span>
              </figcaption>
              <button
                aria-label="Close"
                onClick={() => setZoom(null)}
                className="absolute right-3 top-3 flex size-8 cursor-pointer items-center justify-center rounded-md bg-black/60 text-muted-foreground hover:text-foreground"
              >
                <X size={15} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </InfoShell>
  )
}

function GalleryImg({
  src,
  name,
  delay,
  onZoom,
}: {
  src: string
  name: string
  delay: number
  onZoom: (z: Zoom | null) => void
}) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOut, delay }}
      className="cursor-pointer overflow-hidden rounded-lg border border-border bg-[#141418]"
      onClick={() => onZoom({ name, kind: 'png', src })}
      title={`View ${name}`}
    >
      <img src={src} alt={name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
      <figcaption className="flex items-center justify-between px-3 py-2.5">
        <span className="text-[12px] font-medium">{name}</span>
        <span className="font-mono text-[10px] text-muted-foreground/70">png</span>
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
  view,
  onZoom,
}: {
  name: string
  kind: string
  delay: number
  style?: React.CSSProperties
  children?: React.ReactNode
  view: Zoom
  onZoom: (z: Zoom | null) => void
}) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOut, delay }}
      className="relative cursor-pointer overflow-hidden rounded-lg border border-border bg-[#141418]"
      onClick={() => onZoom(view)}
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
