import { describe, expect, it } from 'vitest';
import { compareResults, referenceChangeValue, singleResultRange, totalCv } from './variability';

describe('variability', () => {
  it('combines biological and analytical variation', () => {
    expect(totalCv('tg')).toBeCloseTo(0.2315, 3);
    expect(totalCv('tc')).toBeCloseTo(0.068, 3);
  });

  it('gives a 95 % range for a single result', () => {
    const [lo, hi] = singleResultRange('tg', 2);
    expect(lo).toBeCloseTo(1.09, 2);
    expect(hi).toBeCloseTo(2.91, 2);
  });

  it('computes reference change values', () => {
    expect(referenceChangeValue('tg')).toBeCloseTo(0.642, 2);
    expect(referenceChangeValue('tc')).toBeCloseTo(0.188, 2);
  });

  it('flags changes larger than natural variation', () => {
    expect(compareResults('tg', 1.22, 2.84).significant).toBe(true);
    expect(compareResults('tg', 1.5, 2.0).significant).toBe(false);
    expect(compareResults('tc', 6.0, 5.0).significant).toBe(false);
    expect(compareResults('tc', 6.0, 4.5).significant).toBe(true);
  });
});
