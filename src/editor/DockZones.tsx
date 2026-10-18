import { useEffect, useState } from 'react'
import { useUi } from '@/store/uiStore'
import { dockZoneAt, DOCK_INSET, DOCK_STRIP, type DockZone } from './commands'

/**
 * Drag-to-fill edge strips: four dashed pink boxes shown while the drag tool is
 * active — horizontal ones top/bottom, vertical ones left/right. Dropping a canvas
 * drag onto one fills the view from that side (dockCamera); the strip lights up
 * while the pointer is over it.
 */
export function DockZones() {
  const on = useUi((s) => s.dockZones)
  const [hover, setHover] = useState<DockZone | null>(null)

  useEffect(() => {
    if (!on) {
      setHover(null)
      return
    }
    const move = (e: PointerEvent) => setHover(dockZoneAt(e.clientX, e.clientY))
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [on])

  if (!on) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {(['top', 'bottom', 'left', 'right'] as const).map((zone) => {
        const style =
          zone === 'top'
            ? { left: DOCK_INSET, right: DOCK_INSET, top: DOCK_INSET, height: DOCK_STRIP }
            : zone === 'bottom'
              ? { left: DOCK_INSET, right: DOCK_INSET, bottom: DOCK_INSET, height: DOCK_STRIP }
              : zone === 'left'
                ? { top: DOCK_INSET, bottom: DOCK_INSET, left: DOCK_INSET, width: DOCK_STRIP }
                : { top: DOCK_INSET, bottom: DOCK_INSET, right: DOCK_INSET, width: DOCK_STRIP }
        return (
          <div
            key={zone}
            data-dock-zone={zone}
            className={
              'absolute rounded-2xl border-2 border-dashed border-[#f472b6] transition-colors ' +
              (hover === zone ? 'bg-[#f472b6]/15' : 'bg-[#f472b6]/[0.04]')
            }
            style={style}
          />
        )
      })}
    </div>
  )
}
