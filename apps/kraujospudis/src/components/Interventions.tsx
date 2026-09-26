import type { ReactNode } from 'react';
import type { Lifestyle } from '../lib/types';
import type { Choices, Effect, ExerciseType, InterventionId } from '../lib/interventions';
import { applicability, maxSalt } from '../lib/interventions';
import { SOURCES } from '../lib/sources';
import type { Source } from '../lib/sources';
import InterventionSection, { SourceList } from './InterventionSection';
import type { Certainty } from './InterventionSection';
import Segmented from './Segmented';
import Slider from './Slider';

interface Props {
  choices: Choices;
  onChange: (choices: Choices) => void;
  effects: Record<InterventionId, Effect>;
  lifestyle: Lifestyle;
  maxWeightLoss: number;
  hypertensive: boolean;
}

interface Lever {
  id: InterventionId;
  title: string;
  certainty: Certainty;
  already: string;
  control: ReactNode;
  body: ReactNode;
  sources: Source[];
  limitations: string[];
}

const formatSalt = (v: number) => `${v.toLocaleString('lt-LT')} g per dieną`;

export default function Interventions({ choices, onChange, effects, lifestyle, maxWeightLoss, hypertensive }: Props) {
  const set = <K extends keyof Choices>(key: K, v: Choices[K]) => onChange({ ...choices, [key]: v });
  const saltMax = maxSalt(lifestyle);
  const activeAlready = applicability('exercise', lifestyle) === 'partial';

  const levers: Lever[] = [
    {
      id: 'weight',
      title: 'Svorio metimas',
      certainty: 'high',
      already: '',
      control: (
        <Slider
          id="weight"
          label="Kiek kilogramų numesti"
          value={choices.weightKg}
          max={maxWeightLoss}
          format={(v) => `${v} kg`}
          onChange={(v) => set('weightKg', v)}
        />
      ),
      body: (
        <>
          <p>
            25 atsitiktinių imčių tyrimų metaanalizė: kiekvienas numestas kilogramas sistolinį kraujospūdį vidutiniškai
            sumažina 1,05 mmHg, diastolinį – 0,92 mmHg. Numetus daugiau nei 5 kg, poveikis buvo aiškiai didesnis.
          </p>
          {maxWeightLoss === 0 && (
            <p className="note">Jūsų kūno masės indeksas jau artimas 18,5 – svorio metimo nesiūlome.</p>
          )}
        </>
      ),
      sources: [SOURCES.neter2003, SOURCES.esc2024],
      limitations: [
        'Tai trumpalaikių ir vidutinės trukmės tyrimų vidurkis; priaugus svorio atgal, kraujospūdis vėl didėja.',
        'Per kilogramą apskaičiuotas poveikis gali būti mažesnis, kai numetama labai daug.',
        'Esant normaliam svoriui, svorio metimas nerekomenduojamas; slankiklis neleidžia nukristi žemiau KMI 18,5.',
      ],
    },
    {
      id: 'salt',
      title: 'Mažiau druskos',
      certainty: 'high',
      already: '',
      control: (
        <Slider
          id="salt"
          label="Kiek druskos suvalgyti mažiau"
          value={Math.min(choices.saltG, saltMax)}
          max={saltMax}
          step={0.5}
          format={formatSalt}
          onChange={(v) => set('saltG', v)}
        />
      ),
      body: (
        <>
          <p>
            Cochrane metaanalizė: druskos suvalgant vidutiniškai 4,4 g per dieną mažiau, sergančiųjų hipertenzija
            kraujospūdis sumažėjo 5,4/2,8 mmHg, o turinčių normalų kraujospūdį – 2,4/1,0 mmHg. Ryšys beveik tiesinis: kuo
            mažiau druskos, tuo mažesnis kraujospūdis.{' '}
            {hypertensive
              ? 'Kadangi jūsų kraujospūdis atitinka hipertenziją, naudojame didesnį poveikį.'
              : 'Kadangi jūsų kraujospūdis neatitinka hipertenzijos (arba jo neįvedėte), naudojame mažesnį poveikį.'}
          </p>
          <p>ESC ir PSO rekomenduoja suvalgyti mažiau nei 5 g druskos per dieną. Kur ji slepiasi (apytiksliai):</p>
          <ul className="equivalents">
            <li>arbatinis šaukštelis druskos – apie 5–6 g</li>
            <li>100 g rūkytos dešros ar kumpio – 2–3 g</li>
            <li>2 riekės duonos (60 g) – apie 0,7–1 g</li>
            <li>sultinio kubelis – apie 4–5 g</li>
            <li>100 g marinuotų ar raugintų daržovių – 1,5–3 g</li>
          </ul>
          {lifestyle.lowSalt && (
            <p className="note">Jau ribojate druską, todėl siūlome sumažinti dar iki {saltMax} g.</p>
          )}
        </>
      ),
      sources: [SOURCES.he2013, SOURCES.filippini2021, SOURCES.esc2024],
      limitations: [
        'Daugiausia druskos gauname ne iš druskinės, o iš duonos, mėsos gaminių, sūrių, padažų ir pusgaminių – verta skaityti etiketes.',
        'Žmonės į druską reaguoja skirtingai: vyresniems ir sergantiems hipertenzija poveikis didesnis.',
        'Kartu su DASH dieta ir druskos pakaitalu bendrą poveikį ribojame (žr. žemiau).',
      ],
    },
    {
      id: 'saltSubstitute',
      title: 'Druskos pakaitalas su kaliu',
      certainty: 'high',
      already: 'Jau naudojate druskos pakaitalą su kaliu – jo poveikis jūsų matavimuose jau yra.',
      control: (
        <label className="check">
          <input
            type="checkbox"
            checked={choices.saltSubstitute}
            onChange={(e) => set('saltSubstitute', e.target.checked)}
          />
          Vietoj įprastos druskos naudoti pakaitalą su kalio chloridu
        </label>
      ),
      body: (
        <p>
          Pakaitaluose dalis natrio chlorido pakeista kalio chloridu, todėl skonis panašus, o natrio mažiau, kalio –
          daugiau. 21 tyrimo metaanalizė: sistolinis kraujospūdis sumažėjo 4,6 mmHg, diastolinis – 1,6 mmHg, poveikis
          panašus įvairiose grupėse. Kalis ir pats mažina kraujospūdį, ypač sergantiems hipertenzija.
        </p>
      ),
      sources: [SOURCES.yin2022, SOURCES.aburto2013],
      limitations: [
        'Netinka sergant inkstų liga ir vartojant kalio kiekį didinančius vaistus (pvz., spironolaktoną, kai kuriuos AKF inhibitorius ar sartanus su kalio papildais) – gali per daug padidėti kalio kiekis kraujyje. Pasitarkite su gydytoju.',
        'Poveikis sutampa su druskos mažinimu – abu kartu tiksliai nesusideda.',
      ],
    },
    {
      id: 'dash',
      title: 'DASH mityba',
      certainty: 'high',
      already: 'Jau maitinatės pagal DASH principus – jų poveikis jūsų matavimuose jau yra.',
      control: (
        <label className="check">
          <input type="checkbox" checked={choices.dash} onChange={(e) => set('dash', e.target.checked)} />
          Maitintis pagal DASH principus
        </label>
      ),
      body: (
        <>
          <p>
            DASH (angl. Dietary Approaches to Stop Hypertension) – mityba, kurioje daug daržovių, vaisių, viso grūdo
            produktų, ankštinių, riešutų ir liesų pieno produktų, mažiau raudonos mėsos, saldumynų ir saldžių gėrimų. 30
            tyrimų metaanalizė: kraujospūdis sumažėjo 3,2/2,5 mmHg, tiek sergantiems hipertenzija, tiek ne.
          </p>
          <ul className="equivalents">
            <li>8–10 porcijų daržovių ir vaisių per dieną</li>
            <li>2–3 porcijos liesų pieno produktų</li>
            <li>4–5 porcijos riešutų, sėklų ar ankštinių per savaitę</li>
          </ul>
        </>
      ),
      sources: [SOURCES.filippou2020, SOURCES.sacks2001],
      limitations: [
        'Didžiausias poveikis – derinant su mažesniu druskos kiekiu (DASH-Sodium tyrimas).',
        'Dalis poveikio gali būti dėl svorio mažėjimo, todėl kartu su svorio slankikliu jis gali būti įskaičiuotas dukart.',
      ],
    },
    {
      id: 'exercise',
      title: 'Fizinis aktyvumas',
      certainty: 'high',
      already: '',
      control: (
        <Segmented<ExerciseType>
          legend={activeAlready ? 'Ką pridėti prie dabartinio aerobinio krūvio' : 'Treniruočių tipas'}
          name="exercise"
          value={choices.exercise}
          options={[
            { value: 'none', label: 'nekeičiu' },
            ...(activeAlready ? [] : [{ value: 'aerobic' as const, label: 'aerobinis' }]),
            { value: 'resistance', label: 'jėgos' },
            { value: 'combined', label: 'aerobinis ir jėgos' },
            { value: 'isometric', label: 'izometriniai' },
          ]}
          onChange={(v) => set('exercise', v)}
        />
      ),
      body: (
        <>
          <p>270 tyrimų tinklinė metaanalizė palygino treniruočių tipus (kraujospūdžio sumažėjimas):</p>
          <ul className="equivalents">
            <li>aerobinis (greitas ėjimas, bėgimas, dviratis, plaukimas, 150 min per savaitę): −4,5/−2,5 mmHg</li>
            <li>jėgos (pratimai su svoriais ar savo kūno svoriu, 2–3 kartus per savaitę): −4,6/−3,0 mmHg</li>
            <li>aerobinis ir jėgos kartu: −6,0/−2,5 mmHg</li>
            <li>
              izometriniai (pvz., „kėdutė“ prie sienos ar rankos plaštakos dinamometro spaudimas: 4 kartai po 2 min, 3
              kartus per savaitę): −8,2/−4,0 mmHg
            </li>
          </ul>
          {activeAlready && (
            <p className="note">
              Jau judate pakankamai, todėl skaičiuojame tik tai, ką kitas treniruočių tipas duoda daugiau nei aerobinis.
            </p>
          )}
        </>
      ),
      sources: [SOURCES.edwards2023, SOURCES.esc2024],
      limitations: [
        'Izometrinių pratimų tyrimų mažiau ir jie trumpesni, todėl jų poveikio įvertis mažiau tikslus.',
        'Skirtingų tipų poveikis tiksliai nesusideda; skaičiuoklė leidžia pasirinkti vieną.',
        'Sergant širdies liga ar esant labai aukštam kraujospūdžiui (≥ 180/110), krūvį pradėkite pasitarę su gydytoju. Izometrinių pratimų metu nesulaikykite kvėpavimo.',
      ],
    },
    {
      id: 'alcohol',
      title: 'Mažiau alkoholio',
      certainty: 'medium',
      already:
        lifestyle.alcohol === 'none'
          ? 'Negeriate alkoholio – šis veiksnys jau išnaudotas.'
          : 'Geriate ne daugiau nei 2 porcijas per dieną – tyrimuose tokio kiekio mažinimas kraujospūdžio reikšmingai nekeitė. Vis dėlto kuo mažiau alkoholio, tuo geriau sveikatai.',
      control: (
        <label className="check">
          <input
            type="checkbox"
            checked={choices.reduceAlcohol}
            onChange={(e) => set('reduceAlcohol', e.target.checked)}
          />
          Gerti bent perpus mažiau alkoholio arba atsisakyti
        </label>
      ),
      body: (
        <p>
          36 tyrimų metaanalizė: poveikis priklauso nuo to, kiek geriama. Geriantiems 6 ir daugiau porcijų per dieną
          sumažinus maždaug perpus, kraujospūdis sumažėjo 5,5/4,0 mmHg; geriantiems iki 2 porcijų reikšmingo poveikio
          nebuvo.{' '}
          {lifestyle.alcohol === 'veryHeavy'
            ? 'Jums skaičiuojame visą poveikį.'
            : 'Geriantiems 3–5 porcijas (arba nenurodžius) skaičiuojame pusę šio poveikio.'}
        </p>
      ),
      sources: [SOURCES.roerecke2017, SOURCES.esc2024],
      limitations: [
        'Poveikis 3–5 porcijas geriantiems (pusė didžiausio) – skaičiuoklės prielaida, tiksliai neišmatuota.',
        'Daug geriant, staigus nutraukimas gali būti pavojingas – kreipkitės į gydytoją.',
      ],
    },
  ];

  const available = levers.filter((l) => applicability(l.id, lifestyle) !== 'already');
  const already = levers.filter((l) => applicability(l.id, lifestyle) === 'already');

  return (
    <section className="block" aria-labelledby="levers-title">
      <h2 id="levers-title">Kas galėtų padėti</h2>
      <p className="hint">
        Keiskite nustatymus ir stebėkite prognozę. Kiekvieno pokyčio poveikis – tyrimų vidurkis, poveikis dažniausiai
        pasireiškia per kelias savaites. Mitybos pokyčių (druskos, pakaitalo ir DASH) bendrą poveikį ribojame pagal
        DASH-Sodium tyrimo rezultatą.
      </p>

      {available.map((l) => (
        <InterventionSection
          key={l.id}
          id={l.id}
          title={l.title}
          certainty={l.certainty}
          effect={effects[l.id]}
          control={l.control}
          sources={l.sources}
          limitations={l.limitations}
        >
          {l.body}
        </InterventionSection>
      ))}

      <section className="lever lever-info" aria-labelledby="lever-meds">
        <header className="lever-head">
          <h3 id="lever-meds">Vaistai</h3>
          <span className="certainty certainty-high">Įrodymai stiprūs</span>
        </header>
        <p>
          Sistolinį kraujospūdį sumažinus 10 mmHg, koronarinės širdies ligos įvykių būna apie penktadaliu mažiau, o
          insultų – daugiau nei trečdaliu mažiau. Net 5 mmHg sumažėjimas apie 10 % sumažina didžiųjų širdies ir
          kraujagyslių įvykių riziką, nepriklausomai nuo pradinio kraujospūdžio. Ar reikia vaistų, sprendžia gydytojas,
          įvertinęs kraujospūdį ir bendrą riziką. Į prognozę vaistų neįtraukiame.
        </p>
        {lifestyle.medication && (
          <p className="note">
            Vartojate vaistus: jei gyvensenos pokyčiai sumažins kraujospūdį ir pradės svaigti galva, pasitarkite su
            gydytoju dėl dozės. Vaistų patys nenutraukite.
          </p>
        )}
        <details>
          <summary>Moksliniai šaltiniai</summary>
          <SourceList sources={[SOURCES.law2009, SOURCES.bplttc2021, SOURCES.esc2024]} />
        </details>
      </section>

      {already.length > 0 && (
        <section className="already" aria-labelledby="already-title">
          <h3 id="already-title">Tai jau darote</h3>
          <ul>
            {already.map((l) => (
              <li key={l.id}>
                <strong>{l.title}.</strong> {l.already}
                <details>
                  <summary>Moksliniai šaltiniai</summary>
                  <SourceList sources={l.sources} />
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="context" aria-labelledby="context-title">
        <h3 id="context-title">Rūkymas, kava, miegas ir stresas</h3>
        <p className="hint">
          Šie veiksniai svarbūs, bet jų ilgalaikis poveikis kraujospūdžiui mažiau aiškus, todėl į prognozę jų neįtraukiame.
        </p>
        <div className="context-item">
          <h4>Rūkymas</h4>
          <p>
            Kiekviena cigaretė kraujospūdį padidina trumpam, bet metus rūkyti ilgalaikis kraujospūdis reikšmingai
            nesumažėja. Vis dėlto metimas rūkyti – viena svarbiausių priemonių širdies ligų ir insulto rizikai mažinti.
          </p>
        </div>
        <div className="context-item">
          <h4>Kava</h4>
          <p>
            Kava kraujospūdį padidina kelioms valandoms, todėl prieš matavimą jos gerti nereikėtų. Įprastas vidutinis
            kavos kiekis ilgainiui kraujospūdžio reikšmingai nedidina.
          </p>
        </div>
        <div className="context-item">
          <h4>Miegas ir stresas</h4>
          <p>
            Trumpas ar prastas miegas ir lėtinis stresas siejami su didesniu kraujospūdžiu. ESC gairės rekomenduoja
            kokybišką miegą ir streso valdymą, tačiau patikimų tyrimų, kiek tai sumažina kraujospūdį, mažai. Knarkiant ir
            jaučiantis mieguistam dieną, verta pasitikrinti dėl miego apnėjos – ji gali didinti kraujospūdį.
          </p>
        </div>
        <details>
          <summary>Moksliniai šaltiniai</summary>
          <SourceList sources={[SOURCES.esc2024]} />
        </details>
      </section>
    </section>
  );
}

