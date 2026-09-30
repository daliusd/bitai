import { describe, expect, it } from 'vitest';
import { bmi, bmiCategory, energyNeed, maxWeightLoss } from './body';

describe('body', () => {
  it('computes BMI', () => {
    expect(bmi({ weight: 80, height: 180, sex: '' })).toBeCloseTo(24.69, 2);
    expect(bmi({ weight: 80, sex: '' })).toBeUndefined();
    expect(bmiCategory(27)).toBe('antsvoris');
  });

  it('estimates energy need, falling back to 2000 kcal', () => {
    expect(energyNeed({ sex: '' })).toBe(2000);
    // Mifflin–St Jeor male 80 kg, 180 cm, 40 y: 1730 kcal × 1.4 = 2422 → 2400
    expect(energyNeed({ weight: 80, height: 180, age: 40, sex: 'male' })).toBe(2400);
    // female: 1564 × 1.4 = 2190 → 2200
    expect(energyNeed({ weight: 80, height: 180, age: 40, sex: 'female' })).toBe(2200);
  });

  it('limits weight loss so BMI stays at least 18.5', () => {
    expect(maxWeightLoss({ sex: '' })).toBe(20);
    expect(maxWeightLoss({ weight: 120, height: 180, sex: '' })).toBe(20);
    // 180 cm → BMI 18.5 at 59.9 kg
    expect(maxWeightLoss({ weight: 65, height: 180, sex: '' })).toBe(5);
    expect(maxWeightLoss({ weight: 55, height: 180, sex: '' })).toBe(0);
  });
});
