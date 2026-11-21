import { describe, expect, it } from 'vitest';
import { CARDS, cardsFor } from './cards';
import { grade, isLearned, pickNext, weightOf } from './practice';

function byId(id: string) {
  const card = CARDS.find((c) => c.id === id)!;
  // Compare marks in canonical order: the source writes dagesh/shin dot before the vowel.
  return { ...card, hebrew: card.hebrew.normalize('NFC') };
}

describe('cards', () => {
  it('has unique ids', () => {
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(CARDS.length);
  });

  it('covers 22 letters plus dagesh, shin/sin and final variants', () => {
    expect(cardsFor(['raides'])).toHaveLength(31);
  });

  it('distinguishes letters by their dots', () => {
    expect(byId('r-bet')).toMatchObject({ hebrew: 'בּ'.normalize('NFC'), sound: 'b' });
    expect(byId('r-vet')).toMatchObject({ hebrew: 'ב'.normalize('NFC'), sound: 'v' });
    expect(byId('r-shin')).toMatchObject({ hebrew: 'שׁ'.normalize('NFC'), sound: 'š' });
    expect(byId('r-sin')).toMatchObject({ hebrew: 'שׂ'.normalize('NFC'), sound: 's' });
    expect(byId('r-tsadi').sound).toBe('c');
    expect(byId('r-alef').sound).toBe('');
  });

  it('builds syllables from a consonant and a vowel', () => {
    expect(byId('s-bet-qamats')).toMatchObject({ hebrew: 'בָּ'.normalize('NFC'), sound: 'ba', name: 'Bet + Kamac' });
    expect(byId('s-shin-hiriq')).toMatchObject({ hebrew: 'שִׁ'.normalize('NFC'), sound: 'ši' });
    expect(byId('s-lamed-holam-male')).toMatchObject({ hebrew: 'לוֹ'.normalize('NFC'), sound: 'lo' });
    expect(byId('s-mem-shuruq')).toMatchObject({ hebrew: 'מוּ'.normalize('NFC'), sound: 'mu' });
    // Silent letters read as their vowel alone.
    expect(byId('s-alef-patah').sound).toBe('a');
    expect(byId('s-ayin-tsere').sound).toBe('e');
  });

  it('gives final letters no syllables', () => {
    expect(CARDS.some((c) => c.id.startsWith('s-mem-sofit'))).toBe(false);
  });
});

describe('practice', () => {
  it('halves the weight of known cards and doubles unknown ones', () => {
    let w = grade({}, 'a', true);
    expect(weightOf(w, 'a')).toBe(0.5);
    w = grade(w, 'a', true);
    expect(isLearned(w, 'a')).toBe(true);
    w = grade(w, 'a', false);
    expect(weightOf(w, 'a')).toBe(2);
    expect(isLearned(w, 'a')).toBe(false);
  });

  it('picks by weight and never repeats the current card', () => {
    const ids = ['a', 'b', 'c'];
    const weights = { a: 1, b: 1, c: 8 };
    expect(pickNext(ids, weights, null, () => 0)).toBe('a');
    expect(pickNext(ids, weights, null, () => 0.5)).toBe('c');
    expect(pickNext(ids, weights, 'a', () => 0)).toBe('b');
    expect(pickNext(['a'], {}, 'a', () => 0.3)).toBe('a');
    expect(pickNext([], {}, null)).toBeNull();
  });
});
