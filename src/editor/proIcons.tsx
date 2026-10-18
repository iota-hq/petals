/**
 * Field-label icons pulled directly from open icon sets (attribution comments per icon).
 * All render at cursor-scrub label size (~11-12px) inside NumField / Seg.
 */

interface P {
  size?: number
  className?: string
}

const svg = (viewBox: string, children: React.ReactNode, { size = 12, className }: P) => (
  <svg
    width={size}
    height={size}
    viewBox={viewBox}
    className={className}
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
)

/** Blur — Material Symbols (material-icons). Dots dissolving to the right. */
export function IconBlur(p: P) {
  return svg(
    '0 0 24 24',
    <path d="M6 13c-.55 0-1 .45-1 1s.45 1 1 1s1-.45 1-1s-.45-1-1-1m0 4c-.55 0-1 .45-1 1s.45 1 1 1s1-.45 1-1s-.45-1-1-1m0-8c-.55 0-1 .45-1 1s.45 1 1 1s1-.45 1-1s-.45-1-1-1m-3 .5c-.28 0-.5.22-.5.5s.22.5.5.5s.5-.22.5-.5s-.22-.5-.5-.5M6 5c-.55 0-1 .45-1 1s.45 1 1 1s1-.45 1-1s-.45-1-1-1m15 5.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5s-.5.22-.5.5s.22.5.5.5M14 7c.55 0 1-.45 1-1s-.45-1-1-1s-1 .45-1 1s.45 1 1 1m0-3.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5s-.5.22-.5.5s.22.5.5.5m-11 10c-.28 0-.5.22-.5.5s.22.5.5.5s.5-.22.5-.5s-.22-.5-.5-.5m7 7c-.28 0-.5.22-.5.5s.22.5.5.5s.5-.22.5-.5s-.22-.5-.5-.5m0-17c.28 0 .5-.22.5-.5s-.22-.5-.5-.5s-.5.22-.5.5s.22.5.5.5M10 7c.55 0 1-.45 1-1s-.45-1-1-1s-1 .45-1 1s.45 1 1 1m0 5.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5s1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5m8 .5c-.55 0-1 .45-1 1s.45 1 1 1s1-.45 1-1s-.45-1-1-1m0 4c-.55 0-1 .45-1 1s.45 1 1 1s1-.45 1-1s-.45-1-1-1m0-8c-.55 0-1 .45-1 1s.45 1 1 1s1-.45 1-1s-.45-1-1-1m0-4c-.55 0-1 .45-1 1s.45 1 1 1s1-.45 1-1s-.45-1-1-1m3 8.5c-.28 0-.5.22-.5.5s.22.5.5.5s.5-.22.5-.5s-.22-.5-.5-.5M14 17c-.55 0-1 .45-1 1s.45 1 1 1s1-.45 1-1s-.45-1-1-1m0 3.5c-.28 0-.5.22-.5.5s.22.5.5.5s.5-.22.5-.5s-.22-.5-.5-.5m-4-12c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5s1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5m0 8.5c-.55 0-1 .45-1 1s.45 1 1 1s1-.45 1-1s-.45-1-1-1m4-4.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5s1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5m0-4c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5s1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5" />, p)
}

/** Shadow spread — Material Design Icons (Pictogrammers). */
export function IconSpread(p: P) {  return svg(
    '0 0 24 24',
    <path d="m4 1l3 3H5v3H3V4H1zm0 14l-3-3h2V9h2v3h2zm9-6a1 1 0 0 1 1-1a1 1 0 0 1 1 1v4.47l1.21.13l4.94 2.2c.52.24.85.76.85 1.34v4.36c-.03.82-.68 1.47-1.5 1.5H14c-.38 0-.74-.15-1-.43l-4.9-4.2l.74-.77c.19-.21.46-.32.74-.32h.22L13 19zm1-4c1.42 0 2.74.76 3.45 2c1.11 1.9.46 4.35-1.45 5.46v-1.23c.64-.56 1-1.38 1-2.23a3 3 0 0 0-3-3a3 3 0 0 0-3 3c0 .85.36 1.67 1 2.23v1.23c-1.23-.71-2-2.03-2-3.46a4 4 0 0 1 4-4m-5 9c.73 0 1.41.19 2 .54v1.22c-.53-.47-1.23-.76-2-.76a3 3 0 0 0-3 3c0 1 .5 1.87 1.22 2.42L9.31 22H9a4 4 0 0 1-4-4a4 4 0 0 1 4-4" />,
    p,
  )
}

