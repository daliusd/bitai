export type Marker = 'tc' | 'ldl' | 'hdl' | 'tg';
export type Unit = 'mmol' | 'mgdl';
export type Sex = '' | 'male' | 'female';

/** Lipid panel in mmol/L; any value may be missing. */
export type Panel = Partial<Record<Marker, number>>;

/** Complete lipid panel in mmol/L. */
export type Lipids = Record<Marker, number>;

export interface Body {
  weight?: number; // kg
  height?: number; // cm
  age?: number; // years
  sex: Sex;
}

export interface Lifestyle {
  smoking: 'unknown' | 'no' | 'yes';
  alcohol: 'unknown' | 'none' | 'occasional' | 'regular';
  activity: 'unknown' | 'low' | 'medium' | 'high';
  nuts: boolean;
  sterols: boolean;
  oats: boolean;
  omega3: boolean;
}

export const MARKERS: Marker[] = ['tc', 'hdl', 'ldl', 'tg'];
