// The 16 motifs of `ref/patterns-set2.png`, in sheet order. Palettes are
// sampled straight out of that file (modal colour per panel); see
// `ref/CHECKLIST.md` for the table.
//
// A motif draws in its own cell box (`0,0 → w,h`) and may overflow freely —
// `bleed` hands the overflow to the neighbouring tile copy. Use `col`/`row` for
// any internal stagger and declare it in `period`, or the stagger is lost when
// the tile collapses to a single cell.

import {
  arcPath,
  circlePath,
  crossPath,
  lensPath,
  linePath,
  petalPath,
  poly,
  regularPoly,
  roundRectPath,
  starPath,
  type Pt,
} from "../geom";
import { rings } from "./shared";
import type { MotifDef, MotifShape } from "../types";

const SQRT3 = Math.sqrt(3);

// ── 1 ─────────────────────────────────────────────────────────────────────
// Honeycomb. Pointy-top hex lattice; odd rows shift half a cell, which is why
// the period is two rows deep.
const honeycomb: MotifDef = {
  id: "honeycomb",
  name: "Honeycomb",
  group: "set2",
  cell: (s) => ({ w: (SQRT3 * s) / 1.5, h: s }),
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h, detail }) => {
    const R = h / 1.5;
    const cx = w / 2;
    return rings(detail, 0.95, 0.42).map((f) => ({
      d: regularPoly(cx, h / 2, R * f, 6, -90),
    }));
  },
  palette: { bg: "#fd3901", ink: "#e23501", tint: 0.1 },
  defaults: { scale: 76, strokeWidth: 2, detail: 2 },
};

// ── 2 ─────────────────────────────────────────────────────────────────────
// Pillow. Concentric rounded squares on a plain grid.
const pillow: MotifDef = {
  id: "pillow",
  name: "Pillow",
  group: "set2",
  bleed: false,
  build: ({ w, h, detail }) => {
    const r = Math.min(w, h);
    return rings(detail, 0.92, 0.44).map((f) => {
      const sw = w * f;
      const sh = h * f;
      return {
        d: roundRectPath((w - sw) / 2, (h - sh) / 2, sw, sh, r * f * 0.32),
      };
    });
  },
  palette: { bg: "#0052fd", ink: "#004be0", tint: 0.1 },
  defaults: { scale: 64, strokeWidth: 2.2, detail: 2 },
};

// ── 3 ─────────────────────────────────────────────────────────────────────
// Harlequin. Nested diamonds with a small solitary one on the lattice corner,
// which is what gives the sheet its two-scale rhythm.
const harlequin: MotifDef = {
  id: "harlequin",
  name: "Harlequin",
  group: "set2",
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h, detail }) => {
    const cx = w / 2;
    const R = Math.min(w, h) / 2;
    const out: MotifShape[] = rings(detail, 0.92, 0.38).map((f) => ({
      d: regularPoly(cx, h / 2, R * f, 4, -90),
    }));
    out.push({ d: regularPoly(cx - w / 2, 0, R * 0.26, 4, -90) });
    return out;
  },
  palette: { bg: "#ad56fc", ink: "#934ae5", tint: 0.13 },
  defaults: { scale: 70, strokeWidth: 2, detail: 2 },
};

// ── 4 ─────────────────────────────────────────────────────────────────────
// Frame. Concentric squares alternating large/small across the diagonal.
const frame: MotifDef = {
  id: "frame",
  name: "Frame",
  group: "set2",
  period: { x: 2, y: 2 },
  bleed: false,
  build: ({ w, h, col, row, detail }) => {
    const big = (col + row) % 2 === 0;
    const base = big ? 0.88 : 0.46;
    return rings(detail, base, base * 0.42).map((f) => {
      const sw = w * f;
      const sh = h * f;
      return { d: poly(rectCorners((w - sw) / 2, (h - sh) / 2, sw, sh)) };
    });
  },
  palette: { bg: "#b2f903", ink: "#a6e805", tint: 0.07 },
  defaults: { scale: 56, strokeWidth: 2, detail: 2 },
};

