// Core types for the Patterns app.
//
// The whole app rests on one idea: a motif is a pure function from a cell
// context to a list of SVG path strings. Nothing else knows any geometry. The
// SVG renderer serializes those `d` strings; the canvas renderer feeds the very
// same strings to `new Path2D(d)`. That shared string is what keeps the live
// preview, the SVG export and the MP4 export from ever drifting apart.

export type FillMode = "auto" | "stroke" | "fill";
export type AltMode = "checker" | "columns" | "rows";
export type FadeMode = "smooth" | "hard" | "radial";
export type FadeShape = "circle" | "square" | "diamond" | "hexagon";
export type Motion =
  "none" | "drift" | "spin" | "breathe" | "heartbeat" | "trace";
export type MotifGroup = "set2" | "set1";

export type PatternParams = {
  motif: string;

  // Grid. `scale` is the base unit in user units; a motif turns it into its own
  // box (a hex lattice cell is wider than it is tall, for instance).
  //
  // Two knobs then pull size and spacing apart, which `scale` alone couldn't do:
  // `gap` stretches the lattice without growing the motifs, and `motifScale`
  // grows the motifs without moving the lattice.
  scale: number;
  gap: number; // extra lattice spacing, as a fraction of the base
  motifScale: number; // each motif's size within its cell, 1 = fills it
  offsetX: number;
  offsetY: number;
  rotation: number; // turns the whole field
  motifRotation: number; // turns each motif in place
  detail: number; // 1..6, per-motif meaning (ring count, nesting, subdivisions)

  // Ink
  bg: string;
  ink: string;
  autoTint: boolean; // derive `ink` from `bg` via `tint` instead of using it
  tint: number; // -0.5..0.5 — negative lightens, positive darkens
  opacity: number;
  strokeWidth: number; // independent of `scale`, so zoom never fattens hairlines
  dash: number; // 0 = solid
  fillMode: FillMode; // `auto` honours each shape's own declaration

  // Fade: the pattern dissolves into its background along a direction.
  /** How much of the span fades. 0 = off. */
  fade: number;
  /**
   * `smooth` ramps gradually to nothing. `hard` stays at full strength and then
   * stops dead at one point — an edge rather than a gradient. `radial` fades
   * outward from the middle instead of along a direction, in `fadeShape`.
   */
  fadeMode: FadeMode;
  fadeAngle: number; // degrees, 0 = east — linear modes only
  /** Outline the radial mode fades from. Ignored by the linear modes. */
  fadeShape: FadeShape;

  // Seeded motifs
  seed: number;
  jitter: number;

  // Alternation: 0 = off, 1 = every second cell differs, n = groups of n.
  altEvery: number;
  altMode: AltMode;
  altOpacity: number;
  altColor: string | null; // null = inherit `ink`
  altScale: number; // relative, 1 = same
  altRotate: number; // degrees

  // Motion
  motion: Motion;
  /**
   * Whether a rotate/scale motion turns the whole field about one point, or
   * every motif in place about its own centre.
   *
   * Only meaningful for `spin` and `heartbeat`. `drift` and `breathe` are pure
   * translations, and a translation applied to every cell equally *is* the same
   * as translating the field — so scope has nothing to change there.
   */
  motionScope: "field" | "motif";
  speed: number;
  angle: number; // drift direction, degrees
  pulse: number; // heartbeat pop size, as a fraction of scale (0.1 = +10%)

  // Trace: each stroke draws itself on, the way manim's Write does.
  /** 0 = every stroke draws at once, 1 = strictly one after another. */
  traceStagger: number;
  /** Fraction of the loop the finished art holds before restarting. */
  traceHold: number;
};

// One path emitted by a motif, in cell-local coordinates.
export type MotifShape = {
  d: string;
  /** Filled rather than stroked. `fillMode` can override this. */
  fill?: boolean;
  /**
   * Painted in the *background* colour instead of the ink — for marks that read
   * as cut out of a filled shape, like a leaf's veins over its body.
   */
  bg?: boolean;
  /** Relative opacity multiplier — used for multi-tone motifs like Isocube. */
  opacity?: number;
  /** Relative stroke-width multiplier. */
  width?: number;
};

export type CellCtx = {
  /** Cell box in user units. Non-square for lattices like hex or seigaiha. */
  w: number;
  h: number;
  /** Cell coordinates within the tile. Motifs use these for their own stagger. */
  col: number;
  row: number;
  /**
   * Tile size in cells. A motif whose cells must agree with their neighbours
   * (Maze decides each wall once and shares it) reduces coordinates modulo
   * these, so the agreement survives the tile repeating.
   */
  cols: number;
  rows: number;
  detail: number;
  jitter: number;
  /** Deterministic per-cell PRNG, seeded from `(seed, col, row)`. */
  rand: () => number;
  params: PatternParams;
};

export type MotifDef = {
  id: string;
  name: string;
  group: MotifGroup;
  /** Cell box derived from `scale`. Defaults to a square cell. */
  cell?: (scale: number) => { w: number; h: number };
  /**
   * The motif's own repeat, in cells. A brick-offset motif is `{x:2,y:1}`; a
   * hex lattice is `{x:1,y:2}`. The tile is sized to the lcm of this and the
   * alternation period, so a motif's internal stagger survives every alt
   * setting — including `altEvery: 0`.
   */
  period?: { x: number; y: number };
  /**
   * Brick offset, applied by the composer to the cell's own transform rather
   * than inside `build`. That keeps the motif drawn at the centre of its cell
   * box, which is what gives per-motif spin and heartbeat a correct pivot — a
   * motif that staggered itself would sit at the cell edge and orbit instead of
   * turning in place. Alternation's scale/rotate get the same benefit.
   */
  stagger?: "rows" | "cols";
  /**
   * Whether the motif overflows its cell. When true the assembled tile is
   * drawn at all 9 neighbour offsets so edge-crossing shapes wrap; `<pattern>`
   * clips the excess. Set false only when the motif provably stays inside its
   * box — it halves the exported path count.
   */
  bleed?: boolean;
  build: (ctx: CellCtx) => MotifShape[];
  /** Draws from the PRNG — surfaces the Seed / Jitter controls. */
  seeded?: boolean;
  /** Applied on select, alongside `palette`. */
  defaults?: Partial<PatternParams>;
  palette: { bg: string; ink: string; tint: number };
};

export const DEFAULT_PARAMS: PatternParams = {
  motif: "honeycomb",
  scale: 72,
  gap: 0,
  motifScale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  motifRotation: 0,
  detail: 2,
  bg: "#fd3901",
  ink: "#e23501",
  autoTint: true,
  tint: 0.1,
  opacity: 1,
  strokeWidth: 2,
  dash: 0,
  fillMode: "auto",
  fade: 0,
  fadeMode: "smooth",
  fadeAngle: 90,
  fadeShape: "circle",
  seed: 1,
  jitter: 0.35,
  altEvery: 0,
  altMode: "checker",
  altOpacity: 0.45,
  altColor: null,
  altScale: 1,
  altRotate: 0,
  motion: "none",
  motionScope: "motif",
  speed: 0.4,
  angle: 0,
  pulse: 0.12,
  traceStagger: 0.5,
  traceHold: 0.25,
};
