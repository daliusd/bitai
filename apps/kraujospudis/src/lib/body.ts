import type { Body } from './types';

export const MAX_WEIGHT_LOSS_KG = 20;
const MIN_HEALTHY_BMI = 18.5;

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

/** Largest weight loss offered by the slider: never below a BMI of 18.5. */
export function maxWeightLoss(body: Body): number {
  const { weight, height } = body;
  if (!weight || !height) return MAX_WEIGHT_LOSS_KG;
  const m = height / 100;
  const room = Math.floor(weight - MIN_HEALTHY_BMI * m * m);
  return Math.max(0, Math.min(MAX_WEIGHT_LOSS_KG, room));
}
