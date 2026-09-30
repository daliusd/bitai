import type { Body, Lifestyle, Lipids } from './types';
import { bmi, energyNeed, kgAboveBmi } from './body';

/**
 * Change in lipids (mmol/L). `ldlPct` / `tgPct` are relative changes, e.g. -0.08 for −8 %.
 * `tc` is set when a study reports the total cholesterol change directly; otherwise
 * TC changes by LDL + HDL + TG/2.2.
 */
export interface Effect {
  ldl: number;
  hdl: number;
  tg: number;
  ldlPct?: number;
  tgPct?: number;
  tc?: number;
}

/** Absolute change (mmol/L) of every lipid, applying relative changes to the baseline. */
export function resolveEffect(e: Effect, base: Pick<Lipids, 'ldl' | 'tg'>): Lipids {
  const ldl = e.ldl + (e.ldlPct ?? 0) * base.ldl;
  const tg = e.tg + (e.tgPct ?? 0) * base.tg;
  return { ldl, hdl: e.hdl, tg, tc: e.tc ?? ldl + e.hdl + tg / 2.2 };
}

export const NO_EFFECT: Effect = { ldl: 0, hdl: 0, tg: 0 };

export type FatReplacement = 'pufa' | 'mufa' | 'carbs';
export type ActivityTarget = 'none' | '150' | '300';
export type Omega3Dose = 0 | 1 | 2 | 4;

export interface Choices {
  weightKg: number;
  satFatG: number;
  satFatReplacement: FatReplacement;
  sugarG: number;
  fiberG: number;
  sterols: boolean;
  nuts: boolean;
  activity: ActivityTarget;
  quitSmoking: boolean;
  reduceAlcohol: boolean;
  omega3G: Omega3Dose;
  lowCarb: boolean;
}

export const DEFAULT_CHOICES: Choices = {
  weightKg: 0,
  satFatG: 0,
  satFatReplacement: 'pufa',
  sugarG: 0,
  fiberG: 0,
  sterols: false,
  nuts: false,
  activity: 'none',
  quitSmoking: false,
  reduceAlcohol: false,
  omega3G: 0,
  lowCarb: false,
};

export type InterventionId =
  | 'weight'
  | 'satFat'
  | 'sugar'
  | 'fiber'
  | 'sterols'
  | 'nuts'
  | 'activity'
  | 'smoking'
  | 'alcohol'
  | 'omega3'
  | 'lowCarb';

/** Interventions whose LDL effect comes from diet composition (subject to the combined cap). */
const DIET_IDS: InterventionId[] = ['satFat', 'sugar', 'fiber', 'sterols', 'nuts'];

// --- Weight loss: Hasan 2020, 73 RCTs, lifestyle interventions, per kg lost at 6–12 months:
// TG −4.0 mg/dL, LDL −1.28 mg/dL, HDL +0.46 mg/dL. TC is not reported, so it follows from the parts.
// Participants averaged 101.6 kg (BMI 36.3).
export const PER_KG = { ldl: -1.28 / 38.67, hdl: 0.46 / 38.67, tg: -4.0 / 88.57 };

// Below BMI 25: CALERIE (Kraus 2019, Huffman 2022), adults without obesity (BMI 22–28, mean 25.1)
// lost 7.5 kg over 2 years; LDL 2.51 → 2.33, HDL 1.26 → 1.36, TG 1.15 → 0.90 mmol/L.
export const CALERIE_LOSS_KG = 7.5;
export const LEAN_PER_KG = {
  ldl: (2.33 - 2.51) / CALERIE_LOSS_KG,
  hdl: (1.36 - 1.26) / CALERIE_LOSS_KG,
  tg: (0.9 - 1.15) / CALERIE_LOSS_KG,
};

export const OVERWEIGHT_BMI = 25;

export function isLean(bmiValue: number | undefined): boolean {
  return bmiValue !== undefined && bmiValue < OVERWEIGHT_BMI;
}

export interface WeightLossSplit {
  /** Kilograms lost while BMI is still 25 or more (Hasan 2020 rates). */
  overweightKg: number;
  /** Kilograms lost after BMI has dropped below 25 (CALERIE rates). */
  leanKg: number;
}

/** Splits a loss at the point where BMI reaches 25; without weight and height all of it counts as overweight. */
export function splitWeightLoss(kg: number, body: Body): WeightLossSplit {
  const room = kgAboveBmi(body, OVERWEIGHT_BMI);
  if (room === undefined) return { overweightKg: kg, leanKg: 0 };
  const overweightKg = Math.min(kg, room);
  return { overweightKg, leanKg: kg - overweightKg };
}

export function weightEffect(kg: number, body: Body = { sex: '' }): Effect {
  const { overweightKg: o, leanKg: l } = splitWeightLoss(kg, body);
  return {
    ldl: PER_KG.ldl * o + LEAN_PER_KG.ldl * l,
    hdl: PER_KG.hdl * o + LEAN_PER_KG.hdl * l,
    tg: PER_KG.tg * o + LEAN_PER_KG.tg * l,
  };
}

