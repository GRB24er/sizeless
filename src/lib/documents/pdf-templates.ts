import { generateTrackingQR, generateVaultQR } from "./qr-generator";
import { formatCurrencyAmount } from "@/lib/vault/types";
import { COMPANY } from "@/lib/company";
import { SHIPPING_OPTIONS } from "@/app/(root)/shipments/create/type";
import { Sheet, code128, fmtDate, fmtDateTime, gw, gx, plural, MARGIN, INK, INK_3, type Party } from "./layout";
import { renderLabel } from "./thermal-label";

// ─── Data shapes (unchanged: the routes and dashboard actions build these) ──

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
  currency?: string;
  client: { name: string; email: string; phone: string };
};

type VaultAssayData = {
  depositNumber: string; assetType: string; description: string;
  weightGrams: number; weightVerified: number | null; weightDiscrepancy: number | null;
  purity: string | null; quantity: number; serialNumbers: string | null;
  refinerName: string | null; isLBMACertified: boolean;
  assayMethod: string | null; assayResult: string | null; assayPerformedBy: string | null; assayStatus: string;
  declaredValue: number; verifiedValue: number | null; vaultLocation: string;
  currency?: string;
  client: { name: string; email: string; phone: string };
};

type VaultStorageData = {
  depositNumber: string; custodyReferenceId: string | null;
  assetType: string; description: string; weightGrams: number; purity: string | null; quantity: number;
  serialNumbers: string | null; declaredValue: number;
  storageType: string; storageUnit: string | null; shelfPosition: string | null; vaultLocation: string;
  monthlyStorageFee: number | null; depositDate: string | Date;
  insuredValue: number | null; insuranceProvider: string | null; insurancePolicyNo: string | null;
  currency?: string;
  client: { name: string; email: string; phone: string };
};

type VaultInsuranceData = {
  depositNumber: string; custodyReferenceId: string | null;
  assetType: string; description: string; weightGrams: number; purity: string | null;
  declaredValue: number; insuredValue: number | null;
  insuranceProvider: string | null; insurancePolicyNo: string | null; insuranceCoverage: string | null;
  insuranceExpiryDate: string | Date | null;
  storageType: string; vaultLocation: string; storageUnit: string | null; depositDate: string | Date;
  currency?: string;
  client: { name: string; email: string; phone: string };
};

// ─── Shared wording and helpers ─────────────────────────────────────────

const money = (n: number | null | undefined, currency = "USD") => formatCurrencyAmount(n ?? 0, currency);
const purity = (p: string | null) => (!p ? "Not stated" : p === "dore" ? "Doré" : `${p}%`);
const grams = (g: number | null | undefined) => (g == null ? "—" : `${g.toLocaleString("en-GB", { maximumFractionDigits: 3 })} g`);
const num = (n: number) => n.toLocaleString("en-GB", { maximumFractionDigits: 2 });
const kg = (n: number) => `${num(n)} kg`;

