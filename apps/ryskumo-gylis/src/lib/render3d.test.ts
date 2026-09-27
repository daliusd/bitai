import { describe, expect, it } from 'vitest';
import { blurBucket, groupLayers } from './render3d';

describe('blurBucket', () => {
  it('treats blur below a pixel as sharp', () => {
    expect(blurBucket(0)).toBe(0);
    expect(blurBucket(1)).toBe(0);
  });

  it('converts a disc diameter to a Gaussian sigma of d / 4, rounded', () => {
    expect(blurBucket(8)).toBe(2);
    expect(blurBucket(41)).toBe(10.5);
    expect(blurBucket(90)).toBe(23);
    expect(blurBucket(10_000)).toBe(80);
  });
});

describe('groupLayers', () => {
  it('merges neighbours with the same blur and keeps order', () => {
    const poly = (fill: string) => ({ kind: 'poly' as const, points: [], fill });
    const groups = groupLayers([
      { distance: 30, blur: 40, shapes: [poly('a')] },
      { distance: 20, blur: 40.4, shapes: [poly('b')] },
      { distance: 5, blur: 0, shapes: [poly('c')] },
      { distance: 2, blur: 40, shapes: [poly('d')] },
    ]);
    expect(groups.map((g) => [g.sigma, g.shapes.map((s) => (s.kind === 'poly' ? s.fill : ''))])).toEqual([
      [10, ['a', 'b']],
      [0, ['c']],
      [10, ['d']],
    ]);
  });
});
