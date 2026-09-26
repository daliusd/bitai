import type { Marker, Sex, Unit } from './types';
import { formatValue, unitLabel } from './units';

export type Status = 'ok' | 'borderline' | 'high' | 'low';

export interface EvalContext {
  fasting: boolean;
  sex: Sex;
}

export const MARKER_NAMES: Record<Marker, string> = {
  tc: 'Bendrasis cholesterolis',
  hdl: 'DTL („gerasis“) cholesterolis',
  ldl: 'MTL („blogasis“) cholesterolis',
  tg: 'Trigliceridai',
};

export const MARKER_SHORT: Record<Marker, string> = {
  tc: 'BCH',
  hdl: 'DTL',
  ldl: 'MTL',
  tg: 'TG',
};

/** HDL lower limit (mmol/L): ESC/EAS 2019 — < 1.0 for men and < 1.2 for women is a risk marker. */
export function hdlLimit(sex: Sex): number {
  return sex === 'female' ? 1.2 : 1.0;
}

/** Triglyceride upper limit (mmol/L): < 1.7 fasting; < 2.0 non-fasting (EAS/EFLM 2016). */
export function tgLimit(fasting: boolean): number {
  return fasting ? 1.7 : 2.0;
}

/**
 * Thresholds (mmol/L), from the ESC/EAS 2019 dyslipidaemia guidelines and the
 * EAS/EFLM 2016 consensus on non-fasting lipid testing (Nordestgaard et al.).
 */
export function evaluate(marker: Marker, value: number, ctx: EvalContext): Status {
  switch (marker) {
    case 'tc':
      if (value < 5.0) return 'ok';
      return value < 6.2 ? 'borderline' : 'high';
    case 'ldl':
      if (value < 3.0) return 'ok';
      return value < 4.9 ? 'borderline' : 'high';
    case 'hdl':
      return value >= hdlLimit(ctx.sex) ? 'ok' : 'low';
    case 'tg': {
      const limit = tgLimit(ctx.fasting);
      if (value < limit) return 'ok';
      return value < 2.3 ? 'borderline' : 'high';
    }
  }
}

export const STATUS_LABELS: Record<Status, string> = {
  ok: 'Rekomenduojamose ribose',
  borderline: 'Šiek tiek per didelis',
  high: 'Per didelis',
  low: 'Per mažas',
};

/** Human-readable recommended range for the given context, e.g. "< 5,00 mmol/l". */
export function referenceText(marker: Marker, ctx: EvalContext, unit: Unit): string {
  const u = unitLabel(unit);
  const f = (v: number) => `${formatValue(marker, v, unit)} ${u}`;
  switch (marker) {
    case 'tc':
      return `< ${f(5.0)}`;
    case 'ldl':
      return `< ${f(3.0)}, esant didesnei rizikai – mažiau`;
    case 'hdl':
      if (ctx.sex === 'male') return `> ${f(1.0)} vyrams`;
      if (ctx.sex === 'female') return `> ${f(1.2)} moterims`;
      return `> ${f(1.0)} vyrams, > ${f(1.2)} moterims`;
    case 'tg':
      return ctx.fasting ? `< ${f(1.7)} nevalgius` : `< ${f(2.0)} pavalgius (nevalgius < ${f(1.7)})`;
  }
}
