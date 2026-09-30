"use server";

// ═══════════════════════════════════════════════════════════════
// src/app/(root)/shipments/vault-edit-actions.ts
// Edit Vault Deposit & Delete Vault Client
// ═══════════════════════════════════════════════════════════════

import { revalidatePath } from "next/cache";
import { prisma } from "@/constants/config/db";
import { requireAdmin } from "@/lib/auth-guards";

// All actions in this file are admin-only. Where an action takes an adminId,
// it is replaced with the signed-in admin's id rather than trusted from the caller.

// ─── EDIT VAULT DEPOSIT ──────────────────────────────────────

export async function editVaultDeposit(
  depositId: string,
  adminId: string,
  data: {
    description?: string;
    assetType?: string;
    weightGrams?: number;
    purity?: string;
    fineness?: number;
    quantity?: number;
    serialNumbers?: string;
    refinerName?: string;
    refinerStamp?: string;
    isLBMACertified?: boolean;
    declaredValue?: number;
    spotPriceAtDeposit?: number;
    vaultLocation?: string;
    storageUnit?: string;
    shelfPosition?: string;
    insuredValue?: number;
    insuranceProvider?: string;
    insurancePolicyNo?: string;
    insuranceCoverage?: string;
    monthlyStorageFee?: number;
    sourceOfFunds?: string;
    sourceOfFundsDetail?: string;
    sourceOfWealth?: string;
    cashCurrency?: string;
    cashAmount?: number;
    jewelryValuation?: number;
    documentTitle?: string;
    documentIssuingAuth?: string;
    documentSerial?: string;
    authorizedPersons?: string;
    withdrawalAuthMethod?: string;
    complianceNotes?: string;
    // Milestone dates (yyyy-mm-dd strings). "" or null clears an optional date;
    // depositDate is required, so a blank value leaves it unchanged.
    depositDate?: string;
    appointmentDate?: string | null;
    kycApprovedAt?: string | null;
    intakeCompletedAt?: string | null;
    assayCompletedAt?: string | null;
    verifiedAt?: string | null;
    storedAt?: string | null;
    storageStartDate?: string | null;
    releaseRequestedAt?: string | null;
    releaseApprovedAt?: string | null;
    releasedAt?: string | null;
  }
) {
  adminId = (await requireAdmin()).id;
  try {
    const deposit = await prisma.vaultDeposit.findUnique({
      where: { id: depositId },
    });
    if (!deposit) return { error: "Deposit not found" };

    // Build update — only include fields that were provided
    const updateData: Record<string, unknown> = {};
    const changes: string[] = [];

    if (data.description !== undefined && data.description !== deposit.description) {
      updateData.description = data.description;
      changes.push("description");
    }
    if (data.assetType !== undefined && data.assetType !== deposit.assetType) {
      updateData.assetType = data.assetType as any;
      changes.push(`asset type → ${data.assetType}`);
    }
    if (data.weightGrams !== undefined && data.weightGrams !== deposit.weightGrams) {
      updateData.weightGrams = data.weightGrams;
      changes.push(`weight ${deposit.weightGrams}g → ${data.weightGrams}g`);
    }
    if (data.purity !== undefined) updateData.purity = data.purity;
    if (data.fineness !== undefined) updateData.fineness = data.fineness;
    if (data.quantity !== undefined && data.quantity !== deposit.quantity) {
      updateData.quantity = data.quantity;
      changes.push(`quantity → ${data.quantity}`);
    }
    if (data.serialNumbers !== undefined) updateData.serialNumbers = data.serialNumbers;
    if (data.refinerName !== undefined) updateData.refinerName = data.refinerName;
    if (data.refinerStamp !== undefined) updateData.refinerStamp = data.refinerStamp;
    if (data.isLBMACertified !== undefined) updateData.isLBMACertified = data.isLBMACertified;
    if (data.declaredValue !== undefined && data.declaredValue !== deposit.declaredValue) {
      updateData.declaredValue = data.declaredValue;
      changes.push(`value $${deposit.declaredValue.toLocaleString()} → $${data.declaredValue.toLocaleString()}`);
    }
    if (data.spotPriceAtDeposit !== undefined) updateData.spotPriceAtDeposit = data.spotPriceAtDeposit;
    if (data.vaultLocation !== undefined) updateData.vaultLocation = data.vaultLocation;
    if (data.storageUnit !== undefined) updateData.storageUnit = data.storageUnit;
    if (data.shelfPosition !== undefined) updateData.shelfPosition = data.shelfPosition;
    if (data.insuredValue !== undefined) updateData.insuredValue = data.insuredValue;
    if (data.insuranceProvider !== undefined) updateData.insuranceProvider = data.insuranceProvider;
    if (data.insurancePolicyNo !== undefined) updateData.insurancePolicyNo = data.insurancePolicyNo;
    if (data.insuranceCoverage !== undefined) updateData.insuranceCoverage = data.insuranceCoverage;
    if (data.monthlyStorageFee !== undefined) updateData.monthlyStorageFee = data.monthlyStorageFee;
    if (data.sourceOfFunds !== undefined) updateData.sourceOfFunds = data.sourceOfFunds;
    if (data.sourceOfFundsDetail !== undefined) updateData.sourceOfFundsDetail = data.sourceOfFundsDetail;
    if (data.sourceOfWealth !== undefined) updateData.sourceOfWealth = data.sourceOfWealth;
    if (data.cashCurrency !== undefined) updateData.cashCurrency = data.cashCurrency;
    if (data.cashAmount !== undefined) updateData.cashAmount = data.cashAmount;
    if (data.jewelryValuation !== undefined) updateData.jewelryValuation = data.jewelryValuation;
    if (data.documentTitle !== undefined) updateData.documentTitle = data.documentTitle;
    if (data.documentIssuingAuth !== undefined) updateData.documentIssuingAuth = data.documentIssuingAuth;
    if (data.documentSerial !== undefined) updateData.documentSerial = data.documentSerial;
    if (data.authorizedPersons !== undefined) updateData.authorizedPersons = data.authorizedPersons;
    if (data.withdrawalAuthMethod !== undefined) updateData.withdrawalAuthMethod = data.withdrawalAuthMethod;
    if (data.complianceNotes !== undefined) updateData.complianceNotes = data.complianceNotes;

    // Milestone dates the admin can correct.
    const DATE_FIELDS: { key: string; label: string; nullable: boolean }[] = [
      { key: "depositDate", label: "deposit date", nullable: false },
      { key: "appointmentDate", label: "appointment", nullable: true },
      { key: "kycApprovedAt", label: "identity checks approved", nullable: true },
      { key: "intakeCompletedAt", label: "metal received", nullable: true },
      { key: "assayCompletedAt", label: "testing completed", nullable: true },
      { key: "verifiedAt", label: "verified", nullable: true },
      { key: "storedAt", label: "placed in storage", nullable: true },
      { key: "storageStartDate", label: "storage start", nullable: true },
      { key: "releaseRequestedAt", label: "release requested", nullable: true },
      { key: "releaseApprovedAt", label: "release approved", nullable: true },
      { key: "releasedAt", label: "released", nullable: true },
    ];
    const asRecord = data as Record<string, string | null | undefined>;
    for (const { key, label, nullable } of DATE_FIELDS) {
      const raw = asRecord[key];
      if (raw === undefined) continue;
      if (raw === "" || raw === null) {
        if (nullable) {
          updateData[key] = null;
          changes.push(`${label} cleared`);
        }
        continue;
      }
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) continue;
      updateData[key] = parsed;
      changes.push(`${label} set to ${parsed.toISOString().slice(0, 10)}`);
    }

    if (Object.keys(updateData).length === 0) {
      return { error: "No changes detected" };
    }

    await prisma.vaultDeposit.update({
      where: { id: depositId },
      data: updateData as any,
    });

    // Log activity
    await (prisma as any).vaultActivity.create({
      data: {
        depositId,
        action: "STATUS_CHANGED" as any,
        description: `Deposit details edited: ${changes.length > 0 ? changes.join(", ") : "fields updated"}`,
        performedBy: adminId,
      },
    });

    revalidatePath("/dashboard/vault");
    revalidatePath("/dashboard/shipments");
    revalidatePath("/my-vault");
    return { success: true };
  } catch (error: any) {
    console.error("editVaultDeposit error:", error);
    return { error: error.message || "Failed to edit deposit" };
  }
}

// ─── DELETE VAULT CLIENT (User + All Deposits) ──────────────

export async function deleteVaultClient(userId: string, adminId: string) {
  adminId = (await requireAdmin()).id;
  try {
    if (userId === adminId) return { error: "Cannot delete your own account" };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { vaultDeposits: true } } },
    });
    if (!user) return { error: "User not found" };

    // Cascade delete handles deposits, activities, withdrawals, etc.
    await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/dashboard/vault");
    revalidatePath("/dashboard/users");
    return { success: true, name: user.name, depositCount: user._count.vaultDeposits };
  } catch (error: any) {
    console.error("deleteVaultClient error:", error);
    return { error: error.message || "Failed to delete client" };
  }
}
