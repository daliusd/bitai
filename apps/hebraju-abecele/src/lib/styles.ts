// Ways Hebrew letters are written: printed books, block letters, and handwriting.

export type StyleId = 'knyginis' | 'spausdintinis' | 'rasytinis';

export const STYLES: { id: StyleId; label: string; description: string }[] = [
  { id: 'knyginis', label: 'Knyginis', description: 'kaip knygose' },
  { id: 'spausdintinis', label: 'Spausdintinis', description: 'paprastos raidės' },
  { id: 'rasytinis', label: 'Rašytinis', description: 'ranka rašytas' },
];

export const ALL_STYLES: StyleId[] = STYLES.map((s) => s.id);

export function isStyleList(v: unknown): v is StyleId[] {
  return Array.isArray(v) && v.length > 0 && v.every((s) => ALL_STYLES.includes(s));
}
