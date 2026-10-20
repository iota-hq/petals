/**
 * The shape of the design-system docs, mirroring how design.how/glaze is organised:
 * an introduction, foundations, then the components that actually ship in petals,
 * grouped by the job they do.
 *
 * Slugs are the URL after /design-system. Component pages all live under
 * /components/ whatever their group, so a component keeps one address when the
 * nav is reorganised.
 */

export type NavItem = {
  slug: string
  title: string
  /** documented and drawn here, but not shipped in the editor yet */
  spec?: boolean
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    label: '',
    items: [{ slug: '', title: 'Introduction' }],
  },
  {
    label: 'Foundations',
    items: [
      { slug: 'foundations/color', title: 'Color' },
      { slug: 'foundations/typography', title: 'Typography' },
      { slug: 'foundations/space', title: 'Space' },
      { slug: 'foundations/radius', title: 'Radius' },
      { slug: 'foundations/borders-and-lines', title: 'Borders and lines' },
      { slug: 'foundations/elevation', title: 'Elevation' },
      { slug: 'foundations/motion', title: 'Motion' },
      { slug: 'foundations/iconography', title: 'Iconography' },
      { slug: 'foundations/anti-slop', title: 'Anti-slop' },
    ],
  },
  {
    label: 'Actions',
    items: [
      { slug: 'components/button', title: 'Button' },
      { slug: 'components/toolbar', title: 'Toolbar' },
      { slug: 'components/copy-button', title: 'Copy button' },
    ],
  },
  {
    label: 'Inputs',
    items: [
      { slug: 'components/field', title: 'Field' },
      { slug: 'components/input', title: 'Input' },
      { slug: 'components/textarea', title: 'Textarea' },
      { slug: 'components/chip', title: 'Chip' },
      { slug: 'components/number-input', title: 'Number input' },
      { slug: 'components/color-picker', title: 'Color picker' },
      { slug: 'components/select', title: 'Select' },
    ],
  },
  {
    label: 'Selection',
    items: [
      { slug: 'components/segmented-control', title: 'Segmented control' },
      { slug: 'components/switch', title: 'Switch' },
    ],
  },
  {
    label: 'Display',
    items: [
      { slug: 'components/kbd', title: 'Kbd' },
      { slug: 'components/card', title: 'Card' },
      { slug: 'components/panel', title: 'Panel' },
      { slug: 'components/item', title: 'Item' },
      { slug: 'components/data-list', title: 'Data list' },
      { slug: 'components/truncate', title: 'Truncate' },
    ],
  },
  {
    label: 'Feedback',
    items: [
      { slug: 'components/empty-state', title: 'Empty state' },
      { slug: 'components/alert', title: 'Alert' },
    ],
  },
  {
    label: 'Overlays',
    items: [
      { slug: 'components/dialog', title: 'Dialog' },
      { slug: 'components/sheet', title: 'Sheet' },
      { slug: 'components/popover', title: 'Popover' },
      { slug: 'components/tooltip', title: 'Tooltip' },
      { slug: 'components/dropdown-menu', title: 'Dropdown menu' },
    ],
  },
  {
    label: 'Navigation',
    items: [{ slug: 'components/tabs', title: 'Tabs' }],
  },
  {
    label: 'Layout',
    items: [{ slug: 'components/collapsible', title: 'Collapsible' }],
  },
  {
    label: 'Data',
    items: [{ slug: 'components/filter-bar', title: 'Filter bar' }],
  },
  {
    label: 'Media',
    items: [{ slug: 'components/attachment', title: 'Attachment' }],
  },
]

/** Flat reading order: what the prev/next footer and the search walk. */
export const FLAT: NavItem[] = NAV.flatMap((g) => g.items)

export const GROUP_OF = new Map<string, string>()
for (const g of NAV) for (const it of g.items) if (g.label) GROUP_OF.set(it.slug, g.label)
