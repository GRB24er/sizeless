"use server";

// ═══════════════════════════════════════════════════════════════
// src/app/(root)/(protected)/my-vault/kyc-actions.ts
// KYC Server Actions — Client submission + Admin review
// ═══════════════════════════════════════════════════════════════

import { revalidatePath } from "next/cache";
import { prisma } from "@/constants/config/db";
import { auth } from "~/auth";
import transporter from "@/lib/verify-mail";

const FROM_EMAIL = "Aegis Cargo Vault <admin@aegiscargo.org>";

// ─── HELPER: Send styled vault email ─────────────────────────

async function sendVaultEmail(
  email: string,
  name: string,
  subject: string,
  bodyHtml: string
) {
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:linear-gradient(135deg,#0A1628 0%,#0D1F35 100%);padding:32px;text-align:center;">
          <img src="https://www.aegiscargo.org/images/logo.png" alt="Aegis Cargo" style="height:48px;margin-bottom:16px;" />
          <h1 style="color:#D4A853;font-size:22px;margin:0;font-weight:600;">Vault KYC Verification</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#374151;font-size:15px;line-height:1.6;">Dear <strong>${name}</strong>,</p>
          ${bodyHtml}
        </div>
        <div style="background:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} Aegis Cargo Vault Services | admin@aegiscargo.org</p>
        </div>
      </div>`,
    });
  } catch (error) {
    console.error("KYC email failed:", error);
  }
}

// ─── GET CLIENT KYC STATUS ───────────────────────────────────

export async function getMyKYCStatus() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const kyc = await prisma.vaultKYC.findFirst({
    where: { clientId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return kyc;
}

// ─── SUBMIT KYC APPLICATION ─────────────────────────────────

export async function submitKYC(data: {
  // Identity
  idType: string;
  idNumber: string;
  idExpiryDate: string;
  idDocumentUrl: string;
  // Address
  addressDocType: string;
  addressDocUrl: string;
  // Source of gold
  sourceOfGold: string;
  sourceDocUrl: string;
  sourceNotes?: string;
  // Corporate (optional)
  corporateName?: string;
  corporateRegNo?: string;
  corporateDocUrl?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    // Check for existing pending KYC
    const existing = await prisma.vaultKYC.findFirst({
      where: {
        clientId: session.user.id,
        status: { in: ["PENDING", "UNDER_REVIEW"] },
      },
    });

    if (existing) {
      return { error: "You already have a pending KYC application. Please wait for review." };
    }

    const kyc = await prisma.vaultKYC.create({
      data: {
        clientId: session.user.id,
        status: "PENDING",
        idType: data.idType,
        idNumber: data.idNumber,
        idExpiryDate: new Date(data.idExpiryDate),
        idDocumentUrl: data.idDocumentUrl,
        addressDocType: data.addressDocType,
        addressDocUrl: data.addressDocUrl,
        sourceOfGold: data.sourceOfGold,
        sourceDocUrl: data.sourceDocUrl,
        sourceNotes: data.sourceNotes || null,
        corporateName: data.corporateName || null,
        corporateRegNo: data.corporateRegNo || null,
        corporateDocUrl: data.corporateDocUrl || null,
      },
    });

    // Email client confirmation
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (user?.email) {
      await sendVaultEmail(
        user.email,
        user.name,
        "KYC Application Received — Aegis Cargo Vault",
        `<p style="color:#374151;font-size:15px;line-height:1.6;">Your KYC verification application has been received and is now under review.</p>
        <div style="background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);border:1px solid #D4A853;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
          <p style="color:#92400e;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Application Status</p>
          <p style="color:#D4A853;font-size:20px;font-weight:700;margin:0;">Under Review</p>
        </div>
        <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:24px 0;">
          <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;">Our compliance team will review your submitted documents within <strong>1–2 business days</strong>. You will receive an email notification once your verification is complete.</p>
        </div>
        <p style="color:#6b7280;font-size:13px;">If we require additional documentation, we will contact you directly.</p>`
      );
    }

    // Email admin notification
    await sendVaultEmail(
      "admin@aegiscargo.org",
      "Admin",
      `New KYC Submission — ${user?.name || "Client"} | Aegis Cargo`,
      `<p style="color:#374151;font-size:15px;line-height:1.6;">A new KYC application has been submitted and requires review.</p>
      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Client</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${user?.name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Email</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${user?.email}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">ID Type</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${data.idType}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Source of Gold</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${data.sourceOfGold}</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://www.aegiscargo.org/dashboard/shipments" style="display:inline-block;background:#D4A853;color:#0A1628;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:14px;">Review in Dashboard</a>
      </div>`
    );

    revalidatePath("/my-vault");
    return { success: true, kycId: kyc.id };
  } catch (error) {
    console.error("submitKYC error:", error);
    return { error: "Failed to submit KYC application" };
  }
}

// ─── ADMIN: GET ALL KYC APPLICATIONS ─────────────────────────

export async function getAllKYCApplications(statusFilter?: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return [];

  const where: Record<string, unknown> = {};
  if (statusFilter && statusFilter !== "ALL") {
    where.status = statusFilter;
  }

  return prisma.vaultKYC.findMany({
    where,
    include: {
      client: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── ADMIN: APPROVE KYC ─────────────────────────────────────

export async function adminApproveKYC(kycId: string, notes?: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

  try {
    const kyc = await prisma.vaultKYC.update({
      where: { id: kycId },
      data: {
        status: "APPROVED",
        sanctionsCheck: "CLEAR",
        pepCheck: "CLEAR",
        adverseMediaCheck: "CLEAR",
        amlNotes: notes || "All checks passed. Client cleared for vault services.",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
      include: { client: true },
    });

    // Email client
    if (kyc.client?.email) {
      await sendVaultEmail(
        kyc.client.email,
        kyc.client.name,
        "KYC Approved — You're Cleared for Vault Services | Aegis Cargo",
        `<p style="color:#374151;font-size:15px;line-height:1.6;">Great news! Your identity verification has been approved.</p>
        <div style="background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border:1px solid #10b981;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
          <p style="color:#065f46;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Verification Status</p>
          <p style="color:#059669;font-size:24px;font-weight:700;margin:0;">✓ Approved</p>
        </div>
        <p style="color:#374151;font-size:15px;line-height:1.6;">You can now submit vault deposit requests through your dashboard. All deposits are fully insured and stored in our LBMA-compliant high-security vaults.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://www.aegiscargo.org/my-vault" style="display:inline-block;background:#D4A853;color:#0A1628;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:14px;">Go to My Vault</a>
        </div>`
      );
    }

    revalidatePath("/dashboard/shipments");
    revalidatePath("/my-vault");
    return { success: true };
  } catch (error) {
    console.error("adminApproveKYC error:", error);
    return { error: "Failed to approve KYC" };
  }
}

// ─── ADMIN: REJECT KYC ──────────────────────────────────────

export async function adminRejectKYC(kycId: string, reason: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

  try {
    const kyc = await prisma.vaultKYC.update({
      where: { id: kycId },
      data: {
        status: "REJECTED",
        rejectionReason: reason,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
      include: { client: true },
    });

    // Email client
    if (kyc.client?.email) {
      await sendVaultEmail(
        kyc.client.email,
        kyc.client.name,
        "KYC Verification Update — Aegis Cargo Vault",
        `<p style="color:#374151;font-size:15px;line-height:1.6;">We were unable to verify your identity with the documents provided.</p>
        <div style="background:#fef2f2;border:1px solid #ef4444;border-radius:12px;padding:24px;margin:24px 0;">
          <p style="color:#991b1b;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Reason</p>
          <p style="color:#dc2626;font-size:15px;font-weight:500;margin:0;">${reason}</p>
        </div>
        <p style="color:#374151;font-size:15px;line-height:1.6;">Please review the reason above and resubmit your KYC application with the corrected documents.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://www.aegiscargo.org/my-vault/kyc" style="display:inline-block;background:#D4A853;color:#0A1628;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:14px;">Resubmit KYC</a>
        </div>`
      );
    }

    revalidatePath("/dashboard/shipments");
    revalidatePath("/my-vault");
    return { success: true };
  } catch (error) {
    console.error("adminRejectKYC error:", error);
    return { error: "Failed to reject KYC" };
  }
}

// ─── ADMIN: FLAG AML CHECK ───────────────────────────────────

export async function adminFlagAML(
  kycId: string,
  checkType: "sanctionsCheck" | "pepCheck" | "adverseMediaCheck",
  result: "CLEAR" | "FLAGGED" | "FAILED",
  notes?: string
) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

  try {
    await prisma.vaultKYC.update({
      where: { id: kycId },
      data: {
        [checkType]: result,
        amlNotes: notes,
        status: "UNDER_REVIEW",
      },
    });

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update AML check" };
  }
}
