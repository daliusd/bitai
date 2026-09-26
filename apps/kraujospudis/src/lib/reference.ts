import type { Bp, Setting } from './types';

export type Category = 'low' | 'nonElevated' | 'elevated' | 'hypertension' | 'severe';

/** Colour tone used by the status badges and bars. */
export type Tone = 'ok' | 'borderline' | 'high' | 'low';

export const CATEGORY_TONE: Record<Category, Tone> = {
  low: 'low',
  nonElevated: 'ok',
  elevated: 'borderline',
  hypertension: 'high',
  severe: 'high',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  low: 'Žemas',
  nonElevated: 'Nepadidėjęs',
  elevated: 'Padidėjęs',
  hypertension: 'Hipertenzija',
  severe: 'Labai aukštas',
};

/**
 * ESC 2024 thresholds (mmHg). Non-elevated BP is < 120/70 in every setting. Hypertension
 * is ≥ 140/90 in the office but ≥ 135/85 at home, because home readings are lower.
 */
export const THRESHOLDS: Record<Setting, { elevated: Bp; hypertension: Bp }> = {
  office: { elevated: { sys: 120, dia: 70 }, hypertension: { sys: 140, dia: 90 } },
  home: { elevated: { sys: 120, dia: 70 }, hypertension: { sys: 135, dia: 85 } },
};

/** Severe hypertension (ESC 2024: grade 3, ≥ 180/110) needs prompt medical attention. */
export const SEVERE: Bp = { sys: 180, dia: 110 };

/** Below 90/60 blood pressure is commonly considered low (hypotension). */
export const LOW: Bp = { sys: 90, dia: 60 };

const atLeast = (bp: Bp, limit: Bp) => bp.sys >= limit.sys || bp.dia >= limit.dia;

/** The higher of the systolic and diastolic categories decides. */
export function classify(bp: Bp, setting: Setting): Category {
  const t = THRESHOLDS[setting];
  if (atLeast(bp, SEVERE)) return 'severe';
  if (atLeast(bp, t.hypertension)) return 'hypertension';
  if (atLeast(bp, t.elevated)) return 'elevated';
  if (bp.sys < LOW.sys || bp.dia < LOW.dia) return 'low';
  return 'nonElevated';
}

/** Hypertension with only one of the two numbers raised. */
export function isolatedType(bp: Bp, setting: Setting): 'systolic' | 'diastolic' | undefined {
  const t = THRESHOLDS[setting].hypertension;
  if (bp.sys >= t.sys && bp.dia < t.dia) return 'systolic';
  if (bp.dia >= t.dia && bp.sys < t.sys) return 'diastolic';
  return undefined;
}

/** Human-readable range of a category, e.g. "120–139 / 70–89 mmHg". */
export function categoryRange(category: Category, setting: Setting): string {
  const t = THRESHOLDS[setting];
  switch (category) {
    case 'low':
      return `< ${LOW.sys} / < ${LOW.dia} mmHg`;
    case 'nonElevated':
      return `< ${t.elevated.sys} / < ${t.elevated.dia} mmHg`;
    case 'elevated':
      return `${t.elevated.sys}–${t.hypertension.sys - 1} / ${t.elevated.dia}–${t.hypertension.dia - 1} mmHg`;
    case 'hypertension':
      return `≥ ${t.hypertension.sys} / ≥ ${t.hypertension.dia} mmHg`;
    case 'severe':
      return `≥ ${SEVERE.sys} / ≥ ${SEVERE.dia} mmHg`;
  }
}

/**
 * Relative reduction of major cardiovascular events for a systolic drop (mmHg):
 * about 10 % per 5 mmHg in trials of blood pressure drugs (BPLTTC, Lancet 2021),
 * compounded multiplicatively.
 */
export function riskReduction(sysDrop: number): number {
  if (sysDrop <= 0) return 0;
  return 1 - Math.pow(0.9, sysDrop / 5);
}
