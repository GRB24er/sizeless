"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/dashboard/shipments/TransferSection.tsx
// Vault Transfer Tracking — Shows transfer history per deposit
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useTransition } from "react";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Globe,
  Loader2,
  Lock,
  Package,
  Shield,
  Truck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  getVaultTransfers,
  updateTransferStatus,
} from "@/app/(root)/shipments/vault-advanced-actions";

type Transfer = {
  id: string;
  transferNumber: string;
  sourceVault: string;
  sourceUnit: string | null;
  destinationVault: string;
  destinationUnit: string | null;
  destinationCustodian: string | null;
  status: string;
  transferType: string;
  weightTransferred: number;
  estimatedArrival: string | null;
  actualArrival: string | null;
  sealNumbers: string | null;
  securityEscortRef: string | null;
  transitInsuredValue: number | null;
  transferFee: number | null;
  initiatedAt: string;
  approvedAt: string | null;
  completedAt: string | null;
  cancellationReason: string | null;
  notes: string | null;
};

const statusFlow: Record<string, { label: string; color: string; bg: string; icon: typeof Clock; next?: string; nextLabel?: string }> = {
  INITIATED: { label: "Initiated", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Clock, next: "APPROVED", nextLabel: "Approve" },
  COMPLIANCE_CHECK: { label: "Compliance", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: Shield, next: "APPROVED", nextLabel: "Clear Compliance" },
  APPROVED: { label: "Approved", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle, next: "IN_TRANSIT", nextLabel: "Mark In Transit" },
  IN_TRANSIT: { label: "In Transit", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", icon: Truck, next: "RECEIVED", nextLabel: "Mark Received" },
  RECEIVED: { label: "Received", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", icon: Package, next: "COMPLETED", nextLabel: "Complete Transfer" },
  COMPLETED: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "text-gray-500", bg: "bg-gray-100 border-gray-300", icon: XCircle },
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function TransferSection({
  depositId,
  adminId,
}: {
  depositId: string;
  adminId: string;
}) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    setLoading(true);
    const res = await getVaultTransfers(depositId);
    setTransfers(res.transfers as any);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [depositId]);

  const handleAdvance = (transferId: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateTransferStatus(transferId, adminId, newStatus);
      if (res.error) toast.error(res.error);
      else { toast.success(`Transfer updated to ${newStatus.replace(/_/g, " ")}`); loadData(); }
    });
  };

  const handleCancel = (transferId: string) => {
    startTransition(async () => {
      const res = await updateTransferStatus(transferId, adminId, "CANCELLED", {
        cancellationReason: "Cancelled by admin",
      });
      if (res.error) toast.error(res.error);
      else { toast.success("Transfer cancelled"); loadData(); }
    });
  };

  if (loading) return <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />;
  if (transfers.length === 0) return null;

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
        <Globe className="w-3.5 h-3.5" /> Vault Transfers
        <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
          {transfers.length}
        </span>
      </p>

      {transfers.map((t) => {
        const cfg = statusFlow[t.status] || statusFlow.INITIATED;
        const StatusIcon = cfg.icon;

        return (
          <div key={t.id} className={`rounded-xl border ${cfg.bg} overflow-hidden`}>
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-sm font-bold text-gray-900">{t.transferNumber}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t.transferType === "PARTIAL" ? "Partial" : "Full"} transfer •
                    {t.weightTransferred}g
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
                  <StatusIcon className="w-3 h-3" /> {cfg.label}
                </span>
              </div>

              {/* Route */}
              <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-white/60">
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500">From</p>
                  <p className="text-sm font-semibold">{t.sourceVault}</p>
                  {t.sourceUnit && <p className="text-xs text-gray-400">Unit: {t.sourceUnit}</p>}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex-1 text-center">
                  <p className="text-xs text-gray-500">To</p>
                  <p className="text-sm font-semibold">{t.destinationVault}</p>
                  {t.destinationUnit && <p className="text-xs text-gray-400">Unit: {t.destinationUnit}</p>}
                </div>
              </div>

              {/* Details */}
              <div className="mt-3 space-y-1.5 text-sm">
                {t.destinationCustodian && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Custodian</span>
                    <span className="font-medium">{t.destinationCustodian}</span>
                  </div>
                )}
                {t.estimatedArrival && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">ETA</span>
                    <span className="font-medium">{fmtDate(t.estimatedArrival)}</span>
                  </div>
                )}
                {t.sealNumbers && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Seal #</span>
                    <span className="font-mono text-xs">{t.sealNumbers}</span>
                  </div>
                )}
                {t.transitInsuredValue && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Insured</span>
                    <span className="font-medium">${t.transitInsuredValue.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Initiated</span>
                  <span className="text-xs">{fmtDate(t.initiatedAt)}</span>
                </div>
                {t.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Completed</span>
                    <span className="text-xs text-emerald-600">{fmtDate(t.completedAt)}</span>
                  </div>
                )}
              </div>

              {t.notes && (
                <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200/50">{t.notes}</p>
              )}
            </div>

            {/* Actions */}
            {!["COMPLETED", "CANCELLED"].includes(t.status) && (
              <div className="px-4 py-2.5 bg-white/50 border-t border-gray-200/30 flex justify-between">
                <button
                  onClick={() => handleCancel(t.id)}
                  disabled={isPending}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 text-xs font-semibold disabled:opacity-50"
                >
                  <XCircle className="w-3 h-3" /> Cancel
                </button>
                {cfg.next && (
                  <button
                    onClick={() => handleAdvance(t.id, cfg.next!)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                    {cfg.nextLabel}
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