function serviceName(id: string) {
  const option = SHIPPING_OPTIONS.find((o) => o.id === id);
  if (option) return option.label;
  return id.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function totalsOf(data: ShipmentData) {
  const pieces = data.packages.reduce((s, p) => s + p.pieces, 0);
  const weight = data.packages.reduce((s, p) => s + p.weight, 0);
  const value = data.packages.reduce((s, p) => s + (p.declaredValue || 0), 0);
  const insured = data.packages.filter((p) => p.insurance);
  const insuredValue = insured.reduce((s, p) => s + (p.declaredValue || 0), 0);
  const dangerous = data.packages.some((p) => p.dangerous);
  return { pieces, weight, value, insured, insuredValue, dangerous };
}

function shipper(data: ShipmentData, heading = "Shipper"): Party {
  return {
    heading,
    name: data.Sender?.name || "Not recorded",
    lines: [
      data.originAddress,
      [data.originCity, [data.originState, data.originPostalCode].filter(Boolean).join(" ")].filter(Boolean).join(", "),
      data.originCountry,
    ],
    contact: [data.Sender?.phone, data.Sender?.email],
  };
}

function consignee(data: ShipmentData, heading = "Consignee"): Party {
  return {
    heading,
    name: data.recipient.name,
    lines: [
      data.recipient.company,
      data.destinationAddress,
      [data.destinationCity, [data.destinationState, data.destinationPostalCode].filter(Boolean).join(" ")].filter(Boolean).join(", "),
      data.destinationCountry,
    ],
    contact: [data.recipient.phone, data.recipient.email],
  };
}

function client(c: { name: string; email: string; phone: string }, heading: string): Party {
  return { heading, name: c.name, lines: [], contact: [c.email, c.phone] };
}

const custodian = (heading = "Custodian"): Party => ({
  heading,
  name: COMPANY.name,
  lines: COMPANY.addressLines,
  contact: [COMPANY.email],
});

const route = (d: ShipmentData) => `${d.originCity}, ${d.originCountry} to ${d.destinationCity}, ${d.destinationCountry}`;
const dims = (p: ShipmentData["packages"][number]) => `${p.length} × ${p.width} × ${p.height}`;

const TRACK_CAPTION = "Scan to follow this shipment on aegiscargo.org";
const VAULT_CAPTION = "Scan to open this deposit in your vault account";

// ═══════════════════════════════════════════════════════════════════════
// Air waybill
// ═══════════════════════════════════════════════════════════════════════

export async function generateAirwayBill(data: ShipmentData): Promise<Buffer> {
  const s = new Sheet({ title: "Air Waybill", reference: data.trackingNumber });
  const t = totalsOf(data);
  const [qr, barcode] = await Promise.all([generateTrackingQR(data.trackingNumber), code128(data.trackingNumber, 12)]);

  s.header(
    [
      { label: "Air waybill number", value: data.trackingNumber, mono: true, strong: true, span: 4 },
      { label: "Service", value: serviceName(data.serviceType), span: 3 },
      { label: "Issued", value: fmtDate(data.createdAt), mono: true, span: 2 },
      { label: "Estimated delivery", value: fmtDate(data.estimatedDelivery), mono: true, span: 3 },
    ],
    { subtitle: "Original for the shipper" }
  );

  // Barcode band: the scannable waybill number with payment and terms beside it.
  const top = s.y;
  if (barcode) s.doc.addImage(barcode, "PNG", gx(0), top, gw(6), 12);
  s.font("mono", 8, INK_3);
  s.text(data.trackingNumber, gx(0), top + 16);
  s.font("sans", 6.9, INK_3);
  s.text("Payment", gx(8), top + 3);
  s.text("Delivery terms", gx(10), top + 3);
  s.tag(data.isPaid ? "Prepaid" : "Collect", gx(8), top + 9.6, data.isPaid ? "navy" : "signal");
  s.font("mono", 9.5, INK);
  s.text("DAP", gx(10), top + 9.4);
  s.y = top + 21;

  s.parties([shipper(data), consignee(data)]);

  s.section("Consignment");
  s.fields([
    { label: "Pieces", value: String(t.pieces), mono: true },
    { label: "Gross weight", value: kg(t.weight), mono: true },
    { label: "Declared value", value: money(t.value), mono: true },
    { label: "Insurance", value: `${t.insured.length} of ${plural(data.packages.length, "package")} insured` },
  ]);
  s.fields([
    { label: "Route", value: route(data), span: 6 },
    { label: "Dangerous goods", value: t.dangerous ? "Declared on this consignment" : "None declared", span: 6 },
  ]);

  s.section("Goods");
  s.table(
    [
      { header: "Description", span: 4, medium: true },
      { header: "Type", span: 2 },
      { header: "Pieces", span: 1, align: "right", mono: true },
      { header: "Dimensions (cm)", span: 2, align: "right", mono: true },
      { header: "Weight (kg)", span: 1, align: "right", mono: true },
      { header: "Declared value", span: 2, align: "right", mono: true },
    ],
    data.packages.map((p) => [
      p.description + (p.dangerous ? "\nDangerous goods" : ""),
      p.packageType,
      String(p.pieces),
      dims(p),
      num(p.weight),
      money(p.declaredValue),
    ]),
    { totals: ["Total", "", String(t.pieces), "", num(t.weight), money(t.value)] }
  );

  s.notePair(
    { title: "Handling", body: data.specialInstructions?.trim() || "No special handling instructions were recorded for this shipment." },
    {
      title: "Declaration",
      body: "The shipper declares that these particulars are correct, that the consignment is properly described and packed, and that it contains no goods restricted or prohibited for carriage.",
    }
  );

  s.signatures({ lines: ["Shipper's signature", "Carrier's signature", "Date"], qr: { dataUrl: qr, caption: TRACK_CAPTION } });
  return s.finish();
}

// ═══════════════════════════════════════════════════════════════════════
// Commercial invoice
// ═══════════════════════════════════════════════════════════════════════

export async function generateCommercialInvoice(data: ShipmentData): Promise<Buffer> {
  const reference = `INV-${data.trackingNumber}`;
  const s = new Sheet({ title: "Commercial Invoice", reference });
  const t = totalsOf(data);
  const qr = await generateTrackingQR(data.trackingNumber);

  s.header([
    { label: "Invoice number", value: reference, mono: true, strong: true, span: 4 },
    { label: "Air waybill", value: data.trackingNumber, mono: true, span: 3 },
    { label: "Invoice date", value: fmtDate(data.createdAt), mono: true, span: 2 },
    { label: "Payment", value: data.isPaid ? "Paid" : "Payment pending", span: 3 },
  ]);

  s.parties([shipper(data, "Seller (shipper)"), consignee(data, "Buyer (consignee)")]);

  s.fields([
    { label: "Country of origin", value: data.originCountry },
    { label: "Country of destination", value: data.destinationCountry },
    { label: "Service", value: serviceName(data.serviceType) },
    { label: "Delivery terms", value: "DAP", mono: true },
  ]);

  s.section("Items");
  s.table(
    [
      { header: "Description", span: 5, medium: true },
      { header: "Pieces", span: 1, align: "right", mono: true },
      { header: "Weight (kg)", span: 2, align: "right", mono: true },
      { header: "Unit value", span: 2, align: "right", mono: true },
      { header: "Line total", span: 2, align: "right", mono: true },
    ],
    data.packages.map((p) => {
      const value = p.declaredValue || 0;
      return [p.description, String(p.pieces), num(p.weight), money(value / Math.max(p.pieces, 1)), money(value)];
    })
  );
  s.totals([
    { label: "Goods value", value: money(t.value) },
    { label: "Insured value", value: money(t.insuredValue) },
    { label: "Total declared value", value: money(t.value) },
  ]);

  s.section("Declaration");
  s.note("We declare that the information on this invoice is true and correct, and that the goods described are of the origin stated above.");

  s.signatures({ lines: ["Seller's signature", "Name and title", "Date"], qr: { dataUrl: qr, caption: TRACK_CAPTION } });
  return s.finish();
}

// ═══════════════════════════════════════════════════════════════════════
// Packing list
// ═══════════════════════════════════════════════════════════════════════

export async function generatePackingList(data: ShipmentData): Promise<Buffer> {
  const reference = `PL-${data.trackingNumber}`;
  const s = new Sheet({ title: "Packing List", reference });
  const t = totalsOf(data);
  const qr = await generateTrackingQR(data.trackingNumber);

  s.header([
    { label: "Packing list", value: reference, mono: true, strong: true, span: 4 },
    { label: "Air waybill", value: data.trackingNumber, mono: true, span: 3 },
    { label: "Date", value: fmtDate(data.createdAt), mono: true, span: 2 },
    { label: "Packages", value: String(data.packages.length), mono: true, span: 3 },
  ]);

  s.parties([shipper(data), consignee(data)]);

  s.section("Contents", { aside: `${plural(t.pieces, "piece")}  ·  ${kg(t.weight)}` });
  s.table(
    [
      { header: "Description", span: 4, medium: true },
      { header: "Type", span: 2 },
      { header: "Pieces", span: 1, align: "right", mono: true },
      { header: "Dimensions (cm)", span: 3, align: "right", mono: true },
      { header: "Weight (kg)", span: 2, align: "right", mono: true },
    ],
    data.packages.map((p) => [
      p.description + (p.dangerous ? "\nDangerous goods" : ""),
      p.packageType,
      String(p.pieces),
      dims(p),
      num(p.weight),
    ]),
    { totals: ["Total", "", String(t.pieces), "", num(t.weight)] }
  );

  s.signatures({ lines: ["Packed by", "Checked by", "Date"], qr: { dataUrl: qr, caption: TRACK_CAPTION } });
  return s.finish();
}

// ═══════════════════════════════════════════════════════════════════════
// Shipping label (100 × 150 mm)
// ═══════════════════════════════════════════════════════════════════════

export async function generateShippingLabel(data: ShipmentData): Promise<Buffer> {
  return renderLabel(data, { width: 100, height: 150 });
}

// ═══════════════════════════════════════════════════════════════════════
// Delivery note
// ═══════════════════════════════════════════════════════════════════════

export async function generateDeliveryNote(data: ShipmentData): Promise<Buffer> {
  const reference = `DN-${data.trackingNumber}`;
  const s = new Sheet({ title: "Delivery Note", reference });
  const t = totalsOf(data);
  const qr = await generateTrackingQR(data.trackingNumber);

  s.header([
    { label: "Delivery note", value: reference, mono: true, strong: true, span: 4 },
    { label: "Air waybill", value: data.trackingNumber, mono: true, span: 3 },
    { label: "Delivery date", value: fmtDate(data.deliveredAt || data.estimatedDelivery), mono: true, span: 2 },
    { label: "Service", value: serviceName(data.serviceType), span: 3 },
  ]);

  s.parties([consignee(data, "Deliver to"), shipper(data, "From")]);

  s.section("Items for delivery", { aside: `${plural(t.pieces, "piece")}  ·  ${kg(t.weight)}` });
  s.table(
    [
      { header: "Description", span: 5, medium: true },
      { header: "Pieces", span: 1, align: "right", mono: true },
      { header: "Dimensions (cm)", span: 2, align: "right", mono: true },
      { header: "Weight (kg)", span: 2, align: "right", mono: true },
      { header: "Declared value", span: 2, align: "right", mono: true },
    ],
    data.packages.map((p) => [p.description, String(p.pieces), dims(p), num(p.weight), money(p.declaredValue)]),
    { totals: ["Total", String(t.pieces), "", num(t.weight), money(t.value)] }
  );

  s.section("Receipt");
  s.note("By signing, the recipient confirms that the items listed above were received with seals intact, unless a discrepancy is noted on this page.");
  s.signatures({ lines: ["Recipient's signature", "Printed name", "Date and time"], qr: { dataUrl: qr, caption: TRACK_CAPTION } });
  return s.finish();
}

// ═══════════════════════════════════════════════════════════════════════
// Proof of delivery
// ═══════════════════════════════════════════════════════════════════════

export async function generateProofOfDelivery(data: ShipmentData): Promise<Buffer> {
  const reference = `POD-${data.trackingNumber}`;
  const s = new Sheet({ title: "Proof of Delivery", reference });
  const t = totalsOf(data);
  const qr = await generateTrackingQR(data.trackingNumber);
  const delivered = Boolean(data.deliveredAt);

  s.header([
    { label: "Proof of delivery", value: reference, mono: true, strong: true, span: 4 },
    { label: "Air waybill", value: data.trackingNumber, mono: true, span: 3 },
    { label: delivered ? "Delivered" : "Estimated delivery", value: fmtDateTime(data.deliveredAt || data.estimatedDelivery), mono: true, span: 5 },
  ]);

  s.tag(delivered ? "Delivered" : "Awaiting delivery confirmation", MARGIN, s.y + 1.5, delivered ? "navy" : "signal");
  s.y += 8;

  s.parties([consignee(data, "Delivered to"), shipper(data, "Sent by")]);

  s.section("Consignment");
  s.fields([
    { label: "Packages", value: String(data.packages.length), mono: true },
    { label: "Pieces", value: String(t.pieces), mono: true },
    { label: "Gross weight", value: kg(t.weight), mono: true },
    { label: "Declared value", value: money(t.value), mono: true },
  ]);

  if (data.TrackingUpdates?.length) {
    s.section("Chain of custody", { aside: "Every recorded handover, oldest first" });
    const updates = [...data.TrackingUpdates].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
    s.table(
      [
        { header: "Date and time", span: 3, mono: true },
        { header: "Location", span: 3 },
        { header: "Status", span: 2, medium: true },
        { header: "Details", span: 4 },
      ],
      updates.map((u) => [fmtDateTime(u.timestamp), u.location || "—", u.status || "—", u.message])
    );
  }

  s.signatures({ lines: ["Recipient's signature", "Courier's signature", "Date"], qr: { dataUrl: qr, caption: TRACK_CAPTION } });
  return s.finish();
}

// ═══════════════════════════════════════════════════════════════════════
// Vault deposit certificate
// ═══════════════════════════════════════════════════════════════════════

export async function generateVaultCertificate(data: VaultData): Promise<Buffer> {
  const reference = `VC-${data.depositNumber}`;
  const s = new Sheet({ title: "Deposit Certificate", reference });
  const qr = await generateVaultQR(data.depositNumber);
  const cur = data.currency;

  s.header([
    { label: "Deposit number", value: data.depositNumber, mono: true, strong: true, span: 4 },
    { label: "Certificate", value: reference, mono: true, span: 3 },
    { label: "Deposited", value: fmtDate(data.depositDate), mono: true, span: 2 },
    { label: "Verified", value: data.verifiedAt ? fmtDate(data.verifiedAt) : "Pending", mono: true, span: 3 },
  ]);

  s.parties([custodian(), client(data.client, "Depositor")]);

  s.section("Assets held");
  s.fields([
    { label: "Asset type", value: data.assetType },
    { label: "Quantity", value: String(data.quantity), mono: true },
    { label: "Purity", value: purity(data.purity), mono: true },
    { label: "Weight", value: grams(data.weightGrams), mono: true },
  ]);
  s.fields([
    { label: "Declared value", value: money(data.declaredValue, cur), mono: true },
    { label: "Insured value", value: data.insuredValue ? money(data.insuredValue, cur) : "Not insured", mono: Boolean(data.insuredValue) },
    { label: "Serial numbers", value: data.serialNumbers || "Not recorded", mono: Boolean(data.serialNumbers), span: 6 },
  ]);
  s.fields([{ label: "Description", value: data.description, span: 12 }]);

  s.section("Storage");
  s.fields([
    { label: "Vault", value: data.vaultLocation, span: 6 },
    { label: "Storage unit", value: data.storageUnit || "To be assigned", mono: Boolean(data.storageUnit), span: 3 },
    { label: "Deposit date", value: fmtDate(data.depositDate), mono: true, span: 3 },
  ]);

  s.note(
    "This certifies that the assets described above were received and are held in custody by Aegis Cargo. Insurance, where purchased, is set out on the separate insurance certificate. Present this certificate, or its deposit number, for any release or transfer request.",
    { title: "Certification" }
  );

  s.signatures({ lines: ["Vault officer", "Depositor", "Date"], qr: { dataUrl: qr, caption: VAULT_CAPTION } });
  return s.finish();
}

// ═══════════════════════════════════════════════════════════════════════
// Shipment insurance certificate
// ═══════════════════════════════════════════════════════════════════════

export async function generateInsuranceCertificate(data: ShipmentData): Promise<Buffer> {
  const reference = `IC-${data.trackingNumber}`;
  const s = new Sheet({ title: "Insurance Certificate", reference });
  const t = totalsOf(data);
  const qr = await generateTrackingQR(data.trackingNumber);

  s.header([
    { label: "Certificate", value: reference, mono: true, strong: true, span: 4 },
    { label: "Air waybill", value: data.trackingNumber, mono: true, span: 3 },
    { label: "Issued", value: fmtDate(data.createdAt), mono: true, span: 2 },
    { label: "Cover", value: "All risks, door to door", span: 3 },
  ]);

  s.parties([shipper(data, "Insured party"), consignee(data, "Consignee")]);

  s.section("Cover");
  s.fields([
    { label: "Declared value", value: money(t.value), mono: true },
    { label: "Insured value", value: money(t.insuredValue), mono: true, strong: true },
    { label: "Packages insured", value: `${t.insured.length} of ${data.packages.length}`, mono: true },
    { label: "Service", value: serviceName(data.serviceType) },
  ]);
  s.fields([{ label: "Route", value: route(data), span: 12 }]);

  if (t.insured.length) {
    s.section("Insured packages");
    s.table(
      [
        { header: "Description", span: 6, medium: true },
        { header: "Pieces", span: 2, align: "right", mono: true },
        { header: "Weight (kg)", span: 2, align: "right", mono: true },
        { header: "Insured value", span: 2, align: "right", mono: true },
      ],
      t.insured.map((p) => [p.description, String(p.pieces), num(p.weight), money(p.declaredValue)]),
      { totals: ["Total insured", "", "", money(t.insuredValue)] }
    );
  }

  s.note(
    `Cover applies from collection to final delivery for the packages listed above. Report any loss or damage within 72 hours of delivery to ${COMPANY.email}, quoting this certificate number.`,
    { title: "Claims" }
  );

  s.signatures({ lines: ["Authorised signatory", "Name and title", "Date"], qr: { dataUrl: qr, caption: TRACK_CAPTION } });
  return s.finish();
}

// ═══════════════════════════════════════════════════════════════════════
// Assay report
// ═══════════════════════════════════════════════════════════════════════

const ASSAY_RESULT: Record<string, { label: string; tone: "navy" | "signal" | "neutral" }> = {
  PASSED: { label: "Passed", tone: "navy" },
  WAIVED: { label: "Waived", tone: "neutral" },
  FAILED: { label: "Failed", tone: "signal" },
};

export async function generateAssayReport(data: VaultAssayData): Promise<Buffer> {
  const reference = `AR-${data.depositNumber}`;
  const s = new Sheet({ title: "Assay Report", reference });
  const qr = await generateVaultQR(data.depositNumber);
  const cur = data.currency;
  const result = ASSAY_RESULT[data.assayStatus] ?? { label: "Pending", tone: "neutral" as const };

  s.header([
    { label: "Deposit number", value: data.depositNumber, mono: true, strong: true, span: 4 },
    { label: "Report", value: reference, mono: true, span: 3 },
    { label: "Vault", value: data.vaultLocation, span: 5 },
  ]);

  // Result line: the outcome as a tag, the method beside it.
  s.font("sans", 6.9, INK_3);
  s.text("Result", gx(0), s.y);
  s.text("Method", gx(3), s.y);
  s.text("Performed by", gx(7), s.y);
  s.tag(result.label, gx(0), s.y + 6, result.tone);
  s.font("sans", 8.8, INK);
  s.text(data.assayMethod || "Not stated", gx(3), s.y + 5.4);
  s.text(data.assayPerformedBy || "Not stated", gx(7), s.y + 5.4);
  s.y += 13;

  s.parties([client(data.client, "Client"), custodian("Testing facility")]);

  s.section("Asset under test");
  s.fields([
    { label: "Asset type", value: data.assetType },
    { label: "Quantity", value: String(data.quantity), mono: true },
    { label: "Declared purity", value: purity(data.purity), mono: true },
    { label: "LBMA certified", value: data.isLBMACertified ? "Yes" : "No" },
  ]);
  s.fields([
    { label: "Refiner or source", value: data.refinerName || "Not stated", span: 6 },
    { label: "Serial numbers", value: data.serialNumbers || "Not recorded", mono: Boolean(data.serialNumbers), span: 6 },
  ]);
  s.fields([{ label: "Description", value: data.description, span: 12 }]);

  s.section("Measurements");
  const disc = data.weightDiscrepancy;
  const discText =
    disc == null ? "—" : `${disc > 0 ? "+" : ""}${disc.toFixed(2)} g (${disc > 0 ? "+" : ""}${((disc / data.weightGrams) * 100).toFixed(3)}%)`;
  s.table(
    [
      { header: "Measure", span: 3, medium: true },
      { header: "Declared", span: 3, align: "right", mono: true },
      { header: "Verified", span: 3, align: "right", mono: true },
      { header: "Difference", span: 3, align: "right", mono: true },
    ],
    [
      ["Weight", grams(data.weightGrams), data.weightVerified != null ? grams(data.weightVerified) : "Pending", discText],
      [
        "Value",
        money(data.declaredValue, cur),
        data.verifiedValue != null ? money(data.verifiedValue, cur) : "Pending",
        data.verifiedValue != null ? money(data.verifiedValue - data.declaredValue, cur) : "—",
      ],
    ]
  );

  if (data.assayResult) {
    s.section("Laboratory notes");
    s.note(data.assayResult);
  }

  s.note(
    "This report records the assay and verification results for the assets described above, using the method stated. Results are valid for twelve months from the date of issue. Disputes must be raised within 30 days; re-assay is available on request.",
    { title: "Certification" }
  );

  s.signatures({ lines: ["Assayer", "Reviewed by", "Date"], qr: { dataUrl: qr, caption: VAULT_CAPTION } });
  return s.finish();
}

// ═══════════════════════════════════════════════════════════════════════
// Storage agreement
// ═══════════════════════════════════════════════════════════════════════

const STORAGE_LABELS: Record<string, string> = {
  ALLOCATED: "Allocated: specific items held for the depositor",
  SEGREGATED: "Segregated: held apart from other clients' metal",
  UNALLOCATED: "Unallocated: a claim on pooled metal",
};

export async function generateStorageAgreement(data: VaultStorageData): Promise<Buffer> {
  const custodyRef = data.custodyReferenceId || data.depositNumber;
  const reference = `SA-${custodyRef}`;
  const s = new Sheet({ title: "Storage Agreement", reference });
  const qr = await generateVaultQR(data.depositNumber);
  const cur = data.currency;

  s.header([
    { label: "Custody reference", value: custodyRef, mono: true, strong: true, span: 4 },
    { label: "Deposit number", value: data.depositNumber, mono: true, span: 3 },
    { label: "Effective", value: fmtDate(data.depositDate), mono: true, span: 2 },
    { label: "Storage type", value: data.storageType.charAt(0) + data.storageType.slice(1).toLowerCase(), span: 3 },
  ]);

  s.parties([custodian(), client(data.client, "Depositor")]);

  s.section("Assets in custody");
  s.fields([
    { label: "Asset type", value: data.assetType },
    { label: "Quantity", value: String(data.quantity), mono: true },
    { label: "Purity", value: purity(data.purity), mono: true },
    { label: "Weight", value: grams(data.weightGrams), mono: true },
  ]);
  s.fields([
    { label: "Declared value", value: money(data.declaredValue, cur), mono: true },
    { label: "Serial numbers", value: data.serialNumbers || "Not recorded", mono: Boolean(data.serialNumbers), span: 9 },
  ]);
  s.fields([{ label: "Description", value: data.description, span: 12 }]);

  s.section("Storage and fees");
  s.fields([
    { label: "Storage type", value: STORAGE_LABELS[data.storageType] || data.storageType, span: 6 },
    { label: "Vault", value: data.vaultLocation, span: 3 },
    { label: "Storage unit", value: data.storageUnit || "To be assigned", mono: Boolean(data.storageUnit), span: 3 },
  ]);
  s.fields([
    { label: "Commencement", value: fmtDate(data.depositDate), mono: true },
    { label: "Monthly fee", value: data.monthlyStorageFee ? money(data.monthlyStorageFee, cur) : "Per published schedule", mono: Boolean(data.monthlyStorageFee) },
    { label: "Billing", value: "Monthly, on the 1st" },
    { label: "Insured value", value: data.insuredValue ? money(data.insuredValue, cur) : "Not insured", mono: Boolean(data.insuredValue) },
  ]);
  if (data.insuredValue) {
    s.fields([
      { label: "Insurer", value: data.insuranceProvider || "Not stated", span: 6 },
      { label: "Policy number", value: data.insurancePolicyNo || "Not stated", mono: Boolean(data.insurancePolicyNo), span: 6 },
    ]);
  }

  s.section("Terms");
  s.clauses([
    "The Custodian holds the Assets in secure storage and maintains insurance on them for as long as they remain in custody.",
    "Storage is charged monthly at the rate in the published fee schedule accepted at the time of deposit. No charge outside that schedule may be made.",
    "A withdrawal requires five business days' notice and presentation of this agreement or the custody reference above.",
    "The Depositor may view the status and activity history of the Assets at any time from the online vault account.",
    "Either party may end this agreement with 30 days' written notice.",
    "This agreement is governed by the laws of Romania.",
  ]);

  s.signatures({ lines: ["For the Custodian", "Depositor", "Date"], qr: { dataUrl: qr, caption: VAULT_CAPTION } });
  return s.finish();
}

// ═══════════════════════════════════════════════════════════════════════
// Vault insurance certificate
// ═══════════════════════════════════════════════════════════════════════

const COVERAGE_LABELS: Record<string, string> = {
  ALL_RISK: "All risks: theft, fire, flood, natural disaster and transit",
  THEFT_FIRE: "Theft and fire",
  BASIC: "Fire only",
};

export async function generateVaultInsuranceCertificate(data: VaultInsuranceData): Promise<Buffer> {
  const reference = `VIC-${data.depositNumber}`;
  const s = new Sheet({ title: "Insurance Certificate", reference });
  const qr = await generateVaultQR(data.depositNumber);
  const cur = data.currency;

  s.header(
    [
      { label: "Policy number", value: data.insurancePolicyNo || "Pending", mono: true, strong: true, span: 4 },
      { label: "Deposit number", value: data.depositNumber, mono: true, span: 3 },
      { label: "Cover from", value: fmtDate(data.depositDate), mono: true, span: 2 },
      { label: "Expires", value: fmtDate(data.insuranceExpiryDate), mono: true, span: 3 },
    ],
    { subtitle: "Vault custody cover" }
  );

  s.parties([
    client(data.client, "Insured party"),
    { heading: "Insurer", name: data.insuranceProvider || "To be confirmed", lines: [], contact: [`Arranged by ${COMPANY.name}`] },
  ]);

  s.section("Cover");
  s.fields([
    { label: "Insured value", value: data.insuredValue ? money(data.insuredValue, cur) : "Pending", mono: true, strong: true },
    { label: "Declared value", value: money(data.declaredValue, cur), mono: true },
    { label: "Cover", value: COVERAGE_LABELS[data.insuranceCoverage || ""] || data.insuranceCoverage || "Not stated", span: 6 },
  ]);

  s.section("Insured assets");
  s.fields([
    { label: "Asset type", value: data.assetType },
    { label: "Weight", value: grams(data.weightGrams), mono: true },
    { label: "Purity", value: purity(data.purity), mono: true },
    { label: "Custody reference", value: data.custodyReferenceId || "Pending", mono: true },
  ]);
  s.fields([{ label: "Description", value: data.description, span: 12 }]);
  s.fields([
    { label: "Vault", value: data.vaultLocation, span: 6 },
    { label: "Storage unit", value: data.storageUnit || "To be assigned", mono: Boolean(data.storageUnit), span: 3 },
    { label: "Storage type", value: data.storageType.charAt(0) + data.storageType.slice(1).toLowerCase(), span: 3 },
  ]);

  s.note(
    `This certificate confirms that the assets described above are insured while in custody at the vault stated. Report any loss or damage within 48 hours of discovery to ${COMPANY.email}, quoting the policy and deposit numbers.`,
    { title: "Claims" }
  );

  s.signatures({ lines: ["Authorised signatory", "Name and title", "Date"], qr: { dataUrl: qr, caption: VAULT_CAPTION } });
  return s.finish();
}

// ─── Export map ─────────────────────────────────────────────────────────

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
