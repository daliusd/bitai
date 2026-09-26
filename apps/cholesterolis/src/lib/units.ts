import type { Marker, Unit } from './types';

// Cholesterol: 1 mmol/L = 38.67 mg/dL; triglycerides: 1 mmol/L = 88.57 mg/dL.
export const CHOLESTEROL_FACTOR = 38.67;
export const TRIGLYCERIDE_FACTOR = 88.57;

function factor(marker: Marker): number {
  return marker === 'tg' ? TRIGLYCERIDE_FACTOR : CHOLESTEROL_FACTOR;
}

export function toMmol(marker: Marker, value: number, unit: Unit): number {
  return unit === 'mmol' ? value : value / factor(marker);
}

export function fromMmol(marker: Marker, value: number, unit: Unit): number {
  return unit === 'mmol' ? value : value * factor(marker);
}

export function unitLabel(unit: Unit): string {
  return unit === 'mmol' ? 'mmol/l' : 'mg/dl';
}

/** Parses user input, accepting both "5,2" and "5.2". Returns undefined for empty or invalid input. */
export function parseNumber(raw: string): number | undefined {
  const cleaned = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (cleaned === '' || !/^\d*\.?\d+$|^\d+\.$/.test(cleaned)) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

export function formatNumber(value: number, digits: number): string {
  return value.toLocaleString('lt-LT', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Formats a value given in mmol/L in the requested unit. */
export function formatValue(marker: Marker, mmol: number, unit: Unit): string {
  const v = fromMmol(marker, mmol, unit);
  return formatNumber(v, unit === 'mmol' ? 2 : 0);
}

/** Formats a signed change given in mmol/L in the requested unit, e.g. "−0,25". */
export function formatDelta(marker: Marker, mmol: number, unit: Unit): string {
  const v = fromMmol(marker, mmol, unit);
  const digits = unit === 'mmol' ? 2 : 0;
  const rounded = Number(v.toFixed(digits));
  if (rounded === 0) return formatNumber(0, digits);
  const sign = rounded > 0 ? '+' : '−';
  return sign + formatNumber(Math.abs(rounded), digits);
}