// --- Saturated fat: Mensink 2016 (WHO), per 1 % of energy of SFA replaced.
export const PER_SFA_ENERGY_PCT: Record<FatReplacement, Effect> = {
  pufa: { ldl: -0.055, hdl: -0.005, tg: -0.01 },
  mufa: { ldl: -0.042, hdl: -0.002, tg: -0.004 },
  carbs: { ldl: -0.033, hdl: -0.01, tg: 0.011 },
};

/** Grams of fat → percent of daily energy (9 kcal/g). */
export function gramsToEnergyPct(grams: number, energyKcal: number): number {
  return ((grams * 9) / energyKcal) * 100;
}

export function satFatEffect(grams: number, replacement: FatReplacement, energyKcal: number): Effect {
  const pct = gramsToEnergyPct(grams, energyKcal);
  const per = PER_SFA_ENERGY_PCT[replacement];
  return { ldl: per.ldl * pct, hdl: per.hdl * pct, tg: per.tg * pct };
}

// --- Added sugar: Te Morenga 2014, higher vs lower sugar intake. The trials' contrast is
// taken as ~50 g/day (≈10 % of energy); the effect is scaled linearly. Low certainty.
export const SUGAR_CONTRAST_G = 50;
export const SUGAR_HIGH_VS_LOW = { tc: 0.16, ldl: 0.12, hdl: 0.02, tg: 0.11 };

export function sugarEffect(grams: number): Effect {
  const f = grams / SUGAR_CONTRAST_G;
  return {
    ldl: -SUGAR_HIGH_VS_LOW.ldl * f,
    hdl: -SUGAR_HIGH_VS_LOW.hdl * f,
    tg: -SUGAR_HIGH_VS_LOW.tg * f,
  };
}

// --- Soluble fibre: Brown 1999, ≈ −0.045 mmol/L per gram in the 2–10 g/day range;
// consistent with Whitehead 2014 (≥3 g oat β-glucan → LDL −0.25 mmol/L).
export const PER_FIBER_G_LDL = -0.045;
export const MAX_FIBER_G = 10;

export function fiberEffect(grams: number): Effect {
  return { ldl: PER_FIBER_G_LDL * Math.min(grams, MAX_FIBER_G), hdl: 0, tg: 0 };
}

// --- Plant sterols/stanols, 2 g/day: Ras 2014, LDL −6…12 % over 0.6–3.3 g/day; ~8 % at 2 g.
export const STEROL_LDL_PCT = -0.08;

export function sterolEffect(on: boolean): Effect {
  return on ? { ldl: 0, hdl: 0, tg: 0, ldlPct: STEROL_LDL_PCT } : NO_EFFECT;
}

// --- Nuts, one 28 g serving/day: Del Gobbo 2015, LDL −4.8 mg/dL, TG −2.2 mg/dL.
export const NUTS = { ldl: -4.8 / 38.67, tg: -2.2 / 88.57 };

export function nutsEffect(on: boolean): Effect {
  return on ? { ldl: NUTS.ldl, hdl: 0, tg: NUTS.tg } : NO_EFFECT;
}

// --- Aerobic exercise: Kodama 2007, HDL +0.065 mmol/L on average (≥ ~120 min/week);
// longer sessions add ~0.036 mmol/L per extra 10 min, so 300 min/week is modelled as +0.09.
export const ACTIVITY_HDL: Record<ActivityTarget, number> = { none: 0, '150': 0.065, '300': 0.09 };

export function activityEffect(target: ActivityTarget, current: Lifestyle['activity']): Effect {
  if (current === 'high') return NO_EFFECT;
  const baseline = current === 'medium' ? ACTIVITY_HDL['150'] : 0;
  const hdl = Math.max(0, ACTIVITY_HDL[target] - baseline);
  return { ldl: 0, hdl, tg: 0 };
}

// --- Smoking cessation: Maeda 2003, HDL +0.10 mmol/L.
export const QUIT_SMOKING_HDL = 0.1;

export function smokingEffect(on: boolean, lifestyle: Lifestyle): Effect {
  if (!on || lifestyle.smoking === 'no') return NO_EFFECT;
  return { ldl: 0, hdl: QUIT_SMOKING_HDL, tg: 0 };
}

// --- Alcohol: Rimm 1999, 30 g ethanol/day raises HDL by 3.99 mg/dL and TG by 5.69 mg/dL.
// Stopping regular drinking reverses that; occasional drinking is scaled to a quarter.
export const ALCOHOL_30G = { hdl: 3.99 / 38.67, tg: 5.69 / 88.57 };

export function alcoholEffect(on: boolean, lifestyle: Lifestyle): Effect {
  if (!on || lifestyle.alcohol === 'none') return NO_EFFECT;
  const f = lifestyle.alcohol === 'occasional' ? 0.25 : 1;
  return { ldl: 0, hdl: -ALCOHOL_30G.hdl * f, tg: -ALCOHOL_30G.tg * f };
}

