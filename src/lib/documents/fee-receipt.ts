import jsPDF from "jspdf";
import { getLogoBase64, getLogoFormat } from "./logo-loader";
import { generateTrackingQR } from "./qr-generator";

const NAVY = [15, 29, 47] as const;
const EMERALD = [30, 58, 95] as const;
const GOLD = [140, 158, 175] as const;
const WHITE = [255, 255, 255] as const;
const GRAY = [107, 114, 128] as const;
const TEXT_DARK = [17, 24, 39] as const;
const TEXT_MED = [75, 85, 99] as const;

const FEE_TYPE_LABELS: Record<string, string> = {
  AIRWAY_BILL: "Airway Bill Fee",
  SHIPPING_FREIGHT: "Shipping & Freight Fee",
  HOLD_RELEASE: "Hold Release Fee",
  CUSTOMS_DUTY: "Customs & Duty Fee",
  CUSTOM: "Additional Fee",
};

function fmtDate(d: Date | string | null): string {
  if (!d) return "—";
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

function fmtCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

type FeeReceiptData = {
  invoiceNumber: string;
  feeType: string;
  customType?: string | null;
  amount: number;
  currency: string;
  reason: string;
  paidAt: Date;
  trackingNumber: string;
  shipmentOrigin: string;
  shipmentDestination: string;
  recipientName: string;
  recipientEmail?: string | null;
  recipientPhone: string;
  senderName?: string;
};

export async function generateFeeReceiptPDF(
  data: FeeReceiptData
): Promise<Buffer> {
  const doc = new jsPDF();
  const qr = await generateTrackingQR(data.trackingNumber);
  const feeLabel =
    data.feeType === "CUSTOM" && data.customType
      ? data.customType
      : FEE_TYPE_LABELS[data.feeType] || data.feeType;

  // ─── WATERMARK ───
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.04 }));
  doc.setFontSize(50);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("AEGIS CARGO", 105, 148, { align: "center", angle: 45 });
  doc.setFontSize(25);
  doc.text("PAYMENT RECEIPT", 105, 178, { align: "center", angle: 45 });
  doc.restoreGraphicsState();

  // ─── HEADER ───
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 36, "F");
  doc.setFillColor(...GOLD);
  doc.rect(0, 36, 210, 1.5, "F");
  doc.setFillColor(...EMERALD);
  doc.rect(0, 37.5, 210, 0.5, "F");

  // Logo
  const logo = getLogoBase64();
  if (logo) {
    try {
      doc.addImage(logo, getLogoFormat(), 12, 5, 50, 17);
    } catch {}
  } else {
    doc.setTextColor(...WHITE);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("AEGIS CARGO", 15, 16);
  }
  doc.setTextColor(180, 190, 200);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Global Logistics & Vault Services", 15, 27);
  doc.text("admin@aegiscargo.org  |  +44 020 1412 251", 15, 31);

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text("PAYMENT RECEIPT", 195, 14, { align: "right" });
  doc.setFontSize(8);
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "normal");
  doc.text(data.invoiceNumber, 195, 21, { align: "right" });
  doc.setTextColor(180, 190, 200);
  doc.text(`Issued: ${fmtDate(new Date())}`, 195, 28, { align: "right" });

  // ISO badge
  doc.setFillColor(...EMERALD);
  doc.roundedRect(155, 30, 40, 4, 1, 1, "F");
  doc.setFontSize(5);
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.text("ISO 9001 CERTIFIED", 175, 32.8, { align: "center" });

  // QR code
  doc.setFillColor(...WHITE);
  doc.roundedRect(169, 44, 27, 27, 1, 1, "F");
  doc.setDrawColor(220, 220, 225);
  doc.roundedRect(169, 44, 27, 27, 1, 1, "S");
  doc.addImage(qr, "PNG", 170, 45, 25, 25);
  doc.setFontSize(4.5);
  doc.setTextColor(...EMERALD);
  doc.setFont("helvetica", "bold");
  doc.text("SCAN TO VERIFY", 182.5, 74, { align: "center" });

  // ─── PAID STAMP ───
  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: 0.15 }));
  doc.setFontSize(48);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 95);
  doc.text("PAID", 105, 160, { align: "center", angle: 30 });
  doc.restoreGraphicsState();

  // ─── RECEIPT DETAILS ───
  let y = 48;

  // Big amount box
  doc.setFillColor(238, 242, 247);
  doc.roundedRect(15, y, 145, 26, 2, 2, "F");
  doc.setDrawColor(...EMERALD);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, y, 145, 26, 2, 2, "S");

  doc.setFontSize(7);
  doc.setTextColor(...EMERALD);
  doc.setFont("helvetica", "bold");
  doc.text("AMOUNT PAID", 22, y + 6);

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text(fmtCurrency(data.amount, data.currency), 22, y + 18);

  doc.setFontSize(9);
  doc.setTextColor(...EMERALD);
  doc.setFont("helvetica", "bold");
  doc.text("✓ CONFIRMED", 130, y + 18);

  y += 34;

  // Section: Payment Details
  doc.setFillColor(...EMERALD);
  doc.rect(15, y, 3, 6, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_DARK);
  doc.text("Payment Details", 22, y + 5);
  y += 14;

  const drawKV = (
    key: string,
    value: string,
    x: number,
    yPos: number
  ) => {
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY);
    doc.text(key.toUpperCase(), x, yPos);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_DARK);
    doc.text(value || "—", x, yPos + 5);
  };

  drawKV("Receipt Number", data.invoiceNumber, 22, y);
  drawKV("Payment Date", fmtDate(data.paidAt), 90, y);
  drawKV("Currency", data.currency, 155, y);
  y += 16;

  drawKV("Fee Type", feeLabel, 22, y);
  drawKV("Amount", fmtCurrency(data.amount, data.currency), 90, y);
  drawKV("Status", "PAID", 155, y);
  y += 16;

  drawKV("Reason", data.reason, 22, y);
  y += 18;

  // Section: Shipment Details
  doc.setFillColor(...GOLD);
  doc.rect(15, y, 3, 6, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_DARK);
  doc.text("Shipment Details", 22, y + 5);
  y += 14;

  drawKV("Tracking Number", data.trackingNumber, 22, y);
  drawKV("Origin", data.shipmentOrigin, 90, y);
  y += 16;

  drawKV("Destination", data.shipmentDestination, 22, y);
  drawKV("Sender", data.senderName || "—", 90, y);
  y += 18;

  // Section: Recipient Details
  doc.setFillColor(...EMERALD);
  doc.rect(15, y, 3, 6, "F");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT_DARK);
  doc.text("Paid By", 22, y + 5);
  y += 14;

  drawKV("Name", data.recipientName, 22, y);
  drawKV("Email", data.recipientEmail || "—", 90, y);
  drawKV("Phone", data.recipientPhone, 155, y);
  y += 20;

  // Confirmation statement
  doc.setFillColor(238, 242, 247);
  doc.roundedRect(15, y, 180, 18, 2, 2, "F");
  doc.setDrawColor(179, 199, 219);
  doc.roundedRect(15, y, 180, 18, 2, 2, "S");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...TEXT_MED);
  doc.text(
    "This receipt confirms that payment has been received and processed by Aegis Cargo Ltd.",
    20,
    y + 6,
    { maxWidth: 170 }
  );
  doc.text(
    "This is an official document. For any queries, contact admin@aegiscargo.org or +44 020 1412 251.",
    20,
    y + 12,
    { maxWidth: 170 }
  );

  // ─── FOOTER ───
  const fy = 274;
  doc.setFillColor(...NAVY);
  doc.rect(15, fy, 180, 0.5, "F");

  doc.setFontSize(6);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "italic");
  doc.text(
    "This is an official document of Aegis Cargo Ltd. Verify authenticity by scanning the QR code or visiting aegiscargo.org/verify",
    105,
    fy + 4,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(
    "Aegis Cargo Ltd  |  Registered in Romania  |  Strada Bulevardul Unirii 72, Floor 3, Office 12, 030833 Bucharest, Romania",
    105,
    fy + 8,
    { align: "center" }
  );

  doc.setFillColor(...NAVY);
  doc.roundedRect(45, fy + 10, 120, 5, 1, 1, "F");
  doc.setFontSize(5);
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.text(
    "ISO 9001  |  LBMA APPROVED  |  IATA MEMBER  |  AEO CERTIFIED",
    105,
    fy + 13.5,
    { align: "center" }
  );

  doc.setFontSize(5.5);
  doc.setTextColor(...GRAY);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Page 1  |  © ${new Date().getFullYear()} Aegis Cargo. All rights reserved.`,
    105,
    fy + 19,
    { align: "center" }
  );

  return Buffer.from(doc.output("arraybuffer"));
}