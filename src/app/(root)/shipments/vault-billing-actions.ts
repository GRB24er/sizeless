"use server";

// ═══════════════════════════════════════════════════════════════
// src/app/(root)/shipments/vault-billing-actions.ts
// Vault Billing — Invoice generation, payments, monthly batch
// ═══════════════════════════════════════════════════════════════

import { revalidatePath } from "next/cache";
import { prisma } from "@/constants/config/db";
import {
  VAULT_FEE_SCHEDULE,
  calculateDemurrageCharge,
  calculateLatePaymentPenalty,
  getDemurrageRate,
  DEMURRAGE_CONFIG,
  formatCurrencyAmount,
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
// CREATE SINGLE INVOICE (Manual)
// ═══════════════════════════════════════════════════════════════

export async function createVaultInvoice(
  depositId: string,
  adminId: string,
  items: {
    type: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }[],
  options?: {
    notes?: string;
    dueDays?: number;
    periodStart?: string;
    periodEnd?: string;
    currency?: string;
  }
) {
  try {
    const deposit = await prisma.vaultDeposit.findUnique({
      where: { id: depositId },
      include: { client: true },
    });
    if (!deposit) return { error: "Deposit not found" };

    const invoiceItems = items.map((item) => ({
      type: item.type as any,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
    }));

    const subtotal = invoiceItems.reduce((sum: number, item: any) => sum + item.amount, 0);
    const taxRate = 0; // No VAT for gold storage (exempt in many jurisdictions)
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const invoice = await prisma.vaultInvoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        depositId,
        clientId: deposit.clientId,
        issueDate: new Date(),
        dueDate: addDays(new Date(), options?.dueDays || 30),
        periodStart: options?.periodStart ? new Date(options.periodStart) : null,
        periodEnd: options?.periodEnd ? new Date(options.periodEnd) : null,
        subtotal,
        taxRate,
        taxAmount,
        total,
        balanceDue: total,
        status: "SENT" as any,
        notes: options?.notes,
        items: {
          create: invoiceItems,
        },
      },
      include: { items: true },
    });

    revalidatePath("/dashboard/shipments");
    return { success: true, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber };
  } catch (error) {
    console.error("createVaultInvoice error:", error);
    return { error: "Failed to create invoice" };
  }
}

// ═══════════════════════════════════════════════════════════════
// GENERATE MONTHLY STORAGE INVOICES (Batch)
// ═══════════════════════════════════════════════════════════════

