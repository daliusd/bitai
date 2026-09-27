import { ASPECT, blurDiameter, depthOfField, sensorWidth } from './optics';
import { niceStep } from './numbers';

/**
 * A small 3D scene seen through one camera, reduced to flat layers the canvas can paint back to
 * front. Every layer carries the blur disc diameter (in canvas pixels) that the lens gives at the
 * layer's distance, so the picture shows real defocus rather than a generic "bokeh" effect.
 *
 * World coordinates: x to the right, y up, z along the map axis (metres). The subject stands at
 * z = focus; the camera stands at z = position and aims at the subject's centre.
 */

export interface ViewParams {
  focal: number;
  fNumber: number;
  crop: number;
  coc: number;
  /** Camera position on the map axis, m. */
  position: number;
  /** Subject position on the map axis, m; the lens is focused on it. */
  focus: number;
  /** Subject diameter, m. */
  size: number;
  /** Canvas width in device pixels. */
  width: number;
  /** Tint the ground inside the depth of field. */
  showZone?: boolean;
}

export type Point = [number, number];

export type Shape =
  | { kind: 'poly'; points: Point[]; fill: string }
  | { kind: 'sphere'; x: number; y: number; r: number; color: string }
  | { kind: 'ellipse'; x: number; y: number; rx: number; ry: number; fill: string }
  | { kind: 'text'; x: number; y: number; size: number; text: string; fill: string }
  | { kind: 'light'; x: number; y: number; r: number; color: string; alpha: number };

export interface Layer {
  /** Distance from the camera, m. */
  distance: number;
  /** Blur disc diameter at that distance, canvas px (0 when in perfect focus). */
  blur: number;
  shapes: Shape[];
}

export interface SceneView {
  width: number;
  height: number;
  /** Screen y of the horizon (may lie outside the frame). */
  horizonY: number;
  /** Back to front. */
  layers: Layer[];
  /** Blur the lens allows before a point stops looking sharp, canvas px. */
  cocPx: number;
}

export const COLORS = {
  skyTop: '#9cc3dd',
  skyHorizon: '#eef0e8',
  haze: [226, 232, 226] as const,
  grassA: [122, 158, 104] as const,
  grassB: [104, 140, 90] as const,
  zone: [236, 214, 120] as const,
  hills: '#8fa9a3',
  hillsFar: '#b3c6c2',
  treeCrown: '#3d6b4f',
  trunk: '#6d5241',
  pole: '#565c63',
  sign: '#fbfaf5',
  signEdge: '#2a2f36',
  subject: '#f2c230',
  nearBall: '#2f7fd1',
  farBall: '#d9533b',
  light: '#ffc861',
  shadow: 'rgba(20, 30, 20, 0.28)',
};

/** Distance labels on the marker signs, e.g. 2 → "2 m". Supplied by the caller for localisation. */
export type Label = (metres: number) => string;

function rgb(c: readonly number[]): string {
  return `rgb(${c.map((v) => Math.round(v)).join(',')})`;
}

function mix(a: readonly number[], b: readonly number[], t: number): number[] {
  return a.map((v, i) => v + (b[i] - v) * t);
}

