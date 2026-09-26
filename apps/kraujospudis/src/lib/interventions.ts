import type { Bp, Lifestyle } from './types';

/** Change in blood pressure (mmHg); negative values lower it. */
export type Effect = Bp;

export const NO_EFFECT: Effect = { sys: 0, dia: 0 };

export type ExerciseType = 'none' | 'aerobic' | 'resistance' | 'combined' | 'isometric';

export interface Choices {
  weightKg: number;
  saltG: number;
  saltSubstitute: boolean;
  dash: boolean;
  exercise: ExerciseType;
  reduceAlcohol: boolean;
}

export const DEFAULT_CHOICES: Choices = {
  weightKg: 0,
  saltG: 0,
  saltSubstitute: false,
  dash: false,
  exercise: 'none',
  reduceAlcohol: false,
};

export type InterventionId = 'weight' | 'salt' | 'saltSubstitute' | 'dash' | 'exercise' | 'alcohol';

/** Diet changes whose combined effect is capped (they overlap and are not simply additive). */
const DIET_IDS: InterventionId[] = ['salt', 'saltSubstitute', 'dash'];

const scale = (e: Effect, f: number): Effect => ({ sys: e.sys * f, dia: e.dia * f });

// --- Weight loss: Neter 2003, 25 RCTs: −1.05 / −0.92 mmHg per kg lost.
export const PER_KG: Effect = { sys: -1.05, dia: -0.92 };

export function weightEffect(kg: number): Effect {
  return scale(PER_KG, kg);
}

// --- Salt: He, Li & MacGregor 2013 (Cochrane, BMJ): a median 4.4 g/day less salt lowered
// BP by 5.39/2.82 mmHg in people with hypertension and 2.42/1.00 mmHg with normal BP.
// The effect is linear over this range (Filippini 2021), so it is scaled per gram.
export const SALT_STUDY_G = 4.4;
export const SALT_EFFECT: Record<'hypertensive' | 'normotensive', Effect> = {
  hypertensive: { sys: -5.39, dia: -2.82 },
  normotensive: { sys: -2.42, dia: -1.0 },
};
export const MAX_SALT_G = 6;
/** For people who already limit salt, a smaller further reduction is realistic. */
export const MAX_SALT_G_LOW = 2;

export function saltEffect(grams: number, hypertensive: boolean): Effect {
  const per = SALT_EFFECT[hypertensive ? 'hypertensive' : 'normotensive'];
  return scale(per, grams / SALT_STUDY_G);
}

// --- Potassium-enriched salt substitute: Yin 2022, 19 RCTs: −4.61 / −1.61 mmHg.
export const SALT_SUBSTITUTE: Effect = { sys: -4.61, dia: -1.61 };

export function saltSubstituteEffect(on: boolean): Effect {
  return on ? { ...SALT_SUBSTITUTE } : NO_EFFECT;
}

// --- DASH diet: Filippou 2020, 30 RCTs: −3.2 / −2.5 mmHg, similar with and without hypertension.
export const DASH: Effect = { sys: -3.2, dia: -2.5 };

export function dashEffect(on: boolean): Effect {
  return on ? { ...DASH } : NO_EFFECT;
}

// --- Exercise: Edwards 2023, network meta-analysis of 270 RCTs.
export const EXERCISE: Record<ExerciseType, Effect> = {
  none: NO_EFFECT,
  aerobic: { sys: -4.49, dia: -2.53 },
  resistance: { sys: -4.55, dia: -3.04 },
  combined: { sys: -6.04, dia: -2.54 },
  isometric: { sys: -8.24, dia: -4.0 },
};

/**
 * People who already do regular aerobic exercise have its effect in their readings;
 * only what another type adds beyond aerobic training is counted.
 */
export function exerciseEffect(type: ExerciseType, current: Lifestyle['activity']): Effect {
  const e = EXERCISE[type];
  if (current !== 'regular') return { ...e };
  const base = EXERCISE.aerobic;
  return { sys: Math.min(0, e.sys - base.sys), dia: Math.min(0, e.dia - base.dia) };
}

