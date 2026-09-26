import { useState } from 'react';
import { clearStored, usePersistentState } from './lib/storage';
import type { Body, Bp, Lifestyle, Setting } from './lib/types';
import { parseNumber } from './lib/units';
import { maxWeightLoss } from './lib/body';
import { parseReading, summarize } from './lib/readings';
import type { ReadingRaw } from './lib/readings';
import { classify } from './lib/reference';
import { DEFAULT_CHOICES, computeEffects, project } from './lib/interventions';
import type { Choices } from './lib/interventions';
import ReadingsInput from './components/ReadingsInput';
import Result from './components/Result';
import Measurement from './components/Measurement';
import BodyInputs from './components/BodyInputs';
import type { BodyRaw } from './components/BodyInputs';
import LifestyleInputs from './components/LifestyleInputs';
import Interventions from './components/Interventions';
import ProjectionPanel from './components/ProjectionPanel';

export const DEFAULT_LIFESTYLE: Lifestyle = {
  alcohol: 'unknown',
  activity: 'unknown',
  lowSalt: false,
  saltSubstitute: false,
  dash: false,
  medication: false,
};

const EMPTY_ROWS: ReadingRaw[] = [
  { sys: '', dia: '' },
  { sys: '', dia: '' },
  { sys: '', dia: '' },
];

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
  const [setting, setSetting] = usePersistentState<Setting>('setting', 'home');
  const [rows, setRows] = usePersistentState<ReadingRaw[]>('readings', EMPTY_ROWS);
  const [bodyRaw, setBodyRaw] = usePersistentState<BodyRaw>('body', { weight: '', height: '' });
  const [lifestyle, setLifestyle] = usePersistentState<Lifestyle>('lifestyle', DEFAULT_LIFESTYLE);
  const [choices, setChoices] = usePersistentState<Choices>('choices', DEFAULT_CHOICES);

  const safeRows = Array.isArray(rows) ? rows : EMPTY_ROWS;
  const readings = safeRows
    .map(parseReading)
    .flatMap((r) => (r.bp ? [r.bp] : []));
  const summary = summarize(readings);
  const base: Bp | undefined = summary?.average;

  const body: Body = { weight: parseNumber(bodyRaw.weight), height: parseNumber(bodyRaw.height) };

  const category = base ? classify(base, setting) : undefined;
  const hypertensive = category === 'hypertension' || category === 'severe';
  const maxLoss = maxWeightLoss(body);
  const effectiveChoices = { ...choices, weightKg: Math.min(choices.weightKg, maxLoss) };
  const effects = computeEffects(effectiveChoices, lifestyle, hypertensive);
  const projection = base ? project(base, effects, hypertensive) : undefined;

  return (
    <div className="page">
      <header className="masthead">
        <p className="crumbs">
          <a href="/">bitai</a> / kraujospudis
        </p>
        <h1>Kraujospūdžio skaičiuoklė</h1>
        <p className="lede">
          Įveskite savo kraujospūdžio matavimus ir pažiūrėkite, kiek, remiantis moksliniais tyrimais, jį galėtų
          sumažinti svorio, mitybos, judėjimo ir kiti gyvensenos pokyčiai.
        </p>
        <p className="disclaimer">
          Tai informacinė priemonė, ne medicininė konsultacija. Skaičiai – tyrimų vidurkiai; jūsų organizmas gali
          reaguoti kitaip. Sprendimus dėl gydymo priimkite kartu su gydytoju.
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
            <h2 id="results-title">Jūsų matavimai</h2>
            <ReadingsInput rows={safeRows} setting={setting} onChange={setRows} onSettingChange={setSetting} />
            <Result summary={summary} setting={setting} />
            <Measurement summary={summary} />
          </section>

          <section className="block" aria-labelledby="about-title">
            <h2 id="about-title">Apie jus</h2>
            <p className="hint">Neprivaloma. Svoris ir ūgis riboja svorio metimo slankiklį.</p>
            <BodyInputs raw={bodyRaw} body={body} onChange={setBodyRaw} />
            <LifestyleInputs value={lifestyle} onChange={setLifestyle} />
          </section>

          <Interventions
            choices={effectiveChoices}
            onChange={setChoices}
            effects={effects}
            lifestyle={lifestyle}
            maxWeightLoss={maxLoss}
            hypertensive={hypertensive}
          />
        </main>

        <ProjectionPanel base={base} projection={projection} setting={setting} />
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
