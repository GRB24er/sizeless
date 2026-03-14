import jsPDF from "jspdf";
import { generateTrackingQR, generateVaultQR } from "./qr-generator";
import { getLogoBase64, getLogoFormat } from "./logo-loader";

// ═══════════════════════════════════════════
// BRAND COLORS
// ═══════════════════════════════════════════
const NAVY = [10, 22, 40] as const;
const EMERALD = [5, 150, 105] as const;
const GOLD = [212, 168, 83] as const;
const WHITE = [255, 255, 255] as const;
const GRAY = [107, 114, 128] as const;
const LIGHT_GRAY = [243, 244, 246] as const;
const TEXT_DARK = [17, 24, 39] as const;
const TEXT_MED = [75, 85, 99] as const;

type Color = readonly [number, number, number];

type ShipmentData = {
  trackingNumber: string; serviceType: string; createdAt: string | Date;
  estimatedDelivery: string | Date; deliveredAt?: string | Date | null;
  originAddress: string; originCity: string; originState: string; originPostalCode: string; originCountry: string;
  destinationAddress: string; destinationCity: string; destinationState: string; destinationPostalCode: string; destinationCountry: string;
  specialInstructions?: string | null; isPaid: boolean;
  packages: { packageType: string; weight: number; length: number; width: number; height: number; declaredValue: number | null; description: string; pieces: number; dangerous: boolean; insurance: boolean }[];
  recipient: { name: string; company?: string | null; email?: string | null; phone: string };
  Sender: { name: string; email: string; phone?: string } | null;
  TrackingUpdates: { timestamp: string | Date; location: string | null; status: string | null; message: string }[];
};

