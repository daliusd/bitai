import { describe, expect, it } from 'vitest';
import { categoryRange, classify, isolatedType, riskReduction } from './reference';

describe('classify', () => {
  it('uses ESC 2024 office thresholds', () => {
    expect(classify({ sys: 115, dia: 68 }, 'office')).toBe('nonElevated');
    expect(classify({ sys: 125, dia: 68 }, 'office')).toBe('elevated');
    expect(classify({ sys: 115, dia: 75 }, 'office')).toBe('elevated');
    expect(classify({ sys: 138, dia: 88 }, 'office')).toBe('elevated');
    expect(classify({ sys: 140, dia: 80 }, 'office')).toBe('hypertension');
    expect(classify({ sys: 130, dia: 90 }, 'office')).toBe('hypertension');
    expect(classify({ sys: 182, dia: 100 }, 'office')).toBe('severe');
    expect(classify({ sys: 160, dia: 110 }, 'office')).toBe('severe');
  });

  it('uses lower hypertension thresholds at home', () => {
    expect(classify({ sys: 136, dia: 80 }, 'office')).toBe('elevated');
    expect(classify({ sys: 136, dia: 80 }, 'home')).toBe('hypertension');
    expect(classify({ sys: 125, dia: 85 }, 'home')).toBe('hypertension');
  });

  it('recognises low blood pressure', () => {
    expect(classify({ sys: 88, dia: 58 }, 'home')).toBe('low');
    expect(classify({ sys: 100, dia: 58 }, 'home')).toBe('low');
  });
});

describe('isolatedType', () => {
  it('detects isolated systolic and diastolic hypertension', () => {
    expect(isolatedType({ sys: 150, dia: 80 }, 'office')).toBe('systolic');
    expect(isolatedType({ sys: 130, dia: 92 }, 'office')).toBe('diastolic');
    expect(isolatedType({ sys: 150, dia: 95 }, 'office')).toBeUndefined();
  });
});

describe('categoryRange', () => {
  it('describes ranges per setting', () => {
    expect(categoryRange('elevated', 'office')).toBe('120–139 / 70–89 mmHg');
    expect(categoryRange('elevated', 'home')).toBe('120–134 / 70–84 mmHg');
    expect(categoryRange('hypertension', 'home')).toBe('≥ 135 / ≥ 85 mmHg');
  });
});

describe('riskReduction', () => {
  it('gives about 10 % per 5 mmHg systolic', () => {
    expect(riskReduction(5)).toBeCloseTo(0.1);
    expect(riskReduction(10)).toBeCloseTo(0.19);
    expect(riskReduction(0)).toBe(0);
    expect(riskReduction(-3)).toBe(0);
  });
});
