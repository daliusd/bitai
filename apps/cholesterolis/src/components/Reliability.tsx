import type { Marker, Panel, Unit } from '../lib/types';
import { MARKERS } from '../lib/types';
import { MARKER_NAMES, MARKER_SHORT } from '../lib/reference';
import { BIOLOGICAL_CV, compareResults, referenceChangeValue, singleResultRange } from '../lib/variability';
import { formatNumber, formatValue, parseNumber, toMmol, unitLabel } from '../lib/units';
import { usePersistentState } from '../lib/storage';
import { SOURCES } from '../lib/sources';
import { SourceList } from './InterventionSection';

interface Props {
  panel: Panel;
  unit: Unit;
}

const pct = (v: number) => `${formatNumber(v * 100, 0)} %`;

export default function Reliability({ panel, unit }: Props) {
  const [compare, setCompare] = usePersistentState('compare', { marker: 'tg', earlier: '', later: '' });
  const u = unitLabel(unit);
  const marker = compare.marker as Marker;
  const earlier = parseNumber(compare.earlier);
  const later = parseNumber(compare.later);
  const result =
    earlier && later ? compareResults(marker, toMmol(marker, earlier, unit), toMmol(marker, later, unit)) : undefined;
  const entered = MARKERS.filter((m) => panel[m] !== undefined);

  return (
    <div className="reliability">
      <h3>Kiek galima pasitikėti vienu tyrimu?</h3>
      <p>
        Lipidų kiekis kraujyje natūraliai svyruoja diena iš dienos, net nieko nekeičiant. Tipinis vieno žmogaus
        svyravimas: BCH ±{pct(BIOLOGICAL_CV.tc)}, DTL ±{pct(BIOLOGICAL_CV.hdl)}, MTL ±{pct(BIOLOGICAL_CV.ldl)}, o
        trigliceridų net ±{pct(BIOLOGICAL_CV.tg)}. Prie to prisideda ir laboratorijos matavimo paklaida (3–5 %).
      </p>

      {entered.length > 0 && (
        <>
          <p>Jei tyrimą pakartotumėte kitą savaitę nieko nekeisdami, rezultatas greičiausiai (95 % tikimybe) būtų:</p>
          <ul className="ranges">
            {entered.map((m) => {
              const [lo, hi] = singleResultRange(m, panel[m]!);
              return (
                <li key={m}>
                  {MARKER_NAMES[m]}: nuo {formatValue(m, lo, unit)} iki {formatValue(m, hi, unit)} {u}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="compare" role="group" aria-labelledby="compare-title">
        <h4 id="compare-title">Palyginkite du tyrimus</h4>
        <p className="hint">
          Pokytis laikomas tikru tik tada, kai jis didesnis už natūralų svyravimą: BCH daugiau nei{' '}
          {pct(referenceChangeValue('tc'))}, DTL daugiau nei {pct(referenceChangeValue('hdl'))}, MTL daugiau nei{' '}
          {pct(referenceChangeValue('ldl'))}, trigliceridų – net daugiau nei {pct(referenceChangeValue('tg'))}.
        </p>
        <div className="compare-fields">
          <label className="field">
            <span className="field-label">Rodiklis</span>
            <select value={marker} onChange={(e) => setCompare({ ...compare, marker: e.target.value })}>
              {MARKERS.map((m) => (
                <option key={m} value={m}>
                  {MARKER_SHORT[m]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Ankstesnis ({u})</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={compare.earlier}
              onChange={(e) => setCompare({ ...compare, earlier: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">Naujesnis ({u})</span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={compare.later}
              onChange={(e) => setCompare({ ...compare, later: e.target.value })}
            />
          </label>
        </div>
        {result && (
          <p className={`formula-result verdict-${result.significant ? 'mismatch' : 'match'}`} aria-live="polite">
            Pokytis {result.change > 0 ? '+' : '−'}
            {pct(Math.abs(result.change))}.{' '}
            {result.significant
              ? `Tai daugiau nei ${pct(result.rcv)} – greičiausiai tikras pokytis (arba skyrėsi tyrimo sąlygos, pvz., valgėte ar gėrėte alkoholio).`
              : `Tai mažiau nei ${pct(result.rcv)} – gali būti vien natūralus svyravimas.`}
          </p>
        )}
      </div>

      <details>
        <summary>Kaip gauti patikimesnius rezultatus</summary>
        <ul>
          <li>Nevalgykite 10–12 valandų prieš tyrimą (ypač svarbu trigliceridams); vandenį gerti galima.</li>
          <li>Negerkite alkoholio 1–2 dienas prieš tyrimą; alkoholis stipriai padidina trigliceridus.</li>
          <li>Išvakarėse venkite neįprastai riebios ar saldžios vakarienės ir intensyvaus sporto.</li>
          <li>Neikite tirtis sergant ar ką tik pasveikus: ūmi liga laikinai keičia lipidus.</li>
          <li>Kartokite tyrimą panašiomis sąlygomis (tuo pačiu paros metu, toje pačioje laboratorijoje).</li>
          <li>Svarbiems sprendimams remkitės 2–3 tyrimų vidurkiu, o ne vienu rezultatu.</li>
        </ul>
      </details>
      <details>
        <summary>Moksliniai šaltiniai</summary>
        <SourceList sources={[SOURCES.smith1993, SOURCES.fraser2011, SOURCES.nordestgaard2016]} />
      </details>
    </div>
  );
}