/** Margin — Boxicons (one glyph; 'dir' rotates it: top / bottom / left / right). */
const MARGIN_PATH =
  'M19.5 2h-15C3.67 2 3 2.67 3 3.5v9c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-9c0-.83-.67-1.5-1.5-1.5M19 12H5V4h14zm.5 4h-15c-.83 0-1.5.67-1.5 1.5v3c0 .83.67 1.5 1.5 1.5h15c.83 0 1.5-.67 1.5-1.5v-3c0-.83-.67-1.5-1.5-1.5m-.5 4H5v-2h14z'
const marginDeg = { top: 0, right: 90, bottom: 180, left: 270 } as const

export function IconMargin({ dir = 'top', ...p }: P & { dir: 'top' | 'right' | 'bottom' | 'left' }) {
  const deg = marginDeg[dir]
  return (
    <svg
      width={p.size ?? 12}
      height={p.size ?? 12}
      viewBox="0 0 24 24"
      className={p.className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ transform: `rotate(${deg}deg)`, transformOrigin: 'center' }}
    >
      <path d={MARGIN_PATH} />
    </svg>
  )
}

/** Image paint fill — Myna UI Icons (Praveen Juge). */
export function IconImageFill(p: P) {
  return svg(
    '0 0 24 24',
    <>
      <path d="M6.75 9a1.25 1.25 0 1 1 2.5 0a1.25 1.25 0 0 1-2.5 0" />
      <path d="M7.125 3.75h9.75c.813 0 1.468 0 2 .043c.546.045 1.026.14 1.47.366a3.75 3.75 0 0 1 1.64 1.639c.226.444.32.924.364 1.47c.044.531.044 1.187.044 2v5.464c0 .813 0 1.469-.044 2c-.044.546-.139 1.026-.365 1.47a3.75 3.75 0 0 1-1.639 1.64c-.444.226-.924.32-1.47.365c-.532.043-1.187.043-2 .043h-9.75c-.813 0-1.468 0-2-.043c-.546-.045-1.026-.14-1.47-.366a3.75 3.75 0 0 1-1.64-1.639c-.225-.444-.32-.924-.364-1.47c-.044-.531-.044-1.187-.044-2V9.268c0-.813 0-1.469.044-2c.044-.546.139-1.026.365-1.47a3.75 3.75 0 0 1 1.639-1.64c.444-.226.924-.32 1.47-.365c.532-.043 1.187-.043 2-.043m3.603 15h6.115c.852 0 1.447 0 1.91-.038c.453-.038.714-.107.911-.207c.424-.216.768-.56.984-.983c.1-.198.17-.459.207-.913c.037-.462.038-1.057.038-1.909V9.74l-.068-.007c-3.09-.424-5.68.51-7.458 2.264c-1.194 1.178-2.043 2.749-2.42 4.577a1 1 0 0 1-.03.143q-.186.974-.189 2.033m-1.324-2.09c-.601-.845-1.523-1.616-2.602-2.153c-1.177-.586-2.486-.865-3.695-.7v.893c0 .853 0 1.447.039 1.91c.037.453.106.714.206.912c.216.423.56.767.984.983c.197.1.458.17.912.207c.462.037 1.057.038 1.91.038h2.07q.001-1.078.176-2.09M5.25 9a2.75 2.75 0 1 0 5.5 0a2.75 2.75 0 0 0-5.5 0m1.5 0a1.25 1.25 0 1 1 2.5 0a1.25 1.25 0 0 1-2.5 0" />
    </>,
    p,
  )
}

