import {
  AVERAGE_WAGE,
  OWN_CONTRIBUTION_RATE,
  PENSION_AGE,
  PENSION_YEARS,
  PILLAR3_MIN_YEARS,
  RELIEF_CAP,
  RELIEF_LAST_YEAR,
  SODRA_UNIT_COST,
  SODRA_UNIT_VALUE,
  STATE_INCENTIVE_MONTHLY,
  STATE_INCENTIVE_RATE,
} from './law';

export interface Inputs {
  age: number;
  /** What the pension company would pay out now: own contributions with the investment result. */
  payout: number;
  /** State and Sodra contributions that would go back to Sodra. */
  toSodra: number;
  /** Gross monthly salary; 0 when no further contributions are planned. */
  salary: number;
  /** Has a third pillar contract signed before 2025, which keeps the income tax relief. */
  oldThirdPillar: boolean;
  /**
   * After leaving, start the second pillar again from zero, so that new contributions
   * keep earning the state incentive. Otherwise they follow the withdrawn money.
   */
  rejoin: boolean;
  /** Calendar year the comparison starts in. */
  year: number;
}

/** All rates in percent. */
export interface Assumptions {
  grossReturn: number;
  feeII: number;
  feeIII: number;
  feeETF: number;
  /** Income tax on the gain taken out of an investment account. */
  gainsTax: number;
  /** Income tax rate the third pillar relief is refunded at. */
  reliefRate: number;
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  grossReturn: 5,
  feeII: 0.45,
  feeIII: 0.55,
  feeETF: 0.2,
  gainsTax: 15,
  reliefRate: 20,
};

export type OptionId = 'pillar2' | 'pillar3' | 'etf';

export interface Outcome {
  id: OptionId;
  /** Balance at pension age before tax, in all places together. */
  balance: number;
  /** The part of the balance that sits in the second pillar. */
  pillar2Balance: number;
  /** The person's own money put in: today's payout plus later contributions. */
  paidIn: number;
  /** State incentive received along the way (second pillar only). */
  stateIncentive: number;
  /** Fees paid to the fund over the whole period, roughly. */
  fees: number;
  tax: number;
  /** Income tax refunded on third pillar contributions. */
  relief: number;
  /** Extra monthly Sodra pension bought with the money returned to Sodra. */
  sodraMonthly: number;
  /** That extra pension over PENSION_YEARS years. */
  sodraValue: number;
  /** Everything together: balance - tax + relief + sodraValue. */
  total: number;
}

export function yearsToPension(age: number): number {
  return Math.max(0, PENSION_AGE - Math.floor(age));
}

interface Growth {
  balance: number;
  fees: number;
}

/**
 * Grows `start` for `years` years, adding `annual` spread evenly over each year.
 * The fee is taken from the assets, as pension funds and ETFs do.
 */
export function grow(start: number, annual: number, grossPct: number, feePct: number, years: number): Growth {
  const net = (grossPct - feePct) / 100;
  const noFee = grossPct / 100;
  let balance = start;
  let untouched = start;
  for (let y = 0; y < years; y++) {
    balance = balance * (1 + net) + annual * (1 + net / 2);
    untouched = untouched * (1 + noFee) + annual * (1 + noFee / 2);
  }
  return { balance, fees: untouched - balance };
}

/** Share of the payout assumed to be the person's own contributions; the rest is investment result. */
const OWN_SHARE_OF_PAYOUT = 0.7;

/**
 * A rough guess of the state's part when the person does not know it. Since 2019 the
 * state adds 1.5 % of the average wage to the person's 3 % of their own salary, so
 * the two stand in the ratio 0.5 x average wage / salary. Earlier Sodra transfers
 * (2004-2018) are not covered: for long-time participants the real figure is higher.
 */
export function estimateToSodra(payout: number, salary: number): number {
  const wage = salary > 0 ? salary : AVERAGE_WAGE;
  const ratio = (STATE_INCENTIVE_RATE * AVERAGE_WAGE) / (OWN_CONTRIBUTION_RATE * wage);
  return Math.round((payout * OWN_SHARE_OF_PAYOUT * ratio) / 100) * 100;
}

export function sodraPension(toSodra: number): number {
  return (toSodra / SODRA_UNIT_COST) * SODRA_UNIT_VALUE;
}

export function compare(input: Inputs, a: Assumptions): Outcome[] {
  const years = yearsToPension(input.age);
  const own = input.salary * 12 * OWN_CONTRIBUTION_RATE;
  const incentive = own > 0 ? STATE_INCENTIVE_MONTHLY * 12 : 0;
  const paidIn = input.payout + own * years;
  const sodraMonthly = sodraPension(input.toSodra);
  const sodraValue = sodraMonthly * 12 * PENSION_YEARS;

  // Staying: the whole balance keeps growing and the state adds its incentive.
  const stay = grow(input.payout + input.toSodra, own + incentive, a.grossReturn, a.feeII, years);
  const pillar2: Outcome = {
    id: 'pillar2',
    balance: stay.balance,
    pillar2Balance: stay.balance,
    paidIn,
    stateIncentive: incentive * years,
    fees: stay.fees,
    tax: 0,
    relief: 0,
    sodraMonthly: 0,
    sodraValue: 0,
    total: stay.balance,
  };

  // Leaving and joining again: only new contributions, with the incentive, in the second pillar.
  const fresh = input.rejoin ? grow(0, own + incentive, a.grossReturn, a.feeII, years) : { balance: 0, fees: 0 };
  const movedAnnual = input.rejoin ? 0 : own;
  const movedPaidIn = input.payout + movedAnnual * years;

  const moved = (id: OptionId, fee: number, taxed: boolean, relief: number): Outcome => {
    const g = grow(input.payout, movedAnnual, a.grossReturn, fee, years);
    const tax = taxed ? Math.max(0, g.balance - movedPaidIn) * (a.gainsTax / 100) : 0;
    const balance = g.balance + fresh.balance;
    return {
      id,
      balance,
      pillar2Balance: fresh.balance,
      paidIn,
      stateIncentive: input.rejoin ? incentive * years : 0,
      fees: g.fees + fresh.fees,
      tax,
      relief,
      sodraMonthly,
      sodraValue,
      total: balance - tax + relief + sodraValue,
    };
  };

  let relief = 0;
  if (input.oldThirdPillar) {
    for (let y = 0; y < years && input.year + y <= RELIEF_LAST_YEAR; y++) {
      const contributed = movedAnnual + (y === 0 ? input.payout : 0);
      relief += Math.min(RELIEF_CAP, contributed) * (a.reliefRate / 100);
    }
  }

  return [
    pillar2,
    // Third pillar payouts are tax free once the contract is five years old.
    moved('pillar3', a.feeIII, years < PILLAR3_MIN_YEARS, relief),
    moved('etf', a.feeETF, true, 0),
  ];
}

export function best(outcomes: Outcome[]): Outcome {
  return outcomes.reduce((top, o) => (o.total > top.total ? o : top));
}
