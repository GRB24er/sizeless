"use server";

// ═══════════════════════════════════════════════════════════════
// src/app/(root)/shipments/vault-billing-actions.ts
// Vault Billing — Invoice generation, payments, monthly batch
// ═══════════════════════════════════════════════════════════════

// Every invoice here is generated from the published fee list
// (VAULT_PUBLISHED_FEES in lib/vault/types.ts) that the client sees before
// depositing. There is no free-form invoice, demurrage, or late penalty.

import { revalidatePath } from "next/cache";
import { prisma } from "@/constants/config/db";
import { requireAdmin } from "@/lib/auth-guards";
import {
  VAULT_FEE_SCHEDULE,
  ASSAY_METHODS,
  calculateMonthlyStorageFee,
} from "@/lib/vault/types";

// ─── HELPERS ─────────────────────────────────────────────────

function generateInvoiceNumber(): string {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `VLT-INV-${y}${m}-${rand}`;
}

function addDays(date: Date, days: number): Date {
  const r = new Date(date);
  r.setDate(r.getDate() + days);
  return r;
}

// ═══════════════════════════════════════════════════════════════
// GENERATE MONTHLY STORAGE INVOICES (Batch)
// ═══════════════════════════════════════════════════════════════

export async function generateMonthlyInvoices(adminId: string) {
  try {
    await requireAdmin();
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const periodLabel = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

    // Find all deposits in storage with monthly fees
    const deposits = await prisma.vaultDeposit.findMany({
      where: {
        status: "IN_STORAGE",
      },
      include: { client: true },
    });

    if (deposits.length === 0) {
      return { success: true, count: 0, message: "No active storage deposits to invoice" };
    }

    // Check for existing invoices this period to avoid duplicates
    const existingInvoices = await prisma.vaultInvoice.findMany({
      where: {
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
      select: { depositId: true },
    });
    const alreadyInvoiced = new Set(existingInvoices.map((i: any) => i.depositId));

    let created = 0;
    const errors: string[] = [];

    for (const deposit of deposits) {
      if (alreadyInvoiced.has(deposit.id)) continue;

      try {
        const storageFee = Math.round(calculateMonthlyStorageFee(deposit.weightGrams, deposit.storageType) * 100) / 100;
        const insuranceFee = deposit.insuredValue && deposit.insuranceFeeRate
          ? (deposit.insuredValue * deposit.insuranceFeeRate / 100) / 12
          : 0;

        const invoiceItems: any[] = [
          {
            type: "STORAGE_FEE",
            description: `Vault storage — ${periodLabel} (${deposit.storageType})`,
            quantity: 1,
            unitPrice: storageFee,
            amount: storageFee,
          },
        ];

        if (insuranceFee > 0) {
          invoiceItems.push({
            type: "INSURANCE_FEE",
            description: `Insurance premium — ${periodLabel} (${deposit.insuranceCoverage || "Standard"})`,
            quantity: 1,
            unitPrice: Math.round(insuranceFee * 100) / 100,
            amount: Math.round(insuranceFee * 100) / 100,
          });
        }

        const subtotal = invoiceItems.reduce((s: number, item: any) => s + item.amount, 0);

        await prisma.vaultInvoice.create({
          data: {
            invoiceNumber: generateInvoiceNumber(),
            depositId: deposit.id,
            clientId: deposit.clientId,
            issueDate: new Date(),
            dueDate: addDays(new Date(), 30),
            periodStart,
            periodEnd,
            subtotal,
            taxRate: 0,
            taxAmount: 0,
            total: subtotal,
            balanceDue: subtotal,
            status: "SENT" as any,
            notes: `Monthly vault custody charges for ${periodLabel}`,
            items: { create: invoiceItems },
          },
        });

        created++;
      } catch (err) {
        errors.push(`Failed for deposit ${deposit.depositNumber}: ${err}`);
      }
    }

    revalidatePath("/dashboard/shipments");
    return {
      success: true,
      count: created,
      skipped: alreadyInvoiced.size,
      errors: errors.length > 0 ? errors : undefined,
      message: `Generated ${created} invoice(s) for ${periodLabel}`,
    };
  } catch (error) {
    console.error("generateMonthlyInvoices error:", error);
    return { error: "Failed to generate monthly invoices" };
  }
}

// ═══════════════════════════════════════════════════════════════
// GENERATE ONE-TIME FEE INVOICE
// ═══════════════════════════════════════════════════════════════

export async function generateTransactionInvoice(
  depositId: string,
  adminId: string,
  feeType: string
) {
  try {
    await requireAdmin();
    const deposit = await prisma.vaultDeposit.findUnique({
      where: { id: depositId },
      include: { client: true },
    });
    if (!deposit) return { error: "Deposit not found" };

    const feeMap: Record<string, { type: string; description: string; amount: number }[]> = {
      INTAKE: [
        { type: "INTAKE_FEE", description: "Vault intake handling fee", amount: VAULT_FEE_SCHEDULE.intakeHandlingFee },
        { type: "KYC_FEE", description: "KYC processing fee", amount: VAULT_FEE_SCHEDULE.kycProcessingFee },
      ],
      INTAKE_ESCORT: [
        { type: "INTAKE_FEE", description: "Vault intake handling fee", amount: VAULT_FEE_SCHEDULE.intakeHandlingFee },
        { type: "ESCORT_FEE", description: "Armed security escort", amount: VAULT_FEE_SCHEDULE.securityEscortFee },
        { type: "KYC_FEE", description: "KYC processing fee", amount: VAULT_FEE_SCHEDULE.kycProcessingFee },
      ],
      ASSAY: [
        {
          type: "ASSAY_FEE",
          description: `Assay testing (${deposit.assayMethod || "Standard"})`,
          amount:
            ASSAY_METHODS.find((m) => m.id === deposit.assayMethod || m.label === deposit.assayMethod)?.cost ??
            VAULT_FEE_SCHEDULE.assayMinimumFee,
        },
      ],
      WITHDRAWAL: [
        { type: "WITHDRAWAL_FEE", description: "Physical withdrawal handling", amount: VAULT_FEE_SCHEDULE.physicalWithdrawalFee },
      ],
      LIQUIDATION: [
        {
          type: "LIQUIDATION_COMMISSION",
          description: `Liquidation commission (${VAULT_FEE_SCHEDULE.liquidationCommission}%)`,
          amount: Math.round(deposit.declaredValue * VAULT_FEE_SCHEDULE.liquidationCommission) / 100,
        },
        { type: "WIRE_TRANSFER_FEE", description: "Wire transfer fee", amount: VAULT_FEE_SCHEDULE.wireTransferFee },
      ],
    };

    const items = feeMap[feeType];
    if (!items) return { error: `Unknown fee type: ${feeType}` };

    const invoiceItems = items.map((item) => ({
      ...item,
      type: item.type as any,
      quantity: 1,
      unitPrice: item.amount,
    }));

    const subtotal = invoiceItems.reduce((s: number, i: any) => s + i.amount, 0);

    const invoice = await prisma.vaultInvoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        depositId,
        clientId: deposit.clientId,
        issueDate: new Date(),
        dueDate: addDays(new Date(), 14),
        subtotal,
        taxRate: 0,
        taxAmount: 0,
        total: subtotal,
        balanceDue: subtotal,
        status: "SENT" as any,
        notes: `Transaction charges for deposit ${deposit.depositNumber}`,
        items: { create: invoiceItems },
      },
    });

    revalidatePath("/dashboard/shipments");
    return { success: true, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber };
  } catch (error) {
    console.error("generateTransactionInvoice error:", error);
    return { error: "Failed to generate transaction invoice" };
  }
}