type VaultData = {
  depositNumber: string; assetType: string; description: string; weightGrams: number;
  purity: string | null; quantity: number; declaredValue: number; serialNumbers: string | null;
  vaultLocation: string; storageUnit: string | null; insuredValue: number | null;
  depositDate: string | Date; verifiedAt: string | Date | null;
  client: { name: string; email: string; phone: string };
};

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════
function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "—"; }
}
function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
}
function fmtCurrency(n: number): string { return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`; }
function genDocId(): string { return "DOC-" + Math.random().toString(36).substring(2, 10).toUpperCase(); }

// ═══════════════════════════════════════════
// WATERMARK — Diagonal "AEGIS CARGO" across page
// ═══════════════════════════════════════════
function drawWatermark(doc: jsPDF) {
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.04 }));
  doc.setFontSize(60);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);

  // Rotate and draw diagonal watermark
  const centerX = 105;
  const centerY = 148;
  doc.text("AEGIS CARGO", centerX, centerY, {
    align: "center",
    angle: 45,
  });

  // Second smaller watermark
  doc.setFontSize(30);
  doc.text("OFFICIAL DOCUMENT", centerX, centerY + 30, {
    align: "center",
    angle: 45,
  });

  doc.restoreGraphicsState();
}

// ═══════════════════════════════════════════
// EMBOSSED CIRCULAR SEAL
// ═══════════════════════════════════════════
function drawEmbossedSeal(doc: jsPDF, x: number, y: number, size: number = 22) {
  const r = size;
  doc.saveGraphicsState();

  // Outer ring
  doc.setGState(new (doc as any).GState({ opacity: 0.15 }));
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(1.5);
  doc.circle(x, y, r, "S");

  // Inner ring
  doc.setLineWidth(0.8);
  doc.circle(x, y, r - 3, "S");

  // Inner double ring
  doc.setLineWidth(0.3);
  doc.circle(x, y, r - 4.5, "S");

  // Star decorations on the ring
  doc.setGState(new (doc as any).GState({ opacity: 0.12 }));
  const starPositions = [0, 60, 120, 180, 240, 300];
  starPositions.forEach(angle => {
    const rad = (angle * Math.PI) / 180;
    const sx = x + (r - 3.7) * Math.cos(rad);
    const sy = y + (r - 3.7) * Math.sin(rad);
    doc.setFillColor(...GOLD);
    doc.circle(sx, sy, 0.8, "F");
  });

  // Top curved text — "AEGIS CARGO LTD"
  doc.setGState(new (doc as any).GState({ opacity: 0.18 }));
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  const topText = "AEGIS CARGO LTD";
  const topRadius = r - 7;
  const startAngle = -Math.PI / 2 - ((topText.length * 0.09) / 2);
  for (let i = 0; i < topText.length; i++) {
    const angle = startAngle + i * 0.09;
    const cx = x + topRadius * Math.cos(angle);
    const cy = y + topRadius * Math.sin(angle);
    doc.text(topText[i], cx, cy, { align: "center", angle: -(angle * 180) / Math.PI - 90 });
  }

  // Bottom curved text — "CERTIFIED AUTHENTIC"
  const bottomText = "CERTIFIED AUTHENTIC";
  const bottomRadius = r - 7;
  const bStartAngle = Math.PI / 2 + ((bottomText.length * 0.085) / 2);
  for (let i = 0; i < bottomText.length; i++) {
    const angle = bStartAngle - i * 0.085;
    const cx = x + bottomRadius * Math.cos(angle);
    const cy = y + bottomRadius * Math.sin(angle);
    doc.text(bottomText[i], cx, cy, { align: "center", angle: -(angle * 180) / Math.PI + 90 });
  }

  // Center content
  doc.setGState(new (doc as any).GState({ opacity: 0.2 }));
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("AEGIS", x, y - 3, { align: "center" });
  doc.text("LOGISTICS", x, y + 1, { align: "center" });

  // Gold line separator
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.4);
  doc.line(x - 8, y + 3.5, x + 8, y + 3.5);

  doc.setFontSize(4.5);
  doc.setTextColor(...GOLD);
  doc.text("EST. 2024", x, y + 7, { align: "center" });

  // ISO badge
  doc.setFontSize(3.5);
  doc.setTextColor(...NAVY);
  doc.text("ISO 9001", x, y + 10.5, { align: "center" });

  doc.restoreGraphicsState();
}

// ═══════════════════════════════════════════
// BRANDED HEADER WITH LOGO
// ═══════════════════════════════════════════
function drawHeader(doc: jsPDF, title: string, docNumber: string) {
  // Navy bar
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 34, "F");

  // Gold accent line
  doc.setFillColor(...GOLD);
  doc.rect(0, 34, 210, 1.5, "F");

  // Emerald thin line under gold
  doc.setFillColor(...EMERALD);
  doc.rect(0, 35.5, 210, 0.5, "F");

  // Company logo
  const logo = getLogoBase64();
  if (logo) {
    try {
      doc.addImage(logo, getLogoFormat(), 12, 5, 50, 17);
    } catch {
      // Fallback to text if logo fails
      doc.setTextColor(...WHITE);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("AEGIS CARGO", 15, 16);
    }
  } else {
    // Text fallback
    doc.setTextColor(...WHITE);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("AEGIS", 15, 14);
    doc.setTextColor(...EMERALD);
    doc.text("LOGISTICS", 48, 14);
  }

  // Subtitle
  doc.setTextColor(180, 190, 200);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Global Logistics & Vault Services", 15, 27);
  doc.text("admin@aegiscargo.org  |  +44 020 1412 251", 15, 31);

  // Document title on right
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text(title.toUpperCase(), 195, 13, { align: "right" });

  // Doc number in gold
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GOLD);
  doc.text(docNumber, 195, 20, { align: "right" });

  // Date
  doc.setTextColor(180, 190, 200);
  doc.text(`Issued: ${fmtDate(new Date())}`, 195, 27, { align: "right" });

  // Emerald badge
  doc.setFillColor(...EMERALD);
  doc.roundedRect(155, 29, 40, 4, 1, 1, "F");
  doc.setFontSize(5);
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.text("ISO 9001 CERTIFIED", 175, 31.8, { align: "center" });
}

// ═══════════════════════════════════════════
// FOOTER WITH AUTHENTICATION BLOCK
// ═══════════════════════════════════════════
function drawFooter(doc: jsPDF, page: number = 1) {
  const y = 274;

  // Separator
  doc.setFillColor(...NAVY);
  doc.rect(15, y, 180, 0.5, "F");

  // Authentication text
  doc.setFontSize(6);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "italic");
  doc.text("This is an official document of Aegis Cargo Ltd. Verify authenticity by scanning the QR code or visiting aegiscargo.org/verify", 105, y + 4, { align: "center" });

  // Company info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("Aegis Cargo Ltd  |  Registered in Romania  |  Strada Bulevardul Unirii 72, Floor 3, Office 12, 030833 Bucharest, Romania", 105, y + 8, { align: "center" });

  // Certifications bar
  doc.setFillColor(...NAVY);
  doc.roundedRect(45, y + 10, 120, 5, 1, 1, "F");
  doc.setFontSize(5);
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.text("ISO 9001  |  LBMA APPROVED  |  IATA MEMBER  |  AEO CERTIFIED", 105, y + 13.5, { align: "center" });

  // Page and copyright
  doc.setFontSize(5.5);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  doc.text(`Page ${page}  |  © ${new Date().getFullYear()} Aegis Cargo. All rights reserved.`, 105, y + 19, { align: "center" });
}

// ═══════════════════════════════════════════
// SIGNATURE BLOCK WITH SEAL
// ═══════════════════════════════════════════
function drawSignatureBlock(doc: jsPDF, y: number, options: { showSeal?: boolean; sealX?: number; sealY?: number } = {}) {
  const { showSeal = true, sealX, sealY } = options;

  doc.setFillColor(250, 251, 252);
  doc.roundedRect(15, y, 180, 48, 2, 2, "F");
  doc.setDrawColor(220, 220, 225);
  doc.roundedRect(15, y, 180, 48, 2, 2, "S");

  // Title
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("AUTHORIZED VERIFICATION", 22, y + 8);

  // Gold underline
  doc.setFillColor(...GOLD);
  doc.rect(22, y + 10, 45, 0.5, "F");

  // Signature lines
  doc.setDrawColor(180, 180, 185);
  doc.setLineWidth(0.3);

  // Left: signature
  doc.line(22, y + 28, 85, y + 28);
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  doc.text("Authorized Signature", 22, y + 32);

  // Middle: name & title
  doc.line(22, y + 40, 85, y + 40);
  doc.text("Name & Title", 22, y + 44);

  // Right: date
  doc.line(95, y + 28, 145, y + 28);
  doc.text("Date", 95, y + 32);

  // Company authentication
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("Aegis Cargo Ltd.", 95, y + 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(...GRAY);
  doc.text("Authorized Document Issuer", 95, y + 44);

  // Draw embossed seal
  if (showSeal) {
    drawEmbossedSeal(doc, sealX || 170, sealY || y + 24, 20);
  }
}

// ═══════════════════════════════════════════
// REUSABLE DRAWING HELPERS
// ═══════════════════════════════════════════
function drawQR(doc: jsPDF, qrDataUrl: string, x: number, y: number, size: number = 25) {
  // QR background
  doc.setFillColor(...WHITE);
  doc.roundedRect(x - 1, y - 1, size + 2, size + 2, 1, 1, "F");
  doc.setDrawColor(220, 220, 225);
  doc.roundedRect(x - 1, y - 1, size + 2, size + 2, 1, 1, "S");

  doc.addImage(qrDataUrl, "PNG", x, y, size, size);
  doc.setFontSize(4.5);
  doc.setTextColor(...EMERALD);
  doc.setFont("helvetica", "bold");
  doc.text("SCAN TO VERIFY", x + size / 2, y + size + 3.5, { align: "center" });
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...EMERALD);
  doc.rect(15, y, 3, 6, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_DARK);
  doc.text(title, 22, y + 5);
  return y + 12;
}

function drawGoldSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...GOLD);
  doc.rect(15, y, 3, 6, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_DARK);
  doc.text(title, 22, y + 5);
  return y + 12;
}

function drawKeyValue(doc: jsPDF, key: string, value: string, x: number, y: number): number {
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(key.toUpperCase(), x, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_DARK);
  doc.text(value || "—", x, y + 5);
  return y + 12;
}

function drawTableRow(doc: jsPDF, cols: string[], y: number, isHeader: boolean, widths: number[]) {
  const x0 = 15;
  if (isHeader) {
    doc.setFillColor(...NAVY);
    doc.rect(x0, y - 4, 180, 8, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
  } else {
    if (Math.floor(y / 7) % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(x0, y - 4, 180, 8, "F");
    }
    doc.setTextColor(...TEXT_DARK);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
  }
  let cx = x0;
  cols.forEach((col, i) => {
    doc.text(col.substring(0, 25), cx + 2, y);
    cx += widths[i];
  });
}

// ═══════════════════════════════════════════
// 1. AIRWAY BILL
// ═══════════════════════════════════════════
export async function generateAirwayBill(data: ShipmentData): Promise<Buffer> {
  const doc = new jsPDF();
  const qr = await generateTrackingQR(data.trackingNumber);
  const totalWeight = data.packages.reduce((s, p) => s + p.weight, 0);
  const totalValue = data.packages.reduce((s, p) => s + (p.declaredValue || 0), 0);
  const totalPieces = data.packages.reduce((s, p) => s + p.pieces, 0);
  const L = 10; // left margin
  const R = 200; // right edge
  const W = R - L; // full content width

  // Helper: draw a labeled cell box
  function cell(x: number, y: number, w: number, h: number, label: string, value: string, opts?: { valueBold?: boolean; valueSize?: number; valueColor?: Color; labelColor?: Color }) {
    doc.setDrawColor(200, 205, 210);
    doc.setLineWidth(0.3);
    doc.rect(x, y, w, h, "S");
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...(opts?.labelColor || GRAY));
    doc.text(label.toUpperCase(), x + 2, y + 3.5);
    doc.setFontSize(opts?.valueSize || 8);
    doc.setFont("helvetica", opts?.valueBold !== false ? "bold" : "normal");
    doc.setTextColor(...(opts?.valueColor || TEXT_DARK));
    // Truncate if too long
    const maxW = w - 4;
    let txt = value || "—";
    while (doc.getTextWidth(txt) > maxW && txt.length > 3) txt = txt.slice(0, -1);
    doc.text(txt, x + 2, y + 8.5);
  }

  // ═══ WATERMARK ═══
  drawWatermark(doc);

  // ═══════════════════════════════════════════
  // HEADER BAR
  // ═══════════════════════════════════════════
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 28, "F");
  // Gold accent
  doc.setFillColor(...GOLD);
  doc.rect(0, 28, 210, 1.2, "F");
  // Emerald thin
  doc.setFillColor(...EMERALD);
  doc.rect(0, 29.2, 210, 0.4, "F");

  // Logo
  const logo = getLogoBase64();
  if (logo) {
    try { doc.addImage(logo, getLogoFormat(), 12, 3, 42, 15); } catch {}
  }
  doc.setTextColor(...WHITE);
  doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("Global Logistics & Vault Services", 12, 22);
  doc.setFontSize(5.5);
  doc.text("admin@aegiscargo.org  |  +44 020 1412 251  |  aegiscargo.org", 12, 26);

  // Document title right side
  doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(...WHITE);
  doc.text("AIR WAYBILL", R - 2, 11, { align: "right" });
  doc.setFontSize(7); doc.setTextColor(...GOLD); doc.setFont("helvetica", "normal");
  doc.text("ORIGINAL — FOR SHIPPER", R - 2, 17, { align: "right" });
  // ISO badge
  doc.setFillColor(...EMERALD);
  doc.roundedRect(163, 20, 35, 5, 1, 1, "F");
  doc.setFontSize(5); doc.setTextColor(...WHITE); doc.setFont("helvetica", "bold");
  doc.text("ISO 9001 CERTIFIED", 180.5, 23.5, { align: "center" });

  let y = 33;

  // ═══════════════════════════════════════════
  // ROW 1: TRACKING NUMBER + SERVICE + QR
  // ═══════════════════════════════════════════
  const r1h = 22;
  // Tracking number box
  doc.setFillColor(248, 250, 252);
  doc.rect(L, y, 120, r1h, "F");
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.8);
  doc.rect(L, y, 120, r1h, "S");
  doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...GRAY);
  doc.text("AWB / TRACKING NUMBER", L + 3, y + 4.5);
  doc.setFontSize(20); doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
  doc.text(data.trackingNumber, L + 3, y + 14);
  doc.setFontSize(7); doc.setTextColor(...EMERALD); doc.setFont("helvetica", "normal");
  doc.text(`${data.serviceType.toUpperCase()}  |  ${fmtDate(data.createdAt)}  |  ETA: ${fmtDate(data.estimatedDelivery)}`, L + 3, y + 19.5);

  // Service type badge
  doc.setFillColor(...GOLD);
  doc.roundedRect(90, y + 2, 28, 5, 1, 1, "F");
  doc.setFontSize(5); doc.setTextColor(...WHITE); doc.setFont("helvetica", "bold");
  doc.text(data.serviceType.toUpperCase(), 104, y + 5.5, { align: "center" });

  // QR code area
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.8);
  doc.rect(132, y, 68, r1h, "S");
  doc.addImage(qr, "PNG", 169, y + 1, 20, 20);
  doc.setFontSize(4.5); doc.setTextColor(...EMERALD); doc.setFont("helvetica", "bold");
  doc.text("SCAN TO VERIFY", 179, y + 21.5, { align: "center" });
  // Payment & terms in QR area
  doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...GRAY);
  doc.text("PAYMENT", 135, y + 5);
  doc.setFontSize(8); doc.setTextColor(...EMERALD); doc.setFont("helvetica", "bold");
  doc.text(data.isPaid ? "PREPAID" : "COLLECT", 135, y + 10);
  doc.setFontSize(5.5); doc.setTextColor(...GRAY); doc.setFont("helvetica", "bold");
  doc.text("TERMS", 135, y + 15);
  doc.setFontSize(8); doc.setTextColor(...TEXT_DARK);
  doc.text("DAP", 135, y + 20);

  y += r1h + 2;

  // ═══════════════════════════════════════════
  // ROW 2: SHIPPER + CONSIGNEE (side by side)
  // ═══════════════════════════════════════════
  const halfW = W / 2 - 1;
  const partyH = 42;

  // SHIPPER header
  doc.setFillColor(...NAVY);
  doc.rect(L, y, halfW, 6, "F");
  doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...WHITE);
  doc.text("SHIPPER / EXPORTER", L + 3, y + 4.2);

  // CONSIGNEE header
  doc.setFillColor(...NAVY);
  doc.rect(L + halfW + 2, y, halfW, 6, "F");
  doc.setTextColor(...WHITE);
  doc.text("CONSIGNEE / IMPORTER", L + halfW + 5, y + 4.2);

  y += 6;

  // Shipper box
  doc.setDrawColor(200, 205, 210); doc.setLineWidth(0.3);
  doc.rect(L, y, halfW, partyH, "S");
  let sy = y + 5;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
  doc.text(data.Sender?.name || "—", L + 3, sy);
  sy += 5;
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_DARK);
  doc.text(data.originAddress, L + 3, sy); sy += 4;
  doc.text(`${data.originCity}, ${data.originState} ${data.originPostalCode}`, L + 3, sy); sy += 4;
  doc.setFont("helvetica", "bold");
  doc.text(data.originCountry.toUpperCase(), L + 3, sy); sy += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(...GRAY);
  if (data.Sender?.phone) { doc.text(`T: ${data.Sender.phone}`, L + 3, sy); sy += 3.5; }
  if (data.Sender?.email) { doc.text(`E: ${data.Sender.email}`, L + 3, sy); }

  // Consignee box
  const cx = L + halfW + 2;
  doc.setDrawColor(200, 205, 210); doc.rect(cx, y, halfW, partyH, "S");
  let cy = y + 5;
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
  doc.text(data.recipient.name, cx + 3, cy); cy += 5;
  if (data.recipient.company) { doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MED); doc.text(data.recipient.company, cx + 3, cy); cy += 4; }
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_DARK);
  doc.text(data.destinationAddress, cx + 3, cy); cy += 4;
  doc.text(`${data.destinationCity}, ${data.destinationState} ${data.destinationPostalCode}`, cx + 3, cy); cy += 4;
  doc.setFont("helvetica", "bold");
  doc.text(data.destinationCountry.toUpperCase(), cx + 3, cy); cy += 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(6.5); doc.setTextColor(...GRAY);
  doc.text(`T: ${data.recipient.phone}`, cx + 3, cy); cy += 3.5;
  if (data.recipient.email) { doc.text(`E: ${data.recipient.email}`, cx + 3, cy); }

  y += partyH + 2;

  // ═══════════════════════════════════════════
  // ROW 3: SHIPMENT DETAILS (4 cells)
  // ═══════════════════════════════════════════
  doc.setFillColor(...EMERALD);
  doc.rect(L, y, W, 5, "F");
  doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...WHITE);
  doc.text("SHIPMENT DETAILS", L + 3, y + 3.5);
  y += 5;

  const qW = W / 4;
  cell(L, y, qW, 12, "Date Issued", fmtDate(data.createdAt));
  cell(L + qW, y, qW, 12, "Est. Delivery", fmtDate(data.estimatedDelivery), { valueColor: EMERALD });
  cell(L + qW * 2, y, qW, 12, "Total Pieces", `${totalPieces} piece${totalPieces !== 1 ? "s" : ""}`);
  cell(L + qW * 3, y, qW, 12, "Total Weight", `${totalWeight.toFixed(1)} kg`, { valueBold: true });
  y += 14;

  // ═══════════════════════════════════════════
  // ROW 4: PACKAGE TABLE
  // ═══════════════════════════════════════════
  doc.setFillColor(...NAVY);
  doc.rect(L, y, W, 5, "F");
  doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...WHITE);
  doc.text("GOODS / PACKAGE DETAILS", L + 3, y + 3.5);
  y += 5;

  // Table header
  const tw = [12, 50, 22, 22, 30, 22, 18, 14];
  const th = ["No.", "DESCRIPTION", "TYPE", "PCS", "DIMENSIONS", "WEIGHT", "VALUE", "INS"];
  doc.setFillColor(230, 235, 240);
  doc.rect(L, y, W, 6, "F");
  doc.setDrawColor(200, 205, 210); doc.setLineWidth(0.2);
  doc.rect(L, y, W, 6, "S");
  doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
  let tx = L + 2;
  th.forEach((h, i) => { doc.text(h, tx, y + 4); tx += tw[i]; });
  y += 6;

  // Table rows
  data.packages.forEach((pkg, i) => {
    const rowH = 7;
    if (i % 2 === 0) { doc.setFillColor(250, 251, 252); doc.rect(L, y, W, rowH, "F"); }
    doc.setDrawColor(230, 232, 235); doc.setLineWidth(0.15);
    doc.line(L, y + rowH, R, y + rowH);

    tx = L + 2;
    doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_DARK);
    doc.text(`${i + 1}`, tx, y + 4.5); tx += tw[0];
    doc.setFont("helvetica", "bold");
    doc.text((pkg.description || "—").substring(0, 30), tx, y + 4.5); tx += tw[1];
    doc.setFont("helvetica", "normal");
    doc.text(pkg.packageType, tx, y + 4.5); tx += tw[2];
    doc.text(`${pkg.pieces}`, tx, y + 4.5); tx += tw[3];
    doc.text(`${pkg.length}×${pkg.width}×${pkg.height}`, tx, y + 4.5); tx += tw[4];
    doc.setFont("helvetica", "bold");
    doc.text(`${pkg.weight} kg`, tx, y + 4.5); tx += tw[5];
    doc.setFont("helvetica", "normal");
    doc.text(fmtCurrency(pkg.declaredValue || 0), tx, y + 4.5); tx += tw[6];
    if (pkg.insurance) {
      doc.setTextColor(...EMERALD); doc.setFont("helvetica", "bold");
      doc.text("YES", tx, y + 4.5);
    } else {
      doc.setTextColor(...GRAY); doc.text("—", tx + 2, y + 4.5);
    }
    doc.setTextColor(...TEXT_DARK);
    y += rowH;
  });

  // TOTALS BAR
  doc.setFillColor(...NAVY);
  doc.rect(L, y, W, 8, "F");
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...WHITE);
  doc.text("TOTALS:", L + 4, y + 5.5);
  doc.text(`${totalPieces} pcs`, L + 40, y + 5.5);
  doc.text(`${totalWeight.toFixed(2)} kg`, L + 90, y + 5.5);
  doc.setTextColor(...GOLD);
  doc.text(fmtCurrency(totalValue), L + 140, y + 5.5);
  const dg = data.packages.some(p => p.dangerous);
  if (dg) { doc.setTextColor(255, 80, 80); doc.text("⚠ DANGEROUS GOODS", L + 168, y + 5.5); }
  y += 10;

  // ═══════════════════════════════════════════
  // ROW 5: HANDLING + CARRIER (side by side)
  // ═══════════════════════════════════════════
  const boxH = 18;
  // Handling
  doc.setFillColor(...EMERALD);
  doc.rect(L, y, halfW, 5, "F");
  doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...WHITE);
  doc.text("HANDLING INSTRUCTIONS", L + 3, y + 3.5);
  doc.setDrawColor(200, 205, 210); doc.setLineWidth(0.3);
  doc.rect(L, y + 5, halfW, boxH, "S");
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_DARK);
  if (data.specialInstructions) {
    const lines = doc.splitTextToSize(data.specialInstructions, halfW - 6);
    doc.text(lines.slice(0, 3), L + 3, y + 10);
  } else {
    doc.setTextColor(...GRAY);
    doc.text("Handle with care. Keep dry. This side up.", L + 3, y + 10);
    doc.text("Do not stack. Fragile contents.", L + 3, y + 14);
  }

  // Carrier
  doc.setFillColor(...EMERALD);
  doc.rect(cx, y, halfW, 5, "F");
  doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...WHITE);
  doc.text("CARRIER / FLIGHT INFORMATION", cx + 3, y + 3.5);
  doc.setDrawColor(200, 205, 210); doc.rect(cx, y + 5, halfW, boxH, "S");
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
  doc.text("Aegis Cargo Ltd", cx + 3, y + 11);
  doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY);
  doc.text("IATA Code: AML  |  License: UK-AIR-2024-0891", cx + 3, y + 15.5);
  doc.text("Strada Bulevardul Unirii 72, Floor 3, Office 12, 030833 Bucharest, Romania", cx + 3, y + 19.5);

  y += boxH + 7;

  // ═══════════════════════════════════════════
  // ROW 6: DECLARATION + SIGNATURE + SEAL + QR
  // ═══════════════════════════════════════════
  doc.setFillColor(...GOLD);
  doc.rect(L, y, W, 5, "F");
  doc.setFontSize(5.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...WHITE);
  doc.text("AUTHORIZED VERIFICATION & DECLARATION", L + 3, y + 3.5);
  y += 5;

  doc.setDrawColor(200, 205, 210); doc.setLineWidth(0.3);
  doc.rect(L, y, W, 40, "S");

  // Left side: Declaration text
  doc.setFontSize(6); doc.setFont("helvetica", "italic"); doc.setTextColor(...GRAY);
  doc.text("I hereby declare that the information on this document is true and correct to the", L + 3, y + 5);
  doc.text("best of my knowledge. The goods described are not restricted or prohibited.", L + 3, y + 9);

  // Signature lines
  doc.setDrawColor(180, 180, 185); doc.setLineWidth(0.3);
  doc.line(L + 3, y + 22, L + 65, y + 22);
  doc.setFontSize(5.5); doc.setTextColor(...GRAY); doc.setFont("helvetica", "normal");
  doc.text("Authorized Signature", L + 3, y + 25.5);

  doc.line(L + 3, y + 34, L + 65, y + 34);
  doc.text("Name & Title", L + 3, y + 37.5);

  doc.line(L + 72, y + 22, L + 120, y + 22);
  doc.text("Date", L + 72, y + 25.5);

  // Company stamp area
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
  doc.text("Aegis Cargo Ltd.", L + 72, y + 32);
  doc.setFontSize(5.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY);
  doc.text("Authorized Document Issuer", L + 72, y + 36);

  // Embossed seal (right side)
  drawEmbossedSeal(doc, R - 25, y + 20, 17);

  y += 42;

  // ═══════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════
  // Navy separator
  doc.setFillColor(...NAVY);
  doc.rect(L, y, W, 0.5, "F");
  y += 2;

  // Authentication
  doc.setFontSize(5); doc.setTextColor(...GRAY); doc.setFont("helvetica", "italic");
  doc.text("This is an official document of Aegis Cargo Ltd. Verify authenticity by scanning the QR code or visiting aegiscargo.org/verify", 105, y + 1, { align: "center" });

  // Company details
  doc.setFont("helvetica", "normal"); doc.setFontSize(5.5);
  doc.text("Aegis Cargo Ltd  |  Registered in Romania  |  Strada Bulevardul Unirii 72, Floor 3, Office 12, 030833 Bucharest, Romania", 105, y + 5, { align: "center" });

  // Certifications bar
  doc.setFillColor(...NAVY);
  doc.roundedRect(40, y + 7, 130, 5, 1, 1, "F");
  doc.setFontSize(4.5); doc.setTextColor(...WHITE); doc.setFont("helvetica", "bold");
  doc.text("ISO 9001  |  LBMA APPROVED  |  IATA MEMBER  |  AEO CERTIFIED  |  TAPA FSR", 105, y + 10.5, { align: "center" });

  // Copyright
  doc.setFontSize(4.5); doc.setTextColor(...GRAY); doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${fmtDateTime(new Date())}  |  Page 1  |  © ${new Date().getFullYear()} Aegis Cargo. All rights reserved.`, 105, y + 15, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}

