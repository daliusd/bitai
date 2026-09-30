import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CHOICES,
  LEAN_PER_KG,
  PER_KG,
  activityEffect,
  alcoholEffect,
  applicability,
  computeEffects,
  fiberEffect,
  gramsToEnergyPct,
  lowCarbEffect,
  omega3Effect,
  resolveEffect,
  project,
  satFatEffect,
  smokingEffect,
  sugarEffect,
  splitWeightLoss,
  weightEffect,
} from './interventions';
import type { Lifestyle, Lipids } from './types';

const unknown: Lifestyle = {
  smoking: 'unknown',
  alcohol: 'unknown',
  activity: 'unknown',
  nuts: false,
  sterols: false,
  oats: false,
  omega3: false,
};
const base: Lipids = { tc: 6.2, ldl: 4.1, hdl: 1.3, tg: 1.8 };

describe('single interventions', () => {
  it('weight loss follows Hasan 2020 per-kg values', () => {
    // LDL −1.28, HDL +0.46, TG −4.0 mg/dL per kg
    const e = weightEffect(10);
    expect(e.ldl).toBeCloseTo((-1.28 * 10) / 38.67);
    expect(e.hdl).toBeCloseTo((0.46 * 10) / 38.67);
    expect(e.tg).toBeCloseTo((-4.0 * 10) / 88.57);
    expect(e.tc).toBeUndefined();
  });

  it('weight loss below BMI 25 follows CALERIE per-kg values', () => {
    // 65 kg, 180 cm: BMI 20.1
    const e = weightEffect(7.5, { weight: 65, height: 180, sex: '' });
    expect(e.ldl).toBeCloseTo(-0.18);
    expect(e.hdl).toBeCloseTo(0.1);
    expect(e.tg).toBeCloseTo(-0.25);
    // Unknown BMI, or a loss that keeps BMI ≥ 25, uses Hasan 2020 throughout
    expect(weightEffect(10, { weight: 120, height: 180, sex: '' })).toEqual(weightEffect(10));
    const lean = computeEffects({ ...DEFAULT_CHOICES, weightKg: 7.5 }, { weight: 65, height: 180, sex: '' }, unknown);
    expect(lean.weight.ldl).toBeCloseTo(-0.18);
  });

  it('switches to CALERIE rates for the kilograms lost below BMI 25', () => {
    // 180 cm: BMI 25 at 81 kg, so from 85 kg the first 4 kg use Hasan and the next 6 kg CALERIE
    const body = { weight: 85, height: 180, sex: '' as const };
    expect(splitWeightLoss(10, body)).toEqual({ overweightKg: expect.closeTo(4), leanKg: expect.closeTo(6) });
    expect(splitWeightLoss(10, { sex: '' })).toEqual({ overweightKg: 10, leanKg: 0 });
    const e = weightEffect(10, body);
    expect(e.ldl).toBeCloseTo(4 * PER_KG.ldl + 6 * LEAN_PER_KG.ldl);
    expect(e.tg).toBeCloseTo(4 * PER_KG.tg + 6 * LEAN_PER_KG.tg);
    expect(Math.abs(e.ldl)).toBeLessThan(Math.abs(weightEffect(10).ldl));
  });

  it('saturated fat converts grams to energy percent', () => {
    expect(gramsToEnergyPct(10, 2000)).toBeCloseTo(4.5);
    const e = satFatEffect(10, 'pufa', 2000);
    expect(e.ldl).toBeCloseTo(-0.055 * 4.5);
    expect(satFatEffect(10, 'carbs', 2000).tg).toBeGreaterThan(0);
  });

  it('sugar scales linearly to the meta-analysis contrast', () => {
    expect(sugarEffect(50).tg).toBeCloseTo(-0.11);
    expect(sugarEffect(25).ldl).toBeCloseTo(-0.06);
  });

  it('soluble fibre is capped at the studied 10 g/day', () => {
    expect(fiberEffect(3).ldl).toBeCloseTo(-0.135);
    expect(fiberEffect(20).ldl).toBeCloseTo(fiberEffect(10).ldl);
  });

  it('exercise effect depends on current activity', () => {
    expect(activityEffect('150', 'low').hdl).toBeCloseTo(0.065);
    expect(activityEffect('300', 'medium').hdl).toBeCloseTo(0.025);
    expect(activityEffect('150', 'medium').hdl).toBe(0);
    expect(activityEffect('300', 'high').hdl).toBe(0);
  });

  it('smoking cessation does nothing for non-smokers', () => {
    expect(smokingEffect(true, unknown).hdl).toBeCloseTo(0.1);
    expect(smokingEffect(true, { ...unknown, smoking: 'no' }).hdl).toBe(0);
  });

  it('alcohol reduction lowers TG and HDL, scaled for occasional drinkers', () => {
    const regular = alcoholEffect(true, { ...unknown, alcohol: 'regular' });
    expect(regular.hdl).toBeCloseTo(-0.103, 3);
    expect(regular.tg).toBeCloseTo(-0.064, 3);
    const occasional = alcoholEffect(true, { ...unknown, alcohol: 'occasional' });
    expect(occasional.tg).toBeCloseTo(regular.tg / 4);
    expect(alcoholEffect(true, { ...unknown, alcohol: 'none' }).tg).toBe(0);
  });
});