export async function generateMonthlyInvoices(adminId: string) {
  try {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const periodLabel = now.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

    // Find all deposits in storage with monthly fees
    const deposits = await prisma.vaultDeposit.findMany({
      where: {
        status: "IN_STORAGE",
        monthlyStorageFee: { gt: 0 },
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
        const storageFee = deposit.monthlyStorageFee || 0;
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
        { type: "ASSAY_FEE", description: `Assay testing (${deposit.assayMethod || "Standard"})`, amount: deposit.assayFee || VAULT_FEE_SCHEDULE.assayMinimumFee },
      ],
      WITHDRAWAL: [
        { type: "WITHDRAWAL_FEE", description: "Physical withdrawal handling", amount: 350 },
      ],
      LIQUIDATION: [
        { type: "LIQUIDATION_COMMISSION", description: "Liquidation commission (0.5%)", amount: deposit.declaredValue * 0.005 },
        { type: "WIRE_TRANSFER_FEE", description: "Wire transfer fee", amount: 35 },
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

// ═══════════════════════════════════════════════════════════════
// GENERATE DEMURRAGE INVOICES
// Uses OTHER invoice item type (no schema change needed)
// Currency is passed as application-level data only
// ═══════════════════════════════════════════════════════════════

export async function generateDemurrageInvoice(
  depositId: string,
  adminId: string,
  options?: { overrideDays?: number; currency?: string }
) {
  try {
    const deposit = await prisma.vaultDeposit.findUnique({
      where: { id: depositId },
      include: { client: true },
    });
    if (!deposit) return { error: "Deposit not found" };

    const referenceDate = deposit.storageEndDate || null;

    if (!referenceDate && !options?.overrideDays) {
      return { error: "No storage end date set for this deposit. Use override days or set a storage end date." };
    }

    const now = new Date();
    const daysOverdue = options?.overrideDays
      ?? Math.floor((now.getTime() - new Date(referenceDate!).getTime()) / (1000 * 60 * 60 * 24));

    if (daysOverdue <= DEMURRAGE_CONFIG.gracePeriodDays) {
      return { error: `Deposit is within the ${DEMURRAGE_CONFIG.gracePeriodDays}-day grace period (${daysOverdue} days). No demurrage applies.` };
    }

    const demurrageAmount = calculateDemurrageCharge(deposit.declaredValue, daysOverdue);
    const { rate, tier } = getDemurrageRate(daysOverdue);
    const chargeableDays = daysOverdue - DEMURRAGE_CONFIG.gracePeriodDays;
    const depositCurrency = options?.currency || "USD";

    const invoiceItems: any[] = [
      {
        type: "OTHER",
        description: `Demurrage charge — ${chargeableDays} day(s) at ${tier} rate (${rate}%/day) on declared value ${formatCurrencyAmount(deposit.declaredValue, depositCurrency)}`,
        quantity: chargeableDays,
        unitPrice: Math.max(deposit.declaredValue * (rate / 100), DEMURRAGE_CONFIG.minimumDailyCharge),
        amount: demurrageAmount,
      },
    ];

    const invoice = await prisma.vaultInvoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        depositId,
        clientId: deposit.clientId,
        issueDate: new Date(),
        dueDate: addDays(new Date(), 14),
        subtotal: demurrageAmount,
        taxRate: 0,
        taxAmount: 0,
        total: demurrageAmount,
        balanceDue: demurrageAmount,
        status: "SENT" as any,
        notes: `Demurrage charges for deposit ${deposit.depositNumber} — ${daysOverdue} day(s) overdue (${tier} tier) [${depositCurrency}]`,
        items: { create: invoiceItems },
      },
    });

    // Update deposit total fees
    await prisma.vaultDeposit.update({
      where: { id: depositId },
      data: {
        totalFeesCharged: { increment: demurrageAmount },
      },
    });

    // Log activity
    await (prisma as any).vaultActivity.create({
      data: {
        depositId,
        action: "FEE_CHARGED",
        description: `Demurrage invoice ${invoice.invoiceNumber}: ${formatCurrencyAmount(demurrageAmount, depositCurrency)} for ${chargeableDays} day(s) at ${tier} rate`,
        performedBy: adminId,
      },
    });

    revalidatePath("/dashboard/shipments");
    return {
      success: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      demurrageAmount,
      daysOverdue,
      chargeableDays,
      tier,
      currency: depositCurrency,
    };
  } catch (error) {
    console.error("generateDemurrageInvoice error:", error);
    return { error: "Failed to generate demurrage invoice" };
  }
}

// ═══════════════════════════════════════════════════════════════
// GENERATE LATE PAYMENT PENALTY
// ═══════════════════════════════════════════════════════════════

export async function generateLatePaymentPenalty(
  invoiceId: string,
  adminId: string,
  currency?: string
) {
  try {
    const invoice = await prisma.vaultInvoice.findUnique({
      where: { id: invoiceId },
      include: { deposit: true },
    });
    if (!invoice) return { error: "Invoice not found" };
    if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
      return { error: "Invoice is already paid or cancelled" };
    }

    const penalty = calculateLatePaymentPenalty(invoice.balanceDue);
    const depositCurrency = currency || "USD";

    const penaltyInvoice = await prisma.vaultInvoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        depositId: invoice.depositId,
        clientId: invoice.clientId,
        issueDate: new Date(),
        dueDate: addDays(new Date(), 14),
        subtotal: penalty,
        taxRate: 0,
        taxAmount: 0,
        total: penalty,
        balanceDue: penalty,
        status: "SENT" as any,
        notes: `Late payment penalty (${DEMURRAGE_CONFIG.latePaymentPenaltyPercent}%) on overdue invoice ${invoice.invoiceNumber} [${depositCurrency}]`,
        items: {
          create: [{
            type: "LATE_FEE" as any,
            description: `Late payment penalty — ${DEMURRAGE_CONFIG.latePaymentPenaltyPercent}% of outstanding balance ${formatCurrencyAmount(invoice.balanceDue, depositCurrency)}`,
            quantity: 1,
            unitPrice: penalty,
            amount: penalty,
          }],
        },
      },
    });

    // Mark original invoice as overdue
    await prisma.vaultInvoice.update({
      where: { id: invoiceId },
      data: { status: "OVERDUE" as any },
    });

    revalidatePath("/dashboard/shipments");
    return {
      success: true,
      penaltyInvoiceId: penaltyInvoice.id,
      penaltyInvoiceNumber: penaltyInvoice.invoiceNumber,
      penaltyAmount: penalty,
      currency: depositCurrency,
    };
  } catch (error) {
    console.error("generateLatePaymentPenalty error:", error);
    return { error: "Failed to generate late payment penalty" };
  }
}

// ═══════════════════════════════════════════════════════════════
// GET DEMURRAGE SUMMARY FOR A DEPOSIT
// ═══════════════════════════════════════════════════════════════

export async function getDemurrageSummary(depositId: string, currency?: string) {
  try {
    const deposit = await prisma.vaultDeposit.findUnique({
      where: { id: depositId },
    });
    if (!deposit) return { error: "Deposit not found" };

    const referenceDate = deposit.storageEndDate || null;

    const now = new Date();
    const daysOverdue = referenceDate
      ? Math.floor((now.getTime() - new Date(referenceDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const depositCurrency = currency || "USD";
    const { rate, tier } = getDemurrageRate(daysOverdue);
    const currentDemurrage = calculateDemurrageCharge(deposit.declaredValue, daysOverdue);

    // Get existing demurrage invoices (identified by "Demurrage" in notes)
    const demurrageInvoices = await prisma.vaultInvoice.findMany({
      where: {
        depositId,
        notes: { contains: "Demurrage" },
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    const totalCharged = demurrageInvoices.reduce((s: number, inv: any) => s + inv.total, 0);

    return {
      depositNumber: deposit.depositNumber,
      currency: depositCurrency,
      declaredValue: deposit.declaredValue,
      daysOverdue: Math.max(daysOverdue, 0),
      gracePeriodDays: DEMURRAGE_CONFIG.gracePeriodDays,
      currentTier: tier,
      currentRate: rate,
      projectedDemurrage: currentDemurrage,
      totalDemurrageCharged: totalCharged,
      demurrageInvoices: demurrageInvoices.map((inv: any) => ({
        invoiceNumber: inv.invoiceNumber,
        amount: inv.total,
        status: inv.status,
        issueDate: inv.issueDate,
      })),
    };
  } catch (error) {
    console.error("getDemurrageSummary error:", error);
    return { error: "Failed to get demurrage summary" };
  }
}
