import type { Bp, Setting } from '../lib/types';
import type { Projection } from '../lib/interventions';
import { CATEGORY_LABELS, CATEGORY_TONE, THRESHOLDS, classify, riskReduction } from '../lib/reference';
import { formatDelta, formatMmHg, formatNumber } from '../lib/units';

interface Props {
  base?: Bp;
  projection?: Projection;
  setting: Setting;
}

type Part = keyof Bp;

const NAMES: Record<Part, string> = { sys: 'Sistolinis', dia: 'Diastolinis' };

/** Scale (mmHg) for each bar and the non-elevated zone on it. */
function scale(part: Part, setting: Setting) {
  const limit = THRESHOLDS[setting].elevated[part];
  return part === 'sys' ? { min: 80, max: 200, zone: [90, limit] } : { min: 40, max: 130, zone: [60, limit] };
}

const pct = (v: number, min: number, max: number) =>
  `${(Math.min(Math.max((v - min) / (max - min), 0), 1) * 100).toFixed(1)}%`;

export default function ProjectionPanel({ base, projection, setting }: Props) {
  return (
    <aside className="projection" aria-labelledby="projection-title">
      <h2 id="projection-title">Kaip galėtų atrodyti</h2>
      {!base || !projection ? (
        <p className="projection-empty">Įveskite bent vieną kraujospūdžio matavimą, ir čia matysite prognozę.</p>
      ) : (
        <ProjectionBody base={base} projection={projection} setting={setting} />
      )}
    </aside>
  );
}

function ProjectionBody({ base, projection, setting }: { base: Bp; projection: Projection; setting: Setting }) {
  const after = projection.bp;
  const categoryNow = classify(base, setting);
  const categoryAfter = classify(after, setting);
  const tone = CATEGORY_TONE[categoryAfter];
  const drop = base.sys - after.sys;
  const risk = riskReduction(drop);

  return (
    <>
      <ul className="projection-list">
        {(['sys', 'dia'] as Part[]).map((p) => {
          const now = base[p];
          const next = after[p];
          const delta = next - now;
          const s = scale(p, setting);
          const lo = Math.min(now, next);
          const hi = Math.max(now, next);
          return (
            <li key={p} className="projection-item" data-testid={`projection-${p}`}>
              <div className="projection-row">
                <span className="projection-name">{NAMES[p]}</span>
                <span className="projection-values">
                  <span className="projection-now">{formatMmHg(now)}</span>
                  <span aria-hidden="true"> › </span>
                  <strong className={`projection-after status-text-${tone}`}>{formatMmHg(next)}</strong>
                  <span className="sr-only"> mmHg</span>
                </span>
                <span className={`projection-delta${delta < -0.5 ? ' better' : ''}`}>{formatDelta(delta)}</span>
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
                <span className={`range-after status-bg-${tone}`} style={{ left: pct(next, s.min, s.max) }} />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="projection-legend">
        <span className="legend-now" /> <span>dabar</span> <span className="legend-after" /> <span>po pokyčių</span>{' '}
        <span className="legend-zone" /> <span>nepadidėjęs</span>
      </p>
      <p className="projection-category" data-testid="projection-category">
        {categoryNow === categoryAfter
          ? `Kategorija: ${CATEGORY_LABELS[categoryAfter].toLowerCase()}.`
          : `Kategorija: ${CATEGORY_LABELS[categoryNow].toLowerCase()} › ${CATEGORY_LABELS[categoryAfter].toLowerCase()}.`}
      </p>
      {risk > 0.005 && (
        <p className="projection-risk" data-testid="projection-risk">
          Toks sistolinio kraujospūdžio sumažėjimas vaistų tyrimuose atitiko maždaug{' '}
          <strong>{formatNumber(risk * 100, 0)} %</strong> mažesnę infarkto, insulto ir širdies nepakankamumo riziką.
        </p>
      )}
      {projection.capped && (
        <p className="note">Mitybos pokyčių poveikis apribotas pagal DASH-Sodium tyrimą – daugiau vien mityba retai pasiekiama.</p>
      )}
      <p className="projection-foot">Vienetai: mmHg. Tai apytikslis vidurkis, ne jūsų asmeninė prognozė.</p>
    </>
  );
}
