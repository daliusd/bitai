import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearStored, readStored, writeStored } from './storage';

describe('storage', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('round-trips values under a prefix', () => {
    writeStored('unit', 'mgdl');
    expect(localStorage.getItem('cholesterolis.unit')).toBe('"mgdl"');
    expect(readStored('unit', 'mmol')).toBe('mgdl');
  });

  it('merges stored objects with defaults so new fields keep defaults', () => {
    writeStored('choices', { weightKg: 5 });
    expect(readStored('choices', { weightKg: 0, lowCarb: false })).toEqual({ weightKg: 5, lowCarb: false });
  });

  it('falls back to the default on corrupt or mismatched data', () => {
    localStorage.setItem('cholesterolis.fasting', '{oops');
    expect(readStored('fasting', true)).toBe(true);
    writeStored('fasting', 'yes');
    expect(readStored('fasting', true)).toBe(true);
  });

  it('survives unavailable storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => writeStored('unit', 'mgdl')).not.toThrow();
    expect(readStored('unit', 'mmol')).toBe('mmol');
  });

  it('clears only its own keys', () => {
    writeStored('unit', 'mgdl');
    localStorage.setItem('other', 'keep');
    clearStored();
    expect(localStorage.getItem('cholesterolis.unit')).toBeNull();
    expect(localStorage.getItem('other')).toBe('keep');
  });
});
