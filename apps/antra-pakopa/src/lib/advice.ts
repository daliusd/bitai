import type { Inputs, Outcome } from './calc';
import { yearsToPension } from './calc';
import { euro } from './format';
import {
  ANNUITY_MIN,
  EARLY_WITHDRAWAL_FEE,
  OWN_CONTRIBUTION_RATE,
  PENSION_YEARS,
  PILLAR3_MIN_YEARS,
  STATE_INCENTIVE_MONTHLY,
} from './law';
import type { WindowStatus } from './law';

export interface Reason {
  id: string;
  title: string;
  text: string;
}

export interface Advice {
  /** Why moving the money out is worth considering. */
  move: Reason[];
  /** What speaks for leaving the money where it is. */
  stay: Reason[];
}

/** Reasons that depend on the person's age, today's date and the numbers entered. */
export function advise(input: Inputs, outcomes: Outcome[], status: WindowStatus): Advice {
  const years = yearsToPension(input.age);
  const pillar2 = outcomes.find((o) => o.id === 'pillar2')!;
  const moved = outcomes.find((o) => o.id === 'etf')!;
  const own = input.salary * 12 * OWN_CONTRIBUTION_RATE;
  const move: Reason[] = [];
  const stay: Reason[] = [];

  if (status.state === 'open') {
    move.push({
      id: 'window',
      title: `Langas užsidaro po ${status.daysLeft} d.`,
      text:
        'Visiškai pasitraukti ir atsiimti savo įmokas su visu investiciniu rezultatu galima tik iki 2027-12-31. ' +
        'Vėliau lieka tik vienkartinė 25 % išmoka arba pasitraukimas dėl sunkios ligos ar netekto dalyvumo.',
    });
  }

  if (years > PILLAR3_MIN_YEARS) {
    move.push({
      id: 'locked',
      title: `II pakopoje pinigai užrakinti dar ${years} m.`,
      text:
        `Jums ${Math.floor(input.age)} m., tad iki pensinio amžiaus II pakopos pinigų laisvai nepasieksite. ` +
        'ETF galite parduoti bet kurią dieną, III pakopos pinigus – atsiimti bet kada (anksčiau laiko – sumokėjus GPM nuo prieaugio). ' +
        'Tai svarbu, jei pinigų gali prireikti būstui, verslui ar juodai dienai.',
    });
  } else if (years > 0) {
    move.push({
      id: 'near',
      title: `Iki pensinio amžiaus liko ${years} m.`,
      text:
        `Likus penkeriems metams ar mažiau, II pakopos pinigus galima atsiimti ir pasibaigus langui, bet tik jei sukaupta mažiau nei ${euro(ANNUITY_MIN / 2)}, ` +
        `ir sumokėjus ${EARLY_WITHDRAWAL_FEE * 100} % „Sodrai“. Pasitraukiant per pereinamąjį laikotarpį šių ribojimų nėra.`,
    });
  }

  const annuityBalance = pillar2.balance;
  if (annuityBalance > ANNUITY_MIN) {
    const freshNote =
      input.rejoin && moved.pillar2Balance <= ANNUITY_MIN && moved.pillar2Balance > 0
        ? ` Pasitraukus ir pradėjus kaupti iš naujo, naujoje II pakopos sąskaitoje susikauptų apie ${euro(moved.pillar2Balance)} – mažiau už ribą, tad ir juos galėtumėte atsiimti iš karto.`
        : '';
    move.push({
      id: 'annuity',
      title: 'Likus tektų pirkti anuitetą',
      text:
        `Pagal šias prielaidas sulaukę pensinio amžiaus II pakopoje turėtumėte apie ${euro(annuityBalance)}. ` +
        `Sukaupus daugiau nei ${euro(ANNUITY_MIN)} (2026 m. riba), privaloma pirkti anuitetą – pinigus gautumėte mažomis dalimis iki gyvos galvos. ` +
        'III pakopos ir ETF pinigus patys sprendžiate, kada ir kiek pasiimti.' +
        freshNote,
    });
  }

  if (input.rejoin && own > 0) {
    const boost = Math.round(((STATE_INCENTIVE_MONTHLY * 12) / own) * 100);
    move.push({
      id: 'rejoin',
      title: 'Paskatos neprarandate',
      text:
        `Pasitraukus galima sudaryti naują II pakopos sutartį ir kaupti iš naujo. Naujos įmokos toliau gautų valstybės paskatą – ` +
        `${euro(STATE_INCENTIVE_MONTHLY * 12)} per metus, t. y. +${boost} % prie jūsų ${euro(own)} įmokų, – o jau sukaupti pinigai būtų laisvi.`,
    });
  }

  move.push({
    id: 'rules',
    title: 'Taisyklės keičiasi, o jūs laukiate ilgiausiai',
    text:
      `II pakopos taisyklės iš esmės keistos 2013, 2019 ir 2026 m. ${years > 0 ? `Per ${years} m. iki jūsų pensijos jos greičiausiai keisis dar ne kartą. ` : ''}` +
      'ETF yra jūsų nuosavybė be jokių kaupimo sutarties sąlygų.',
  });

  if (input.oldThirdPillar) {
    move.push({
      id: 'relief',
      title: 'Jūsų III pakopos sutartis dar turi GPM lengvatą',
      text:
        'Sutartims, sudarytoms iki 2025 m., valstybė grąžina GPM nuo įmokų iki 1 500 € per metus (ne daugiau kaip 25 % apmokestinamųjų pajamų) – ' +
        'iki 300 € kasmet. Dalį atsiimtų pinigų verta įnešti būtent ten, išdalijant per kelerius metus.',
    });
  }

  // What speaks for staying.
  if (own > 0 && !input.rejoin) {
    const boost = Math.round(((STATE_INCENTIVE_MONTHLY * 12) / own) * 100);
    stay.push({
      id: 'incentive',
      title: `Valstybės paskata: +${boost} % prie jūsų įmokų`,
      text:
        `Kaupiant II pakopoje valstybė kasmet prideda ${euro(STATE_INCENTIVE_MONTHLY * 12)} (2026 m.). ` +
        `Per ${years} m. tai ${euro(pillar2.stateIncentive)}, kurių nei III pakopa, nei ETF neduoda. ` +
        'Paskatą galima išsaugoti pasitraukus ir sudarius naują II pakopos sutartį.',
    });
  }

  stay.push({
    id: 'tax',
    title: 'II pakopos prieaugis neapmokestinamas',
    text:
      'Iš investicinės sąskaitos išimant daugiau, nei įnešta, nuo skirtumo mokamas 15 % GPM. II pakopos išmokoms GPM netaikomas, ' +
      `III pakopos – netaikomas, jei sutartis truko bent ${PILLAR3_MIN_YEARS} m. ir iki pensinio amžiaus liko ne daugiau kaip 5 m.`,
  });

  if (input.toSodra > 0) {
    stay.push({
      id: 'sodra',
      title: 'Valstybės dalis virstų „Sodros“ taškais',
      text:
        `Pasitraukus ${euro(input.toSodra)} valstybės ir „Sodros“ įmokų grįžta į „Sodrą“ ir tampa apskaitos vienetais: apie ${euro(moved.sodraMonthly, 2)} per mėn. prie pensijos ` +
        `(~${euro(moved.sodraValue)} per ${PENSION_YEARS} m.). Likus fonde jie toliau būtų investuojami${years >= 10 ? ', o per ilgą laiką tai paprastai duoda daugiau' : ''}.`,
    });
  }

  stay.push({
    id: 'fees',
    title: 'II pakopa pigi',
    text:
      'II pakopos valdymo mokestį riboja įstatymas (iki 0,5 % per metus), III pakopos – ne: ten jis siekia nuo 0,55 % iki daugiau nei 1 %, kartais dar ir įmokos mokestis. ' +
      'Pigesnis už II pakopą tik plataus indekso ETF.',
  });

  stay.push({
    id: 'partial',
    title: 'Yra ir tarpinių kelių',
    text:
      `Likus galima vieną kartą atsiimti iki 25 % sukauptos sumos (ne daugiau, nei patys įmokėjote; iki pensinio amžiaus – atskaičius ${EARLY_WITHDRAWAL_FEE * 100} % „Sodrai“) ` +
      'arba neribotą skaičių kartų metams sustabdyti įmokas. Tam terminas nenustatytas.',
  });

  if (years >= 10) {
    stay.push({
      id: 'discipline',
      title: 'Laisvė – ir pagunda',
      text: `Užrakinti pinigai ${years} m. tikrai dirbs. Atsiimti pinigai uždirbs tik tada, jei juos iš tiesų investuosite ir nepanaudosite kitur.`,
    });
  }

  return { move, stay };
}
