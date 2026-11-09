// Figures and dates of the second pension pillar reform in force from 2026-01-01.
// Sources are listed in SOURCES at the bottom; the euro figures are the 2026 ones
// and change every year.

/** Old-age pension age for both men and women from 2026. */
export const PENSION_AGE = 65;

/** A participant's own contribution: 3 % of gross salary. */
export const OWN_CONTRIBUTION_RATE = 0.03;

/** State incentive in 2026: 1.5 % of the average wage of the year before last, per month. */
export const STATE_INCENTIVE_MONTHLY = 33.49;

/** Average gross monthly wage the 2026 figures are based on. */
export const AVERAGE_WAGE = 2312.15;
/** State incentive rate: 1.5 % of the average wage. */
export const STATE_INCENTIVE_RATE = 0.015;

/** Legal cap of the asset management fee in second pillar life-cycle funds. */
export const PILLAR2_FEE_CAP = 0.5;

/** Above this balance an annuity must be bought at pension age (2026). */
export const ANNUITY_MIN = 16_785;
/** The part of the balance above this may again be taken as a lump sum (2026). */
export const ANNUITY_MAX = 83_926;

/** Fee Sodra takes from the one-time 25 % withdrawal made before pension age. */
export const EARLY_WITHDRAWAL_FEE = 0.03;

/** Price of one Sodra pension unit in 2026: 2312.15 EUR x 12 x 8.72 %. */
export const SODRA_UNIT_COST = 2419.43;
/** What one pension unit adds to the monthly pension in 2026. */
export const SODRA_UNIT_VALUE = 7.16;
/** Years a pension is paid on average, used to put a value on the extra Sodra pension. */
export const PENSION_YEARS = 20;

/** Third pillar contracts signed before 2025 keep the income tax relief. */
export const RELIEF_CAP = 1500;
export const RELIEF_LAST_YEAR = 2034;
/** Third pillar payouts are tax free after this many years, once within five years of pension age. */
export const PILLAR3_MIN_YEARS = 5;

export const WINDOW_START = new Date(2026, 0, 1);
export const WINDOW_END = new Date(2027, 11, 31);

// Public holidays that can fall within the first ten working days of a quarter.
const HOLIDAYS = ['1-1', '7-6'];

function isWorkingDay(d: Date): boolean {
  const day = d.getDay();
  if (day === 0 || day === 6) return false;
  return !HOLIDAYS.includes(`${d.getMonth() + 1}-${d.getDate()}`);
}

/** The n-th working day counting from `from` (inclusive). */
export function nthWorkingDay(from: Date, n: number): Date {
  const d = new Date(from);
  let left = n;
  for (;;) {
    if (isWorkingDay(d) && --left === 0) return d;
    d.setDate(d.getDate() + 1);
  }
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000);
}

export type WindowStatus =
  | { state: 'before' }
  | { state: 'closed' }
  | {
      state: 'open';
      /** Days left until the window closes, counting today. */
      daysLeft: number;
      /** Last day of the current quarter: requests filed by then are paid in the next batch. */
      applyBy: Date;
      /** The tenth working day of the next quarter. */
      paidBy: Date;
      /** True when this is the last quarterly batch of the window. */
      lastBatch: boolean;
    };

/**
 * Requests to leave are collected per calendar quarter and paid within the first
 * ten working days of the following quarter.
 */
export function windowStatus(today: Date): WindowStatus {
  const t = startOfDay(today);
  if (t < WINDOW_START) return { state: 'before' };
  if (t > WINDOW_END) return { state: 'closed' };
  const quarter = Math.floor(t.getMonth() / 3);
  const nextQuarterStart = new Date(t.getFullYear(), quarter * 3 + 3, 1);
  const applyBy = new Date(nextQuarterStart);
  applyBy.setDate(0);
  return {
    state: 'open',
    daysLeft: daysBetween(t, WINDOW_END) + 1,
    applyBy,
    paidBy: nthWorkingDay(nextQuarterStart, 10),
    lastBatch: applyBy.getTime() === WINDOW_END.getTime(),
  };
}

export interface Source {
  title: string;
  url: string;
}

export const SOURCES: Source[] = [
  {
    title: 'Socialinės apsaugos ir darbo ministerija: II pakopos pensijų kaupime – daugiau lankstumo',
    url: 'https://socmin.lrv.lt/lt/naujienos/ii-pakopos-pensiju-kaupime-daugiau-lankstumo-kas-laukia-nuo-2026-metu-rR5/',
  },
  {
    title: 'Lietuvos bankas: aktuali informacija apie pensijų sistemos pertvarką nuo 2026 m.',
    url: 'https://lb.lt/aktuali-informacija-apie-pensiju-sistemos-pertvarka-nuo-2026-m',
  },
  {
    title: 'LRT: prašymų pasitraukti terminai ir apskaitos vieneto kaina',
    url: 'https://www.lrt.lt/naujienos/verslas/4/3054152/norintieji-atsiimti-antros-pensiju-pakopos-lesas-turetu-suskubti-iki-spalio-14-d',
  },
  {
    title: 'Goindex: 2026 m. reformos klausimai ir atsakymai (anuiteto ribos, 25 % išmoka, mokesčiai)',
    url: 'https://www.goindex.lt/reforma2026/patarimai-ir-naudinga-informacija/',
  },
  {
    title: 'Swedbank: II pensijų pakopos pokyčiai',
    url: 'https://blog.swedbank.lt/en/pension-reform',
  },
  {
    title: 'Lietuvos bankas: III pakopos pensijų fondai',
    url: 'https://www.lb.lt/lt/iii-pakopos-pensiju-fondai',
  },
  {
    title: 'Lietuvos bankas: pensijų fondų veiklos rodikliai ir mokesčiai',
    url: 'https://www.lb.lt/lt/pf-veiklos-rodikliai',
  },
  {
    title: 'VMI: apie investicinę sąskaitą',
    url: 'https://www.vmi.lt/evmi/5552',
  },
  {
    title: 'Luminor: GPM įstatymo pataisos kaupiantiems II ir III pakopoje',
    url: 'https://www.luminor.lt/lt/naujienos/seimas-prieme-gpm-istatymo-pataisas-ka-reikia-zinoti',
  },
];
