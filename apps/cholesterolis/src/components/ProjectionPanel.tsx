import type { Lipids, Marker, Sex, Unit } from '../lib/types';
import { MARKERS } from '../lib/types';
import type { Projection } from '../lib/interventions';
import { MARKER_SHORT, evaluate, hdlLimit, tgLimit } from '../lib/reference';
import { formatDelta, formatValue, unitLabel } from '../lib/units';

interface Props {
  base?: Lipids;
  projection?: Projection;
  unit: Unit;
  fasting: boolean;
  sex: Sex;
}

/** Scale (mmol/L) for each marker's bar and the recommended zone on it. */
function scale(marker: Marker, fasting: boolean, sex: Sex) {
  switch (marker) {
    case 'tc':
      return { min: 2, max: 9, zone: [2, 5] };
    case 'ldl':
      return { min: 0.5, max: 7, zone: [0.5, 3] };
    case 'hdl':
      return { min: 0.4, max: 2.6, zone: [hdlLimit(sex), 2.6] };
    case 'tg':
      return { min: 0.3, max: 5, zone: [0.3, tgLimit(fasting)] };
  }
}

const pct = (v: number, min: number, max: number) =>
  `${(Math.min(Math.max((v - min) / (max - min), 0), 1) * 100).toFixed(1)}%`;

const HIGHER_IS_BETTER: Record<Marker, boolean> = { tc: false, ldl: false, hdl: true, tg: false };

export default function ProjectionPanel({ base, projection, unit, fasting, sex }: Props) {
  const u = unitLabel(unit);
  return (
    <aside className="projection" aria-labelledby="projection-title">
      <h2 id="projection-title">Kaip galėtų atrodyti</h2>
      {!base || !projection ? (
        <p className="projection-empty">Įveskite bent tris tyrimo rodiklius, ir čia matysite prognozę.</p>
      ) : (
        <>
          <ul className="projection-list">
            {MARKERS.map((m) => {
              const now = base[m];
              const after = projection.lipids[m];
              const delta = after - now;
              const s = scale(m, fasting, sex);
              const improving = HIGHER_IS_BETTER[m] ? delta > 0.005 : delta < -0.005;
              const worsening = HIGHER_IS_BETTER[m] ? delta < -0.005 : delta > 0.005;
              const status = evaluate(m, after, { fasting, sex });
              const lo = Math.min(now, after);
              const hi = Math.max(now, after);
              return (
                <li key={m} className="projection-item" data-testid={`projection-${m}`}>
                  <div className="projection-row">
                    <span className="projection-name">{MARKER_SHORT[m]}</span>
                    <span className="projection-values">
                      <span className="projection-now">{formatValue(m, now, unit)}</span>
                      <span aria-hidden="true"> › </span>
                      <strong className={`projection-after status-text-${status}`}>{formatValue(m, after, unit)}</strong>
                      <span className="sr-only"> {u}</span>
                    </span>
                    <span
                      className={`projection-delta${improving ? ' better' : ''}${worsening ? ' worse' : ''}`}
                    >
                      {formatDelta(m, delta, unit)}
                    </span>
                  </div>
                  <div className="range" aria-hidden="true">
                    <span
                      className="range-zone"
                      style={{ left: pct(s.zone[0], s.min, s.max), right: `calc(100% - ${pct(s.zone[1], s.min, s.max)})` }}
                    />
                    <span
                      className="range-path"
                      style={{ left: pct(lo, s.min, s.max), right: `calc(100% - ${pct(hi, s.min, s.max)})` }}
                    />
                    <span className="range-now" style={{ left: pct(now, s.min, s.max) }} />
                    <span className={`range-after status-bg-${status}`} style={{ left: pct(after, s.min, s.max) }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="projection-legend">
            <span className="legend-now" /> <span>dabar</span> <span className="legend-after" /> <span>po pokyčių</span>{' '}
            <span className="legend-zone" /> <span>rekomenduojama</span>
          </p>
          {projection.capped && (
            <p className="note">Mitybos pokyčių poveikis MTL apribotas iki 30 % – daugiau vien mityba retai pasiekiama.</p>
          )}
          {projection.overlap && (
            <p className="note">
              Kai kurių pasirinktų pokyčių poveikis persidengia – pvz., svorio metimo tyrimuose žmonės kartu keitė
              mitybą ir judėjo daugiau. Sudėjus jų poveikį, prognozė gali būti per optimistinė.
            </p>
          )}
          <p className="projection-foot">Vienetai: {u}. Tai apytikslis vidurkis, ne jūsų asmeninė prognozė.</p>
        </>
      )}
    </aside>
  );
}
