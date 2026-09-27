import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SENSORS,
  formatPatch,
  lockAll,
  sanitizeSensors,
  snapToThirdStops,
  updateSensor,
} from './sensors';
import type { Sensor } from './sensors';

const unlocked = { lock: false, thirdStops: false };
const locked = { lock: true, thirdStops: false };

describe('updateSensor', () => {
  it('changes only the edited sensor when not locked', () => {
    const next = updateSensor(DEFAULT_SENSORS, 0, { focal: 85 }, unlocked);
    expect(next[0].focal).toBe(85);
    expect(next.slice(1)).toEqual(DEFAULT_SENSORS.slice(1));
  });

  it('keeps the other sensors equivalent when locked', () => {
    const next = updateSensor(DEFAULT_SENSORS, 0, { focal: 60, fNumber: 4 }, locked);
    const m43 = next[2];
    expect(m43.focal).toBe(30);
    expect(m43.fNumber).toBe(2);
    const medium = next[3];
    expect(medium.focal).toBe(120);
    expect(medium.fNumber).toBe(8);
    expect(next[5].focal).toBeCloseTo(8.6, 5); // phone: 60 / 7, rounded to 0.1 mm
  });

  it('snaps followers to third stops when that is on', () => {
    const next = updateSensor(DEFAULT_SENSORS, 0, { fNumber: 4 }, { lock: true, thirdStops: true });
    expect(next[1].fNumber).toBe(2.8); // 4 / 1.5 = 2.67
  });

  it('makes a sensor that changes format equivalent to another enabled one', () => {
    const synced = lockAll(DEFAULT_SENSORS, false);
    const next = updateSensor(synced, 1, formatPatch('m43', synced[1]), locked);
    expect(next[1]).toMatchObject({ format: 'm43', crop: 2, focal: 25, fNumber: 1.8 });
  });

  it('switches to a custom format while keeping crop and CoC', () => {
    expect(formatPatch('custom', DEFAULT_SENSORS[0])).toEqual({ format: 'custom', crop: 1, coc: 0.03 });
  });
});

describe('lockAll', () => {
  it('makes every sensor equivalent to the first enabled one', () => {
    const sensors: Sensor[] = DEFAULT_SENSORS.map((s, i) => ({ ...s, enabled: i !== 0 }));
    const next = lockAll(sensors, false);
    // APS-C 35 mm f/2.2 is the reference now.
    expect(next[1]).toEqual(sensors[1]);
    expect(next[0].focal).toBe(53);
    expect(next[0].fNumber).toBe(3.3);
  });
});

describe('snapToThirdStops', () => {
  it('rounds every f-number to a marked stop', () => {
    const next = snapToThirdStops(DEFAULT_SENSORS.map((s) => ({ ...s, fNumber: 3.4 })));
    expect(next.every((s) => s.fNumber === 3.5)).toBe(true);
  });
});

describe('sanitizeSensors', () => {
  it('falls back to defaults for garbage', () => {
    expect(sanitizeSensors('nope')).toEqual(DEFAULT_SENSORS);
    expect(sanitizeSensors([null, { focal: -5, fNumber: 'x', position: -1, format: 'bogus' }])).toEqual(DEFAULT_SENSORS);
  });

  it('keeps valid stored values', () => {
    const stored = [{ ...DEFAULT_SENSORS[0], focal: 85, position: 2 }];
    const next = sanitizeSensors(stored);
    expect(next).toHaveLength(6);
    expect(next[0]).toMatchObject({ focal: 85, position: 2 });
  });
});
