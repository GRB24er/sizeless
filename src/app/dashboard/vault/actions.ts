"use server";

import { prisma } from "@/constants/config/db";
import { auth } from "~/auth";
import { revalidatePath } from "next/cache";
import transporter from "@/lib/verify-mail";

const FROM_EMAIL = "AramexLogistics Vault <admin@aramexlogistics.org>";

function generateDepositNumber(): string {
  return "VLT-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ═══════════════════════════════════════════
// GET ALL CLIENTS (for dropdown)
// ═══════════════════════════════════════════
export async function getClientsForVault() {
  const session = await auth();
  if (!session?.user) return [];
  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (admin?.role !== "ADMIN") return [];

  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, phone: true },
  });
}

// ═══════════════════════════════════════════
// ADMIN CREATE VAULT DEPOSIT
// ═══════════════════════════════════════════
export async function adminCreateVaultDeposit(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };
  const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (admin?.role !== "ADMIN") return { success: false, message: "Admin only" };

  const clientId = formData.get("clientId") as string;
  const assetType = formData.get("assetType") as string;
  const description = formData.get("description") as string;
  const weightGrams = parseFloat(formData.get("weightGrams") as string);
  const purity = formData.get("purity") as string;
  const quantity = parseInt(formData.get("quantity") as string) || 1;
  const declaredValue = parseFloat(formData.get("declaredValue") as string);
  const serialNumbers = formData.get("serialNumbers") as string;
  const vaultLocation = (formData.get("vaultLocation") as string) || "Ipswich Main Vault";
  const storageUnit = formData.get("storageUnit") as string;
  const insuredValue = formData.get("insuredValue") ? parseFloat(formData.get("insuredValue") as string) : null;
  const monthlyFee = formData.get("monthlyFee") ? parseFloat(formData.get("monthlyFee") as string) : null;
  const status = (formData.get("status") as string) || "IN_STORAGE";

  if (!clientId || !assetType || !description || !weightGrams || !declaredValue) {
    return { success: false, message: "Client, asset type, description, weight, and value are required" };
  }

  const client = await prisma.user.findUnique({ where: { id: clientId } });
  if (!client) return { success: false, message: "Client not found" };

  const depositNumber = generateDepositNumber();

  const deposit = await prisma.vaultDeposit.create({
    data: {
      depositNumber,
      assetType,
      description,
      weightGrams,
      purity: purity || null,
      quantity,
      declaredValue,
      serialNumbers: serialNumbers || null,
      vaultLocation,
      storageUnit: storageUnit || null,
      insuredValue,
      monthlyFee,
      status: status as any,
      verifiedAt: ["VERIFIED", "IN_STORAGE"].includes(status) ? new Date() : null,
      client: { connect: { id: clientId } },
      activities: {
        create: {
          action: "DEPOSITED",
          description: `Vault deposit created by admin for ${quantity}x ${assetType} (${weightGrams}g) — Value: $${declaredValue.toLocaleString()}`,
          performedBy: admin.name,
        },
      },
    },
  });

  // If marked as verified or in_storage, add activity
  if (status === "VERIFIED" || status === "IN_STORAGE") {
    await prisma.vaultActivity.create({
      data: {
        depositId: deposit.id,
        action: status,
        description: `Asset verified and ${status === "IN_STORAGE" ? "placed in storage" : "marked verified"} by admin`,
        performedBy: admin.name,
      },
    });
  }

  // Send email to client
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: client.email,
      subject: `Vault Deposit Confirmation — ${depositNumber} | AramexLogistics`,
      html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:linear-gradient(135deg,#0A1628 0%,#0D1F35 100%);padding:32px;text-align:center;">
          <h1 style="color:#D4A853;font-size:22px;margin:0;font-weight:600;">Vault Services</h1>
          <p style="color:#9ca3af;font-size:12px;margin:8px 0 0 0;">AramexLogistics Secure Vault</p>
        </div>
        <div style="background:#D4A853;height:3px;"></div>
        <div style="padding:32px;">
          <p style="color:#374151;font-size:15px;line-height:1.6;">Dear <strong>${client.name}</strong>,</p>
          <p style="color:#374151;font-size:15px;line-height:1.6;">Your vault deposit has been created and processed. Below are the details:</p>
          
          <div style="background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%);border:1px solid #D4A853;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
            <p style="color:#92400e;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Deposit Number</p>
            <p style="color:#D4A853;font-size:28px;font-weight:700;margin:0;letter-spacing:2px;">${depositNumber}</p>
          </div>
          
          <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:24px 0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Asset Type</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${assetType}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Quantity</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${quantity}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Weight</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${weightGrams}g</td></tr>
              ${purity ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Purity</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${purity}</td></tr>` : ""}
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Declared Value</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">$${declaredValue.toLocaleString()}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Vault Location</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${vaultLocation}</td></tr>
              ${storageUnit ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Storage Unit</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${storageUnit}</td></tr>` : ""}
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Status</td><td style="padding:8px 0;color:#059669;font-size:14px;font-weight:600;text-align:right;">${status.replace(/_/g, " ")}</td></tr>
            </table>
          </div>
          
          <p style="color:#6b7280;font-size:13px;line-height:1.6;">Your assets are secured in our LBMA-approved vault facility. You can view your vault dashboard at any time by logging in to your account.</p>
          
          <div style="text-align:center;margin:24px 0;">
            <a href="https://www.aramexlogistics.org/login" style="display:inline-block;background:#D4A853;color:#0A1628;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:14px;">View Vault Dashboard</a>
          </div>
        </div>
        <div style="background:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} AramexLogistics Ltd. | Vault Services | admin@aramexlogistics.org</p>
        </div>
      </div>`,
    });
  } catch (err) {
    console.error("Vault email failed:", err);
  }

  revalidatePath("/dashboard/vault");
  revalidatePath("/my-vault");

  return {
    success: true,
    message: `Vault deposit ${depositNumber} created for ${client.name}`,
    depositNumber,
  };
}
