import type { ConsistencyResult } from '../lib/consistency';
import type { Unit } from '../lib/types';
import { MARKER_NAMES } from '../lib/reference';
import { formatDelta, formatValue, unitLabel } from '../lib/units';

interface Props {
  result: ConsistencyResult;
  unit: Unit;
}

export default function ConsistencyCheck({ result, unit }: Props) {
  const u = unitLabel(unit);
  // In mg/dL the VLDL estimate is TG / 5 instead of TG / 2.2.
  const tgDivisor = unit === 'mmol' ? '2,2' : '5';
  const { lipids } = result;

  return (
    <div className="formula" aria-live="polite">
      <h3>Ar rodikliai dera tarpusavyje?</h3>
      <p className="formula-line">
        <span>BCH</span> ≈ <span>MTL</span> + <span>DTL</span> + <span>TG</span> / {tgDivisor}
      </p>
      <p className="hint">
        Bendrąjį cholesterolį sudaro MTL, DTL ir labai mažo tankio lipoproteinų (LMTL) cholesterolis. Pastarąjį
        apytiksliai parodo trigliceridai padalinti iš {tgDivisor} (Friedewald formulė). Todėl, žinant tris rodiklius,
        galima patikrinti ketvirtą.
      </p>

      {result.verdict === 'incomplete' && !result.inferred && (
        <p className="formula-empty">Įveskite bent tris rodiklius, ir čia pamatysite skaičiavimą.</p>
      )}

      {result.inferred && lipids && (
        <p className="formula-result">
          Trūkstamas rodiklis – {MARKER_NAMES[result.inferred.marker].toLowerCase()} – pagal formulę būtų apie{' '}
          <strong>
            {formatValue(result.inferred.marker, result.inferred.value, unit)} {u}
          </strong>
          . Šią reikšmę naudojame prognozei.
        </p>
      )}

      {result.computedTc !== undefined && lipids && (
        <>
          <p className="formula-line formula-numbers">
            {formatValue('ldl', lipids.ldl, unit)} + {formatValue('hdl', lipids.hdl, unit)} +{' '}
            {formatValue('tg', lipids.tg, unit)} / {tgDivisor} ={' '}
            <strong>
              {formatValue('tc', result.computedTc, unit)} {u}
            </strong>
          </p>
          <p className={`formula-result verdict-${result.verdict}`}>
            {result.verdict === 'match' ? 'Atitinka: ' : 'Neatitinka: '}
            įvestas bendrasis cholesterolis {formatValue('tc', lipids.tc, unit)} {u}, skirtumas{' '}
            {formatDelta('tc', result.difference ?? 0, unit)} {u}.{' '}
            {result.verdict === 'match'
              ? 'Rodikliai dera tarpusavyje.'
              : `Patikrinkite, ar gerai įvedėte skaičius ir vienetus. Nedidelis skirtumas galimas, jei MTL laboratorijoje išmatuotas tiesiogiai, o ne apskaičiuotas.`}
          </p>
        </>
      )}

      {result.warnings.map((w) => (
        <p className="warning" key={w}>
          {w}
        </p>
      ))}
    </div>
  );
}
