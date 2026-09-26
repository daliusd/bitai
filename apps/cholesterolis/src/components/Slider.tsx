interface Props {
  id: string;
  label: string;
  value: number;
  min?: number;
  max: number;
  step?: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}

export default function Slider({ id, label, value, min = 0, max, step = 1, format, onChange }: Props) {
  return (
    <div className="slider">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={max <= min}
        aria-valuetext={format(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output htmlFor={id}>{format(value)}</output>
    </div>
  );
}
