import type { Marker } from './types';

/** Within-person biological variation (CV) from 30 studies: Smith et al., Clin Chem 1993. */
export const BIOLOGICAL_CV: Record<Marker, number> = { tc: 0.061, hdl: 0.074, ldl: 0.095, tg: 0.226 };

/**
 * Typical laboratory (analytical) imprecision, taken as the long-standing NCEP
 * performance goals for lipid assays: TC ≤ 3 %, HDL/LDL ≤ 4 %, TG ≤ 5 %.
 */
export const ANALYTICAL_CV: Record<Marker, number> = { tc: 0.03, hdl: 0.04, ldl: 0.04, tg: 0.05 };

const Z95 = 1.96;

export function totalCv(marker: Marker): number {
  return Math.hypot(BIOLOGICAL_CV[marker], ANALYTICAL_CV[marker]);
}

/** Range in which a single result would fall 95 % of the time for the same person. */
export function singleResultRange(marker: Marker, value: number): [number, number] {
  const spread = Z95 * totalCv(marker);
  return [value * (1 - spread), value * (1 + spread)];
}

/**
 * Reference change value (Fraser 2011): the relative difference between two results
 * that is unlikely (p < 0.05) to be explained by biological and laboratory variation alone.
 */
export function referenceChangeValue(marker: Marker): number {
  return Math.SQRT2 * Z95 * totalCv(marker);
}

export interface Comparison {
  /** Relative change from the earlier result, e.g. 0.5 for +50 %. */
  change: number;
  rcv: number;
  significant: boolean;
}

export function compareResults(marker: Marker, earlier: number, later: number): Comparison {
  const change = (later - earlier) / earlier;
  const rcv = referenceChangeValue(marker);
  return { change, rcv, significant: Math.abs(change) > rcv };
}
