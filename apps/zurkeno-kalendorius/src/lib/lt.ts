export const MONTHS = [
  'sausis', 'vasaris', 'kovas', 'balandis', 'gegužė', 'birželis',
  'liepa', 'rugpjūtis', 'rugsėjis', 'spalis', 'lapkritis', 'gruodis',
];

/** Monday first. */
export const WEEKDAYS = ['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'];

export interface NameForms {
  /** Kilmininkas: Pupelės (priežiūros kalendorius), nežadink Pupelės. */
  genitive: string;
  /** Įnagininkas: (žaisk su) Pupele. */
  instrumental: string;
}

/**
 * Declines a pet name the way Lithuanian first names decline. Names with an ending Lithuanian
 * does not decline (Bobo, Max) are returned unchanged, which is how such names are used.
 */
export function declineName(raw: string): NameForms {
  const words = raw.trim().split(/\s+/).map(declineWord);
  return {
    genitive: words.map((w) => w.genitive).join(' '),
    instrumental: words.map((w) => w.instrumental).join(' '),
  };
}

function declineWord(name: string): NameForms {
  const lower = name.toLocaleLowerCase('lt');
  const upper = name.length > 1 && name === name.toLocaleUpperCase('lt') && name !== lower;
  const forms = (cut: number, gen: string, ins: string): NameForms => {
    const stem = name.slice(0, name.length - cut);
    const fix = (s: string) => (upper ? s.toLocaleUpperCase('lt') : s);
    return { genitive: stem + fix(gen), instrumental: stem + fix(ins) };
  };
  // Before -io/-iu a stem-final t or d softens: Rudis -> Rudžio, Katis -> Kačio.
  const soft = (cut: number): NameForms => {
    const before = lower.at(-cut - 1);
    if (before === 't' || before === 'd') {
      const stem = name.slice(0, name.length - cut - 1);
      const ch = upper ? (before === 't' ? 'Č' : 'DŽ') : before === 't' ? 'č' : 'dž';
      const io = upper ? 'IO' : 'io';
      const iu = upper ? 'IU' : 'iu';
      return { genitive: stem + ch + io, instrumental: stem + ch + iu };
    }
    return forms(cut, 'io', 'iu');
  };

  if (lower.length < 3) return { genitive: name, instrumental: name };
  if (lower.endsWith('ias')) return forms(3, 'io', 'iu');
  if (lower.endsWith('as')) return forms(2, 'o', 'u');
  if (lower.endsWith('is') || lower.endsWith('ys')) return soft(2);
  if (lower.endsWith('ius')) return forms(3, 'iaus', 'iumi');
  if (lower.endsWith('us')) return forms(2, 'aus', 'umi');
  if (lower.endsWith('ė')) return forms(1, 'ės', 'e');
  if (lower.endsWith('a')) return forms(1, 'os', 'a');
  return { genitive: name, instrumental: name };
}
