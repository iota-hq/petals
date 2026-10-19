// Ink is normally a tint of the background rather than a free colour — that's
// how the reference sheets are built. Sampling them showed the motif colour is
// the background multiplied by ~0.86–0.92 (black at 10–14%), except on the dark
// and desaturated panels, where it's *lighter* instead. Hence a signed tint.

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const v = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(v)) return [0, 0, 0];
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/**
 * Mix `hex` toward black (`t > 0`) or white (`t < 0`) by |t|.
 * `tintColor("#fd3901", 0.1)` → `#e43301`, matching the sampled `#e23501`.
 */
export function tintColor(hex: string, t: number): string {
  const [r, g, b] = hexToRgb(hex);
  const target = t >= 0 ? 0 : 255;
  const a = Math.min(1, Math.abs(t));
  return rgbToHex(
    r + (target - r) * a,
    g + (target - g) * a,
    b + (target - b) * a,
  );
}

/** Relative luminance, 0..1 — used to pick a sensible tint direction. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** The colour a motif actually draws with, honouring `autoTint`. */
export function resolveInk(
  bg: string,
  ink: string,
  autoTint: boolean,
  tint: number,
): string {
  return autoTint ? tintColor(bg, tint) : ink;
}
