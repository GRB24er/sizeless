import type jsPDF from "jspdf";
import { getLogoBase64, getLogoFormat, getWatermarkBase64 } from "./logo-loader";

// Company branding shared by every issued document: the logo in the header
// and a faint logo watermark on every page.

const WATERMARK_ASPECT = 272 / 284; // height / width of logo-watermark.png

/**
 * Draws the square logo badge at (x, y), `size` mm wide and high, with the
 * company name beside it. Falls back to the name alone if the logo is missing.
 */
export function drawLogo(
  doc: jsPDF,
  x: number,
  y: number,
  size: number,
  wordmark: "light" | "dark" | "none" = "light"
) {
  const logo = getLogoBase64();
  let textX = x;
  if (logo) {
    try {
      doc.addImage(logo, getLogoFormat(), x, y, size, size, "aegis-logo", "FAST");
      textX = x + size + size * 0.18;
    } catch {
      // fall through to the name only
    }
  }
  if (wordmark === "none" && textX !== x) return;

  const [r, g, b] = wordmark === "dark" ? [15, 29, 47] : [255, 255, 255];
  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(Math.max(9, size * 0.95));
  doc.text("AEGIS CARGO", textX, y + size * 0.62);
}

/** Faint logo in the centre of every page of the document. */
export function applyLogoWatermark(doc: jsPDF, opacity = 0.06) {
  const watermark = getWatermarkBase64();
  if (!watermark) return;

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const w = pageW * 0.62;
    const h = w * WATERMARK_ASPECT;

    doc.saveGraphicsState();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doc.setGState(new (doc as any).GState({ opacity }));
    doc.addImage(watermark, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h, "aegis-watermark", "FAST");
    doc.restoreGraphicsState();
  }
}

/**
 * Finishes a document: adds the logo watermark to every page and returns the
 * PDF bytes. Every generator returns through this.
 */
export function finalizePdf(doc: jsPDF, options: { watermark?: boolean } = {}): Buffer {
  if (options.watermark !== false) applyLogoWatermark(doc);
  return Buffer.from(doc.output("arraybuffer"));
}
