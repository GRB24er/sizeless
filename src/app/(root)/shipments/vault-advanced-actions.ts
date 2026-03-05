"use server";

// ═══════════════════════════════════════════════════════════════
// src/app/(root)/shipments/vault-advanced-actions.ts
// Vault Advanced Features — Transfers, Partial Withdrawals, Beneficiaries
// ═══════════════════════════════════════════════════════════════

import { revalidatePath } from "next/cache";
import { prisma } from "@/constants/config/db";

// ─── HELPERS ─────────────────────────────────────────────────

function generateTransferNumber(): string {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `VTR-${y}${m}-${rand}`;
}

// ═══════════════════════════════════════════════════════════════
// VAULT-TO-VAULT TRANSFERS
// ═══════════════════════════════════════════════════════════════

export async function initiateVaultTransfer(
  depositId: string,
  adminId: string,
  data: {
    destinationVault: string;
    destinationUnit?: string;
    destinationCustodian?: string;
    destinationContact?: string;
    transferType: string; // FULL or PARTIAL
    weightTransferred: number;
    itemsTransferred?: string;
    estimatedArrival?: string;
    transitInsuredValue?: number;
    transitInsurer?: string;
    transferFee?: number;
    notes?: string;
  }
) {
  try {
    const deposit = await prisma.vaultDeposit.findUnique({
      where: { id: depositId },
    });
    if (!deposit) return { error: "Deposit not found" };
    if (deposit.status !== "IN_STORAGE") {
      return { error: "Deposit must be in storage to initiate transfer" };
    }

    const transfer = await (prisma as any).vaultTransfer.create({
      data: {
        depositId,
        transferNumber: generateTransferNumber(),
        sourceVault: deposit.vaultLocation,
        sourceUnit: deposit.storageUnit,
        destinationVault: data.destinationVault,
        destinationUnit: data.destinationUnit,
        destinationCustodian: data.destinationCustodian,
        destinationContact: data.destinationContact,
        transferType: data.transferType,
        weightTransferred: data.weightTransferred,
        itemsTransferred: data.itemsTransferred,
        estimatedArrival: data.estimatedArrival ? new Date(data.estimatedArrival) : null,
        transitInsuredValue: data.transitInsuredValue,
        transitInsurer: data.transitInsurer || "Lloyd's of London",
        transferFee: data.transferFee || 250,
        initiatedBy: adminId,
        notes: data.notes,
        status: "INITIATED" as any,
      },
    });

    await prisma.vaultDeposit.update({
      where: { id: depositId },
      data: { status: "RELEASE_REQUESTED" as any },
    });

    await (prisma as any).vaultActivity.create({
      data: {
        depositId,
        action: "STATUS_CHANGED" as any,
        description: `Vault transfer initiated to ${data.destinationVault}. Transfer: ${transfer.transferNumber}. Type: ${data.transferType}. Weight: ${data.weightTransferred}g`,
        performedBy: adminId,
        metadata: JSON.stringify({ transferId: transfer.id, transferNumber: transfer.transferNumber }),
      },
    });

    revalidatePath("/dashboard/shipments");
    return { success: true, transferId: transfer.id, transferNumber: transfer.transferNumber };
  } catch (error) {
    console.error("initiateVaultTransfer error:", error);
    return { error: "Failed to initiate transfer" };
  }
}

