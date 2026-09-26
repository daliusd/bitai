import type { Marker, Panel, Sex, Unit } from '../lib/types';
import { MARKERS } from '../lib/types';
import { MARKER_NAMES, MARKER_SHORT, evaluate, referenceText } from '../lib/reference';
import { unitLabel } from '../lib/units';
import Segmented from './Segmented';
import StatusBadge from './StatusBadge';

interface Props {
  raw: Record<Marker, string>;
  panel: Panel;
  unit: Unit;
  fasting: boolean;
  sex: Sex;
  onChange: (marker: Marker, value: string) => void;
  onUnitChange: (unit: Unit) => void;
  onFastingChange: (fasting: boolean) => void;
}

export default function LipidInputs(props: Props) {
  const { raw, panel, unit, fasting, sex } = props;
  const ctx = { fasting, sex };

  return (
    <div className="lipids">
      <div className="lipid-options">
        <Segmented
          legend="Matavimo vienetai"
          name="unit"
          value={unit}
          options={[
            { value: 'mmol', label: 'mmol/l' },
            { value: 'mgdl', label: 'mg/dl' },
          ]}
          onChange={props.onUnitChange}
        />
        <Segmented
          legend="Kraujas paimtas"
          name="fasting"
          value={fasting ? 'yes' : 'no'}
          options={[
            { value: 'yes', label: 'nevalgius' },
            { value: 'no', label: 'pavalgius' },
          ]}
          onChange={(v) => props.onFastingChange(v === 'yes')}
        />
      </div>

      <div className="lab-sheet" role="group" aria-label="Lipidų rodikliai">
        <div className="lab-head" aria-hidden="true">
          <span>Rodiklis</span>
          <span>Rezultatas</span>
          <span>Rekomenduojama</span>
        </div>
        {MARKERS.map((m) => {
          const id = `lipid-${m}`;
          const value = panel[m];
          return (
            <div className="lab-row" key={m}>
              <label htmlFor={id} className="lab-name">
                {MARKER_NAMES[m]} <abbr>{MARKER_SHORT[m]}</abbr>
              </label>
              <div className="lab-value">
                <input
                  id={id}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="–"
                  value={raw[m]}
                  aria-describedby={`${id}-ref`}
                  onChange={(e) => props.onChange(m, e.target.value)}
                />
                <span className="unit">{unitLabel(unit)}</span>
              </div>
              <div className="lab-ref" id={`${id}-ref`}>
                <span>{referenceText(m, ctx, unit)}</span>
                {value !== undefined && <StatusBadge status={evaluate(m, value, ctx)} />}
              </div>
            </div>
          );
        })}
      </div>
      <p className="hint">
        Ribos pagal 2019 m. Europos kardiologų ir aterosklerozės draugijų (ESC/EAS) gaires ir 2016 m. EAS/EFLM
        sutarimą dėl tyrimo pavalgius. MTL tikslą gydytojas nustato pagal jūsų bendrą širdies ligų riziką: vidutinei rizikai – mažiau nei 2,6 mmol/l,
        didelei – mažiau nei 1,8, labai didelei – mažiau nei 1,4 mmol/l.
      </p>
    </div>
  );
}
