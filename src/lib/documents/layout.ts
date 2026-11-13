import fs from "fs";
import path from "path";
import jsPDF from "jspdf";
import bwipjs from "bwip-js";
import { COMPANY } from "@/lib/company";
import { getMarkBase64, getWatermarkBase64 } from "./logo-loader";

/**
 * The document system behind every PDF Aegis Cargo issues.
 *
 * Everything sits on one A4 grid: 16 mm margins and 12 columns with 4 mm
 * gutters, so labels, values, table columns, totals and signature lines in
 * every document share the same verticals. Text is IBM Plex Sans; references,
 * dates and figures are IBM Plex Mono. Colour follows the website: navy ink,
 * steel neutrals and a single signal-orange accent.
 */

// ─── Palette ────────────────────────────────────────────────────────────

export type RGB = readonly [number, number, number];

export const INK: RGB = [15, 29, 47];
export const INK_2: RGB = [64, 80, 102];
export const INK_3: RGB = [94, 109, 130];
export const LINE: RGB = [220, 225, 231];
export const LINE_2: RGB = [197, 205, 214];
export const TINT: RGB = [244, 245, 247];
export const NAVY_2: RGB = [30, 58, 95];
export const SIGNAL: RGB = [194, 78, 28];
export const SIGNAL_INK: RGB = [168, 64, 26];
export const SIGNAL_SOFT: RGB = [247, 232, 225];
const WHITE: RGB = [255, 255, 255];

// ─── Geometry ───────────────────────────────────────────────────────────

export const PAGE_W = 210;
export const PAGE_H = 297;
export const MARGIN = 16;
export const CONTENT_W = PAGE_W - MARGIN * 2; // 178
const COLUMNS = 12;
const GUTTER = 4;
const COL_W = (CONTENT_W - GUTTER * (COLUMNS - 1)) / COLUMNS;
/** Lowest y content may reach before a page break (the footer starts below). */
const CONTENT_BOTTOM = 277;

/** Left edge of grid column `col` (0–11). */
export const gx = (col: number) => MARGIN + col * (COL_W + GUTTER);
/** Width of `span` grid columns, gutters included. */
export const gw = (span: number) => span * COL_W + (span - 1) * GUTTER;

// ─── Fonts ──────────────────────────────────────────────────────────────

export type FontRole = "sans" | "medium" | "semibold" | "mono" | "monoMedium";

const FONT_FILES: Record<FontRole, string> = {
  sans: "IBMPlexSans-Regular.ttf",
  medium: "IBMPlexSans-Medium.ttf",
  semibold: "IBMPlexSans-SemiBold.ttf",
  mono: "IBMPlexMono-Regular.ttf",
  monoMedium: "IBMPlexMono-Medium.ttf",
};

// Built-in fallbacks if the font files are missing from the deployment.
const FALLBACK: Record<FontRole, [string, string]> = {
  sans: ["helvetica", "normal"],
  medium: ["helvetica", "bold"],
  semibold: ["helvetica", "bold"],
  mono: ["courier", "normal"],
  monoMedium: ["courier", "bold"],
};

let fontData: Record<FontRole, string> | null | undefined;

function loadFonts(): Record<FontRole, string> | null {
  if (fontData !== undefined) return fontData;
  try {
    const dir = path.join(process.cwd(), "public", "fonts", "documents");
    const out = {} as Record<FontRole, string>;
    for (const [role, file] of Object.entries(FONT_FILES) as [FontRole, string][]) {
      out[role] = fs.readFileSync(path.join(dir, file)).toString("base64");
    }
    fontData = out;
  } catch (err) {
    console.error("Document fonts not found, falling back to Helvetica:", err);
    fontData = null;
  }
  return fontData;
}

function registerFonts(doc: jsPDF): boolean {
  const fonts = loadFonts();
  if (!fonts) return false;
  for (const [role, file] of Object.entries(FONT_FILES) as [FontRole, string][]) {
    doc.addFileToVFS(file, fonts[role]);
    doc.addFont(file, `aegis-${role}`, "normal");
  }
  return true;
}

