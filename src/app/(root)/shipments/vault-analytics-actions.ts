"use server";

// ═══════════════════════════════════════════════════════════════
// src/app/(root)/shipments/vault-analytics-actions.ts
// Vault Reporting & Analytics — Data aggregation for dashboards
// ═══════════════════════════════════════════════════════════════

import { prisma } from "@/constants/config/db";

// ─── VAULT OVERVIEW STATS ────────────────────────────────────

export async function getVaultOverview() {
  try {
    const deposits = await prisma.vaultDeposit.findMany({
      select: {
        status: true,
        weightGrams: true,
        declaredValue: true,
        insuredValue: true,
        monthlyStorageFee: true,
        assetType: true,
        storageType: true,
        vaultLocation: true,
        createdAt: true,
      },
    });

    const inStorage = deposits.filter((d: any) => d.status === "IN_STORAGE");
    const allActive = deposits.filter((d: any) => !["RELEASED", "LIQUIDATED", "CANCELLED"].includes(d.status));

    const totalWeight = inStorage.reduce((s: number, d: any) => s + d.weightGrams, 0);
    const totalValue = inStorage.reduce((s: number, d: any) => s + d.declaredValue, 0);
    const totalInsured = inStorage.reduce((s: number, d: any) => s + (d.insuredValue || 0), 0);
    const monthlyRevenue = inStorage.reduce((s: number, d: any) => s + (d.monthlyStorageFee || 0), 0);

    // Status distribution
    const statusCounts: Record<string, number> = {};
    deposits.forEach((d: any) => {
      statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
    });

    // Asset type breakdown
    const assetBreakdown: Record<string, { count: number; weight: number; value: number }> = {};
    inStorage.forEach((d: any) => {
      if (!assetBreakdown[d.assetType]) {
        assetBreakdown[d.assetType] = { count: 0, weight: 0, value: 0 };
      }
      assetBreakdown[d.assetType].count++;
      assetBreakdown[d.assetType].weight += d.weightGrams;
      assetBreakdown[d.assetType].value += d.declaredValue;
    });

    // Storage type distribution
    const storageDist: Record<string, number> = {};
    inStorage.forEach((d: any) => {
      const st = d.storageType || "UNALLOCATED";
      storageDist[st] = (storageDist[st] || 0) + 1;
    });

    // Vault location distribution
    const locationDist: Record<string, { count: number; weight: number }> = {};
    inStorage.forEach((d: any) => {
      const loc = d.vaultLocation || "Unknown";
      if (!locationDist[loc]) locationDist[loc] = { count: 0, weight: 0 };
      locationDist[loc].count++;
      locationDist[loc].weight += d.weightGrams;
    });

    // Monthly deposit trend (last 12 months)
    const now = new Date();
    const monthlyTrend: { month: string; deposits: number; value: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const label = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      const monthDeposits = deposits.filter(
        (dep: any) => new Date(dep.createdAt) >= d && new Date(dep.createdAt) < nextMonth
      );
      monthlyTrend.push({
        month: label,
        deposits: monthDeposits.length,
        value: monthDeposits.reduce((s: number, dep: any) => s + dep.declaredValue, 0),
      });
    }

    return {
      summary: {
        totalDeposits: deposits.length,
        activeDeposits: allActive.length,
        inStorageCount: inStorage.length,
        totalWeightGrams: totalWeight,
        totalWeightKg: Math.round(totalWeight / 10) / 100,
        totalWeightOz: Math.round((totalWeight / 31.1035) * 100) / 100,
        totalValue,
        totalInsured,
        insuranceCoverage: totalValue > 0 ? Math.round((totalInsured / totalValue) * 100) : 0,
        monthlyRevenue,
        annualProjected: monthlyRevenue * 12,
      },
      statusCounts,
      assetBreakdown,
      storageDist,
      locationDist,
      monthlyTrend,
    };
  } catch (error) {
    console.error("getVaultOverview error:", error);
    return null;
  }
}

// ─── CLIENT PORTFOLIO SUMMARY ────────────────────────────────

export async function getClientPortfolios() {
  try {
    const deposits = await prisma.vaultDeposit.findMany({
      where: { status: "IN_STORAGE" },
      include: {
        client: { select: { id: true, name: true, email: true } },
      },
    });

    const portfolioMap: Record<string, {
      client: { id: string; name: string; email: string };
      depositCount: number;
      totalWeight: number;
      totalValue: number;
      totalInsured: number;
      monthlyFees: number;
      assets: { type: string; weight: number; value: number }[];
    }> = {};

    deposits.forEach((d: any) => {
      const cid = d.clientId;
      if (!portfolioMap[cid]) {
        portfolioMap[cid] = {
          client: d.client,
          depositCount: 0,
          totalWeight: 0,
          totalValue: 0,
          totalInsured: 0,
          monthlyFees: 0,
          assets: [],
        };
      }
      const p = portfolioMap[cid];
      p.depositCount++;
      p.totalWeight += d.weightGrams;
      p.totalValue += d.declaredValue;
      p.totalInsured += d.insuredValue || 0;
      p.monthlyFees += d.monthlyStorageFee || 0;
      p.assets.push({
        type: d.assetType,
        weight: d.weightGrams,
        value: d.declaredValue,
      });
    });

    const portfolios = Object.values(portfolioMap).sort(
      (a, b) => b.totalValue - a.totalValue
    );

    return { portfolios };
  } catch (error) {
    console.error("getClientPortfolios error:", error);
    return { portfolios: [] };
  }
}

