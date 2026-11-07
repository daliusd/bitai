import { PDFDocument, rgb } from 'pdf-lib';
import type { PDFFont, PDFImage, PDFPage, RGB } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { MONTHS, WEEKDAYS, declineName } from './lt';
import { TASKS, buildDays } from './schedule';
import type { Icon } from './schedule';

export interface Assets {
  regular: Uint8Array | ArrayBuffer;
  bold: Uint8Array | ArrayBuffer;
  images: Record<Icon, Uint8Array | ArrayBuffer>;
}

export interface CalendarOptions {
  name: string;
  year: number;
  /** 1-12 */
  month: number;
  /** First day of the schedule; earlier days get no checkboxes. */
  start?: number;
}

export const ICONS: Icon[] = ['hamster', 'water', 'food', 'broom', 'heart', 'pencil', 'sleeping'];

// Everything below is laid out in millimetres from the top-left corner of the printable area.
const MM = 72 / 25.4;
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 10;
const MARGIN_Y = 9;
const W = PAGE_W - 2 * MARGIN_X; // 190
const H = PAGE_H - 2 * MARGIN_Y; // 279

const grey = (v: number) => rgb(v / 255, v / 255, v / 255);
const INK = grey(0x11);
const MUTED = grey(0x55);

interface Run {
  text: string;
  font: PDFFont;
}

class Canvas {
  constructor(
    readonly page: PDFPage,
    readonly regular: PDFFont,
    readonly bold: PDFFont,
  ) {}

  /** Path in mm, top-left origin (SVG convention). Line widths are in mm too. */
  path(d: string, opts: { fill?: RGB; stroke?: RGB; width?: number; dash?: number[] }) {
    this.page.drawSvgPath(d, {
      x: MARGIN_X * MM,
      y: (PAGE_H - MARGIN_Y) * MM,
      scale: MM,
      color: opts.fill,
      borderColor: opts.stroke,
      borderWidth: opts.stroke ? (opts.width ?? 0.3) : undefined,
      borderDashArray: opts.dash,
    });
  }