// ═══════════════════════════════════════════════════════════════
// RECORD PAYMENT
// ═══════════════════════════════════════════════════════════════

export async function recordInvoicePayment(
  invoiceId: string,
  adminId: string,
  data: {
    amount: number;
    paymentMethod: string;
    paymentRef: string;
  }
) {
  try {
    await requireAdmin();
    const invoice = await prisma.vaultInvoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) return { error: "Invoice not found" };

    const newAmountPaid = invoice.amountPaid + data.amount;
    const newBalance = Math.max(invoice.total - newAmountPaid, 0);
    const isPaid = newBalance <= 0;

    await prisma.vaultInvoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        balanceDue: newBalance,
        status: isPaid ? ("PAID" as any) : invoice.status,
        paidAt: isPaid ? new Date() : null,
        paymentMethod: data.paymentMethod,
        paymentRef: data.paymentRef,
      },
    });

    revalidatePath("/dashboard/shipments");
    return { success: true, fullyPaid: isPaid };
  } catch (error) {
    console.error("recordInvoicePayment error:", error);
    return { error: "Failed to record payment" };
  }
}

// ═══════════════════════════════════════════════════════════════
// CANCEL INVOICE
// ═══════════════════════════════════════════════════════════════

export async function cancelInvoice(invoiceId: string, adminId: string) {
  try {
    await requireAdmin();
    await prisma.vaultInvoice.update({
      where: { id: invoiceId },
      data: { status: "CANCELLED" as any, balanceDue: 0 },
    });
    revalidatePath("/dashboard/shipments");
    return { success: true };
  } catch (error) {
    console.error("cancelInvoice error:", error);
    return { error: "Failed to cancel invoice" };
  }
}

// ═══════════════════════════════════════════════════════════════
// GET INVOICES
// ═══════════════════════════════════════════════════════════════

export async function getVaultInvoices(filters?: {
  depositId?: string;
  clientId?: string;
  status?: string;
}) {
  try {
    await requireAdmin();
    const where: any = {};
    if (filters?.depositId) where.depositId = filters.depositId;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.status) where.status = filters.status;

    const invoices = await prisma.vaultInvoice.findMany({
      where,
      include: {
        items: true,
        deposit: { select: { depositNumber: true, custodyReferenceId: true } },
        client: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { invoices };
  } catch (error) {
    console.error("getVaultInvoices error:", error);
    return { invoices: [] };
  }
}

export async function getBillingStats() {
  try {
    await requireAdmin();
    const invoices = await prisma.vaultInvoice.findMany({
      select: { status: true, total: true, balanceDue: true, amountPaid: true },
    });

    const stats = {
      totalInvoiced: invoices.reduce((s: number, i: any) => s + i.total, 0),
      totalPaid: invoices.reduce((s: number, i: any) => s + i.amountPaid, 0),
      totalOutstanding: invoices.filter((i: any) => !["PAID", "CANCELLED"].includes(i.status)).reduce((s: number, i: any) => s + i.balanceDue, 0),
      invoiceCount: invoices.length,
      paidCount: invoices.filter((i: any) => i.status === "PAID").length,
      overdueCount: invoices.filter((i: any) => i.status === "OVERDUE").length,
      sentCount: invoices.filter((i: any) => i.status === "SENT").length,
    };

    return { stats };
  } catch (error) {
    console.error("getBillingStats error:", error);
    return { stats: { totalInvoiced: 0, totalPaid: 0, totalOutstanding: 0, invoiceCount: 0, paidCount: 0, overdueCount: 0, sentCount: 0 } };
  }
}
