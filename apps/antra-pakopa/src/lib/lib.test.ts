import { describe, expect, it } from 'vitest';
import { DEFAULT_ASSUMPTIONS, best, compare, estimateToSodra, grow, sodraPension, yearsToPension } from './calc';
import type { Inputs } from './calc';
import { advise } from './advice';
import { date, euro, parseNumber } from './format';
import { windowStatus } from './law';

const BASE: Inputs = {
  age: 40,
  payout: 10_000,
  toSodra: 5_000,
  salary: 2_000,
  rejoin: true,
  oldThirdPillar: false,
  year: 2026,
};

const byId = (input: Inputs, a = DEFAULT_ASSUMPTIONS) =>
  Object.fromEntries(compare(input, a).map((o) => [o.id, o])) as Record<string, ReturnType<typeof compare>[number]>;

describe('format', () => {
  it('parses Lithuanian number input', () => {
    expect(parseNumber('12 000,5')).toBe(12000.5);
    expect(parseNumber('0.45')).toBe(0.45);
    expect(parseNumber('')).toBeUndefined();
    expect(parseNumber('abc')).toBeUndefined();
  });

  it('formats euros', () => {
    expect(euro(1234567.4)).toBe('1 234 567 €');
    expect(euro(-950)).toBe('−950 €');
    expect(euro(33.49, 2)).toBe('33,49 €');
  });
});

describe('window', () => {
  it('matches the published third quarter dates of 2026', () => {
    const s = windowStatus(new Date(2026, 8, 20));
    expect(s.state).toBe('open');
    if (s.state !== 'open') return;
    expect(date(s.applyBy)).toBe('2026-09-30');
    expect(date(s.paidBy)).toBe('2026-10-14');
    expect(s.lastBatch).toBe(false);
  });

  it('skips New Year when counting working days', () => {
    const s = windowStatus(new Date(2026, 10, 9));
    if (s.state !== 'open') throw new Error('closed');
    expect(date(s.applyBy)).toBe('2026-12-31');
    expect(date(s.paidBy)).toBe('2027-01-15');
    expect(s.daysLeft).toBe(418);
  });

  it('marks the last quarter and closes afterwards', () => {
    const last = windowStatus(new Date(2027, 11, 31));
    expect(last).toMatchObject({ state: 'open', daysLeft: 1, lastBatch: true });
    expect(windowStatus(new Date(2028, 0, 1)).state).toBe('closed');
    expect(windowStatus(new Date(2025, 11, 31)).state).toBe('before');
  });
});

