import { describe, expect, it } from 'vitest';
import {
  THIRD_STOPS,
  blurDiameter,
  depthOfField,
  fullFrameEquivalent,
  horizontalFov,
  nearestStopIndex,
} from './optics';

describe('depthOfField', () => {
  it('matches the thin-lens formulas for 50 mm f/3.5 at 5 m on full frame', () => {
    const dof = depthOfField({ focal: 50, fNumber: 3.5, coc: 0.03 }, 5)!;
    // Dn = s·f² / (f² + N·c·(s − f)), Df = s·f² / (f² − N·c·(s − f))
    expect(dof.near).toBeCloseTo((5000 * 2500) / (2500 + 3.5 * 0.03 * 4950) / 1000, 6);
    expect(dof.far).toBeCloseTo((5000 * 2500) / (2500 - 3.5 * 0.03 * 4950) / 1000, 6);
    expect(dof.near).toBeCloseTo(4.139, 3);
    expect(dof.far).toBeCloseTo(6.312, 3);
    expect(dof.depth).toBeCloseTo(dof.far - dof.near, 9);
    expect(dof.hyperfocal).toBeCloseTo(23.86, 2);
  });

  it('reaches infinity beyond the hyperfocal distance', () => {
    const lens = { focal: 24, fNumber: 11, coc: 0.03 };
    const { hyperfocal } = depthOfField(lens, 1)!;
    const dof = depthOfField(lens, hyperfocal + 0.1)!;
    expect(dof.far).toBe(Infinity);
    expect(dof.depth).toBe(Infinity);
    // Focused at the hyperfocal distance, everything from half of it is sharp.
    expect(depthOfField(lens, hyperfocal - 1e-9)!.near).toBeCloseTo(hyperfocal / 2, 2);
  });

  it('rejects subjects closer than the focal length and invalid lenses', () => {
    expect(depthOfField({ focal: 50, fNumber: 2, coc: 0.03 }, 0.04)).toBeUndefined();
    expect(depthOfField({ focal: 50, fNumber: 0, coc: 0.03 }, 5)).toBeUndefined();
    expect(depthOfField({ focal: 50, fNumber: 2, coc: 0.03 }, -1)).toBeUndefined();
  });

  it('gives the same depth of field for equivalent settings on different sensors', () => {
    const ff = depthOfField({ focal: 50, fNumber: 4, coc: 0.03 }, 3)!;
    const m43 = depthOfField({ focal: 25, fNumber: 2, coc: 0.015 }, 3)!;
    expect(m43.near).toBeCloseTo(ff.near, 2);
    expect(m43.far).toBeCloseTo(ff.far, 2);
  });
});

describe('blurDiameter', () => {
  const lens = { focal: 50, fNumber: 2 };

  it('is zero at the focus distance and grows away from it', () => {
    expect(blurDiameter(lens, 5, 5)).toBe(0);
    expect(blurDiameter(lens, 5, 10)).toBeGreaterThan(blurDiameter(lens, 5, 7));
    expect(blurDiameter(lens, 5, 2)).toBeGreaterThan(blurDiameter(lens, 5, 4));
  });

  it('equals the circle of confusion at the depth-of-field limits', () => {
    const dof = depthOfField({ ...lens, coc: 0.03 }, 5)!;
    expect(blurDiameter(lens, 5, dof.near)).toBeCloseTo(0.03, 6);
    expect(blurDiameter(lens, 5, dof.far)).toBeCloseTo(0.03, 6);
  });

  it('is finite for a point at infinity', () => {
    // Aperture (25 mm) times magnification (50 / 4950).
    expect(blurDiameter(lens, 5, Infinity)).toBeCloseTo((25 * 50) / 4950, 9);
  });
});

describe('field of view and equivalence', () => {
  it('gives about 39.6° for 50 mm on full frame', () => {
    expect((horizontalFov(50, 1) * 180) / Math.PI).toBeCloseTo(39.6, 1);
  });

  it('matches field of view for equivalent focal lengths', () => {
    expect(horizontalFov(25, 2)).toBeCloseTo(horizontalFov(50, 1), 9);
  });

  it('multiplies focal length and f-number by the crop factor', () => {
    expect(fullFrameEquivalent(25, 1.8, 2)).toEqual({ focal: 50, fNumber: 3.6 });
  });
});

describe('third stops', () => {
  it('snaps to the closest marked stop', () => {
    expect(THIRD_STOPS[nearestStopIndex(5.5)]).toBe(5.6);
    expect(THIRD_STOPS[nearestStopIndex(2.4)]).toBe(2.5);
    expect(THIRD_STOPS[nearestStopIndex(100)]).toBe(32);
    expect(THIRD_STOPS[nearestStopIndex(0.1)]).toBe(0.7);
  });
});
