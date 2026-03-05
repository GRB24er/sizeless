"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/dashboard/shipments/WithdrawalSection.tsx
// Admin Withdrawal Management — Shows in deposit detail view
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import {
  ArrowUpRight,
  Banknote,
  CheckCircle,
  Clock,
  Lock,
  Package,
  Shield,
  Truck,
  XCircle,
} from "lucide-react";

import {
  WithdrawalApproveDialog,
  WithdrawalCompleteDialog,
} from "./WithdrawalDialogs";

type Withdrawal = {
  id: string;
  type: string;
  status: string;
  requestedBy: string;
  requestDate: string;
  requestNotes: string | null;
  collectionMethod: string | null;
  bullionDealerName: string | null;
  bullionDealerRef: string | null;
  bankAccountRef: string | null;
  spotPriceAtSale: number | null;
  saleAmount: number | null;
  wireTransferRef: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  complianceNotes: string | null;
  completedAt: string | null;
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  REQUESTED: { label: "Pending Review", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  APPROVED: { label: "Approved", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: CheckCircle },
  COMPLETED: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle },
};

const typeLabels: Record<string, { label: string; icon: typeof Package }> = {
  PHYSICAL: { label: "Physical Withdrawal", icon: Package },
  LIQUIDATION: { label: "Liquidation (Sell)", icon: Banknote },
  VAULT_TRANSFER: { label: "Vault Transfer", icon: Lock },
};

export default function WithdrawalSection({
  withdrawals,
  adminId,
  onRefresh,
}: {
  withdrawals: Withdrawal[];
  adminId: string;
  onRefresh: () => void;
}) {
  const [approveDialog, setApproveDialog] = useState<Withdrawal | null>(null);
  const [completeDialog, setCompleteDialog] = useState<Withdrawal | null>(null);

  if (withdrawals.length === 0) return null;

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
        <ArrowUpRight className="w-3.5 h-3.5" /> Withdrawal Requests
        <span className="ml-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
          {withdrawals.length}
        </span>
      </p>

      {/* Dialogs */}
      {approveDialog && (
        <WithdrawalApproveDialog
          open={!!approveDialog}
          onClose={() => setApproveDialog(null)}
          withdrawal={approveDialog}
          adminId={adminId}
          onSuccess={onRefresh}
        />
      )}
      {completeDialog && (
        <WithdrawalCompleteDialog
          open={!!completeDialog}
          onClose={() => setCompleteDialog(null)}
          withdrawal={completeDialog}
          adminId={adminId}
          onSuccess={onRefresh}
        />
      )}

      {withdrawals.map((w) => {
        const sConfig = statusConfig[w.status] || statusConfig.REQUESTED;
        const tConfig = typeLabels[w.type] || typeLabels.PHYSICAL;
        const StatusIcon = sConfig.icon;
        const TypeIcon = tConfig.icon;

        return (
          <div
            key={w.id}
            className={`rounded-xl border ${sConfig.bg} overflow-hidden`}
          >
            {/* Header */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center">
                    <TypeIcon className="w-4.5 h-4.5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {tConfig.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Requested: {formatDate(w.requestDate)}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${sConfig.bg} ${sConfig.color}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {sConfig.label}
                </span>
              </div>

              {/* Details */}
              <div className="mt-3 space-y-1.5 text-sm">
                {w.collectionMethod && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Collection</span>
                    <span className="font-medium">
                      {w.collectionMethod === "ARMORED_TRANSPORT"
                        ? "Armored Transport"
                        : "Client Pickup"}
                    </span>
                  </div>
                )}
                {w.bullionDealerName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dealer</span>
                    <span className="font-medium">{w.bullionDealerName}</span>
                  </div>
                )}
                {w.bankAccountRef && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Wire To</span>
                    <span className="font-mono text-xs">{w.bankAccountRef}</span>
                  </div>
                )}
                {w.requestNotes && (
                  <div className="pt-2 border-t border-gray-200/50">
                    <p className="text-xs text-gray-500">{w.requestNotes}</p>
                  </div>
                )}
              </div>

              {/* Approval info */}
              {w.approvedAt && (
                <div className="mt-3 pt-3 border-t border-gray-200/50 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Approved</span>
                    <span className="font-medium">{formatDate(w.approvedAt)}</span>
                  </div>
                  {w.complianceNotes && (
                    <p className="text-xs text-gray-500">{w.complianceNotes}</p>
                  )}
                </div>
              )}

              {/* Liquidation results */}
              {w.saleAmount && (
                <div className="mt-3 pt-3 border-t border-gray-200/50">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Sale Amount</p>
                      <p className="text-sm font-bold text-emerald-700">
                        ${w.saleAmount.toLocaleString()}
                      </p>
                    </div>
                    {w.spotPriceAtSale && (
                      <div>
                        <p className="text-xs text-gray-500">Spot Price</p>
                        <p className="text-sm font-medium">${w.spotPriceAtSale}</p>
                      </div>
                    )}
                    {w.wireTransferRef && (
                      <div>
                        <p className="text-xs text-gray-500">Wire Ref</p>
                        <p className="text-xs font-mono">{w.wireTransferRef}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {(w.status === "REQUESTED" || w.status === "APPROVED") && (
              <div className="px-4 py-3 bg-white/50 border-t border-gray-200/30 flex justify-end gap-2">
                {w.status === "REQUESTED" && (
                  <button
                    onClick={() => setApproveDialog(w)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Review & Approve
                  </button>
                )}
                {w.status === "APPROVED" && (
                  <button
                    onClick={() => setCompleteDialog(w)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0a1628] text-[#D4A853] text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {w.type === "LIQUIDATION" ? "Complete Liquidation" : "Complete Release"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
