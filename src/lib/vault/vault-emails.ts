"use server";

// ═══════════════════════════════════════════════════════════════
// src/lib/vault/vault-emails.ts
// Vault Email Notifications — Status change emails to clients
// ═══════════════════════════════════════════════════════════════

import transporter from "@/lib/verify-mail";

const FROM = "Aegis Cargo Vault <admin@aegiscargo.org>";
const SITE = "https://www.aegiscargo.org";

// ─── BRANDED EMAIL WRAPPER ───────────────────────────────────

function vaultEmailTemplate(
  clientName: string,
  subject: string,
  statusLabel: string,
  statusColor: string,
  statusBg: string,
  bodyHtml: string,
  ctaUrl?: string,
  ctaLabel?: string
): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0F1D2F 0%,#132640 100%);padding:32px;text-align:center;">
    <img src="${SITE}/images/logo.png" alt="Aegis Cargo" style="height:48px;margin-bottom:16px;" />
    <h1 style="color:#8C9EAF;font-size:20px;margin:0;font-weight:600;">Vault Custody Service</h1>
    <p style="color:#94a3b8;font-size:12px;margin:8px 0 0 0;">LBMA Approved • Fully Insured • 24/7 Security</p>
  </div>
  
  <!-- Gold accent bar -->
  <div style="height:3px;background:linear-gradient(90deg,#8C9EAF,#7A8D9E,#8C9EAF);"></div>
  
  <!-- Body -->
  <div style="padding:32px;">
    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px 0;">Dear <strong>${clientName}</strong>,</p>
    
    <!-- Status Badge -->
    <div style="background:${statusBg};border:1px solid ${statusColor};border-radius:12px;padding:20px;margin:0 0 24px 0;text-align:center;">
      <p style="color:${statusColor};font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 6px 0;font-weight:600;">Deposit Status</p>
      <p style="color:${statusColor};font-size:22px;font-weight:700;margin:0;">${statusLabel}</p>
    </div>
    
    ${bodyHtml}
    
    ${ctaUrl ? `<div style="text-align:center;margin:28px 0;">
      <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#8C9EAF,#7A8D9E);color:#0F1D2F;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:14px;">${ctaLabel || "View in Dashboard"}</a>
    </div>` : ""}
  </div>
  
  <!-- Footer -->
  <div style="background:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:11px;margin:0 0 4px 0;text-align:center;">Aegis Cargo Vault Services Ltd. | admin@aegiscargo.org</p>
    <p style="color:#d1d5db;font-size:10px;margin:0;text-align:center;">&copy; ${new Date().getFullYear()} All rights reserved. This is an automated notification.</p>
  </div>
</div>
</body></html>`;
}

// ─── DETAIL ROW HELPER ───────────────────────────────────────

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 12px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">${label}</td>
    <td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500;text-align:right;border-bottom:1px solid #f3f4f6;">${value}</td>
  </tr>`;
}

function detailTable(rows: string): string {
  return `<table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden;margin:16px 0;">${rows}</table>`;
}

// ─── SEND HELPER ─────────────────────────────────────────────

