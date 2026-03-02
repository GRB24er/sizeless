"use client";

import { useState, useTransition } from "react";
import {
  DollarSign,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  Loader2,
  Send,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  addShipmentFee,
  markFeePaid,
  waiveFee,
  deleteFee,
} from "@/app/dashboard/shipments/fee-actions";

type Fee = {
  id: string;
  type: string;
  customType: string | null;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  invoiceNumber: string;
  invoiceSentAt: string | null;
  paidAt: string | null;
  receiptSentAt: string | null;
  createdAt: string;
};

type FeesPanelProps = {
  shipmentId: string;
  fees: Fee[];
};

const FEE_TYPE_LABELS: Record<string, string> = {
  AIRWAY_BILL: "Airway Bill Fee",
  SHIPPING_FREIGHT: "Shipping & Freight",
  HOLD_RELEASE: "Hold Release Fee",
  CUSTOMS_DUTY: "Customs & Duty",
  CUSTOM: "Custom Fee",
};

const CURRENCY_OPTIONS = ["USD", "GBP", "EUR", "GHS", "ZAR", "NGN", "AED", "CAD", "AUD"];

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FeesPanel({ shipmentId, fees: initialFees }: FeesPanelProps) {
  const [fees, setFees] = useState(initialFees);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [feeType, setFeeType] = useState("AIRWAY_BILL");
  const [customType, setCustomType] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [reason, setReason] = useState("");

  // Confirmation dialogs
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [waiveDialogOpen, setWaiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const totalUnpaid = fees
    .filter((f) => f.status === "UNPAID")
    .reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = fees
    .filter((f) => f.status === "PAID")
    .reduce((sum, f) => sum + f.amount, 0);

  const handleAddFee = async () => {
    const formData = new FormData();
    formData.set("shipmentId", shipmentId);
    formData.set("type", feeType);
    formData.set("customType", customType);
    formData.set("amount", amount);
    formData.set("currency", currency);
    formData.set("reason", reason);

    setActionLoading(true);
    const result = await addShipmentFee(formData);
    setActionLoading(false);

    if (result.success) {
      alert(result.message);
      setShowAddForm(false);
      setFeeType("AIRWAY_BILL");
      setCustomType("");
      setAmount("");
      setReason("");
      // Refresh the page to get updated fees
      window.location.reload();
    } else {
      alert(result.message);
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedFeeId) return;
    setActionLoading(true);
    const result = await markFeePaid(selectedFeeId);
    setActionLoading(false);
    setPayDialogOpen(false);

    if (result.success) {
      alert(result.message);
      window.location.reload();
    } else {
      alert(result.message);
    }
  };

  const handleWaive = async () => {
    if (!selectedFeeId) return;
    setActionLoading(true);
    const result = await waiveFee(selectedFeeId);
    setActionLoading(false);
    setWaiveDialogOpen(false);

    if (result.success) {
      window.location.reload();
    } else {
      alert(result.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedFeeId) return;
    setActionLoading(true);
    const result = await deleteFee(selectedFeeId);
    setActionLoading(false);
    setDeleteDialogOpen(false);

    if (result.success) {
      setFees((prev) => prev.filter((f) => f.id !== selectedFeeId));
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              Fees & Payments
            </h2>
            {fees.filter((f) => f.status === "UNPAID").length > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                {fees.filter((f) => f.status === "UNPAID").length} unpaid
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Fee
          </Button>
        </div>
      </div>

      {/* Summary Bar */}
      {fees.length > 0 && (
        <div className="grid grid-cols-3 gap-4 px-4 py-3 bg-gray-50 border-b">
          <div>
            <p className="text-xs text-gray-500">Total Fees</p>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(totalPaid + totalUnpaid, "USD")}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Paid</p>
            <p className="text-lg font-bold text-emerald-600">
              {formatCurrency(totalPaid, "USD")}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Outstanding</p>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(totalUnpaid, "USD")}
            </p>
          </div>
        </div>
      )}

      {/* Add Fee Form */}
      {showAddForm && (
        <div className="px-4 py-4 border-b border-gray-200 bg-blue-50/50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Add New Fee
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Fee Type
              </label>
              <Select value={feeType} onValueChange={setFeeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AIRWAY_BILL">Airway Bill Fee</SelectItem>
                  <SelectItem value="SHIPPING_FREIGHT">
                    Shipping & Freight
                  </SelectItem>
                  <SelectItem value="HOLD_RELEASE">
                    Hold Release Fee
                  </SelectItem>
                  <SelectItem value="CUSTOMS_DUTY">
                    Customs & Duty
                  </SelectItem>
                  <SelectItem value="CUSTOM">Custom Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {feeType === "CUSTOM" && (
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Custom Fee Name
                </label>
                <Input
                  placeholder="e.g. Inspection Fee"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Amount
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Currency
              </label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 block mb-1">
                Reason (will be included in the email)
              </label>
              <Input
                placeholder="e.g. Customs duty charges for import clearance in Accra, Ghana"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={handleAddFee}
              disabled={actionLoading || !amount || !reason}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Add Fee & Email Invoice
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Fees List */}
      <div className="divide-y divide-gray-100">
        {fees.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-sm">
            No fees added to this shipment
          </div>
        ) : (
          fees.map((fee) => {
            const feeLabel =
              fee.type === "CUSTOM" && fee.customType
                ? fee.customType
                : FEE_TYPE_LABELS[fee.type] || fee.type;

            return (
              <div
                key={fee.id}
                className={`px-4 py-4 ${
                  fee.status === "PAID"
                    ? "bg-green-50/30"
                    : fee.status === "WAIVED"
                    ? "bg-gray-50/50"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {feeLabel}
                      </span>
                      {fee.status === "UNPAID" && (
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Unpaid
                        </Badge>
                      )}
                      {fee.status === "PAID" && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      )}
                      {fee.status === "WAIVED" && (
                        <Badge
                          variant="outline"
                          className="bg-gray-50 text-gray-500 border-gray-200"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Waived
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{fee.reason}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>Invoice: {fee.invoiceNumber}</span>
                      <span>Added: {formatDate(fee.createdAt)}</span>
                      {fee.invoiceSentAt && (
                        <span>Invoice sent: {formatDate(fee.invoiceSentAt)}</span>
                      )}
                      {fee.paidAt && (
                        <span className="text-green-600">
                          Paid: {formatDate(fee.paidAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <span
                      className={`text-lg font-bold ${
                        fee.status === "PAID"
                          ? "text-green-600"
                          : fee.status === "WAIVED"
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {formatCurrency(fee.amount, fee.currency)}
                    </span>

                    {fee.status === "UNPAID" && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                          onClick={() => {
                            setSelectedFeeId(fee.id);
                            setPayDialogOpen(true);
                          }}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark Paid
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => {
                            setSelectedFeeId(fee.id);
                            setWaiveDialogOpen(true);
                          }}
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Waive
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setSelectedFeeId(fee.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ─── Confirmation Dialogs ─── */}

      {/* Mark as Paid */}
      <AlertDialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the fee as paid, generate a receipt PDF, and
              automatically email it to the receiver. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMarkPaid}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Confirm & Send Receipt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Waive Fee */}
      <AlertDialog open={waiveDialogOpen} onOpenChange={setWaiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Waive Fee</AlertDialogTitle>
            <AlertDialogDescription>
              This will waive the fee — no payment will be required. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWaive}
              disabled={actionLoading}
              className="bg-gray-600 hover:bg-gray-700"
            >
              Waive Fee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Fee */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fee</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this fee. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
