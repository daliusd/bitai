import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, clampSetting, sanitizeSettings } from './settings';
import type { Settings } from './settings';

describe('clampSetting', () => {
  it('snaps to the step', () => {
    expect(clampSetting('active', 62)).toBe(60);
    expect(clampSetting('active', 63)).toBe(65);
  });

  it('keeps values within limits', () => {
    expect(clampSetting('intervals', 0)).toBe(1);
    expect(clampSetting('rest', -20)).toBe(5);
    expect(clampSetting('countdown', 9)).toBe(5);
    expect(clampSetting('countdown', -1)).toBe(0);
  });
});

describe('sanitizeSettings', () => {
  it('replaces invalid stored values with defaults and clamps the rest', () => {
    const raw = { intervals: 'x', active: 7, rest: null, countdown: 12 } as unknown as Settings;
    expect(sanitizeSettings(raw)).toEqual({ ...DEFAULT_SETTINGS, active: 5, countdown: 5 });
  });
});
