import { describe, expect, it } from 'vitest';
import { parseReading, summarize } from './readings';

describe('parseReading', () => {
  it('accepts plausible readings', () => {
    expect(parseReading({ sys: '138', dia: '86' })).toEqual({ bp: { sys: 138, dia: 86 } });
  });

  it('ignores incomplete rows', () => {
    expect(parseReading({ sys: '138', dia: '' })).toEqual({});
  });

  it('flags typos and swapped numbers', () => {
    expect(parseReading({ sys: '1380', dia: '86' }).problem).toBe('range');
    expect(parseReading({ sys: '80', dia: '120' }).problem).toBe('order');
  });
});

describe('summarize', () => {
  it('returns nothing without readings', () => {
    expect(summarize([])).toBeUndefined();
  });

  it('averages one or two readings as they are', () => {
    const s = summarize([
      { sys: 140, dia: 90 },
      { sys: 130, dia: 80 },
    ])!;
    expect(s.average).toEqual({ sys: 135, dia: 85 });
    expect(s.used).toBe(2);
    expect(s.droppedFirst).toBe(false);
  });

  it('drops the first of three or more readings', () => {
    const s = summarize([
      { sys: 160, dia: 95 },
      { sys: 140, dia: 88 },
      { sys: 136, dia: 84 },
    ])!;
    expect(s.average).toEqual({ sys: 138, dia: 86 });
    expect(s.count).toBe(3);
    expect(s.used).toBe(2);
    expect(s.droppedFirst).toBe(true);
    expect(s.sysSpread).toBe(24);
  });
});
