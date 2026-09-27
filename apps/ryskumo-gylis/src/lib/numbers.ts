import type { Lang } from './lang';

const LOCALES: Record<Lang, string> = { lt: 'lt-LT', en: 'en-GB' };

/** Parses user input, accepting both "5,2" and "5.2". Returns undefined for empty or invalid input. */
export function parseNumber(raw: string): number | undefined {
  const cleaned = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (cleaned === '' || !/^\d*\.?\d+$|^\d+\.$/.test(cleaned)) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

/** A number with at most `digits` decimals in the page language, e.g. "4,14" or "4.14". */
export function formatNumber(value: number, lang: Lang, digits = 2): string {
  if (value === Infinity) return '∞';
  return value.toLocaleString(LOCALES[lang], { maximumFractionDigits: digits, useGrouping: false });
}

/** Distances get fewer decimals the larger they are: 0,85 · 4,14 · 23,9 · 150. */
export function formatDistance(metres: number, lang: Lang): string {
  const abs = Math.abs(metres);
  return formatNumber(metres, lang, abs >= 100 ? 0 : abs >= 10 ? 1 : 2);
}

/** Crop factors and CoC values keep more precision. */
export function formatPrecise(value: number, lang: Lang): string {
  return formatNumber(value, lang, value < 0.1 ? 4 : 3);
}

/** A "nice" step (1, 2, 2.5 or 5 × 10ⁿ) close to `rough`, for ticks and grid spacing. */
export function niceStep(rough: number): number {
  const exp = Math.pow(10, Math.floor(Math.log10(rough)));
  const m = rough / exp;
  const nice = m < 1.5 ? 1 : m < 2.25 ? 2 : m < 3.5 ? 2.5 : m < 7.5 ? 5 : 10;
  return nice * exp;
}
