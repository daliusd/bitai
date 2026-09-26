/** Where the blood pressure was measured: thresholds differ (ESC 2024). */
export type Setting = 'office' | 'home';

/** Blood pressure in mmHg. */
export interface Bp {
  sys: number;
  dia: number;
}

export interface Body {
  weight?: number; // kg
  height?: number; // cm
}

export interface Lifestyle {
  /** Standard drinks (≈ 10–12 g alcohol) per day. */
  alcohol: 'unknown' | 'none' | 'moderate' | 'heavy' | 'veryHeavy';
  /** Regular aerobic exercise, ≥ 150 min per week. */
  activity: 'unknown' | 'low' | 'regular';
  lowSalt: boolean;
  saltSubstitute: boolean;
  dash: boolean;
  medication: boolean;
}
