import type { ComponentType } from 'react'
import { introPages } from './pages/intro'
import { foundationPages } from './pages/foundations'
import { actionPages } from './pages/actions'
import { inputPages } from './pages/inputs'
import { colorPages } from './pages/color-picker'
import { selectPages } from './pages/select'
import { selectionPages } from './pages/selection'
import { displayPages } from './pages/display'
import { feedbackPages } from './pages/feedback'
import { overlayPages } from './pages/overlays'
import { navigationPages } from './pages/navigation'
import { layoutPages } from './pages/layout'
import { dataPages } from './pages/data'
import { mediaPages } from './pages/media'

/**
 * One map from URL slug to page. The shell picks the page, builds the sidebar
 * from nav.ts and reads the table of contents off the rendered sections, so a
 * new page only ever means one entry here.
 *
 * Only components that exist in the editor are documented. The moment one is
 * retired, its page goes with it.
 */
export const PAGES: Record<string, ComponentType> = {
  ...introPages,
  ...foundationPages,
  ...actionPages,
  ...inputPages,
  ...colorPages,
  ...selectPages,
  ...selectionPages,
  ...displayPages,
  ...feedbackPages,
  ...overlayPages,
  ...navigationPages,
  ...layoutPages,
  ...dataPages,
  ...mediaPages,
}