// --- Omega-3 (EPA+DHA): TG falls nearly linearly with dose (Wang 2023, 90 RCTs); the AHA
// advisory (Skulas-Ray 2019) reports 20–30 % at 4 g/day. Modelled as −6 % per gram.
export const OMEGA3_TG_PCT_PER_G = -0.06;

export function omega3Effect(grams: Omega3Dose): Effect {
  return grams === 0 ? NO_EFFECT : { ldl: 0, hdl: 0, tg: 0, tgPct: OMEGA3_TG_PCT_PER_G * grams };
}

// --- Low-carbohydrate diet (< 20 % energy) vs low-fat diet, ≥ 6 months: Mansoor 2016.
export const LOW_CARB = { ldl: 0.16, hdl: 0.14, tg: -0.26 };

// Below BMI 25: Soto-Mota 2024, trials with mean BMI < 25 saw LDL rise by 41 mg/dL (95 % CI 19.6–63.3)
// on a low-carbohydrate diet; at BMI 25–35 it did not change.
export const LOW_CARB_LEAN_LDL = 41 / 38.67;

export function lowCarbEffect(on: boolean, bmiValue?: number): Effect {
  if (!on) return NO_EFFECT;
  return isLean(bmiValue) ? { ...LOW_CARB, ldl: LOW_CARB_LEAN_LDL } : { ...LOW_CARB };
}

export type Applicability = 'available' | 'partial' | 'already';

/** Whether an intervention still makes sense given what the user already does. */
export function applicability(id: InterventionId, lifestyle: Lifestyle): Applicability {
  switch (id) {
    case 'smoking':
      return lifestyle.smoking === 'no' ? 'already' : 'available';
    case 'alcohol':
      if (lifestyle.alcohol === 'none') return 'already';
      return lifestyle.alcohol === 'occasional' ? 'partial' : 'available';
    case 'activity':
      if (lifestyle.activity === 'high') return 'already';
      return lifestyle.activity === 'medium' ? 'partial' : 'available';
    case 'nuts':
      return lifestyle.nuts ? 'already' : 'available';
    case 'sterols':
      return lifestyle.sterols ? 'already' : 'available';
    case 'fiber':
      return lifestyle.oats ? 'already' : 'available';
    case 'omega3':
      return lifestyle.omega3 ? 'already' : 'available';
    default:
      return 'available';
  }
}

export function computeEffects(
  choices: Choices,
  body: Body,
  lifestyle: Lifestyle,
): Record<InterventionId, Effect> {
  const bmiValue = bmi(body);
  const effects: Record<InterventionId, Effect> = {
    weight: weightEffect(choices.weightKg, body),
    satFat: satFatEffect(choices.satFatG, choices.satFatReplacement, energyNeed(body)),
    sugar: sugarEffect(choices.sugarG),
    fiber: fiberEffect(choices.fiberG),
    sterols: sterolEffect(choices.sterols),
    nuts: nutsEffect(choices.nuts),
    activity: activityEffect(choices.activity, lifestyle.activity),
    smoking: smokingEffect(choices.quitSmoking, lifestyle),
    alcohol: alcoholEffect(choices.reduceAlcohol, lifestyle),
    omega3: omega3Effect(choices.omega3G),
    lowCarb: lowCarbEffect(choices.lowCarb, bmiValue),
  };
  for (const id of Object.keys(effects) as InterventionId[]) {
    if (applicability(id, lifestyle) === 'already') effects[id] = NO_EFFECT;
  }
  return effects;
}

/**
 * Combined diet changes are capped at a 30 % LDL reduction: the "portfolio" diet,
 * which combined sterols, fibre, nuts and soy under supervision, reached ~29 %
 * (Jenkins 2003). Effects of separate studies are not simply additive.
 */
export const DIET_LDL_CAP_PCT = 0.3;

export interface Projection {
  lipids: Lipids;
  capped: boolean;
}

export function project(base: Lipids, effects: Record<InterventionId, Effect>): Projection {
  let dietLdl = 0;
  let otherLdl = 0;
  let hdl = 0;
  let tg = 0;
  let tcExtra = 0;
  for (const [id, e] of Object.entries(effects) as [InterventionId, Effect][]) {
    const r = resolveEffect(e, base);
    if (DIET_IDS.includes(id)) dietLdl += r.ldl;
    else otherLdl += r.ldl;
    hdl += r.hdl;
    tg += r.tg;
    // Directly reported TC change beyond what its components explain.
    tcExtra += r.tc - (r.ldl + r.hdl + r.tg / 2.2);
  }
  const cap = -DIET_LDL_CAP_PCT * base.ldl;
  const capped = dietLdl < cap;
  if (capped) dietLdl = cap;

  const newLdl = Math.max(0.5, base.ldl + dietLdl + otherLdl);
  const newHdl = Math.max(0.3, base.hdl + hdl);
  const newTg = Math.max(0.3, base.tg + tg);
  const newTc =
    base.tc + (newLdl - base.ldl) + (newHdl - base.hdl) + (newTg - base.tg) / 2.2 + tcExtra;
  return { lipids: { tc: newTc, ldl: newLdl, hdl: newHdl, tg: newTg }, capped };
}