// ─── REVENUE ANALYTICS ──────────────────────────────────────

export async function getRevenueAnalytics() {
  try {
    const invoices = await prisma.vaultInvoice.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    // Total revenue metrics
    const totalInvoiced = invoices.reduce((s: number, i: any) => s + i.total, 0);
    const totalCollected = invoices.reduce((s: number, i: any) => s + i.amountPaid, 0);
    const totalOutstanding = invoices
      .filter((i: any) => !["PAID", "CANCELLED"].includes(i.status))
      .reduce((s: number, i: any) => s + i.balanceDue, 0);
    const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

    // Revenue by fee type
    const revenueByType: Record<string, number> = {};
    invoices.forEach((inv: any) => {
      inv.items.forEach((item: any) => {
        revenueByType[item.type] = (revenueByType[item.type] || 0) + item.amount;
      });
    });

    // Monthly revenue (last 12 months)
    const now = new Date();
    const monthlyRevenue: { month: string; invoiced: number; collected: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const label = d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      const monthInvoices = invoices.filter(
        (inv: any) => new Date(inv.createdAt) >= d && new Date(inv.createdAt) < nextMonth
      );
      monthlyRevenue.push({
        month: label,
        invoiced: monthInvoices.reduce((s: number, inv: any) => s + inv.total, 0),
        collected: monthInvoices.reduce((s: number, inv: any) => s + inv.amountPaid, 0),
      });
    }

    // Payment method breakdown
    const paymentMethods: Record<string, number> = {};
    invoices
      .filter((i: any) => i.status === "PAID" && i.paymentMethod)
      .forEach((i: any) => {
        paymentMethods[i.paymentMethod] = (paymentMethods[i.paymentMethod] || 0) + i.amountPaid;
      });

    return {
      summary: {
        totalInvoiced,
        totalCollected,
        totalOutstanding,
        collectionRate,
        invoiceCount: invoices.length,
        paidCount: invoices.filter((i: any) => i.status === "PAID").length,
        overdueCount: invoices.filter((i: any) => i.status === "OVERDUE").length,
        avgInvoiceValue: invoices.length > 0 ? totalInvoiced / invoices.length : 0,
      },
      revenueByType,
      monthlyRevenue,
      paymentMethods,
    };
  } catch (error) {
    console.error("getRevenueAnalytics error:", error);
    return null;
  }
}

// ─── ACTIVITY LOG ────────────────────────────────────────────

export async function getVaultActivityLog(options?: {
  limit?: number;
  depositId?: string;
}) {
  try {
    const where: any = {};
    if (options?.depositId) where.depositId = options.depositId;

    const activities = await prisma.vaultActivity.findMany({
      where,
      include: {
        deposit: {
          select: { depositNumber: true, custodyReferenceId: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit || 50,
    });

    return { activities };
  } catch (error) {
    console.error("getVaultActivityLog error:", error);
    return { activities: [] };
  }
}

// ─── WITHDRAWAL ANALYTICS ───────────────────────────────────

export async function getWithdrawalAnalytics() {
  try {
    const withdrawals = await prisma.vaultWithdrawal.findMany({
      include: {
        deposit: {
          select: { depositNumber: true, declaredValue: true, weightGrams: true },
        },
      },
    });

    const byType: Record<string, { count: number; value: number }> = {};
    const byStatus: Record<string, number> = {};

    withdrawals.forEach((w: any) => {
      // By type
      if (!byType[w.type]) byType[w.type] = { count: 0, value: 0 };
      byType[w.type].count++;
      byType[w.type].value += w.saleAmount || w.deposit.declaredValue;

      // By status
      byStatus[w.status] = (byStatus[w.status] || 0) + 1;
    });

    const totalLiquidated = withdrawals
      .filter((w: any) => w.type === "LIQUIDATION" && w.status === "COMPLETED")
      .reduce((s: number, w: any) => s + (w.saleAmount || 0), 0);

    return {
      totalWithdrawals: withdrawals.length,
      completed: withdrawals.filter((w: any) => w.status === "COMPLETED").length,
      pending: withdrawals.filter((w: any) => ["REQUESTED", "APPROVED"].includes(w.status)).length,
      totalLiquidated,
      byType,
      byStatus,
    };
  } catch (error) {
    console.error("getWithdrawalAnalytics error:", error);
    return null;
  }
}