/** Solid fill — Myna UI Icons (Praveen Juge). */
export function IconSolidFill(p: P) {
  return svg(
    '0 0 24 24',
    <path d="M7.125 3.75c-.813 0-1.468 0-2 .043c-.546.045-1.026.14-1.47.366a3.75 3.75 0 0 0-1.64 1.639c-.225.444-.32.924-.364 1.47c-.044.531-.044 1.187-.044 2v5.464c0 .813 0 1.469.044 2c.044.546.139 1.026.365 1.47a3.75 3.75 0 0 0 1.639 1.64c.444.226.924.32 1.47.365c.532.043 1.187.043 2 .043h9.75c.813 0 1.468 0 2-.043c.546-.045 1.026-.14 1.47-.366a3.75 3.75 0 0 0 1.64-1.639c.226-.444.32-.924.364-1.47c.044-.531.044-1.187.044-2V9.268c0-.813 0-1.469-.044-2c-.044-.546-.139-1.026-.365-1.47a3.75 3.75 0 0 0-1.639-1.64c-.444-.226-.924-.32-1.47-.365c-.532-.043-1.187-.043-2-.043z" />,
    p,
  )
}

/** Gradient fill — Material Symbols Light (Google). */
export function IconGradientFill(p: P) {
  return svg(
    '0 0 24 24',
    <path d="M5.616 20q-.691 0-1.153-.462T4 18.384V5.616q0-.691.463-1.153T5.616 4h12.769q.69 0 1.153.463T20 5.616v12.769q0 .69-.462 1.153T18.384 20zM11 11v2h2v-2zm-4 0v2h2v-2zm2 2v2h2v-2zm4 0v2h2v-2zm-8 0v2h2v-2zm10-2v2h2v2h2v-2h-2v-2zm-8 4v2H5v1.385q0 .25.183.432t.433.183H7v-2h2v2h2v-2h2v2h2v-2h2v2h1.385q.25 0 .432-.183t.183-.433V17h-2v-2h-2v2h-2v-2h-2v2H9v-2zm12-4v2zm0 4v2z" />,
    p,
  )
}

/** Corner radius — Material Design Icons (Pictogrammers). */
export function IconRadius(p: P) {
  return svg(
    '0 0 24 24',
    <path d="M3 16c0 2.8 2.2 5 5 5h2v-2H8c-1.7 0-3-1.3-3-3v-2H3zm18-8c0-2.8-2.2-5-5-5h-2v2h2c1.7 0 3 1.3 3 3v2h2zm-5 13c2.8 0 5-2.2 5-5v-2h-2v2c0 1.7-1.3 3-3 3h-2v2zM8 3C5.2 3 3 5.2 3 8v2h2V8c0-1.7 1.3-3 3-3h2V3z" />,
    p,
  )
}

/** Opacity / transparency — CoreUI Free (v512 viewBox). */
export function IconOpacity(p: P) {
  return svg(
    '0 0 512 512',
    <>
      <path d="m285.177 179l15.513-3.914l-7.827-31.028l-15.514 3.913a176.94 176.94 0 0 0-129.3 133.557l-3.407 15.633l31.266 6.814l3.406-15.634A145.56 145.56 0 0 1 285.177 179" />
      <path d="M363.624 147.871C343.733 72.077 274.643 16 192.7 16C95.266 16 16 95.266 16 192.7c0 82.617 57 152.163 133.735 171.4A176.77 176.77 0 0 0 320.7 496c97.431 0 176.7-79.266 176.7-176.695c-.008-81.234-55.76-151.969-133.776-171.434M48 192.7C48 112.91 112.91 48 192.7 48s144.7 64.91 144.7 144.7s-64.911 144.7-144.7 144.7S48 272.481 48 192.7M320.7 464c-60.931 0-115.21-38.854-135.843-94.792c2.6.115 5.214.184 7.843.184a177 177 0 0 0 32.7-3.047l97.625 97.625c-.778.013-1.552.03-2.325.03m41.528-6.083L260.26 355.954a176.9 176.9 0 0 0 43.662-26.072L408.37 434.33a144.4 144.4 0 0 1-46.147 23.587Zm69.3-45.692L326.851 307.557a177 177 0 0 0 27.911-44.5L457.67 365.964a144.7 144.7 0 0 1-26.151 46.261Zm33.594-84.073l-99.42-99.42a176.8 176.8 0 0 0 3.7-36.036c0-3.285-.1-6.547-.276-9.787a145.05 145.05 0 0 1 96.276 136.4c-.01 2.967-.111 5.915-.289 8.843Z" />
    </>,
    p,
  )
}

