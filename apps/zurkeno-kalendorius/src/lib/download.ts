import type { Assets, CalendarOptions } from './pdf';
import type { Icon } from './schedule';

let assets: Promise<Assets> | undefined;

async function fetchBytes(path: string): Promise<ArrayBuffer> {
  const res = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.arrayBuffer();
}

async function loadAssets(icons: Icon[]): Promise<Assets> {
  const [regular, bold, ...pngs] = await Promise.all([
    fetchBytes('fonts/ComicRelief-Regular.ttf'),
    fetchBytes('fonts/ComicRelief-Bold.ttf'),
    ...icons.map((i) => fetchBytes(`art/${i}.png`)),
  ]);
  return { regular, bold, images: Object.fromEntries(icons.map((i, n) => [i, pngs[n]])) as Assets['images'] };
}

/** Builds the calendar PDF in the browser; pdf-lib is loaded only when first needed. */
export async function generatePdf(opts: CalendarOptions): Promise<{ blob: Blob; fileName: string }> {
  const { buildCalendarPdf, pdfFileName, ICONS } = await import('./pdf');
  assets ??= loadAssets(ICONS).catch((e) => {
    assets = undefined;
    throw e;
  });
  const bytes = await buildCalendarPdf(opts, await assets);
  return { blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }), fileName: pdfFileName(opts.name, opts.year, opts.month) };
}

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
