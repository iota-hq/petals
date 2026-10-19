// Builds the pattern as an SVG *string*.
//
// The live preview sets this string as innerHTML and the SVG export downloads
// the same string. There is deliberately no second React-element renderer: what
// you see is byte-for-byte what you export.

import {
  animatesCells,
  buildTile,
  cellMotionMatrix,
  mulMat,
  shapeStyle,
  wrapOffset,
  type Mat,
  type Tile,
} from "./compose";
import { circlePath, n, rectPath, regularPoly } from "./geom";
import type { PatternParams } from "./types";

const NS = "http://www.w3.org/2000/svg";
const XLINK = "http://www.w3.org/1999/xlink";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function matrixAttr(m: Mat): string {
  const isTranslate = m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1;
  if (isTranslate) {
    if (m[4] === 0 && m[5] === 0) return "";
    return ` transform="translate(${n(m[4])} ${n(m[5])})"`;
  }
  return ` transform="matrix(${m.map(n).join(" ")})"`;
}

/**
 * SMIL that turns each motif in place, on the cell's own `<g>`.
 *
 * `type="rotate"` takes a centre directly. `type="scale"` doesn't, so a
 * translate keyed to the same frames supplies one: listed first, the pair maps
 * a point to `s·p + c(1−s)`, which is exactly a scale about `c`.
 */
function cellAnimation(p: PatternParams, tile: Tile): string {
  if (!animatesCells(p)) return "";
  const dur = `${n(loopDuration(p))}s`;
  const common = `attributeName="transform" additive="sum" repeatCount="indefinite" dur="${dur}"`;
  const cx = tile.motifW / 2;
  const cy = tile.motifH / 2;

  if (p.motion === "spin")
    return (
      `<animateTransform ${common} type="rotate"` +
      ` from="0 ${n(cx)} ${n(cy)}" to="360 ${n(cx)} ${n(cy)}"/>`
    );

  const scales = HEART_AMPS.map((a) => 1 + p.pulse * a);
  const kt = HEART_TIMES.join(";");
  return (
    `<animateTransform ${common} type="translate" keyTimes="${kt}"` +
    ` values="${scales.map((s) => `${n(cx * (1 - s))} ${n(cy * (1 - s))}`).join(";")}"/>` +
    `<animateTransform ${common} type="scale" keyTimes="${kt}"` +
    ` values="${scales.map(n).join(";")}"/>`
  );
}

/**
 * SMIL that draws one stroke on.
 *
 * `pathLength="1"` renormalises every shape to a length of 1, so a single dash
 * scale works for a hexagon and a spiral alike — no need to measure anything.
 * The stroke then sits hidden until its turn, draws, and stays for the rest of
 * the loop, so all of them restart together.
 */
function traceAnimation(
  p: PatternParams,
  index: number,
  count: number,
  filled: boolean,
): string {
  const { dur, lag } = traceTiming(p, count);
  const t0 = Math.min(1, index * lag);
  const t1 = Math.min(1, t0 + dur);
  const common = `dur="${n(loopDuration(p))}s" repeatCount="indefinite"`;
  // A keyTimes list must not step backwards; a stroke starting at 0 simply
  // drops the leading hold.
  const keyTimes = t0 > 0 ? `0;${n(t0)};${n(t1)};1` : `0;${n(t1)};1`;
  // A filled shape has no outline to draw, so it fades in over the same window.
  const [attr, vals] = filled
    ? ["fill-opacity", t0 > 0 ? "0;0;1;1" : "0;1;1"]
    : ["stroke-dashoffset", t0 > 0 ? "1;1;0;0" : "1;0;0"];
  return `<animate attributeName="${attr}" ${common} values="${vals}" keyTimes="${keyTimes}"/>`;
}

