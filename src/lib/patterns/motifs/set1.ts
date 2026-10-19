// The 8 motifs of `ref/patterns-set1.png` (panels P5–P12). Palettes sampled
// from that file; several of these panels tint *lighter* than their background
// rather than darker, which is why `tint` is signed.
//
// Same contract as set 2: draw in the cell box, declare any internal stagger in
// `period`, let `bleed` carry the overflow.

import {
  circlePath,
  lensPath,
  linePath,
  poly,
  regularPoly,
  spiralPath,
  starPath,
  type Pt,
} from "../geom";
import { rings } from "./shared";
import type { MotifDef, MotifShape } from "../types";

const SQRT3 = Math.sqrt(3);

// ── P5 ────────────────────────────────────────────────────────────────────
// Prism. Sierpinski subdivision — the inverted gaps that give the sheet its
// texture fall out of the recursion rather than being drawn.
function sierpinski(a: Pt, b: Pt, c: Pt, depth: number, out: string[]) {
  out.push(poly([a, b, c]));
  if (depth <= 0) return;
  const mid = (p: Pt, q: Pt): Pt => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const ab = mid(a, b);
  const bc = mid(b, c);
  const ca = mid(c, a);
  sierpinski(a, ab, ca, depth - 1, out);
  sierpinski(ab, b, bc, depth - 1, out);
  sierpinski(ca, bc, c, depth - 1, out);
}

const prism: MotifDef = {
  id: "prism",
  name: "Prism",
  group: "set1",
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h, detail }) => {
    const out: string[] = [];
    sierpinski(
      [w / 2, h * 0.06],
      [w * 0.96, h * 0.94],
      [w * 0.04, h * 0.94],
      Math.max(0, Math.round(detail) - 1),
      out,
    );
    return out.map((d) => ({ d }));
  },
  palette: { bg: "#971052", ink: "#a92264", tint: -0.08 },
  defaults: { scale: 84, strokeWidth: 1.4, detail: 3 },
};

// ── P6 ────────────────────────────────────────────────────────────────────
// Hexring. Flat-top hex lattice — odd *columns* drop half a cell, the mirror of
// Honeycomb's row stagger, which is what keeps the two reading differently.
const hexring: MotifDef = {
  id: "hexring",
  name: "Hexring",
  group: "set1",
  cell: (s) => ({ w: s, h: (SQRT3 * s) / 1.5 }),
  period: { x: 2, y: 1 },
  stagger: "cols",
  build: ({ w, h, detail }) => {
    const R = w / 1.5;
    const cy = h / 2;
    return rings(Math.max(2, detail), 0.98, 0.24).map((f) => ({
      d: regularPoly(w / 2, cy, R * f, 6, 0),
    }));
  },
  palette: { bg: "#007090", ink: "#097a9a", tint: -0.06 },
  defaults: { scale: 74, strokeWidth: 1.8, detail: 4 },
};

// ── P7 ────────────────────────────────────────────────────────────────────
// Spiral. A ring with an Archimedean coil inside it.
const spiral: MotifDef = {
  id: "spiral",
  name: "Spiral",
  group: "set1",
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h, detail }) => {
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.46;
    return [
      { d: circlePath(cx, cy, R) },
      { d: spiralPath(cx, cy, R * 0.05, R * 0.68, Math.max(1.5, detail), 24) },
    ];
  },
  palette: { bg: "#e4a12e", ink: "#c78411", tint: 0.13 },
  defaults: { scale: 72, strokeWidth: 2, detail: 3 },
};

// ── P8 ────────────────────────────────────────────────────────────────────
// Isocube. Tumbling blocks: a hexagon split into three rhombi, each a different
// tone, so a flat lattice reads as stacked cubes.
const isocube: MotifDef = {
  id: "isocube",
  name: "Isocube",
  group: "set1",
  cell: (s) => ({ w: (SQRT3 * s) / 1.5, h: s }),
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h }) => {
    const R = h / 1.5;
    const cx = w / 2;
    const cy = h / 2;
    const rad = Math.PI / 180;
    const v = (k: number): Pt => [
      cx + R * Math.cos((-90 + k * 60) * rad),
      cy + R * Math.sin((-90 + k * 60) * rad),
    ];
    const c: Pt = [cx, cy];
    const faces: [Pt, Pt, Pt, Pt][] = [
      [v(5), v(0), v(1), c], // top
      [v(1), v(2), v(3), c], // right
      [v(3), v(4), v(5), c], // left
    ];
    const tones = [1, 0.55, 0.24];
    return faces.map((f, i) => ({
      d: poly(f),
      fill: true,
      opacity: tones[i],
    }));
  },
  palette: { bg: "#3e9573", ink: "#2f8463", tint: 0.12 },
  defaults: { scale: 62, detail: 1 },
};

