export interface Settings {
  intervals: number;
  /** Seconds of work per interval. */
  active: number;
  /** Seconds of rest after each interval. */
  rest: number;
  /** Spoken countdown length in seconds (0 turns it off). */
  countdown: number;
}

export type SettingKey = keyof Settings;

export const DEFAULT_SETTINGS: Settings = {
  intervals: 8,
  active: 60,
  rest: 30,
  countdown: 3,
};

interface Limits {
  min: number;
  max: number;
  step: number;
}

export const LIMITS: Record<SettingKey, Limits> = {
  intervals: { min: 1, max: 99, step: 1 },
  active: { min: 5, max: 59 * 60 + 55, step: 5 },
  rest: { min: 5, max: 59 * 60 + 55, step: 5 },
  // Only 1–5 have recorded voice lines.
  countdown: { min: 0, max: 5, step: 1 },
};

/** Clamps a value to the setting's range and snaps it to its step. */
export function clampSetting(key: SettingKey, value: number): number {
  const { min, max, step } = LIMITS[key];
  const snapped = Math.round(value / step) * step;
  return Math.min(max, Math.max(min, snapped));
}

/** Repairs settings read from storage: anything non-numeric falls back to the default. */
export function sanitizeSettings(raw: Settings): Settings {
  const out = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(DEFAULT_SETTINGS) as SettingKey[]) {
    const v = raw[key];
    if (typeof v === 'number' && Number.isFinite(v)) out[key] = clampSetting(key, v);
  }
  return out;
}