/** Rotation — Boxicons. */
export function IconRotate(p: P) {
  return svg(
    '0 0 24 24',
    <>
      <path d="M12 2C9.04 2 6.33 3.29 4.46 5.46L2 3v6h6L5.88 6.88C7.38 5.08 9.59 4 12 4c4.41 0 8 3.59 8 8h2c0-5.51-4.49-10-10-10" />
      <path d="M12.71 6.93a.996.996 0 0 0-1.41 0l-6.36 6.36a.996.996 0 0 0 0 1.41l6.36 6.36c.2.2.45.29.71.29s.51-.1.71-.29l6.36-6.36a.996.996 0 0 0 0-1.41l-6.36-6.36Z" />
    </>,
    p,
  )
}

/** Stroke width / stroke — Tabler Icons (stroke-based diagonal). */
export function IconStroke(p: P) {
  return (
    <svg
      width={p.size ?? 12}
      height={p.size ?? 12}
      viewBox="0 0 24 24"
      className={p.className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.4}
        d="M4 19L20 5"
      />
    </svg>
  )
}

/** Linear gradient — two stops joined by a direction line (drawn in-house). */
export function IconLinear(p: P) {
  return svg(
    '0 0 24 24',
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M7.6 16.4 16.4 7.6" />
      <circle cx="5.5" cy="18.5" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="5.5" r="2.5" fill="currentColor" stroke="none" />
    </g>,
    p,
  )
}

/** Radial gradient — solid core fading out in rings (drawn in-house). */
export function IconRadial(p: P) {
  return svg(
    '0 0 24 24',
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="8" />
    </g>,
    p,
  )
}

/** Conic gradient — pie ring with one filled wedge sweeping from the center (drawn in-house). */
export function IconConic(p: P) {
  return svg(
    '0 0 24 24',
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 12 12 4 A8 8 0 0 1 18.9 8 Z" fill="currentColor" stroke="none" />
    </g>,
    p,
  )
}

/** Canvas drag / drag-to-fill toggle — Nimbus by Linkedstore S.A. (four-way drift arrows). */
export function IconDragCanvas(p: P) {
  return svg(
    '0 0 16 16',
    <path d="m15.46 7l-3.2-2.19l-.71 1l2.29 1.57H8.62V2.16l1.57 2.29l1-.71L9 .54a1.25 1.25 0 0 0-2 0l-2.22 3.2l1 .71l1.59-2.29v5.22H2.16l2.29-1.57l-.71-1L.54 7a1.25 1.25 0 0 0 0 2l3.2 2.19l.71-1l-2.29-1.57h5.21v5.22l-1.56-2.29l-1 .71L7 15.46a1.25 1.25 0 0 0 2.06 0l2.19-3.2l-1-.71l-1.63 2.29V8.62h5.22l-2.29 1.57l.71 1L15.46 9a1.25 1.25 0 0 0 0-2" />,
    p,
  )
}

/* ---- text-field & filter icons supplied by the user (attribution in each comment) ---- */

/** Font size — Material Symbols by Google (two T glyphs, tall and short). */
export function IconFontSize(p: P) {
  return svg(
    '0 0 24 24',
    <path d="M14 20V7H9V4h13v3h-5v13zm-9 0v-8H2V9h9v3H8v8z" />,
    p,
  )
}