/** The cells of one tile, as a `<g>`. */
function tileGroup(
  tile: Tile,
  p: PatternParams,
  time: number,
  id?: string,
): string {
  // A baked still can't rely on SMIL, so per-cell motion folds into the cell's
  // own matrix instead.
  const local =
    time && animatesCells(p)
      ? cellMotionMatrix(
          tile,
          motionOffset(p, tile, time).cellRot,
          motionOffset(p, tile, time).cellScale,
        )
      : null;
  const anim = time ? "" : cellAnimation(p, tile);

  // Trace numbers every stroke across the whole tile, so the stagger sweeps
  // from cell to cell rather than restarting inside each one. The canvas
  // renderer walks the cells in this same order, so the two agree on which
  // stroke is which.
  const tracing = p.motion === "trace" && p.speed > 0;
  const total = tracing
    ? tile.cells.reduce((k, c) => k + c.shapes.filter((s) => s.d).length, 0)
    : 0;
  let index = 0;

  const parts = tile.cells.map((cell) => {
    const common =
      ` fill="none" stroke="${esc(cell.color)}"` +
      ` stroke-width="${n(tile.strokeWidth)}"` +
      ` stroke-linecap="round" stroke-linejoin="round"` +
      (tile.dash ? ` stroke-dasharray="${tile.dash}"` : "") +
      (cell.opacity < 1 ? ` opacity="${n(cell.opacity)}"` : "");

    // The group above carries the cell's defaults; each path emits only where
    // its resolved style differs, which keeps the file small without either
    // renderer owning its own copy of the style rules.
    const paths = cell.shapes
      .filter((s) => s.d)
      .map((s) => {
        const st = shapeStyle(tile, cell, s);
        let a = "";
        if (st.fill) a += ` fill="${esc(st.color)}" stroke="none"`;
        else if (st.color !== cell.color) a += ` stroke="${esc(st.color)}"`;
        if (st.opacity !== cell.opacity)
          a += ` opacity="${n(cell.opacity ? st.opacity / cell.opacity : st.opacity)}"`;
        if (!st.fill && st.width !== tile.strokeWidth)
          a += ` stroke-width="${n(st.width)}"`;

        if (!tracing) return `<path d="${s.d}"${a}/>`;

        const i = index++;
        if (time) {
          // Baked still: no SMIL to lean on, so the dash is set outright.
          const prog = traceProgress(p, i, total, time);
          a += st.fill
            ? ` fill-opacity="${n(prog)}"`
            : ` pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="${n(1 - prog)}"`;
          return `<path d="${s.d}"${a}/>`;
        }
        if (!st.fill) a += ` pathLength="1" stroke-dasharray="1 1"`;
        return (
          `<path d="${s.d}"${a}>` +
          traceAnimation(p, i, total, st.fill) +
          `</path>`
        );
      })
      .join("");

    const m = local ? mulMat(cell.m, local) : cell.m;
    return `<g${matrixAttr(m)}${common}>${anim}${paths}</g>`;
  });

  return `<g${id ? ` id="${id}"` : ""}>${parts.join("")}</g>`;
}

/**
 * The outline a radial fade keeps, centred and sized to `reach`.
 *
 * Every shape goes through one blurred-mask path rather than each getting its
 * own gradient: a `radialGradient` only ever makes a circle, so a square or a
 * diamond would need entirely different machinery. Blurring a filled shape
 * softens any outline the same way.
 */
function fadeShapePath(p: PatternParams, W: number, H: number, reach: number) {
  const cx = W / 2;
  const cy = H / 2;
  if (p.fadeShape === "square")
    return rectPath(cx - reach, cy - reach, reach * 2, reach * 2);
  if (p.fadeShape === "diamond") return regularPoly(cx, cy, reach, 4, -90);
  if (p.fadeShape === "hexagon") return regularPoly(cx, cy, reach, 6, -90);
  return circlePath(cx, cy, reach);
}

/**
 * A mask over the pattern layer — not the background rect — so the motifs
 * dissolve and the background stays put.
 *
 * `smooth` ramps to nothing over the tail of the span. `hard` puts both stops
 * at the same offset, which is what makes it stop dead rather than ramp: the
 * gradient has no distance left to interpolate across. `radial` swaps the
 * gradient for a blurred shape.
 */
