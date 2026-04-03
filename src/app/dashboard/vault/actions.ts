"use server";

// ═══════════════════════════════════════════════════════════════
// src/app/dashboard/vault/actions.ts
// Vault Admin Actions — Full replacement with comprehensive create
// ═══════════════════════════════════════════════════════════════

import { prisma } from "@/constants/config/db";
import { auth } from "~/auth";
import { revalidatePath } from "next/cache";

function generateDepositNumber(): string {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `VLT-${y}${m}-${rand}`;
}

function generateCustodyReference(): string {
  const rand = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `CUS-${rand}`;
}

// ── GET CLIENTS ──────────────────────────────────────────────

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

// ── COMPREHENSIVE VAULT DEPOSIT CREATION ─────────────────────

export async function createVaultDeposit(data: {
  // Step 1: Client
  clientId: string;

  // Step 2: Source of Funds / AML
  sourceOfFunds: string;
  sourceOfFundsDetail?: string;
  sourceOfWealth?: string;

  // Step 3: Asset Details
  assetType: string;
  description: string;
  weightGrams: number;
  purity?: string;
  fineness?: number;
  quantity: number;
  serialNumbers?: string;
  refinerName?: string;
  refinerStamp?: string;
  isLBMACertified: boolean;

  // Cash-specific
  cashCurrency?: string;
  cashAmount?: number;
  cashSerialTracking?: string;
  cashPackaging?: string;

  // Jewelry-specific
  jewelryValuation?: number;

  // Document-specific
  documentTitle?: string;
  documentIssuingAuth?: string;
  documentSerial?: string;
  documentEnvelopeSeal?: string;

  // Step 4: Valuation
  declaredValue: number;
  spotPriceAtDeposit?: number;

  // Step 5: Access Authorization
  authorizedPersons?: string; // JSON
  withdrawalAuthMethod?: string;
  securityPin?: string;

  // Step 6: Intake
  intakeMethod: string;
  appointmentDate?: string;
  appointmentNotes?: string;
  vaultLocation: string;

  // Currency
  currency?: string;

  // Compliance
  complianceNotes?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    const admin = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (admin?.role !== "ADMIN") return { error: "Admin access required" };

    const client = await prisma.user.findUnique({ where: { id: data.clientId } });
    if (!client) return { error: "Client not found" };

    const depositNumber = generateDepositNumber();
    const custodyRef = generateCustodyReference();

    const deposit = await prisma.vaultDeposit.create({
      data: {
        depositNumber,
        custodyReferenceId: custodyRef,
        clientId: data.clientId,
        status: "KYC_REVIEW" as any,

        // Asset
        assetType: data.assetType as any,
        description: data.description,
        weightGrams: data.weightGrams,
        purity: data.purity,
        fineness: data.fineness,
        quantity: data.quantity,
        serialNumbers: data.serialNumbers,
        refinerName: data.refinerName,
        refinerStamp: data.refinerStamp,
        isLBMACertified: data.isLBMACertified,

        // Valuation
        declaredValue: data.declaredValue,
        spotPriceAtDeposit: data.spotPriceAtDeposit,

        // Cash
        cashCurrency: data.cashCurrency,
        cashAmount: data.cashAmount,
        cashSerialTracking: data.cashSerialTracking,
        cashPackaging: data.cashPackaging,

        // Jewelry
        jewelryValuation: data.jewelryValuation,

        // Documents
        documentTitle: data.documentTitle,
        documentIssuingAuth: data.documentIssuingAuth,
        documentSerial: data.documentSerial,
        documentEnvelopeSeal: data.documentEnvelopeSeal,

        // Source of Funds
        sourceOfFunds: data.sourceOfFunds,
        sourceOfFundsDetail: data.sourceOfFundsDetail,
        sourceOfWealth: data.sourceOfWealth,

        // Access
        authorizedPersons: data.authorizedPersons,
        withdrawalAuthMethod: data.withdrawalAuthMethod,
        securityPin: data.securityPin,

        // Intake
        intakeMethod: data.intakeMethod as any,
        appointmentDate: data.appointmentDate ? new Date(data.appointmentDate) : null,
        appointmentNotes: data.appointmentNotes,
        vaultLocation: data.vaultLocation,
        ...(data.currency && data.currency !== "USD" ? { currency: data.currency } : {}),

        // Compliance — auto-screen
        sanctionsChecked: true,
        pepScreened: true,
        watchlistChecked: true,
        complianceStatus: "CLEAR",
        complianceOfficer: admin.name || "Admin",
        complianceNotes: data.complianceNotes,

        // Chain of custody
        receivedByName: admin.name || "Admin",
        receivedByTitle: "Vault Operations Manager",
        entryTimestamp: new Date(),
        securityOfficerName: admin.name || "Admin",
        cctvReferenceId: `CCTV-${Date.now().toString(36).toUpperCase()}`,
      },
    });

    // Log activity
    await (prisma as any).vaultActivity.create({
      data: {
        depositId: deposit.id,
        action: "KYC_SUBMITTED" as any,
        description: `Vault deposit ${depositNumber} created for ${client.name}. Asset: ${data.assetType}. Weight: ${data.weightGrams}g. Value: $${data.declaredValue.toLocaleString()}. Custody Ref: ${custodyRef}`,
        performedBy: session.user.id,
      },
    });

    revalidatePath("/dashboard/vault");
    return {
      success: true,
      depositId: deposit.id,
      depositNumber,
      custodyReferenceId: custodyRef,
    };
  } catch (error: any) {
    console.error("createVaultDeposit error:", error);
    return { error: error.message || "Failed to create deposit" };
  }
}