/** Stroke width — Material Symbols by Google (bars thickening downward). */
export function IconStrokeWidth(p: P) {
  return svg(
    '0 0 24 24',
    <path d="M3 20v-1h18v1zm0-3v-2h18v2zm0-4v-3h18v3zm0-5V4h18v4z" />,
    p,
  )
}

/** Line height — Material Design Icons by Pictogrammers (A between rails). */
export function IconLineHeight(p: P) {
  return svg(
    '0 0 24 24',
    <path d="M21 22H3v-2h18zm0-18H3V2h18zm-11 9.7h4l-2-5.4zM11.2 6h1.7l4.7 12h-2l-.9-2.6H9.4L8.5 18h-2z" />,
    p,
  )
}

/** Letter spacing — Material Symbols by Google (A between horizontal arrows). */
export function IconLetterSpacing(p: P) {
  return svg(
    '0 0 24 24',
    <path d="m6 22l-4-4l4-4l1.425 1.4l-1.6 1.6h12.35L16.6 15.4L18 14l4 4l-4 4l-1.425-1.4l1.6-1.6H5.825L7.4 20.6zm.9-9L11 2h2l4.1 11h-1.9l-.95-2.8H9.8l-1 2.8zm3.45-4.4h3.3l-1.6-4.55h-.1z" />,
    p,
  )
}

/** Brightness — Myna UI Icons by Praveen Juge (radiating sun with hollow core). */
export function IconBrightness(p: P) {
  return svg(
    '0 0 24 24',
    <path d="M2.25 12a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1-.75-.75m2.22-7.53a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 0 1-1.06 1.06L4.47 5.53a.75.75 0 0 1 0-1.06m15.06 0a.75.75 0 0 1 0 1.06l-.707.707a.75.75 0 1 1-1.06-1.06l.707-.707a.75.75 0 0 1 1.06 0M6.237 17.763a.75.75 0 0 1 0 1.06l-.707.707a.75.75 0 0 1-1.06-1.06l.707-.707a.75.75 0 0 1 1.06 0m11.526 0a.75.75 0 0 1 1.06 0l.707.707a.75.75 0 1 1-1.06 1.06l-.707-.707a.75.75 0 0 1 0-1.06M12 2.25a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75m0 17a.75.75 0 0 1 .75.75v1a.75.75 0 0 1-1.5 0v-1a.75.75 0 0 1 .75-.75M19.25 12a.75.75 0 0 1 .75-.75h1a.75.75 0 0 1 0 1.5h-1a.75.75 0 0 1-.75-.75M12 8.25a3.75 3.75 0 1 0 0 7.5a3.75 3.75 0 0 0 0-7.5" />,
    p,
  )
}

/** Contrast — Material Symbols by Google (half-filled circle). */
export function IconContrast(p: P) {
  return svg(
    '0 0 24 24',
    <path d="M8.1 21.213q-1.825-.788-3.175-2.138T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22t-3.9-.788m4.9-1.287q2.975-.375 4.988-2.613T20 12t-2.013-5.312T13 4.075z" />,
    p,
  )
}

/** Grayscale — IconPark Outline by ByteDance (two frames split by a line). */
export function IconGrayscale(p: P) {
  return svg(
    '0 0 48 48',
    <path
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={4}
      d="M30 10h10c1.886 0 2.828 0 3.414.586S44 12.114 44 14v20c0 1.886 0 2.828-.586 3.414S41.886 38 40 38H30M18 10H8c-1.886 0-2.828 0-3.414.586S4 12.114 4 14v20c0 1.886 0 2.828.586 3.414S6.114 38 8 38h10m6-32v36"
    />,
    p,
  )
}

