import { useEffect, useState } from 'react';
import { STRINGS } from './lib/i18n';
import type { Strings } from './lib/i18n';
import { useLang } from './lib/lang';
import type { Lang } from './lib/lang';
import { formatNumber } from './lib/numbers';
import { SENSOR_COLORS } from './lib/palette';
import { DEFAULT_SENSORS, lockAll, sanitizeSensors, snapToThirdStops, updateSensor } from './lib/sensors';
import type { Sensor } from './lib/sensors';
import { clearStored, usePersistentState } from './lib/storage';
import type { Options, Scene } from './lib/types';
import BlurViewer from './components/BlurViewer';
import DofMap from './components/DofMap';
import LangSwitch from './components/LangSwitch';
import NumberSlider from './components/NumberSlider';
import SensorCard from './components/SensorCard';
import Toggle from './components/Toggle';

export const DEFAULT_SCENE: Scene = { focus: 3, size: 0.3, mapSize: 10 };
export const DEFAULT_OPTIONS: Options = {
  lock: false,
  thirdStops: false,
  separateMaps: false,
  showZone: false,
  view: 'all',
};

const round2 = (v: number) => Number(v.toPrecision(2));

export default function App() {
  const [lang, setLang] = useLang();
  const t = STRINGS[lang];

  useEffect(() => {
    document.title = t.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.description);
  }, [t]);

  // Remounting the visualization after clearing storage resets every persisted field.
  const [version, setVersion] = useState(0);
  return (
    <Visualization
      key={version}
      lang={lang}
      t={t}
      onLang={setLang}
      onReset={() => {
        clearStored();
        setVersion((v) => v + 1);
      }}
    />
  );
}

interface Props {
  lang: Lang;
  t: Strings;
  onLang: (lang: Lang) => void;
  onReset: () => void;
}

