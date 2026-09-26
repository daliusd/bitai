import type { Setting } from '../lib/types';
import type { Summary } from '../lib/readings';
import type { Category } from '../lib/reference';
import { CATEGORY_LABELS, CATEGORY_TONE, categoryRange, classify, isolatedType } from '../lib/reference';
import { formatBp } from '../lib/units';
import StatusBadge from './StatusBadge';

interface Props {
  summary?: Summary;
  setting: Setting;
}

const SCALE: Category[] = ['nonElevated', 'elevated', 'hypertension', 'severe'];

const ADVICE: Record<Category, string> = {
  low:
    'Žemas kraujospūdis be simptomų dažniausiai nepavojingas. Jei svaigsta galva, silpna ar alpstate, ypač atsistojus ar vartojant vaistus nuo kraujospūdžio, pasitarkite su gydytoju.',
  nonElevated:
    'Kraujospūdis rekomenduojamose ribose. Gairės siūlo jį pasitikrinti bent kas 3 metus (nuo 40 m. – kasmet) ir išlaikyti sveikus įpročius.',
  elevated:
    'Tai dar ne hipertenzija, bet širdies ir kraujagyslių ligų rizika jau didesnė. Gairės pirmiausia rekomenduoja gyvensenos pokyčius. Jei bendra rizika didelė (pvz., sergate diabetu, inkstų ar širdies liga), gydytojas gali pasiūlyti ir vaistų.',
  hypertension:
    'Tai atitinka hipertenziją. Diagnozę reikia patvirtinti pakartotiniais matavimais (geriausia – savaitę matuojant namuose). Pasitarkite su gydytoju: dažniausiai kartu su gyvensenos pokyčiais skiriami vaistai. Gydymo tikslas daugumai – sistolinis 120–129 mmHg.',
  severe:
    'Labai aukštas kraujospūdis. Pakartokite matavimą po kelių minučių ramybės. Jei jis išlieka toks, kreipkitės į gydytoją tą pačią dieną. Jei jaučiate krūtinės skausmą, dusulį, stiprų galvos skausmą, regos ar kalbos sutrikimą, silpnumą – skambinkite 112.',
};

export default function Result({ summary, setting }: Props) {
  if (!summary) {
    return (
      <div className="formula" aria-live="polite">
        <h3>Jūsų kraujospūdis</h3>
        <p className="formula-empty">Įveskite bent vieną matavimą, ir čia pamatysite vidurkį bei įvertinimą.</p>
      </div>
    );
  }
  const category = classify(summary.average, setting);
  const isolated = isolatedType(summary.average, setting);

  return (
    <div className="formula" aria-live="polite">
      <h3>Jūsų kraujospūdis</h3>
      <p className="bp-average" data-testid="average">
        <strong className={`status-text-${CATEGORY_TONE[category]}`}>{formatBp(summary.average)}</strong>{' '}
        <span className="unit">mmHg</span> <StatusBadge category={category} />
      </p>
      <p className="hint">
        {summary.used === 1
          ? 'Vienas matavimas. '
          : `Vidurkis iš ${summary.used} matavimų${summary.droppedFirst ? ' (pirmasis neįskaičiuotas)' : ''}. `}
        Įvertinta pagal {setting === 'home' ? 'namuose matuoto' : 'gydytojo kabinete matuoto'} kraujospūdžio ribas.
      </p>

      <ol className="bp-scale" aria-label="Kraujospūdžio kategorijos">
        {SCALE.map((c) => (
          <li key={c} className={c === category ? `current tone-${CATEGORY_TONE[c]}` : undefined}>
            <span>{CATEGORY_LABELS[c]}</span>
            <span className="bp-scale-range">{categoryRange(c, setting)}</span>
          </li>
        ))}
      </ol>

      <p className={`formula-result verdict-${category === 'nonElevated' ? 'match' : 'mismatch'}`}>
        {ADVICE[category]}
      </p>
      {isolated === 'systolic' && (
        <p className="warning">
          Padidėjęs tik sistolinis (viršutinis) skaičius – izoliuota sistolinė hipertenzija, dažna vyresniame amžiuje.
          Ji tokia pat svarbi kaip ir įprasta hipertenzija.
        </p>
      )}
      {isolated === 'diastolic' && (
        <p className="warning">
          Padidėjęs tik diastolinis (apatinis) skaičius – dažniau pasitaiko jaunesniems žmonėms. Kategoriją lemia didesnis
          iš dviejų rodiklių.
        </p>
      )}
      {category === 'severe' && (
        <p className="alert" role="note">
          Kraujospūdis ≥ 180/110 mmHg. Jei kartu jaučiate krūtinės skausmą, dusulį, stiprų galvos skausmą, regos ar
          kalbos sutrikimą ar silpnumą, skambinkite 112.
        </p>
      )}
    </div>
  );
}
