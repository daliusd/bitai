import { describe, expect, it } from 'vitest';
import { checkConsistency, friedewaldTc } from './consistency';

describe('friedewaldTc', () => {
  it('adds LDL, HDL and TG/2.2', () => {
    expect(friedewaldTc(4.1, 1.3, 1.8)).toBeCloseTo(6.218, 3);
  });
});

describe('checkConsistency', () => {
  it('reports a match when entered TC agrees with the formula', () => {
    const r = checkConsistency({ tc: 6.2, hdl: 1.3, ldl: 4.1, tg: 1.8 }, true);
    expect(r.verdict).toBe('match');
    expect(r.computedTc).toBeCloseTo(6.218, 3);
    expect(r.difference).toBeCloseTo(-0.018, 3);
    expect(r.warnings).toHaveLength(0);
  });

  it('reports a mismatch when values disagree', () => {
    const r = checkConsistency({ tc: 7.5, hdl: 1.3, ldl: 4.1, tg: 1.8 }, true);
    expect(r.verdict).toBe('mismatch');
  });

  it('infers LDL when it is missing', () => {
    const r = checkConsistency({ tc: 6.2, hdl: 1.3, tg: 2.2 }, true);
    expect(r.verdict).toBe('incomplete');
    expect(r.inferred?.marker).toBe('ldl');
    expect(r.inferred?.value).toBeCloseTo(3.9);
    expect(r.lipids?.ldl).toBeCloseTo(3.9);
  });

  it('infers TC when it is missing', () => {
    const r = checkConsistency({ hdl: 1.3, ldl: 4.1, tg: 2.2 }, true);
    expect(r.inferred).toEqual({ marker: 'tc', value: expect.closeTo(6.4) });
  });

  it('does not infer impossible negative values', () => {
    const r = checkConsistency({ tc: 3, hdl: 2, tg: 4 }, true);
    expect(r.inferred).toBeUndefined();
    expect(r.lipids).toBeUndefined();
  });

  it('needs at least three values', () => {
    expect(checkConsistency({ tc: 6 }, true)).toEqual({ verdict: 'incomplete', warnings: [] });
  });

  it('warns about high triglycerides and non-fasting samples', () => {
    const r = checkConsistency({ tc: 8, hdl: 1, ldl: 4, tg: 5 }, false);
    expect(r.warnings).toHaveLength(2);
    expect(r.warnings[0]).toMatch(/4,5/);
    expect(r.warnings[1]).toMatch(/pavalgius/);
  });
});
