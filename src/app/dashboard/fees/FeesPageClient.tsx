"use client";

import { useState } from "react";
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
  Search,
  Package,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
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

type ShipmentWithFees = {
  id: string;
  trackingNumber: string;
  isPaid: boolean;
  origin: string;
  destination: string;
  serviceType: string;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  status: string;
  fees: Fee[];
};

const FEE_TYPE_LABELS: Record<string, string> = {
  AIRWAY_BILL: "Airway Bill Fee",
  SHIPPING_FREIGHT: "Shipping & Freight",
  HOLD_RELEASE: "Hold Release Fee",
  CUSTOMS_DUTY: "Customs & Duty",
  CUSTOM: "Custom Fee",
};

const CURRENCY_OPTIONS = [
  "USD",
  "GBP",
  "EUR",
  "GHS",
  "ZAR",
  "NGN",
  "AED",
  "CAD",
  "AUD",
];

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount
  );
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

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "delivered")
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        Delivered
      </Badge>
    );
  if (s === "in_transit" || s === "in-transit")
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
        In Transit
      </Badge>
    );
  if (s === "on_hold")
    return (
      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
        On Hold
      </Badge>
    );
  return (
    <Badge className="bg-gray-100 text-gray-700 border-gray-200">
      {status}
    </Badge>
  );
}

