import { useState } from 'react';
import type { ReactNode } from 'react';
import { clearStored, usePersistentState } from './lib/storage';
import { DEFAULT_ASSUMPTIONS, best, compare, estimateToSodra, yearsToPension } from './lib/calc';
import type { Assumptions, Inputs, OptionId, Outcome } from './lib/calc';
import { advise } from './lib/advice';
import type { Reason } from './lib/advice';
import { date, euro, parseNumber, percent } from './lib/format';
import {
  ANNUITY_MAX,
  ANNUITY_MIN,
  PENSION_AGE,
  PENSION_YEARS,
  PILLAR2_FEE_CAP,
  SODRA_UNIT_COST,
  SODRA_UNIT_VALUE,
  SOURCES,
  STATE_INCENTIVE_MONTHLY,
  windowStatus,
} from './lib/law';
import type { WindowStatus } from './lib/law';

interface Raw {
  age: string;
  payout: string;
  toSodra: string;
  salary: string;
  rejoin: boolean;
  oldThirdPillar: boolean;
}

const EMPTY: Raw = { age: '', payout: '', toSodra: '', salary: '', rejoin: true, oldThirdPillar: false };

type RawAssumptions = Record<keyof Assumptions, string>;

const DEFAULT_RAW_ASSUMPTIONS = Object.fromEntries(
  Object.entries(DEFAULT_ASSUMPTIONS).map(([k, v]) => [k, String(v).replace('.', ',')]),
) as RawAssumptions;

const NAMES: Record<OptionId, string> = {
  pillar2: 'Likti II pakopoje',
  pillar3: 'Perkelti į III pakopą',
  etf: 'Perkelti į ETF',
};

const SHORT: Record<OptionId, string> = {
  pillar2: 'II pakopoje',
  pillar3: 'III pakopoje',
  etf: 'ETF',
};

export default function App({ today = new Date() }: { today?: Date }) {
  // Remounting the calculator after clearing storage resets every persisted field.
  const [version, setVersion] = useState(0);
  return (
    <Calculator
      key={version}
      today={today}
      onClear={() => {
        clearStored();
        setVersion((v) => v + 1);
      }}
    />
  );
}

