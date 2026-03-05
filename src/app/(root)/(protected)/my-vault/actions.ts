"use server";

import { prisma } from "@/constants/config/db";
import { auth } from "~/auth";
import { revalidatePath } from "next/cache";
import transporter from "@/lib/verify-mail";

const FROM_EMAIL = "AramexLogistics Vault <admin@aramexlogistics.org>";

function generateDepositNumber(): string {
  return "VLT-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function sendVaultEmail(email: string, name: string, subject: string, bodyHtml: string) {
  try {
    await transporter.sendMail({
      from: FROM_EMAIL, to: email, subject,
      html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:linear-gradient(135deg,#0A1628 0%,#0D1F35 100%);padding:32px;text-align:center;">
          <img src="https://www.aramexlogistics.org/images/logo.png" alt="AramexLogistics" style="height:48px;margin-bottom:16px;" />
          <h1 style="color:#D4A853;font-size:22px;margin:0;font-weight:600;">Vault Services</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#374151;font-size:15px;line-height:1.6;">Dear <strong>${name}</strong>,</p>
          ${bodyHtml}
        </div>
        <div style="background:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} AramexLogistics Vault Services | admin@aramexlogistics.org</p>
        </div>
      </div>`,
    });
  } catch (error) { console.error("Vault email failed:", error); }
}

export async function getUserVaultDeposits() {
  const session = await auth();
  if (!session?.user?.id) return [];
  return prisma.vaultDeposit.findMany({
    where: { clientId: session.user.id },
    include: { activities: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" },
  });
}

export async function requestVaultDeposit(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const assetType = formData.get("assetType") as string;
  const description = formData.get("description") as string;
  const weightGrams = parseFloat(formData.get("weightGrams") as string);
  const purity = formData.get("purity") as string;
  const quantity = parseInt(formData.get("quantity") as string) || 1;
  const declaredValue = parseFloat(formData.get("declaredValue") as string);
  const serialNumbers = formData.get("serialNumbers") as string;

  if (!assetType || !description || !weightGrams || !declaredValue) {
    return { error: "Please fill in all required fields." };
  }

  const depositNumber = generateDepositNumber();

  const deposit = await prisma.vaultDeposit.create({
    data: {
      depositNumber, assetType: assetType as any, description, weightGrams, purity,
      quantity, declaredValue, serialNumbers: serialNumbers || null,
      client: { connect: { id: session.user.id } },
      activities: {
        create: { action: "PLACED_IN_STORAGE" as any, description: `Deposit request submitted for ${quantity}x ${assetType} (${weightGrams}g)`, performedBy: session.user.name },
      },
    },
  });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.email) {
    await sendVaultEmail(user.email, user.name, `Vault Deposit Request — ${depositNumber} | AramexLogistics`,
      `<p style="color:#374151;font-size:15px;line-height:1.6;">Your vault deposit request has been submitted and is pending verification.</p>
      <div style="background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);border:1px solid #D4A853;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
        <p style="color:#92400e;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Deposit Number</p>
        <p style="color:#D4A853;font-size:24px;font-weight:700;margin:0;">${depositNumber}</p>
      </div>
      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Asset</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${quantity}x ${assetType}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Weight</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${weightGrams}g</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Declared Value</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">$${declaredValue.toLocaleString()}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Status</td><td style="padding:8px 0;color:#D4A853;font-size:14px;font-weight:600;text-align:right;">Pending Verification</td></tr>
        </table>
      </div>
      <p style="color:#6b7280;font-size:13px;">Our team will verify and process your deposit within 1-2 business days.</p>`
    );
  }

  revalidatePath("/vault");
  return { success: true, depositNumber };
}

export async function requestVaultRelease(depositId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const deposit = await prisma.vaultDeposit.findFirst({
    where: { id: depositId, clientId: session.user.id, status: "IN_STORAGE" },
  });
  if (!deposit) return { error: "Deposit not found or not eligible for release." };

  await prisma.vaultDeposit.update({
    where: { id: depositId },
    data: {
      status: "RELEASE_REQUESTED" as any,
      activities: {
        create: { action: "WITHDRAWAL_REQUESTED" as any, description: "Client requested release of stored assets", performedBy: session.user.name },
      },
    },
  });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.email) {
    await sendVaultEmail(user.email, user.name, `Release Request — ${deposit.depositNumber} | AramexLogistics`,
      `<p style="color:#374151;font-size:15px;line-height:1.6;">Your release request for deposit <strong>${deposit.depositNumber}</strong> has been submitted. Our team will process this within 48 hours.</p>
      <div style="text-align:center;margin:24px 0;"><a href="https://www.aramexlogistics.org/vault" style="display:inline-block;background:#D4A853;color:#0A1628;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:14px;">View Vault Dashboard</a></div>`
    );
  }

  revalidatePath("/vault");
  return { success: true };
}

// ─── ADMIN ACTIONS ───

export async function getAllVaultDeposits() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return [];
  return prisma.vaultDeposit.findMany({
    include: { client: true, activities: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" },
  });
}

export async function adminUpdateVaultStatus(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };

  const depositId = formData.get("depositId") as string;
  const newStatus = formData.get("status") as string;
  const note = formData.get("note") as string;
  const storageUnit = formData.get("storageUnit") as string;
  const monthlyFee = formData.get("monthlyFee") ? parseFloat(formData.get("monthlyFee") as string) : undefined;
  const insuredValue = formData.get("insuredValue") ? parseFloat(formData.get("insuredValue") as string) : undefined;

  const deposit = await prisma.vaultDeposit.findUnique({ where: { id: depositId }, include: { client: true } });
  if (!deposit) return { error: "Deposit not found" };

  const updateData: Record<string, unknown> = { status: newStatus };
  if (newStatus === "VERIFIED") updateData.verifiedAt = new Date();
  if (newStatus === "RELEASED") { updateData.releasedAt = new Date(); updateData.releaseReason = note || "Client request"; }
  if (storageUnit) updateData.storageUnit = storageUnit;
  if (monthlyFee !== undefined) updateData.monthlyFee = monthlyFee;
  if (insuredValue !== undefined) updateData.insuredValue = insuredValue;

  await prisma.vaultDeposit.update({
    where: { id: depositId },
    data: {
      ...updateData,
      activities: {
        create: { action: newStatus as any, description: note || `Status updated to ${newStatus}`, performedBy: session.user.name || "Admin" },
      },
    },
  });

  const STATUS_LABELS: Record<string, string> = {
    PENDING_VERIFICATION: "Pending Verification", VERIFIED: "Verified", IN_STORAGE: "In Storage",
    RELEASE_REQUESTED: "Release Requested", RELEASE_APPROVED: "Release Approved", RELEASED: "Released", SUSPENDED: "Suspended",
  };

  if (deposit.client?.email) {
    await sendVaultEmail(deposit.client.email, deposit.client.name,
      `Vault Update — ${deposit.depositNumber} | AramexLogistics`,
      `<p style="color:#374151;font-size:15px;line-height:1.6;">There has been an update on your vault deposit:</p>
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;background:#D4A85315;color:#D4A853;border:1px solid #D4A85330;padding:10px 24px;border-radius:50px;font-weight:600;font-size:16px;">${STATUS_LABELS[newStatus] || newStatus}</span>
      </div>
      <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Deposit #</td><td style="padding:8px 0;color:#D4A853;font-size:14px;font-weight:600;text-align:right;">${deposit.depositNumber}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Asset</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${deposit.quantity}x ${deposit.assetType}</td></tr>
          ${note ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Note</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${note}</td></tr>` : ""}
        </table>
      </div>`
    );
  }

  revalidatePath("/dashboard/vault");
  return { success: true };
}
