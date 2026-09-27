import { useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { LIMITS, clampSetting } from '../lib/settings';
import type { SettingKey } from '../lib/settings';

/** Pixels of vertical drag per step. */
const SENSITIVITY = 25;

interface Props {
  label: string;
  setting: SettingKey;
  value: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}

/** A number adjusted by dragging up or down (or with the arrow keys). */
export default function DragInput({ label, setting, value, format, onChange }: Props) {
  const drag = useRef<{ startY: number; startValue: number } | null>(null);
  const { min, max, step } = LIMITS[setting];

  const set = (next: number) => {
    const clamped = clampSetting(setting, next);
    if (clamped !== value) onChange(clamped);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { startY: e.clientY, startValue: value };
    // Keep receiving moves when the finger leaves the box.
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const steps = Math.round((drag.current.startY - e.clientY) / SENSITIVITY);
    set(drag.current.startValue + steps * step);
  };

  const onPointerEnd = () => {
    drag.current = null;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = {
      ArrowUp: value + step,
      ArrowRight: value + step,
      ArrowDown: value - step,
      ArrowLeft: value - step,
      PageUp: value + step * 10,
      PageDown: value - step * 10,
      Home: min,
      End: max,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    set(moves[e.key]);
  };

  const id = `drag-${setting}`;
  return (
    <div className="input-group">
      <span className="input-label" id={`${id}-label`}>
        {label}
      </span>
      <div
        className="drag-input"
        role="spinbutton"
        tabIndex={0}
        aria-labelledby={`${id}-label`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={format(value)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
      >
        <span className="value">{format(value)}</span>
      </div>
    </div>
  );
}