/**
 * Font setter for pages laid out outside `Sheet` (labels): registers the
 * document fonts on `doc` and returns a function that applies a role.
 */
export function documentFonts(doc: jsPDF) {
  const ok = registerFonts(doc);
  return (role: FontRole, size: number, color: RGB = INK) => {
    if (ok) doc.setFont(`aegis-${role}`, "normal");
    else doc.setFont(...FALLBACK[role]);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
}

// ─── Formatting ─────────────────────────────────────────────────────────

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })} UTC`;
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

// ─── Codes ──────────────────────────────────────────────────────────────

/** Code 128 barcode as a PNG data URL (null if it cannot be rendered). */
export async function code128(text: string, heightMm = 10): Promise<string | null> {
  try {
    const png = await bwipjs.toBuffer({
      bcid: "code128",
      text,
      scale: 3,
      height: heightMm,
      includetext: false,
      paddingwidth: 0,
      paddingheight: 0,
    });
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

// ─── Types ──────────────────────────────────────────────────────────────

export type Field = {
  label: string;
  value: string | null | undefined;
  /** Grid columns to span (default 3). */
  span?: number;
  mono?: boolean;
  /** Draw the value larger and heavier. */
  strong?: boolean;
};

export type Column = {
  header: string;
  span: number;
  align?: "left" | "right";
  mono?: boolean;
  medium?: boolean;
};

export type Party = {
  heading: string;
  name: string;
  lines: (string | null | undefined)[];
  contact?: (string | null | undefined)[];
};

type Tone = "navy" | "neutral" | "signal";

// ─── Sheet ──────────────────────────────────────────────────────────────

export class Sheet {
  readonly doc: jsPDF;
  y = 0;
  private readonly title: string;
  private readonly reference: string;
  private readonly hasFonts: boolean;

  constructor(opts: { title: string; reference: string }) {
    this.doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    this.title = opts.title;
    this.reference = opts.reference;
    this.hasFonts = registerFonts(this.doc);
    this.doc.setProperties({
      title: `${opts.title} ${opts.reference}`,
      subject: opts.title,
      author: COMPANY.name,
      creator: COMPANY.name,
    });
    this.doc.setLineCap("butt");
  }

  // ── Primitives ──

  font(role: FontRole, size: number, color: RGB = INK) {
    if (this.hasFonts) this.doc.setFont(`aegis-${role}`, "normal");
    else this.doc.setFont(...FALLBACK[role]);
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
  }

  text(str: string | string[], x: number, y: number, opts: { align?: "left" | "right" | "center" } = {}) {
    this.doc.text(str, x, y, { align: opts.align ?? "left", baseline: "alphabetic" });
  }

  rule(x1: number, y: number, x2: number, color: RGB = LINE, width = 0.2) {
    this.doc.setDrawColor(...color);
    this.doc.setLineWidth(width);
    this.doc.line(x1, y, x2, y);
  }

  /** Wraps `value` to `width` in the current font; never truncates. */
  wrap(value: string, width: number): string[] {
    return this.doc.splitTextToSize(value || "—", width) as string[];
  }

  /** Starts a new page when fewer than `h` mm remain. */
  ensure(h: number) {
    if (this.y + h <= CONTENT_BOTTOM) return;
    this.doc.addPage();
    this.continuationHeader();
  }

  space(mm: number) {
    this.y += mm;
  }

  // ── Header ──

  private brand(y: number, compact = false) {
    const mark = getMarkBase64();
    const h = compact ? 6 : 8;
    const w = h * (222 / 184);
    let x = MARGIN;
    if (mark) {
      try {
        this.doc.addImage(mark, "PNG", MARGIN, y - h + 1.3, w, h, "aegis-mark", "FAST");
        x = MARGIN + w + 2.4;
      } catch {
        // name only
      }
    }
    this.font("semibold", compact ? 9.5 : 11.5);
    this.text(COMPANY.name, x, y);
  }

  /**
   * First-page header: brand and title on one line, an accented hairline, then
   * a strip of key facts (reference, dates, status) on the grid.
   */
  header(meta: Field[], opts: { subtitle?: string } = {}) {
    const top = 19;
    this.brand(top);
    this.font("semibold", 17);
    this.text(this.title, MARGIN + CONTENT_W, top, { align: "right" });
    this.font("sans", 7.2, INK_3);
    this.text("Secure shipping and precious-metals custody", MARGIN, top + 5);
    if (opts.subtitle) this.text(opts.subtitle, MARGIN + CONTENT_W, top + 5, { align: "right" });

    const ruleY = top + 9.5;
    this.rule(MARGIN, ruleY, MARGIN + CONTENT_W, LINE, 0.25);
    this.doc.setFillColor(...SIGNAL);
    this.doc.rect(MARGIN, ruleY - 0.45, 18, 0.9, "F");

    this.y = ruleY + 5;
    if (meta.length) {
      this.fields(meta);
      this.rule(MARGIN, this.y - 1.2, MARGIN + CONTENT_W, LINE, 0.25);
      this.y += 3;
    }
  }

  private continuationHeader() {
    const top = 17;
    this.brand(top, true);
    this.font("medium", 8.5, INK_2);
    this.text(this.title, MARGIN + CONTENT_W - 50, top, { align: "right" });
    this.font("mono", 8, INK_3);
    this.text(this.reference, MARGIN + CONTENT_W, top, { align: "right" });
    this.rule(MARGIN, top + 4, MARGIN + CONTENT_W, LINE, 0.25);
    this.y = top + 10;
  }

  // ── Blocks ──

  /** Section heading with a full-width hairline beneath it. */
  section(title: string, opts: { keepWith?: number; aside?: string } = {}) {
    this.ensure(14 + (opts.keepWith ?? 16));
    this.y += 3.4;
    this.font("semibold", 9.5);
    this.text(title, MARGIN, this.y);
    if (opts.aside) {
      this.font("sans", 7.2, INK_3);
      this.text(opts.aside, MARGIN + CONTENT_W, this.y, { align: "right" });
    }
    this.rule(MARGIN, this.y + 2.4, MARGIN + CONTENT_W, LINE, 0.25);
    this.y += 8;
  }

  /**
   * One row of label/value pairs laid left to right across the grid. Values
   * wrap within their columns; the row is as tall as its tallest value.
   */
  fields(items: Field[], opts: { start?: number } = {}) {
    let col = opts.start ?? 0;
    const placed = items.map((f) => {
      const span = Math.min(f.span ?? 3, COLUMNS - col);
      const size = f.strong ? 11 : 8.8;
      this.font(f.mono ? (f.strong ? "monoMedium" : "mono") : f.strong ? "semibold" : "sans", size);
      const lines = this.wrap(f.value?.toString().trim() || "—", gw(span) - 1);
      const out = { f, col, span, size, lines };
      col += span;
      return out;
    });
    const lineH = (size: number) => (size >= 11 ? 5 : 4.1);
    const rowH = Math.max(...placed.map((p) => 6.4 + p.lines.length * lineH(p.size))) + 2.6;
    this.ensure(rowH);
    for (const p of placed) {
      const x = gx(p.col);
      this.font("sans", 6.9, INK_3);
      this.text(p.f.label, x, this.y);
      this.font(p.f.mono ? (p.f.strong ? "monoMedium" : "mono") : p.f.strong ? "semibold" : "sans", p.size);
      p.lines.forEach((line, i) => this.text(line, x, this.y + 5 + i * lineH(p.size)));
    }
    this.y += rowH;
  }

  /** Side-by-side party cards (shipper/consignee, custodian/depositor…), equal height. */
  parties(blocks: Party[]) {
    const span = Math.floor(COLUMNS / blocks.length);
    const pad = 4;
    const prepared = blocks.map((b) => {
      const inner = gw(span) - pad * 2;
      this.font("semibold", 10.5);
      const name = this.wrap(b.name || "—", inner);
      this.font("sans", 8.4);
      const lines = b.lines.filter(Boolean).flatMap((l) => this.wrap(l as string, inner));
      this.font("sans", 7.6);
      const contact = (b.contact ?? []).filter(Boolean).flatMap((l) => this.wrap(l as string, inner));
      const h = pad + 4 + name.length * 4.8 + 1.2 + lines.length * 3.9 + (contact.length ? 2 + contact.length * 3.6 : 0) + pad - 1;
      return { b, name, lines, contact, h };
    });
    const h = Math.max(...prepared.map((p) => p.h));
    this.ensure(h + 2);
    prepared.forEach((p, i) => {
      const x = gx(i * span);
      const w = gw(span);
      this.doc.setFillColor(...TINT);
      this.doc.roundedRect(x, this.y, w, h, 1.4, 1.4, "F");
      let y = this.y + pad + 2.4;
      this.font("sans", 6.9, INK_3);
      this.text(p.b.heading, x + pad, y);
      y += 5.4;
      this.font("semibold", 10.5);
      p.name.forEach((l) => {
        this.text(l, x + pad, y);
        y += 4.8;
      });
      y += 0.4;
      this.font("sans", 8.4, INK_2);
      p.lines.forEach((l) => {
        this.text(l, x + pad, y);
        y += 3.9;
      });
      if (p.contact.length) {
        y += 1.6;
        this.font("sans", 7.6, INK_3);
        p.contact.forEach((l) => {
          this.text(l, x + pad, y);
          y += 3.6;
        });
      }
    });
    this.y += h + 4;
  }

  /**
   * A ruled table on the grid. Column spans should total 12, so the first
   * column starts at the margin and the last ends at the right edge. Long
   * text wraps; rows that do not fit move to the next page under a repeated
   * header.
   */
  table(columns: Column[], rows: string[][], opts: { totals?: string[] } = {}) {
    const lineH = 3.9;
    const xs: number[] = [];
    let col = 0;
    for (const c of columns) {
      xs.push(gx(col));
      col += c.span;
    }

    const drawHead = () => {
      this.rule(MARGIN, this.y, MARGIN + CONTENT_W, INK, 0.35);
      this.font("medium", 6.9, INK_3);
      columns.forEach((c, i) => {
        const x = c.align === "right" ? xs[i] + gw(c.span) : xs[i];
        this.text(c.header, x, this.y + 4.6, { align: c.align === "right" ? "right" : "left" });
      });
      this.rule(MARGIN, this.y + 7, MARGIN + CONTENT_W, LINE, 0.25);
      this.y += 7;
    };

    const measure = (cells: string[], bold: boolean) =>
      cells.map((cell, i) => {
        const c = columns[i];
        this.font(c.mono ? (bold ? "monoMedium" : "mono") : bold || c.medium ? "medium" : "sans", 8.2);
        return cell === "" ? [""] : this.wrap(cell ?? "—", gw(c.span) - 1.5);
      });

    const drawRow = (cells: string[], bold = false) => {
      const wrapped = measure(cells, bold);
      const h = Math.max(...wrapped.map((w) => w.length)) * lineH + 3.4;
      if (this.y + h > CONTENT_BOTTOM) {
        this.doc.addPage();
        this.continuationHeader();
        drawHead();
      }
      wrapped.forEach((lines, i) => {
        const c = columns[i];
        this.font(c.mono ? (bold ? "monoMedium" : "mono") : bold || c.medium ? "medium" : "sans", 8.2, INK);
        const x = c.align === "right" ? xs[i] + gw(c.span) : xs[i];
        lines.forEach((line, j) =>
          this.text(line, x, this.y + 4.9 + j * lineH, { align: c.align === "right" ? "right" : "left" })
        );
      });
      this.y += h;
      return h;
    };

    this.ensure(7 + 12);
    drawHead();
    rows.forEach((r) => {
      drawRow(r);
      this.rule(MARGIN, this.y, MARGIN + CONTENT_W, LINE, 0.2);
    });
    if (opts.totals) {
      this.rule(MARGIN, this.y, MARGIN + CONTENT_W, INK, 0.35);
      drawRow(opts.totals, true);
    }
    this.y += 3;
  }

  /** Right-hand summary of amounts; the last line is the emphasised total. */
  totals(lines: { label: string; value: string }[], opts: { span?: number } = {}) {
    const span = opts.span ?? 5;
    const x = gx(COLUMNS - span);
    const right = MARGIN + CONTENT_W;
    this.ensure(lines.length * 6 + 8);
    lines.forEach((l, i) => {
      const last = i === lines.length - 1 && lines.length > 1;
      if (last) {
        this.rule(x, this.y - 1.2, right, INK, 0.35);
        this.y += 3.2;
        this.font("semibold", 9.5);
        this.text(l.label, x, this.y);
        this.font("monoMedium", 11.5);
        this.text(l.value, right, this.y, { align: "right" });
        this.y += 6;
      } else {
        this.font("sans", 8.4, INK_2);
        this.text(l.label, x, this.y);
        this.font("mono", 8.6);
        this.text(l.value, right, this.y, { align: "right" });
        this.y += 5.6;
      }
    });
    this.y += 2;
  }

  /** Tinted box of explanatory text. */
  note(body: string, opts: { title?: string } = {}) {
    const pad = 4.5;
    this.font("sans", 7.8, INK_2);
    const lines = this.wrap(body, CONTENT_W - pad * 2);
    const h = pad * 2 + (opts.title ? 5 : 0) + lines.length * 3.7 - 0.6;
    this.ensure(h + 3);
    this.doc.setFillColor(...TINT);
    this.doc.roundedRect(MARGIN, this.y, CONTENT_W, h, 1.4, 1.4, "F");
    let y = this.y + pad + 2.3;
    if (opts.title) {
      this.font("semibold", 8.2);
      this.text(opts.title, MARGIN + pad, y);
      y += 5;
    }
    this.font("sans", 7.8, INK_2);
    lines.forEach((l) => {
      this.text(l, MARGIN + pad, y);
      y += 3.7;
    });
    this.y += h + 4;
  }

  /** Two tinted notes side by side on the grid, equal height. */
  notePair(left: { title: string; body: string }, right: { title: string; body: string }) {
    const pad = 4.5;
    const width = gw(6) - pad * 2;
    this.font("sans", 7.8, INK_2);
    const wrapped = [left, right].map((n) => this.wrap(n.body, width));
    const h = pad * 2 + 5 + Math.max(...wrapped.map((w) => w.length)) * 3.7 - 0.6;
    this.ensure(h + 3);
    [left, right].forEach((n, i) => {
      const x = gx(i * 6);
      this.doc.setFillColor(...TINT);
      this.doc.roundedRect(x, this.y, gw(6), h, 1.4, 1.4, "F");
      let y = this.y + pad + 2.3;
      this.font("semibold", 8.2);
      this.text(n.title, x + pad, y);
      y += 5;
      this.font("sans", 7.8, INK_2);
      wrapped[i].forEach((l) => {
        this.text(l, x + pad, y);
        y += 3.7;
      });
    });
    this.y += h + 4;
  }

  /** Terms as hanging paragraphs marked by a short rule, never numbered. */
  clauses(items: string[]) {
    const indent = 5;
    for (const item of items) {
      this.font("sans", 7.8, INK_2);
      const lines = this.wrap(item, CONTENT_W - indent);
      this.ensure(lines.length * 3.7 + 2.2);
      this.rule(MARGIN, this.y - 1.2, MARGIN + 2.6, LINE_2, 0.5);
      lines.forEach((l, i) => this.text(l, MARGIN + indent, this.y + i * 3.7));
      this.y += lines.length * 3.7 + 2.2;
    }
    this.y += 2;
  }

  /** Small rounded status tag; returns its width so callers can place it. */
  tag(label: string, x: number, baseline: number, tone: Tone = "neutral", align: "left" | "right" = "left") {
    this.font("medium", 7.2);
    const w = this.doc.getTextWidth(label) + 5.6;
    const left = align === "right" ? x - w : x;
    const [fill, color] =
      tone === "navy" ? [INK, WHITE] : tone === "signal" ? [SIGNAL_SOFT, SIGNAL_INK] : [TINT, INK_2];
    this.doc.setFillColor(...fill);
    this.doc.roundedRect(left, baseline - 3.6, w, 5.2, 1, 1, "F");
    this.font("medium", 7.2, color);
    this.text(label, left + 2.8, baseline);
    return w;
  }

  /**
   * Closing block: signature lines on the grid and, at the right, a QR code
   * with a caption saying exactly what it opens.
   */
  signatures(opts: { lines: string[]; issuer?: boolean; qr?: { dataUrl: string; caption: string } }) {
    const h = 29.5;
    this.ensure(h + 1);
    this.y += 1.5;
    const top = this.y;
    const lineY = top + 15;
    const spans = opts.qr ? 3 : 4;
    opts.lines.forEach((label, i) => {
      const x = gx(i * spans);
      this.rule(x, lineY, x + gw(spans), LINE_2, 0.3);
      this.font("sans", 6.9, INK_3);
      this.text(label, x, lineY + 4);
    });
    if (opts.issuer !== false) {
      const x = gx(0);
      this.font("semibold", 8.2);
      this.text(`Issued by ${COMPANY.name}`, x, lineY + 10.5);
      this.font("sans", 6.9, INK_3);
      this.text(`${COMPANY.addressLines.join(", ")}  ·  ${COMPANY.email}`, x, lineY + 14.3);
    }
    if (opts.qr) {
      const size = 24;
      const x = MARGIN + CONTENT_W - size;
      this.doc.addImage(opts.qr.dataUrl, "PNG", x, top, size, size);
      this.font("sans", 6.6, INK_3);
      const caption = this.wrap(opts.qr.caption, gw(3));
      caption.forEach((l, i) => this.text(l, MARGIN + CONTENT_W, top + size + 3.4 + i * 3, { align: "right" }));
    }
    this.y = top + h;
  }

  // ── Finish ──

  /** Footer on every page, faint watermark, then the PDF bytes. */
  finish(opts: { watermark?: boolean } = {}): Buffer {
    const pages = this.doc.getNumberOfPages();
    const generated = fmtDateTime(new Date());
    const watermark = opts.watermark === false ? null : getWatermarkBase64();
    for (let p = 1; p <= pages; p++) {
      this.doc.setPage(p);
      if (watermark) {
        const w = PAGE_W * 0.5;
        const h = w * (272 / 284);
        this.doc.saveGraphicsState();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.doc.setGState(new (this.doc as any).GState({ opacity: 0.022 }));
        this.doc.addImage(watermark, "PNG", (PAGE_W - w) / 2, (PAGE_H - h) / 2 + 8, w, h, "aegis-watermark", "FAST");
        this.doc.restoreGraphicsState();
      }
      const y = 283;
      this.rule(MARGIN, y, MARGIN + CONTENT_W, LINE, 0.25);
      this.font("sans", 6.6, INK_3);
      this.text(`${COMPANY.name}  ·  ${COMPANY.addressLines.join(", ")}  ·  ${COMPANY.email}`, MARGIN, y + 4.6);
      this.font("mono", 6.6, INK_3);
      this.text(`Page ${p} of ${pages}`, MARGIN + CONTENT_W, y + 4.6, { align: "right" });
      this.text(`${this.reference}  ·  Generated ${generated}`, MARGIN, y + 8.6);
      this.font("sans", 6.6, INK_3);
      this.text("aegiscargo.org", MARGIN + CONTENT_W, y + 8.6, { align: "right" });
    }
    return Buffer.from(this.doc.output("arraybuffer"));
  }
}
