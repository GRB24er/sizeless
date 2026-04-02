"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/dashboard/shipments/BillingPanel.tsx
// Admin Vault Billing — Invoice management, payments, batch gen
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useTransition } from "react";
import {
  Banknote,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Loader2,
  Receipt,
  RefreshCw,
  Send,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import {
  getVaultInvoices,
  getBillingStats,
  generateMonthlyInvoices,
  recordInvoicePayment,
  cancelInvoice,
} from "@/app/(root)/shipments/vault-billing-actions";
import { formatCurrencyAmount } from "@/lib/vault/types";

// ─── TYPES ───────────────────────────────────────────────────

type Invoice = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  paidAt: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  subtotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  paymentRef: string | null;
  notes: string | null;
  deposit: { depositNumber: string; custodyReferenceId: string | null };
  client: { name: string; email: string };
  items: {
    id: string;
    type: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
};

type BillingStats = {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  invoiceCount: number;
  paidCount: number;
  overdueCount: number;
  sentCount: number;
};

// ─── STATUS CONFIG ───────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: "Draft", color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
  SENT: { label: "Sent", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  PAID: { label: "Paid", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  OVERDUE: { label: "Overdue", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  CANCELLED: { label: "Cancelled", color: "text-gray-500", bg: "bg-gray-100 border-gray-300" },
};

// ─── PAYMENT DIALOG ──────────────────────────────────────────

function PaymentDialog({
  invoice,
  onClose,
  onSuccess,
  adminId,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
  adminId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(invoice.balanceDue.toString());
  const [method, setMethod] = useState("WIRE_TRANSFER");
  const [ref, setRef] = useState("");

  const handleSubmit = () => {
    if (!ref.trim()) {
      toast.error("Enter a payment reference");
      return;
    }
    startTransition(async () => {
      const res = await recordInvoicePayment(invoice.id, adminId, {
        amount: parseFloat(amount),
        paymentMethod: method,
        paymentRef: ref,
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success(res.fullyPaid ? "Invoice fully paid" : "Payment recorded");
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CreditCard className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold">Record Payment</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-gray-50 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Invoice</span>
              <span className="font-mono font-semibold">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Due</span>
              <span className="font-bold text-lg">{formatCurrencyAmount(invoice.balanceDue, invoice.currency || "USD")}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm font-mono focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-emerald-400 focus:outline-none"
            >
              <option value="WIRE_TRANSFER">Wire Transfer</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="CRYPTO">Cryptocurrency</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Payment Reference <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="e.g. WT-2026-034821"
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm font-mono focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || !ref.trim() || !amount}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {isPending ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INVOICE DETAIL ──────────────────────────────────────────

function InvoiceDetail({
  invoice,
  onBack,
  onRefresh,
  adminId,
}: {
  invoice: Invoice;
  onBack: () => void;
  onRefresh: () => void;
  adminId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [paymentDialog, setPaymentDialog] = useState(false);

  const cfg = statusConfig[invoice.status] || statusConfig.DRAFT;
  const cur = invoice.currency || "USD";
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const fmtCurrency = (n: number) => formatCurrencyAmount(n, cur);

  const handleCancel = () => {
    startTransition(async () => {
      const res = await cancelInvoice(invoice.id, adminId);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Invoice cancelled");
        onRefresh();
        onBack();
      }
    });
  };

  return (
    <div className="space-y-6">
      {paymentDialog && (
        <PaymentDialog
          invoice={invoice}
          onClose={() => setPaymentDialog(false)}
          onSuccess={onRefresh}
          adminId={adminId}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
          <div>
            <h3 className="text-lg font-bold font-mono">{invoice.invoiceNumber}</h3>
            <p className="text-xs text-gray-500">
              Deposit: {invoice.deposit.depositNumber}
              {invoice.deposit.custodyReferenceId && ` • Ref: ${invoice.deposit.custodyReferenceId}`}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold">{fmtCurrency(invoice.total)}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <p className="text-xs text-emerald-700">Paid</p>
            <p className="text-xl font-bold text-emerald-700">{fmtCurrency(invoice.amountPaid)}</p>
          </CardContent>
        </Card>
        <Card className={invoice.balanceDue > 0 ? "bg-red-50 border-red-200" : ""}>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Balance Due</p>
            <p className={`text-xl font-bold ${invoice.balanceDue > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {fmtCurrency(invoice.balanceDue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Due Date</p>
            <p className="text-sm font-semibold">{fmtDate(invoice.dueDate)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Card>
        <CardContent className="p-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Client</span>
            <span className="font-medium">{invoice.client.name} ({invoice.client.email})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Issue Date</span>
            <span className="font-medium">{fmtDate(invoice.issueDate)}</span>
          </div>
          {invoice.periodStart && (
            <div className="flex justify-between">
              <span className="text-gray-500">Period</span>
              <span className="font-medium">{fmtDate(invoice.periodStart)} — {fmtDate(invoice.periodEnd)}</span>
            </div>
          )}
          {invoice.paidAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">Paid On</span>
              <span className="font-medium text-emerald-600">{fmtDate(invoice.paidAt)}</span>
            </div>
          )}
          {invoice.paymentRef && (
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Ref</span>
              <span className="font-mono text-xs">{invoice.paymentRef}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Line Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {invoice.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.description}</p>
                  <p className="text-xs text-gray-400">
                    {item.quantity} × {fmtCurrency(item.unitPrice)}
                  </p>
                </div>
                <p className="text-sm font-semibold">{fmtCurrency(item.amount)}</p>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between pt-2">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-lg font-bold">{fmtCurrency(invoice.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
        <div className="flex flex-wrap gap-3">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setPaymentDialog(true)}
          >
            <CreditCard className="w-4 h-4 mr-2" /> Record Payment
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(`/api/vault-invoices/${invoice.id}?type=pdf`, "_blank")}
          >
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
          <Button variant="destructive" size="sm" onClick={handleCancel} disabled={isPending}>
            <XCircle className="w-4 h-4 mr-2" /> Cancel Invoice
          </Button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN BILLING PANEL
// ═══════════════════════════════════════════════════════════════

export default function BillingPanel({ adminId }: { adminId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    setIsLoading(true);
    const filters = statusFilter !== "ALL" ? { status: statusFilter } : undefined;
    const [invoiceRes, statsRes] = await Promise.all([
      getVaultInvoices(filters),
      getBillingStats(),
    ]);
    setInvoices(invoiceRes.invoices as any);
    setStats(statsRes.stats);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleGenerateMonthly = () => {
    startTransition(async () => {
      const res = await generateMonthlyInvoices(adminId);
      if (res.error) toast.error(res.error);
      else {
        toast.success(res.message);
        loadData();
      }
    });
  };

  const fmtCurrency = (n: number) => formatCurrencyAmount(n, "USD");

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  if (selectedInvoice) {
    return (
      <InvoiceDetail
        invoice={selectedInvoice}
        onBack={() => { setSelectedInvoice(null); loadData(); }}
        onRefresh={loadData}
        adminId={adminId}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vault Billing</h2>
            <p className="text-xs text-gray-500">Invoices, payments & monthly charges</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleGenerateMonthly}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
            Generate Monthly Invoices
          </Button>
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[#0a1628] to-[#122041]">
            <CardContent className="p-4">
              <p className="text-gray-400 text-xs">Total Invoiced</p>
              <p className="text-xl font-bold text-white">{fmtCurrency(stats.totalInvoiced)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.invoiceCount} invoices</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <p className="text-emerald-700 text-xs">Collected</p>
              <p className="text-xl font-bold text-emerald-800">{fmtCurrency(stats.totalPaid)}</p>
              <p className="text-xs text-emerald-600 mt-1">{stats.paidCount} paid</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <p className="text-amber-700 text-xs">Outstanding</p>
              <p className="text-xl font-bold text-amber-800">{fmtCurrency(stats.totalOutstanding)}</p>
              <p className="text-xs text-amber-600 mt-1">{stats.sentCount} pending</p>
            </CardContent>
          </Card>
          <Card className={stats.overdueCount > 0 ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200" : ""}>
            <CardContent className="p-4">
              <p className={`text-xs ${stats.overdueCount > 0 ? "text-red-700" : "text-gray-500"}`}>Overdue</p>
              <p className={`text-xl font-bold ${stats.overdueCount > 0 ? "text-red-800" : "text-gray-400"}`}>
                {stats.overdueCount}
              </p>
              <p className="text-xs text-gray-400 mt-1">invoices</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Invoices</SelectItem>
            <SelectItem value="SENT">Sent (Unpaid)</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Invoice List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No Invoices</h3>
            <p className="text-sm text-gray-500 mt-1">
              Click &quot;Generate Monthly Invoices&quot; to create storage invoices for active deposits.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const cfg = statusConfig[inv.status] || statusConfig.DRAFT;
            const isOverdue = inv.status === "SENT" && new Date(inv.dueDate) < new Date();

            return (
              <Card
                key={inv.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedInvoice(inv)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        inv.status === "PAID" ? "bg-emerald-100" : isOverdue ? "bg-red-100" : "bg-gray-100"
                      }`}>
                        {inv.status === "PAID" ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : isOverdue ? (
                          <Clock className="w-5 h-5 text-red-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-mono text-sm font-bold text-gray-900">{inv.invoiceNumber}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {inv.client.name} • {inv.deposit.depositNumber}
                        </p>
                        {inv.periodStart && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Period: {fmtDate(inv.periodStart)} — {fmtDate(inv.periodEnd!)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{fmtCurrency(inv.total)}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border mt-1 ${
                        isOverdue ? "bg-red-50 border-red-200 text-red-700" : `${cfg.bg} ${cfg.color}`
                      }`}>
                        {isOverdue ? "Overdue" : cfg.label}
                      </span>
                      {inv.balanceDue > 0 && inv.status !== "CANCELLED" && (
                        <p className="text-xs text-red-500 mt-1">Due: {fmtCurrency(inv.balanceDue)}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
