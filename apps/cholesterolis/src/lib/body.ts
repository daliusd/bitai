import type { Body } from './types';

export const DEFAULT_ENERGY_KCAL = 2000;
export const MAX_WEIGHT_LOSS_KG = 20;
const MIN_HEALTHY_BMI = 18.5;
/** Physical activity level for a mostly sedentary adult. */
const ACTIVITY_FACTOR = 1.4;

export function bmi(body: Body): number | undefined {
  const { weight, height } = body;
  if (!weight || !height) return undefined;
  const m = height / 100;
  return weight / (m * m);
}

export function bmiCategory(value: number): string {
  if (value < 18.5) return 'per mažas svoris';
  if (value < 25) return 'normalus svoris';
  if (value < 30) return 'antsvoris';
  return 'nutukimas';
}

/**
 * Daily energy need (kcal) using the Mifflin–St Jeor equation with a sedentary
 * activity factor. Falls back to 2000 kcal when data is missing.
 */
export function energyNeed(body: Body): number {
  const { weight, height, age, sex } = body;
  if (!weight || !height || !age) return DEFAULT_ENERGY_KCAL;
  const base = 10 * weight + 6.25 * height - 5 * age;
  const sexTerm = sex === 'male' ? 5 : sex === 'female' ? -161 : -78;
  return Math.round(((base + sexTerm) * ACTIVITY_FACTOR) / 50) * 50;
}

/** Largest weight loss (kg) offered by the slider: never below a BMI of 18.5. */
export function maxWeightLoss(body: Body): number {
  const { weight, height } = body;
  if (!weight || !height) return MAX_WEIGHT_LOSS_KG;
  const m = height / 100;
  const room = Math.floor(weight - MIN_HEALTHY_BMI * m * m);
  return Math.max(0, Math.min(MAX_WEIGHT_LOSS_KG, room));
}
