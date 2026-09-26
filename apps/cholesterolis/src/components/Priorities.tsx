import type { Marker } from '../lib/types';
import type { Status } from '../lib/reference';
import { MARKER_NAMES, STATUS_LABELS } from '../lib/reference';

interface Props {
  statuses: Partial<Record<Marker, Status>>;
}

/**
 * Ordered by clinical priority (ESC/EAS 2019): LDL is the primary treatment target;
 * total cholesterol mostly reflects LDL; TG and HDL are risk markers without targets.
 */
const ADVICE: { marker: Marker; text: string }[] = [
  {
    marker: 'ldl',
    text: 'Svarbiausias rodiklis: gairėse MTL yra pagrindinis gydymo tikslas, nes jis tiesiogiai susijęs su aterosklerozės išsivystymu. Jį labiausiai mažina mažiau sočiųjų riebalų, tirpios skaidulos, augaliniai steroliai, riešutai ir svorio metimas.',
  },
  {
    marker: 'tc',
    text: 'Daugiausia atspindi MTL, todėl jį mažina tie patys pokyčiai. Jei MTL normalus, padidėjusį bendrąjį cholesterolį gali lemti didelis DTL – tai nėra blogai.',
  },
  {
    marker: 'tg',
    text: 'Papildomas rizikos žymuo. Juos labiausiai mažina alkoholio atsisakymas, mažiau cukraus ir kitų angliavandenių, svorio metimas ir omega-3. Trigliceridai svyruoja labiausiai iš visų rodiklių, todėl verta įsitikinti, kad tyrimas atliktas nevalgius ir be alkoholio išvakarėse.',
  },
  {
    marker: 'hdl',
    text: 'Rizikos žymuo, bet ne gydymo tikslas: vaistais didinamas DTL širdies ligų rizikos nemažina. DTL padidėja judant, metus rūkyti ir numetus svorio.',
  },
];

export default function Priorities({ statuses }: Props) {
  const entered = Object.keys(statuses).length > 0;
  if (!entered) return null;
  const flagged = ADVICE.filter((a) => statuses[a.marker] && statuses[a.marker] !== 'ok');

  return (
    <div className="priorities" aria-labelledby="priorities-title" role="region">
      <h3 id="priorities-title">Į ką atkreipti dėmesį</h3>
      {flagged.length === 0 ? (
        <p>
          Visi įvesti rodikliai rekomenduojamose ribose. Pokyčiai žemiau vis tiek gali būti naudingi, bet dažniausiai
          svarbiausia – išlaikyti dabartinius įpročius.
        </p>
      ) : (
        <ol>
          {flagged.map((a) => (
            <li key={a.marker}>
              <strong>
                {MARKER_NAMES[a.marker]} – {STATUS_LABELS[statuses[a.marker]!].toLowerCase()}.
              </strong>{' '}
              {a.text}
            </li>
          ))}
        </ol>
      )}
      <p className="hint">
        Eiliškumas pagal 2019 m. ESC/EAS gaires. Kokio MTL siekti, priklauso nuo bendros širdies ligų rizikos (amžiaus,
        kraujospūdžio, rūkymo, diabeto, šeimos ligų) – ją įvertina gydytojas.
      </p>
    </div>
  );
}
