import { describe, expect, it } from 'vitest';
import { formatDistance, formatNumber, niceStep, parseNumber } from './numbers';

describe('parseNumber', () => {
  it('accepts comma and dot decimals', () => {
    expect(parseNumber('5,2')).toBe(5.2);
    expect(parseNumber(' 5.2 ')).toBe(5.2);
    expect(parseNumber('50')).toBe(50);
  });

  it('rejects junk', () => {
    expect(parseNumber('')).toBeUndefined();
    expect(parseNumber('abc')).toBeUndefined();
    expect(parseNumber('-3')).toBeUndefined();
  });
});

describe('formatting', () => {
  it('uses the page language decimal separator', () => {
    expect(formatNumber(4.139, 'lt')).toBe('4,14');
    expect(formatNumber(4.139, 'en')).toBe('4.14');
    expect(formatNumber(Infinity, 'en')).toBe('∞');
  });

  it('shows fewer decimals for larger distances', () => {
    expect(formatDistance(0.853, 'en')).toBe('0.85');
    expect(formatDistance(23.86, 'en')).toBe('23.9');
    expect(formatDistance(150.4, 'en')).toBe('150');
  });
});

describe('niceStep', () => {
  it('rounds to 1, 2, 2.5 or 5 × 10ⁿ', () => {
    expect(niceStep(0.9)).toBe(1);
    expect(niceStep(1.9)).toBe(2);
    expect(niceStep(3)).toBe(2.5);
    expect(niceStep(4)).toBe(5);
    expect(niceStep(0.04)).toBeCloseTo(0.05, 9);
  });
});