export function FeesPageClient({
  shipments: initialShipments,
}: {
  shipments: ShipmentWithFees[];
}) {
  const [shipments, setShipments] = useState(initialShipments);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("all");
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);
  const [addingFeeFor, setAddingFeeFor] = useState<string | null>(null);

  // Add fee form
  const [feeType, setFeeType] = useState("AIRWAY_BILL");
  const [customType, setCustomType] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [reason, setReason] = useState("");

  // Dialogs
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [waiveDialogOpen, setWaiveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Stats
  const allFees = shipments.flatMap((s) => s.fees);
  const totalUnpaid = allFees
    .filter((f) => f.status === "UNPAID")
    .reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = allFees
    .filter((f) => f.status === "PAID")
    .reduce((sum, f) => sum + f.amount, 0);
  const unpaidCount = allFees.filter((f) => f.status === "UNPAID").length;
  const paidCount = allFees.filter((f) => f.status === "PAID").length;

  // Filter shipments
  const filtered = shipments.filter((s) => {
    const matchSearch =
      s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      s.origin.toLowerCase().includes(search.toLowerCase()) ||
      s.destination.toLowerCase().includes(search.toLowerCase());

    if (filter === "unpaid")
      return matchSearch && s.fees.some((f) => f.status === "UNPAID");
    if (filter === "paid")
      return matchSearch && s.fees.length > 0 && s.fees.every((f) => f.status !== "UNPAID");
    return matchSearch;
  });

  const handleAddFee = async (shipmentId: string) => {
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
      setAddingFeeFor(null);
      setFeeType("AIRWAY_BILL");
      setCustomType("");
      setAmount("");
      setReason("");
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
    if (result.success) window.location.reload();
    else alert(result.message);
  };

  const handleDelete = async () => {
    if (!selectedFeeId) return;
    setActionLoading(true);
    const result = await deleteFee(selectedFeeId);
    setActionLoading(false);
    setDeleteDialogOpen(false);
    if (result.success) window.location.reload();
    else alert(result.message);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage fees, invoices and payment receipts for all shipments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <DollarSign className="h-4 w-4" />
            Total Fees
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalPaid + totalUnpaid, "USD")}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {allFees.length} total fees
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-red-600 mb-1">
            <Clock className="h-4 w-4" />
            Outstanding
          </div>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totalUnpaid, "USD")}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {unpaidCount} unpaid fees
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-600 mb-1">
            <CheckCircle className="h-4 w-4" />
            Collected
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(totalPaid, "USD")}
          </p>
          <p className="text-xs text-gray-400 mt-1">{paidCount} paid fees</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Package className="h-4 w-4" />
            Shipments
          </div>
          <p className="text-2xl font-bold text-gray-900">{shipments.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {shipments.filter((s) => s.fees.some((f) => f.status === "UNPAID")).length}{" "}
            with unpaid fees
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by tracking number, recipient, origin..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as typeof filter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Shipments</SelectItem>
            <SelectItem value="unpaid">With Unpaid Fees</SelectItem>
            <SelectItem value="paid">Fully Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Shipments + Fees */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center text-gray-500">
            {search || filter !== "all"
              ? "No shipments match your search"
              : "No shipments found"}
          </div>
        ) : (
          filtered.map((shipment) => {
            const isExpanded = expandedShipment === shipment.id;
            const unpaid = shipment.fees.filter(
              (f) => f.status === "UNPAID"
            );
            const shipmentTotal = shipment.fees.reduce(
              (s, f) => s + f.amount,
              0
            );
            const shipmentUnpaid = unpaid.reduce(
              (s, f) => s + f.amount,
              0
            );

            return (
              <div
                key={shipment.id}
                className="bg-white rounded-lg border overflow-hidden"
              >
                {/* Shipment Header Row */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setExpandedShipment(isExpanded ? null : shipment.id)
                  }
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-mono font-semibold text-sm text-emerald-700">
                        {shipment.trackingNumber}
                      </span>
                    </div>
                    <StatusBadge status={shipment.status} />
                    <span className="text-sm text-gray-500 hidden md:inline truncate">
                      {shipment.origin} → {shipment.destination}
                    </span>
                    <span className="text-sm text-gray-500 hidden lg:inline">
                      {shipment.recipientName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Fee summary */}
                    {shipment.fees.length === 0 ? (
                      <span className="text-xs text-gray-400">No fees</span>
                    ) : unpaid.length > 0 ? (
                      <div className="text-right">
                        <span className="text-sm font-bold text-red-600">
                          {formatCurrency(shipmentUnpaid, "USD")} due
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          / {formatCurrency(shipmentTotal, "USD")} total
                        </span>
                      </div>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        All Paid
                      </Badge>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddingFeeFor(
                          addingFeeFor === shipment.id ? null : shipment.id
                        );
                        setExpandedShipment(shipment.id);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Fee
                    </Button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t">
                    {/* Add Fee Form */}
                    {addingFeeFor === shipment.id && (
                      <div className="px-4 py-4 bg-blue-50/50 border-b">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          Add Fee to {shipment.trackingNumber}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">
                              Fee Type
                            </label>
                            <Select
                              value={feeType}
                              onValueChange={setFeeType}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AIRWAY_BILL">
                                  Airway Bill Fee
                                </SelectItem>
                                <SelectItem value="SHIPPING_FREIGHT">
                                  Shipping & Freight
                                </SelectItem>
                                <SelectItem value="HOLD_RELEASE">
                                  Hold Release Fee
                                </SelectItem>
                                <SelectItem value="CUSTOMS_DUTY">
                                  Customs & Duty
                                </SelectItem>
                                <SelectItem value="CUSTOM">
                                  Custom Fee
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {feeType === "CUSTOM" && (
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">
                                Custom Name
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
                            <Select
                              value={currency}
                              onValueChange={setCurrency}
                            >
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

                          <div className="sm:col-span-2 lg:col-span-4">
                            <label className="text-xs text-gray-500 block mb-1">
                              Reason (included in email to receiver)
                            </label>
                            <Input
                              placeholder="e.g. Customs duty charges for import clearance"
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() => handleAddFee(shipment.id)}
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
                            onClick={() => setAddingFeeFor(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Fees List */}
                    {shipment.fees.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">
                        No fees added — click "Add Fee" above
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {shipment.fees.map((fee) => {
                          const feeLabel =
                            fee.type === "CUSTOM" && fee.customType
                              ? fee.customType
                              : FEE_TYPE_LABELS[fee.type] || fee.type;

                          return (
                            <div
                              key={fee.id}
                              className={`px-4 py-3 flex items-center justify-between ${
                                fee.status === "PAID"
                                  ? "bg-green-50/30"
                                  : fee.status === "WAIVED"
                                  ? "bg-gray-50/50"
                                  : ""
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="font-medium text-sm text-gray-900">
                                    {feeLabel}
                                  </span>
                                  {fee.status === "UNPAID" && (
                                    <Badge
                                      variant="outline"
                                      className="bg-red-50 text-red-600 border-red-200 text-xs"
                                    >
                                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                                      Unpaid
                                    </Badge>
                                  )}
                                  {fee.status === "PAID" && (
                                    <Badge
                                      variant="outline"
                                      className="bg-green-50 text-green-600 border-green-200 text-xs"
                                    >
                                      <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                                      Paid
                                    </Badge>
                                  )}
                                  {fee.status === "WAIVED" && (
                                    <Badge
                                      variant="outline"
                                      className="bg-gray-50 text-gray-400 border-gray-200 text-xs"
                                    >
                                      <XCircle className="h-2.5 w-2.5 mr-0.5" />
                                      Waived
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                  {fee.reason}
                                </p>
                                <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                                  <span>{fee.invoiceNumber}</span>
                                  <span>{formatDate(fee.createdAt)}</span>
                                  {fee.paidAt && (
                                    <span className="text-green-600">
                                      Paid {formatDate(fee.paidAt)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 ml-4 shrink-0">
                                <span
                                  className={`font-bold text-sm ${
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
                                      className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs"
                                      onClick={() => {
                                        setSelectedFeeId(fee.id);
                                        setPayDialogOpen(true);
                                      }}
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Paid
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs"
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
                                      className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
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
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ─── Confirmation Dialogs ─── */}
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

      <AlertDialog open={waiveDialogOpen} onOpenChange={setWaiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Waive Fee</AlertDialogTitle>
            <AlertDialogDescription>
              No payment will be required. This cannot be undone.
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fee</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete this fee. Cannot be undone.
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
