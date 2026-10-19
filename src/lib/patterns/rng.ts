// Deterministic randomness. Every seeded motif draws from a PRNG keyed by
// `(seed, col, row)`, so a cell looks the same no matter how big the tile
// around it ends up being — which is what lets alternation resize the tile
// without reshuffling the pattern.

/** mulberry32 — small, fast, good enough spread for visual jitter. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mix three integers into one seed. */
export function hash3(a: number, b: number, c: number): number {
  let h = 2166136261 >>> 0;
  for (const v of [a, b, c]) {
    h ^= v & 0xffff;
    h = Math.imul(h, 16777619) >>> 0;
    h ^= (v >>> 16) & 0xffff;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function cellRandom(seed: number, col: number, row: number) {
  return mulberry32(hash3(seed, col + 1013, row + 7919));
}

/** Map a 0..1 draw onto a range. */
export function span(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

/** Symmetric jitter: 0 when `amount` is 0. */
export function wobble(rand: () => number, amount: number): number {
  return (rand() * 2 - 1) * amount;
}