// ── P9 ────────────────────────────────────────────────────────────────────
// Leaf. A filled body with veins cut back out of it in the background colour.
const leaf: MotifDef = {
  id: "leaf",
  name: "Leaf",
  group: "set1",
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h, detail }) => {
    const cx = w / 2;
    const top = h * 0.08;
    const bot = h * 0.92;
    const out: MotifShape[] = [
      { d: lensPath(cx, top, cx, bot, w * 0.4), fill: true },
      { d: linePath(cx, top, cx, bot), bg: true, width: 0.7 },
    ];
    // Side veins fan out from the midrib toward the tip.
    const pairs = Math.max(2, Math.round(detail) + 2);
    for (let i = 1; i <= pairs; i++) {
      const t = i / (pairs + 1);
      const y = top + (bot - top) * t;
      const spread = Math.sin(Math.PI * t) * w * 0.26;
      const drop = (bot - top) * 0.1;
      out.push({
        d: linePath(cx, y + drop, cx - spread, y),
        bg: true,
        width: 0.6,
      });
      out.push({
        d: linePath(cx, y + drop, cx + spread, y),
        bg: true,
        width: 0.6,
      });
    }
    return out;
  },
  palette: { bg: "#ab4c12", ink: "#973d08", tint: 0.12 },
  defaults: { scale: 66, strokeWidth: 2.2, detail: 3 },
};

// ── P10 ───────────────────────────────────────────────────────────────────
// Meander. Dense concentric squares, edge to edge — the labyrinth look. Frame
// (set 2) is the same family but sparser, with a gap between cells.
const meander: MotifDef = {
  id: "meander",
  name: "Meander",
  group: "set1",
  period: { x: 2, y: 2 },
  build: ({ w, h, col, row, detail }) => {
    const big = (col + row) % 2 === 0;
    const base = big ? 0.98 : 0.54;
    const count = Math.max(2, Math.round(detail) + 1);
    return rings(count, base, base * 0.18).map((f) => {
      const sw = w * f;
      const sh = h * f;
      const x = (w - sw) / 2;
      const y = (h - sh) / 2;
      return {
        d: poly([
          [x, y],
          [x + sw, y],
          [x + sw, y + sh],
          [x, y + sh],
        ]),
      };
    });
  },
  palette: { bg: "#97c7ed", ink: "#6f9fc5", tint: 0.12 },
  defaults: { scale: 46, strokeWidth: 1.6, detail: 3 },
};

// ── P11 ───────────────────────────────────────────────────────────────────
// Facet. A diamond quartered along both diagonals, each quarter its own tone,
// which is what makes a flat shape read as a cut gem.
const facet: MotifDef = {
  id: "facet",
  name: "Facet",
  group: "set1",
  period: { x: 1, y: 2 },
  stagger: "rows",
  build: ({ w, h }) => {
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.5;
    const top: Pt = [cx, cy - R];
    const right: Pt = [cx + R, cy];
    const bottom: Pt = [cx, cy + R];
    const left: Pt = [cx - R, cy];
    const c: Pt = [cx, cy];
    const tones = [1, 0.62, 0.3, 0.78];
    const quarters: [Pt, Pt][] = [
      [top, right],
      [right, bottom],
      [bottom, left],
      [left, top],
    ];
    return quarters.map(([a, b], i) => ({
      d: poly([c, a, b]),
      fill: true,
      opacity: tones[i],
    }));
  },
  palette: { bg: "#c5ced3", ink: "#b8c3c9", tint: 0.1 },
  defaults: { scale: 66, detail: 1 },
};

// ── P12 ───────────────────────────────────────────────────────────────────
// Chain. Rings on both the cell centre and its corner, so each ring overlaps
// its four diagonal neighbours and the lattice reads as interlocked. A glint
// sits in the gap between them.
const chain: MotifDef = {
  id: "chain",
  name: "Chain",
  group: "set1",
  period: { x: 1, y: 1 },
  build: ({ w, h, detail }) => {
    // Just under a third of the cell: the centre and corner rings then overlap
    // enough to interlock without the lattice closing up into a solid mesh.
    const R = Math.min(w, h) * 0.29;
    const out: MotifShape[] = [
      { d: circlePath(w / 2, h / 2, R) },
      { d: circlePath(0, 0, R) },
    ];
    if (detail > 1) {
      out.push({ d: starPath(w / 2, 0, R * 0.3, 4, 0.12), fill: true });
      out.push({ d: starPath(0, h / 2, R * 0.3, 4, 0.12), fill: true });
    }
    return out;
  },
  palette: { bg: "#202529", ink: "#363e41", tint: -0.1 },
  defaults: { scale: 58, strokeWidth: 2, detail: 2 },
};

export const SET1_MOTIFS: MotifDef[] = [
  prism,
  hexring,
  spiral,
  isocube,
  leaf,
  meander,
  facet,
  chain,
];
