import type { Setting } from '../lib/types';
import type { ReadingRaw } from '../lib/readings';
import { DIA_RANGE, SYS_RANGE, parseReading } from '../lib/readings';
import Segmented from './Segmented';

interface Props {
  rows: ReadingRaw[];
  setting: Setting;
  onChange: (rows: ReadingRaw[]) => void;
  onSettingChange: (setting: Setting) => void;
}

export const MAX_ROWS = 28;

const PROBLEMS = {
  range: `Patikrinkite skaičius: sistolinis turėtų būti ${SYS_RANGE[0]}–${SYS_RANGE[1]}, diastolinis ${DIA_RANGE[0]}–${DIA_RANGE[1]} mmHg.`,
  order: 'Sistolinis (viršutinis) skaičius turi būti didesnis už diastolinį (apatinį).',
};

export default function ReadingsInput({ rows, setting, onChange, onSettingChange }: Props) {
  const update = (i: number, patch: Partial<ReadingRaw>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="readings">
      <div className="lipid-options">
        <Segmented<Setting>
          legend="Kur matavote"
          name="setting"
          value={setting}
          options={[
            { value: 'home', label: 'namuose' },
            { value: 'office', label: 'pas gydytoją ar vaistinėje' },
          ]}
          onChange={onSettingChange}
        />
      </div>

      <div className="lab-sheet readings-sheet" role="group" aria-label="Kraujospūdžio matavimai">
        <div className="lab-head readings-row" aria-hidden="true">
          <span>Nr.</span>
          <span>Sistolinis (viršutinis)</span>
          <span>Diastolinis (apatinis)</span>
          <span />
        </div>
        {rows.map((r, i) => {
          const problem = parseReading(r).problem;
          const n = i + 1;
          return (
            <div className="lab-row readings-row" key={i}>
              <span className="lab-name">{n}.</span>
              <div className="lab-value">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="sist."
                  aria-label={`${n} matavimas: sistolinis`}
                  value={r.sys}
                  onChange={(e) => update(i, { sys: e.target.value })}
                />
                <span className="unit">mmHg</span>
              </div>
              <div className="lab-value">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="diast."
                  aria-label={`${n} matavimas: diastolinis`}
                  value={r.dia}
                  onChange={(e) => update(i, { dia: e.target.value })}
                />
                <span className="unit">mmHg</span>
              </div>
              <div>
                {rows.length > 1 && (
                  <button
                    type="button"
                    className="link-button"
                    aria-label={`Pašalinti ${n} matavimą`}
                    onClick={() => onChange(rows.filter((_, j) => j !== i))}
                  >
                    Pašalinti
                  </button>
                )}
              </div>
              {problem && (
                <p className="warning readings-problem" role="alert">
                  {PROBLEMS[problem]}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {rows.length < MAX_ROWS && (
        <button type="button" className="add-button" onClick={() => onChange([...rows, { sys: '', dia: '' }])}>
          + Pridėti matavimą
        </button>
      )}
      <p className="hint">
        Įveskite kelis matavimus – vienas matavimas mažai ką pasako. Jei įvesite tris ar daugiau, pirmąjį atmesime:
        jis dažniausiai būna didžiausias. Pulso įvesti nereikia.
      </p>
    </div>
  );
}
