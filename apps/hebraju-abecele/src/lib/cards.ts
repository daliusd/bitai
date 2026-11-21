// Hebrew letters, vowel points (nikud) and syllables with Lithuanian transcription.
// Pronunciation is modern Israeli (Sephardic-based), the one taught in Hebrew courses.

export type DeckId = 'raides' | 'balses' | 'skiemenys';

export interface Card {
  id: string;
  deck: DeckId;
  /** What the front of the card shows. */
  hebrew: string;
  /** Lithuanian transcription; empty for silent letters. */
  sound: string;
  /** Name of the letter or vowel, e.g. "Bet" or "Bet + Kamac". */
  name: string;
  /** Optional explanation shown under the name. */
  hint?: string;
}

export const DECKS: { id: DeckId; label: string; description: string }[] = [
  { id: 'raides', label: 'Raidės', description: 'priebalsiai ir galinės formos' },
  { id: 'balses', label: 'Balsės', description: 'nikudo ženklai' },
  { id: 'skiemenys', label: 'Skiemenys', description: 'raidė + balsė' },
];

const DAGESH = 'ּ';
const SHIN_DOT = 'ׁ';
const SIN_DOT = 'ׂ';
/** Placeholder base so a vowel mark has something to sit on. */
export const DOTTED_CIRCLE = '◌';

const V = {
  sheva: 'ְ',
  hatafSegol: 'ֱ',
  hatafPatah: 'ֲ',
  hatafQamats: 'ֳ',
  hiriq: 'ִ',
  tsere: 'ֵ',
  segol: 'ֶ',
  patah: 'ַ',
  qamats: 'ָ',
  holam: 'ֹ',
  qubuts: 'ֻ',
};

const VAV = 'ו';
const YOD = 'י';

interface Letter {
  id: string;
  hebrew: string;
  sound: string;
  name: string;
  hint?: string;
  /** Final forms are only written at the end of a word, so they get no syllables. */
  final?: boolean;
}

function example(sound: string, word: string): string {
  return `${sound} kaip „${word}“`;
}

const SILENT = 'Tylioji raidė: skamba tik po ja parašyta balsė.';

const LETTERS: Letter[] = [
  { id: 'alef', hebrew: 'א', sound: '', name: 'Alef', hint: SILENT },
  { id: 'bet', hebrew: 'ב' + DAGESH, sound: 'b', name: 'Bet', hint: example('b', 'batas') + '. Su tašku viduje (dagešu).' },
  { id: 'vet', hebrew: 'ב', sound: 'v', name: 'Vet', hint: example('v', 'vanduo') + '. Be taško viduje.' },
  { id: 'gimel', hebrew: 'ג', sound: 'g', name: 'Gimel', hint: example('g', 'gėlė') },
  { id: 'dalet', hebrew: 'ד', sound: 'd', name: 'Dalet', hint: example('d', 'durys') },
  { id: 'he', hebrew: 'ה', sound: 'h', name: 'He', hint: example('h', 'humoras') + '. Žodžio gale dažniausiai netariama.' },
  { id: 'vav', hebrew: VAV, sound: 'v', name: 'Vav', hint: example('v', 'vanduo') + '. Su tašku tampa balse: וֹ – o, וּ – u.' },
  { id: 'zayin', hebrew: 'ז', sound: 'z', name: 'Zajin', hint: example('z', 'zuikis') },
  { id: 'het', hebrew: 'ח', sound: 'ch', name: 'Chet', hint: example('ch', 'chaosas') },
  { id: 'tet', hebrew: 'ט', sound: 't', name: 'Tet', hint: example('t', 'tėtis') + '. Skamba taip pat kaip Tav.' },
  { id: 'yod', hebrew: YOD, sound: 'j', name: 'Jud', hint: example('j', 'jūra') },
  { id: 'kaf', hebrew: 'כ' + DAGESH, sound: 'k', name: 'Kaf', hint: example('k', 'katė') + '. Su tašku viduje.' },
  { id: 'khaf', hebrew: 'כ', sound: 'ch', name: 'Chaf', hint: example('ch', 'chaosas') + '. Be taško viduje.' },
  { id: 'khaf-sofit', hebrew: 'ך', sound: 'ch', name: 'Galinė Chaf', hint: 'Rašoma tik žodžio gale.', final: true },
  { id: 'lamed', hebrew: 'ל', sound: 'l', name: 'Lamed', hint: example('l', 'lapas') },
  { id: 'mem', hebrew: 'מ', sound: 'm', name: 'Mem', hint: example('m', 'mama') },
  { id: 'mem-sofit', hebrew: 'ם', sound: 'm', name: 'Galinė Mem', hint: 'Rašoma tik žodžio gale.', final: true },
  { id: 'nun', hebrew: 'נ', sound: 'n', name: 'Nun', hint: example('n', 'namas') },
  { id: 'nun-sofit', hebrew: 'ן', sound: 'n', name: 'Galinė Nun', hint: 'Rašoma tik žodžio gale.', final: true },
  { id: 'samekh', hebrew: 'ס', sound: 's', name: 'Samech', hint: example('s', 'saulė') },
  { id: 'ayin', hebrew: 'ע', sound: '', name: 'Ajin', hint: SILENT },
  { id: 'pe', hebrew: 'פ' + DAGESH, sound: 'p', name: 'Pe', hint: example('p', 'pienas') + '. Su tašku viduje.' },
  { id: 'fe', hebrew: 'פ', sound: 'f', name: 'Fe', hint: example('f', 'fėja') + '. Be taško viduje.' },
  { id: 'fe-sofit', hebrew: 'ף', sound: 'f', name: 'Galinė Fe', hint: 'Rašoma tik žodžio gale.', final: true },
  { id: 'tsadi', hebrew: 'צ', sound: 'c', name: 'Cadi', hint: example('c', 'cukrus') },
  { id: 'tsadi-sofit', hebrew: 'ץ', sound: 'c', name: 'Galinė Cadi', hint: 'Rašoma tik žodžio gale.', final: true },
  { id: 'qof', hebrew: 'ק', sound: 'k', name: 'Kuf', hint: example('k', 'katė') + '. Skamba taip pat kaip Kaf.' },
  { id: 'resh', hebrew: 'ר', sound: 'r', name: 'Reš', hint: example('r', 'ranka') + ' (tariama gerklėje).' },
  { id: 'shin', hebrew: 'ש' + SHIN_DOT, sound: 'š', name: 'Šin', hint: example('š', 'šuo') + '. Taškas dešinėje.' },
  { id: 'sin', hebrew: 'ש' + SIN_DOT, sound: 's', name: 'Sin', hint: example('s', 'saulė') + '. Taškas kairėje.' },
  { id: 'tav', hebrew: 'ת', sound: 't', name: 'Tav', hint: example('t', 'tėtis') },
];

