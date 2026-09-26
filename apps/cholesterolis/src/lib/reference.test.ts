import { describe, expect, it } from 'vitest';
import { evaluate, referenceText } from './reference';

const fasting = { fasting: true, sex: '' as const };

describe('evaluate', () => {
  it('grades total cholesterol', () => {
    expect(evaluate('tc', 4.9, fasting)).toBe('ok');
    expect(evaluate('tc', 5.5, fasting)).toBe('borderline');
    expect(evaluate('tc', 6.5, fasting)).toBe('high');
  });

  it('grades LDL', () => {
    expect(evaluate('ldl', 2.9, fasting)).toBe('ok');
    expect(evaluate('ldl', 3.5, fasting)).toBe('borderline');
    expect(evaluate('ldl', 5.0, fasting)).toBe('high');
  });

  it('uses sex-specific HDL limits', () => {
    expect(evaluate('hdl', 1.1, { fasting: true, sex: 'male' })).toBe('ok');
    expect(evaluate('hdl', 1.1, { fasting: true, sex: 'female' })).toBe('low');
    expect(evaluate('hdl', 0.9, fasting)).toBe('low');
  });

  it('uses a higher triglyceride limit for non-fasting samples', () => {
    expect(evaluate('tg', 1.8, { fasting: true, sex: '' })).toBe('borderline');
    expect(evaluate('tg', 1.8, { fasting: false, sex: '' })).toBe('ok');
    expect(evaluate('tg', 3, { fasting: false, sex: '' })).toBe('high');
  });
});

describe('referenceText', () => {
  it('shows the unit and context', () => {
    expect(referenceText('tc', fasting, 'mmol')).toBe('< 5,00 mmol/l');
    expect(referenceText('tg', { fasting: false, sex: '' }, 'mmol')).toContain('< 2,00 mmol/l pavalgius');
    expect(referenceText('hdl', { fasting: true, sex: 'female' }, 'mgdl')).toBe('> 46 mg/dl moterims');
  });
});
