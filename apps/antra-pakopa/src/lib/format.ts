/** Parses user input, accepting "5,2", "5.2" and "12 000". Returns undefined for empty or invalid input. */
export function parseNumber(raw: string): number | undefined {
  const cleaned = raw.trim().replace(/[\s  €%]/g, '').replace(',', '.');
  if (cleaned === '' || !/^\d*\.?\d+$|^\d+\.$/.test(cleaned)) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

/** "12 345 €", with an ordinary space so the text is easy to search and test. */
export function euro(value: number, digits = 0): string {
  const rounded = Number(value.toFixed(digits));
  const [whole, fraction] = Math.abs(rounded).toFixed(digits).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${rounded < 0 ? '−' : ''}${grouped}${fraction ? ',' + fraction : ''} €`;
}

export function percent(value: number): string {
  return `${String(Number(value.toFixed(2))).replace('.', ',')} %`;
}

export function date(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
