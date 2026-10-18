import { useRef } from 'react'
import { motion } from 'motion/react'
import { useUi, type Camera } from '@/store/uiStore'
import { dockCamera, dockZoneAt } from './commands'

/**
 * The drag surface of drag-to-fill mode: a transparent, full-canvas motion.div
 * (draggable both axes, momentum off, snapping back to origin on release) that
 * pans the camera 1:1 with the pointer via the drag events. Releasing over an
 * edge strip fills the view from that side and exits the mode.
 */
export function DockDragLayer() {
  const on = useUi((s) => s.dockZones)
  const startCam = useRef<Camera | null>(null)
  if (!on) return null

  const onDragEnd = (e: MouseEvent | TouchEvent | PointerEvent) => {
    startCam.current = null
    const zone = dockZoneAt((e as PointerEvent).clientX, (e as PointerEvent).clientY)
    if (zone) {
      dockCamera(zone)
      useUi.getState().setDockZones(false)
    }
  }

  return (
    <motion.div
      className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing"
      drag
      dragMomentum={false}
      dragSnapToOrigin
      dragElastic={0}
      style={{ touchAction: 'none' }}
      onDragStart={() => {
        startCam.current = { ...useUi.getState().camera }
      }}
      onDrag={(_, info) => {
        const s = startCam.current
        if (!s) return
        useUi.getState().setCamera({ x: s.x + info.offset.x, y: s.y + info.offset.y, zoom: s.zoom })
      }}
      onDragEnd={onDragEnd}
    />
  )
}
