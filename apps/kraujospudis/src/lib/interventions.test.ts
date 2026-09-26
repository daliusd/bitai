import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CHOICES,
  alcoholEffect,
  applicability,
  computeEffects,
  exerciseEffect,
  project,
  saltEffect,
  weightEffect,
} from './interventions';
import type { Lifestyle } from './types';

const unknown: Lifestyle = {
  alcohol: 'unknown',
  activity: 'unknown',
  lowSalt: false,
  saltSubstitute: false,
  dash: false,
  medication: false,
};
const base = { sys: 150, dia: 95 };

describe('single interventions', () => {
  it('weight loss follows Neter 2003 per-kg values', () => {
    const e = weightEffect(10);
    expect(e.sys).toBeCloseTo(-10.5);
    expect(e.dia).toBeCloseTo(-9.2);
  });

  it('salt reduction is larger with hypertension and scales per gram', () => {
    expect(saltEffect(4.4, true).sys).toBeCloseTo(-5.39);
    expect(saltEffect(4.4, false).sys).toBeCloseTo(-2.42);
    expect(saltEffect(2.2, true).dia).toBeCloseTo(-1.41);
  });

  it('exercise uses Edwards 2023 and counts only the extra for active people', () => {
    expect(exerciseEffect('isometric', 'low')).toEqual({ sys: -8.24, dia: -4.0 });
    const extra = exerciseEffect('combined', 'regular');
    expect(extra.sys).toBeCloseTo(-1.55);
    expect(extra.dia).toBeCloseTo(-0.01);
    expect(exerciseEffect('aerobic', 'regular')).toEqual({ sys: 0, dia: 0 });
  });

  it('alcohol reduction depends on how much is drunk', () => {
    expect(alcoholEffect(true, { ...unknown, alcohol: 'veryHeavy' })).toEqual({ sys: -5.5, dia: -3.97 });
    expect(alcoholEffect(true, { ...unknown, alcohol: 'heavy' }).sys).toBeCloseTo(-2.75);
    expect(alcoholEffect(true, { ...unknown, alcohol: 'moderate' }).sys).toBe(0);
    expect(alcoholEffect(false, { ...unknown, alcohol: 'veryHeavy' }).sys).toBe(0);
  });
});

describe('applicability', () => {
  it('marks habits the user already has', () => {
    expect(applicability('alcohol', { ...unknown, alcohol: 'none' })).toBe('already');
    expect(applicability('alcohol', { ...unknown, alcohol: 'moderate' })).toBe('already');
    expect(applicability('alcohol', { ...unknown, alcohol: 'heavy' })).toBe('available');
    expect(applicability('dash', { ...unknown, dash: true })).toBe('already');
    expect(applicability('saltSubstitute', { ...unknown, saltSubstitute: true })).toBe('already');
    expect(applicability('salt', { ...unknown, lowSalt: true })).toBe('partial');
    expect(applicability('exercise', { ...unknown, activity: 'regular' })).toBe('partial');
    expect(applicability('weight', unknown)).toBe('available');
  });

  it('removes effects of habits already in place and limits salt for low-salt eaters', () => {
    const effects = computeEffects(
      { ...DEFAULT_CHOICES, dash: true, saltG: 6 },
      { ...unknown, dash: true, lowSalt: true },
      true,
    );
    expect(effects.dash.sys).toBe(0);
    expect(effects.salt.sys).toBeCloseTo(-5.39 * (2 / 4.4));
  });
});

describe('project', () => {
  it('returns the baseline when nothing is chosen', () => {
    const p = project(base, computeEffects(DEFAULT_CHOICES, unknown, true), true);
    expect(p.bp).toEqual(base);
    expect(p.capped).toBe(false);
  });

  it('adds up independent changes', () => {
    const p = project(base, computeEffects({ ...DEFAULT_CHOICES, weightKg: 5, dash: true }, unknown, true), true);
    expect(p.bp.sys).toBeCloseTo(150 - 5.25 - 3.2);
    expect(p.bp.dia).toBeCloseTo(95 - 4.6 - 2.5);
  });

  it('caps combined diet changes at the DASH-Sodium result', () => {
    const all = { ...DEFAULT_CHOICES, saltG: 6, saltSubstitute: true, dash: true };
    const hyper = project(base, computeEffects(all, unknown, true), true);
    expect(hyper.capped).toBe(true);
    expect(hyper.bp.sys).toBeCloseTo(150 - 11.5);
    const normo = project({ sys: 125, dia: 75 }, computeEffects(all, unknown, false), false);
    expect(normo.capped).toBe(true);
    expect(normo.bp.sys).toBeCloseTo(125 - 7.1);
  });

  it('never projects below 90/55', () => {
    const p = project({ sys: 100, dia: 60 }, computeEffects({ ...DEFAULT_CHOICES, weightKg: 20 }, unknown, false), false);
    expect(p.bp).toEqual({ sys: 90, dia: 55 });
  });
});
