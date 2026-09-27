import { useState } from 'react';
import { parseNumber } from '../lib/numbers';
import { nearestStopIndex } from '../lib/optics';

const RESOLUTION = 1000;

interface Props {
  id: string;
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  /** Logarithmic sliders suit focal lengths, f-numbers and distances. */
  scale?: 'linear' | 'log';
  /** When given, the slider only lands on these values (e.g. third stops). */
  stops?: number[];
  /** Text before the field, e.g. "f/". */
  prefix?: string;
  unit?: string;
  /** Allow typing 0 (e.g. a camera that has not stepped back). */
  allowZero?: boolean;
  format: (value: number) => string;
  round: (value: number) => number;
  onChange: (value: number) => void;
}

function toPosition(value: number, min: number, max: number, scale: 'linear' | 'log'): number {
  const clamped = Math.min(max, Math.max(min, value));
  const t = scale === 'log' ? Math.log(clamped / min) / Math.log(max / min) : (clamped - min) / (max - min);
  return Math.round(t * RESOLUTION);
}

function fromPosition(position: number, min: number, max: number, scale: 'linear' | 'log'): number {
  const t = position / RESOLUTION;
  return scale === 'log' ? min * Math.pow(max / min, t) : min + (max - min) * t;
}

/**
 * A slider with a text field next to it. The slider is limited to [min, max]; the field accepts any
 * positive number, with either a decimal comma or point.
 */
export default function NumberSlider({
  id,
  label,
  hint,
  value,
  min,
  max,
  scale = 'linear',
  stops,
  prefix,
  unit,
  allowZero = false,
  format,
  round,
  onChange,
}: Props) {
  // While typing, the field shows exactly what was typed; otherwise it shows the formatted value.
  const [draft, setDraft] = useState<string | null>(null);

  const sliderProps = stops
    ? { min: 0, max: stops.length - 1, step: 1, value: nearestStopIndex(value, stops) }
    : { min: 0, max: RESOLUTION, step: 1, value: toPosition(value, min, max, scale) };

  return (
    <div className="number-slider">
      <div className="number-slider-head">
        <label htmlFor={id}>{label}</label>
        <span className="number-field">
          {prefix && <span className="affix">{prefix}</span>}
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={draft ?? format(value)}
            aria-describedby={hint ? `${id}-hint` : undefined}
            onChange={(e) => {
              setDraft(e.target.value);
              const n = parseNumber(e.target.value);
              if (n !== undefined && (n > 0 || (allowZero && n === 0))) onChange(n);
            }}
            onBlur={() => setDraft(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setDraft(null);
            }}
          />
          {unit && <span className="affix">{unit}</span>}
        </span>
      </div>
      <input
        type="range"
        aria-label={label}
        aria-valuetext={`${prefix ?? ''}${format(value)}${unit ? ` ${unit}` : ''}`}
        {...sliderProps}
        onChange={(e) => {
          setDraft(null);
          const position = Number(e.target.value);
          onChange(stops ? stops[position] : round(fromPosition(position, min, max, scale)));
        }}
      />
      {hint && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}
