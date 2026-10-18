import { useEffect, useState } from 'react'
import { useUi } from '@/store/uiStore'
import { dockZoneAt, DOCK_INSET, DOCK_STRIP, type DockZone } from './commands'

/**
 * Drag-to-fill edge strips: thin dashed pink lines shown while the drag tool is
 * active — one wide one along the top and bottom, and a pair of short vertical
 * ones on each side (upper and lower, gap in the middle). Dropping a canvas drag
 * onto one fills the view from that side (dockCamera); the strip lights up while
 * the pointer is over it.
 */

const STRIP_CLS =
  'absolute rounded-full border-[1.5px] border-dashed border-[#f472b6] transition-colors '

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
  // each side splits into upper + lower, leaving the middle free (per the mock)
  const strips: Array<{ key: string; zone: DockZone; style: React.CSSProperties }> = [
    { key: 'top', zone: 'top', style: { left: DOCK_INSET, right: DOCK_INSET, top: DOCK_INSET, height: DOCK_STRIP } },
    { key: 'bottom', zone: 'bottom', style: { left: DOCK_INSET, right: DOCK_INSET, bottom: DOCK_INSET, height: DOCK_STRIP } },
    { key: 'left-1', zone: 'left', style: { left: DOCK_INSET, top: DOCK_INSET, width: DOCK_STRIP, height: '42%' } },
    { key: 'left-2', zone: 'left', style: { left: DOCK_INSET, bottom: DOCK_INSET, width: DOCK_STRIP, height: '42%' } },
    { key: 'right-1', zone: 'right', style: { right: DOCK_INSET, top: DOCK_INSET, width: DOCK_STRIP, height: '42%' } },
    { key: 'right-2', zone: 'right', style: { right: DOCK_INSET, bottom: DOCK_INSET, width: DOCK_STRIP, height: '42%' } },
  ]
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {strips.map((s) => (
        <div
          key={s.key}
          data-dock-zone={s.zone}
          className={STRIP_CLS + (hover === s.zone ? 'bg-[#f472b6]/20' : 'bg-[#f472b6]/[0.04]')}
          style={s.style}
        />
      ))}
    </div>
  )
}
