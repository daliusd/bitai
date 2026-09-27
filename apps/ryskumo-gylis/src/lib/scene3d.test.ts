import { describe, expect, it } from 'vitest';
import { COLORS, buildScene } from './scene3d';
import type { ViewParams } from './scene3d';

const label = (m: number) => `${m} m`;
const base: ViewParams = { focal: 50, fNumber: 2, crop: 1, coc: 0.03, position: 0, focus: 5, size: 0.3, width: 900 };

function subjectLayer(view: NonNullable<ReturnType<typeof buildScene>>) {
  return view.layers.find((l) => l.shapes.some((s) => s.kind === 'sphere' && s.color === COLORS.subject))!;
}

function ballLayer(view: NonNullable<ReturnType<typeof buildScene>>, color: string) {
  return view.layers.find((l) => l.shapes.some((s) => s.kind === 'sphere' && s.color === color))!;
}

describe('buildScene', () => {
  it('keeps the focused subject sharp and centred', () => {
    const view = buildScene(base, label)!;
    expect(view.height).toBe(600);
    const layer = subjectLayer(view);
    expect(layer.blur).toBe(0);
    const sphere = layer.shapes.find((s) => s.kind === 'sphere')!;
    expect(sphere).toMatchObject({ x: 450 });
    if (sphere.kind === 'sphere') expect(sphere.y).toBeCloseTo(300, 6);
  });

  it('blurs objects in front of and behind the subject', () => {
    const view = buildScene(base, label)!;
    expect(ballLayer(view, COLORS.nearBall).blur).toBeGreaterThan(view.cocPx);
    expect(ballLayer(view, COLORS.farBall).blur).toBeGreaterThan(view.cocPx);
  });

  it('paints back to front', () => {
    const { layers } = buildScene(base, label)!;
    for (let i = 1; i < layers.length; i++) expect(layers[i].distance).toBeLessThanOrEqual(layers[i - 1].distance);
  });

  it('paints an object after the ground row it stands on', () => {
    const view = buildScene(base, label)!;
    // The near ball stands at 2.75 m, on the ground row from 2 to 3 m.
    const ballAt = view.layers.indexOf(ballLayer(view, COLORS.nearBall));
    const rowAt = view.layers.findIndex((l) => l.distance === 3 && l.shapes.every((s) => s.kind === 'poly'));
    expect(rowAt).toBeGreaterThanOrEqual(0);
    expect(rowAt).toBeLessThan(ballAt);
  });

  it('blurs less when stopped down', () => {
    const wide = ballLayer(buildScene(base, label)!, COLORS.farBall).blur;
    const narrow = ballLayer(buildScene({ ...base, fNumber: 8 }, label)!, COLORS.farBall).blur;
    expect(narrow).toBeCloseTo(wide / 4, 6);
  });

  it('shows the same picture for equivalent settings on another sensor', () => {
    const ff = buildScene(base, label)!;
    const m43 = buildScene({ ...base, focal: 25, fNumber: 1, crop: 2, coc: 0.015 }, label)!;
    expect(m43.layers).toHaveLength(ff.layers.length);
    // Equal up to the thin-lens magnification f / (s − f), which differs by well under 1 %.
    m43.layers.forEach((layer, i) => expect(Math.abs(layer.blur - ff.layers[i].blur)).toBeLessThanOrEqual(ff.layers[i].blur * 0.01));
    expect(m43.cocPx).toBeCloseTo(ff.cocPx, 9);
  });

  it('labels the distance markers', () => {
    const texts = buildScene(base, label)!
      .layers.flatMap((l) => l.shapes)
      .flatMap((s) => (s.kind === 'text' ? [s.text] : []));
    expect(texts).toContain('2.5 m');
    expect(texts).not.toContain('5 m'); // the subject stands there
  });

  it('tints the ground inside the depth of field when asked', () => {
    const fills = (showZone: boolean) =>
      buildScene({ ...base, showZone }, label)!.layers.flatMap((l) => l.shapes).map((s) => ('fill' in s ? s.fill : ''));
    const plain = fills(false);
    const tinted = fills(true);
    expect(tinted).toHaveLength(plain.length);
    expect(tinted.filter((f, i) => f !== plain[i]).length).toBeGreaterThan(0);
  });

  it('gives nothing when the subject is not in front of the camera', () => {
    expect(buildScene({ ...base, position: 6 }, label)).toBeUndefined();
    expect(buildScene({ ...base, width: 0 }, label)).toBeUndefined();
  });
});