function fadeMask(p: PatternParams, id: string, W: number, H: number) {
  const amount = Math.min(1, Math.max(0, p.fade));
  if (amount <= 0) return { defs: "", attr: "" };

  if (p.fadeMode === "radial") {
    // Half the diagonal is what it takes to reach the corners, so at a tiny
    // fade the shape still covers the whole canvas.
    const reach = (Math.hypot(W, H) / 2) * (1 - amount);
    const blur = Math.min(W, H) * 0.08;
    return {
      defs:
        `<filter id="${id}-fb" x="-50%" y="-50%" width="200%" height="200%">` +
        `<feGaussianBlur stdDeviation="${n(blur)}"/></filter>` +
        `<mask id="${id}-fm">` +
        `<rect width="${n(W)}" height="${n(H)}" fill="#000"/>` +
        `<path d="${fadeShapePath(p, W, H, reach)}" fill="#fff"` +
        ` filter="url(#${id}-fb)"/></mask>`,
      attr: ` mask="url(#${id}-fm)"`,
    };
  }

  const a = (p.fadeAngle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const start = 1 - amount;
  const tail =
    p.fadeMode === "hard"
      ? `<stop offset="${n(start)}" stop-color="#000"/>`
      : `<stop offset="1" stop-color="#000"/>`;

  return {
    defs:
      `<linearGradient id="${id}-fg"` +
      ` x1="${n(0.5 - dx / 2)}" y1="${n(0.5 - dy / 2)}"` +
      ` x2="${n(0.5 + dx / 2)}" y2="${n(0.5 + dy / 2)}">` +
      `<stop offset="0" stop-color="#fff"/>` +
      `<stop offset="${n(start)}" stop-color="#fff"/>${tail}</linearGradient>` +
      `<mask id="${id}-fm">` +
      `<rect width="${n(W)}" height="${n(H)}" fill="url(#${id}-fg)"/></mask>`,
    attr: ` mask="url(#${id}-fm)"`,
  };
}

export type SvgOptions = {
  width: number;
  height: number;
  /** Emit only one tile (small, drops straight into CSS as a background). */
  tileOnly?: boolean;
  /** Leave the background rect out, for a transparent PNG/SVG. */
  transparent?: boolean;
  /** Namespaces the ids so several previews can share a page. */
  idPrefix?: string;
  /** Time in seconds — bakes a motion offset into the transform (Phase 5). */
  time?: number;
  /**
   * Stretch to the container rather than sitting at its own pixel size. The
   * default `meet` would letterbox whenever the box's ratio doesn't match, so
   * this slices instead — a pattern has no subject to crop badly.
   */
  fill?: boolean;
};

export function buildPatternSvg(p: PatternParams, opts: SvgOptions): string {
  const tile = buildTile(p);
  const id = opts.idPrefix ?? "pt";

  if (opts.tileOnly) {
    const bgRect = opts.transparent
      ? ""
      : `<rect width="${n(tile.w)}" height="${n(tile.h)}" fill="${esc(tile.bg)}"/>`;
    // A lone tile has nowhere to wrap into, so overflow is clipped explicitly
    // to keep it a true seamless unit.
    const clip = tile.bleed
      ? `<clipPath id="${id}-c"><rect width="${n(tile.w)}" height="${n(tile.h)}"/></clipPath>`
      : "";
    const body = tile.bleed
      ? `<g clip-path="url(#${id}-c)">${bleedUses(tile, `${id}-t`)}</g>`
      : tileGroup(tile, p, 0);
    const defs = tile.bleed
      ? `<defs>${clip}${tileGroup(tile, p, 0, `${id}-t`)}</defs>`
      : "";
    return (
      `<svg xmlns="${NS}" xmlns:xlink="${XLINK}" width="${n(tile.w)}" height="${n(tile.h)}"` +
      ` viewBox="0 0 ${n(tile.w)} ${n(tile.h)}">${defs}${bgRect}${body}</svg>`
    );
  }

  const { width: W, height: H } = opts;
  const drift = motionOffset(p, tile, opts.time ?? 0);
  // Anchor the lattice at the canvas centre — see `patternOrigin`.
  const { cx, cy } = patternOrigin(W, H);
  const ox = wrapOffset(p.offsetX + drift.x, tile.w) + cx;
  const oy = wrapOffset(p.offsetY + drift.y, tile.h) + cy;
  const rot = p.rotation + drift.rot;

  const xf =
    (ox || oy ? `translate(${n(ox)} ${n(oy)}) ` : "") +
    (rot ? `rotate(${n(rot)}) ` : "") +
    (drift.scale !== 1 ? `scale(${n(drift.scale)})` : "");

  const inner = tile.bleed
    ? bleedUses(tile, `${id}-t`)
    : `<use href="#${id}-t" xlink:href="#${id}-t"/>`;

  // A baked `time` means the caller wants a specific still, so the live SMIL
  // would fight it — only one or the other.
  const anim = opts.time ? "" : motionAnimation(p, tile);

  const fade = fadeMask(p, id, W, H);

  const defs =
    `<defs>${tileGroup(tile, p, opts.time ?? 0, `${id}-t`)}` +
    `<pattern id="${id}-p" width="${n(tile.w)}" height="${n(tile.h)}"` +
    ` patternUnits="userSpaceOnUse"` +
    (xf.trim() ? ` patternTransform="${xf.trim()}"` : "") +
    `>${inner}${anim}</pattern>${fade.defs}</defs>`;

  const bgRect = opts.transparent
    ? ""
    : `<rect width="100%" height="100%" fill="${esc(tile.bg)}"/>`;

  const box = opts.fill
    ? `width="100%" height="100%" preserveAspectRatio="xMidYMid slice"`
    : `width="${n(W)}" height="${n(H)}"`;

  return (
    `<svg xmlns="${NS}" xmlns:xlink="${XLINK}" ${box}` +
    ` viewBox="0 0 ${n(W)} ${n(H)}">${defs}${bgRect}` +
    `<rect width="100%" height="100%" fill="url(#${id}-p)"${fade.attr}/></svg>`
  );
}

/**
 * Nine copies of the tile, one per neighbour offset. Anything a motif draws
 * outside its box arrives from the neighbour that owns it, and `<pattern>`
 * clips the rest — which is what makes overflowing motifs seamless without
 * each one having to solve wrapping itself. `<use>` keeps the geometry in the
 * file exactly once.
 */
function bleedUses(tile: Tile, ref: string): string {
  const out: string[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = dx * tile.w;
      const y = dy * tile.h;
      out.push(
        `<use href="#${ref}" xlink:href="#${ref}"` +
          (x ? ` x="${n(x)}"` : "") +
          (y ? ` y="${n(y)}"` : "") +
          `/>`,
      );
    }
  }
  return out.join("");
}