/** Hue rotation — selfh.st/icons (color wheel ring). */
export function IconHue(p: P) {
  return svg(
    '0 0 512 512',
    <path
      fillRule="evenodd"
      d="M343.6 440.3c0-5.8-4.7-10.5-10.6-10.5H178.9c-5.8 0-10.6 4.7-10.6 10.5s4.7 10.5 10.6 10.5h154.2c5.8 0 10.5-4.7 10.5-10.5m0 30.6c0-5.8-4.7-10.5-10.6-10.5H178.9c-5.8 0-10.6 4.7-10.6 10.5s4.7 10.5 10.6 10.5h154.2c5.8 0 10.5-4.7 10.5-10.5m-30.1 30.6c0-5.8-4.7-10.5-10.6-10.5H209c-5.8 0-10.6 4.7-10.6 10.5S203.1 512 209 512h93.9c5.8 0 10.6-4.7 10.6-10.5M285 58.8c-9.2-1.8-18.7-2.7-28.4-2.7q-15.3 0-29.7 3L206.4 6.3C222.5 2.2 239.3 0 256.6 0c16.9 0 33.2 2 48.9 5.9zm116.9 166.1q1.95-13.95 1.2-28.5c-.5-10.2-2.1-20-4.5-29.5l51.7-23.2c4.9 15.8 7.9 32.5 8.8 49.8c.9 16.8-.3 33.3-3.4 49.1zM227 348.1c9.2 1.8 18.7 2.7 28.4 2.7q15.3 0 29.7-3l20.5 52.8c-16.1 4.1-32.9 6.2-50.2 6.2c-16.9 0-33.2-2-48.9-5.9zM111.3 174.5c-1.8 9.2-2.7 18.7-2.7 28.4q0 15.3 3 29.7L58.8 253c-4.1-16.1-6.2-32.9-6.2-50.2c0-16.9 2-33.2 5.9-48.9zM354.4 25.4c28.5 15.8 52.8 38.2 70.8 65.2l-51.7 24.1c-11.2-14.7-25-27.3-40.9-37zm79.7 276.5c-15.8 28.5-38.2 52.8-65.2 70.8L344.8 321c14.7-11.2 27.3-25 37-40.9zm-276.5 79.6c-28.5-15.8-52.8-38.2-70.8-65.2l51.7-24.1c11.2 14.7 25 27.3 40.9 37zM77.9 105.1c15.8-28.5 38.2-52.8 65.2-70.8L167.2 86c-14.7 11.2-27.3 25-37 40.9z"
    />,
    p,
  )
}

/** Invert — Famicons by Family (circle, one quadrant flipped). */
export function IconInvert(p: P) {
  return svg(
    '0 0 512 512',
    <>
      <path d="M414.39 97.61A224 224 0 1 0 97.61 414.39A224 224 0 1 0 414.39 97.61M256 432v-96a80 80 0 0 1 0-160V80c97.05 0 176 79 176 176s-78.95 176-176 176" />
      <path d="M336 256a80 80 0 0 0-80-80v160a80 80 0 0 0 80-80" />
    </>,
    p,
  )
}

/** Saturate — Streamline (water drop). */
export function IconSaturate(p: P) {
  return svg(
    '0 0 14 14',
    <path
      fillRule="evenodd"
      d="M7 .75L6.47.22a.75.75 0 0 1 1.06 0zM7 12.5c-.838 0-2.072-.328-2.796-.98A3.84 3.84 0 0 1 2.94 8.904c.005-.674.251-1.478.676-2.348c.423-.868.996-1.744 1.582-2.534A28 28 0 0 1 7 1.841zM7 .75l.53-.53l.002.001l.003.004l.012.011l.043.045l.16.165a29 29 0 0 1 2.258 2.682c.616.833 1.246 1.79 1.724 2.77c.473.969.828 2.02.828 3.025l-.001.042a5.34 5.34 0 0 1-1.76 3.67C9.722 13.606 8.087 14 7 14c-1.085 0-2.72-.394-3.799-1.364a5.34 5.34 0 0 1-1.76-3.713c0-1.005.354-2.056.828-3.026c.478-.98 1.107-1.936 1.724-2.769A29 29 0 0 1 6.41.281l.043-.045l.012-.011l.003-.004h.001V.22z"
      clipRule="evenodd"
    />,
    p,
  )
}

