import type { ReactNode } from 'react';
import type { Body, Lifestyle, Lipids, Marker, Unit } from '../lib/types';
import type { Status } from '../lib/reference';
import Priorities from './Priorities';
import type { ActivityTarget, Choices, Effect, FatReplacement, InterventionId, Omega3Dose } from '../lib/interventions';
import { MAX_FIBER_G, PER_KG, applicability } from '../lib/interventions';
import { bmi, energyNeed } from '../lib/body';
import { formatNumber } from '../lib/units';
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
  body: Body;
  lifestyle: Lifestyle;
  maxWeightLoss: number;
  unit: Unit;
  base?: Lipids;
  statuses: Partial<Record<Marker, Status>>;
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

const grams = (v: number) => `${v} g per dieną`;

export default function Interventions({ choices, onChange, effects, body, lifestyle, maxWeightLoss, unit, base, statuses }: Props) {
  const set = <K extends keyof Choices>(key: K, v: Choices[K]) => onChange({ ...choices, [key]: v });
  const kcal = energyNeed(body);
  const whom = body.weight && body.height && body.age ? `Jums (apie ${kcal} kcal per dieną)` : `Vidutiniam suaugusiajam (${kcal} kcal per dieną)`;
  const satFatLimit = Math.round((kcal * 0.1) / 9);
  const satFatStrict = Math.round((kcal * 0.07) / 9);
  const sugarLimit = Math.round((kcal * 0.1) / 4);
  const sugarIdeal = Math.round((kcal * 0.05) / 4);
  const activityPartial = applicability('activity', lifestyle) === 'partial';
  const bmiValue = bmi(body);
  const weightKgLabel = (v: number) =>
    body.weight ? `${v} kg (${formatNumber((v / body.weight) * 100, 0)} % svorio)` : `${v} kg`;

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
          format={weightKgLabel}
          onChange={(v) => set('weightKg', v)}
        />
      ),
      body: (
        <>
          <p>
            73 atsitiktinių imčių tyrimų metaanalizė (32 496 dalyviai) parodė, kad po 6–12 mėnesių mitybos ir
            fizinio aktyvumo programų kiekvienas numestas kilogramas vidutiniškai sumažina MTL{' '}
            {formatNumber(-PER_KG.ldl, 3)} mmol/l, trigliceridus – {formatNumber(-PER_KG.tg, 3)} mmol/l, o DTL
            padidina {formatNumber(PER_KG.hdl, 3)} mmol/l. Tyrimų dalyviai svėrė vidutiniškai 101,6 kg (kūno masės
            indeksas 36,3).
          </p>
          {maxWeightLoss === 0 ? (
            <p className="note">Jūsų kūno masės indeksas jau artimas 18,5 – svorio metimo nesiūlome.</p>
          ) : bmiValue === undefined ? (
            <p className="warning">
              Šis poveikis nustatytas antsvorio turintiems žmonėms. Jei jūsų svoris normalus, svorio metimas
              lipidus greičiausiai pakeis mažiau, nei rodoma. Įveskite svorį ir ūgį – pamatysite savo kūno masės
              indeksą.
            </p>
          ) : bmiValue < 25 ? (
            <p className="warning">
              Jūsų kūno masės indeksas {formatNumber(bmiValue, 1)} – normalus svoris. Tyrimuose dalyvavo daugiausia
              antsvorio turintys žmonės; esant normaliam svoriui, svorio metimo poveikis lipidams greičiausiai
              mažesnis, nei rodoma.
            </p>
          ) : null}
        </>
      ),
      sources: [SOURCES.hasan2020, SOURCES.dattilo1992, SOURCES.zomer2016],
      limitations: [
        'Kol svoris krenta, DTL gali laikinai sumažėti; padidėja, kai svoris stabilizuojasi (Dattilo 1992).',
        'Priaugus svorio atgal, rodikliai grįžta.',
        'Esant normaliam svoriui, svorio metimas nerekomenduojamas; slankiklis neleidžia nukristi žemiau KMI 18,5.',
        'Dalyvių vidutinis kūno masės indeksas buvo 36,3 (nutukimas); esant mažesniam antsvoriui poveikis gali būti mažesnis.',
      ],
    },
    {
      id: 'satFat',
      title: 'Mažiau sočiųjų riebalų',
      certainty: 'high',
      already: '',
      control: (
        <>
          <Slider
            id="satfat"
            label="Kiek sočiųjų riebalų suvalgyti mažiau"
            value={choices.satFatG}
            max={30}
            format={grams}
            onChange={(v) => set('satFatG', v)}
          />
          <Segmented<FatReplacement>
            legend="Kuo juos pakeisite"
            name="satfat-replacement"
            value={choices.satFatReplacement}
            options={[
              { value: 'pufa', label: 'aliejais, riešutais, žuvimi' },
              { value: 'mufa', label: 'alyvuogių aliejumi, avokadais' },
              { value: 'carbs', label: 'duona, kruopomis' },
            ]}
            onChange={(v) => set('satFatReplacement', v)}
          />
        </>
      ),
      body: (
        <>
          <p>
            Sotieji riebalai labiausiai iš visų maisto medžiagų kelia MTL. PSO rekomenduoja, kad jie sudarytų mažiau
            nei 10 % dienos energijos. {whom} tai yra iki <strong>{satFatLimit} g per dieną</strong>; jei MTL
            padidėjęs, ESC gairės siūlo mažiau nei 7 % – iki {satFatStrict} g.
          </p>
          <p>Ką reiškia 10 g sočiųjų riebalų? Apytiksliai tiek jų yra:</p>
          <ul className="equivalents">
            <li>20 g sviesto (pusantro šaukšto)</li>
            <li>12 g kokosų aliejaus (vienas valgomasis šaukštas)</li>
            <li>50 g kietojo sūrio (3 griežinėliai)</li>
            <li>50 ml 30 % riebumo grietinėlės</li>
            <li>80 g rūkytos dešros ar šoninės</li>
            <li>55 g pieniško šokolado</li>
          </ul>
          <p>
            Svarbu, kuo sočiuosius riebalus pakeičiate: skaičiuoklė naudoja PSO užsakytos metaanalizės koeficientus
            kiekvienam 1 % energijos. Geriausia – augaliniai aliejai (rapsų, saulėgrąžų), riešutai, sėklos ir žuvis.
          </p>
        </>
      ),
      sources: [SOURCES.mensink2016, SOURCES.hooper2020, SOURCES.escEas2019],
      limitations: [
        'Pakeitus sočiuosius riebalus rafinuotais angliavandeniais (balta duona, saldumynai), MTL šiek tiek sumažėja, bet padidėja trigliceridai, o širdies ligų rizika beveik nemažėja.',
        'Skirtingi sotieji riebalai veikia nevienodai (pvz., pieno produktų poveikis gali būti mažesnis nei rodo vidurkis).',
        'Jei nežinote, kiek dabar suvalgote sočiųjų riebalų, rinkitės nedidelį sumažinimą – nuo 20–30 g paros kiekio jų nebeturėtų likti per mažai.',
      ],
    },
    {
      id: 'sugar',
      title: 'Mažiau pridėtinio cukraus',
      certainty: 'low',
      already: '',
      control: (
        <Slider
          id="sugar"
          label="Kiek pridėtinio cukraus suvalgyti mažiau"
          value={choices.sugarG}
          max={50}
          step={5}
          format={grams}
          onChange={(v) => set('sugarG', v)}
        />
      ),
      body: (
        <>
          <p>
            Cukrus daugiausia veikia trigliceridus, mažiau – cholesterolį. PSO rekomenduoja pridėtinio cukraus
            mažiau nei 10 % energijos, o geriausia – mažiau nei 5 %. {whom} tai yra iki {sugarLimit} g, o geriausia
            – iki {sugarIdeal} g per dieną.
          </p>
          <ul className="equivalents">
            <li>0,5 l saldaus gėrimo – apie 50 g cukraus</li>
            <li>vaisinis jogurtas – 10–15 g</li>
            <li>arbatinis šaukštelis cukraus – 4–5 g</li>
          </ul>
        </>
      ),
      sources: [SOURCES.teMorenga2014, SOURCES.whoHealthyDiet],
      limitations: [
        'Metaanalizė lygino daugiau ir mažiau cukraus valgiusias grupes; tikslaus poveikio kiekvienam gramui nėra. Skaičiuoklė laiko, kad 50 g per dieną atitinka visą nustatytą skirtumą – tai apytikslis vertinimas.',
        'Dalis naudos atsiranda per mažesnį svorį, todėl kartu su svorio slankikliu poveikis gali būti įskaičiuotas du kartus.',
        'Vaisiuose esantis cukrus nėra „pridėtinis“ – vaisių riboti nereikia.',
      ],
    },
    {
      id: 'fiber',
      title: 'Tirpios skaidulos: avižos, miežiai, balkšvasis gyslotis',
      certainty: 'high',
      already: 'Jau valgote avižų, miežių ar balkšvojo gysločio luobelių – papildomos naudos neskaičiuojame.',
      control: (
        <Slider
          id="fiber"
          label="Kiek tirpių skaidulų pridėti"
          value={choices.fiberG}
          max={MAX_FIBER_G}
          format={grams}
          onChange={(v) => set('fiberG', v)}
        />
      ),
      body: (
        <>
          <p>
            Tirpios skaidulos (pvz., avižų beta gliukanas) žarnyne suriša tulžies rūgštis, todėl kepenys naudoja daugiau
            cholesterolio. 67 tyrimų metaanalizė: kiekvienas gramas tirpių skaidulų per dieną MTL sumažina apie 0,045
            mmol/l.
          </p>
          <ul className="equivalents">
            <li>3 g beta gliukano – apie 75–90 g avižinių dribsnių (didelis dubenėlis košės)</li>
            <li>5 g (šaukštas) balkšvojo gysločio sėklų luobelių (angl. psyllium husk) – apie 3,5 g tirpių skaidulų</li>
            <li>perlinės kruopos, pupelės, lęšiai, obuoliai taip pat turi tirpių skaidulų</li>
          </ul>
        </>
      ),
      sources: [SOURCES.brown1999, SOURCES.whitehead2014],
      limitations: [
        'Tyrimuose vartota 2–10 g per dieną; didesnis kiekis papildomos naudos neįrodė.',
        'Gali pūsti pilvą – kiekį didinkite palaipsniui ir gerkite pakankamai vandens.',
        'Balkšvojo gysločio luobelės gali sulėtinti vaistų įsisavinimą – vartokite su kelių valandų tarpu.',
      ],
    },
    {
      id: 'sterols',
      title: 'Augaliniai steroliai ir stanoliai',
      certainty: 'medium',
      already: 'Jau vartojate sterolių ar stanolių – jų poveikis jūsų rezultatuose jau yra.',
      control: (
        <label className="check">
          <input type="checkbox" checked={choices.sterols} onChange={(e) => set('sterols', e.target.checked)} />
          Vartoti 2 g per dieną (praturtinti margarinai, jogurtai, gėrimai)
        </label>
      ),
      body: (
        <p>
          Steroliai ir stanoliai konkuruoja su cholesteroliu žarnyne ir mažina jo įsisavinimą. Vartojant 1,5–3 g per
          dieną, MTL sumažėja 6–12 %; skaičiuoklė naudoja 8 %. Natūraliai maiste jų per mažai, todėl reikia praturtintų
          produktų.
        </p>
      ),
      sources: [SOURCES.ras2014, SOURCES.escEas2019],
      limitations: [
        'Nėra tyrimų, įrodančių, kad jie sumažina infarktų ar insultų skaičių – įrodytas tik MTL sumažėjimas.',
        'Nerekomenduojami nėščiosioms, žindyvėms ir vaikams iki 5 metų; draudžiami sergant reta liga sitosterolemija.',
        'Šiek tiek mažina karotinoidų įsisavinimą – valgykite daugiau daržovių ir vaisių.',
      ],
    },
    {
      id: 'nuts',
      title: 'Sauja riešutų kasdien',
      certainty: 'medium',
      already: 'Jau valgote riešutų kasdien – jų poveikis jūsų rezultatuose jau yra.',
      control: (
        <label className="check">
          <input type="checkbox" checked={choices.nuts} onChange={(e) => set('nuts', e.target.checked)} />
          Suvalgyti 30 g riešutų per dieną (graikinių, migdolų, lazdyno)
        </label>
      ),
      body: (
        <p>
          61 tyrimo metaanalizė: viena porcija (28 g) riešutų per dieną MTL sumažina apie 0,12 mmol/l, trigliceridus –
          šiek tiek. Riešutai turi daug nesočiųjų riebalų, skaidulų ir augalinių sterolių.
        </p>
      ),
      sources: [SOURCES.delGobbo2015],
      limitations: [
        '30 g riešutų – apie 180–200 kcal. Jei jie nepakeičia kitų užkandžių, galima priaugti svorio.',
        'Rinkitės nesūdytus ir neglazūruotus. Alergiškiems riešutams netinka.',
      ],
    },
    {
      id: 'activity',
      title: 'Fizinis aktyvumas',
      certainty: 'medium',
      already: 'Jau judate daugiau nei 300 min per savaitę – tai rekomenduojamo kiekio viršutinė riba.',
      control: activityPartial ? (
        <label className="check">
          <input
            type="checkbox"
            checked={choices.activity === '300'}
            onChange={(e) => set('activity', e.target.checked ? '300' : 'none')}
          />
          Judėti daugiau – iki 300 min per savaitę
        </label>
      ) : (
        <Segmented<ActivityTarget>
          legend="Aerobinis krūvis (greitas ėjimas, dviratis, plaukimas)"
          name="activity"
          value={choices.activity}
          options={[
            { value: 'none', label: 'nekeičiu' },
            { value: '150', label: '150 min per savaitę' },
            { value: '300', label: '300 min per savaitę' },
          ]}
          onChange={(v) => set('activity', v)}
        />
      ),
      body: (
        <p>
          Reguliarus aerobinis krūvis padidina DTL vidutiniškai 0,065 mmol/l; ilgesnės treniruotės – šiek tiek daugiau.
          MTL jis beveik nekeičia. PSO rekomenduoja 150–300 min vidutinio intensyvumo judėjimo per savaitę – tinka ir
          greitas ėjimas.
        </p>
      ),
      sources: [SOURCES.kodama2007],
      limitations: [
        'Poveikis lipidams nedidelis; pagrindinė judėjimo nauda – mažesnis kraujospūdis, geresnis cukraus kiekis kraujyje ir širdies ištvermė.',
        '300 min poveikis apskaičiuotas pagal ryšį tarp treniruotės trukmės ir DTL – mažiau tikslus.',
        'Sergant širdies ligomis, krūvį pradėkite pasitarę su gydytoju.',
      ],
    },
    {
      id: 'smoking',
      title: 'Mesti rūkyti',
      certainty: 'medium',
      already: 'Nerūkote – puiku, šis veiksnys jau išnaudotas.',
      control: (
        <label className="check">
          <input type="checkbox" checked={choices.quitSmoking} onChange={(e) => set('quitSmoking', e.target.checked)} />
          Mesti rūkyti
        </label>
      ),
      body: (
        <p>
          Metus rūkyti, DTL padidėja vidutiniškai 0,10 mmol/l. Kiti lipidai reikšmingai nesikeičia.
        </p>
      ),
      sources: [SOURCES.maeda2003, SOURCES.forey2013],
      limitations: [
        'Cholesterolio pokytis – mažiausia naudos dalis: metus rūkyti, širdies ligų rizika per kelerius metus sumažėja maždaug perpus.',
        'Metant rūkyti dažnai priaugama svorio – verta tai stebėti.',
      ],
    },
    {
      id: 'alcohol',
      title: 'Atsisakyti alkoholio',
      certainty: 'medium',
      already: 'Negeriate alkoholio – šis veiksnys jau išnaudotas.',
      control: (
        <label className="check">
          <input type="checkbox" checked={choices.reduceAlcohol} onChange={(e) => set('reduceAlcohol', e.target.checked)} />
          Atsisakyti alkoholio
        </label>
      ),
      body: (
        <>
          <p>
            30 g alkoholio per dieną (2–3 standartinės porcijos) padidina trigliceridus ir DTL. Atsisakius alkoholio,
            trigliceridai sumažėja, o DTL – taip pat šiek tiek sumažėja
            {lifestyle.alcohol === 'occasional' ? '; geriant retkarčiais poveikis mažesnis (skaičiuojame ketvirtadalį).' : '.'}
          </p>
          <p>
            Tai, kad prognozėje DTL sumažėja, nėra blogas ženklas: genetiniai tyrimai rodo, kad alkoholio padidintas DTL
            nuo širdies ligų neapsaugo, o mažiau alkoholio – mažesnė širdies ligų rizika.
          </p>
        </>
      ),
      sources: [SOURCES.rimm1999, SOURCES.holmes2014],
      limitations: [
        'Skaičiuoklė laiko, kad reguliariai geriama apie 30 g alkoholio per dieną; geriant daugiau, trigliceridų sumažėjimas gali būti didesnis.',
        'Saugaus alkoholio kiekio nėra – rekomendacija nepriklauso nuo cholesterolio.',
        'Daug geriant, staigus nutraukimas gali būti pavojingas – kreipkitės į gydytoją.',
      ],
    },
    {
      id: 'omega3',
      title: 'Omega-3: žuvų taukai',
      certainty: 'medium',
      already: 'Jau vartojate omega-3 – jų poveikis jūsų rezultatuose jau yra.',
      control: (
        <Segmented<`${Omega3Dose}`>
          legend="EPA ir DHA per dieną (ne kapsulių svoris!)"
          name="omega3"
          value={`${choices.omega3G}` as `${Omega3Dose}`}
          options={[
            { value: '0', label: 'nevartoju' },
            { value: '1', label: '1 g' },
            { value: '2', label: '2 g' },
            { value: '4', label: '4 g (tik su gydytoju)' },
          ]}
          onChange={(v) => set('omega3G', Number(v) as Omega3Dose)}
        />
      ),
      body: (
        <>
          <p>
            Omega-3 riebalų rūgštys EPA ir DHA mažina kepenų gaminamų trigliceridų kiekį. 90 tyrimų metaanalizė rodo,
            kad trigliceridai mažėja beveik tiesiškai su doze; Amerikos širdies asociacija nurodo 20–30 % sumažėjimą
            vartojant 4 g per dieną. Skaičiuoklė naudoja −6 % kiekvienam gramui. Cholesteroliui (MTL) poveikis
            nedidelis.
          </p>
          <ul className="equivalents">
            <li>
              Įprasta 1 g žuvų taukų kapsulė turi tik apie 0,3 g EPA ir DHA – žiūrėkite etiketę. 2 g EPA ir DHA dažnai
              reiškia 6 ir daugiau kapsulių.
            </li>
            <li>100 g lašišos ar skumbrės – apie 1,5–2,5 g EPA ir DHA; silkės – apie 1–1,5 g.</li>
            <li>Dvi riebios žuvies porcijos per savaitę vidutiniškai duoda apie 0,5 g per dieną.</li>
          </ul>
        </>
      ),
      sources: [SOURCES.wang2023, SOURCES.skulasRay2019, SOURCES.gencer2021],
      limitations: [
        'Didina prieširdžių virpėjimo riziką: tyrimuose vidutiniškai 25 %, o vartojant daugiau nei 1 g per dieną – apie 50 %. Tai svarbiausia rizika.',
        'Didelių dozių (2–4 g) vartokite tik pasitarę su gydytoju, ypač vartojant kraujo krešėjimą mažinančius vaistus.',
        'Trigliceridų sumažėjimas didžiausias tiems, kurių jie padidėję; esant normaliems, poveikis mažesnis nei rodo skaičiuoklė.',
        'Mišinys su DHA gali šiek tiek padidinti MTL. Papildai nepakeičia žuvies – valgant žuvį, ji pakeičia mėsą.',
      ],
    },
    {
      id: 'lowCarb',
      title: 'Mažiau angliavandenių',
      certainty: 'medium',
      already: '',
      control: (
        <label className="check">
          <input type="checkbox" checked={choices.lowCarb} onChange={(e) => set('lowCarb', e.target.checked)} />
          Valgyti mažai angliavandenių (mažiau nei 20 % energijos: be duonos, bulvių, saldumynų, mažai kruopų)
        </label>
      ),
      body: (
        <p>
          Palyginus su mažai riebalų turinčia mityba, mažai angliavandenių turinti mityba per pusmetį ir ilgiau labiau
          sumažino trigliceridus (0,26 mmol/l) ir padidino DTL (0,14 mmol/l), bet taip pat padidino MTL (0,16 mmol/l).
          Tai vienas efektyviausių būdų mažinti trigliceridus, bet ne MTL.
        </p>
      ),
      sources: [SOURCES.mansoor2016],
      limitations: [
        'MTL padidėja – jei pagrindinė problema yra MTL, šis kelias gali pakenkti. Jei angliavandenius pakeičiate sviestu ir riebia mėsa, MTL gali padidėti dar labiau.',
        'Tyrimuose lyginta su mažai riebalų turinčia, o ne su įprasta mityba, todėl poveikis įprastai mitybai gali skirtis.',
        'Dalis poveikio atsiranda dėl svorio mažėjimo, o sumažinus cukrų – iš dalies sutampa su cukraus skiltimi.',
        'Vartojant vaistus diabetui gydyti, staigus angliavandenių sumažinimas gali sukelti hipoglikemiją – pasitarkite su gydytoju.',
      ],
    },
  ];

  const ORDER: InterventionId[] = ['weight', 'satFat', 'sugar', 'lowCarb', 'fiber', 'sterols', 'nuts', 'omega3', 'activity', 'smoking', 'alcohol'];
  levers.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
  const available = levers.filter((l) => applicability(l.id, lifestyle) !== 'already');
  const already = levers.filter((l) => applicability(l.id, lifestyle) === 'already');

  return (
    <section className="block" aria-labelledby="levers-title">
      <h2 id="levers-title">Kas galėtų padėti</h2>
      <p className="hint">
        Keiskite nustatymus ir stebėkite prognozę. Kiekvieno pokyčio poveikis – tyrimų vidurkis. Kelių mitybos pokyčių
        bendrą MTL sumažėjimą ribojame iki 30 % – tiek pasiekė geriausiai ištirta derinta „portfelio“ dieta.
      </p>
      <Priorities statuses={statuses} />

      {available.map((l) => (
        <InterventionSection
          key={l.id}
          id={l.id}
          title={l.title}
          certainty={l.certainty}
          effect={effects[l.id]}
          unit={unit}
          base={base}
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
          Statinai MTL sumažina 30–50 % ir daugiau, o kiekvienas 1 mmol/l MTL sumažėjimas apie penktadaliu mažina
          infarkto ir insulto riziką. Ar jų reikia, sprendžia gydytojas, įvertinęs bendrą riziką (amžių, kraujospūdį,
          rūkymą, diabetą, šeimos ligas). Į prognozę vaistų neįtraukiame.
        </p>
        <details>
          <summary>Moksliniai šaltiniai</summary>
          <SourceList sources={[SOURCES.ctt2010, SOURCES.escEas2019]} />
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
        <h3 id="context-title">Druska, miegas ir stresas</h3>
        <p className="hint">Šie veiksniai svarbūs sveikatai, bet cholesteroliui įtakos turi mažai arba jos neįrodyta, todėl į prognozę jų neįtraukiame.</p>
        <div className="context-item">
          <h4>Druska</h4>
          <p>
            Druskos mažinimas cholesterolio nemažina. Cochrane apžvalgoje (daugiau nei 900 dalyvių) sumažinus druską
            bendrasis cholesterolis net šiek tiek padidėjo (+0,13 mmol/l), trigliceridai – +0,08 mmol/l. Tačiau druskos
            mažinimas mažina kraujospūdį, ypač sergantiems hipertenzija (apie −5,7 mmHg), o tai taip pat saugo širdį.
          </p>
          <details>
            <summary>Moksliniai šaltiniai</summary>
            <SourceList sources={[SOURCES.graudal2020]} />
          </details>
        </div>
        <div className="context-item">
          <h4>Miegas</h4>
          <p>
            13 prospektyvinių tyrimų (30 000 dalyvių) apžvalga nerado ryšio tarp miego trukmės ir padidėjusio cholesterolio
            atsiradimo. Pakankamas miegas padeda kontroliuoti svorį ir apetitą, bet tiesioginio poveikio lipidams
            įrodymų nėra.
          </p>
          <details>
            <summary>Moksliniai šaltiniai</summary>
            <SourceList sources={[SOURCES.kruisbrink2017]} />
          </details>
        </div>
        <div className="context-item">
          <h4>Stresas</h4>
          <p>
            Ūmus stresas trumpam padidina cholesterolį, o žmonėms, kurių lipidai į stresą reaguoja stipriau, po kelerių
            metų cholesterolis dažniau būna padidėjęs. Tačiau tai nedidelių stebėjimo tyrimų duomenys; dažniausiai stresas
            veikia netiesiogiai – per mitybą, alkoholį, rūkymą ir mažesnį judėjimą.
          </p>
          <details>
            <summary>Moksliniai šaltiniai</summary>
            <SourceList sources={[SOURCES.steptoe2005]} />
          </details>
        </div>
      </section>

      <p className="note">
        Kitos priemonės, kurių neįtraukėme: sojos baltymai (MTL −3–4 %, nedidelis poveikis), raudonųjų mielių ryžiai
        (juose yra statino – lovastatino, todėl gali turėti tokius pat šalutinius poveikius, o kokybė nekontroliuojama).
      </p>
    </section>
  );
}