export async function updateTransferStatus(
  transferId: string,
  adminId: string,
  newStatus: string,
  data?: {
    sealNumbers?: string;
    securityEscortRef?: string;
    actualArrival?: string;
    destinationUnit?: string;
    cancellationReason?: string;
    notes?: string;
  }
) {
  try {
    const updateData: Record<string, unknown> = {
      status: newStatus as any,
    };

    if (newStatus === "APPROVED") {
      updateData.approvedBy = adminId;
      updateData.approvedAt = new Date();
    }
    if (newStatus === "IN_TRANSIT") {
      if (data?.sealNumbers) updateData.sealNumbers = data.sealNumbers;
      if (data?.securityEscortRef) updateData.securityEscortRef = data.securityEscortRef;
    }
    if (newStatus === "RECEIVED") {
      updateData.actualArrival = data?.actualArrival ? new Date(data.actualArrival) : new Date();
      if (data?.destinationUnit) updateData.destinationUnit = data.destinationUnit;
    }
    if (newStatus === "COMPLETED") {
      updateData.completedBy = adminId;
      updateData.completedAt = new Date();
    }
    if (newStatus === "CANCELLED") {
      updateData.cancellationReason = data?.cancellationReason || "Cancelled by admin";
    }
    if (data?.notes) updateData.notes = data.notes;

    const transfer = await (prisma as any).vaultTransfer.update({
      where: { id: transferId },
      data: updateData,
      include: { deposit: true },
    });

    // Update deposit on completion
    if (newStatus === "COMPLETED") {
      if (transfer.transferType === "FULL") {
        await prisma.vaultDeposit.update({
          where: { id: transfer.depositId },
          data: {
            status: "RELEASED" as any,
            vaultLocation: transfer.destinationVault,
            storageUnit: transfer.destinationUnit || null,
            releasedAt: new Date(),
            releaseReason: `Transferred to ${transfer.destinationVault}. Transfer: ${transfer.transferNumber}`,
          },
        });
      } else {
        // Partial transfer — update weight
        const remaining = transfer.deposit.weightGrams - transfer.weightTransferred;
        await prisma.vaultDeposit.update({
          where: { id: transfer.depositId },
          data: {
            status: "IN_STORAGE" as any,
            weightGrams: remaining,
            declaredValue: (remaining / transfer.deposit.weightGrams) * transfer.deposit.declaredValue,
          },
        });
      }
    }

    if (newStatus === "CANCELLED") {
      await prisma.vaultDeposit.update({
        where: { id: transfer.depositId },
        data: { status: "IN_STORAGE" as any },
      });
    }

    await (prisma as any).vaultActivity.create({
      data: {
        depositId: transfer.depositId,
        action: "STATUS_CHANGED" as any,
        description: `Transfer ${transfer.transferNumber} status: ${newStatus}${data?.notes ? `. ${data.notes}` : ""}`,
        performedBy: adminId,
      },
    });

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    console.error("updateTransferStatus error:", error);
    return { error: "Failed to update transfer" };
  }
}