/** Sepia — Fluent Emoji High Contrast by Microsoft (framed sheet with diagonals). */
export function IconSepia(p: P) {
  return svg(
    '0 0 32 32',
    <path d="M28 1a3 3 0 0 1 3 3v24a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3zm1 3a1 1 0 0 0-1-1h-1.998L29 5.998zm0 2.705L25.295 3h-4.293L29 10.998zm0 5L20.295 3h-4.293L29 15.998zm0 5L15.295 3h-4.293L29 20.998zm0 5L10.295 3H6.002L29 25.998zm0 5L5.295 3H4a1 1 0 0 0-1 1v.998L27.002 29H28a1 1 0 0 0 1-1zM26.295 29L3 5.705v4.293L22.002 29zm-5 0L3 10.705v4.293L17.002 29zm-5 0L3 15.705v4.293L12.002 29zm-5 0L3 20.705v4.293L7.002 29zm-5 0L3 25.705V28a1 1 0 0 0 1 1z" />,
    p,
  )
}

/** Box shadow — drawn in-house: sharp sheet with a soft offset shade behind it. */
export function IconBoxShadow(p: P) {
  return svg(
    '0 0 24 24',
    <>
      <path d="M4.5 8.5a1 1 0 0 1 1-1H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1z" opacity="0.45" />
      <path d="M2 4.5a1 1 0 0 1 1-1h14.5a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zm2 1v8.5h12.5V5.5z" />
    </>,
    p,
  )
}

/** Inner shadow — drawn in-house: ring with the inner edge shaded. */
export function IconInnerShadow(p: P) {
  return svg(
    '0 0 24 24',
    <>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 2a8 8 0 1 1 0 16a8 8 0 0 1 0-16" />
      <path d="M12 5a7 7 0 1 0 0 14a7 7 0 0 0 0-14m0 2a5 5 0 1 1 0 10a5 5 0 0 1 0-10" opacity="0.45" />
    </>,
    p,
  )
}

/** Page file sheet — Qlementine Icons by Olivier Cléro (MIT). */
export function IconPage(p: P) {
  return svg(
    '0 0 16 16',
    <path
      fill="currentColor"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14 4.57a.5.5 0 0 0-.024-.235l-.013-.063a1.5 1.5 0 0 0-.18-.434c-.092-.15-.222-.28-.482-.54l-2.59-2.59c-.259-.26-.389-.39-.54-.483a1.5 1.5 0 0 0-.496-.193a.5.5 0 0 0-.235-.024C9.329.004 9.194.004 9.015.004h-2.21c-1.68 0-2.52 0-3.16.327a3.02 3.02 0 0 0-1.31 1.31c-.327.642-.327 1.48-.327 3.16v6.4c0 1.68 0 2.52.327 3.16a3.02 3.02 0 0 0 1.31 1.31c.642.327 1.48.327 3.16.327h2.4c1.68 0 2.52 0 3.16-.327a3 3 0 0 0 1.31-1.31c.327-.642.327-1.48.327-3.16V4.99c0-.178 0-.313-.005-.425zm-4.8 10.4H6.8c-.857 0-1.44 0-1.89-.038c-.438-.035-.663-.1-.819-.18a2 2 0 0 1-.874-.874c-.08-.156-.145-.38-.18-.819c-.037-.45-.038-1.03-.038-1.89v-6.4c0-.857.001-1.44.038-1.89c.036-.438.101-.663.18-.819c.192-.376.498-.682.874-.874c.156-.08.381-.145.819-.18C5.36.97 5.94.97 6.8.97H9v3.5a.5.5 0 0 0 .5.5H13v6.2c0 .857 0 1.44-.038 1.89c-.035.438-.1.663-.18.819a2 2 0 0 1-.874.874c-.156.08-.38.145-.819.18c-.45.037-1.03.037-1.89.037zm.8-13.6l2.59 2.59H10z"
    />,
    p,
  )
}
