import { describe, expect, it } from 'vitest';
import { formatTime } from './format';

describe('formatTime', () => {
  it('formats seconds as M:SS', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(754)).toBe('12:34');
  });
});