interface Vowel {
  id: string;
  /** Mark written under/over the consonant. */
  mark: string;
  /** Vowel letter written after the consonant (holam male, shuruk, hiriq male, tsere male). */
  after?: string;
  sound: string;
  name: string;
  hint?: string;
  /** Used to build syllables. */
  inSyllables: boolean;
}

const VOWELS: Vowel[] = [
  { id: 'patah', mark: V.patah, sound: 'a', name: 'Patach', hint: 'Brūkšnelis po raide.', inSyllables: true },
  { id: 'qamats', mark: V.qamats, sound: 'a', name: 'Kamac', hint: 'Skamba kaip Patach. Retais atvejais (kamac katan) – o.', inSyllables: true },
  { id: 'hiriq', mark: V.hiriq, sound: 'i', name: 'Chirik', hint: 'Taškas po raide.', inSyllables: true },
  { id: 'hiriq-male', mark: V.hiriq, after: YOD, sound: 'i', name: 'Chirik su Jud', inSyllables: false },
  { id: 'tsere', mark: V.tsere, sound: 'e', name: 'Cerė', hint: 'Du taškai po raide. Kartais tariama ei.', inSyllables: true },
  { id: 'tsere-male', mark: V.tsere, after: YOD, sound: 'e', name: 'Cerė su Jud', hint: 'Dažnai tariama ei.', inSyllables: false },
  { id: 'segol', mark: V.segol, sound: 'e', name: 'Segol', hint: 'Trys taškai po raide.', inSyllables: true },
  { id: 'holam', mark: V.holam, sound: 'o', name: 'Cholam', hint: 'Taškas virš raidės, kairėje.', inSyllables: true },
  { id: 'holam-male', mark: '', after: VAV + V.holam, sound: 'o', name: 'Cholam malė', hint: 'Vav su tašku viršuje.', inSyllables: true },
  { id: 'qubuts', mark: V.qubuts, sound: 'u', name: 'Kubuc', hint: 'Trys įstrižai išdėstyti taškai.', inSyllables: true },
  { id: 'shuruq', mark: '', after: VAV + DAGESH, sound: 'u', name: 'Šuruk', hint: 'Vav su tašku viduje.', inSyllables: true },
  { id: 'sheva', mark: V.sheva, sound: 'e / –', name: 'Ševa', hint: 'Du taškai vienas virš kito. Trumpas e arba visai netariama.', inSyllables: false },
  { id: 'hataf-patah', mark: V.hatafPatah, sound: 'a', name: 'Chataf patach', hint: 'Trumpas a.', inSyllables: false },
  { id: 'hataf-segol', mark: V.hatafSegol, sound: 'e', name: 'Chataf segol', hint: 'Trumpas e.', inSyllables: false },
  { id: 'hataf-qamats', mark: V.hatafQamats, sound: 'o', name: 'Chataf kamac', hint: 'Trumpas o.', inSyllables: false },
];

function letterCards(): Card[] {
  return LETTERS.map((l) => ({
    id: `r-${l.id}`,
    deck: 'raides',
    hebrew: l.hebrew,
    sound: l.sound,
    name: l.name,
    hint: l.hint,
  }));
}

function vowelCards(): Card[] {
  return VOWELS.map((v) => ({
    id: `b-${v.id}`,
    deck: 'balses',
    // Holam male and shuruk are full letters; the rest need a placeholder base.
    hebrew: v.mark ? DOTTED_CIRCLE + v.mark + (v.after ?? '') : (v.after ?? ''),
    sound: v.sound,
    name: v.name,
    hint: v.hint,
  }));
}

function syllableCards(): Card[] {
  const cards: Card[] = [];
  for (const l of LETTERS) {
    if (l.final) continue;
    for (const v of VOWELS) {
      if (!v.inSyllables) continue;
      // וּ / וֹ on a consonant Vav are spelled differently (וּוּ, וֹ); leave them out.
      if (l.id === 'vav' && v.after) continue;
      cards.push({
        id: `s-${l.id}-${v.id}`,
        deck: 'skiemenys',
        hebrew: l.hebrew + v.mark + (v.after ?? ''),
        sound: l.sound + v.sound,
        name: `${l.name} + ${v.name}`,
      });
    }
  }
  return cards;
}

export const CARDS: Card[] = [...letterCards(), ...vowelCards(), ...syllableCards()];

export function cardsFor(decks: DeckId[]): Card[] {
  return CARDS.filter((c) => decks.includes(c.deck));
}
