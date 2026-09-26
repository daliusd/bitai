import { describe, expect, it } from 'vitest';
import { formatDelta, formatValue, fromMmol, parseNumber, toMmol } from './units';

describe('units', () => {
  it('converts cholesterol and triglycerides to mg/dL', () => {
    expect(fromMmol('ldl', 1, 'mgdl')).toBeCloseTo(38.67);
    expect(fromMmol('tg', 1, 'mgdl')).toBeCloseTo(88.57);
    expect(fromMmol('tc', 5, 'mmol')).toBe(5);
  });

  it('round-trips values', () => {
    for (const m of ['tc', 'ldl', 'hdl', 'tg'] as const) {
      expect(toMmol(m, fromMmol(m, 4.2, 'mgdl'), 'mgdl')).toBeCloseTo(4.2);
    }
  });

  it('parses Lithuanian decimal commas and rejects garbage', () => {
    expect(parseNumber('5,2')).toBe(5.2);
    expect(parseNumber(' 5.25 ')).toBe(5.25);
    expect(parseNumber('190')).toBe(190);
    expect(parseNumber('')).toBeUndefined();
    expect(parseNumber('abc')).toBeUndefined();
    expect(parseNumber('5,2,1')).toBeUndefined();
  });

  it('formats values with a decimal comma', () => {
    expect(formatValue('tc', 6.2, 'mmol')).toBe('6,20');
    expect(formatValue('tc', 5, 'mgdl')).toBe('193');
    expect(formatDelta('ldl', -0.25, 'mmol')).toBe('−0,25');
    expect(formatDelta('hdl', 0.1, 'mmol')).toBe('+0,10');
    expect(formatDelta('hdl', 0.001, 'mmol')).toBe('0,00');
  });
});
