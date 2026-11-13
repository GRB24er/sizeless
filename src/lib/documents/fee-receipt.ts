import { generateTrackingQR } from "./qr-generator";
import { Sheet, fmtDate, fmtDateTime, gx, INK_3 } from "./layout";

const FEE_TYPE_LABELS: Record<string, string> = {
  AIRWAY_BILL: "Air waybill fee",
  SHIPPING_FREIGHT: "Shipping and freight fee",
  HOLD_RELEASE: "Hold release fee",
  CUSTOMS_DUTY: "Customs and duty fee",
  CUSTOM: "Additional fee",
};

function fmtCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
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
  payerName: string;
  payerEmail?: string | null;
  payerPhone: string;
  recipientName: string;
};

/** Receipt for a fee paid against a shipment. */
export async function generateFeeReceiptPDF(data: FeeReceiptData): Promise<Buffer> {
  const s = new Sheet({ title: "Payment Receipt", reference: data.invoiceNumber });
  const qr = await generateTrackingQR(data.trackingNumber);
  const feeLabel = data.customType || FEE_TYPE_LABELS[data.feeType] || data.feeType;
  const amount = fmtCurrency(data.amount, data.currency);

  s.header([
    { label: "Receipt number", value: data.invoiceNumber, mono: true, strong: true, span: 4 },
    { label: "Air waybill", value: data.trackingNumber, mono: true, span: 3 },
    { label: "Paid", value: fmtDateTime(data.paidAt), mono: true, span: 5 },
  ]);

  // Amount received, with the status beside it.
  s.font("sans", 6.9, INK_3);
  s.text("Amount received", gx(0), s.y);
  s.text("Status", gx(9), s.y);
  s.font("monoMedium", 20);
  s.text(amount, gx(0), s.y + 9);
  s.tag("Paid in full", gx(9), s.y + 7, "navy");
  s.y += 16;

  s.parties([
    { heading: "Received from", name: data.payerName, lines: [], contact: [data.payerEmail, data.payerPhone] },
    {
      heading: "For shipment",
      name: data.trackingNumber,
      lines: [`${data.shipmentOrigin} to ${data.shipmentDestination}`, `Recipient: ${data.recipientName}`],
    },
  ]);

  s.section("Charges");
  s.table(
    [
      { header: "Description", span: 9, medium: true },
      { header: "Amount", span: 3, align: "right", mono: true },
    ],
    [[`${feeLabel}${data.reason ? `\n${data.reason}` : ""}`, amount]]
  );
  s.totals([
    { label: "Subtotal", value: amount },
    { label: "Total paid", value: amount },
  ]);

  s.note(
    `Payment of ${amount} was received on ${fmtDate(data.paidAt)} against shipment ${data.trackingNumber}. Keep this receipt for your records; it is also stored with the shipment in your account.`
  );

  s.signatures({ lines: [], qr: { dataUrl: qr, caption: "Scan to follow this shipment on aegiscargo.org" } });
  return s.finish();
}
