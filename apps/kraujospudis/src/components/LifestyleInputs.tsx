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
          <span className="field-label">Alkoholis</span>
          <select value={value.alcohol} onChange={(e) => set('alcohol', e.target.value as Lifestyle['alcohol'])}>
            <option value="unknown">nenurodyta</option>
            <option value="none">negeriu</option>
            <option value="moderate">iki 2 porcijų per dieną</option>
            <option value="heavy">3–5 porcijos per dieną</option>
            <option value="veryHeavy">6 ir daugiau porcijų per dieną</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Fizinis aktyvumas</span>
          <select value={value.activity} onChange={(e) => set('activity', e.target.value as Lifestyle['activity'])}>
            <option value="unknown">nenurodyta</option>
            <option value="low">mažiau nei 150 min per savaitę</option>
            <option value="regular">150 min per savaitę ir daugiau</option>
          </select>
        </label>
      </div>
      <p className="hint">Viena porcija – 10–12 g alkoholio: taurė vyno, bokalas (0,33 l) alaus arba 40 ml degtinės.</p>
      <div className="checks">
        <label>
          <input type="checkbox" checked={value.lowSalt} onChange={(e) => set('lowSalt', e.target.checked)} />
          Jau riboju druską: nesūdau papildomai, vengiu sūrių produktų
        </label>
        <label>
          <input
            type="checkbox"
            checked={value.saltSubstitute}
            onChange={(e) => set('saltSubstitute', e.target.checked)}
          />
          Naudoju druskos pakaitalą su kaliu
        </label>
        <label>
          <input type="checkbox" checked={value.dash} onChange={(e) => set('dash', e.target.checked)} />
          Kasdien valgau daug daržovių, vaisių, ankštinių, liesų pieno produktų (DASH tipo mityba)
        </label>
        <label>
          <input type="checkbox" checked={value.medication} onChange={(e) => set('medication', e.target.checked)} />
          Vartoju vaistus nuo padidėjusio kraujospūdžio
        </label>
      </div>
    </div>
  );
}
