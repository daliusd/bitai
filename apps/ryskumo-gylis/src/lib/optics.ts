/** Width of a full-frame (35 mm) sensor in millimetres. Crop factors are relative to it. */
export const FULL_FRAME_WIDTH = 36;
/** Frames are drawn in the classic 3:2 aspect ratio. */
export const ASPECT = 3 / 2;

export interface Lens {
  /** Focal length, mm. */
  focal: number;
  fNumber: number;
  /** Circle of confusion, mm on the sensor. */
  coc: number;
}

export interface Dof {
  /** Near limit of acceptable sharpness, m. */
  near: number;
  /** Far limit, m; Infinity when focused at or beyond the hyperfocal distance. */
  far: number;
  /** far − near, m (Infinity when far is). */
  depth: number;
  /** Focusing here puts the far limit at infinity, m. */
  hyperfocal: number;
}

/**
 * Depth of field for a subject `distance` metres away, using the thin-lens formulas from
 * https://en.wikipedia.org/wiki/Depth_of_field#Derivation_of_the_DOF_formulae.
 * Returns undefined when the subject is not in front of the lens (distance ≤ focal length).
 */
export function depthOfField({ focal, fNumber, coc }: Lens, distance: number): Dof | undefined {
  const f = focal;
  const s = distance * 1000;
  if (!(f > 0 && fNumber > 0 && coc > 0) || !(s > f)) return undefined;
  const k = fNumber * coc * (s - f);
  const near = (s * f * f) / (f * f + k);
  const farDenominator = f * f - k;
  const far = farDenominator > 0 ? (s * f * f) / farDenominator : Infinity;
  const hyperfocal = (f * f) / (fNumber * coc) + f;
  return {
    near: near / 1000,
    far: far / 1000,
    depth: (far - near) / 1000,
    hyperfocal: hyperfocal / 1000,
  };
}

/** Sensor width in mm for a crop factor. */
export function sensorWidth(crop: number): number {
  return FULL_FRAME_WIDTH / crop;
}

/** Horizontal angle of view in radians. */
export function horizontalFov(focal: number, crop: number): number {
  return 2 * Math.atan(sensorWidth(crop) / (2 * focal));
}

/**
 * Diameter (mm, on the sensor) of the blur disc of a point `objectDistance` metres away when the
 * lens is focused at `subjectDistance` metres. Pass Infinity for a point at infinity.
 */
export function blurDiameter({ focal, fNumber }: Omit<Lens, 'coc'>, subjectDistance: number, objectDistance: number): number {
  const f = focal;
  const s = subjectDistance * 1000;
  if (!(s > f) || !(objectDistance > 0)) return 0;
  const magnification = f / (s - f);
  const aperture = f / fNumber;
  const defocus = objectDistance === Infinity ? 1 : Math.abs(objectDistance * 1000 - s) / (objectDistance * 1000);
  return aperture * magnification * defocus;
}

/** Full-frame equivalent focal length and f-number: same angle of view and depth of field. */
export function fullFrameEquivalent(focal: number, fNumber: number, crop: number) {
  return { focal: focal * crop, fNumber: fNumber * crop };
}

/**
 * Nominal f-numbers in third-stop increments, as marked on lenses. The exact values are 2^(k/6);
 * cameras show these rounded labels instead.
 */
export const THIRD_STOPS = [
  0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8, 9, 10, 11, 13,
  14, 16, 18, 20, 22, 25, 29, 32,
];

/** Index of the stop closest to `fNumber` on a logarithmic scale. */
export function nearestStopIndex(fNumber: number, stops: number[] = THIRD_STOPS): number {
  let best = 0;
  for (let i = 1; i < stops.length; i++) {
    if (Math.abs(Math.log(stops[i] / fNumber)) < Math.abs(Math.log(stops[best] / fNumber))) best = i;
  }
  return best;
}
