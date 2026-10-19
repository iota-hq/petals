// Helpers shared by both motif sets.

/** Evenly spaced nesting factors from `outer` down to `inner`. */
export function rings(count: number, outer: number, inner: number): number[] {
  const c = Math.max(1, Math.round(count));
  if (c === 1) return [outer];
  return Array.from(
    { length: c },
    (_, i) => outer - ((outer - inner) * i) / (c - 1),
  );
}

/** Half-cell shift on odd rows — the brick offset most of these lattices use. */
export function stagger(w: number, row: number): number {
  return row % 2 ? w / 2 : 0;
}
