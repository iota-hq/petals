// Shared path builders. Everything returns an SVG path `d` string, because that
// string is the contract between the SVG renderer and the canvas renderer
// (`new Path2D(d)` parses the identical syntax).

/** Trim float noise — keeps exported SVG small and diffable. */
export function n(v: number): string {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? "0" : String(r);
}

export type Pt = [number, number];

export function poly(points: Pt[], close = true): string {
  if (!points.length) return "";
  const [first, ...rest] = points;
  return (
    `M${n(first[0])} ${n(first[1])}` +
    rest.map((p) => `L${n(p[0])} ${n(p[1])}`).join("") +
    (close ? "Z" : "")
  );
}

export function circlePath(cx: number, cy: number, r: number): string {
  if (r <= 0) return "";
  return (
    `M${n(cx - r)} ${n(cy)}` +
    `a${n(r)} ${n(r)} 0 1 0 ${n(r * 2)} 0` +
    `a${n(r)} ${n(r)} 0 1 0 ${n(-r * 2)} 0Z`
  );
}

export function rectPath(x: number, y: number, w: number, h: number): string {
  return poly([
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ]);
}

export function roundRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): string {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  if (rr === 0) return rectPath(x, y, w, h);
  return (
    `M${n(x + rr)} ${n(y)}` +
    `H${n(x + w - rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(x + w)} ${n(y + rr)}` +
    `V${n(y + h - rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(x + w - rr)} ${n(y + h)}` +
    `H${n(x + rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(x)} ${n(y + h - rr)}` +
    `V${n(y + rr)}A${n(rr)} ${n(rr)} 0 0 1 ${n(x + rr)} ${n(y)}Z`
  );
}

/** Angles in degrees, measured clockwise from 3 o'clock (SVG convention). */
export function arcPath(
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
): string {
  const rad = Math.PI / 180;
  const sweep = a1 - a0;
  if (r <= 0 || sweep === 0) return "";
  // A single arc segment can't span a full turn; hand those to circlePath.
  if (Math.abs(sweep) >= 360) return circlePath(cx, cy, r);
  const x0 = cx + r * Math.cos(a0 * rad);
  const y0 = cy + r * Math.sin(a0 * rad);
  const x1 = cx + r * Math.cos(a1 * rad);
  const y1 = cy + r * Math.sin(a1 * rad);
  const large = Math.abs(sweep) > 180 ? 1 : 0;
  const dir = sweep > 0 ? 1 : 0;
  return `M${n(x0)} ${n(y0)}A${n(r)} ${n(r)} 0 ${large} ${dir} ${n(x1)} ${n(y1)}`;
}

/** Regular polygon. `rot` in degrees; 0 puts the first vertex at 3 o'clock. */
export function regularPoly(
  cx: number,
  cy: number,
  r: number,
  sides: number,
  rot = 0,
): string {
  const rad = Math.PI / 180;
  const pts: Pt[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i * 360) / sides + rot;
    pts.push([cx + r * Math.cos(a * rad), cy + r * Math.sin(a * rad)]);
  }
  return poly(pts);
}

/** Archimedean spiral as a polyline. */
export function spiralPath(
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  turns: number,
  steps = 12,
): string {
  const total = Math.max(2, Math.round(turns * steps));
  const pts: Pt[] = [];
  for (let i = 0; i <= total; i++) {
    const t = i / total;
    const a = t * turns * Math.PI * 2 - Math.PI / 2;
    const r = r0 + (r1 - r0) * t;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return poly(pts, false);
}

/** A straight line segment. */
export function linePath(x0: number, y0: number, x1: number, y1: number) {
  return `M${n(x0)} ${n(y0)}L${n(x1)} ${n(y1)}`;
}

/** Greek-cross outline: `arm` is the half-length, `thick` the half-width. */
export function crossPath(
  cx: number,
  cy: number,
  arm: number,
  thick: number,
): string {
  const a = thick;
  const b = arm;
  return poly([
    [cx - a, cy - b],
    [cx + a, cy - b],
    [cx + a, cy - a],
    [cx + b, cy - a],
    [cx + b, cy + a],
    [cx + a, cy + a],
    [cx + a, cy + b],
    [cx - a, cy + b],
    [cx - a, cy + a],
    [cx - b, cy + a],
    [cx - b, cy - a],
    [cx - a, cy - a],
  ]);
}

/** A teardrop petal running from `(cx, cy)` outward along `angle` (degrees). */
export function petalPath(
  cx: number,
  cy: number,
  angle: number,
  len: number,
  wid: number,
): string {
  const a = (angle * Math.PI) / 180;
  const ux = Math.cos(a);
  const uy = Math.sin(a);
  const px = -uy;
  const py = ux;
  const m = len * 0.55;
  const tx = cx + ux * len;
  const ty = cy + uy * len;
  const c1x = cx + ux * m + px * wid;
  const c1y = cy + uy * m + py * wid;
  const c2x = cx + ux * m - px * wid;
  const c2y = cy + uy * m - py * wid;
  return (
    `M${n(cx)} ${n(cy)}` +
    `Q${n(c1x)} ${n(c1y)} ${n(tx)} ${n(ty)}` +
    `Q${n(c2x)} ${n(c2y)} ${n(cx)} ${n(cy)}Z`
  );
}

/** A pointed lens (leaf) spanning two points, bulging by `bulge` either side. */
export function lensPath(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  bulge: number,
): string {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const px = (-dy / len) * bulge;
  const py = (dx / len) * bulge;
  return (
    `M${n(x0)} ${n(y0)}` +
    `Q${n(mx + px)} ${n(my + py)} ${n(x1)} ${n(y1)}` +
    `Q${n(mx - px)} ${n(my - py)} ${n(x0)} ${n(y0)}Z`
  );
}

/**
 * Concave star — the four-point "sparkle" glint. `pinch` is how far the waist
 * pulls in toward the centre (small = spikier).
 */
export function starPath(
  cx: number,
  cy: number,
  r: number,
  points = 4,
  pinch = 0.16,
  rot = -90,
): string {
  const rad = Math.PI / 180;
  const step = 360 / points;
  let d = "";
  for (let i = 0; i < points; i++) {
    const a0 = rot + i * step;
    const a1 = a0 + step;
    const am = a0 + step / 2;
    const x0 = cx + r * Math.cos(a0 * rad);
    const y0 = cy + r * Math.sin(a0 * rad);
    const x1 = cx + r * Math.cos(a1 * rad);
    const y1 = cy + r * Math.sin(a1 * rad);
    const cxm = cx + r * pinch * Math.cos(am * rad);
    const cym = cy + r * pinch * Math.sin(am * rad);
    if (i === 0) d += `M${n(x0)} ${n(y0)}`;
    d += `Q${n(cxm)} ${n(cym)} ${n(x1)} ${n(y1)}`;
  }
  return d + "Z";
}

export function lcm(a: number, b: number): number {
  const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : x);
  return Math.abs(a * b) / (gcd(a, b) || 1);
}
