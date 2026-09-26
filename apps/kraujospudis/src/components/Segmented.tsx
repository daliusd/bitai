interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  legend: string;
  name: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

/** A radio group rendered as a segmented control. */
export default function Segmented<T extends string>({ legend, name, value, options, onChange }: Props<T>) {
  return (
    <fieldset className="segmented">
      <legend>{legend}</legend>
      <div className="segmented-options">
        {options.map((o) => (
          <label key={o.value} className={o.value === value ? 'selected' : undefined}>
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={o.value === value}
              onChange={() => onChange(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