function rectCorners(x: number, y: number, w: number, h: number): Pt[] {
  return [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
}

// ── 5 ─────────────────────────────────────────────────────────────────────
// Plus. Greek crosses on a staggered grid.
const plus: MotifDef = {
  id: "plus",
  name: "Plus",
  group: "set2",
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h, detail }) => {
    const cx = w / 2;
    const R = Math.min(w, h) / 2;
    return rings(detail, 0.62, 0.3).map((f) => ({
      d: crossPath(cx, h / 2, R * f, R * f * 0.36),
    }));
  },
  palette: { bg: "#fdbc02", ink: "#e4a703", tint: 0.1 },
  defaults: { scale: 78, strokeWidth: 2.4, detail: 1 },
};

// ── 6 ─────────────────────────────────────────────────────────────────────
// Seigaiha. Nested half-arcs, each row overlapping the one above by half a cell —
// the classic Japanese wave scale.
const seigaiha: MotifDef = {
  id: "seigaiha",
  name: "Seigaiha",
  group: "set2",
  cell: (s) => ({ w: s, h: s / 2 }),
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h, detail }) => {
    const cx = w / 2;
    const R = w / 2;
    return rings(Math.max(2, detail), 1, 0.2).map((f) => ({
      d: arcPath(cx, h, R * f, 180, 360),
    }));
  },
  palette: { bg: "#03c7bc", ink: "#03b1a9", tint: 0.11 },
  defaults: { scale: 88, strokeWidth: 2, detail: 4 },
};

// ── 7 ─────────────────────────────────────────────────────────────────────
// Petal. Filled quatrefoil — four teardrops meeting at the centre.
const petal: MotifDef = {
  id: "petal",
  name: "Petal",
  group: "set2",
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h, detail }) => {
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.5;
    const count = Math.max(3, Math.round(detail) + 2);
    return Array.from({ length: count }, (_, i) => ({
      d: petalPath(cx, cy, (i * 360) / count - 90, R, R * 0.42),
      fill: true,
    }));
  },
  palette: { bg: "#f96ed0", ink: "#f65ac0", tint: 0.1 },
  defaults: { scale: 72, detail: 2, fillMode: "auto" as const },
};

// ── 8 ─────────────────────────────────────────────────────────────────────
// Halo. Dashed rings — the dash is `stroke-dasharray`, not geometry, so the
// Dash control reshapes it live.
const halo: MotifDef = {
  id: "halo",
  name: "Halo",
  group: "set2",
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h, detail }) => {
    const cx = w / 2;
    return rings(detail, 0.76, 0.34).map((f) => ({
      d: circlePath(cx, h / 2, Math.min(w, h) * 0.5 * f),
    }));
  },
  palette: { bg: "#fd7c01", ink: "#e26a01", tint: 0.11 },
  defaults: { scale: 84, strokeWidth: 3.4, dash: 5, detail: 1 },
};

// ── 9 ─────────────────────────────────────────────────────────────────────
// Peak. Triangles flipping orientation every row.
const peak: MotifDef = {
  id: "peak",
  name: "Peak",
  group: "set2",
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h, row, detail }) => {
    const up = row % 2 === 0;
    const cx = w / 2;
    const R = Math.min(w, h) * 0.5;
    return rings(detail, 0.92, 0.42).map((f) => ({
      d: regularPoly(cx, h / 2, R * f, 3, up ? -90 : 90),
    }));
  },
  palette: { bg: "#c17bfb", ink: "#a768e4", tint: 0.14 },
  defaults: { scale: 66, strokeWidth: 2, detail: 1 },
};

// ── 10 ────────────────────────────────────────────────────────────────────
// Chevron. A row of ">" strokes, every other row nudged half a cell.
const chevron: MotifDef = {
  id: "chevron",
  name: "Chevron",
  group: "set2",
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h, detail }) => {
    const count = Math.max(1, Math.round(detail));
    const step = w / count;
    const depth = step * 0.55;
    return Array.from({ length: count }, (_, i) => {
      const x = i * step + (step - depth) / 2;
      return {
        d: `M${x} ${h * 0.22}L${x + depth} ${h * 0.5}L${x} ${h * 0.78}`,
      };
    });
  },
  palette: { bg: "#1fce54", ink: "#19b54c", tint: 0.11 },
  defaults: { scale: 46, strokeWidth: 2.4, detail: 2 },
};