/**
 * Drift direction as a whole number of tiles.
 *
 * A loop only rejoins itself if the travel over one period is an exact lattice
 * vector — drifting by `cos(angle) × tileWidth` would land mid-tile and jump at
 * the seam. Quantizing the angle to the eight compass directions makes every
 * step (0, ±1 tile) in each axis, so the loop is perfect by construction rather
 * than by luck.
 */
export function driftStep(angle: number): { nx: number; ny: number } {
  const dirs = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ];
  const k = Math.round(((((angle % 360) + 360) % 360) / 45) % 8) % 8;
  const [nx, ny] = dirs[k];
  return { nx, ny };
}

/**
 * Motion is an offset into the same transform the user controls, so it costs
 * nothing extra and composes with their offset and rotation.
 */
/**
 * The heartbeat envelope: a hard thump, a softer second one, then rest — the
 * lub-dub shape, rather than an even sine, which reads as breathing instead.
 * Shared with the SMIL keyframes so the canvas and the browser animate the
 * identical curve.
 */
const HEART_TIMES = [0, 0.07, 0.16, 0.24, 0.34, 1];
const HEART_AMPS = [0, 1, 0, 0.55, 0, 0];

function piecewise(t: number, times: number[], values: number[]): number {
  const u = ((t % 1) + 1) % 1;
  for (let i = 1; i < times.length; i++) {
    if (u <= times[i]) {
      const span = times[i] - times[i - 1] || 1;
      return (
        values[i - 1] +
        (values[i] - values[i - 1]) * ((u - times[i - 1]) / span)
      );
    }
  }
  return values[values.length - 1];
}

/**
 * `x`/`y`/`rot`/`scale` move the whole field; `cellRot`/`cellScale` turn each
 * motif in place. A rotate/scale motion lands in one pair or the other
 * depending on `motionScope` — never both.
 */
export function motionOffset(p: PatternParams, tile: Tile, t: number) {
  const still = { x: 0, y: 0, rot: 0, scale: 1, cellRot: 0, cellScale: 1 };
  if (p.motion === "none" || !t || p.speed <= 0) return still;
  const perCell = animatesCells(p);

  if (p.motion === "spin") {
    const rot = t * p.speed * 360;
    return perCell ? { ...still, cellRot: rot } : { ...still, rot };
  }
  if (p.motion === "heartbeat") {
    const scale = 1 + p.pulse * piecewise(t * p.speed, HEART_TIMES, HEART_AMPS);
    return perCell ? { ...still, cellScale: scale } : { ...still, scale };
  }
  // Only drift and breathe move the field. Anything else — trace, or whatever
  // comes next — must bow out explicitly rather than fall through to the
  // translation below, which is how trace ended up swaying like breathe.
  if (p.motion !== "drift" && p.motion !== "breathe") return still;

  const { nx, ny } = driftStep(p.angle);
  const phase =
    p.motion === "drift" ? t * p.speed : Math.sin(t * p.speed * Math.PI * 2); // breathe swings either way
  return { ...still, x: nx * tile.w * phase, y: ny * tile.h * phase };
}

