// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { declineName } from './lt';
import { buildDays, startDay } from './schedule';
import { ICONS, buildCalendarPdf, pdfFileName } from './pdf';
import type { Assets } from './pdf';

const pub = (p: string) => readFileSync(resolve(import.meta.dirname, '../../public', p));

function loadAssets(): Assets {
  return {
    regular: pub('fonts/ComicRelief-Regular.ttf'),
    bold: pub('fonts/ComicRelief-Bold.ttf'),
    images: Object.fromEntries(ICONS.map((i) => [i, new Uint8Array(pub(`art/${i}.png`))])) as Assets['images'],
  };
}

describe('declineName', () => {
  it.each([
    ['Pupelė', 'Pupelės', 'Pupele'],
    ['Pūkas', 'Pūko', 'Pūku'],
    ['Mikis', 'Mikio', 'Mikiu'],
    ['Rudis', 'Rudžio', 'Rudžiu'],
    ['Katis', 'Kačio', 'Kačiu'],
    ['Ryžys', 'Ryžio', 'Ryžiu'],
    ['Bulka', 'Bulkos', 'Bulka'],
    ['Darius', 'Dariaus', 'Dariumi'],
    ['Žirnius', 'Žirniaus', 'Žirniumi'],
    ['Kakarius', 'Kakariaus', 'Kakariumi'],
    ['Bobo', 'Bobo', 'Bobo'],
    ['  Pupelė ', 'Pupelės', 'Pupele'],
    ['PŪKAS', 'PŪKO', 'PŪKU'],
    ['Kunigaikštis  Ąžuoliukas', 'Kunigaikščio Ąžuoliuko', 'Kunigaikščiu Ąžuoliuku'],
  ])('%s -> %s, su %s', (name, genitive, instrumental) => {
    expect(declineName(name)).toEqual({ genitive, instrumental });
  });
});

describe('schedule', () => {
  it('alternates water/food and play days from the start day and cleans on Saturdays', () => {
    const days = buildDays(2026, 11, 7); // 2026-11-07 is a Saturday
    expect(days).toHaveLength(30);
    expect(days[0]).toEqual({ day: 1, weekday: 6, due: [false, false, false, false] });
    expect(days[5].due).toEqual([false, false, false, false]); // 6th: before start
    expect(days[6]).toEqual({ day: 7, weekday: 5, due: [true, true, true, false] });
    expect(days[7].due).toEqual([false, false, false, true]);
    expect(days[13].due).toEqual([false, false, true, true]); // 14th: Saturday, play day
  });

  it('starts today only for the current month', () => {
    const today = new Date(2026, 10, 7);
    expect(startDay(2026, 11, today)).toBe(7);
    expect(startDay(2026, 12, today)).toBe(1);
    expect(startDay(2025, 11, today)).toBe(1);
  });
});

describe('pdf', () => {
  it('builds a one-page A4 calendar', async () => {
    const bytes = await buildCalendarPdf({ name: 'Pupelė 🐹', year: 2026, month: 2 }, loadAssets());
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    const { width, height } = doc.getPage(0).getSize();
    expect(Math.round(width)).toBe(595);
    expect(Math.round(height)).toBe(842);
    expect(doc.getTitle()).toBe('Pupelė – 2026 m. vasaris');
  });

  it('makes a file name', () => {
    expect(pdfFileName('Pupelė', 2026, 3)).toBe('Pupelė-kalendorius-2026-03.pdf');
    expect(pdfFileName(' a/b c ', 2026, 12)).toBe('a-b-c-kalendorius-2026-12.pdf');
    expect(pdfFileName('', 2026, 1)).toBe('kalendorius-2026-01.pdf');
  });
});
