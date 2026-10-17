import type { Vec } from '@/model/geometry'
import { useUi } from '@/store/uiStore'

/** Reference to the canvas root element; set once on mount. */
export const canvasEl: { current: HTMLDivElement | null } = { current: null }

/** Convert a client-space point to page (world) space. */
export function pageFromClient(client: Vec): Vec {
  const el = canvasEl.current
  const cam = useUi.getState().camera
  if (!el) return { x: 0, y: 0 }
  const rect = el.getBoundingClientRect()
  return {
    x: (client.x - rect.left - cam.x) / cam.zoom,
    y: (client.y - rect.top - cam.y) / cam.zoom,
  }
}
