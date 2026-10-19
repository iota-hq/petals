// Assembles a motif's cells into one seamless tile.
//
// Two things decide how big that tile is:
//   1. the motif's own repeat (a brick offset needs 2 cells across, a hex
//      lattice needs 2 rows), and
//   2. the alternation period (`altEvery` groups of n, doubled for the A/B
//      swing).
// The tile is the lcm of the two, so a motif's internal stagger survives every
// alternation setting — including `altEvery: 0`, where the tile collapses back
// to exactly the motif's own repeat.

import { lcm } from "./geom";
import { cellRandom } from "./rng";
import { resolveInk } from "./color";
import { getMotif } from "./registry";
import type { FillMode, MotifShape, PatternParams } from "./types";

/** `[a, b, c, d, e, f]` — x' = ax + cy + e, y' = bx + dy + f (SVG/DOMMatrix order). */
export type Mat = [number, number, number, number, number, number];

export const IDENTITY: Mat = [1, 0, 0, 1, 0, 0];

/**
 * Whether the motion turns each motif in place rather than the whole field.
 * Only rotate/scale motions have a pivot for this to matter to.
 */
export function animatesCells(p: PatternParams): boolean {
  return (
    p.motionScope === "motif" &&
    p.speed > 0 &&
    (p.motion === "spin" || p.motion === "heartbeat")
  );
}

/** Rotate by `rot` degrees and scale by `scale`, about `(cx, cy)`. */
export function aboutPoint(
  cx: number,
  cy: number,
  rot: number,
  scale = 1,
): Mat {
  const a = (rot * Math.PI) / 180;
  const cos = Math.cos(a) * scale;
  const sin = Math.sin(a) * scale;
  return [
    cos,
    sin,
    -sin,
    cos,
    cx - cos * cx + sin * cy,
    cy - sin * cx - cos * cy,
  ];
}

/**
 * The transform a cell applies to itself for per-motif motion: rotate/scale
 * about the motif's own centre. Thanks to `stagger` living in the cell
 * transform, that centre is always the middle of the motif box.
 */
export function cellMotionMatrix(tile: Tile, rot: number, scale: number): Mat {
  return aboutPoint(tile.motifW / 2, tile.motifH / 2, rot, scale);
}

/** Apply `o` first, then `m`. */
export function mulMat(m: Mat, o: Mat): Mat {
  return mul(m, o);
}

/** Apply `o` first, then `m`. */
function mul(m: Mat, o: Mat): Mat {
  return [
    m[0] * o[0] + m[2] * o[1],
    m[1] * o[0] + m[3] * o[1],
    m[0] * o[2] + m[2] * o[3],
    m[1] * o[2] + m[3] * o[3],
    m[0] * o[4] + m[2] * o[5] + m[4],
    m[1] * o[4] + m[3] * o[5] + m[5],
  ];
}

export type CellDraw = {
  m: Mat;
  shapes: MotifShape[];
  color: string;
  opacity: number;
};

export type Tile = {
  /** Tile box in user units — this is the `<pattern>` width/height. */
  w: number;
  h: number;
  /** Lattice spacing, one cell. */
  cellW: number;
  cellH: number;
  /** The box a motif actually draws into — the pivot for any in-place turn. */
  motifW: number;
  motifH: number;
  cells: CellDraw[];
  /** Draw the whole tile at all 9 neighbour offsets so overflow wraps. */
  bleed: boolean;
  strokeWidth: number;
  dash?: string;
  fillMode: FillMode;
  bg: string;
  ink: string;
};

function altPeriod(p: PatternParams): { x: number; y: number } {
  const n = Math.max(0, Math.round(p.altEvery));
  if (n === 0) return { x: 1, y: 1 };
  if (p.altMode === "columns") return { x: n * 2, y: 1 };
  if (p.altMode === "rows") return { x: 1, y: n * 2 };
  return { x: n * 2, y: n * 2 }; // checker
}

function variantAt(p: PatternParams, col: number, row: number): 0 | 1 {
  const n = Math.max(0, Math.round(p.altEvery));
  if (n === 0) return 0;
  const c = Math.floor(col / n);
  const r = Math.floor(row / n);
  if (p.altMode === "columns") return (c % 2) as 0 | 1;
  if (p.altMode === "rows") return (r % 2) as 0 | 1;
  return ((c + r) % 2) as 0 | 1;
}

