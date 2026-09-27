import type { CSSProperties } from 'react';
import type { Lang } from '../lib/lang';
import type { Strings } from '../lib/i18n';
import { formatDistance, formatNumber, formatPrecise } from '../lib/numbers';
import { THIRD_STOPS, depthOfField, fullFrameEquivalent } from '../lib/optics';
import { FOCAL_RANGE, FORMATS, F_NUMBER_RANGE, formatPatch, roundFNumber, roundFocal } from '../lib/sensors';
import type { FormatId, Sensor } from '../lib/sensors';
import NumberSlider from './NumberSlider';

interface Props {
  index: number;
  sensor: Sensor;
  color: string;
  focus: number;
  mapSize: number;
  thirdStops: boolean;
  lang: Lang;
  t: Strings;
  onChange: (patch: Partial<Sensor>) => void;
}

const FORMAT_ORDER: FormatId[] = [...FORMATS.map((f) => f.id), 'custom'];

export default function SensorCard({ index, sensor, color, focus, mapSize, thirdStops, lang, t, onChange }: Props) {
  const id = `sensor${index}`;
  const name = t.sensor(index + 1);
  const dof = depthOfField(sensor, focus - sensor.position);
  const eq = fullFrameEquivalent(sensor.focal, sensor.fNumber, sensor.crop);
  const num = (v: number, digits = 1) => formatNumber(v, lang, digits);
  const dist = (v: number) => formatDistance(v, lang);

  return (
    <section
      className={`sensor-card${sensor.enabled ? '' : ' is-off'}`}
      style={{ '--sensor': color } as CSSProperties}
      aria-labelledby={`${id}-title`}
    >
      <header className="sensor-head">
        <span className="sensor-swatch" aria-hidden="true" />
        <div className="sensor-title">
          <h3 id={`${id}-title`}>{name}</h3>
          <p className="sensor-sub">
            {t.formats[sensor.format]} · {num(sensor.crop, 2)}×
          </p>
        </div>
        <label className="toggle toggle-compact">
          <input
            type="checkbox"
            role="switch"
            aria-label={`${t.enabled}: ${name}`}
            checked={sensor.enabled}
            onChange={(e) => onChange({ enabled: e.target.checked })}
          />
          <span className="toggle-track" aria-hidden="true" />
        </label>
      </header>

      {sensor.enabled && (
        <>
          <div className="sensor-format">
            <label className="field">
              <span className="field-label">{t.format}</span>
              <select
                value={sensor.format}
                onChange={(e) => onChange(formatPatch(e.target.value as FormatId, sensor))}
              >
                {FORMAT_ORDER.map((f) => (
                  <option key={f} value={f}>
                    {t.formats[f]}
                  </option>
                ))}
              </select>
            </label>
            <div className="sensor-format-numbers">
              <NumberSlider
                id={`${id}-crop`}
                label={t.crop}
                value={sensor.crop}
                min={0.25}
                max={10}
                scale="log"
                unit="×"
                format={(v) => formatPrecise(v, lang)}
                round={(v) => Math.round(v * 100) / 100}
                onChange={(crop) => onChange({ format: 'custom', crop })}
              />
              <NumberSlider
                id={`${id}-coc`}
                label={t.coc}
                value={sensor.coc}
                min={0.002}
                max={0.15}
                scale="log"
                unit="mm"
                format={(v) => formatPrecise(v, lang)}
                round={(v) => Math.round(v * 10000) / 10000}
                onChange={(coc) => onChange({ format: 'custom', coc })}
              />
            </div>
          </div>

          <NumberSlider
            id={`${id}-focal`}
            label={t.focal}
            value={sensor.focal}
            {...FOCAL_RANGE}
            scale="log"
            unit={t.unitMm}
            format={(v) => num(v)}
            round={roundFocal}
            onChange={(focal) => onChange({ focal })}
          />
          <NumberSlider
            id={`${id}-fnumber`}
            label={t.fNumber}
            value={sensor.fNumber}
            {...F_NUMBER_RANGE}
            scale="log"
            stops={thirdStops ? THIRD_STOPS : undefined}
            prefix="f/"
            format={(v) => num(v)}
            round={roundFNumber}
            onChange={(fNumber) => onChange({ fNumber })}
          />
          <NumberSlider
            id={`${id}-position`}
            label={t.position}
            hint={t.positionHint}
            value={sensor.position}
            min={0}
            max={Math.max(mapSize, 1)}
            unit={t.unitM}
            allowZero
            format={(v) => num(v, 2)}
            round={(v) => Math.round(v * 10) / 10}
            onChange={(position) => onChange({ position })}
          />

          {dof ? (
            <dl className="sensor-results" data-testid={`${id}-results`}>
              <div>
                <dt>{t.near}</dt>
                <dd>
                  {dist(dof.near)} {t.unitM}
                </dd>
              </div>
              <div>
                <dt>{t.far}</dt>
                <dd>
                  {dist(dof.far)} {dof.far !== Infinity && t.unitM}
                </dd>
              </div>
              <div className="is-key">
                <dt>{t.depth}</dt>
                <dd>
                  {dist(dof.depth)} {dof.depth !== Infinity && t.unitM}
                </dd>
              </div>
              <div>
                <dt>{t.hyperfocal}</dt>
                <dd>
                  {dist(dof.hyperfocal)} {t.unitM}
                </dd>
              </div>
              <div className="is-wide">
                <dt>{t.equivalent}</dt>
                <dd>
                  {num(eq.focal, 0)} mm f/{num(eq.fNumber)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="sensor-warning" role="alert">
              {t.notInFront}
            </p>
          )}
        </>
      )}
    </section>
  );
}