// --- Alcohol: Roerecke 2017, 36 RCTs. Cutting intake by about half lowered BP by
// 5.50 / 3.97 mmHg in people drinking six or more drinks a day; the effect grows with
// baseline intake and was not significant at two drinks a day or less. For 3–5 drinks
// half of that is assumed.
export const ALCOHOL_HEAVY: Effect = { sys: -5.5, dia: -3.97 };

export function alcoholEffect(on: boolean, lifestyle: Lifestyle): Effect {
  if (!on) return NO_EFFECT;
  switch (lifestyle.alcohol) {
    case 'veryHeavy':
      return { ...ALCOHOL_HEAVY };
    case 'heavy':
    case 'unknown':
      return scale(ALCOHOL_HEAVY, 0.5);
    default:
      return NO_EFFECT;
  }
}

export type Applicability = 'available' | 'partial' | 'already';

/** Whether an intervention still makes sense given what the user already does. */
export function applicability(id: InterventionId, lifestyle: Lifestyle): Applicability {
  switch (id) {
    case 'salt':
      return lifestyle.lowSalt ? 'partial' : 'available';
    case 'saltSubstitute':
      return lifestyle.saltSubstitute ? 'already' : 'available';
    case 'dash':
      return lifestyle.dash ? 'already' : 'available';
    case 'exercise':
      return lifestyle.activity === 'regular' ? 'partial' : 'available';
    case 'alcohol':
      return lifestyle.alcohol === 'none' || lifestyle.alcohol === 'moderate' ? 'already' : 'available';
    default:
      return 'available';
  }
}

export function maxSalt(lifestyle: Lifestyle): number {
  return lifestyle.lowSalt ? MAX_SALT_G_LOW : MAX_SALT_G;
}

export function computeEffects(
  choices: Choices,
  lifestyle: Lifestyle,
  hypertensive: boolean,
): Record<InterventionId, Effect> {
  const effects: Record<InterventionId, Effect> = {
    weight: weightEffect(choices.weightKg),
    salt: saltEffect(Math.min(choices.saltG, maxSalt(lifestyle)), hypertensive),
    saltSubstitute: saltSubstituteEffect(choices.saltSubstitute),
    dash: dashEffect(choices.dash),
    exercise: exerciseEffect(choices.exercise, lifestyle.activity),
    alcohol: alcoholEffect(choices.reduceAlcohol, lifestyle),
  };
  for (const id of Object.keys(effects) as InterventionId[]) {
    if (applicability(id, lifestyle) === 'already') effects[id] = NO_EFFECT;
  }
  return effects;
}

/**
 * Combined diet changes are capped at the DASH-Sodium trial result (Sacks 2001): the DASH
 * diet with low salt lowered systolic BP by 11.5 mmHg in people with hypertension and by
 * 7.1 mmHg in those without, compared with a typical diet high in salt.
 */
export const DIET_SYS_CAP: Record<'hypertensive' | 'normotensive', number> = {
  hypertensive: 11.5,
  normotensive: 7.1,
};

/** Lowest values the projection will show. */
export const FLOOR: Bp = { sys: 90, dia: 55 };

export interface Projection {
  bp: Bp;
  capped: boolean;
}

export function project(base: Bp, effects: Record<InterventionId, Effect>, hypertensive: boolean): Projection {
  let diet: Effect = { sys: 0, dia: 0 };
  let other: Effect = { sys: 0, dia: 0 };
  for (const [id, e] of Object.entries(effects) as [InterventionId, Effect][]) {
    if (DIET_IDS.includes(id)) diet = { sys: diet.sys + e.sys, dia: diet.dia + e.dia };
    else other = { sys: other.sys + e.sys, dia: other.dia + e.dia };
  }
  const cap = DIET_SYS_CAP[hypertensive ? 'hypertensive' : 'normotensive'];
  const capped = -diet.sys > cap;
  // Diastolic is reduced in the same proportion as systolic.
  if (capped) diet = scale(diet, cap / -diet.sys);
  return {
    bp: {
      sys: Math.max(FLOOR.sys, base.sys + diet.sys + other.sys),
      dia: Math.max(FLOOR.dia, base.dia + diet.dia + other.dia),
    },
    capped,
  };
}
