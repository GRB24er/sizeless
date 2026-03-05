"use server";

// ═══════════════════════════════════════════════════════════════
// src/app/dashboard/shipments/vault-actions.ts
// Vault Custody Service — Server Actions
// ═══════════════════════════════════════════════════════════════

import {
  notifyKYCApproved, notifyKYCRejected, notifyIntakeScheduled, notifyIntakeComplete,
  notifyAssayComplete, notifyPlacedInStorage, notifyInsuranceActivated,
  notifyReleaseRequested, notifyReleaseApproved, notifyReleased, notifyDocumentsIssued,
} from "@/lib/vault/vault-emails";
import { revalidatePath } from "next/cache";
import { prisma } from "@/constants/config/db";
import {
  generateDepositNumber,
  generateCustodyReference,
} from "@/lib/vault/types";

// ─── HELPER: Log vault activity ──────────────────────────────

async function logVaultActivity(
  depositId: string,
  action: string,
  description: string,
  performedBy?: string,
  metadata?: Record<string, unknown>
) {
  await prisma.vaultActivity.create({
    data: {
      depositId,
      action: action as any,
      description,
      performedBy,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

// ─── CREATE VAULT DEPOSIT ────────────────────────────────────

export async function createVaultDeposit(formData: FormData) {
  try {
    const clientId = formData.get("clientId") as string;
    const assetType = formData.get("assetType") as string;
    const description = formData.get("description") as string;
    const weightGrams = parseFloat(formData.get("weightGrams") as string);
    const purity = formData.get("purity") as string;
    const quantity = parseInt(formData.get("quantity") as string) || 1;
    const serialNumbers = formData.get("serialNumbers") as string;
    const refinerName = formData.get("refinerName") as string;
    const declaredValue = parseFloat(formData.get("declaredValue") as string);
    const storageType = formData.get("storageType") as string || "ALLOCATED";
    const isLBMA = formData.get("isLBMACertified") === "true";
    const intakeMethod = formData.get("intakeMethod") as string || "CLIENT_DELIVERY";
    const appointmentDate = formData.get("appointmentDate") as string;

    if (!clientId || !assetType || !description || !weightGrams || !declaredValue) {
      return { error: "Missing required fields" };
    }

    const depositNumber = generateDepositNumber();
    const custodyRef = generateCustodyReference();

    const deposit = await prisma.vaultDeposit.create({
      data: {
        depositNumber,
        status: "KYC_REVIEW",
        clientId,
        assetType: assetType as any,
        description,
        weightGrams,
        purity,
        quantity,
        serialNumbers,
        refinerName,
        refinerStamp: formData.get("refinerStamp") as string,
        isLBMACertified: isLBMA,
        declaredValue,
        storageType: storageType as any,
        intakeMethod: intakeMethod as any,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
        custodyReferenceId: custodyRef,
      },
    });

    await logVaultActivity(
      deposit.id,
      "KYC_SUBMITTED",
      `Vault deposit ${depositNumber} created. KYC review initiated for client.`,
      "SYSTEM",
      { assetType, weightGrams, declaredValue, storageType }
    );

    revalidatePath("/dashboard/shipments");
    return { success: true, depositId: deposit.id, depositNumber };
  } catch (error) {
    console.error("createVaultDeposit error:", error);
    return { error: "Failed to create vault deposit" };
  }
}

// ─── UPDATE VAULT STATUS (Admin workflow) ────────────────────

export async function updateVaultStatus(
  depositId: string,
  newStatus: string,
  adminId: string,
  notes?: string
) {
  try {
    const deposit = await prisma.vaultDeposit.findUnique({
      where: { id: depositId },
    });
    if (!deposit) return { error: "Deposit not found" };

    const updateData: Record<string, unknown> = {
      status: newStatus as any,
    };

    // Set timestamps based on status transitions
    switch (newStatus) {
      case "KYC_APPROVED":
        updateData.kycApprovedAt = new Date();
        break;
      case "INTAKE_IN_PROGRESS":
        updateData.intakeCompletedAt = null;
        break;
      case "PENDING_VERIFICATION":
        updateData.intakeCompletedAt = new Date();
        break;
      case "ASSAY_IN_PROGRESS":
        updateData.assayStatus = "IN_PROGRESS";
        break;
      case "VERIFICATION_COMPLETE":
        updateData.verifiedAt = new Date();
        updateData.assayStatus = "PASSED";
        updateData.assayCompletedAt = new Date();
        break;
      case "DOCUMENTED":
        // Custody docs are issued
        break;
      case "IN_STORAGE":
        updateData.storedAt = new Date();
        updateData.storageStartDate = new Date();
        break;
      case "RELEASE_REQUESTED":
        updateData.releaseRequestedAt = new Date();
        break;
      case "RELEASE_APPROVED":
        updateData.releaseApprovedAt = new Date();
        break;
      case "RELEASED":
        updateData.releasedAt = new Date();
        updateData.releaseReason = notes || "Client withdrawal";
        break;
      case "SUSPENDED":
        break;
    }

    await prisma.vaultDeposit.update({
      where: { id: depositId },
      data: updateData as any,
    });

    await logVaultActivity(
      depositId,
      "STATUS_CHANGED",
      `Status changed from ${deposit.status} to ${newStatus}. ${notes || ""}`.trim(),
      adminId,
      { previousStatus: deposit.status, newStatus }
    );

    // Email notifications
    const dep = await prisma.vaultDeposit.findUnique({ where: { id: depositId }, include: { client: true } });
    if (dep?.client?.email) {
      const e = dep.client.email, n = dep.client.name || "Client", d = dep.depositNumber;
      switch (newStatus) {
        case "KYC_REJECTED": await notifyKYCRejected(e, n, d, notes); break;
        case "PENDING_VERIFICATION": await notifyIntakeComplete(e, n, d); break;
        case "DOCUMENTED": await notifyDocumentsIssued(e, n, d, dep.custodyReferenceId || d); break;
        case "RELEASE_REQUESTED": await notifyReleaseRequested(e, n, d); break;
        case "RELEASE_APPROVED": await notifyReleaseApproved(e, n, d); break;
        case "RELEASED": await notifyReleased(e, n, d); break;
      }
    }

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    console.error("updateVaultStatus error:", error);
    return { error: "Failed to update status" };
  }
}

// ─── APPROVE / REJECT KYC ────────────────────────────────────

export async function approveKYC(depositId: string, adminId: string) {
  const result = await updateVaultStatus(depositId, "KYC_APPROVED", adminId, "KYC approved - client cleared for vault deposit");
  // Email
  const dep = await prisma.vaultDeposit.findUnique({ where: { id: depositId }, include: { client: true } });
  if (dep?.client?.email) await notifyKYCApproved(dep.client.email, dep.client.name || "Client", dep.depositNumber);
  return result;
}

export async function rejectKYC(
  depositId: string,
  adminId: string,
  reason: string
) {
  try {
    await prisma.vaultDeposit.update({
      where: { id: depositId },
      data: { status: "KYC_REJECTED" as any },
    });

    await logVaultActivity(
      depositId,
      "KYC_REJECTED",
      `KYC rejected: ${reason}`,
      adminId
    );

    // Email
    const dep = await prisma.vaultDeposit.findUnique({ where: { id: depositId }, include: { client: true } });
    if (dep?.client?.email) await notifyKYCRejected(dep.client.email, dep.client.name || "Client", dep.depositNumber, reason);

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    console.error("rejectKYC error:", error);
    return { error: "Failed to reject KYC" };
  }
}

// ─── SCHEDULE INTAKE ─────────────────────────────────────────

export async function scheduleIntake(
  depositId: string,
  adminId: string,
  appointmentDate: string,
  intakeMethod: string,
  securityEscortRef?: string
) {
  try {
    await prisma.vaultDeposit.update({
      where: { id: depositId },
      data: {
        status: "INTAKE_SCHEDULED" as any,
        appointmentDate: new Date(appointmentDate),
        intakeMethod: intakeMethod as any,
        securityEscortRef,
      },
    });

    await logVaultActivity(
      depositId,
      "INTAKE_SCHEDULED",
      `Intake appointment scheduled for ${new Date(appointmentDate).toLocaleDateString("en-GB")}. Method: ${intakeMethod}. ${securityEscortRef ? `Escort ref: ${securityEscortRef}` : ""}`.trim(),
      adminId
    );

    // Email
    const dep = await prisma.vaultDeposit.findUnique({ where: { id: depositId }, include: { client: true } });
    if (dep?.client?.email) await notifyIntakeScheduled(dep.client.email, dep.client.name || "Client", dep.depositNumber, appointmentDate, intakeMethod);

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    console.error("scheduleIntake error:", error);
    return { error: "Failed to schedule intake" };
  }
}

// ─── RECORD ASSAY RESULTS ────────────────────────────────────

export async function recordAssayResult(
  depositId: string,
  adminId: string,
  data: {
    assayMethod: string;
    assayResult: string;
    assayPerformedBy: string;
    weightVerified: number;
    passed: boolean;
  }
) {
  try {
    const deposit = await prisma.vaultDeposit.findUnique({
      where: { id: depositId },
    });
    if (!deposit) return { error: "Deposit not found" };

    const weightDiscrepancy = data.weightVerified - deposit.weightGrams;

    await prisma.vaultDeposit.update({
      where: { id: depositId },
      data: {
        status: data.passed ? ("VERIFICATION_COMPLETE" as any) : ("PENDING_VERIFICATION" as any),
        assayStatus: data.passed ? ("PASSED" as any) : ("FAILED" as any),
        assayMethod: data.assayMethod,
        assayResult: data.assayResult,
        assayPerformedBy: data.assayPerformedBy,
        assayDate: new Date(),
        assayCompletedAt: new Date(),
        weightVerified: data.weightVerified,
        weightDiscrepancy,
        verifiedAt: data.passed ? new Date() : null,
      },
    });

    await logVaultActivity(
      depositId,
      data.passed ? "ASSAY_COMPLETED" : "ASSAY_FAILED",
      `Assay ${data.passed ? "PASSED" : "FAILED"} — Method: ${data.assayMethod}. Verified weight: ${data.weightVerified}g (discrepancy: ${weightDiscrepancy > 0 ? "+" : ""}${weightDiscrepancy.toFixed(2)}g). ${data.assayResult}`,
      adminId,
      { assayMethod: data.assayMethod, weightVerified: data.weightVerified, weightDiscrepancy }
    );

    // Email
    const depA = await prisma.vaultDeposit.findUnique({ where: { id: depositId }, include: { client: true } });
    if (depA?.client?.email) await notifyAssayComplete(depA.client.email, depA.client.name || "Client", depA.depositNumber, data.passed, data.assayMethod, data.weightVerified, depA.weightGrams);

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    console.error("recordAssayResult error:", error);
    return { error: "Failed to record assay result" };
  }
}

// ─── WAIVE ASSAY (LBMA-CERTIFIED) ────────────────────────────

export async function waiveAssay(depositId: string, adminId: string) {
  try {
    const deposit = await prisma.vaultDeposit.findUnique({
      where: { id: depositId },
    });
    if (!deposit) return { error: "Deposit not found" };

    await prisma.vaultDeposit.update({
      where: { id: depositId },
      data: {
        status: "VERIFICATION_COMPLETE" as any,
        assayStatus: "WAIVED" as any,
        assayResult: "Assay waived — LBMA-certified bar(s), verification limited to serial number and weight confirmation.",
        assayCompletedAt: new Date(),
        verifiedAt: new Date(),
        weightVerified: deposit.weightGrams,
        weightDiscrepancy: 0,
      },
    });

    await logVaultActivity(
      depositId,
      "ASSAY_COMPLETED",
      "Assay waived for LBMA-certified bar(s). Serial numbers and weight confirmed.",
      adminId
    );

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    console.error("waiveAssay error:", error);
    return { error: "Failed to waive assay" };
  }
}

// ─── SET INSURANCE ───────────────────────────────────────────

export async function setInsurance(
  depositId: string,
  adminId: string,
  data: {
    insuredValue: number;
    insuranceProvider: string;
    insurancePolicyNo: string;
    insuranceCoverage: string;
    insuranceExpiryDate: string;
  }
) {
  try {
    await prisma.vaultDeposit.update({
      where: { id: depositId },
      data: {
        insuredValue: data.insuredValue,
        insuranceProvider: data.insuranceProvider,
        insurancePolicyNo: data.insurancePolicyNo,
        insuranceCoverage: data.insuranceCoverage,
        insuranceExpiryDate: new Date(data.insuranceExpiryDate),
      },
    });

    await logVaultActivity(
      depositId,
      "INSURANCE_ACTIVATED",
      `Insurance activated: ${data.insuranceCoverage} coverage via ${data.insuranceProvider}. Policy: ${data.insurancePolicyNo}. Insured value: $${data.insuredValue.toLocaleString()}`,
      adminId
    );

    // Email
    const depI = await prisma.vaultDeposit.findUnique({ where: { id: depositId }, include: { client: true } });
    if (depI?.client?.email) await notifyInsuranceActivated(depI.client.email, depI.client.name || "Client", depI.depositNumber, data.insuredValue, data.insuranceProvider, data.insurancePolicyNo, data.insuranceCoverage);

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    console.error("setInsurance error:", error);
    return { error: "Failed to set insurance" };
  }
}

// ─── PLACE IN STORAGE ────────────────────────────────────────

export async function placeInStorage(
  depositId: string,
  adminId: string,
  data: {
    storageUnit: string;
    shelfPosition?: string;
    storageType: string;
    monthlyStorageFee: number;
  }
) {
  try {
    await prisma.vaultDeposit.update({
      where: { id: depositId },
      data: {
        status: "IN_STORAGE" as any,
        storageType: data.storageType as any,
        storageUnit: data.storageUnit,
        shelfPosition: data.shelfPosition,
        monthlyStorageFee: data.monthlyStorageFee,
        storedAt: new Date(),
        storageStartDate: new Date(),
      },
    });

    await logVaultActivity(
      depositId,
      "PLACED_IN_STORAGE",
      `Asset placed in ${data.storageType} storage. Unit: ${data.storageUnit}${data.shelfPosition ? `, Position: ${data.shelfPosition}` : ""}. Monthly fee: $${data.monthlyStorageFee}`,
      adminId
    );

    // Email
    const depS = await prisma.vaultDeposit.findUnique({ where: { id: depositId }, include: { client: true } });
    if (depS?.client?.email) await notifyPlacedInStorage(depS.client.email, depS.client.name || "Client", depS.depositNumber, depS.custodyReferenceId || depS.depositNumber, data.storageUnit, data.monthlyStorageFee);

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    console.error("placeInStorage error:", error);
    return { error: "Failed to place in storage" };
  }
}

// ─── CREATE WITHDRAWAL REQUEST ───────────────────────────────

export async function createWithdrawalRequest(
  depositId: string,
  requestedBy: string,
  data: {
    type: string;  // PHYSICAL, LIQUIDATION, VAULT_TRANSFER
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
      return { error: "Deposit must be in storage to request withdrawal" };
    }

    const withdrawal = await prisma.vaultWithdrawal.create({
      data: {
        depositId,
        type: data.type as any,
        status: "REQUESTED" as any,
        requestedBy,
        requestNotes: data.notes,
        collectionMethod: data.collectionMethod as any,
        bullionDealerName: data.bullionDealerName,
        bankAccountRef: data.bankAccountRef,
      },
    });

    await prisma.vaultDeposit.update({
      where: { id: depositId },
      data: {
        status: data.type === "LIQUIDATION"
          ? ("LIQUIDATION_IN_PROGRESS" as any)
          : ("RELEASE_REQUESTED" as any),
        releaseRequestedAt: new Date(),
      },
    });

    const typeLabel = data.type === "LIQUIDATION"
      ? "Liquidation via bullion dealer"
      : data.type === "VAULT_TRANSFER"
      ? "Transfer to another vault"
      : "Physical withdrawal";

    await logVaultActivity(
      depositId,
      "WITHDRAWAL_REQUESTED",
      `${typeLabel} requested. ${data.notes || ""}`.trim(),
      requestedBy
    );

    revalidatePath("/dashboard/shipments");
    return { success: true, withdrawalId: withdrawal.id };
  } catch (error) {
    console.error("createWithdrawalRequest error:", error);
    return { error: "Failed to create withdrawal request" };
  }
}

// ─── APPROVE WITHDRAWAL ──────────────────────────────────────

export async function approveWithdrawal(
  withdrawalId: string,
  adminId: string,
  notes?: string
) {
  try {
    const withdrawal = await prisma.vaultWithdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: "APPROVED" as any,
        approvedBy: adminId,
        approvedAt: new Date(),
        complianceCleared: true,
        complianceNotes: notes,
      },
    });

    await prisma.vaultDeposit.update({
      where: { id: withdrawal.depositId },
      data: { status: "RELEASE_APPROVED" as any, releaseApprovedAt: new Date() },
    });

    await logVaultActivity(
      withdrawal.depositId,
      "WITHDRAWAL_APPROVED",
      `Withdrawal approved. ${notes || "Compliance cleared."}`,
      adminId
    );

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    console.error("approveWithdrawal error:", error);
    return { error: "Failed to approve withdrawal" };
  }
}