// ═══════════════════════════════════════════
// 2. COMMERCIAL INVOICE
// ═══════════════════════════════════════════
export async function generateCommercialInvoice(data: ShipmentData): Promise<Buffer> {
  const doc = new jsPDF();
  const docId = genDocId();
  const qr = await generateTrackingQR(data.trackingNumber);

  drawWatermark(doc);
  drawHeader(doc, "Commercial Invoice", docId);
  drawQR(doc, qr, 170, 40, 25);

  let y = 44;
  drawKeyValue(doc, "Invoice Number", docId, 15, y);
  drawKeyValue(doc, "AWB / Tracking", data.trackingNumber, 70, y);
  drawKeyValue(doc, "Invoice Date", fmtDate(new Date()), 130, y);
  y += 16;
  drawKeyValue(doc, "Service Type", data.serviceType, 15, y);
  drawKeyValue(doc, "Payment Status", data.isPaid ? "PAID" : "PENDING", 70, y);

  y += 16;
  y = drawSectionTitle(doc, "Seller (Shipper)", y);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_DARK);
  doc.text(data.Sender?.name || "—", 22, y + 2);
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MED);
  doc.text(`${data.originAddress}, ${data.originCity}, ${data.originState} ${data.originPostalCode}`, 22, y + 8);
  doc.text(data.originCountry, 22, y + 14);

  y += 20;
  y = drawGoldSectionTitle(doc, "Buyer (Consignee)", y);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_DARK);
  doc.text(data.recipient.name, 22, y + 2);
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MED);
  doc.text(`${data.destinationAddress}, ${data.destinationCity}, ${data.destinationState} ${data.destinationPostalCode}`, 22, y + 8);
  doc.text(data.destinationCountry, 22, y + 14);

  y += 22;
  y = drawSectionTitle(doc, "Items", y);
  const widths = [10, 55, 20, 25, 25, 25, 20];
  drawTableRow(doc, ["#", "Description", "Qty", "Weight", "Unit Price", "Total", "Origin"], y, true, widths);
  y += 8;
  let grandTotal = 0;
  data.packages.forEach((pkg, i) => {
    const total = pkg.declaredValue || 0;
    grandTotal += total;
    drawTableRow(doc, [
      `${i + 1}`, pkg.description.substring(0, 30), `${pkg.pieces}`,
      `${pkg.weight} kg`, fmtCurrency(total / Math.max(pkg.pieces, 1)),
      fmtCurrency(total), data.originCountry.substring(0, 5)
    ], y, false, widths);
    y += 8;
  });

  y += 4;
  doc.setFillColor(...NAVY); doc.roundedRect(130, y, 65, 12, 2, 2, "F");
  doc.setTextColor(...GOLD); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: ${fmtCurrency(grandTotal)}`, 135, y + 8);

  // Declaration
  y += 20;
  doc.setFontSize(7); doc.setTextColor(...GRAY); doc.setFont("helvetica", "italic");
  doc.text("I declare that the information on this invoice is true and correct and that the contents are as stated above.", 15, y, { maxWidth: 180 });

  drawSignatureBlock(doc, 218);
  drawFooter(doc);
  return Buffer.from(doc.output("arraybuffer"));
}

// ═══════════════════════════════════════════
// 3. PACKING LIST
// ═══════════════════════════════════════════
export async function generatePackingList(data: ShipmentData): Promise<Buffer> {
  const doc = new jsPDF();
  const docId = genDocId();
  const qr = await generateTrackingQR(data.trackingNumber);

  drawWatermark(doc);
  drawHeader(doc, "Packing List", docId);
  drawQR(doc, qr, 170, 40, 25);

  let y = 44;
  drawKeyValue(doc, "AWB Number", data.trackingNumber, 15, y);
  drawKeyValue(doc, "Date", fmtDate(data.createdAt), 80, y);

  y += 16;
  y = drawSectionTitle(doc, "Shipper", y);
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_DARK);
  doc.text(`${data.Sender?.name || "—"} — ${data.originCity}, ${data.originCountry}`, 22, y + 2);

  y += 10;
  y = drawGoldSectionTitle(doc, "Consignee", y);
  doc.text(`${data.recipient.name} — ${data.destinationCity}, ${data.destinationCountry}`, 22, y + 2);

  y += 14;
  y = drawSectionTitle(doc, "Package Contents", y);

  data.packages.forEach((pkg, i) => {
    doc.setFillColor(i % 2 === 0 ? 250 : 246, i % 2 === 0 ? 251 : 248, i % 2 === 0 ? 252 : 250);
    doc.roundedRect(15, y - 2, 180, 28, 2, 2, "F");
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
    doc.text(`Package ${i + 1}`, 20, y + 4);
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MED);
    doc.text(`Type: ${pkg.packageType}  |  Pieces: ${pkg.pieces}  |  Dangerous: ${pkg.dangerous ? "YES ⚠" : "No"}`, 20, y + 10);
    doc.text(`Dimensions: ${pkg.length} × ${pkg.width} × ${pkg.height} cm  |  Weight: ${pkg.weight} kg`, 20, y + 16);
    doc.text(`Description: ${pkg.description}`, 20, y + 22);
    y += 32;
  });

  y += 4;
  const totalPieces = data.packages.reduce((s, p) => s + p.pieces, 0);
  const totalWeight = data.packages.reduce((s, p) => s + p.weight, 0);
  doc.setFillColor(...EMERALD); doc.roundedRect(15, y, 180, 12, 2, 2, "F");
  doc.setTextColor(...WHITE); doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text(`Total Packages: ${data.packages.length}  |  Total Pieces: ${totalPieces}  |  Total Weight: ${totalWeight} kg`, 20, y + 8);

  drawSignatureBlock(doc, 218);
  drawFooter(doc);
  return Buffer.from(doc.output("arraybuffer"));
}

// ═══════════════════════════════════════════
// 4. SHIPPING LABEL
// ═══════════════════════════════════════════
export async function generateShippingLabel(data: ShipmentData): Promise<Buffer> {
  const doc = new jsPDF({ format: [100, 150] });
  const qr = await generateTrackingQR(data.trackingNumber);

  // Header
  doc.setFillColor(...NAVY); doc.rect(0, 0, 100, 18, "F");
  doc.setFillColor(...GOLD); doc.rect(0, 18, 100, 1, "F");
  doc.setFillColor(...EMERALD); doc.rect(0, 19, 100, 0.5, "F");

  const logo = getLogoBase64();
  if (logo) {
    try { doc.addImage(logo, getLogoFormat(), 3, 2, 35, 12); } catch {}
  } else {
    doc.setTextColor(...WHITE); doc.setFontSize(10); doc.setFont("helvetica", "bold");
    doc.text("AEGIS CARGO", 5, 10);
  }
  doc.setTextColor(...GOLD); doc.setFontSize(6); doc.setFont("helvetica", "bold");
  doc.text(data.serviceType.toUpperCase(), 5, 16);

  // QR
  doc.addImage(qr, "PNG", 68, 22, 28, 28);

  // Tracking
  doc.setFontSize(5); doc.setTextColor(...GRAY); doc.setFont("helvetica", "normal");
  doc.text("TRACKING NUMBER", 5, 24);
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
  doc.text(data.trackingNumber, 5, 31);

  // FROM
  let y = 42;
  doc.setFontSize(5.5); doc.setTextColor(...EMERALD); doc.setFont("helvetica", "bold");
  doc.text("FROM:", 5, y);
  doc.setFontSize(8); doc.setTextColor(...TEXT_DARK); doc.setFont("helvetica", "bold");
  doc.text(data.Sender?.name || "—", 5, y + 5);
  doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MED);
  doc.text(`${data.originCity}, ${data.originState} ${data.originPostalCode}`, 5, y + 10);
  doc.text(data.originCountry, 5, y + 14);

  y += 20;
  doc.setDrawColor(...GOLD); doc.setLineWidth(0.5); doc.line(5, y, 95, y);

  y += 4;
  doc.setFontSize(5.5); doc.setTextColor(...GOLD); doc.setFont("helvetica", "bold");
  doc.text("DELIVER TO:", 5, y);
  doc.setFontSize(10); doc.setTextColor(...TEXT_DARK); doc.setFont("helvetica", "bold");
  doc.text(data.recipient.name, 5, y + 6);
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MED);
  doc.text(data.destinationAddress.substring(0, 45), 5, y + 12);
  doc.text(`${data.destinationCity}, ${data.destinationState} ${data.destinationPostalCode}`, 5, y + 17);
  doc.setFont("helvetica", "bold");
  doc.text(data.destinationCountry.toUpperCase(), 5, y + 22);
  doc.setFont("helvetica", "normal");
  doc.text(`Tel: ${data.recipient.phone}`, 5, y + 27);

  // Weight bar
  y += 34;
  doc.setFillColor(...NAVY); doc.rect(0, y, 100, 10, "F");
  const tw = data.packages.reduce((s, p) => s + p.weight, 0);
  const tp = data.packages.reduce((s, p) => s + p.pieces, 0);
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...WHITE);
  doc.text(`WT: ${tw} kg`, 5, y + 7);
  doc.text(`PCS: ${tp}`, 35, y + 7);
  doc.text(`PKG: ${data.packages.length}`, 60, y + 7);

  // Mini seal
  drawEmbossedSeal(doc, 85, y - 8, 8);

  // Footer
  doc.setFillColor(...GOLD); doc.rect(0, 147, 100, 0.5, "F");
  doc.setFontSize(4.5); doc.setTextColor(...GRAY); doc.setFont("helvetica", "normal");
  doc.text("Aegis Cargo Ltd  |  aegiscargo.org  |  ISO 9001", 50, 149, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}

// ═══════════════════════════════════════════
// 5. DELIVERY NOTE
// ═══════════════════════════════════════════
export async function generateDeliveryNote(data: ShipmentData): Promise<Buffer> {
  const doc = new jsPDF();
  const docId = genDocId();
  const qr = await generateTrackingQR(data.trackingNumber);

  drawWatermark(doc);
  drawHeader(doc, "Delivery Note", docId);
  drawQR(doc, qr, 170, 40, 25);

  let y = 44;
  drawKeyValue(doc, "AWB Number", data.trackingNumber, 15, y);
  drawKeyValue(doc, "Delivery Date", fmtDate(data.estimatedDelivery), 80, y);
  drawKeyValue(doc, "Service", data.serviceType, 140, y);

  y += 18;
  y = drawGoldSectionTitle(doc, "Deliver To", y);
  doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_DARK);
  doc.text(data.recipient.name, 22, y + 2);
  if (data.recipient.company) { doc.setFontSize(9); doc.text(data.recipient.company, 22, y + 8); y += 6; }
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MED);
  doc.text(data.destinationAddress, 22, y + 8);
  doc.text(`${data.destinationCity}, ${data.destinationState} ${data.destinationPostalCode}`, 22, y + 14);
  doc.text(`${data.destinationCountry}  |  Tel: ${data.recipient.phone}`, 22, y + 20);

  y += 30;
  y = drawSectionTitle(doc, "Items for Delivery", y);
  const widths = [10, 60, 20, 40, 25, 25];
  drawTableRow(doc, ["#", "Description", "Pcs", "Dimensions", "Weight", "Value"], y, true, widths);
  y += 8;
  data.packages.forEach((pkg, i) => {
    drawTableRow(doc, [
      `${i + 1}`, pkg.description.substring(0, 35), `${pkg.pieces}`,
      `${pkg.length}×${pkg.width}×${pkg.height}`, `${pkg.weight} kg`, fmtCurrency(pkg.declaredValue || 0)
    ], y, false, widths);
    y += 8;
  });

  // Recipient signature block
  y += 12;
  doc.setFillColor(250, 251, 252); doc.roundedRect(15, y, 180, 44, 2, 2, "F");
  doc.setDrawColor(220, 220, 225); doc.roundedRect(15, y, 180, 44, 2, 2, "S");
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
  doc.text("PROOF OF RECEIPT", 22, y + 8);
  doc.setFillColor(...GOLD); doc.rect(22, y + 10, 35, 0.5, "F");

  doc.setDrawColor(180, 180, 185); doc.setLineWidth(0.3);
  doc.line(22, y + 25, 85, y + 25);
  doc.line(95, y + 25, 145, y + 25);
  doc.setFontSize(6.5); doc.setTextColor(...GRAY); doc.setFont("helvetica", "normal");
  doc.text("Recipient Signature", 22, y + 29);
  doc.text("Date & Time", 95, y + 29);
  doc.text("Print Name: ___________________________", 22, y + 38);
  doc.text("ID Number: ____________________________", 95, y + 38);

  // Seal
  drawEmbossedSeal(doc, 172, y + 22, 18);

  drawFooter(doc);
  return Buffer.from(doc.output("arraybuffer"));
}

// ═══════════════════════════════════════════
// 6. PROOF OF DELIVERY
// ═══════════════════════════════════════════
export async function generateProofOfDelivery(data: ShipmentData): Promise<Buffer> {
  const doc = new jsPDF();
  const docId = genDocId();
  const qr = await generateTrackingQR(data.trackingNumber);

  drawWatermark(doc);
  drawHeader(doc, "Proof of Delivery", docId);
  drawQR(doc, qr, 170, 40, 25);

  let y = 44;
  // Delivered banner
  doc.setFillColor(...EMERALD); doc.roundedRect(15, y, 145, 10, 2, 2, "F");
  doc.setTextColor(...WHITE); doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("✓  DELIVERED SUCCESSFULLY", 22, y + 7);

  y += 18;
  drawKeyValue(doc, "AWB Number", data.trackingNumber, 15, y);
  drawKeyValue(doc, "Delivered At", fmtDateTime(data.deliveredAt || data.estimatedDelivery), 80, y);

  y += 16;
  y = drawGoldSectionTitle(doc, "Delivery Details", y);
  drawKeyValue(doc, "Recipient Name", data.recipient.name, 22, y);
  drawKeyValue(doc, "Address", `${data.destinationAddress}, ${data.destinationCity}`, 22, y + 12);
  drawKeyValue(doc, "Country", `${data.destinationState}, ${data.destinationCountry} ${data.destinationPostalCode}`, 22, y + 24);

  y += 40;
  y = drawSectionTitle(doc, "Shipment Summary", y);
  const totalWeight = data.packages.reduce((s, p) => s + p.weight, 0);
  const totalPieces = data.packages.reduce((s, p) => s + p.pieces, 0);
  const totalValue = data.packages.reduce((s, p) => s + (p.declaredValue || 0), 0);
  drawKeyValue(doc, "Packages", `${data.packages.length}`, 22, y);
  drawKeyValue(doc, "Total Pieces", `${totalPieces}`, 65, y);
  drawKeyValue(doc, "Total Weight", `${totalWeight} kg`, 110, y);
  drawKeyValue(doc, "Total Value", fmtCurrency(totalValue), 155, y);

  // Delivery confirmation with seal
  drawSignatureBlock(doc, 210, { showSeal: true, sealX: 172, sealY: 232 });

  drawFooter(doc);
  return Buffer.from(doc.output("arraybuffer"));
}

// ═══════════════════════════════════════════
// 7. VAULT CERTIFICATE
// ═══════════════════════════════════════════
export async function generateVaultCertificate(data: VaultData): Promise<Buffer> {
  const doc = new jsPDF();
  const docId = genDocId();
  const qr = await generateVaultQR(data.depositNumber);

  drawWatermark(doc);

  // Custom gold-accented header
  doc.setFillColor(...NAVY); doc.rect(0, 0, 210, 36, "F");
  doc.setFillColor(...GOLD); doc.rect(0, 36, 210, 2, "F");
  doc.setFillColor(...EMERALD); doc.rect(0, 38, 210, 0.5, "F");

  const logo = getLogoBase64();
  if (logo) {
    try { doc.addImage(logo, getLogoFormat(), 12, 5, 50, 17); } catch {}
  } else {
    doc.setTextColor(...WHITE); doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("AEGIS CARGO", 15, 16);
  }
  doc.setTextColor(180, 190, 200); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("Vault Services Division  |  LBMA Approved", 15, 27);
  doc.text("admin@aegiscargo.org  |  +44 020 1412 251", 15, 31);

  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(...GOLD);
  doc.text("VAULT DEPOSIT CERTIFICATE", 195, 14, { align: "right" });
  doc.setFontSize(8); doc.setTextColor(180, 190, 200); doc.setFont("helvetica", "normal");
  doc.text(`Certificate: ${docId}`, 195, 22, { align: "right" });
  doc.text(`Issued: ${fmtDate(new Date())}`, 195, 28, { align: "right" });

  drawQR(doc, qr, 168, 44, 28);

  let y = 48;
  // Gold deposit number box
  doc.setFillColor(255, 251, 235); doc.roundedRect(15, y - 2, 145, 20, 2, 2, "F");
  doc.setDrawColor(...GOLD); doc.roundedRect(15, y - 2, 145, 20, 2, 2, "S");
  doc.setFontSize(7); doc.setTextColor(...GOLD); doc.setFont("helvetica", "normal");
  doc.text("DEPOSIT NUMBER", 20, y + 4);
  doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
  doc.text(data.depositNumber, 20, y + 14);

  y += 28;
  y = drawGoldSectionTitle(doc, "Depositor Information", y);
  drawKeyValue(doc, "Name", data.client.name, 22, y);
  drawKeyValue(doc, "Email", data.client.email, 80, y);
  drawKeyValue(doc, "Phone", data.client.phone, 145, y);

  y += 16;
  y = drawSectionTitle(doc, "Asset Details", y);
  drawKeyValue(doc, "Asset Type", data.assetType, 22, y);
  drawKeyValue(doc, "Quantity", `${data.quantity}`, 80, y);
  drawKeyValue(doc, "Purity", data.purity || "N/A", 130, y);
  y += 14;
  drawKeyValue(doc, "Weight", `${data.weightGrams}g`, 22, y);
  drawKeyValue(doc, "Declared Value", fmtCurrency(data.declaredValue), 80, y);
  drawKeyValue(doc, "Insured Value", data.insuredValue ? fmtCurrency(data.insuredValue) : "Pending", 130, y);
  y += 14;
  if (data.serialNumbers) { drawKeyValue(doc, "Serial Numbers", data.serialNumbers, 22, y); y += 14; }
  drawKeyValue(doc, "Description", data.description, 22, y);

  y += 16;
  y = drawGoldSectionTitle(doc, "Storage Details", y);
  drawKeyValue(doc, "Vault Location", data.vaultLocation, 22, y);
  drawKeyValue(doc, "Storage Unit", data.storageUnit || "To be assigned", 80, y);
  drawKeyValue(doc, "Deposit Date", fmtDate(data.depositDate), 145, y);

  // Certification statement
  y += 18;
  doc.setFillColor(255, 251, 235); doc.roundedRect(15, y, 180, 20, 2, 2, "F");
  doc.setDrawColor(...GOLD); doc.roundedRect(15, y, 180, 20, 2, 2, "S");
  doc.setFontSize(6.5); doc.setFont("helvetica", "italic"); doc.setTextColor(...TEXT_MED);
  doc.text("This certifies that the assets described above have been received and are held in secure custody by Aegis Cargo", 20, y + 5, { maxWidth: 170 });
  doc.text("Vault Services in accordance with LBMA standards. Assets are fully insured and subject to quarterly independent audits.", 20, y + 10, { maxWidth: 170 });
  doc.text("This certificate must be presented for any release or transfer requests.", 20, y + 15, { maxWidth: 170 });

  // Seal & signature
  drawSignatureBlock(doc, 218, { showSeal: true, sealX: 172, sealY: 240 });

  drawFooter(doc);
  return Buffer.from(doc.output("arraybuffer"));
}

// ═══════════════════════════════════════════
// 8. INSURANCE CERTIFICATE
// ═══════════════════════════════════════════
export async function generateInsuranceCertificate(data: ShipmentData): Promise<Buffer> {
  const doc = new jsPDF();
  const docId = genDocId();
  const qr = await generateTrackingQR(data.trackingNumber);

  drawWatermark(doc);
  drawHeader(doc, "Insurance Certificate", docId);
  drawQR(doc, qr, 170, 40, 25);

  let y = 44;
  doc.setFillColor(...EMERALD); doc.roundedRect(15, y, 145, 10, 2, 2, "F");
  doc.setTextColor(...WHITE); doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("SHIPMENT INSURANCE — FULL COVERAGE", 22, y + 7);

  y += 18;
  drawKeyValue(doc, "Certificate Number", docId, 15, y);
  drawKeyValue(doc, "AWB Number", data.trackingNumber, 80, y);
  drawKeyValue(doc, "Issue Date", fmtDate(new Date()), 145, y);

  y += 16;
  y = drawSectionTitle(doc, "Insured Party (Shipper)", y);
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_DARK);
  doc.text(data.Sender?.name || "—", 22, y + 2);
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MED);
  doc.text(`${data.originAddress}, ${data.originCity}, ${data.originCountry}`, 22, y + 8);

  y += 16;
  y = drawGoldSectionTitle(doc, "Coverage Details", y);
  const totalValue = data.packages.reduce((s, p) => s + (p.declaredValue || 0), 0);
  const insuredPkgs = data.packages.filter(p => p.insurance);
  drawKeyValue(doc, "Total Declared Value", fmtCurrency(totalValue), 22, y);
  drawKeyValue(doc, "Insured Value", fmtCurrency(totalValue), 90, y);
  y += 14;
  drawKeyValue(doc, "Coverage Type", "All-Risk (Door to Door)", 22, y);
  drawKeyValue(doc, "Packages Insured", `${insuredPkgs.length} of ${data.packages.length}`, 110, y);
  y += 14;
  drawKeyValue(doc, "Route", `${data.originCity}, ${data.originCountry} → ${data.destinationCity}, ${data.destinationCountry}`, 22, y);

  y += 18;
  doc.setFillColor(240, 253, 244); doc.roundedRect(15, y, 180, 22, 2, 2, "F");
  doc.setDrawColor(187, 247, 208); doc.roundedRect(15, y, 180, 22, 2, 2, "S");
  doc.setFontSize(6.5); doc.setFont("helvetica", "italic"); doc.setTextColor(...TEXT_MED);
  doc.text("This certificate confirms that the goods described above are insured against loss or damage during transit.", 20, y + 5, { maxWidth: 170 });
  doc.text("Coverage applies from the point of pickup to final delivery. Claims must be reported within 72 hours of delivery.", 20, y + 10, { maxWidth: 170 });
  doc.text("For claims: claims@aegiscargo.org  |  +44 020 1412 251", 20, y + 16, { maxWidth: 170 });

  drawSignatureBlock(doc, 218, { showSeal: true, sealX: 172, sealY: 240 });

  drawFooter(doc);
  return Buffer.from(doc.output("arraybuffer"));
}

// ═══════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// VAULT PDF ADDITIONS — Append to src/lib/documents/pdf-templates.ts
// Add these functions BEFORE the "EXPORT MAP" section
// ═══════════════════════════════════════════════════════════════

// ─── VAULT-SPECIFIC TYPES ────────────────────────────────────

type VaultAssayData = {
  depositNumber: string;
  assetType: string;
  description: string;
  weightGrams: number;
  weightVerified: number | null;
  weightDiscrepancy: number | null;
  purity: string | null;
  quantity: number;
  serialNumbers: string | null;
  refinerName: string | null;
  isLBMACertified: boolean;
  assayMethod: string | null;
  assayResult: string | null;
  assayPerformedBy: string | null;
  assayStatus: string;
  declaredValue: number;
  verifiedValue: number | null;
  vaultLocation: string;
  client: { name: string; email: string; phone: string };
};

type VaultStorageData = {
  depositNumber: string;
  custodyReferenceId: string | null;
  assetType: string;
  description: string;
  weightGrams: number;
  purity: string | null;
  quantity: number;
  serialNumbers: string | null;
  declaredValue: number;
  storageType: string;
  storageUnit: string | null;
  shelfPosition: string | null;
  vaultLocation: string;
  monthlyStorageFee: number | null;
  depositDate: string | Date;
  insuredValue: number | null;
  insuranceProvider: string | null;
  insurancePolicyNo: string | null;
  client: { name: string; email: string; phone: string };
};

type VaultInsuranceData = {
  depositNumber: string;
  custodyReferenceId: string | null;
  assetType: string;
  description: string;
  weightGrams: number;
  purity: string | null;
  declaredValue: number;
  insuredValue: number | null;
  insuranceProvider: string | null;
  insurancePolicyNo: string | null;
  insuranceCoverage: string | null;
  insuranceExpiryDate: string | Date | null;
  storageType: string;
  vaultLocation: string;
  storageUnit: string | null;
  depositDate: string | Date;
  client: { name: string; email: string; phone: string };
};

// ═══════════════════════════════════════════════════════════════
// 9. ASSAY REPORT
// ═══════════════════════════════════════════════════════════════

export async function generateAssayReport(data: VaultAssayData): Promise<Buffer> {
  const doc = new jsPDF();
  const docId = genDocId();
  const qr = await generateVaultQR(data.depositNumber);

  drawWatermark(doc);

  // Header — purple-accented for assay
  doc.setFillColor(...NAVY); doc.rect(0, 0, 210, 36, "F");
  doc.setFillColor(147, 51, 234); doc.rect(0, 36, 210, 2, "F"); // purple
  doc.setFillColor(...GOLD); doc.rect(0, 38, 210, 0.5, "F");

  const logo = getLogoBase64();
  if (logo) {
    try { doc.addImage(logo, getLogoFormat(), 12, 5, 50, 17); } catch {}
  } else {
    doc.setTextColor(...WHITE); doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("AEGIS CARGO", 15, 16);
  }
  doc.setTextColor(180, 190, 200); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("Vault Assay & Verification Division  |  LBMA Approved Laboratory", 15, 27);
  doc.text("admin@aegiscargo.org  |  +44 020 1412 251", 15, 31);

  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(147, 51, 234);
  doc.text("ASSAY VERIFICATION REPORT", 195, 14, { align: "right" });
  doc.setFontSize(8); doc.setTextColor(180, 190, 200); doc.setFont("helvetica", "normal");
  doc.text(`Report: ${docId}`, 195, 22, { align: "right" });
  doc.text(`Date: ${fmtDate(new Date())}`, 195, 28, { align: "right" });

  drawQR(doc, qr, 168, 44, 28);

  let y = 48;

  // Deposit number box
  doc.setFillColor(245, 243, 255); doc.roundedRect(15, y - 2, 145, 20, 2, 2, "F");
  doc.setDrawColor(147, 51, 234); doc.roundedRect(15, y - 2, 145, 20, 2, 2, "S");
  doc.setFontSize(7); doc.setTextColor(147, 51, 234); doc.setFont("helvetica", "normal");
  doc.text("DEPOSIT NUMBER", 20, y + 4);
  doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
  doc.text(data.depositNumber, 20, y + 14);

  // Result badge
  const passed = data.assayStatus === "PASSED" || data.assayStatus === "WAIVED";
  if (passed) {
    doc.setFillColor(236, 253, 245); doc.roundedRect(120, y - 1, 40, 18, 2, 2, "F");
    doc.setDrawColor(16, 185, 129); doc.roundedRect(120, y - 1, 40, 18, 2, 2, "S");
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(5, 150, 105);
    doc.text("✓ PASSED", 125, y + 11);
  } else {
    doc.setFillColor(254, 242, 242); doc.roundedRect(120, y - 1, 40, 18, 2, 2, "F");
    doc.setDrawColor(239, 68, 68); doc.roundedRect(120, y - 1, 40, 18, 2, 2, "S");
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(220, 38, 38);
    doc.text("✗ FAILED", 125, y + 11);
  }

  y += 28;
  y = drawSectionTitle(doc, "Client", y);
  drawKeyValue(doc, "Name", data.client.name, 22, y);
  drawKeyValue(doc, "Email", data.client.email, 80, y);
  drawKeyValue(doc, "Phone", data.client.phone, 145, y);

  y += 16;
  y = drawGoldSectionTitle(doc, "Asset Under Test", y);
  drawKeyValue(doc, "Asset Type", data.assetType, 22, y);
  drawKeyValue(doc, "Quantity", `${data.quantity}`, 80, y);
  drawKeyValue(doc, "Purity (Declared)", data.purity || "N/A", 130, y);
  y += 14;
  drawKeyValue(doc, "Description", data.description, 22, y);
  y += 14;
  if (data.serialNumbers) { drawKeyValue(doc, "Serial Numbers", data.serialNumbers, 22, y); y += 14; }
  if (data.refinerName) { drawKeyValue(doc, "Refiner / Source", data.refinerName, 22, y); y += 14; }
  drawKeyValue(doc, "LBMA Certified", data.isLBMACertified ? "Yes" : "No", 22, y);

  y += 16;
  y = drawSectionTitle(doc, "Assay Results", y);
  drawKeyValue(doc, "Test Method", data.assayMethod || "N/A", 22, y);
  drawKeyValue(doc, "Performed By", data.assayPerformedBy || "N/A", 100, y);
  y += 14;

  // Weight verification box
  doc.setFillColor(249, 250, 251); doc.roundedRect(15, y - 2, 180, 28, 2, 2, "F");
  doc.setDrawColor(229, 231, 235); doc.roundedRect(15, y - 2, 180, 28, 2, 2, "S");
  drawKeyValue(doc, "Declared Weight", `${data.weightGrams}g`, 22, y + 4);
  drawKeyValue(doc, "Verified Weight", data.weightVerified ? `${data.weightVerified}g` : "Pending", 80, y + 4);
  if (data.weightDiscrepancy !== null && data.weightDiscrepancy !== undefined) {
    const disc = data.weightDiscrepancy;
    const discPct = ((disc / data.weightGrams) * 100).toFixed(3);
    drawKeyValue(doc, "Discrepancy", `${disc > 0 ? "+" : ""}${disc.toFixed(2)}g (${disc > 0 ? "+" : ""}${discPct}%)`, 140, y + 4);
  }
  drawKeyValue(doc, "Declared Value", fmtCurrency(data.declaredValue), 22, y + 18);
  if (data.verifiedValue) drawKeyValue(doc, "Verified Value", fmtCurrency(data.verifiedValue), 100, y + 18);

  y += 36;
  // Assay notes
  if (data.assayResult) {
    y = drawSectionTitle(doc, "Laboratory Notes", y);
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MED);
    const splitNotes = doc.splitTextToSize(data.assayResult, 170);
    doc.text(splitNotes, 22, y + 2);
    y += splitNotes.length * 4 + 6;
  }

  // Certification statement
  y += 4;
  doc.setFillColor(245, 243, 255); doc.roundedRect(15, y, 180, 18, 2, 2, "F");
  doc.setDrawColor(147, 51, 234); doc.roundedRect(15, y, 180, 18, 2, 2, "S");
  doc.setFontSize(6.5); doc.setFont("helvetica", "italic"); doc.setTextColor(...TEXT_MED);
  doc.text("This report certifies the assay and verification results for the assets described above. Testing was performed", 20, y + 5, { maxWidth: 170 });
  doc.text("in accordance with LBMA Good Delivery standards. Results are valid for 12 months from date of issue.", 20, y + 10, { maxWidth: 170 });
  doc.text("Disputes must be raised within 30 days. Re-assay available upon request.", 20, y + 15, { maxWidth: 170 });

  drawSignatureBlock(doc, 218, { showSeal: true, sealX: 172, sealY: 240 });
  drawFooter(doc);
  return Buffer.from(doc.output("arraybuffer"));
}

// ═══════════════════════════════════════════════════════════════
// 10. STORAGE AGREEMENT
// ═══════════════════════════════════════════════════════════════

export async function generateStorageAgreement(data: VaultStorageData): Promise<Buffer> {
  const doc = new jsPDF();
  const docId = genDocId();
  const qr = await generateVaultQR(data.depositNumber);

  drawWatermark(doc);

  // Header
  doc.setFillColor(...NAVY); doc.rect(0, 0, 210, 36, "F");
  doc.setFillColor(...GOLD); doc.rect(0, 36, 210, 2, "F");
  doc.setFillColor(...EMERALD); doc.rect(0, 38, 210, 0.5, "F");

  const logo = getLogoBase64();
  if (logo) {
    try { doc.addImage(logo, getLogoFormat(), 12, 5, 50, 17); } catch {}
  } else {
    doc.setTextColor(...WHITE); doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("AEGIS CARGO", 15, 16);
  }
  doc.setTextColor(180, 190, 200); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("Vault Services Division  |  Secure Custody & Storage", 15, 27);
  doc.text("admin@aegiscargo.org  |  +44 020 1412 251", 15, 31);

  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(...GOLD);
  doc.text("STORAGE AGREEMENT", 195, 14, { align: "right" });
  doc.setFontSize(8); doc.setTextColor(180, 190, 200); doc.setFont("helvetica", "normal");
  doc.text(`Agreement: ${docId}`, 195, 22, { align: "right" });
  doc.text(`Effective: ${fmtDate(new Date())}`, 195, 28, { align: "right" });

  drawQR(doc, qr, 168, 44, 28);

  let y = 48;

  // Custody reference box
  doc.setFillColor(255, 251, 235); doc.roundedRect(15, y - 2, 145, 20, 2, 2, "F");
  doc.setDrawColor(...GOLD); doc.roundedRect(15, y - 2, 145, 20, 2, 2, "S");
  doc.setFontSize(7); doc.setTextColor(...GOLD); doc.setFont("helvetica", "normal");
  doc.text("CUSTODY REFERENCE", 20, y + 4);
  doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
  doc.text(data.custodyReferenceId || data.depositNumber, 20, y + 14);

  y += 28;
  y = drawSectionTitle(doc, "Parties", y);
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_DARK);
  doc.text("Custodian:", 22, y + 2);
  doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MED);
  doc.text("Aegis Cargo Vault Services Ltd.", 22, y + 7);
  doc.text("LBMA Approved Vault Operator | Registered in Romania", 22, y + 12);

  doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_DARK);
  doc.text("Depositor:", 110, y + 2);
  doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MED);
  doc.text(data.client.name, 110, y + 7);
  doc.text(`${data.client.email} | ${data.client.phone}`, 110, y + 12);

  y += 22;
  y = drawGoldSectionTitle(doc, "Assets in Custody", y);
  drawKeyValue(doc, "Asset Type", data.assetType, 22, y);
  drawKeyValue(doc, "Qty", `${data.quantity}`, 80, y);
  drawKeyValue(doc, "Purity", data.purity || "N/A", 110, y);
  drawKeyValue(doc, "Weight", `${data.weightGrams}g`, 150, y);
  y += 14;
  drawKeyValue(doc, "Description", data.description, 22, y);
  drawKeyValue(doc, "Declared Value", fmtCurrency(data.declaredValue), 130, y);
  y += 14;
  if (data.serialNumbers) { drawKeyValue(doc, "Serial Numbers", data.serialNumbers, 22, y); y += 14; }

  y += 4;
  y = drawSectionTitle(doc, "Storage Terms", y);

  const storageLabels: Record<string, string> = {
    ALLOCATED: "Allocated (Dedicated cage/unit)",
    SEGREGATED: "Segregated (Shared vault, separate inventory)",
    UNALLOCATED: "Unallocated (Pooled storage)",
  };

  drawKeyValue(doc, "Storage Type", storageLabels[data.storageType] || data.storageType, 22, y);
  y += 14;
  drawKeyValue(doc, "Vault Location", data.vaultLocation, 22, y);
  drawKeyValue(doc, "Unit / Cage", data.storageUnit || "TBD", 80, y);
  drawKeyValue(doc, "Position", data.shelfPosition || "—", 140, y);
  y += 14;
  drawKeyValue(doc, "Commencement", fmtDate(data.depositDate), 22, y);
  drawKeyValue(doc, "Monthly Fee", data.monthlyStorageFee ? fmtCurrency(data.monthlyStorageFee) : "TBD", 80, y);
  drawKeyValue(doc, "Billing Cycle", "1st of each month", 140, y);

  y += 16;
  // Insurance summary
  if (data.insuredValue) {
    y = drawGoldSectionTitle(doc, "Insurance", y);
    drawKeyValue(doc, "Insured Value", fmtCurrency(data.insuredValue), 22, y);
    drawKeyValue(doc, "Provider", data.insuranceProvider || "—", 80, y);
    drawKeyValue(doc, "Policy No.", data.insurancePolicyNo || "—", 140, y);
    y += 16;
  }

  // Terms
  doc.setFillColor(249, 250, 251); doc.roundedRect(15, y, 180, 32, 2, 2, "F");
  doc.setDrawColor(229, 231, 235); doc.roundedRect(15, y, 180, 32, 2, 2, "S");
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...TEXT_DARK);
  doc.text("Terms & Conditions", 20, y + 5);
  doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MED);
  const terms = [
    "1. The Custodian shall hold the Assets in secure storage and maintain adequate insurance at all times.",
    "2. The Depositor shall pay the monthly storage fee on or before the 1st of each month. Late payments incur 1.5% interest per month.",
    "3. Withdrawal requires 5 business days notice and presentation of this agreement or valid custody reference.",
    "4. The Custodian shall provide quarterly inventory confirmations and annual independent audit reports.",
    "5. Either party may terminate with 30 days written notice. Outstanding fees must be settled before asset release.",
    "6. All disputes shall be governed by the laws of England and Wales, subject to LBMA arbitration procedures.",
  ];
  terms.forEach((t, i) => {
    doc.text(t, 20, y + 10 + i * 3.5, { maxWidth: 170 });
  });

  drawSignatureBlock(doc, 218, { showSeal: true, sealX: 172, sealY: 240 });
  drawFooter(doc);
  return Buffer.from(doc.output("arraybuffer"));
}

// ═══════════════════════════════════════════════════════════════
// 11. VAULT INSURANCE CERTIFICATE
// ═══════════════════════════════════════════════════════════════

export async function generateVaultInsuranceCertificate(data: VaultInsuranceData): Promise<Buffer> {
  const doc = new jsPDF();
  const docId = genDocId();
  const qr = await generateVaultQR(data.depositNumber);

  drawWatermark(doc);

  // Header — blue-accented for insurance
  doc.setFillColor(...NAVY); doc.rect(0, 0, 210, 36, "F");
  doc.setFillColor(37, 99, 235); doc.rect(0, 36, 210, 2, "F"); // blue
  doc.setFillColor(...GOLD); doc.rect(0, 38, 210, 0.5, "F");

  const logo = getLogoBase64();
  if (logo) {
    try { doc.addImage(logo, getLogoFormat(), 12, 5, 50, 17); } catch {}
  } else {
    doc.setTextColor(...WHITE); doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("AEGIS CARGO", 15, 16);
  }
  doc.setTextColor(180, 190, 200); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text("Vault Insurance Services  |  Underwritten by Lloyd's of London", 15, 27);
  doc.text("admin@aegiscargo.org  |  +44 020 1412 251", 15, 31);

  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(37, 99, 235);
  doc.text("VAULT INSURANCE CERTIFICATE", 195, 14, { align: "right" });
  doc.setFontSize(8); doc.setTextColor(180, 190, 200); doc.setFont("helvetica", "normal");
  doc.text(`Certificate: ${docId}`, 195, 22, { align: "right" });
  doc.text(`Issued: ${fmtDate(new Date())}`, 195, 28, { align: "right" });

  drawQR(doc, qr, 168, 44, 28);

  let y = 48;

  // Policy box
  doc.setFillColor(239, 246, 255); doc.roundedRect(15, y - 2, 145, 20, 2, 2, "F");
  doc.setDrawColor(37, 99, 235); doc.roundedRect(15, y - 2, 145, 20, 2, 2, "S");
  doc.setFontSize(7); doc.setTextColor(37, 99, 235); doc.setFont("helvetica", "normal");
  doc.text("POLICY NUMBER", 20, y + 4);
  doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(...NAVY);
  doc.text(data.insurancePolicyNo || "Pending", 20, y + 14);

  y += 28;
  y = drawSectionTitle(doc, "Insured Party", y);
  drawKeyValue(doc, "Name", data.client.name, 22, y);
  drawKeyValue(doc, "Email", data.client.email, 80, y);
  drawKeyValue(doc, "Phone", data.client.phone, 145, y);

  y += 16;
  y = drawGoldSectionTitle(doc, "Insured Assets", y);
  drawKeyValue(doc, "Deposit Number", data.depositNumber, 22, y);
  drawKeyValue(doc, "Custody Ref", data.custodyReferenceId || "Pending", 100, y);
  y += 14;
  drawKeyValue(doc, "Asset Type", data.assetType, 22, y);
  drawKeyValue(doc, "Weight", `${data.weightGrams}g`, 80, y);
  drawKeyValue(doc, "Purity", data.purity || "N/A", 130, y);
  y += 14;
  drawKeyValue(doc, "Description", data.description, 22, y);

  y += 16;
  // Big coverage box
  doc.setFillColor(239, 246, 255); doc.roundedRect(15, y, 180, 36, 2, 2, "F");
  doc.setDrawColor(37, 99, 235); doc.roundedRect(15, y, 180, 36, 2, 2, "S");
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(37, 99, 235);
  doc.text("COVERAGE DETAILS", 20, y + 6);

  const coverageLabels: Record<string, string> = {
    ALL_RISK: "All-Risk Coverage (theft, fire, flood, natural disaster, transit)",
    THEFT_FIRE: "Theft & Fire Coverage",
    BASIC: "Basic Coverage (fire only)",
  };

  drawKeyValue(doc, "Coverage Type", coverageLabels[data.insuranceCoverage || ""] || data.insuranceCoverage || "—", 22, y + 14);
  drawKeyValue(doc, "Declared Value", fmtCurrency(data.declaredValue), 22, y + 24);
  drawKeyValue(doc, "Insured Value", data.insuredValue ? fmtCurrency(data.insuredValue) : "Pending", 80, y + 24);
  drawKeyValue(doc, "Provider", data.insuranceProvider || "—", 140, y + 14);
  drawKeyValue(doc, "Expiry", fmtDate(data.insuranceExpiryDate as any), 140, y + 24);

  y += 44;
  y = drawSectionTitle(doc, "Storage Location", y);
  drawKeyValue(doc, "Vault", data.vaultLocation, 22, y);
  drawKeyValue(doc, "Unit", data.storageUnit || "TBD", 80, y);
  drawKeyValue(doc, "Storage Type", data.storageType, 140, y);

  y += 18;
  // Claims notice
  doc.setFillColor(240, 253, 244); doc.roundedRect(15, y, 180, 22, 2, 2, "F");
  doc.setDrawColor(187, 247, 208); doc.roundedRect(15, y, 180, 22, 2, 2, "S");
  doc.setFontSize(6.5); doc.setFont("helvetica", "italic"); doc.setTextColor(...TEXT_MED);
  doc.text("This certificate confirms that the assets described above are insured while in custody at the specified vault.", 20, y + 5, { maxWidth: 170 });
  doc.text("Coverage is continuous and renews automatically. Claims must be reported within 48 hours of discovery.", 20, y + 10, { maxWidth: 170 });
  doc.text("For claims: claims@aegiscargo.org | For policy queries: vault@aegiscargo.org | +44 020 1412 251", 20, y + 16, { maxWidth: 170 });

  drawSignatureBlock(doc, 218, { showSeal: true, sealX: 172, sealY: 240 });
  drawFooter(doc);
  return Buffer.from(doc.output("arraybuffer"));
}

// EXPORT MAP
// ═══════════════════════════════════════════
export const DOCUMENT_TYPES = {
  "airway-bill": { label: "Airway Bill", generator: generateAirwayBill, requiresShipment: true },
  "commercial-invoice": { label: "Commercial Invoice", generator: generateCommercialInvoice, requiresShipment: true },
  "packing-list": { label: "Packing List", generator: generatePackingList, requiresShipment: true },
  "shipping-label": { label: "Shipping Label", generator: generateShippingLabel, requiresShipment: true },
  "delivery-note": { label: "Delivery Note", generator: generateDeliveryNote, requiresShipment: true },
  "proof-of-delivery": { label: "Proof of Delivery", generator: generateProofOfDelivery, requiresShipment: true },
  "vault-certificate": { label: "Vault Certificate", generator: generateVaultCertificate, requiresShipment: false },
  "assay-report": { label: "Assay Report", generator: generateAssayReport, requiresShipment: false },
  "storage-agreement": { label: "Storage Agreement", generator: generateStorageAgreement, requiresShipment: false },
  "vault-insurance": { label: "Vault Insurance Certificate", generator: generateVaultInsuranceCertificate, requiresShipment: false },
  "insurance-certificate": { label: "Insurance Certificate", generator: generateInsuranceCertificate, requiresShipment: true },
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;