describe('triglyceride levers', () => {
  it('omega-3 lowers TG by 6 % per gram of EPA+DHA', () => {
    expect(omega3Effect(0).tgPct).toBeUndefined();
    expect(omega3Effect(4).tgPct).toBeCloseTo(-0.24);
    const r = resolveEffect(omega3Effect(2), base);
    expect(r.tg).toBeCloseTo(-0.216);
    expect(r.tc).toBeCloseTo(-0.216 / 2.2);
  });

  it('low-carb diet lowers TG but raises LDL and HDL', () => {
    expect(lowCarbEffect(true)).toEqual({ ldl: 0.16, hdl: 0.14, tg: -0.26 });
    expect(lowCarbEffect(false).tg).toBe(0);
  });

  it('low-carb raises LDL by ~1 mmol/L below BMI 25 (Soto-Mota 2024)', () => {
    expect(lowCarbEffect(true, 22).ldl).toBeCloseTo(41 / 38.67);
    expect(lowCarbEffect(true, 22).tg).toBeCloseTo(-0.26);
    expect(lowCarbEffect(true, 30).ldl).toBeCloseTo(0.16);
    const lean = computeEffects({ ...DEFAULT_CHOICES, lowCarb: true }, { weight: 65, height: 180, sex: '' }, unknown);
    expect(lean.lowCarb.ldl).toBeCloseTo(1.06, 2);
  });

  it('projects relative TG changes and skips omega-3 for current users', () => {
    const choices = { ...DEFAULT_CHOICES, omega3G: 4 as const };
    expect(project(base, computeEffects(choices, { sex: '' }, unknown)).lipids.tg).toBeCloseTo(1.8 * 0.76);
    expect(project(base, computeEffects(choices, { sex: '' }, { ...unknown, omega3: true })).lipids.tg).toBeCloseTo(1.8);
  });
});

describe('applicability', () => {
  it('marks habits the user already has', () => {
    expect(applicability('smoking', { ...unknown, smoking: 'no' })).toBe('already');
    expect(applicability('smoking', unknown)).toBe('available');
    expect(applicability('alcohol', { ...unknown, alcohol: 'none' })).toBe('already');
    expect(applicability('alcohol', { ...unknown, alcohol: 'occasional' })).toBe('partial');
    expect(applicability('activity', { ...unknown, activity: 'high' })).toBe('already');
    expect(applicability('activity', { ...unknown, activity: 'medium' })).toBe('partial');
    expect(applicability('nuts', { ...unknown, nuts: true })).toBe('already');
    expect(applicability('fiber', { ...unknown, oats: true })).toBe('already');
    expect(applicability('weight', { ...unknown, nuts: true })).toBe('available');
  });

  it('removes effects of habits already in place', () => {
    const effects = computeEffects(
      { ...DEFAULT_CHOICES, nuts: true, quitSmoking: true },
      { sex: '' },
      { ...unknown, nuts: true, smoking: 'no' },
    );
    expect(effects.nuts.ldl).toBe(0);
    expect(effects.smoking.hdl).toBe(0);
  });
});

describe('project', () => {
  it('returns the baseline when nothing is chosen', () => {
    const p = project(base, computeEffects(DEFAULT_CHOICES, { sex: '' }, unknown));
    expect(p.lipids.tc).toBeCloseTo(base.tc);
    expect(p.lipids.ldl).toBeCloseTo(base.ldl);
    expect(p.capped).toBe(false);
  });

  it('applies weight loss, deriving TC from its parts', () => {
    const p = project(base, computeEffects({ ...DEFAULT_CHOICES, weightKg: 20 }, { sex: '' }, unknown));
    expect(p.lipids.tc).toBeCloseTo(5.366);
    expect(p.lipids.ldl).toBeCloseTo(3.438);
    expect(p.lipids.hdl).toBeCloseTo(1.538);
    expect(p.lipids.tg).toBeCloseTo(0.897);
  });

  it('applies relative LDL changes (sterols) to baseline LDL', () => {
    const p = project(base, computeEffects({ ...DEFAULT_CHOICES, sterols: true }, { sex: '' }, unknown));
    expect(p.lipids.ldl).toBeCloseTo(4.1 * 0.92);
    expect(p.lipids.tc).toBeCloseTo(6.2 - 4.1 * 0.08);
  });

  it('caps the combined diet LDL reduction at 30 %', () => {
    const all = {
      ...DEFAULT_CHOICES,
      satFatG: 30,
      sugarG: 50,
      fiberG: 10,
      sterols: true,
      nuts: true,
    };
    const p = project({ ...base, ldl: 3 }, computeEffects(all, { sex: '' }, unknown));
    expect(p.capped).toBe(true);
    expect(p.lipids.ldl).toBeCloseTo(2.1);
  });

  it('does not flag overlap for a single change or independent ones', () => {
    const one = project(base, computeEffects({ ...DEFAULT_CHOICES, weightKg: 5 }, { sex: '' }, unknown));
    expect(one.overlap).toBe(false);
    const independent = project(
      base,
      computeEffects({ ...DEFAULT_CHOICES, weightKg: 5, sterols: true }, { sex: '' }, unknown),
    );
    expect(independent.overlap).toBe(false);
  });

  it('flags overlap when weight loss is combined with diet or activity changes', () => {
    const p = project(
      base,
      computeEffects({ ...DEFAULT_CHOICES, weightKg: 5, activity: '150' }, { sex: '' }, unknown),
    );
    expect(p.overlap).toBe(true);
  });

  it('flags overlap when a low-carb diet is combined with a saturated-fat change', () => {
    const p = project(
      base,
      computeEffects({ ...DEFAULT_CHOICES, lowCarb: true, satFatG: 10 }, { sex: '' }, unknown),
    );
    expect(p.overlap).toBe(true);
  });
});