async function sendVault(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (error) {
    console.error(`Vault email failed [${subject}]:`, error);
  }
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION FUNCTIONS — One per status transition
// ═══════════════════════════════════════════════════════════════

export async function notifyKYCApproved(email: string, name: string, depositNumber: string) {
  const html = vaultEmailTemplate(
    name,
    "KYC Approved",
    "✓ Identity Verified",
    "#1E3A5F", "#ecfdf5",
    `<p style="color:#374151;font-size:14px;line-height:1.7;">Your identity verification has been approved. Your vault deposit <strong>${depositNumber}</strong> is now cleared for the intake phase.</p>
    <p style="color:#374151;font-size:14px;line-height:1.7;">Our team will schedule an intake appointment for your assets. You will receive a notification with the date, time, and delivery instructions.</p>`,
    `${SITE}/my-vault`, "View My Vault"
  );
  await sendVault(email, `KYC Approved — Deposit ${depositNumber} | Aegis Cargo Vault`, html);
}

export async function notifyKYCRejected(email: string, name: string, depositNumber: string, reason?: string) {
  const html = vaultEmailTemplate(
    name,
    "KYC Review Update",
    "Action Required",
    "#dc2626", "#fef2f2",
    `<p style="color:#374151;font-size:14px;line-height:1.7;">We were unable to verify your identity for deposit <strong>${depositNumber}</strong>.</p>
    ${reason ? `<div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;margin:16px 0;border-radius:0 8px 8px 0;">
      <p style="color:#991b1b;font-size:13px;margin:0;"><strong>Reason:</strong> ${reason}</p>
    </div>` : ""}
    <p style="color:#374151;font-size:14px;line-height:1.7;">Please review and resubmit your KYC documents to proceed.</p>`,
    `${SITE}/my-vault/kyc`, "Resubmit KYC"
  );
  await sendVault(email, `KYC Update — Deposit ${depositNumber} | Aegis Cargo Vault`, html);
}

export async function notifyIntakeScheduled(
  email: string, name: string, depositNumber: string,
  appointmentDate: string, intakeMethod: string
) {
  const methodLabels: Record<string, string> = {
    CLIENT_DELIVERY: "Client Delivery (you deliver to our facility)",
    ARMORED_TRANSPORT: "Armored Transport (we collect from your location)",
    VAULT_TRANSFER: "Vault-to-Vault Transfer",
  };

  const html = vaultEmailTemplate(
    name,
    "Intake Scheduled",
    "Appointment Confirmed",
    "#2563eb", "#eff6ff",
    `<p style="color:#374151;font-size:14px;line-height:1.7;">Your intake appointment for deposit <strong>${depositNumber}</strong> has been scheduled.</p>
    ${detailTable(
      detailRow("Appointment Date", new Date(appointmentDate).toLocaleString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })) +
      detailRow("Delivery Method", methodLabels[intakeMethod] || intakeMethod) +
      detailRow("Facility", "Aegis Cargo Vault, London")
    )}
    <p style="color:#374151;font-size:14px;line-height:1.7;">Please ensure all assets are properly packaged and sealed. Bring this email and a valid photo ID to the appointment.</p>`,
    `${SITE}/my-vault`, "View Details"
  );
  await sendVault(email, `Intake Appointment — ${depositNumber} | Aegis Cargo Vault`, html);
}

export async function notifyIntakeComplete(email: string, name: string, depositNumber: string) {
  const html = vaultEmailTemplate(
    name,
    "Intake Complete",
    "Assets Received",
    "#1E3A5F", "#ecfdf5",
    `<p style="color:#374151;font-size:14px;line-height:1.7;">Your assets for deposit <strong>${depositNumber}</strong> have been received at our vault facility and are now undergoing verification.</p>
    <p style="color:#374151;font-size:14px;line-height:1.7;">The verification process includes weight confirmation and assay testing. You will be notified once results are available.</p>`,
    `${SITE}/my-vault`, "Track Progress"
  );
  await sendVault(email, `Assets Received — ${depositNumber} | Aegis Cargo Vault`, html);
}

export async function notifyAssayComplete(
  email: string, name: string, depositNumber: string,
  passed: boolean, method?: string, weightVerified?: number, weightDeclared?: number
) {
  const statusLabel = passed ? "✓ Verification Passed" : "⚠ Verification Issue";
  const statusColor = passed ? "#1E3A5F" : "#d97706";
  const statusBg = passed ? "#ecfdf5" : "#fffbeb";

  let details = "";
  if (method || weightVerified) {
    details = detailTable(
      (method ? detailRow("Assay Method", method) : "") +
      (weightDeclared ? detailRow("Declared Weight", `${weightDeclared}g`) : "") +
      (weightVerified ? detailRow("Verified Weight", `${weightVerified}g`) : "") +
      detailRow("Result", passed ? "PASSED" : "REQUIRES REVIEW")
    );
  }

  const html = vaultEmailTemplate(
    name,
    "Assay Results",
    statusLabel,
    statusColor, statusBg,
    `<p style="color:#374151;font-size:14px;line-height:1.7;">The assay and verification process for deposit <strong>${depositNumber}</strong> is now complete.</p>
    ${details}
    ${passed
      ? `<p style="color:#374151;font-size:14px;line-height:1.7;">Your assets have been verified and will now proceed to documentation and secure storage placement.</p>`
      : `<p style="color:#374151;font-size:14px;line-height:1.7;">There was a discrepancy during verification. Our team will contact you to discuss next steps.</p>`
    }`,
    `${SITE}/my-vault`, "View Report"
  );
  await sendVault(email, `Assay Results — ${depositNumber} | Aegis Cargo Vault`, html);
}

export async function notifyPlacedInStorage(
  email: string, name: string, depositNumber: string,
  custodyRef: string, storageUnit?: string, monthlyFee?: number
) {
  const html = vaultEmailTemplate(
    name,
    "Placed in Storage",
    "✓ Secure Custody Active",
    "#1E3A5F", "#ecfdf5",
    `<p style="color:#374151;font-size:14px;line-height:1.7;">Your assets for deposit <strong>${depositNumber}</strong> are now in secure vault storage.</p>
    ${detailTable(
      detailRow("Custody Reference", `<strong>${custodyRef}</strong>`) +
      (storageUnit ? detailRow("Storage Unit", storageUnit) : "") +
      (monthlyFee ? detailRow("Monthly Storage Fee", `$${monthlyFee.toFixed(2)}`) : "") +
      detailRow("Security", "24/7 Armed Guard • Biometric Access • CCTV") +
      detailRow("Insurance", "Fully Insured — Lloyd's of London")
    )}
    <p style="color:#374151;font-size:14px;line-height:1.7;">Your custody reference number is <strong style="font-family:monospace;color:#0F1D2F;font-size:16px;">${custodyRef}</strong>. Keep this safe — you'll need it for all future transactions.</p>
    <p style="color:#6b7280;font-size:13px;">Monthly storage fees will be invoiced on the 1st of each month. You can view your holdings and request withdrawals from your vault dashboard at any time.</p>`,
    `${SITE}/my-vault`, "View My Vault"
  );
  await sendVault(email, `In Secure Storage — ${custodyRef} | Aegis Cargo Vault`, html);
}

export async function notifyInsuranceActivated(
  email: string, name: string, depositNumber: string,
  insuredValue: number, provider: string, policyNo: string, coverage: string
) {
  const coverageLabels: Record<string, string> = {
    ALL_RISK: "All-Risk (theft, fire, flood, natural disaster, transit)",
    THEFT_FIRE: "Theft & Fire",
    BASIC: "Basic (fire only)",
  };

  const html = vaultEmailTemplate(
    name,
    "Insurance Activated",
    "✓ Coverage Active",
    "#2563eb", "#eff6ff",
    `<p style="color:#374151;font-size:14px;line-height:1.7;">Insurance coverage has been activated for your vault deposit <strong>${depositNumber}</strong>.</p>
    ${detailTable(
      detailRow("Insured Value", `<strong>$${insuredValue.toLocaleString()}</strong>`) +
      detailRow("Coverage Type", coverageLabels[coverage] || coverage) +
      detailRow("Underwriter", provider) +
      detailRow("Policy Number", `<code>${policyNo}</code>`)
    )}
    <p style="color:#6b7280;font-size:13px;">Coverage is continuous and renews automatically. Claims must be reported within 48 hours. Contact claims@aegiscargo.org for any questions.</p>`,
    `${SITE}/my-vault`, "View Policy Details"
  );
  await sendVault(email, `Insurance Active — ${depositNumber} | Aegis Cargo Vault`, html);
}

export async function notifyReleaseRequested(email: string, name: string, depositNumber: string) {
  const html = vaultEmailTemplate(
    name,
    "Release Requested",
    "Processing",
    "#d97706", "#fffbeb",
    `<p style="color:#374151;font-size:14px;line-height:1.7;">A release request has been submitted for deposit <strong>${depositNumber}</strong>.</p>
    <p style="color:#374151;font-size:14px;line-height:1.7;">Our compliance team will review the request. This typically takes 1–2 business days. You will be notified once approved.</p>`,
    `${SITE}/my-vault`, "Track Request"
  );
  await sendVault(email, `Release Request — ${depositNumber} | Aegis Cargo Vault`, html);
}

export async function notifyReleaseApproved(email: string, name: string, depositNumber: string) {
  const html = vaultEmailTemplate(
    name,
    "Release Approved",
    "✓ Ready for Collection",
    "#1E3A5F", "#ecfdf5",
    `<p style="color:#374151;font-size:14px;line-height:1.7;">The release of your assets from deposit <strong>${depositNumber}</strong> has been approved.</p>
    <p style="color:#374151;font-size:14px;line-height:1.7;">Please contact our vault team at <strong>admin@aegiscargo.org</strong> to arrange collection or delivery. You will need to present:</p>
    <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="color:#374151;font-size:13px;margin:0 0 6px 0;">• Valid photo identification</p>
      <p style="color:#374151;font-size:13px;margin:0 0 6px 0;">• Original vault deposit certificate or custody reference</p>
      <p style="color:#374151;font-size:13px;margin:0;">• Signed release authorization form</p>
    </div>`,
    `${SITE}/my-vault`, "View Details"
  );
  await sendVault(email, `Release Approved — ${depositNumber} | Aegis Cargo Vault`, html);
}

export async function notifyReleased(email: string, name: string, depositNumber: string) {
  const html = vaultEmailTemplate(
    name,
    "Assets Released",
    "Complete",
    "#6b7280", "#f9fafb",
    `<p style="color:#374151;font-size:14px;line-height:1.7;">Your assets from deposit <strong>${depositNumber}</strong> have been released from our vault.</p>
    <p style="color:#374151;font-size:14px;line-height:1.7;">Thank you for using Aegis Cargo Vault Services. We hope to serve you again in the future.</p>
    <p style="color:#6b7280;font-size:13px;">A final custody statement will be issued within 5 business days.</p>`,
    `${SITE}/my-vault`, "View History"
  );
  await sendVault(email, `Assets Released — ${depositNumber} | Aegis Cargo Vault`, html);
}

export async function notifyDocumentsIssued(email: string, name: string, depositNumber: string, custodyRef: string) {
  const html = vaultEmailTemplate(
    name,
    "Documents Issued",
    "Custody Reference Assigned",
    "#8C9EAF", "#fffbeb",
    `<p style="color:#374151;font-size:14px;line-height:1.7;">Custody documents have been issued for deposit <strong>${depositNumber}</strong>.</p>
    <div style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #8C9EAF;border-radius:12px;padding:24px;margin:20px 0;text-align:center;">
      <p style="color:#92400e;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Custody Reference</p>
      <p style="color:#0F1D2F;font-size:24px;font-weight:700;font-family:monospace;margin:0;">${custodyRef}</p>
    </div>
    <p style="color:#374151;font-size:14px;line-height:1.7;">Your deposit certificate, storage agreement, and insurance certificate are now available in your vault dashboard. Your assets will be placed in secure storage shortly.</p>`,
    `${SITE}/my-vault`, "Download Documents"
  );
  await sendVault(email, `Documents Issued — ${custodyRef} | Aegis Cargo Vault`, html);
}