/**
 * Where the lattice is anchored, in canvas coordinates.
 *
 * The tile grid is pinned to the pattern-space origin, so wherever that origin
 * lands is the one point that *doesn't* move when the tile resizes. Left at 0
 * it's the top-left corner, which is why zoom, gap and motif size used to grow
 * away from there — the corner stayed put and everything else slid. Anchoring
 * at the canvas centre makes them grow around the middle instead, and gives a
 * field rotation or heartbeat the same sensible pivot.
 *
 * It costs nothing to carry: shifting a seamless pattern by a constant is
 * invisible, since there's no reference point to shift against.
 */
export function patternOrigin(w: number, h: number) {
  return { cx: w / 2, cy: h / 2 };
}

/**
 * When each stroke starts and how long it takes, as fractions of one loop.
 *
 * Same lag model manim's `Write` uses: every stroke runs for `dur`, and each
 * starts `stagger × dur` after the one before. At stagger 0 they all draw
 * together; at 1 they draw strictly one after another. Solving for the span
 * keeps the whole set inside the loop whatever the stagger — so raising it
 * makes each stroke quicker rather than overrunning the loop.
 */
export function traceTiming(p: PatternParams, count: number) {
  const span = Math.max(0.05, 1 - Math.min(0.9, p.traceHold));
  const s = Math.max(0, p.traceStagger);
  const dur = span / (1 + s * Math.max(0, count - 1));
  return { dur, lag: s * dur };
}

/** How far stroke `index` has drawn at time `t`, 0..1. */
export function traceProgress(
  p: PatternParams,
  index: number,
  count: number,
  t: number,
): number {
  const T = loopDuration(p);
  if (!T) return 1;
  const u = (((t % T) + T) % T) / T;
  const { dur, lag } = traceTiming(p, count);
  return Math.max(0, Math.min(1, (u - index * lag) / dur));
}

/** Seconds for one perfect loop of the current motion. */
export function loopDuration(p: PatternParams): number {
  if (p.motion === "none" || p.speed <= 0) return 0;
  return 1 / p.speed;
}

/**
 * SMIL that animates `patternTransform` itself. The browser drives it with no
 * JS clock, and because the export is the same string, an animated SVG costs
 * nothing beyond these few bytes — no video pipeline involved.
 *
 * `additive="sum"` layers this on top of the user's own offset/rotation rather
 * than replacing it.
 */
function motionAnimation(p: PatternParams, tile: Tile): string {
  if (p.motion === "none" || p.speed <= 0) return "";
  // Per-motif spin/heartbeat is animated on the cells instead — see
  // `cellAnimation`.
  if (animatesCells(p)) return "";
  const dur = `${n(loopDuration(p))}s`;
  const common = `attributeName="patternTransform" additive="sum" repeatCount="indefinite" dur="${dur}"`;
  if (p.motion === "spin")
    return `<animateTransform ${common} type="rotate" from="0" to="360"/>`;

  if (p.motion === "heartbeat") {
    const vals = HEART_AMPS.map((a) => n(1 + p.pulse * a)).join(";");
    return (
      `<animateTransform ${common} type="scale"` +
      ` values="${vals}" keyTimes="${HEART_TIMES.join(";")}"/>`
    );
  }

  // Same guard as `motionOffset`: only drift and breathe animate the pattern
  // transform. Trace animates its strokes instead — see `traceAnimation`.
  if (p.motion !== "drift" && p.motion !== "breathe") return "";

  const { nx, ny } = driftStep(p.angle);
  const dx = n(nx * tile.w);
  const dy = n(ny * tile.h);
  if (p.motion === "drift")
    return `<animateTransform ${common} type="translate" from="0 0" to="${dx} ${dy}"/>`;
  // breathe — out, back, out the other way, back; matches `motionOffset`'s sine
  return (
    `<animateTransform ${common} type="translate"` +
    ` values="0 0;${dx} ${dy};0 0;${n(-nx * tile.w)} ${n(-ny * tile.h)};0 0"` +
    ` keyTimes="0;0.25;0.5;0.75;1"/>`
  );
}
