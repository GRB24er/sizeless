"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/dashboard/shipments/DepositBilling.tsx
// Per-deposit billing — Fee invoices, demurrage management
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useTransition } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Loader2,
  Receipt,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

import {
  generateTransactionInvoice,
  generateDemurrageInvoice,
  generateLatePaymentPenalty,
  getDemurrageSummary,
  getVaultInvoices,
} from "@/app/(root)/shipments/vault-billing-actions";
import { formatCurrencyAmount, DEMURRAGE_CONFIG } from "@/lib/vault/types";

type DepositInvoice = {
  id: string;
  invoiceNumber: string;
  total: number;
  balanceDue: number;
  status: string;
  currency?: string;
  issueDate: string;
  dueDate: string;
  items: { description: string; amount: number; type?: string }[];
};

type DemurrageSummary = {
  depositNumber: string;
  currency: string;
  declaredValue: number;
  daysOverdue: number;
  gracePeriodDays: number;
  currentTier: string;
  currentRate: number;
  projectedDemurrage: number;
  totalDemurrageCharged: number;
  demurrageInvoices: {
    invoiceNumber: string;
    amount: number;
    status: string;
    issueDate: string;
  }[];
};

const feeButtons = [
  { key: "INTAKE", label: "Intake Fees", desc: "Handling + KYC", icon: "📦" },
  { key: "INTAKE_ESCORT", label: "Intake + Escort", desc: "Handling + KYC + Escort", icon: "🛡️" },
  { key: "ASSAY", label: "Assay Fee", desc: "Testing fee", icon: "🔬" },
  { key: "WITHDRAWAL", label: "Withdrawal Fee", desc: "Physical release", icon: "📤" },
  { key: "LIQUIDATION", label: "Liquidation Fees", desc: "Commission + wire", icon: "💰" },
];

const statusColors: Record<string, string> = {
  PAID: "text-emerald-600",
  SENT: "text-blue-600",
  OVERDUE: "text-red-600",
  CANCELLED: "text-gray-400",
  DRAFT: "text-gray-500",
};

