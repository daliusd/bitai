import { useMemo, useState } from 'react';
import { clearStored, usePersistentState } from './lib/storage';
import type { Body, Lifestyle, Marker, Sex, Unit } from './lib/types';
import { MARKERS } from './lib/types';
import { formatNumber, fromMmol, parseNumber, toMmol } from './lib/units';
import { checkConsistency } from './lib/consistency';
import { maxWeightLossPct } from './lib/body';
import { DEFAULT_CHOICES, computeEffects, project } from './lib/interventions';
import type { Choices } from './lib/interventions';
import LipidInputs from './components/LipidInputs';
import ConsistencyCheck from './components/ConsistencyCheck';
import BodyInputs from './components/BodyInputs';
import type { BodyRaw } from './components/BodyInputs';
import LifestyleInputs from './components/LifestyleInputs';
import Interventions from './components/Interventions';
import ProjectionPanel from './components/ProjectionPanel';
import Reliability from './components/Reliability';
import { evaluate } from './lib/reference';
import type { Status } from './lib/reference';

export const DEFAULT_LIFESTYLE: Lifestyle = {
  smoking: 'unknown',
  alcohol: 'unknown',
  activity: 'unknown',
  nuts: false,
  sterols: false,
  oats: false,
  omega3: false,
};

const EMPTY_RAW: Record<Marker, string> = { tc: '', hdl: '', ldl: '', tg: '' };

export default function App() {
  // Remounting the calculator after clearing storage resets every persisted field.
  const [version, setVersion] = useState(0);
  return (
    <Calculator
      key={version}
      onClear={() => {
        clearStored();
        setVersion((v) => v + 1);
      }}
    />
  );
}

function Calculator({ onClear }: { onClear: () => void }) {
  const [unit, setUnit] = usePersistentState<Unit>('unit', 'mmol');
  const [fasting, setFasting] = usePersistentState('fasting', true);
  const [raw, setRaw] = usePersistentState('panel', EMPTY_RAW);
  const [bodyRaw, setBodyRaw] = usePersistentState<BodyRaw>('body', { weight: '', height: '', age: '', sex: '' });
  const [lifestyle, setLifestyle] = usePersistentState<Lifestyle>('lifestyle', DEFAULT_LIFESTYLE);
  const [choices, setChoices] = usePersistentState<Choices>('choices', DEFAULT_CHOICES);

  const panel = useMemo(() => {
    const p: Partial<Record<Marker, number>> = {};
    for (const m of MARKERS) {
      const v = parseNumber(raw[m]);
      if (v !== undefined && v > 0) p[m] = toMmol(m, v, unit);
    }
    return p;
  }, [raw, unit]);

  const body: Body = {
    weight: parseNumber(bodyRaw.weight),
    height: parseNumber(bodyRaw.height),
    age: parseNumber(bodyRaw.age),
    sex: bodyRaw.sex as Sex,
  };

  const maxLoss = maxWeightLossPct(body);
  const effectiveChoices = { ...choices, weightPct: Math.min(choices.weightPct, maxLoss) };
  const consistency = checkConsistency(panel, fasting);
  const effects = computeEffects(effectiveChoices, body, lifestyle);
  const projection = consistency.lipids ? project(consistency.lipids, effects) : undefined;
  const evaluated = consistency.lipids ?? panel;
  const statuses: Partial<Record<Marker, Status>> = {};
  for (const m of MARKERS) {
    const v = evaluated[m];
    if (v !== undefined) statuses[m] = evaluate(m, v, { fasting, sex: body.sex });
  }

  function changeUnit(next: Unit) {
    if (next === unit) return;
    const converted = { ...raw };
    for (const m of MARKERS) {
      const v = parseNumber(raw[m]);
      if (v === undefined) continue;
      const out = fromMmol(m, toMmol(m, v, unit), next);
      converted[m] = formatNumber(out, next === 'mmol' ? 2 : 0);
    }
    setRaw(converted);
    setUnit(next);
  }

  return (
    <div className="page">
      <header className="masthead">
        <p className="crumbs">
          <a href="/">bitai</a> / cholesterolis
        </p>
        <h1>Cholesterolio skaičiuoklė</h1>
        <p className="lede">
          Įveskite kraujo tyrimo lipidų rodiklius ir pažiūrėkite, kiek, remiantis moksliniais tyrimais,
          juos galėtų pakeisti svorio, mitybos ir kiti gyvensenos pokyčiai.
        </p>
        <p className="disclaimer">
          Tai informacinė priemonė, ne medicininė konsultacija. Skaičiai – tyrimų vidurkiai; jūsų organizmas
          gali reaguoti kitaip. Sprendimus dėl gydymo priimkite kartu su gydytoju.
        </p>
        <p className="storage-note">
          Įvesti duomenys saugomi tik šioje naršyklėje, kad grįžę nereikėtų jų vesti iš naujo.{' '}
          <button type="button" className="link-button" onClick={onClear}>
            Ištrinti įvestus duomenis
          </button>
        </p>
      </header>

      <div className="layout">
        <main>
          <section className="block" aria-labelledby="results-title">
            <h2 id="results-title">Jūsų tyrimo rezultatai</h2>
            <LipidInputs
              raw={raw}
              panel={panel}
              unit={unit}
              fasting={fasting}
              sex={body.sex}
              onChange={(m, v) => setRaw({ ...raw, [m]: v })}
              onUnitChange={changeUnit}
              onFastingChange={setFasting}
            />
            <ConsistencyCheck result={consistency} unit={unit} />
            {consistency.lipids && (consistency.lipids.ldl >= 4.9 || consistency.lipids.tc >= 8) && (
              <p className="alert" role="note">
                Labai didelis MTL (≥ 4,9 mmol/l) ar bendrasis cholesterolis (≥ 8 mmol/l) gali rodyti paveldimą šeiminę
                hipercholesterolemiją. Tokiu atveju vien gyvensenos pokyčių dažniausiai nepakanka – pasitarkite su
                gydytoju.
              </p>
            )}
            <Reliability panel={panel} unit={unit} />
          </section>

          <section className="block" aria-labelledby="about-title">
            <h2 id="about-title">Apie jus</h2>
            <p className="hint">
              Neprivaloma. Svoris ir ūgis riboja svorio metimo slankiklį, lytis – DTL normą, o visi keturi
              duomenys padeda įvertinti jūsų dienos energijos poreikį.
            </p>
            <BodyInputs raw={bodyRaw} body={body} onChange={setBodyRaw} />
            <LifestyleInputs value={lifestyle} onChange={setLifestyle} />
          </section>

          <Interventions
            choices={effectiveChoices}
            onChange={setChoices}
            effects={effects}
            body={body}
            lifestyle={lifestyle}
            maxWeightLossPct={maxLoss}
            unit={unit}
            base={consistency.lipids}
            statuses={statuses}
          />
        </main>

        <ProjectionPanel
          base={consistency.lipids}
          projection={projection}
          unit={unit}
          fasting={fasting}
          sex={body.sex}
        />
      </div>

      <footer className="colophon">
        <span>
          2026 © <a href="https://ffff.lt">ffff.lt</a>
        </span>
        <span>Dalius Dobravolskas</span>
        <span>Informacinė priemonė, ne medicininė konsultacija.</span>
      </footer>
    </div>
  );
}