// ─── COMPLETE WITHDRAWAL ─────────────────────────────────────

export async function completeWithdrawal(
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

    const withdrawal = await prisma.vaultWithdrawal.update({
      where: { id: withdrawalId },
      data: updateData as any,
    });

    const isLiquidation = withdrawal.type === "LIQUIDATION";

    await prisma.vaultDeposit.update({
      where: { id: withdrawal.depositId },
      data: {
        status: isLiquidation ? ("LIQUIDATED" as any) : ("RELEASED" as any),
        releasedAt: new Date(),
        releaseReason: isLiquidation
          ? `Liquidated via ${withdrawal.bullionDealerName || "bullion dealer"}. Wire ref: ${data?.wireTransferRef || "pending"}`
          : "Physical withdrawal completed",
      },
    });

    await logVaultActivity(
      withdrawal.depositId,
      isLiquidation ? "LIQUIDATION_COMPLETED" : "WITHDRAWAL_COMPLETED",
      isLiquidation
        ? `Liquidation complete. Sale: $${data?.saleAmount?.toLocaleString() || "N/A"}. Wire: ${data?.wireTransferRef || "pending"}`
        : "Physical withdrawal completed. Asset released from vault.",
      adminId
    );

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    console.error("completeWithdrawal error:", error);
    return { error: "Failed to complete withdrawal" };
  }
}

