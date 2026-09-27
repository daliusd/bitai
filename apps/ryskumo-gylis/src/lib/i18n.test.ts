import { describe, expect, it } from 'vitest';
import { STRINGS } from './i18n';

describe('STRINGS', () => {
  it('translates every key into both languages', () => {
    const keys = (o: object) => Object.keys(o).sort();
    expect(keys(STRINGS.en)).toEqual(keys(STRINGS.lt));
    expect(keys(STRINGS.en.formats)).toEqual(keys(STRINGS.lt.formats));
    expect(STRINGS.en.about).toHaveLength(STRINGS.lt.about.length);
  });

  it('leaves no text empty', () => {
    for (const strings of Object.values(STRINGS)) {
      for (const [key, value] of Object.entries(strings)) {
        if (typeof value === 'string') expect(value, key).not.toBe('');
      }
    }
  });
});