describe('calc', () => {
  it('counts whole years to pension age', () => {
    expect(yearsToPension(40)).toBe(25);
    expect(yearsToPension(64.5)).toBe(1);
    expect(yearsToPension(70)).toBe(0);
  });

  it('compounds a lump sum and reports fees', () => {
    const g = grow(1000, 0, 5, 0.5, 2);
    expect(g.balance).toBeCloseTo(1000 * 1.045 ** 2, 6);
    expect(g.fees).toBeCloseTo(1000 * 1.05 ** 2 - 1000 * 1.045 ** 2, 6);
  });

  it('converts returned money to a monthly Sodra pension', () => {
    expect(sodraPension(2419.43)).toBeCloseTo(7.16, 6);
  });

  it('estimates the state part from the payout and the salary', () => {
    // Average earner: the state adds half of what the person pays; 70 % of the payout is own contributions.
    expect(estimateToSodra(10_000, 2312.15)).toBe(3500);
    expect(estimateToSodra(10_000, 0)).toBe(3500);
    // Twice the average wage: the incentive is half as large next to the own contributions.
    expect(estimateToSodra(10_000, 4624.3)).toBe(1800);
    expect(estimateToSodra(0, 2000)).toBe(0);
  });

  it('with nothing left to grow, all options return the payout', () => {
    const o = byId({ ...BASE, age: 65, toSodra: 0 });
    expect(o.pillar2.total).toBe(10_000);
    expect(o.etf.total).toBe(10_000);
    expect(o.pillar3.total).toBe(10_000);
  });

  it('taxes only the gain of the ETF and leaves a long third pillar contract untaxed', () => {
    const o = byId({ ...BASE, salary: 0, toSodra: 0 });
    const etf = 10_000 * 1.048 ** 25;
    expect(o.etf.balance).toBeCloseTo(etf, 4);
    expect(o.etf.tax).toBeCloseTo((etf - 10_000) * 0.15, 4);
    expect(o.pillar3.tax).toBe(0);
    expect(o.pillar3.total).toBeCloseTo(10_000 * 1.0445 ** 25, 4);
  });

  it('taxes a third pillar contract shorter than five years', () => {
    const o = byId({ ...BASE, age: 62, salary: 0, toSodra: 0 });
    expect(o.pillar3.tax).toBeGreaterThan(0);
  });

  it('rejoining keeps the state incentive on new contributions', () => {
    const rejoin = byId(BASE);
    const follow = byId({ ...BASE, rejoin: false });
    expect(rejoin.etf.stateIncentive).toBeCloseTo(33.49 * 12 * 25, 6);
    expect(follow.etf.stateIncentive).toBe(0);
    expect(rejoin.etf.pillar2Balance).toBeGreaterThan(0);
    expect(follow.etf.pillar2Balance).toBe(0);
    expect(rejoin.etf.total).toBeGreaterThan(follow.etf.total);
    // The person's own money is the same either way.
    expect(rejoin.etf.paidIn).toBe(follow.etf.paidIn);
    expect(rejoin.pillar2.paidIn).toBe(rejoin.etf.paidIn);
  });

  it('without a salary there is no incentive anywhere', () => {
    const o = byId({ ...BASE, salary: 0 });
    expect(o.pillar2.stateIncentive).toBe(0);
    expect(o.etf.pillar2Balance).toBe(0);
  });

  it('gives relief only to old third pillar contracts and only until 2034', () => {
    expect(byId(BASE).pillar3.relief).toBe(0);
    // Rejoining: only this year's transfer goes to the third pillar.
    expect(byId({ ...BASE, oldThirdPillar: true }).pillar3.relief).toBe(300);
    // Contributions of 720 a year for 2026-2034, the first year capped at 1500.
    const follow = byId({ ...BASE, oldThirdPillar: true, rejoin: false });
    expect(follow.pillar3.relief).toBeCloseTo(300 + 8 * 720 * 0.2, 6);
    expect(follow.etf.relief).toBe(0);
  });

  it('picks the option with the largest total', () => {
    const outcomes = compare(BASE, DEFAULT_ASSUMPTIONS);
    const top = best(outcomes);
    expect(outcomes.every((o) => o.total <= top.total)).toBe(true);
  });
});

describe('advice', () => {
  const open = windowStatus(new Date(2026, 10, 9));
  const ids = (input: Inputs, status = open) => {
    const a = advise(input, compare(input, DEFAULT_ASSUMPTIONS), status);
    return { move: a.move.map((r) => r.id), stay: a.stay.map((r) => r.id) };
  };

  it('tells a young saver about the lock-up, the annuity and rejoining', () => {
    const a = ids({ ...BASE, age: 30 });
    expect(a.move).toEqual(expect.arrayContaining(['window', 'locked', 'annuity', 'rejoin', 'rules']));
    expect(a.stay).toEqual(expect.arrayContaining(['tax', 'sodra', 'fees', 'partial', 'discipline']));
    expect(a.stay).not.toContain('incentive');
  });

  it('tells someone near pension age about the five-year rule instead', () => {
    const a = ids({ ...BASE, age: 62, payout: 3000, toSodra: 0, salary: 0 });
    expect(a.move).toContain('near');
    expect(a.move).not.toContain('locked');
    expect(a.move).not.toContain('annuity');
    expect(a.stay).not.toContain('sodra');
  });

  it('counts the lost incentive against moving when not rejoining', () => {
    const a = ids({ ...BASE, rejoin: false });
    expect(a.stay).toContain('incentive');
    expect(a.move).not.toContain('rejoin');
  });

  it('drops the deadline once the window is closed', () => {
    expect(ids(BASE, windowStatus(new Date(2028, 5, 1))).move).not.toContain('window');
  });
});
