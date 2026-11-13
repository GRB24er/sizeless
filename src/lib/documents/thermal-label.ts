import jsPDF from "jspdf";
import { generateTrackingQR } from "./qr-generator";
import { getMarkBase64 } from "./logo-loader";
import { code128, documentFonts, fmtDate, type RGB } from "./layout";
import { SHIPPING_OPTIONS } from "@/app/(root)/shipments/create/type";

type LabelData = {
  trackingNumber: string;
  serviceType: string;
  createdAt: string | Date;
  estimatedDelivery: string | Date;
  originAddress: string;
  originCity: string;
  originState: string;
  originPostalCode: string;
  originCountry: string;
  destinationAddress: string;
  destinationCity: string;
  destinationState: string;
  destinationPostalCode: string;
  destinationCountry: string;
  packages: { weight: number; pieces: number; description: string }[];
  recipient: { name: string; company?: string | null; phone: string };
  Sender: { name: string; phone?: string } | null;
};

// Thermal printers render only black: no greys, no fills except solid black.
const BLACK: RGB = [0, 0, 0];
const WHITE: RGB = [255, 255, 255];

function serviceName(id: string) {
  return SHIPPING_OPTIONS.find((o) => o.id === id)?.label ?? id.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Parcel label: who it is going to in the largest type, then the scannable
 * tracking barcode, the consignment facts and a tracking QR. Lays out to any
 * label size; used for the 4 × 6 in thermal label and the 100 × 150 mm label.
 */
export async function renderLabel(data: LabelData, size: { width: number; height: number }): Promise<Buffer> {
  const { width: W, height: H } = size;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [W, H], compress: true });
  const font = documentFonts(doc);
  const M = 4;
  const R = W - M;
  const [qr, barcode] = await Promise.all([generateTrackingQR(data.trackingNumber), code128(data.trackingNumber, 14)]);
  const weight = data.packages.reduce((s, p) => s + p.weight, 0);
  const pieces = data.packages.reduce((s, p) => s + p.pieces, 0);
  const text = (t: string | string[], x: number, y: number, align: "left" | "right" = "left") => doc.text(t, x, y, { align });
  const rule = (y: number, w = 0.3) => {
    doc.setDrawColor(...BLACK);
    doc.setLineWidth(w);
    doc.line(M, y, R, y);
  };

  // Brand and service.
  const mark = getMarkBase64();
  let bx = M;
  if (mark) {
    doc.addImage(mark, "PNG", M, 4.2, 7.2, 6, "aegis-mark", "FAST");
    bx = M + 9.2;
  }
  font("semibold", 10, BLACK);
  text("Aegis Cargo", bx, 9);
  const service = serviceName(data.serviceType).toUpperCase();
  font("semibold", 7, WHITE);
  const sw = doc.getTextWidth(service) + 5;
  doc.setFillColor(...BLACK);
  doc.rect(R - sw, 3.6, sw, 6.4, "F");
  text(service, R - 2.5, 8, "right");
  rule(13, 0.5);

  // From.
  let y = 17.4;
  font("medium", 6, BLACK);
  text("From", M, y);
  text(`Shipped ${fmtDate(data.createdAt)}`, R, y, "right");
  font("semibold", 8, BLACK);
  text(data.Sender?.name || "Aegis Cargo", M, y + 4.4);
  font("sans", 7, BLACK);
  const from = [data.originAddress, `${data.originCity}${data.originState ? `, ${data.originState}` : ""} ${data.originPostalCode}`.trim(), data.originCountry]
    .filter(Boolean)
    .map((l) => doc.splitTextToSize(l, R - M)[0] as string);
  from.forEach((l, i) => text(l, M, y + 8 + i * 3.3));
  y += 8 + from.length * 3.3 + 1.2;
  rule(y);

  // Deliver to: the largest type on the label.
  y += 4.6;
  font("medium", 6, BLACK);
  text("Deliver to", M, y);
  if (data.recipient.phone) text(data.recipient.phone, R, y, "right");
  font("semibold", 13, BLACK);
  const name = doc.splitTextToSize(data.recipient.name.toUpperCase(), R - M) as string[];
  name.slice(0, 2).forEach((l, i) => text(l, M, y + 6 + i * 5.4));
  y += 6 + (Math.min(name.length, 2) - 1) * 5.4;
  font("sans", 8.5, BLACK);
  const to = [
    data.recipient.company,
    data.destinationAddress,
    `${data.destinationCity}${data.destinationState ? `, ${data.destinationState}` : ""}`,
  ]
    .filter(Boolean)
    .flatMap((l) => (doc.splitTextToSize(l as string, R - M) as string[]).slice(0, 2));
  to.forEach((l, i) => text(l, M, y + 4.6 + i * 3.9));
  y += 4.6 + to.length * 3.9;
  font("semibold", 10, BLACK);
  text(data.destinationCountry.toUpperCase(), M, y + 1.4);
  font("monoMedium", 14, BLACK);
  text(data.destinationPostalCode || "", R, y + 1.6, "right");
  y += 5;
  rule(y, 0.8);

  // Tracking barcode.
  y += 4.4;
  font("medium", 6, BLACK);
  text("Tracking number", M, y);
  text(`Due ${fmtDate(data.estimatedDelivery)}`, R, y, "right");
  if (barcode) doc.addImage(barcode, "PNG", M, y + 2, R - M, 15);
  font("monoMedium", 11, BLACK);
  text(data.trackingNumber, W / 2 - doc.getTextWidth(data.trackingNumber) / 2, y + 22.4);
  y += 25.5;
  rule(y);

  // Consignment facts in four equal cells.
  const cells = [
    ["Weight", `${weight.toLocaleString("en-GB", { maximumFractionDigits: 2 })} kg`],
    ["Pieces", String(pieces)],
    ["Packages", String(data.packages.length)],
  ];
  const cw = (R - M) / cells.length;
  cells.forEach(([label, value], i) => {
    const x = M + i * cw;
    if (i > 0) {
      doc.setLineWidth(0.3);
      doc.line(x, y, x, y + 10);
    }
    font("medium", 5.6, BLACK);
    text(label, x + (i ? 2 : 0), y + 3.6);
    font("monoMedium", 8.5, BLACK);
    text(value, x + (i ? 2 : 0), y + 8.2);
  });
  y += 10;
  rule(y);

  // Tracking QR.
  const qrSize = Math.min(24, H - y - 6);
  doc.addImage(qr, "PNG", M, y + 2.5, qrSize, qrSize);
  font("semibold", 8, BLACK);
  text("Scan to track", M + qrSize + 4, y + 8);
  font("sans", 7, BLACK);
  text("aegiscargo.org/track", M + qrSize + 4, y + 12);
  text(data.trackingNumber, M + qrSize + 4, y + 16);

  return Buffer.from(doc.output("arraybuffer"));
}

/** 4 × 6 in thermal label (101.6 × 152.4 mm). */
export async function generateThermalLabel(data: LabelData): Promise<Buffer> {
  return renderLabel(data, { width: 101.6, height: 152.4 });
}