export function buildTile(p: PatternParams): Tile {
  const motif = getMotif(p.motif);
  const base = motif.cell?.(p.scale) ?? { w: p.scale, h: p.scale };

  // The lattice and the motif are sized independently: `gap` stretches the
  // spacing, `motifScale` grows the drawing. At the defaults (gap 0, size 1)
  // they're the same box, which is the edge-to-edge look the sheets have.
  const spread = 1 + Math.max(0, p.gap);
  const cellW = base.w * spread;
  const cellH = base.h * spread;
  const motifW = base.w * p.motifScale;
  const motifH = base.h * p.motifScale;
  // Whatever the motif doesn't fill is shared evenly around it, so shrinking a
  // motif pulls it toward its cell's centre rather than its corner.
  const insetX = (cellW - motifW) / 2;
  const insetY = (cellH - motifH) / 2;

  const own = motif.period ?? { x: 1, y: 1 };
  const alt = altPeriod(p);
  const cols = lcm(own.x, alt.x);
  const rows = lcm(own.y, alt.y);

  const ink = resolveInk(p.bg, p.ink, p.autoTint, p.tint);
  const altInk = p.altColor ?? ink;
  const cells: CellDraw[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const shapes = motif.build({
        w: motifW,
        h: motifH,
        col,
        row,
        cols,
        rows,
        detail: p.detail,
        jitter: p.jitter,
        rand: cellRandom(p.seed, col, row),
        params: p,
      });
      if (!shapes.length) continue;

      const v = variantAt(p, col, row);
      // Brick offset lives here rather than inside the motif — see `stagger`.
      const dx =
        col * cellW +
        (motif.stagger === "rows" && row % 2 ? cellW / 2 : 0) +
        insetX;
      const dy =
        row * cellH +
        (motif.stagger === "cols" && col % 2 ? cellH / 2 : 0) +
        insetY;
      let m: Mat = [1, 0, 0, 1, dx, dy];

      // Every in-place turn — the static one, and alternation's — pivots on the
      // motif's own centre. Doing it here rather than inside the motif keeps
      // all 24 of them ignorant of both.
      const cx = motifW / 2;
      const cy = motifH / 2;
      if (p.motifRotation !== 0)
        m = mul(m, aboutPoint(cx, cy, p.motifRotation));
      if (v === 1 && (p.altScale !== 1 || p.altRotate !== 0))
        m = mul(m, aboutPoint(cx, cy, p.altRotate, p.altScale));

      cells.push({
        m,
        shapes,
        color: v === 1 ? altInk : ink,
        opacity: v === 1 ? p.opacity * p.altOpacity : p.opacity,
      });
    }
  }

  return {
    w: cols * cellW,
    h: rows * cellH,
    cellW,
    cellH,
    motifW,
    motifH,
    cells,
    // A motif turning in place — whether animated or by the static angle —
    // sweeps past its cell box even when it fits at rest, so either forces the
    // bleed copies on.
    bleed: motif.bleed !== false || animatesCells(p) || p.motifRotation !== 0,
    strokeWidth: p.strokeWidth,
    // Trace commandeers stroke-dasharray to draw strokes on, so the Dash
    // control has to stand down while it runs.
    dash:
      p.dash > 0 && !(p.motion === "trace" && p.speed > 0)
        ? `${p.dash} ${p.dash}`
        : undefined,
    fillMode: p.fillMode,
    bg: p.bg,
    ink,
  };
}

/** Whether a shape draws as a fill, after `fillMode` has its say. */
export function shapeIsFill(s: MotifShape, mode: FillMode): boolean {
  if (mode === "fill") return true;
  if (mode === "stroke") return false;
  return !!s.fill;
}

export type ShapeStyle = {
  fill: boolean;
  /** Absolute paint colour — ink, the alt ink, or the background. */
  color: string;
  /** Absolute opacity, cell and shape combined. */
  opacity: number;
  /** Absolute stroke width. */
  width: number;
};

/**
 * How one shape is painted, resolved once for both renderers.
 *
 * The SVG and canvas renderers necessarily paint differently — one serializes
 * attributes, the other calls `fill`/`stroke` — but they must never *disagree*
 * about what to paint. Keeping this decision in a single function is what makes
 * that structural rather than a matter of keeping two code paths in step.
 */
export function shapeStyle(
  tile: Tile,
  cell: CellDraw,
  s: MotifShape,
): ShapeStyle {
  const fill = shapeIsFill(s, tile.fillMode);
  return {
    fill,
    color: s.bg ? tile.bg : cell.color,
    opacity: cell.opacity * (s.opacity ?? 1),
    width: tile.strokeWidth * (s.width ?? 1),
  };
}

/**
 * Offset is periodic — `offsetX` and `offsetX + tileW` render identically — so
 * panning can accumulate forever and still be reduced to one tile's worth.
 * That's what makes the canvas effectively infinite.
 */
export function wrapOffset(v: number, period: number): number {
  if (!period) return 0;
  return ((v % period) + period) % period;
}
