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

/** Whole mmHg, e.g. "138". */
export function formatMmHg(value: number): string {
  return formatNumber(Math.round(value), 0);
}

/** Signed change with the given precision, e.g. "−5" or "+1,5". */
export function formatDelta(value: number, digits = 0): string {
  const rounded = Number(value.toFixed(digits));
  if (rounded === 0) return formatNumber(0, digits);
  const sign = rounded > 0 ? '+' : '−';
  return sign + formatNumber(Math.abs(rounded), digits);
}

/** Systolic/diastolic pair, e.g. "138/86". */
export function formatBp(bp: { sys: number; dia: number }): string {
  return `${formatMmHg(bp.sys)}/${formatMmHg(bp.dia)}`;
}