export async function getVaultTransfers(depositId?: string) {
  try {
    const where: any = {};
    if (depositId) where.depositId = depositId;

    const transfers = await (prisma as any).vaultTransfer.findMany({
      where,
      include: {
        deposit: { select: { depositNumber: true, custodyReferenceId: true, assetType: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { transfers };
  } catch (error) {
    console.error("getVaultTransfers error:", error);
    return { transfers: [] };
  }
}

// ═══════════════════════════════════════════════════════════════
// PARTIAL WITHDRAWALS
// ═══════════════════════════════════════════════════════════════

export async function createPartialWithdrawal(
  depositId: string,
  requestedBy: string,
  data: {
    type: string;
    partialWeight: number;
    notes?: string;
    collectionMethod?: string;
    bullionDealerName?: string;
    bankAccountRef?: string;
  }
) {
  try {
    const deposit = await prisma.vaultDeposit.findUnique({
      where: { id: depositId },
    });
    if (!deposit) return { error: "Deposit not found" };
    if (deposit.status !== "IN_STORAGE") {
      return { error: "Deposit must be in storage" };
    }
    if (data.partialWeight >= deposit.weightGrams) {
      return { error: "Partial weight must be less than total weight. Use full withdrawal instead." };
    }
    if (data.partialWeight <= 0) {
      return { error: "Weight must be greater than 0" };
    }

    const partialValue = (data.partialWeight / deposit.weightGrams) * deposit.declaredValue;
    const remainingWeight = deposit.weightGrams - data.partialWeight;

    const withdrawal = await prisma.vaultWithdrawal.create({
      data: {
        depositId,
        type: data.type as any,
        status: "REQUESTED" as any,
        requestedBy,
        requestNotes: `PARTIAL: ${data.partialWeight}g of ${deposit.weightGrams}g. ${data.notes || ""}`.trim(),
        collectionMethod: data.collectionMethod as any,
        bullionDealerName: data.bullionDealerName,
        bankAccountRef: data.bankAccountRef,
        // Partial fields (cast through any for new fields)
        ...(({ partialWeight: data.partialWeight, partialValue, remainingWeight }) as any),
      } as any,
    });

    await (prisma as any).vaultActivity.create({
      data: {
        depositId,
        action: "WITHDRAWAL_REQUESTED" as any,
        description: `Partial ${data.type.toLowerCase()} requested: ${data.partialWeight}g of ${deposit.weightGrams}g ($${partialValue.toFixed(2)} of $${deposit.declaredValue.toLocaleString()})`,
        performedBy: requestedBy,
        metadata: JSON.stringify({ withdrawalId: withdrawal.id, partialWeight: data.partialWeight, remainingWeight }),
      },
    });

    revalidatePath("/dashboard/shipments");
    return { success: true, withdrawalId: withdrawal.id };
  } catch (error) {
    console.error("createPartialWithdrawal error:", error);
    return { error: "Failed to create partial withdrawal" };
  }
}

export async function completePartialWithdrawal(
  withdrawalId: string,
  adminId: string,
  data?: {
    spotPriceAtSale?: number;
    saleSpread?: number;
    saleAmount?: number;
    wireTransferRef?: string;
  }
) {
  try {
    const withdrawal = await prisma.vaultWithdrawal.findUnique({
      where: { id: withdrawalId },
    }) as any;
    if (!withdrawal) return { error: "Withdrawal not found" };

    const deposit = await prisma.vaultDeposit.findUnique({
      where: { id: withdrawal.depositId },
    });
    if (!deposit) return { error: "Deposit not found" };

    // Update withdrawal
    const updateData: Record<string, unknown> = {
      status: "COMPLETED" as any,
      completedAt: new Date(),
    };
    if (data) {
      updateData.spotPriceAtSale = data.spotPriceAtSale;
      updateData.saleSpread = data.saleSpread;
      updateData.saleAmount = data.saleAmount;
      updateData.wireTransferRef = data.wireTransferRef;
      updateData.fundsTransferredAt = data.wireTransferRef ? new Date() : null;
    }

    await prisma.vaultWithdrawal.update({
      where: { id: withdrawalId },
      data: updateData as any,
    });

    // Reduce deposit weight & value — deposit stays IN_STORAGE
    const partialWeight = withdrawal.partialWeight || 0;
    if (partialWeight > 0) {
      const newWeight = Math.max(deposit.weightGrams - partialWeight, 0);
      const newValue = deposit.weightGrams > 0
        ? (newWeight / deposit.weightGrams) * deposit.declaredValue
        : 0;

      await prisma.vaultDeposit.update({
        where: { id: deposit.id },
        data: {
          weightGrams: newWeight,
          declaredValue: Math.round(newValue * 100) / 100,
          // Recalculate insured value proportionally
          insuredValue: deposit.insuredValue
            ? Math.round(((newWeight / deposit.weightGrams) * deposit.insuredValue) * 100) / 100
            : null,
        },
      });
    }

    await (prisma as any).vaultActivity.create({
      data: {
        depositId: deposit.id,
        action: "WITHDRAWAL_COMPLETED" as any,
        description: `Partial withdrawal completed: ${partialWeight}g released. Remaining: ${(deposit.weightGrams - partialWeight).toFixed(2)}g`,
        performedBy: adminId,
      },
    });

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    console.error("completePartialWithdrawal error:", error);
    return { error: "Failed to complete partial withdrawal" };
  }
}

// ═══════════════════════════════════════════════════════════════
// BENEFICIARY MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export async function addBeneficiary(
  depositId: string,
  adminId: string,
  data: {
    name: string;
    relationship: string;
    email?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    idType?: string;
    idNumber?: string;
    idExpiryDate?: string;
    allocationPercent: number;
    powerOfAttorney?: boolean;
    authorizedActions?: string[];
    notes?: string;
  }
) {
  try {
    const deposit = await prisma.vaultDeposit.findUnique({
      where: { id: depositId },
    });
    if (!deposit) return { error: "Deposit not found" };

    // Check total allocation
    const existing = await (prisma as any).vaultBeneficiary.findMany({
      where: { depositId, status: { in: ["PENDING", "VERIFIED"] } },
    });
    const currentAllocation = existing.reduce((s: number, b: any) => s + b.allocationPercent, 0);
    if (currentAllocation + data.allocationPercent > 100) {
      return { error: `Total allocation would exceed 100%. Currently allocated: ${currentAllocation}%. Available: ${100 - currentAllocation}%` };
    }

    const beneficiary = await (prisma as any).vaultBeneficiary.create({
      data: {
        depositId,
        name: data.name,
        relationship: data.relationship,
        email: data.email,
        phone: data.phone,
        address: data.address,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        idType: data.idType,
        idNumber: data.idNumber,
        idExpiryDate: data.idExpiryDate ? new Date(data.idExpiryDate) : null,
        allocationPercent: data.allocationPercent,
        powerOfAttorney: data.powerOfAttorney || false,
        authorizedActions: data.authorizedActions ? JSON.stringify(data.authorizedActions) : null,
        notes: data.notes,
        status: "PENDING" as any,
      },
    });

    await (prisma as any).vaultActivity.create({
      data: {
        depositId,
        action: "STATUS_CHANGED" as any,
        description: `Beneficiary added: ${data.name} (${data.relationship}) — ${data.allocationPercent}% allocation`,
        performedBy: adminId,
      },
    });

    revalidatePath("/dashboard/shipments");
    return { success: true, beneficiaryId: beneficiary.id };
  } catch (error) {
    console.error("addBeneficiary error:", error);
    return { error: "Failed to add beneficiary" };
  }
}

export async function verifyBeneficiary(
  beneficiaryId: string,
  adminId: string,
  approved: boolean,
  reason?: string
) {
  try {
    await (prisma as any).vaultBeneficiary.update({
      where: { id: beneficiaryId },
      data: {
        status: approved ? "VERIFIED" : "REJECTED",
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason: approved ? null : reason,
      },
    });

    const ben = await (prisma as any).vaultBeneficiary.findUnique({
      where: { id: beneficiaryId },
    });

    await (prisma as any).vaultActivity.create({
      data: {
        depositId: ben.depositId,
        action: "STATUS_CHANGED" as any,
        description: `Beneficiary ${ben.name} ${approved ? "verified" : "rejected"}${reason ? `: ${reason}` : ""}`,
        performedBy: adminId,
      },
    });

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    console.error("verifyBeneficiary error:", error);
    return { error: "Failed to verify beneficiary" };
  }
}

export async function revokeBeneficiary(beneficiaryId: string, adminId: string) {
  try {
    const ben = await (prisma as any).vaultBeneficiary.update({
      where: { id: beneficiaryId },
      data: { status: "REVOKED" },
    });

    await (prisma as any).vaultActivity.create({
      data: {
        depositId: ben.depositId,
        action: "STATUS_CHANGED" as any,
        description: `Beneficiary ${ben.name} access revoked`,
        performedBy: adminId,
      },
    });

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    console.error("revokeBeneficiary error:", error);
    return { error: "Failed to revoke beneficiary" };
  }
}

export async function removeBeneficiary(beneficiaryId: string, adminId: string) {
  try {
    const ben = await (prisma as any).vaultBeneficiary.findUnique({
      where: { id: beneficiaryId },
    });
    if (!ben) return { error: "Beneficiary not found" };

    await (prisma as any).vaultBeneficiary.delete({
      where: { id: beneficiaryId },
    });

    await (prisma as any).vaultActivity.create({
      data: {
        depositId: ben.depositId,
        action: "STATUS_CHANGED" as any,
        description: `Beneficiary ${ben.name} removed`,
        performedBy: adminId,
      },
    });

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    console.error("removeBeneficiary error:", error);
    return { error: "Failed to remove beneficiary" };
  }
}

export async function getBeneficiaries(depositId: string) {
  try {
    const beneficiaries = await (prisma as any).vaultBeneficiary.findMany({
      where: { depositId },
      orderBy: { createdAt: "desc" },
    });
    return { beneficiaries };
  } catch (error) {
    console.error("getBeneficiaries error:", error);
    return { beneficiaries: [] };
  }
}