function Visualization({ lang, t, onLang, onReset }: Props) {
  const [scene, setScene] = usePersistentState<Scene>('scene', DEFAULT_SCENE);
  const [options, setOptions] = usePersistentState<Options>('options', DEFAULT_OPTIONS);
  const [storedSensors, setSensors] = usePersistentState<Sensor[]>('sensors', DEFAULT_SENSORS);
  const sensors = sanitizeSensors(storedSensors);

  const num = (v: number, digits = 2) => formatNumber(v, lang, digits);
  const setOption = (patch: Partial<Options>) => setOptions((o) => ({ ...o, ...patch }));
  const changeSensor = (index: number, patch: Partial<Sensor>) =>
    setSensors(updateSensor(sensors, index, patch, options));

  const mapSensors = sensors.flatMap((sensor, index) =>
    sensor.enabled ? [{ index, sensor, color: SENSOR_COLORS[index] }] : [],
  );

  return (
    <div className="page">
      <header className="masthead">
        <div className="topbar">
          <p className="crumbs">
            <a href="/">bitai</a> / {t.crumb}
          </p>
          <LangSwitch lang={lang} label={t.languageLabel} onChange={onLang} />
        </div>
        <h1>{t.title}</h1>
        <p className="lede">{t.lede}</p>
      </header>

      <div className="layout">
        <aside className="controls" aria-labelledby="scene-title">
          <div className="panel">
            <h2 id="scene-title">{t.sceneTitle}</h2>
            <NumberSlider
              id="focus"
              label={t.focus}
              hint={t.focusHint}
              value={scene.focus}
              min={0.3}
              max={100}
              scale="log"
              unit={t.unitM}
              format={(v) => num(v)}
              round={round2}
              onChange={(focus) => setScene((s) => ({ ...s, focus }))}
            />
            <NumberSlider
              id="size"
              label={t.size}
              value={scene.size}
              min={0.02}
              max={5}
              scale="log"
              unit={t.unitM}
              format={(v) => num(v)}
              round={round2}
              onChange={(size) => setScene((s) => ({ ...s, size }))}
            />
            <NumberSlider
              id="mapsize"
              label={t.mapSize}
              value={scene.mapSize}
              min={1}
              max={200}
              scale="log"
              unit={t.unitM}
              format={(v) => num(v, 1)}
              round={round2}
              onChange={(mapSize) => setScene((s) => ({ ...s, mapSize }))}
            />
            <div className="toggles">
              <Toggle
                label={t.lock}
                hint={t.lockHint}
                checked={options.lock}
                onChange={(lock) => {
                  setOption({ lock });
                  if (lock) setSensors(lockAll(sensors, options.thirdStops));
                }}
              />
              <Toggle
                label={t.thirdStops}
                hint={t.thirdStopsHint}
                checked={options.thirdStops}
                onChange={(thirdStops) => {
                  setOption({ thirdStops });
                  if (thirdStops) setSensors(snapToThirdStops(sensors));
                }}
              />
              <Toggle
                label={t.separateMaps}
                hint={t.separateMapsHint}
                checked={options.separateMaps}
                onChange={(separateMaps) => setOption({ separateMaps })}
              />
            </div>
            <p className="storage-note">
              {t.storageNote}{' '}
              <button type="button" className="link-button" onClick={onReset}>
                {t.reset}
              </button>
            </p>
          </div>
        </aside>

        <main>
          <section className="block" aria-labelledby="view-title">
            <h2 id="view-title">{t.viewTitle}</h2>
            <p className="hint">{t.viewHint}</p>
            <BlurViewer
              sensors={sensors}
              colors={SENSOR_COLORS}
              scene={scene}
              options={options}
              lang={lang}
              t={t}
              onOptions={setOption}
            />
          </section>

          <section className="block" aria-labelledby="map-title">
            <h2 id="map-title">{t.mapTitle}</h2>
            <p className="hint">{t.mapHint}</p>
            {options.separateMaps ? (
              <div className="map-grid-list">
                {mapSensors.map((m) => (
                  <DofMap
                    key={m.index}
                    sensors={[m]}
                    scene={scene}
                    lang={lang}
                    t={t}
                    caption={`${t.sensor(m.index + 1)} · ${t.formats[m.sensor.format]}`}
                    compact
                  />
                ))}
              </div>
            ) : (
              <DofMap sensors={mapSensors} scene={scene} lang={lang} t={t} />
            )}
          </section>

          <section className="block" aria-labelledby="sensors-title">
            <h2 id="sensors-title">{t.sensorsTitle}</h2>
            <p className="hint">{t.sensorsHint}</p>
            <div className="sensor-grid">
              {sensors.map((sensor, index) => (
                <SensorCard
                  key={index}
                  index={index}
                  sensor={sensor}
                  color={SENSOR_COLORS[index]}
                  focus={scene.focus}
                  mapSize={scene.mapSize}
                  thirdStops={options.thirdStops}
                  lang={lang}
                  t={t}
                  onChange={(patch) => changeSensor(index, patch)}
                />
              ))}
            </div>
          </section>

          <About t={t} />
        </main>
      </div>

      <footer className="colophon">
        <span>
          2014–2026 © <a href="https://ffff.lt">ffff.lt</a>
        </span>
        <span>Dalius Dobravolskas</span>
        <span>
          <a href="https://github.com/daliusd/bitai">GitHub</a> · MIT
        </span>
        <span>{t.footerNote}</span>
      </footer>
    </div>
  );
}

function About({ t }: { t: Strings }) {
  return (
    <section className="block about" aria-labelledby="about-title">
      <h2 id="about-title">{t.aboutTitle}</h2>
      {t.about.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <h3>{t.formulaTitle}</h3>
      <div className="formulas">
        <p className="formula">
          D<sub>near</sub> = s·f² / (f² + N·c·(s − f))
        </p>
        <p className="formula">
          D<sub>far</sub> = s·f² / (f² − N·c·(s − f))
        </p>
        <p className="formula">H = f² / (N·c) + f</p>
        <p className="formula">
          b = (f / N) · f / (s − f) · |d − s| / d
        </p>
      </div>
      <p className="note">{t.formulaLegend}</p>
      <p className="note">
        {t.sources}{' '}
        <a href="https://en.wikipedia.org/wiki/Depth_of_field#Derivation_of_the_DOF_formulae">Wikipedia</a>.{' '}
        {t.videos}{' '}
        <a href="https://www.youtube.com/watch?v=DtDotqLx6nA">Crop Factor with ISO &amp; Aperture</a>,{' '}
        <a href="https://www.youtube.com/watch?v=PHYidejT3KY">Crop Sensors vs Full Frame :: Crop Or Crap?</a>
      </p>
      <p className="note">{t.history}</p>
    </section>
  );
}