export default function DepositBilling({
  depositId,
  adminId,
}: {
  depositId: string;
  adminId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [invoices, setInvoices] = useState<DepositInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  // Demurrage state
  const [showDemurrage, setShowDemurrage] = useState(false);
  const [demurrageSummary, setDemurrageSummary] = useState<DemurrageSummary | null>(null);
  const [demurrageLoading, setDemurrageLoading] = useState(false);
  const [overrideDays, setOverrideDays] = useState("");
  const [generatingDemurrage, setGeneratingDemurrage] = useState(false);

  const loadInvoices = async () => {
    setLoading(true);
    const res = await getVaultInvoices({ depositId });
    setInvoices(res.invoices as any);
    setLoading(false);
  };

  const loadDemurrageSummary = async () => {
    setDemurrageLoading(true);
    const res = await getDemurrageSummary(depositId);
    if (!res.error) setDemurrageSummary(res as DemurrageSummary);
    setDemurrageLoading(false);
  };

  useEffect(() => {
    loadInvoices();
  }, [depositId]);

  useEffect(() => {
    if (showDemurrage) loadDemurrageSummary();
  }, [showDemurrage, depositId]);

  const handleGenerate = (feeType: string) => {
    setGenerating(feeType);
    startTransition(async () => {
      const res = await generateTransactionInvoice(depositId, adminId, feeType);
      if (res.error) toast.error(res.error);
      else {
        toast.success(`Invoice ${res.invoiceNumber} created`);
        loadInvoices();
      }
      setGenerating(null);
    });
  };

  const handleGenerateDemurrage = () => {
    setGeneratingDemurrage(true);
    startTransition(async () => {
      const opts = overrideDays ? { overrideDays: parseInt(overrideDays) } : undefined;
      const res = await generateDemurrageInvoice(depositId, adminId, opts);
      if (res.error) toast.error(res.error);
      else {
        toast.success(
          `Demurrage invoice ${res.invoiceNumber} created — ${formatCurrencyAmount(res.demurrageAmount!, res.currency!)} for ${res.chargeableDays} day(s)`
        );
        loadInvoices();
        loadDemurrageSummary();
      }
      setGeneratingDemurrage(false);
    });
  };

  const handleLatePenalty = (invoiceId: string) => {
    startTransition(async () => {
      const res = await generateLatePaymentPenalty(invoiceId, adminId);
      if (res.error) toast.error(res.error);
      else {
        toast.success(`Late penalty invoice ${res.penaltyInvoiceNumber} — ${formatCurrencyAmount(res.penaltyAmount!, res.currency!)}`);
        loadInvoices();
      }
    });
  };

  const fmtAmt = (n: number, currency?: string) => formatCurrencyAmount(n, currency || "USD");
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
        <Receipt className="w-3.5 h-3.5" /> Billing & Invoices
      </p>

      {/* Quick Generate Buttons */}
      <div className="flex flex-wrap gap-2">
        {feeButtons.map((fee) => (
          <button
            key={fee.key}
            onClick={() => handleGenerate(fee.key)}
            disabled={isPending}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-xs transition-all disabled:opacity-50"
            title={fee.desc}
          >
            {generating === fee.key ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span>{fee.icon}</span>
            )}
            <span className="font-medium">{fee.label}</span>
          </button>
        ))}
      </div>

      {/* ─── DEMURRAGE SECTION ─────────────────────────────── */}
      <div className="border border-amber-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowDemurrage(!showDemurrage)}
          className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">Demurrage & Late Charges</span>
          </div>
          {showDemurrage ? (
            <ChevronUp className="w-4 h-4 text-amber-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-amber-600" />
          )}
        </button>

        {showDemurrage && (
          <div className="p-4 space-y-4 bg-white">
            {demurrageLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading demurrage data...
              </div>
            ) : demurrageSummary ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-gray-50 border">
                    <p className="text-xs text-gray-500">Days Overdue</p>
                    <p className={`text-lg font-bold ${demurrageSummary.daysOverdue > DEMURRAGE_CONFIG.gracePeriodDays ? "text-red-600" : "text-gray-800"}`}>
                      {demurrageSummary.daysOverdue}
                    </p>
                    <p className="text-xs text-gray-400">Grace: {demurrageSummary.gracePeriodDays}d</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border">
                    <p className="text-xs text-gray-500">Rate Tier</p>
                    <p className={`text-lg font-bold ${
                      demurrageSummary.currentTier === "Critical" ? "text-red-600" :
                      demurrageSummary.currentTier === "Extended" ? "text-amber-600" : "text-blue-600"
                    }`}>
                      {demurrageSummary.currentTier}
                    </p>
                    <p className="text-xs text-gray-400">{demurrageSummary.currentRate}%/day</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border">
                    <p className="text-xs text-gray-500">Projected Charge</p>
                    <p className="text-lg font-bold text-amber-700">
                      {fmtAmt(demurrageSummary.projectedDemurrage, demurrageSummary.currency)}
                    </p>
                    <p className="text-xs text-gray-400">If billed today</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 border">
                    <p className="text-xs text-gray-500">Total Charged</p>
                    <p className="text-lg font-bold text-gray-800">
                      {fmtAmt(demurrageSummary.totalDemurrageCharged, demurrageSummary.currency)}
                    </p>
                    <p className="text-xs text-gray-400">All time</p>
                  </div>
                </div>

                {/* Rate Tiers Info */}
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 mb-2">Demurrage Rate Schedule</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className={`p-2 rounded ${demurrageSummary.currentTier === "Standard" ? "bg-blue-200 ring-1 ring-blue-400" : "bg-blue-100"}`}>
                      <p className="font-semibold">Standard</p>
                      <p>{DEMURRAGE_CONFIG.dailyRates.STANDARD}%/day</p>
                      <p className="text-blue-600">0–{DEMURRAGE_CONFIG.extendedThresholdDays}d</p>
                    </div>
                    <div className={`p-2 rounded ${demurrageSummary.currentTier === "Extended" ? "bg-amber-200 ring-1 ring-amber-400" : "bg-amber-100"}`}>
                      <p className="font-semibold">Extended</p>
                      <p>{DEMURRAGE_CONFIG.dailyRates.EXTENDED}%/day</p>
                      <p className="text-amber-600">{DEMURRAGE_CONFIG.extendedThresholdDays}–{DEMURRAGE_CONFIG.criticalThresholdDays}d</p>
                    </div>
                    <div className={`p-2 rounded ${demurrageSummary.currentTier === "Critical" ? "bg-red-200 ring-1 ring-red-400" : "bg-red-100"}`}>
                      <p className="font-semibold">Critical</p>
                      <p>{DEMURRAGE_CONFIG.dailyRates.CRITICAL}%/day</p>
                      <p className="text-red-600">{DEMURRAGE_CONFIG.criticalThresholdDays}d+</p>
                    </div>
                  </div>
                </div>

                {/* Generate Demurrage */}
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 space-y-3">
                  <p className="text-xs font-semibold text-amber-800">Generate Demurrage Invoice</p>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Override Days Overdue (optional)</label>
                      <input
                        type="number"
                        min="0"
                        value={overrideDays}
                        onChange={(e) => setOverrideDays(e.target.value)}
                        placeholder={`Auto: ${demurrageSummary.daysOverdue} days`}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                      />
                    </div>
                    <button
                      onClick={handleGenerateDemurrage}
                      disabled={generatingDemurrage || isPending}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
                    >
                      {generatingDemurrage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Timer className="w-4 h-4" />
                      )}
                      Generate Demurrage
                    </button>
                  </div>
                  <p className="text-xs text-amber-700">
                    Min. daily charge: {fmtAmt(DEMURRAGE_CONFIG.minimumDailyCharge, demurrageSummary.currency)} |
                    Grace period: {DEMURRAGE_CONFIG.gracePeriodDays} days |
                    Late penalty: {DEMURRAGE_CONFIG.latePaymentPenaltyPercent}%
                  </p>
                </div>

                {/* Previous Demurrage Invoices */}
                {demurrageSummary.demurrageInvoices.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Demurrage Invoice History</p>
                    <div className="space-y-1.5">
                      {demurrageSummary.demurrageInvoices.map((di) => (
                        <div key={di.invoiceNumber} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border text-xs">
                          <div>
                            <span className="font-mono font-semibold">{di.invoiceNumber}</span>
                            <span className="text-gray-400 ml-2">{fmtDate(di.issueDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{fmtAmt(di.amount, demurrageSummary.currency)}</span>
                            <span className={`font-semibold ${statusColors[di.status] || "text-gray-500"}`}>{di.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-500 italic">No demurrage data available. Set a storage end date or demurrage start date on this deposit first.</p>
            )}
          </div>
        )}
      </div>

      {/* ─── INVOICE LIST ──────────────────────────────────── */}
      {loading ? (
        <div className="h-20 bg-gray-50 rounded-xl animate-pulse" />
      ) : invoices.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-3">No invoices yet for this deposit.</p>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => {
            const isOverdue = inv.status === "SENT" && new Date(inv.dueDate) < new Date();
            const isDemurrage = inv.items.some((i) => i.type === "DEMURRAGE_FEE");
            const currency = "USD";
            return (
              <div
                key={inv.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isDemurrage ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    inv.status === "PAID" ? "bg-emerald-100" : isOverdue ? "bg-red-100" : isDemurrage ? "bg-amber-100" : "bg-gray-200"
                  }`}>
                    {inv.status === "PAID" ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ) : isOverdue ? (
                      <Clock className="w-3.5 h-3.5 text-red-600" />
                    ) : isDemurrage ? (
                      <Timer className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-mono font-semibold text-gray-800">
                      {inv.invoiceNumber}
                      {isDemurrage && <span className="ml-1.5 text-amber-600 font-sans">(Demurrage)</span>}
                    </p>
                    <p className="text-xs text-gray-400">
                      {fmtDate(inv.issueDate)} • {inv.items.map((i) => i.description).join(", ").substring(0, 60)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="text-sm font-bold">{fmtAmt(inv.total, currency)}</p>
                    <p className={`text-xs font-semibold ${isOverdue ? "text-red-600" : statusColors[inv.status] || "text-gray-500"}`}>
                      {isOverdue ? "OVERDUE" : inv.status}
                    </p>
                  </div>
                  {isOverdue && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLatePenalty(inv.id); }}
                      disabled={isPending}
                      title="Apply late payment penalty"
                      className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
