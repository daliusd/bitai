import type { Lifestyle } from '../lib/types';

interface Props {
  value: Lifestyle;
  onChange: (value: Lifestyle) => void;
}

export default function LifestyleInputs({ value, onChange }: Props) {
  const set = <K extends keyof Lifestyle>(key: K, v: Lifestyle[K]) => onChange({ ...value, [key]: v });

  return (
    <div className="lifestyle">
      <h3>Ką jau darote dabar</h3>
      <p className="hint">
        Pažymėkite, kas jums jau būdinga – tada nesiūlysime to, ką ir taip darote, o prognozė to nepridės antrą kartą.
      </p>
      <div className="body-inputs">
        <label className="field">
          <span className="field-label">Rūkymas</span>
          <select value={value.smoking} onChange={(e) => set('smoking', e.target.value as Lifestyle['smoking'])}>
            <option value="unknown">nenurodyta</option>
            <option value="no">nerūkau</option>
            <option value="yes">rūkau</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Alkoholis</span>
          <select value={value.alcohol} onChange={(e) => set('alcohol', e.target.value as Lifestyle['alcohol'])}>
            <option value="unknown">nenurodyta</option>
            <option value="none">negeriu</option>
            <option value="occasional">retkarčiais</option>
            <option value="regular">kasdien ar beveik kasdien</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Fizinis aktyvumas</span>
          <select value={value.activity} onChange={(e) => set('activity', e.target.value as Lifestyle['activity'])}>
            <option value="unknown">nenurodyta</option>
            <option value="low">mažiau nei 150 min per savaitę</option>
            <option value="medium">150–300 min per savaitę</option>
            <option value="high">daugiau nei 300 min per savaitę</option>
          </select>
        </label>
      </div>
      <div className="checks">
        <label>
          <input type="checkbox" checked={value.nuts} onChange={(e) => set('nuts', e.target.checked)} />
          Kasdien suvalgau saują riešutų
        </label>
        <label>
          <input type="checkbox" checked={value.oats} onChange={(e) => set('oats', e.target.checked)} />
          Kasdien valgau avižų, miežių ar vartoju balkšvojo gysločio sėklų luobeles
        </label>
        <label>
          <input type="checkbox" checked={value.sterols} onChange={(e) => set('sterols', e.target.checked)} />
          Vartoju produktus su augaliniais steroliais ar stanoliais
        </label>
        <label>
          <input type="checkbox" checked={value.omega3} onChange={(e) => set('omega3', e.target.checked)} />
          Vartoju žuvų taukus ar kitus omega-3 papildus
        </label>
      </div>
    </div>
  );
}