// ── 11 ────────────────────────────────────────────────────────────────────
// Sparkle. Filled four-point glints, sparse.
const sparkle: MotifDef = {
  id: "sparkle",
  name: "Sparkle",
  group: "set2",
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h, detail }) => {
    const cx = w / 2;
    const R = Math.min(w, h) * 0.3;
    const pts = Math.max(4, Math.round(detail) + 3);
    return [{ d: starPath(cx, h / 2, R, pts, 0.14), fill: true }];
  },
  palette: { bg: "#01bffc", ink: "#029cd0", tint: 0.18 },
  defaults: { scale: 74, detail: 1 },
};

// ── 12 ────────────────────────────────────────────────────────────────────
// Ripple. Concentric rings on a staggered grid.
const ripple: MotifDef = {
  id: "ripple",
  name: "Ripple",
  group: "set2",
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h, detail }) => {
    const cx = w / 2;
    const R = Math.min(w, h) * 0.46;
    return rings(detail, 1, 0.22).map((f) => ({
      d: circlePath(cx, h / 2, R * f),
    }));
  },
  palette: { bg: "#fdb202", ink: "#e99f02", tint: 0.09 },
  defaults: { scale: 64, strokeWidth: 2.2, detail: 3 },
};

// ── 13 ────────────────────────────────────────────────────────────────────
// Clover. Four overlapping rings — the outline reads as a quatrefoil without
// any boolean geometry.
const clover: MotifDef = {
  id: "clover",
  name: "Clover",
  group: "set2",
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h, detail }) => {
    const cx = w / 2;
    const cy = h / 2;
    // Lobe centres sit `R` out and the lobes are also `R` across, so the total
    // reach is 2R — keep that under half the cell or neighbouring clovers fuse
    // into one continuous mesh instead of reading as separate flowers.
    const R = Math.min(w, h) * 0.19;
    const count = Math.max(3, Math.round(detail) + 2);
    const rad = Math.PI / 180;
    return Array.from({ length: count }, (_, i) => {
      const a = ((i * 360) / count - 45) * rad;
      return {
        d: circlePath(cx + Math.cos(a) * R, cy + Math.sin(a) * R, R),
      };
    });
  },
  palette: { bg: "#fc654d", ink: "#ec5740", tint: 0.12 },
  defaults: { scale: 60, strokeWidth: 2, detail: 2 },
};

// ── 14 ────────────────────────────────────────────────────────────────────
// Sunburst. Radiating spokes around an empty centre.
const sunburst: MotifDef = {
  id: "sunburst",
  name: "Sunburst",
  group: "set2",
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h, detail }) => {
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.34;
    const spokes = 8 + Math.round(detail) * 4;
    const rad = Math.PI / 180;
    return Array.from({ length: spokes }, (_, i) => {
      const a = ((i * 360) / spokes) * rad;
      const c = Math.cos(a);
      const s = Math.sin(a);
      return {
        d: linePath(
          cx + c * R * 0.45,
          cy + s * R * 0.45,
          cx + c * R,
          cy + s * R,
        ),
      };
    });
  },
  palette: { bg: "#2381fc", ink: "#1b6fd9", tint: 0.14 },
  defaults: { scale: 80, strokeWidth: 2, detail: 2 },
};

// ── 15 ────────────────────────────────────────────────────────────────────
// Vine. Rings threaded on a horizontal run of leaves. The ring sits on the cell
// edge so it is shared with the neighbour and the chain never breaks.
const vine: MotifDef = {
  id: "vine",
  name: "Vine",
  group: "set2",
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h }) => {
    const cy = h / 2;
    const r = h * 0.2;
    return [
      { d: circlePath(0, cy, r) },
      { d: lensPath(r, cy, w - r, cy, h * 0.17) },
    ];
  },
  palette: { bg: "#a350fc", ink: "#8d47e1", tint: 0.12 },
  defaults: { scale: 72, strokeWidth: 2.2, detail: 1 },
};

export const SET2_MOTIFS: MotifDef[] = [
  honeycomb,
  pillow,
  harlequin,
  frame,
  plus,
  seigaiha,
  petal,
  halo,
  peak,
  chevron,
  sparkle,
  ripple,
  clover,
  sunburst,
  vine,
];