  rect(x: number, y: number, w: number, h: number, opts: Parameters<Canvas['path']>[1] & { r?: number }) {
    const r = Math.min(opts.r ?? 0, w / 2, h / 2);
    const d = r
      ? `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
        `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
      : `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
    this.path(d, opts);
  }

  line(x1: number, y1: number, x2: number, y2: number, width: number, color: RGB) {
    this.page.drawLine({
      start: { x: (MARGIN_X + x1) * MM, y: (PAGE_H - MARGIN_Y - y1) * MM },
      end: { x: (MARGIN_X + x2) * MM, y: (PAGE_H - MARGIN_Y - y2) * MM },
      thickness: width * MM,
      color,
    });
  }

  /** Draws text with its baseline at y; size in mm. Returns the advance width in mm. */
  text(s: string, x: number, y: number, size: number, font = this.regular, color = INK): number {
    this.page.drawText(s, { x: (MARGIN_X + x) * MM, y: (PAGE_H - MARGIN_Y - y) * MM, size: size * MM, font, color });
    return width(s, font, size);
  }

  image(img: PDFImage, x: number, y: number, size: number) {
    this.page.drawImage(img, {
      x: (MARGIN_X + x) * MM,
      y: (PAGE_H - MARGIN_Y - y - size) * MM,
      width: size * MM,
      height: size * MM,
    });
  }

  /** A hand-drawn style tick whose box is size×size with top-left at (x, y). */
  tick(x: number, y: number, size: number, color = INK) {
    const s = size;
    this.path(`M${x + 0.1 * s} ${y + 0.55 * s}L${x + 0.38 * s} ${y + 0.85 * s}L${x + 0.92 * s} ${y + 0.12 * s}`, {
      stroke: color,
      width: s * 0.16,
    });
  }
}

function width(s: string, font: PDFFont, size: number): number {
  return font.widthOfTextAtSize(s, size * MM) / MM;
}

/** Greedy word wrap over runs of mixed fonts. */
function wrap(runs: Run[], maxWidth: number, size: number): Run[][] {
  const words: Run[] = runs.flatMap((r) =>
    r.text
      .split(/(?<= )/)
      .filter(Boolean)
      .map((text) => ({ text, font: r.font })),
  );
  const lines: Run[][] = [[]];
  let x = 0;
  for (const w of words) {
    const ww = width(w.text.trimEnd(), w.font, size);
    const line = lines[lines.length - 1];
    if (line.length && x + ww > maxWidth) {
      lines.push([w]);
      x = width(w.text, w.font, size);
    } else {
      line.push(w);
      x += width(w.text, w.font, size);
    }
  }
  return lines;
}

function drawLines(c: Canvas, lines: Run[][], x: number, y: number, size: number, lineHeight: number, align: 'left' | 'center' = 'left', boxWidth = 0) {
  lines.forEach((line, i) => {
    const lw = line.reduce((sum, r, j) => sum + width(j === line.length - 1 ? r.text.trimEnd() : r.text, r.font, size), 0);
    let cx = align === 'center' ? x + (boxWidth - lw) / 2 : x;
    const baseline = y + i * lineHeight + size * 0.95;
    for (const r of line) cx += c.text(r.text, cx, baseline, size, r.font);
  });
}

/** Keeps only characters the embedded font can draw. */
function printable(s: string, font: PDFFont): string {
  const set = new Set(font.getCharacterSet());
  return [...s].filter((ch) => set.has(ch.codePointAt(0)!)).join('').replace(/\s+/g, ' ').trim();
}

export async function buildCalendarPdf(opts: CalendarOptions, assets: Assets): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const regular = await doc.embedFont(assets.regular, { subset: true });
  const bold = await doc.embedFont(assets.bold, { subset: true });
  const images = {} as Record<Icon, PDFImage>;
  for (const icon of ICONS) images[icon] = await doc.embedPng(assets.images[icon]);

  const page = doc.addPage([PAGE_W * MM, PAGE_H * MM]);
  const c = new Canvas(page, regular, bold);
  const name = printable(opts.name, bold) || 'Žiurkėnas';
  const { genitive, instrumental } = declineName(name);
  const monthName = MONTHS[opts.month - 1];

  doc.setTitle(`${name} – ${opts.year} m. ${monthName}`);
  doc.setLanguage('lt');
  doc.setCreator('bitai.ffff.lt');

  // ---- Header -------------------------------------------------------------------------
  const HEADER_H = 26;
  c.image(images.hamster, 0, 2.5, 21);

  const monthText = monthName.toLocaleUpperCase('lt');
  const yearText = `${opts.year} m.`;
  const boxW = Math.max(width(monthText, bold, 7), width(yearText, regular, 4.5)) + 10;
  const boxH = 17;
  const boxX = W - boxW;
  const boxY = (HEADER_H - boxH) / 2;
  c.rect(boxX, boxY, boxW, boxH, { fill: rgb(1, 1, 1), stroke: MUTED, width: 0.6, r: 4 });
  c.text(monthText, boxX + (boxW - width(monthText, bold, 7)) / 2, boxY + 8.3, 7, bold);
  c.text(yearText, boxX + (boxW - width(yearText, regular, 4.5)) / 2, boxY + 13.8, 4.5);

  const titleX = 25;
  const titleW = boxX - 4 - titleX;
  const title = `${genitive} priežiūros kalendorius`;
  const titleSize = Math.min(7.4, (7.4 * titleW) / width(title, bold, 7.4));
  c.text(title, titleX, 12, titleSize, bold);
  const sub = 'Kai darbas atliktas – pažymėk langelį ';
  const subSize = Math.min(4.6, (4.6 * (titleW - 5)) / width(sub, regular, 4.6));
  const subW = c.text(sub, titleX, 19.5, subSize);
  c.tick(titleX + subW, 19.5 - subSize * 0.8, subSize);

  // ---- Footer (laid out first so the table can take the rest) ---------------------------
  const FS = 3.2; // footer text size
  const LH = FS * 1.3;
  const TIP_W = 66;
  const legendW = W - TIP_W - 4;
  const colW = (legendW - 4) / 2;
  const ICON = 7;
  const legend = TASKS.map((t) => wrap([{ text: `${t.title}. `, font: bold }, { text: t.text, font: regular }], colW - ICON - 1.5, FS));
  const legendRows: number[] = [];
  for (let i = 0; i < legend.length; i += 2) {
    legendRows.push(Math.max(...legend.slice(i, i + 2).map((l) => Math.max(ICON, l.length * LH))));
  }
  const legendH = legendRows.reduce((a, b) => a + b, 0) + 1.5 * (legendRows.length - 1);

  const TIP_IMG = 17;
  const tipTextW = TIP_W - 1 - TIP_IMG - 1 - 2.5;
  const tip = wrap(
    [
      { text: 'Žinok! ', font: bold },
      { text: `Dieną žiurkėnai miega – nežadink ${genitive}. Žaisk su ${instrumental} vakare!`, font: regular },
    ],
    tipTextW,
    FS,
  );
  const tipH = Math.max(TIP_IMG, tip.length * LH) + 3;
  const footerH = Math.max(legendH, tipH);
  const footerY = H - footerH;

  let ly = footerY;
  legendRows.forEach((rowH, row) => {
    for (let col = 0; col < 2; col++) {
      const i = row * 2 + col;
      if (i >= TASKS.length) break;
      const x = col * (colW + 4);
      c.image(images[TASKS[i].icon], x, ly, ICON);
      drawLines(c, legend[i], x + ICON + 1.5, ly, FS, LH);
    }
    ly += rowH + 1.5;
  });

  const tipX = W - TIP_W;
  c.rect(tipX, footerY, TIP_W, footerH, { fill: grey(0xf3), stroke: MUTED, width: 0.4, dash: [1.2, 0.8], r: 3 });
  c.image(images.sleeping, tipX + 1, footerY + (footerH - TIP_IMG) / 2, TIP_IMG);
  drawLines(c, tip, tipX + 1 + TIP_IMG + 1, footerY + (footerH - tip.length * LH) / 2, FS, LH);

  // ---- Table ------------------------------------------------------------------------------
  const tableY = HEADER_H + 2;
  const tableH = footerY - 3 - tableY;
  const DATE_W = 18;
  const WHO_W = 34;
  const taskW = (W - DATE_W - WHO_W) / TASKS.length;
  const cols = [DATE_W, ...TASKS.map(() => taskW), WHO_W];
  const colX = cols.map((_, i) => cols.slice(0, i).reduce((a, b) => a + b, 0));

  const HS = 3.4; // header text size
  const HLH = HS * 1.15;
  const headCells = [
    ...TASKS.map((t) => ({ icon: t.icon, lines: wrap([{ text: t.title, font: regular }], taskW - 2, HS) })),
    { icon: 'pencil' as Icon, lines: wrap([{ text: 'Kas padarė?', font: regular }], WHO_W - 2, HS) },
  ];
  const headH = 1.2 + 9 + 0.6 + Math.max(...headCells.map((h) => h.lines.length)) * HLH + 1.5;

  const days = buildDays(opts.year, opts.month, opts.start ?? 1);
  const rowH = (tableH - headH) / days.length;
  const rowY = (i: number) => tableY + headH + i * rowH;

  // backgrounds
  c.rect(0, tableY, W, headH, { fill: grey(0xe8) });
  days.forEach((d, i) => {
    if (d.weekday >= 5) c.rect(0, rowY(i), W, rowH, { fill: grey(0xf3) });
    d.due.forEach((due, t) => {
      if (!due) c.rect(colX[t + 1], rowY(i), taskW, rowH, { fill: grey(0xe2) });
    });
  });

  // grid
  const GRID = grey(0x99);
  const bottom = tableY + tableH;
  for (let i = 0; i <= days.length; i++) c.line(0, rowY(i), W, rowY(i), 0.3, GRID);
  c.line(0, tableY, W, tableY, 0.3, GRID);
  [...colX, W].forEach((x) => c.line(x, tableY, x, bottom, 0.3, GRID));
  days.forEach((d, i) => {
    if (d.weekday === 0 && d.day !== 1) c.line(0, rowY(i), W, rowY(i), 0.9, MUTED);
  });

  // header content
  c.text('Diena', (DATE_W - width('Diena', regular, HS)) / 2, tableY + headH / 2 + HS * 0.35, HS);
  headCells.forEach((h, i) => {
    const x = colX[i + 1];
    const w = cols[i + 1];
    c.image(images[h.icon], x + (w - 9) / 2, tableY + 1.2, 9);
    drawLines(c, h.lines, x, tableY + 1.2 + 9 + 0.6, HS, HLH, 'center', w);
  });

  // rows
  const BOX = Math.min(5.5, rowH - 1);
  days.forEach((d, i) => {
    const y = rowY(i);
    const baseline = y + rowH / 2 + 1.4;
    const weekend = d.weekday >= 5;
    const dw = c.text(String(d.day), 2, baseline, 4, bold);
    c.text(` ${WEEKDAYS[d.weekday]}`, 2 + dw, baseline, 3, weekend ? bold : regular, weekend ? INK : MUTED);
    d.due.forEach((due, t) => {
      if (due) {
        c.rect(colX[t + 1] + (taskW - BOX) / 2, y + (rowH - BOX) / 2, BOX, BOX, {
          fill: rgb(1, 1, 1),
          stroke: grey(0x33),
          width: 0.5,
          r: 1.2,
        });
      }
    });
  });

  return doc.save();
}

export function pdfFileName(name: string, year: number, month: number): string {
  const safe = name.trim().replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+|-+$/g, '');
  return `${safe ? `${safe}-` : ''}kalendorius-${year}-${String(month).padStart(2, '0')}.pdf`;
}
