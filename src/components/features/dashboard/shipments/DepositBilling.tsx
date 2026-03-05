"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/dashboard/shipments/DepositBilling.tsx
// Per-deposit billing — Generate fee invoices, view history
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useTransition } from "react";
import {
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Receipt,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  generateTransactionInvoice,
  getVaultInvoices,
} from "@/app/(root)/shipments/vault-billing-actions";

type DepositInvoice = {
  id: string;
  invoiceNumber: string;
  total: number;
  balanceDue: number;
  status: string;
  issueDate: string;
  dueDate: string;
  items: { description: string; amount: number }[];
};

const feeButtons = [
  { key: "INTAKE", label: "Intake Fees", desc: "Handling + KYC ($325)", icon: "📦" },
  { key: "INTAKE_ESCORT", label: "Intake + Escort", desc: "Handling + KYC + Escort ($775)", icon: "🛡️" },
  { key: "ASSAY", label: "Assay Fee", desc: "Testing fee (from $150)", icon: "🔬" },
  { key: "WITHDRAWAL", label: "Withdrawal Fee", desc: "Physical release ($350)", icon: "📤" },
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

  const loadInvoices = async () => {
    setLoading(true);
    const res = await getVaultInvoices({ depositId });
    setInvoices(res.invoices as any);
    setLoading(false);
  };

  useEffect(() => {
    loadInvoices();
  }, [depositId]);

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

  const fmtCurrency = (n: number) => `$${n.toFixed(2)}`;
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

      {/* Invoice List */}
      {loading ? (
        <div className="h-20 bg-gray-50 rounded-xl animate-pulse" />
      ) : invoices.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-3">No invoices yet for this deposit.</p>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => {
            const isOverdue = inv.status === "SENT" && new Date(inv.dueDate) < new Date();
            return (
              <div
                key={inv.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    inv.status === "PAID" ? "bg-emerald-100" : isOverdue ? "bg-red-100" : "bg-gray-200"
                  }`}>
                    {inv.status === "PAID" ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    ) : isOverdue ? (
                      <Clock className="w-3.5 h-3.5 text-red-600" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-mono font-semibold text-gray-800">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-400">
                      {fmtDate(inv.issueDate)} • {inv.items.map((i) => i.description).join(", ").substring(0, 50)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{fmtCurrency(inv.total)}</p>
                  <p className={`text-xs font-semibold ${isOverdue ? "text-red-600" : statusColors[inv.status] || "text-gray-500"}`}>
                    {isOverdue ? "OVERDUE" : inv.status}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
