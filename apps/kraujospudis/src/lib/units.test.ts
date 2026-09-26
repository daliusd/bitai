import { describe, expect, it } from 'vitest';
import { formatBp, formatDelta, formatMmHg, parseNumber } from './units';

describe('units', () => {
  it('parses Lithuanian decimal commas and rejects garbage', () => {
    expect(parseNumber('138')).toBe(138);
    expect(parseNumber(' 5,5 ')).toBe(5.5);
    expect(parseNumber('')).toBeUndefined();
    expect(parseNumber('abc')).toBeUndefined();
    expect(parseNumber('120/80')).toBeUndefined();
  });

  it('formats pressures and signed changes', () => {
    expect(formatMmHg(137.6)).toBe('138');
    expect(formatBp({ sys: 141.5, dia: 88.25 })).toBe('142/88');
    expect(formatDelta(-5.2)).toBe('−5');
    expect(formatDelta(-5.24, 1)).toBe('−5,2');
    expect(formatDelta(0.3)).toBe('0');
    expect(formatDelta(1.5, 1)).toBe('+1,5');
  });
});
