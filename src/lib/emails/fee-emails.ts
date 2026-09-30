import transporter, { FROM_EMAIL } from "@/lib/verify-mail";

type FeeEmailData = {
  recipientEmail: string;
  recipientName: string;
  trackingNumber: string;
  feeType: string;
  amount: number;
  currency: string;
  reason: string;
  invoiceNumber: string;
  shipmentOrigin: string;
  shipmentDestination: string;
};

const FEE_TYPE_LABELS: Record<string, string> = {
  AIRWAY_BILL: "Airway Bill Fee",
  SHIPPING_FREIGHT: "Shipping & Freight Fee",
  HOLD_RELEASE: "Hold Release Fee",
  CUSTOMS_DUTY: "Customs & Duty Fee",
  CUSTOM: "Additional Fee",
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

// ═══════════════════════════════════════════
// BOOKING CONFIRMATION — sent to the customer who booked, listing the
// itemized charges they accepted. No charges are added after this.
// ═══════════════════════════════════════════
export const BOOKING_FEE_LABEL = "Booking charges (accepted at booking)";

export function formatQuoteLines(lines: { label: string; amount: number }[], currency: string): string {
  return lines.map((l) => `${l.label}: ${formatCurrency(l.amount, currency)}`).join("\n");
}

type BookingEmailData = {
  email: string;
  name: string;
  trackingNumber: string;
  serviceLabel: string;
  route: string;
  lines: { label: string; amount: number }[];
  total: number;
  currency: string;
};

export async function sendBookingConfirmationEmail(data: BookingEmailData): Promise<boolean> {
  const rows = data.lines
    .map(
      (l) => `
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">${l.label}</td>
          <td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;border-bottom:1px solid #e5e7eb;">${formatCurrency(l.amount, data.currency)}</td>
        </tr>`
    )
    .join("");

  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: data.email,
      subject: `Booking Confirmed — ${data.trackingNumber} | Aegis Cargo`,
      html: `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
  <div style="background:linear-gradient(135deg,#0F1D2F 0%,#132640 100%);padding:32px;text-align:center;">
    <img src="https://www.aegiscargo.org/images/logo.png" alt="Aegis Cargo" style="height:48px;margin-bottom:16px;" />
    <h1 style="color:#fff;font-size:22px;margin:0;font-weight:600;">Booking Confirmed</h1>
    <p style="color:#8C9EAF;font-size:14px;margin:8px 0 0;">${data.trackingNumber}</p>
  </div>

  <div style="padding:32px;">
    <p style="color:#374151;font-size:15px;line-height:1.6;">Dear <strong>${data.name}</strong>,</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;">Your shipment is booked. These are the charges you accepted — this is the full price, and nothing will be added to it.</p>

    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:24px 0;">
      <p style="color:#6b7280;font-size:13px;margin:0 0 12px;">${data.serviceLabel} · ${data.route}</p>
      <table style="width:100%;border-collapse:collapse;">
        ${rows}
        <tr>
          <td style="padding:12px 0 0;color:#111827;font-size:15px;font-weight:700;">Total</td>
          <td style="padding:12px 0 0;color:#1E3A5F;font-size:18px;font-weight:700;text-align:right;">${formatCurrency(data.total, data.currency)}</td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin:32px 0;">
      <a href="https://www.aegiscargo.org/track" style="display:inline-block;background:#1E3A5F;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:14px;">Track Your Shipment</a>
    </div>
  </div>

  <div style="background:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb;text-align:center;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Aegis Cargo Ltd | Registered in Romania</p>
    <p style="color:#9ca3af;font-size:12px;margin:4px 0 0;">admin@aegiscargo.org</p>
  </div>
</div>`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send booking confirmation email:", error);
    return false;
  }
}

// ═══════════════════════════════════════════
// RECEIPT EMAIL — sent when admin marks fee as paid
// ═══════════════════════════════════════════
export async function sendFeeReceiptEmail(
  data: FeeEmailData & { customType?: string | null; paidAt: Date; receiptPdf: Buffer }
): Promise<boolean> {
  const feeLabel = data.customType || FEE_TYPE_LABELS[data.feeType] || data.feeType;
  const formattedAmount = formatCurrency(data.amount, data.currency);
  const paidDate = data.paidAt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: data.recipientEmail,
      subject: `✅ Payment Confirmed — ${feeLabel} for ${data.trackingNumber} | Aegis Cargo`,
      attachments: [
        {
          filename: `receipt-${data.invoiceNumber}.pdf`,
          content: data.receiptPdf,
          contentType: "application/pdf",
        },
      ],
      html: `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0F1D2F 0%,#132640 100%);padding:32px;text-align:center;">
    <img src="https://www.aegiscargo.org/images/logo.png" alt="Aegis Cargo" style="height:48px;margin-bottom:16px;" />
    <h1 style="color:#fff;font-size:22px;margin:0;font-weight:600;">Payment Confirmed</h1>
    <p style="color:#1E3A5F;font-size:14px;margin:8px 0 0;">Receipt ${data.invoiceNumber}</p>
  </div>

  <!-- Body -->
  <div style="padding:32px;">
    <p style="color:#374151;font-size:15px;line-height:1.6;">Dear <strong>${data.recipientName}</strong>,</p>
    <p style="color:#374151;font-size:15px;line-height:1.6;">We have received your payment. Your shipment will now continue processing.</p>

    <!-- Success Banner -->
    <div style="background:#EEF2F7;border:1px solid #B3C7DB;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <p style="color:#162D4A;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Payment Received</p>
      <p style="color:#1E3A5F;font-size:36px;font-weight:700;margin:0;">${formattedAmount}</p>
      <p style="color:#162D4A;font-size:13px;margin:8px 0 0;">Paid on ${paidDate}</p>
    </div>

    <!-- Details Table -->
    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:24px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Receipt Number</td>
          <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #e5e7eb;">${data.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Tracking Number</td>
          <td style="padding:10px 0;color:#1E3A5F;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #e5e7eb;">${data.trackingNumber}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Fee Type</td>
          <td style="padding:10px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;border-bottom:1px solid #e5e7eb;">${feeLabel}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#6b7280;font-size:14px;">Status</td>
          <td style="padding:10px 0;text-align:right;"><span style="display:inline-block;background:#1E3A5F;color:#fff;padding:4px 12px;border-radius:50px;font-size:12px;font-weight:600;">PAID</span></td>
        </tr>
      </table>
    </div>

    <!-- PDF note -->
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:24px 0;">
      <p style="color:#1e40af;font-size:13px;margin:0;line-height:1.5;">
        📎 <strong>Your official receipt is attached</strong> as a PDF to this email. Please keep it for your records.
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin:32px 0;">
      <a href="https://www.aegiscargo.org/track" style="display:inline-block;background:#1E3A5F;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:14px;">Track Your Shipment</a>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb;text-align:center;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Aegis Cargo Ltd | Registered in Romania</p>
    <p style="color:#9ca3af;font-size:12px;margin:4px 0 0;">admin@aegiscargo.org</p>
  </div>
</div>`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send fee receipt email:", error);
    return false;
  }
}