import { describe, expect, it } from 'vitest';
import { bmi, bmiCategory, maxWeightLoss } from './body';

describe('body', () => {
  it('computes BMI', () => {
    expect(bmi({ weight: 80, height: 180 })).toBeCloseTo(24.69, 2);
    expect(bmi({ weight: 80 })).toBeUndefined();
    expect(bmiCategory(27)).toBe('antsvoris');
  });

  it('limits weight loss so BMI stays at least 18.5', () => {
    expect(maxWeightLoss({})).toBe(20);
    expect(maxWeightLoss({ weight: 120, height: 180 })).toBe(20);
    // 180 cm → BMI 18.5 at 59.9 kg
    expect(maxWeightLoss({ weight: 65, height: 180 })).toBe(5);
    expect(maxWeightLoss({ weight: 55, height: 180 })).toBe(0);
  });
});
