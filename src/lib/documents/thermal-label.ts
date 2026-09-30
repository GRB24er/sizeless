import jsPDF from "jspdf";
import bwipjs from "bwip-js";
import { drawLogo, finalizePdf } from "./branding";
import { generateTrackingQR } from "./qr-generator";

// FedEx-style 4x6" thermal label (101.6mm x 152.4mm)
const LABEL_W = 101.6;
const LABEL_H = 152.4;

const BLACK = [0, 0, 0] as const;
const WHITE = [255, 255, 255] as const;
const GRAY = [120, 120, 120] as const;
const NAVY = [15, 29, 47] as const;

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
  packages: {
    weight: number;
    pieces: number;
    description: string;
  }[];
  recipient: {
    name: string;
    company?: string | null;
    phone: string;
  };
  Sender: {
    name: string;
    phone?: string;
  } | null;
};

function fmtDate(d: string | Date): string {
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export async function generateThermalLabel(
  data: LabelData
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [LABEL_W, LABEL_H],
  });

  const qr = await generateTrackingQR(data.trackingNumber);
  const totalWeight = data.packages.reduce((s, p) => s + p.weight, 0);
  const totalPieces = data.packages.reduce((s, p) => s + p.pieces, 0);
  const L = 3; // left margin
  const R = LABEL_W - 3; // right edge
  const W = R - L;

  // ═══════════════════════════════════════════
  // TOP BAR — Logo + Service Type
  // ═══════════════════════════════════════════
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, LABEL_W, 14, "F");

  drawLogo(doc, 3, 1.5, 11);

  // Service type badge
  doc.setFillColor(...WHITE);
  doc.roundedRect(R - 35, 2, 34, 10, 1, 1, "F");
  doc.setTextColor(...NAVY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text(data.serviceType.toUpperCase(), R - 18, 8.5, { align: "center" });

  let y = 17;

  // ═══════════════════════════════════════════
  // TRACKING NUMBER — Large + prominent
  // ═══════════════════════════════════════════
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.4);
  doc.rect(L, y, W, 12, "S");

  doc.setFontSize(4);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY);
  doc.text("TRACKING NUMBER", L + 2, y + 3);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLACK);
  doc.text(data.trackingNumber, L + 2, y + 9.5);

  y += 14;

  // ═══════════════════════════════════════════
  // FROM — Sender
  // ═══════════════════════════════════════════
  doc.setFillColor(245, 245, 245);
  doc.rect(L, y, W, 20, "F");
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  doc.rect(L, y, W, 20, "S");

  doc.setFontSize(4);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY);
  doc.text("FROM / SHIPPER", L + 2, y + 3.5);

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLACK);
  doc.text(data.Sender?.name || "Aegis Cargo", L + 2, y + 8);

  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");
  doc.text(data.originAddress, L + 2, y + 12);
  doc.text(
    `${data.originCity}, ${data.originState} ${data.originPostalCode}`,
    L + 2,
    y + 15.5
  );
  doc.setFont("helvetica", "bold");
  doc.text(data.originCountry.toUpperCase(), L + 2, y + 19);

  if (data.Sender?.phone) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.5);
    doc.setTextColor(...GRAY);
    doc.text(`T: ${data.Sender.phone}`, R - 2, y + 19, { align: "right" });
  }

  y += 22;

  // ═══════════════════════════════════════════
  // TO — Recipient (LARGE, prominent like FedEx)
  // ═══════════════════════════════════════════
  doc.setFillColor(...WHITE);
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.8);
  doc.rect(L, y, W, 28, "S");

  doc.setFontSize(4);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY);
  doc.text("SHIP TO / CONSIGNEE", L + 2, y + 3.5);

  // Recipient name — BIG
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLACK);
  doc.text(data.recipient.name.toUpperCase(), L + 2, y + 9.5);

  if (data.recipient.company) {
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(data.recipient.company, L + 2, y + 13);
  }

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(data.destinationAddress, L + 2, y + 16.5);
  doc.text(
    `${data.destinationCity}, ${data.destinationState} ${data.destinationPostalCode}`,
    L + 2,
    y + 20
  );

  // Country + postal code — HUGE (routing info)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(data.destinationCountry.toUpperCase(), L + 2, y + 27);

  // Postal code on right
  doc.setFontSize(14);
  doc.text(data.destinationPostalCode || "", R - 2, y + 27, {
    align: "right",
  });

  // Phone
  doc.setFontSize(4.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(`T: ${data.recipient.phone}`, R - 2, y + 3.5, { align: "right" });

  y += 30;

  // ═══════════════════════════════════════════
  // SHIPMENT INFO BAR
  // ═══════════════════════════════════════════
  doc.setFillColor(...NAVY);
  doc.rect(L, y, W, 5, "F");
  doc.setFontSize(4);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text("SHIPMENT DETAILS", L + 2, y + 3.5);

  y += 5;

  // Info grid
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  const qW = W / 4;

  // Row of details
  const cells = [
    { label: "WEIGHT", value: `${totalWeight} kg` },
    { label: "PIECES", value: `${totalPieces}` },
    { label: "DATE", value: fmtDate(data.createdAt) },
    { label: "ETA", value: fmtDate(data.estimatedDelivery) },
  ];

  cells.forEach((cell, i) => {
    const cx = L + i * qW;
    doc.rect(cx, y, qW, 10, "S");
    doc.setFontSize(3.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GRAY);
    doc.text(cell.label, cx + 1.5, y + 3);
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    doc.text(cell.value, cx + 1.5, y + 8);
  });

  y += 12;

  // ═══════════════════════════════════════════
  // QR CODE + BARCODE AREA
  // ═══════════════════════════════════════════
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.4);
  doc.rect(L, y, W, 30, "S");

  // QR on left
  doc.addImage(qr, "PNG", L + 4, y + 2, 26, 26);
  doc.setFontSize(3.5);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "bold");
  doc.text("SCAN TO TRACK", L + 17, y + 29.5, { align: "center" });

  // Code 128 barcode of the tracking number, on the right
  const barcodeX = L + 35;
  const barcodeW = W - 38;
  try {
    const png = await bwipjs.toBuffer({
      bcid: "code128",
      text: data.trackingNumber,
      scale: 3,
      height: 14,
      includetext: false,
      paddingwidth: 0,
      paddingheight: 0,
    });
    doc.addImage(`data:image/png;base64,${png.toString("base64")}`, "PNG", barcodeX, y + 3, barcodeW, 18);
  } catch (err) {
    console.error("Barcode generation failed:", err);
  }

  // Tracking number text under barcode
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLACK);
  doc.text(
    data.trackingNumber,
    barcodeX + barcodeW / 2,
    y + 25,
    { align: "center" }
  );

  y += 32;

  // ═══════════════════════════════════════════
  // FOOTER — Route + branding
  // ═══════════════════════════════════════════
  doc.setFillColor(...NAVY);
  doc.rect(0, LABEL_H - 10, LABEL_W, 10, "F");

  doc.setFontSize(5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text(
    `${data.originCity.toUpperCase()} TO ${data.destinationCity.toUpperCase()}`,
    LABEL_W / 2,
    LABEL_H - 5.5,
    { align: "center" }
  );

  doc.setFontSize(3.5);
  doc.setFont("helvetica", "normal");
  doc.text("aegiscargo.org", LABEL_W / 2, LABEL_H - 2.5, {
    align: "center",
  });

  return finalizePdf(doc, { watermark: false }); // barcodes must stay scannable
}