// The motif catalogue the picker reads from.

import { SET1_MOTIFS } from "./motifs/set1";
import { SET2_MOTIFS } from "./motifs/set2";
import { DEFAULT_PARAMS, type MotifDef, type PatternParams } from "./types";

export const MOTIFS: MotifDef[] = [...SET2_MOTIFS, ...SET1_MOTIFS];

const BY_ID = new Map(MOTIFS.map((m) => [m.id, m]));

export function getMotif(id: string): MotifDef {
  return BY_ID.get(id) ?? MOTIFS[0];
}

/**
 * Params for a motif as the reference sheet shows it: its sampled palette plus
 * whatever scale/stroke/detail it needs to read correctly. Selecting a motif in
 * the picker applies this over the current params, the same way Dither's
 * presets carry a patch.
 */
export function motifParams(
  id: string,
  base: PatternParams = DEFAULT_PARAMS,
): PatternParams {
  const m = getMotif(id);
  return {
    ...base,
    ...m.defaults,
    motif: m.id,
    bg: m.palette.bg,
    ink: m.palette.ink,
    tint: m.palette.tint,
    autoTint: true,
  };
}
