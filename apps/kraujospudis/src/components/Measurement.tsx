import type { Summary } from '../lib/readings';
import { formatMmHg } from '../lib/units';
import { SOURCES } from '../lib/sources';
import { SourceList } from './InterventionSection';

interface Props {
  summary?: Summary;
}

/** Above this systolic spread (mmHg) readings are unusually inconsistent. */
export const WIDE_SPREAD = 20;

export default function Measurement({ summary }: Props) {
  return (
    <div className="reliability">
      <h3>Kiek galima pasitikėti matavimu?</h3>
      <p>
        Kraujospūdis kinta kas minutę: jį keičia judėjimas, kalbėjimas, stresas, kava, rūkymas, pilna šlapimo pūslė ir
        net tai, kaip laikote ranką. Gydytojo kabinete jis dažnai būna didesnis nei namuose („baltojo chalato“ efektas),
        o kartais – atvirkščiai. Todėl gairės diagnozę rekomenduoja grįsti keliais matavimais, geriausia – namuose.
      </p>

      {summary && summary.count >= 2 && (
        <p className={`formula-result verdict-${summary.sysSpread > WIDE_SPREAD ? 'mismatch' : 'match'}`}>
          Jūsų sistolinio kraujospūdžio matavimai skiriasi iki {formatMmHg(summary.sysSpread)} mmHg.{' '}
          {summary.sysSpread > WIDE_SPREAD
            ? 'Tai daug – patikrinkite, ar matuojate vienodomis sąlygomis, ir remkitės daugelio matavimų vidurkiu.'
            : 'Toks svyravimas įprastas.'}
        </p>
      )}

      <details open>
        <summary>Kaip matuoti teisingai</summary>
        <ul>
          <li>Prieš matuodami 30 min nerūkykite, negerkite kavos ir nesportuokite; ištuštinkite šlapimo pūslę.</li>
          <li>Ramiai pasėdėkite 5 min. Sėdėkite atsirėmę, kojų nesukryžiuokite, pėdos ant grindų.</li>
          <li>Ranka turi gulėti ant stalo, manžetė – širdies lygyje, ant plikos rankos.</li>
          <li>Manžetė turi tikti rankos apimčiai: per maža padidina rezultatą, per didelė – sumažina.</li>
          <li>Matuodami nekalbėkite ir nežiūrėkite į telefoną.</li>
          <li>Matuokite 2 kartus su 1 min pertrauka ir užrašykite abu rezultatus.</li>
          <li>Naudokite patikrintą (validuotą) žasto aparatą; riešo aparatai mažiau tikslūs.</li>
        </ul>
      </details>
      <details>
        <summary>Kaip matuoti namuose diagnozei patikslinti</summary>
        <ul>
          <li>Matuokite 7 dienas (bent 3) iš eilės: ryte prieš vaistus ir pusryčius bei vakare.</li>
          <li>Kiekvieną kartą – po 2 matavimus su 1 min pertrauka.</li>
          <li>Pirmos dienos matavimus atmeskite, o likusių vidurkį palyginkite su namų ribomis (hipertenzija – nuo 135/85).</li>
          <li>Likusius matavimus įveskite čia – skaičiuoklė apskaičiuos vidurkį.</li>
        </ul>
      </details>
      <details>
        <summary>Moksliniai šaltiniai</summary>
        <SourceList sources={[SOURCES.stergiou2021, SOURCES.kallioinen2017, SOURCES.esc2024]} />
      </details>
    </div>
  );
}