// ─── GET VAULT DEPOSITS ──────────────────────────────────────

export async function getVaultDeposits(filters?: {
  status?: string;
  clientId?: string;
}) {
  try {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.clientId) where.clientId = filters.clientId;

    const deposits = await prisma.vaultDeposit.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 5 },
        withdrawals: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    return { deposits };
  } catch (error) {
    console.error("getVaultDeposits error:", error);
    return { deposits: [] };
  }
}

// ─── GET SINGLE DEPOSIT DETAIL ───────────────────────────────

export async function getVaultDepositDetail(depositId: string) {
  try {
    const deposit = await prisma.vaultDeposit.findUnique({
      where: { id: depositId },
      include: {
        client: {
          select: { id: true, name: true, email: true, phone: true },
        },
        activities: { orderBy: { createdAt: "desc" } },
        withdrawals: { orderBy: { createdAt: "desc" } },
      },
    });

    return { deposit };
  } catch (error) {
    console.error("getVaultDepositDetail error:", error);
    return { deposit: null };
  }
}

// ─── ADD ACTIVITY NOTE ───────────────────────────────────────

export async function addVaultNote(
  depositId: string,
  adminId: string,
  note: string
) {
  try {
    await logVaultActivity(depositId, "NOTE_ADDED", note, adminId);
    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    return { error: "Failed to add note" };
  }
}

// ─── DELETE VAULT DEPOSIT ────────────────────────────────────

export async function deleteVaultDeposit(depositId: string) {
  try {
    await prisma.vaultWithdrawal.deleteMany({ where: { depositId } });
    await prisma.vaultActivity.deleteMany({ where: { depositId } });
    await prisma.vaultDeposit.delete({ where: { id: depositId } });

    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    console.error("deleteVaultDeposit error:", error);
    return { error: "Failed to delete deposit" };
  }
}
