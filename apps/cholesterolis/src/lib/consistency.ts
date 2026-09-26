import type { Lipids, Marker, Panel } from './types';
import { MARKERS } from './types';

/** VLDL cholesterol is estimated as TG / 2.2 when values are in mmol/L (Friedewald, 1972). */
export const TG_TO_VLDL = 2.2;

/** Above this triglyceride level (mmol/L) the Friedewald estimate is not valid. */
export const FRIEDEWALD_TG_LIMIT = 4.5;

export function friedewaldTc(ldl: number, hdl: number, tg: number): number {
  return ldl + hdl + tg / TG_TO_VLDL;
}

export type Verdict = 'match' | 'mismatch' | 'incomplete';

export interface ConsistencyResult {
  verdict: Verdict;
  /** TC computed from LDL + HDL + TG/2.2, when all three are known. */
  computedTc?: number;
  /** Entered TC minus computed TC. */
  difference?: number;
  /** A missing value estimated from the other three. */
  inferred?: { marker: Marker; value: number };
  warnings: string[];
  /** Complete panel (entered values plus the inferred one), when possible. */
  lipids?: Lipids;
}

/** Entered and computed TC are considered consistent within max(0.3 mmol/L, 7 %). */
export function tolerance(tc: number): number {
  return Math.max(0.3, tc * 0.07);
}

function inferMissing(panel: Panel, missing: Marker): number | undefined {
  const { tc = 0, ldl = 0, hdl = 0, tg = 0 } = panel;
  let value: number;
  switch (missing) {
    case 'tc':
      value = friedewaldTc(ldl, hdl, tg);
      break;
    case 'ldl':
      value = tc - hdl - tg / TG_TO_VLDL;
      break;
    case 'hdl':
      value = tc - ldl - tg / TG_TO_VLDL;
      break;
    case 'tg':
      value = (tc - ldl - hdl) * TG_TO_VLDL;
      break;
  }
  return value > 0 ? value : undefined;
}

export function checkConsistency(panel: Panel, fasting: boolean): ConsistencyResult {
  const warnings: string[] = [];
  if (panel.tg !== undefined && panel.tg > FRIEDEWALD_TG_LIMIT) {
    warnings.push(
      'Trigliceridai viršija 4,5 mmol/l – tokiu atveju Friedewald formulė netiksli, todėl palyginimas nepatikimas.',
    );
  }
  if (!fasting && panel.tg !== undefined) {
    warnings.push(
      'Tyrimas atliktas pavalgius: trigliceridai būna šiek tiek didesni (vidutiniškai ~0,3 mmol/l), todėl formulė gali šiek tiek neatitikti.',
    );
  }

  const missing = MARKERS.filter((m) => panel[m] === undefined);

  if (missing.length === 1) {
    const value = inferMissing(panel, missing[0]);
    if (value === undefined) return { verdict: 'incomplete', warnings };
    const lipids = { ...panel, [missing[0]]: value } as Lipids;
    return { verdict: 'incomplete', inferred: { marker: missing[0], value }, warnings, lipids };
  }
  if (missing.length > 0) return { verdict: 'incomplete', warnings };

  const lipids = panel as Lipids;
  const computedTc = friedewaldTc(lipids.ldl, lipids.hdl, lipids.tg);
  const difference = lipids.tc - computedTc;
  const verdict = Math.abs(difference) <= tolerance(lipids.tc) ? 'match' : 'mismatch';
  return { verdict, computedTc, difference, warnings, lipids };
}