function Calculator({ today, onClear }: { today: Date; onClear: () => void }) {
  const [raw, setRaw] = usePersistentState<Raw>('inputs', EMPTY);
  const [rawAssumptions, setRawAssumptions] = usePersistentState<RawAssumptions>(
    'assumptions',
    DEFAULT_RAW_ASSUMPTIONS,
  );

  const status = windowStatus(today);
  const age = parseNumber(raw.age);
  const payout = parseNumber(raw.payout) ?? 0;
  const salary = parseNumber(raw.salary) ?? 0;
  // The state's part is rarely known by heart, so an empty field falls back to a rough estimate.
  const enteredToSodra = parseNumber(raw.toSodra);
  const estimatedToSodra = estimateToSodra(payout, salary);
  const toSodra = enteredToSodra ?? estimatedToSodra;

  const assumptions = { ...DEFAULT_ASSUMPTIONS };
  for (const key of Object.keys(assumptions) as (keyof Assumptions)[]) {
    const v = parseNumber(rawAssumptions[key]);
    if (v !== undefined && v <= 100) assumptions[key] = v;
  }

  const ageValid = age !== undefined && age >= 18 && age < PENSION_AGE;
  const input: Inputs | undefined = ageValid
    ? { age, payout, toSodra, salary, rejoin: raw.rejoin, oldThirdPillar: raw.oldThirdPillar, year: today.getFullYear() }
    : undefined;
  const outcomes = input ? compare(input, assumptions) : undefined;
  const hasMoney = payout + toSodra + salary > 0;
  const advice = input && outcomes ? advise(input, outcomes, status) : undefined;

  const set = <K extends keyof Raw>(key: K, value: Raw[K]) => setRaw({ ...raw, [key]: value });

  return (
    <div className="page">
      <header className="masthead">
        <p className="crumbs">
          <a href="/">bitai</a> / antra pakopa
        </p>
        <h1>Antra pakopa: likti ar perkelti?</h1>
        <p className="lede">
          Iki 2027 m. pabaigos iš II pensijų pakopos galima pasitraukti ir atsiimti savo pinigus. Įveskite amžių ir
          pažiūrėkite, kodėl gali būti verta juos perkelti į III pakopą arba ETF – ir kiek tai duotų ar kainuotų.
        </p>
        <p className="disclaimer">
          Tai informacinė priemonė, ne investavimo ar mokesčių konsultacija. Skaičiai – prognozė pagal jūsų pasirinktas
          prielaidas, o įstatymai gali keistis. Prieš teikdami prašymą pasitikrinkite sumas savo pensijų kaupimo
          bendrovėje.
        </p>
        <p className="storage-note">
          Įvesti duomenys saugomi tik šioje naršyklėje.{' '}
          <button type="button" className="link-button" onClick={onClear}>
            Ištrinti įvestus duomenis
          </button>
        </p>
      </header>

      <main>
        <WindowBanner status={status} />

        <section className="block" aria-labelledby="inputs-title">
          <h2 id="inputs-title">Jūsų duomenys</h2>
          <div className="fields">
            <Field
              label="Amžius"
              unit="m."
              value={raw.age}
              onChange={(v) => set('age', v)}
              hint="Nuo jo priklauso, kiek metų pinigai dar būtų užrakinti."
            />
            <Field
              label="Atsiimtumėte į sąskaitą"
              unit="€"
              value={raw.payout}
              onChange={(v) => set('payout', v)}
              hint="Jūsų pačių įmokos su investiciniu rezultatu – tiek gautumėte pasitraukę. Preliminarią sumą rodo pensijų kaupimo bendrovė."
            />
            <Field
              label="Valstybės dalis, grįžtanti į „Sodrą“"
              unit="€"
              value={raw.toSodra}
              placeholder={payout > 0 ? `~${euro(estimatedToSodra).replace(' €', '')}` : undefined}
              onChange={(v) => set('toSodra', v)}
              hint={
                <>
                  Nebūtina. Tai valstybės paskata ir iki 2019 m. „Sodros“ pervestos įmokos – jų neatgausite, jos virs
                  „Sodros“ pensijos priedu. Tikslią sumą matysite pensijų kaupimo bendrovės savitarnoje pildydami
                  prašymą.{' '}
                  {enteredToSodra === undefined && payout > 0 && (
                    <span data-testid="sodra-estimate">
                      Kol neįvesta, skaičiuojame apytiksliai: {euro(estimatedToSodra)}.
                    </span>
                  )}
                </>
              }
            />
            <Field
              label="Atlyginimas „ant popieriaus“"
              unit="€/mėn."
              value={raw.salary}
              onChange={(v) => set('salary', v)}
              hint="Būsimoms 3 % įmokoms skaičiuoti. Palikite tuščią, jei toliau nekaupsite."
            />
          </div>
          <div className="checks">
            <label className="check">
              <input type="checkbox" checked={raw.rejoin} onChange={(e) => set('rejoin', e.target.checked)} />
              <span>
                Pasitraukęs vėl kaupčiau II pakopoje nuo nulio
                <small>
                  Naujos įmokos toliau gautų valstybės paskatą ({euro(STATE_INCENTIVE_MONTHLY, 2)} per mėn.). Nepažymėjus
                  jos keliautų ten pat, kur ir atsiimti pinigai.
                </small>
              </span>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={raw.oldThirdPillar}
                onChange={(e) => set('oldThirdPillar', e.target.checked)}
              />
              <span>
                Turiu III pakopos sutartį, sudarytą iki 2025 m.
                <small>Tokioms sutartims dar galioja GPM lengvata įmokoms.</small>
              </span>
            </label>
          </div>
        </section>

        <section className="block" aria-labelledby="result-title">
          <h2 id="result-title">Kiek turėtumėte sulaukę {PENSION_AGE} m.</h2>
          {!ageValid && <AgeMessage age={age} />}
          {input && outcomes && !hasMoney && (
            <p className="empty">Įveskite atsiimamą sumą arba atlyginimą, ir čia matysite palyginimą.</p>
          )}
          {input && outcomes && hasMoney && (
            <Results outcomes={outcomes} input={input} assumptions={assumptions} />
          )}
        </section>

        {advice && input && (
          <section className="block" aria-labelledby="reasons-title">
            <h2 id="reasons-title">Kodėl verta perkelti – ir kodėl ne</h2>
            <div className="reasons">
              <ReasonList title="Už perkėlimą" reasons={advice.move} kind="move" />
              <ReasonList title="Už likimą II pakopoje" reasons={advice.stay} kind="stay" />
            </div>
          </section>
        )}

        <section className="block" aria-labelledby="assumptions-title">
          <h2 id="assumptions-title">Prielaidos</h2>
          <p className="note">
            Sumos rodomos šiandienos pinigais, todėl grąžą įrašykite realią – atmetę infliaciją. Atlyginimas ir paskata
            laikomi nekintančiais, o „Sodros“ pensijos priedas vertinamas šiandienos apskaitos vieneto verte per{' '}
            {PENSION_YEARS} pensijos metų.
          </p>
          <div className="fields">
            <Field
              label="Metinė grąža prieš mokesčius"
              unit="%"
              value={rawAssumptions.grossReturn}
              onChange={(v) => setRawAssumptions({ ...rawAssumptions, grossReturn: v })}
              hint="Vienoda visiems variantams. Pasaulio akcijų ilgalaikė reali grąža – apie 5 %."
            />
            <Field
              label="II pakopos mokestis"
              unit="%"
              value={rawAssumptions.feeII}
              onChange={(v) => setRawAssumptions({ ...rawAssumptions, feeII: v })}
              hint={`0,45 % – „Goindex“ tikslinės grupės fondų valdymo mokestis. Įstatymas leidžia iki ${percent(PILLAR2_FEE_CAP)}; savo fondo mokestį rasite Lietuvos banko palyginime.`}
            />
            <Field
              label="III pakopos mokestis"
              unit="%"
              value={rawAssumptions.feeIII}
              onChange={(v) => setRawAssumptions({ ...rawAssumptions, feeIII: v })}
              hint={
                <>
                  0,55 % – pigiausias rinkoje: „Goindex“ III pakopos fondų valdymo mokestis (su kitomis išlaidomis –
                  iki 1 %). Bankų fonduose dažniausiai apie 1 % ir daugiau, įstatymas neriboja. Įrašykite savo fondo
                  mokestį iš{' '}
                  <a href="https://www.lb.lt/lt/pf-veiklos-rodikliai" rel="noopener">
                    Lietuvos banko palyginimo
                  </a>
                  .
                </>
              }
            />
            <Field
              label="ETF mokestis"
              unit="%"
              value={rawAssumptions.feeETF}
              onChange={(v) => setRawAssumptions({ ...rawAssumptions, feeETF: v })}
              hint="Pasaulio akcijų ETF kainuoja apie 0,1–0,25 % per metus. Pridėkite tarpininko mokesčius."
            />
            <Field
              label="GPM nuo ETF pelno"
              unit="%"
              value={rawAssumptions.gainsTax}
              onChange={(v) => setRawAssumptions({ ...rawAssumptions, gainsTax: v })}
              hint="Investicinėje sąskaitoje – 15 % nuo sumos, viršijančios įnašus, ir tik išsiimant."
            />
            <Field
              label="GPM lengvatos tarifas"
              unit="%"
              value={rawAssumptions.reliefRate}
              onChange={(v) => setRawAssumptions({ ...rawAssumptions, reliefRate: v })}
              hint="Tik senoms III pakopos sutartims: tiek grąžinama nuo įmokų iki 1 500 € per metus."
            />
          </div>
          <button
            type="button"
            className="link-button"
            onClick={() => setRawAssumptions(DEFAULT_RAW_ASSUMPTIONS)}
          >
            Atstatyti prielaidas
          </button>
        </section>

        <section className="block law" aria-labelledby="law-title">
          <h2 id="law-title">Ką sako įstatymai</h2>
          <h3>Pasitraukimas iš II pakopos</h3>
          <ul>
            <li>
              Pereinamasis laikotarpis – nuo 2026-01-01 iki 2027-12-31. Per jį kaupimą galima nutraukti be jokios
              priežasties.
            </li>
            <li>
              Į banko sąskaitą pervedamos jūsų įmokos su investiciniu rezultatu, be mokesčių ir atskaitymų. Valstybės
              biudžeto ir „Sodros“ įmokos grąžinamos „Sodrai“ ir paverčiamos apskaitos vienetais: 2026 m. vienetas
              kainuoja {euro(SODRA_UNIT_COST, 2)} ir prideda {euro(SODRA_UNIT_VALUE, 2)} prie mėnesio pensijos.
            </li>
            <li>
              Prašymas teikiamas savo pensijų kaupimo bendrovei. Prašymai renkami kalendoriniais ketvirčiais, pinigai
              išmokami per pirmąsias 10 kito ketvirčio darbo dienų pagal tos dienos fondo vieneto vertę.
            </li>
            <li>Pasitraukus galima sudaryti naują sutartį ir pradėti kaupti iš naujo.</li>
          </ul>
          <h3>Jei liekate</h3>
          <ul>
            <li>
              Mokate 3 % nuo atlyginimo, valstybė prideda 1,5 % užpraeitų metų vidutinio darbo užmokesčio (2026 m. –{' '}
              {euro(STATE_INCENTIVE_MONTHLY, 2)} per mėn.). Įmokas galima stabdyti metams neribotą skaičių kartų.
            </li>
            <li>
              Vieną kartą galima atsiimti iki 25 % sukauptos sumos, bet ne daugiau, nei patys įmokėjote; iki pensinio
              amžiaus „Sodrai“ atskaitoma 3 %.
            </li>
            <li>
              Netekus 70 % ar daugiau dalyvumo, susirgus sunkia liga iš sąrašo ar prireikus paliatyviosios pagalbos,
              galima atsiimti viską be mokesčių.
            </li>
            <li>
              Sulaukus pensinio amžiaus: sukaupus iki {euro(ANNUITY_MIN)} – vienkartinė arba periodinė išmoka, nuo{' '}
              {euro(ANNUITY_MIN)} iki {euro(ANNUITY_MAX)} – privalomas anuitetas, dalį virš {euro(ANNUITY_MAX)} galima
              atsiimti iš karto (2026 m. ribos).
            </li>
          </ul>
          <h3>III pakopa ir ETF</h3>
          <ul>
            <li>
              III pakopos sutartims, sudarytoms nuo 2025 m., GPM lengvata įmokoms nebetaikoma. Senoms sutartims ji
              galioja įmokoms iki 1 500 € per metus dar maždaug dešimtmetį.
            </li>
            <li>
              III pakopos išmoka neapmokestinama, jei sutartis truko bent 5 metus ir iki pensinio amžiaus liko ne
              daugiau kaip 5 metai. Kitais atvejais mokamas 15 % GPM: nuo prieaugio, o jei naudojotės lengvata – nuo
              visos sumos. Šaltiniai šią dalį aiškina nevienodai, pasitikslinkite VMI.
            </li>
            <li>
              ETF, laikomų investicinėje sąskaitoje, pelnas apmokestinamas 15 % tik tada, kai išsiimate daugiau, nei
              įnešėte. Paprastoje vertybinių popierių sąskaitoje nuo 2026 m. pelnas įskaitomas į progresinius 20–32 %
              tarifus.
            </li>
          </ul>
          <h3>Šaltiniai</h3>
          <ul className="sources">
            {SOURCES.map((s) => (
              <li key={s.url}>
                <a href={s.url} rel="noopener">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="colophon">
        <span>
          2026 © <a href="https://ffff.lt">ffff.lt</a>
        </span>
        <span>Dalius Dobravolskas</span>
        <span>Informacinė priemonė, ne investavimo konsultacija.</span>
      </footer>
    </div>
  );
}

function WindowBanner({ status }: { status: WindowStatus }) {
  if (status.state === 'before') {
    return (
      <p className="banner" role="status">
        Pasitraukti iš II pakopos bus galima nuo 2026-01-01 iki 2027-12-31.
      </p>
    );
  }
  if (status.state === 'closed') {
    return (
      <p className="banner banner-closed" role="status">
        <strong>Pereinamasis laikotarpis baigėsi 2027-12-31.</strong> Visiškai pasitraukti iš II pakopos nebegalima –
        lieka vienkartinė 25 % išmoka ir pasitraukimas dėl sunkios ligos ar netekto dalyvumo. Skaičiuoklė rodo, kaip
        variantai atrodė galiojant langui.
      </p>
    );
  }
  return (
    <p className="banner" role="status">
      <strong>Iki lango pabaigos liko {status.daysLeft} d.</strong> Pateikę prašymą iki {date(status.applyBy)}, pinigus
      gautumėte maždaug iki {date(status.paidBy)}.{' '}
      {status.lastBatch
        ? 'Tai paskutinis ketvirtis, kai galima pasitraukti.'
        : 'Vėliau pateikti prašymai apmokami dar po ketvirčio.'}
    </p>
  );
}

function AgeMessage({ age }: { age: number | undefined }) {
  if (age === undefined) return <p className="empty">Įveskite amžių, ir čia matysite palyginimą bei priežastis.</p>;
  if (age >= PENSION_AGE) {
    return (
      <p className="empty">
        Sulaukus {PENSION_AGE} m. II pakopos pinigus jau galima gauti kaip pensijų išmoką: iki {euro(ANNUITY_MIN)} –
        iš karto, daugiau – perkant anuitetą. Pasitraukimas per pereinamąjį laikotarpį leistų išvengti anuiteto, bet
        valstybės dalis grįžtų į „Sodrą“. Palyginimo iki pensinio amžiaus jums skaičiuoti nebėra ko.
      </p>
    );
  }
  return <p className="empty">Skaičiuoklė skirta 18–{PENSION_AGE - 1} m. amžiaus kaupiantiesiems.</p>;
}

function Field(props: {
  label: string;
  unit: string;
  value: string;
  placeholder?: string;
  hint?: ReactNode;
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">
      <span className="field-label">{props.label}</span>
      <span className="field-input">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={props.value}
          placeholder={props.placeholder}
          onChange={(e) => props.onChange(e.target.value)}
        />
        <span className="field-unit" aria-hidden="true">
          {props.unit}
        </span>
      </span>
      {props.hint && <small className="hint">{props.hint}</small>}
    </label>
  );
}

function Results({ outcomes, input, assumptions }: { outcomes: Outcome[]; input: Inputs; assumptions: Assumptions }) {
  const top = best(outcomes);
  const stay = outcomes.find((o) => o.id === 'pillar2')!;
  const max = Math.max(...outcomes.map((o) => o.total));
  const years = yearsToPension(input.age);
  const fee: Record<OptionId, number> = {
    pillar2: assumptions.feeII,
    pillar3: assumptions.feeIII,
    etf: assumptions.feeETF,
  };

  return (
    <>
      <p className="verdict" data-testid="verdict">
        {top.id === 'pillar2' ? (
          <>
            Pagal šias prielaidas <strong>likti II pakopoje finansiškai naudingiausia</strong>. Laisvė disponuoti
            pinigais kainuotų apie{' '}
            {outcomes
              .filter((o) => o.id !== 'pillar2')
              .map((o) => `${euro(stay.total - o.total)} (${SHORT[o.id]})`)
              .join(' arba ')}{' '}
            per {years} m.
          </>
        ) : (
          <>
            Pagal šias prielaidas <strong>{NAMES[top.id].toLowerCase()}</strong> po {years} m. duotų apie{' '}
            <strong>{euro(top.total - stay.total)} daugiau</strong> nei likti II pakopoje – ir pinigai būtų laisvi.
          </>
        )}
      </p>

      <div className="options">
        {outcomes.map((o) => {
          const diff = o.total - stay.total;
          const movedPart = o.balance - o.pillar2Balance;
          return (
            <article
              key={o.id}
              className={`option${o.id === top.id ? ' option-best' : ''}`}
              data-testid={`option-${o.id}`}
            >
              <header>
                <h3>{NAMES[o.id]}</h3>
                {o.id === top.id && <span className="badge">Daugiausia</span>}
              </header>
              <p className="option-total">{euro(o.total)}</p>
              <div className="bar" aria-hidden="true">
                <span style={{ width: `${max > 0 ? Math.max(0, (o.total / max) * 100) : 0}%` }} />
              </div>
              <p className="option-diff">
                {o.id === 'pillar2'
                  ? 'Atskaitos taškas'
                  : `${diff >= 0 ? '+' : '−'}${euro(Math.abs(diff))} palyginti su likimu`}
              </p>
              <dl>
                {o.id === 'pillar2' ? (
                  <Row term="Sukaupta II pakopoje" value={euro(o.balance)} />
                ) : (
                  <>
                    <Row term={`Sukaupta ${SHORT[o.id]}`} value={euro(movedPart)} />
                    {o.pillar2Balance > 0 && <Row term="Naujoje II pakopos sąskaitoje" value={euro(o.pillar2Balance)} />}
                  </>
                )}
                {o.tax > 0 && <Row term="GPM nuo prieaugio" value={euro(-o.tax)} />}
                {o.relief > 0 && <Row term="Susigrąžinta GPM lengvata" value={`+${euro(o.relief)}`} />}
                {o.sodraValue > 0 && (
                  <Row
                    term={`„Sodros“ pensijos priedas (${euro(o.sodraMonthly, 2)}/mėn., ${PENSION_YEARS} m.)`}
                    value={`+${euro(o.sodraValue)}`}
                  />
                )}
                <Row term="Iš to – jūsų įnešti pinigai" value={euro(o.paidIn)} muted />
                {o.stateIncentive > 0 && <Row term="Iš to – valstybės paskata" value={euro(o.stateIncentive)} muted />}
                <Row term={`Sumokėta fondų mokesčių (${percent(fee[o.id])})`} value={euro(o.fees)} muted />
              </dl>
            </article>
          );
        })}
      </div>
      <p className="note">
        Visur investuojama ta pati suma: šiandien atsiimami {euro(input.payout)} ir 3 % nuo atlyginimo iki {PENSION_AGE}{' '}
        m. II pakopos likutis sulaukus pensinio amžiaus gali būti išmokamas tik pagal anuiteto taisykles – žr. priežastis
        žemiau.
      </p>
    </>
  );
}

function Row({ term, value, muted }: { term: string; value: string; muted?: boolean }) {
  return (
    <div className={muted ? 'row row-muted' : 'row'}>
      <dt>{term}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ReasonList({ title, reasons, kind }: { title: string; reasons: Reason[]; kind: 'move' | 'stay' }) {
  return (
    <div className={`reason-list reason-${kind}`} data-testid={`reasons-${kind}`}>
      <h3>{title}</h3>
      <ol>
        {reasons.map((r) => (
          <li key={r.id}>
            <strong>{r.title}</strong>
            <p>{r.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
