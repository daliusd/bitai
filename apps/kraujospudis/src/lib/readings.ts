import type { Bp } from './types';
import { parseNumber } from './units';

export interface ReadingRaw {
  sys: string;
  dia: string;
}

/** Plausible measurement limits (mmHg); anything outside is almost certainly a typo. */
export const SYS_RANGE = [60, 260] as const;
export const DIA_RANGE = [30, 160] as const;

export type ReadingProblem = 'range' | 'order';

export interface ParsedReading {
  bp?: Bp;
  problem?: ReadingProblem;
}

export function parseReading(raw: ReadingRaw): ParsedReading {
  const sys = parseNumber(raw.sys);
  const dia = parseNumber(raw.dia);
  if (sys === undefined || dia === undefined) return {};
  if (sys < SYS_RANGE[0] || sys > SYS_RANGE[1] || dia < DIA_RANGE[0] || dia > DIA_RANGE[1]) {
    return { problem: 'range' };
  }
  if (dia >= sys) return { problem: 'order' };
  return { bp: { sys, dia } };
}

export interface Summary {
  /** Average of the readings used. */
  average: Bp;
  /** Number of valid readings entered. */
  count: number;
  /** Number of readings averaged (the first is dropped when there are three or more). */
  used: number;
  droppedFirst: boolean;
  /** Highest minus lowest systolic value among valid readings. */
  sysSpread: number;
}

/**
 * The first reading is usually the highest. ESC 2024 and ESH 2021 recommend taking
 * several readings and averaging the later ones, so with three or more readings the
 * first is left out.
 */
export function summarize(readings: Bp[]): Summary | undefined {
  if (readings.length === 0) return undefined;
  const droppedFirst = readings.length >= 3;
  const used = droppedFirst ? readings.slice(1) : readings;
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const sys = readings.map((r) => r.sys);
  return {
    average: { sys: mean(used.map((r) => r.sys)), dia: mean(used.map((r) => r.dia)) },
    count: readings.length,
    used: used.length,
    droppedFirst,
    sysSpread: Math.max(...sys) - Math.min(...sys),
  };
}
