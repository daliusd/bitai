import { THIRD_STOPS, nearestStopIndex } from './optics';

export type FormatId = 'large' | 'medium' | 'ff' | 'apsc' | 'apsc-canon' | 'm43' | 'one-inch' | 'phone' | 'custom';

export interface Format {
  id: Exclude<FormatId, 'custom'>;
  crop: number;
  /** Circle of confusion in mm: 0.03 mm on full frame, scaled by the crop factor. */
  coc: number;
}

export const FORMATS: Format[] = [
  { id: 'large', crop: 0.28, coc: 0.107 },
  { id: 'medium', crop: 0.5, coc: 0.06 },
  { id: 'ff', crop: 1, coc: 0.03 },
  { id: 'apsc', crop: 1.5, coc: 0.02 },
  { id: 'apsc-canon', crop: 1.6, coc: 0.01875 },
  { id: 'm43', crop: 2, coc: 0.015 },
  { id: 'one-inch', crop: 2.7, coc: 0.011 },
  { id: 'phone', crop: 7, coc: 0.0043 },
];

export interface Sensor {
  format: FormatId;
  crop: number;
  coc: number;
  /** mm */
  focal: number;
  fNumber: number;
  /** How far behind the origin the camera stands, m. */
  position: number;
  enabled: boolean;
}

export const SENSOR_COUNT = 6;

function preset(id: Format['id'], focal: number, fNumber: number, enabled: boolean): Sensor {
  const f = FORMATS.find((x) => x.id === id)!;
  return { format: id, crop: f.crop, coc: f.coc, focal, fNumber, position: 0, enabled };
}

export const DEFAULT_SENSORS: Sensor[] = [
  preset('ff', 50, 3.5, true),
  preset('apsc', 35, 2.2, true),
  preset('m43', 25, 1.8, true),
  preset('medium', 100, 7, true),
  preset('apsc-canon', 31, 2.2, false),
  preset('phone', 7, 1.8, false),
];

export const FOCAL_RANGE = { min: 2, max: 400 };
export const F_NUMBER_RANGE = { min: 0.7, max: 32 };

/** Rounds a focal length to what a user would type: 0.1 mm below 10 mm, whole mm above. */
export function roundFocal(focal: number): number {
  return focal < 10 ? Math.round(focal * 10) / 10 : Math.round(focal);
}

export function roundFNumber(fNumber: number): number {
  return Math.round(fNumber * 10) / 10;
}

/** Normalizes stored sensors: always SENSOR_COUNT entries with sane numbers. */
export function sanitizeSensors(value: unknown): Sensor[] {
  const list = Array.isArray(value) ? value : [];
  return DEFAULT_SENSORS.map((fallback, i) => {
    const s: unknown = list[i];
    if (typeof s !== 'object' || s === null) return fallback;
    const merged = { ...fallback, ...(s as Partial<Sensor>) };
    const positive = (n: unknown, d: number) => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : d);
    return {
      format: FORMATS.some((f) => f.id === merged.format) || merged.format === 'custom' ? merged.format : fallback.format,
      crop: positive(merged.crop, fallback.crop),
      coc: positive(merged.coc, fallback.coc),
      focal: positive(merged.focal, fallback.focal),
      fNumber: positive(merged.fNumber, fallback.fNumber),
      position:
        typeof merged.position === 'number' && Number.isFinite(merged.position) && merged.position >= 0
          ? merged.position
          : 0,
      enabled: typeof merged.enabled === 'boolean' ? merged.enabled : fallback.enabled,
    };
  });
}

/** Settings for `target` that match `source`'s angle of view and depth of field. */
function equivalentTo(source: Sensor, target: Sensor, thirdStops: boolean): Pick<Sensor, 'focal' | 'fNumber'> {
  const ratio = source.crop / target.crop;
  const fNumber = source.fNumber * ratio;
  return {
    focal: roundFocal(source.focal * ratio),
    fNumber: thirdStops ? THIRD_STOPS[nearestStopIndex(fNumber)] : roundFNumber(fNumber),
  };
}

function relock(sensors: Sensor[], source: number, thirdStops: boolean): Sensor[] {
  return sensors.map((s, i) => (i === source ? s : { ...s, ...equivalentTo(sensors[source], s, thirdStops) }));
}

export interface LockOptions {
  lock: boolean;
  thirdStops: boolean;
}

/** Applies a change to sensor `index`; with `lock`, the other sensors follow to stay equivalent. */
export function updateSensor(sensors: Sensor[], index: number, patch: Partial<Sensor>, opts: LockOptions): Sensor[] {
  const next = sensors.map((s, i) => (i === index ? { ...s, ...patch } : s));
  if (!opts.lock) return next;
  if ('focal' in patch || 'fNumber' in patch) return relock(next, index, opts.thirdStops);
  if ('crop' in patch || 'format' in patch || ('enabled' in patch && patch.enabled)) {
    // This sensor changed size (or joined): it adopts settings equivalent to another enabled sensor.
    const reference = next.findIndex((s, i) => i !== index && s.enabled);
    if (reference >= 0) next[index] = { ...next[index], ...equivalentTo(next[reference], next[index], opts.thirdStops) };
  }
  return next;
}

/** When locking is switched on, every sensor is made equivalent to the first enabled one. */
export function lockAll(sensors: Sensor[], thirdStops: boolean): Sensor[] {
  const source = sensors.findIndex((s) => s.enabled);
  return source < 0 ? sensors : relock(sensors, source, thirdStops);
}

/** Selecting a format copies its crop factor and circle of confusion. */
export function formatPatch(id: FormatId, current: Sensor): Partial<Sensor> {
  const f = FORMATS.find((x) => x.id === id);
  return f ? { format: id, crop: f.crop, coc: f.coc } : { format: 'custom', crop: current.crop, coc: current.coc };
}

/** Snaps every f-number to the nearest marked third stop. */
export function snapToThirdStops(sensors: Sensor[]): Sensor[] {
  return sensors.map((s) => ({ ...s, fNumber: THIRD_STOPS[nearestStopIndex(s.fNumber)] }));
}