/** Deterministic pseudo-random numbers so the scene is the same on every render. */
function random(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function buildScene(p: ViewParams, label: Label): SceneView | undefined {
  const s = p.focus - p.position; // subject distance from the camera
  if (!(s * 1000 > p.focal) || !(p.width > 0)) return undefined;

  const W = p.width;
  const H = W / ASPECT;
  const F = p.focus; // world scale: everything is sized relative to the subject distance
  const S = p.size;
  const sw = sensorWidth(p.crop);
  const fpx = (W * p.focal) / sw; // focal length in pixels
  const pxPerMm = W / sw;

  // Camera slightly above the subject, looking down at its centre.
  const camY = S / 2 + 0.12 * F;
  const fy0 = S / 2 - camY;
  const fz0 = s;
  const len = Math.hypot(fy0, fz0);
  const fy = fy0 / len;
  const fz = fz0 / len;

  const project = (x: number, y: number, z: number): Point | undefined => {
    const vy = y - camY;
    const vz = z - p.position;
    const zc = vy * fy + vz * fz;
    if (zc <= 1e-6) return undefined;
    const yc = vy * fz - vz * fy;
    return [W / 2 + (fpx * x) / zc, H / 2 - (fpx * yc) / zc];
  };
  const depthScale = (z: number) => {
    const vz = z - p.position;
    const zc = -camY * fy + vz * fz;
    return zc > 0 ? fpx / zc : 0;
  };

  const lens = { focal: p.focal, fNumber: p.fNumber };
  const blurAt = (distance: number) => blurDiameter(lens, s, distance) * pxPerMm;
  const dof = depthOfField({ ...lens, coc: p.coc }, s);

  const layers: Layer[] = [];
  const nearClip = Math.max(0.05 * s, (p.focal / 1000) * 2);
  /** `blurZ` differs from `z` for ground rows: they sort by their far edge so that objects standing
   * on a row are painted after it, but blur by their middle. */
  const add = (z: number, shapes: Shape[], blurZ = z) => {
    const distance = z - p.position;
    if (distance < nearClip || shapes.length === 0) return;
    layers.push({ distance, blur: blurAt(blurZ - p.position), shapes });
  };

  // Horizon: where the ground plane vanishes.
  const horizonY = H / 2 - (fpx * fy) / fz;
  const halfFov = sw / (2 * p.focal);

  // Distant hills, practically at infinity.
  const hillsZ = p.position + 60 * F;
  for (const [z, color, amp, seed] of [
    [hillsZ * 1.4, COLORS.hillsFar, 3.2, 1],
    [hillsZ, COLORS.hills, 2.2, 7],
  ] as const) {
    const d = z - p.position;
    const half = d * halfFov * 1.2;
    const pts: Point[] = [];
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
      const x = -half + (2 * half * i) / steps;
      const u = x / F;
      const h = F * amp * (0.55 + 0.25 * Math.sin(u * 0.09 + seed) + 0.15 * Math.sin(u * 0.23 + seed * 2) + 0.05 * Math.sin(u * 0.61));
      const pt = project(x, h, z);
      if (pt) pts.push(pt);
    }
    const left = project(-half, 0, z);
    const right = project(half, 0, z);
    if (pts.length > 2 && left && right) {
      add(z, [{ kind: 'poly', points: [[left[0], H * 2], ...pts, [right[0], H * 2]], fill: color }]);
    }
  }

  // Ground: checkerboard rows from far to near, fading into haze.
  const far = p.position + 30 * F;
  let tile = niceStep(F / 5);
  while ((far - p.position) / tile > 160) tile *= 2;
  const zStart = Math.floor((p.position + nearClip) / tile) * tile;
  const rows: { z0: number; z1: number }[] = [];
  for (let z = zStart; z < far; z += tile) rows.push({ z0: z, z1: z + tile });
  for (const { z0, z1 } of rows.reverse()) {
    const a = Math.max(z0, p.position + nearClip);
    const top = project(0, 0, z1);
    const bottom = project(0, 0, a);
    if (!top || !bottom || top[1] > H + 2 || bottom[1] < -2) continue;
    const mid = (a + z1) / 2 - p.position;
    const haze = Math.min(1, Math.pow(mid / (30 * F), 0.8));
    const inZone = p.showZone && dof && mid >= dof.near && mid <= dof.far;
    let ca = mix(COLORS.grassA, COLORS.haze, haze);
    let cb = mix(COLORS.grassB, COLORS.haze, haze);
    if (inZone) {
      ca = mix(ca, COLORS.zone, 0.55);
      cb = mix(cb, COLORS.zone, 0.55);
    }
    const half = (z1 - p.position) * halfFov * 1.25 + tile;
    const cols = Math.ceil(half / tile);
    const l0 = project(-cols * tile, 0, a)!;
    const r0 = project(cols * tile, 0, a)!;
    const l1 = project(-cols * tile, 0, z1)!;
    const r1 = project(cols * tile, 0, z1)!;
    const shapes: Shape[] = [{ kind: 'poly', points: [l0, r0, r1, l1], fill: rgb(ca) }];
    const rowIndex = Math.round(z0 / tile);
    for (let c = -cols; c < cols; c++) {
      if ((c + rowIndex) % 2 === 0) continue;
      const x0 = c * tile;
      const x1 = x0 + tile;
      shapes.push({
        kind: 'poly',
        points: [project(x0, 0, a)!, project(x1, 0, a)!, project(x1, 0, z1)!, project(x0, 0, z1)!],
        fill: rgb(cb),
      });
    }
    add(z1, shapes, (a + z1) / 2);
  }

  const shadow = (x: number, z: number, radius: number): Shape | undefined => {
    const c = project(x, 0, z);
    if (!c) return undefined;
    const k = depthScale(z);
    return { kind: 'ellipse', x: c[0], y: c[1], rx: radius * k, ry: radius * k * 0.28, fill: COLORS.shadow };
  };

  const ball = (x: number, z: number, diameter: number, color: string) => {
    const c = project(x, diameter / 2, z);
    if (!c) return;
    const shapes: Shape[] = [];
    const sh = shadow(x, z, diameter * 0.42);
    if (sh) shapes.push(sh);
    shapes.push({ kind: 'sphere', x: c[0], y: c[1], r: (diameter / 2) * depthScale(z), color });
    add(z, shapes);
  };

  // Pine trees scattered in the background.
  for (let i = 0; i < 14; i++) {
    const z = F * (1.8 + 4.5 * random(i + 1));
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * F * (0.45 + 1.4 * random(i + 20));
    const h = F * (0.28 + 0.2 * random(i + 40));
    const w = h * 0.42;
    const base = project(x, 0, z);
    const tip = project(x, h, z);
    const k = depthScale(z);
    if (!base || !tip) continue;
    const trunkW = w * 0.12 * k;
    const crownBase = project(x, h * 0.18, z)!;
    const shapes: Shape[] = [];
    const sh = shadow(x, z, w * 0.5);
    if (sh) shapes.push(sh);
    shapes.push({
      kind: 'poly',
      points: [
        [base[0] - trunkW, base[1]],
        [base[0] + trunkW, base[1]],
        [crownBase[0] + trunkW, crownBase[1]],
        [crownBase[0] - trunkW, crownBase[1]],
      ],
      fill: COLORS.trunk,
    });
    for (let tier = 0; tier < 3; tier++) {
      const y0 = h * (0.18 + tier * 0.22);
      const y1 = h * (0.55 + tier * 0.22);
      const halfW = (w / 2) * (1 - tier * 0.22);
      const b = project(x, y0, z)!;
      const t = project(x, Math.min(y1, h), z)!;
      shapes.push({
        kind: 'poly',
        points: [
          [b[0] - halfW * k, b[1]],
          [b[0] + halfW * k, b[1]],
          [t[0], t[1]],
        ],
        fill: COLORS.treeCrown,
      });
    }
    add(z, shapes);
  }

  // Distance markers along both sides of the axis, labelled with their map distance.
  const step = niceStep(F / 2);
  const side = 0.28 * F + S;
  for (let k = 1, z = step; z <= 6 * F; k++, z = k * step) {
    if (Math.abs(z - F) < step * 0.01) continue; // the subject stands there
    const x = (k % 2 === 0 ? 1 : -1) * side;
    const poleH = 0.2 * F;
    const signW = 0.12 * F;
    const signH = 0.065 * F;
    const base = project(x, 0, z);
    if (!base) continue;
    const kz = depthScale(z);
    const top = project(x, poleH, z)!;
    const poleW = Math.max(0.006 * F * kz, 0.5);
    const signTop = project(x, poleH + signH, z)!;
    const shapes: Shape[] = [];
    const sh = shadow(x, z, 0.02 * F);
    if (sh) shapes.push(sh);
    shapes.push(
      {
        kind: 'poly',
        points: [
          [base[0] - poleW, base[1]],
          [base[0] + poleW, base[1]],
          [top[0] + poleW, top[1]],
          [top[0] - poleW, top[1]],
        ],
        fill: COLORS.pole,
      },
      {
        kind: 'poly',
        points: [
          [top[0] - (signW / 2) * kz, top[1]],
          [top[0] + (signW / 2) * kz, top[1]],
          [signTop[0] + (signW / 2) * kz, signTop[1]],
          [signTop[0] - (signW / 2) * kz, signTop[1]],
        ],
        fill: COLORS.signEdge,
      },
    );
    const inset = 0.004 * F * kz;
    shapes.push({
      kind: 'poly',
      points: [
        [top[0] - (signW / 2) * kz + inset, top[1] - inset],
        [top[0] + (signW / 2) * kz - inset, top[1] - inset],
        [signTop[0] + (signW / 2) * kz - inset, signTop[1] + inset],
        [signTop[0] - (signW / 2) * kz + inset, signTop[1] + inset],
      ],
      fill: COLORS.sign,
    });
    shapes.push({
      kind: 'text',
      x: top[0],
      y: (top[1] + signTop[1]) / 2,
      size: signH * 0.62 * kz,
      text: label(z),
      fill: COLORS.signEdge,
    });
    add(z, shapes);
  }

  // A string of small lights behind the subject: their blur discs are the bokeh.
  const lightsZ = F * 2.6;
  const lightsD = lightsZ - p.position;
  if (lightsD > nearClip) {
    const bokeh = blurAt(lightsD);
    const shapes: Shape[] = [];
    const n = 21;
    const span = 1.1 * F;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const x = -span + 2 * span * u;
      const y = 0.3 * F - 0.06 * F * (1 - Math.pow(2 * u - 1, 2));
      const pt = project(x, y, lightsZ);
      if (!pt) continue;
      const bulb = 0.006 * F * depthScale(lightsZ);
      const r = Math.max(bokeh / 2, bulb, 1);
      // A defocused point spreads the same light over a larger disc.
      const alpha = Math.min(1, Math.max(0.22, (bulb * bulb) / (r * r) * 6));
      shapes.push({ kind: 'light', x: pt[0], y: pt[1], r, color: COLORS.light, alpha });
    }
    // The discs are drawn at their true size, so this layer is not blurred again.
    if (shapes.length) layers.push({ distance: lightsD, blur: 0, shapes });
  }

  // A small ball in front of and one behind the subject, then the subject itself.
  ball(-0.16 * F - S / 2, F * 0.55, Math.max(S * 0.6, 0.06 * F), COLORS.nearBall);
  ball(0.22 * F + S / 2, F * 1.7, Math.max(S * 0.9, 0.08 * F), COLORS.farBall);
  ball(0, F, S, COLORS.subject);

  layers.sort((a, b) => b.distance - a.distance);
  return { width: W, height: H, horizonY, layers, cocPx: p.coc * pxPerMm };
}
