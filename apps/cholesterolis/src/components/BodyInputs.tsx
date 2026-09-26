import type { Body } from '../lib/types';
import { bmi, bmiCategory } from '../lib/body';
import { formatNumber } from '../lib/units';

export interface BodyRaw {
  weight: string;
  height: string;
  age: string;
  sex: string;
}

interface Props {
  raw: BodyRaw;
  body: Body;
  onChange: (raw: BodyRaw) => void;
}

const FIELDS: { key: 'weight' | 'height' | 'age'; label: string; unit: string }[] = [
  { key: 'weight', label: 'Svoris', unit: 'kg' },
  { key: 'height', label: 'Ūgis', unit: 'cm' },
  { key: 'age', label: 'Amžius', unit: 'm.' },
];

export default function BodyInputs({ raw, body, onChange }: Props) {
  const bmiValue = bmi(body);
  return (
    <div className="body-inputs">
      {FIELDS.map((f) => (
        <label className="field" key={f.key}>
          <span className="field-label">{f.label}</span>
          <span className="field-input">
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={raw[f.key]}
              onChange={(e) => onChange({ ...raw, [f.key]: e.target.value })}
            />
            <span className="unit">{f.unit}</span>
          </span>
        </label>
      ))}
      <label className="field">
        <span className="field-label">Lytis</span>
        <select value={raw.sex} onChange={(e) => onChange({ ...raw, sex: e.target.value })}>
          <option value="">nenurodyta</option>
          <option value="female">moteris</option>
          <option value="male">vyras</option>
        </select>
      </label>
      {bmiValue !== undefined && (
        <p className="bmi">
          Kūno masės indeksas: <strong>{formatNumber(bmiValue, 1)}</strong> ({bmiCategory(bmiValue)})
        </p>
      )}
    </div>
  );
}
