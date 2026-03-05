"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/dashboard/shipments/VaultPanel.tsx
// Admin Vault Custody Panel — With Intake/Assay/Storage Dialogs
// ═══════════════════════════════════════════════════════════════

import VaultDocuments from "./VaultDocuments";
import { EditDepositDialog, DeleteClientButton } from "./EditDepositDialog";
import { deleteVaultDeposit } from "@/app/(root)/shipments/vault-actions";
import WithdrawalSection from "./WithdrawalSection";
import DepositBilling from "./DepositBilling";
import TransferSection from "./TransferSection";
import BeneficiaryManager from "./BeneficiaryManager";
import { VaultTransferDialog, PartialWithdrawalDialog } from "./AdvancedDialogs";
import { WithdrawalRequestDialog } from "./WithdrawalDialogs";
import { useState, useEffect, useTransition } from "react";
import {
  Pencil,
  Trash2,
  Shield,
  Lock,
  Search,
  FileText,
  Truck,
  ArrowUpRight,
  ChevronRight,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Package,
  Scale,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
  VAULT_STATUS_CONFIG,
  ASSET_TYPE_LABELS,
  STORAGE_TYPE_CONFIG,
  VAULT_LIFECYCLE_PHASES,
} from "@/lib/vault/types";

import {
  getVaultDeposits,
  updateVaultStatus,
  approveKYC,
  addVaultNote,
} from "@/app/(root)/shipments/vault-actions";

import {
  IntakeDialog,
  AssayDialog,
  StorageDialog,
  InsuranceDialog,
} from "./VaultDialogs";

// ─── TYPE ────────────────────────────────────────────────────

type VaultDeposit = {
  id: string;
  depositNumber: string;
  status: string;
  assetType: string;
  description: string;
  weightGrams: number;
  purity: string | null;
  quantity: number;
  serialNumbers: string | null;
  refinerName: string | null;
  isLBMACertified: boolean;
  declaredValue: number;
  verifiedValue: number | null;
  storageType: string;
  vaultLocation: string;
  storageUnit: string | null;
  shelfPosition: string | null;
  insuredValue: number | null;
  insuranceProvider: string | null;
  insurancePolicyNo: string | null;
  monthlyStorageFee: number | null;
  custodyReferenceId: string | null;
  assayStatus: string;
  assayMethod: string | null;
  assayResult: string | null;
  weightVerified: number | null;
  weightDiscrepancy: number | null;
  appointmentDate: string | null;
  intakeMethod: string;
  depositDate: string;
  createdAt: string;
  client: { id: string; name: string; email: string };
  activities: {
    id: string;
    action: string;
    description: string;
    performedBy: string | null;
    createdAt: string;
  }[];
  withdrawals: {
    id: string;
    type: string;
    status: string;
    requestDate: string;
  }[];
};

// ─── LIFECYCLE PROGRESS BAR ──────────────────────────────────

function LifecycleProgress({ status }: { status: string }) {
  const currentPhase = VAULT_LIFECYCLE_PHASES.findIndex((p) =>
    p.statuses.includes(status)
  );

  const icons: Record<string, React.ReactNode> = {
    Shield: <Shield className="h-3.5 w-3.5" />,
    Truck: <Truck className="h-3.5 w-3.5" />,
    Search: <Search className="h-3.5 w-3.5" />,
    FileText: <FileText className="h-3.5 w-3.5" />,
    Lock: <Lock className="h-3.5 w-3.5" />,
    ArrowUpRight: <ArrowUpRight className="h-3.5 w-3.5" />,
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {VAULT_LIFECYCLE_PHASES.map((phase, i) => {
        const isActive = i === currentPhase;
        const isComplete = i < currentPhase;

        return (
          <div key={phase.key} className="flex items-center">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : isComplete
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {isComplete ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                icons[phase.icon]
              )}
              <span className="hidden sm:inline whitespace-nowrap">
                {phase.label}
              </span>
            </div>
            {i < VAULT_LIFECYCLE_PHASES.length - 1 && (
              <ChevronRight
                className={`h-3 w-3 mx-0.5 ${
                  isComplete ? "text-emerald-400" : "text-gray-300"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── STATUS BADGE ────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config = VAULT_STATUS_CONFIG[status] || {
    label: status,
    color: "text-gray-700",
    bgColor: "bg-gray-50 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bgColor} ${config.color}`}
    >
      {config.label}
    </span>
  );
}

// ─── DEPOSIT CARD ────────────────────────────────────────────

function DepositCard({
  deposit,
  onSelect,
}: {
  deposit: VaultDeposit;
  onSelect: () => void;
}) {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(v);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border border-gray-100"
      onClick={onSelect}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-mono text-sm font-bold text-gray-900">
              {deposit.depositNumber}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {deposit.client.name} — {deposit.client.email}
            </p>
          </div>
          <StatusBadge status={deposit.status} />
        </div>

        <LifecycleProgress status={deposit.status} />

        <Separator className="my-3" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <p className="text-gray-500">Asset</p>
            <p className="font-medium mt-0.5">
              {ASSET_TYPE_LABELS[deposit.assetType] || deposit.assetType}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Weight</p>
            <p className="font-medium mt-0.5">{deposit.weightGrams}g</p>
          </div>
          <div>
            <p className="text-gray-500">Declared Value</p>
            <p className="font-medium mt-0.5">
              {formatCurrency(deposit.declaredValue)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Storage</p>
            <p className="font-medium mt-0.5">
              {STORAGE_TYPE_CONFIG[deposit.storageType]?.label ||
                deposit.storageType}
            </p>
          </div>
        </div>

        {deposit.custodyReferenceId && (
          <div className="mt-3 flex items-center gap-2">
            <Lock className="h-3 w-3 text-emerald-500" />
            <span className="text-xs text-gray-500">
              Custody Ref:{" "}
              <span className="font-mono font-semibold text-gray-700">
                {deposit.custodyReferenceId}
              </span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── DEPOSIT DETAIL VIEW (WITH DIALOGS) ─────────────────────

function DepositDetail({
  deposit,
  adminId,
  onBack,
  onRefresh,
}: {
  deposit: VaultDeposit;
  adminId: string;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");

  // Dialog states
  const [intakeDialogOpen, setIntakeDialogOpen] = useState(false);
  const [assayDialogOpen, setAssayDialogOpen] = useState(false);
  const [storageDialogOpen, setStorageDialogOpen] = useState(false);
  const [insuranceDialogOpen, setInsuranceDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [partialWithdrawalOpen, setPartialWithdrawalOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(v);

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

  // ── Action Handlers ──

  const handleStatusUpdate = (newStatus: string, msg: string) => {
    startTransition(async () => {
      const res = await updateVaultStatus(deposit.id, newStatus, adminId, msg);
      if (res.error) toast.error(res.error);
      else {
        toast.success(msg);
        onRefresh();
      }
    });
  };

  const handleApproveKYC = () => {
    startTransition(async () => {
      const res = await approveKYC(deposit.id, adminId);
      if (res.error) toast.error(res.error);
      else {
        toast.success("KYC Approved — client cleared for deposit");
        onRefresh();
      }
    });
  };

  const handleAddNote = () => {
    if (!note.trim()) return;
    startTransition(async () => {
      const res = await addVaultNote(deposit.id, adminId, note);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Note added");
        setNote("");
        onRefresh();
      }
    });
  };

  // ── Status-based actions with dialog openers ──

  const getActions = () => {
    switch (deposit.status) {
      case "KYC_REVIEW":
        return (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApproveKYC}
              disabled={isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve KYC
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() =>
                handleStatusUpdate("KYC_REJECTED", "KYC rejected")
              }
              disabled={isPending}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject KYC
            </Button>
          </div>
        );

      case "KYC_APPROVED":
        return (
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIntakeDialogOpen(true)}
            disabled={isPending}
          >
            <Truck className="h-4 w-4 mr-1" />
            Schedule Intake Appointment
          </Button>
        );

      case "INTAKE_SCHEDULED":
        return (
          <div className="space-y-3">
            {deposit.appointmentDate && (
              <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg p-3 border border-blue-200">
                <Clock className="h-4 w-4" />
                <span>
                  Appointment:{" "}
                  <strong>{formatDate(deposit.appointmentDate)}</strong>
                </span>
                <span className="text-blue-500">•</span>
                <span>
                  {deposit.intakeMethod === "ARMORED_TRANSPORT"
                    ? "Armored Transport"
                    : deposit.intakeMethod === "VAULT_TRANSFER"
                    ? "Vault Transfer"
                    : "Client Delivery"}
                </span>
              </div>
            )}
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() =>
                handleStatusUpdate(
                  "INTAKE_IN_PROGRESS",
                  "Asset intake started — receiving at facility"
                )
              }
              disabled={isPending}
            >
              <Package className="h-4 w-4 mr-1" />
              Start Intake
            </Button>
          </div>
        );

      case "INTAKE_IN_PROGRESS":
        return (
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() =>
              handleStatusUpdate(
                "PENDING_VERIFICATION",
                "Intake complete — asset received, pending verification"
              )
            }
            disabled={isPending}
          >
            <Search className="h-4 w-4 mr-1" />
            Complete Intake → Verification
          </Button>
        );

      case "PENDING_VERIFICATION":
        return (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => setAssayDialogOpen(true)}
              disabled={isPending}
            >
              <Scale className="h-4 w-4 mr-1" />
              Run Assay Testing
            </Button>
            {deposit.isLBMACertified && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAssayDialogOpen(true)}
                disabled={isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Waive Assay (LBMA)
              </Button>
            )}
          </div>
        );

      case "ASSAY_IN_PROGRESS":
        return (
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => setAssayDialogOpen(true)}
            disabled={isPending}
          >
            <Scale className="h-4 w-4 mr-1" />
            Record Assay Results
          </Button>
        );

      case "VERIFICATION_COMPLETE":
        return (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setInsuranceDialogOpen(true)}
              disabled={isPending}
            >
              <Shield className="h-4 w-4 mr-1" />
              Set Insurance Coverage
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() =>
                handleStatusUpdate("DOCUMENTED", "Custody documents issued")
              }
              disabled={isPending}
            >
              <FileText className="h-4 w-4 mr-1" />
              Issue Documentation
            </Button>
          </div>
        );

      case "DOCUMENTED":
        return (
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setStorageDialogOpen(true)}
            disabled={isPending}
          >
            <Lock className="h-4 w-4 mr-1" />
            Assign Storage Location
          </Button>
        );

      case "IN_STORAGE":
        return (
          <div className="flex flex-wrap gap-2">
            {!deposit.insuredValue && (
              <Button
                size="sm"
                variant="outline"
                className="text-blue-600 border-blue-300"
                onClick={() => setInsuranceDialogOpen(true)}
                disabled={isPending}
              >
                <Shield className="h-4 w-4 mr-1" />
                Add Insurance
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-orange-600 border-orange-300"
              onClick={() =>
                handleStatusUpdate(
                  "RELEASE_REQUESTED",
                  "Release requested by admin"
                )
              }
              disabled={isPending}
            >
              <ArrowUpRight className="h-4 w-4 mr-1" />
              Request Release
            </Button>
          </div>
        );

      case "RELEASE_REQUESTED":
        return (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() =>
                handleStatusUpdate(
                  "RELEASE_APPROVED",
                  "Release approved — compliance cleared"
                )
              }
              disabled={isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve Release
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() =>
                handleStatusUpdate("IN_STORAGE", "Release request denied")
              }
              disabled={isPending}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Deny
            </Button>
          </div>
        );

      case "RELEASE_APPROVED":
        return (
          <Button
            size="sm"
            className="bg-gray-800 hover:bg-gray-900 text-white"
            onClick={() =>
              handleStatusUpdate("RELEASED", "Asset released from vault")
            }
            disabled={isPending}
          >
            <ArrowUpRight className="h-4 w-4 mr-1" />
            Confirm Release
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Workflow Dialogs ── */}
      <IntakeDialog
        open={intakeDialogOpen}
        onClose={() => setIntakeDialogOpen(false)}
        depositId={deposit.id}
        adminId={adminId}
        onSuccess={onRefresh}
      />
      <AssayDialog
        open={assayDialogOpen}
        onClose={() => setAssayDialogOpen(false)}
        depositId={deposit.id}
        adminId={adminId}
        declaredWeight={deposit.weightGrams}
        isLBMA={deposit.isLBMACertified}
        onSuccess={onRefresh}
      />
      <StorageDialog
        open={storageDialogOpen}
        onClose={() => setStorageDialogOpen(false)}
        depositId={deposit.id}
        adminId={adminId}
        weightGrams={deposit.weightGrams}
        onSuccess={onRefresh}
      />
      <InsuranceDialog
        open={insuranceDialogOpen}
        onClose={() => setInsuranceDialogOpen(false)}
        depositId={deposit.id}
        adminId={adminId}
        declaredValue={deposit.declaredValue}
        onSuccess={onRefresh}
      />

      <WithdrawalRequestDialog
        open={withdrawalDialogOpen}
        onClose={() => setWithdrawalDialogOpen(false)}
        depositId={deposit.id}
        adminId={adminId}
        depositNumber={deposit.depositNumber}
        weightGrams={deposit.weightGrams}
        declaredValue={deposit.declaredValue}
        onSuccess={onRefresh}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <div>
            <h3 className="text-lg font-bold font-mono">
                {deposit.depositNumber}
              </h3>
              <p className="text-xs text-gray-500">
                Custody Ref: {deposit.custodyReferenceId || "Pending"}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setEditDialogOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
              <DeleteClientButton
                clientId={deposit.client?.id || ""}
                clientName={deposit.client?.name || "Client"}
                adminId={adminId}
                onSuccess={() => { onBack(); onRefresh(); }}
              />
          </div>
        </div>
        <StatusBadge status={deposit.status} />
      </div>

      {/* Lifecycle Progress */}
      <LifecycleProgress status={deposit.status} />

      {/* Admin Actions */}
      <Card className="border-2 border-dashed border-emerald-200 bg-emerald-50/30">
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-3">
            Next Action
          </p>
          {getActions() || (
            <p className="text-sm text-gray-500">
              No actions available for this status.
            </p>
          )}
        </CardContent>
      </Card>

            {/* Documents */}
      <VaultDocuments
        depositId={deposit.id}
        depositStatus={deposit.status}
        hasInsurance={!!deposit.insuredValue}
        hasAssay={deposit.assayStatus === "PASSED" || deposit.assayStatus === "WAIVED"}
      />

      {/* Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Asset Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" /> Asset Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="font-medium">
                {ASSET_TYPE_LABELS[deposit.assetType]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Description</span>
              <span className="font-medium text-right max-w-[60%]">
                {deposit.description}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Quantity</span>
              <span className="font-medium">{deposit.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Weight</span>
              <span className="font-medium">{deposit.weightGrams}g</span>
            </div>
            {deposit.purity && (
              <div className="flex justify-between">
                <span className="text-gray-500">Purity / Fineness</span>
                <span className="font-medium">{deposit.purity}</span>
              </div>
            )}
            {deposit.refinerName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Refiner</span>
                <span className="font-medium">{deposit.refinerName}</span>
              </div>
            )}
            {deposit.serialNumbers && (
              <div className="flex justify-between">
                <span className="text-gray-500">Serial Numbers</span>
                <span className="font-mono text-xs text-right max-w-[60%]">
                  {deposit.serialNumbers}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">LBMA Certified</span>
              <span>
                {deposit.isLBMACertified ? (
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-300"
                  >
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50">
                    No
                  </Badge>
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Valuation & Insurance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" /> Valuation & Insurance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Declared Value</span>
              <span className="font-bold text-lg">
                {formatCurrency(deposit.declaredValue)}
              </span>
            </div>
            {deposit.verifiedValue && (
              <div className="flex justify-between">
                <span className="text-gray-500">Verified Value</span>
                <span className="font-medium text-emerald-600">
                  {formatCurrency(deposit.verifiedValue)}
                </span>
              </div>
            )}
            <Separator />
            {deposit.insuredValue ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Insured Value</span>
                  <span className="font-medium">
                    {formatCurrency(deposit.insuredValue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Provider</span>
                  <span className="font-medium">
                    {deposit.insuranceProvider}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Policy No.</span>
                  <span className="font-mono text-xs">
                    {deposit.insurancePolicyNo}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-gray-400 italic">
                Insurance not yet activated
              </p>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-gray-500">Storage Type</span>
              <span className="font-medium">
                {STORAGE_TYPE_CONFIG[deposit.storageType]?.label}
              </span>
            </div>
            {deposit.storageUnit && (
              <div className="flex justify-between">
                <span className="text-gray-500">Storage Unit</span>
                <span className="font-mono">{deposit.storageUnit}</span>
              </div>
            )}
            {deposit.shelfPosition && (
              <div className="flex justify-between">
                <span className="text-gray-500">Shelf Position</span>
                <span className="font-medium">{deposit.shelfPosition}</span>
              </div>
            )}
            {deposit.monthlyStorageFee && (
              <div className="flex justify-between">
                <span className="text-gray-500">Monthly Fee</span>
                <span className="font-medium">
                  {formatCurrency(deposit.monthlyStorageFee)}/mo
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assay / Verification */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Scale className="h-4 w-4" /> Verification & Assay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Assay Status</span>
              <StatusBadge
                status={
                  deposit.assayStatus === "PASSED"
                    ? "VERIFICATION_COMPLETE"
                    : deposit.assayStatus === "WAIVED"
                    ? "VERIFICATION_COMPLETE"
                    : deposit.assayStatus === "IN_PROGRESS"
                    ? "ASSAY_IN_PROGRESS"
                    : deposit.assayStatus === "FAILED"
                    ? "KYC_REJECTED"
                    : "PENDING_VERIFICATION"
                }
              />
            </div>
            {deposit.assayMethod && (
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-medium">{deposit.assayMethod}</span>
              </div>
            )}
            {deposit.weightVerified !== null &&
              deposit.weightVerified !== undefined && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Verified Weight</span>
                    <span className="font-medium">
                      {deposit.weightVerified}g
                    </span>
                  </div>
                  {deposit.weightDiscrepancy !== null &&
                    deposit.weightDiscrepancy !== undefined &&
                    deposit.weightDiscrepancy !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Discrepancy</span>
                        <span
                          className={`font-medium ${
                            Math.abs(deposit.weightDiscrepancy) > 1
                              ? "text-red-600"
                              : "text-amber-600"
                          }`}
                        >
                          {deposit.weightDiscrepancy > 0 ? "+" : ""}
                          {deposit.weightDiscrepancy.toFixed(2)}g
                        </span>
                      </div>
                    )}
                </>
              )}
            {deposit.assayResult && (
              <div className="mt-2 bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">{deposit.assayResult}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" /> Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{deposit.client.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{deposit.client.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Intake Method</span>
              <span className="font-medium">
                {deposit.intakeMethod === "ARMORED_TRANSPORT"
                  ? "Armored Transport"
                  : deposit.intakeMethod === "VAULT_TRANSFER"
                  ? "Vault Transfer"
                  : "Client Delivery"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Deposit Date</span>
              <span className="font-medium">
                {formatDate(deposit.depositDate)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawals */}
      <WithdrawalSection
        withdrawals={deposit.withdrawals as any}
        adminId={adminId}
        onRefresh={onRefresh}
      />

      {/* Transfers */}
      <TransferSection depositId={deposit.id} adminId={adminId} />

      {/* Beneficiaries */}
      <BeneficiaryManager depositId={deposit.id} adminId={adminId} />

      {/* Billing */}
      <DepositBilling depositId={deposit.id} adminId={adminId} />

      {/* Add Note */}
      <Card>
        <CardContent className="p-4">
          <Label className="text-xs font-semibold text-gray-700">
            Add Activity Note
          </Label>
          <div className="flex gap-2 mt-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Client called to confirm delivery schedule..."
              className="resize-none h-16"
            />
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={isPending || !note.trim()}
              className="self-end"
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" /> Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deposit.activities.length === 0 ? (
            <p className="text-sm text-gray-400">No activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {deposit.activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-800">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(activity.createdAt)}
                      {activity.performedBy &&
                        ` • by ${activity.performedBy}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── MAIN VAULT PANEL ────────────────────────────────────────

export default function VaultPanel({ adminId }: { adminId: string }) {
  const [deposits, setDeposits] = useState<VaultDeposit[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<VaultDeposit | null>(
    null
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const loadDeposits = async () => {
    setIsLoading(true);
    const filters =
      statusFilter !== "ALL" ? { status: statusFilter } : undefined;
    const result = await getVaultDeposits(filters);
    setDeposits(result.deposits as any);
    setIsLoading(false);
  };

  useEffect(() => {
    loadDeposits();
  }, [statusFilter]);

  const handleRefresh = async () => {
    await loadDeposits();
    if (selectedDeposit) {
      const updated = deposits.find((d) => d.id === selectedDeposit.id);
      if (updated) setSelectedDeposit(updated);
      else {
        const freshResult = await getVaultDeposits();
        const fresh = (freshResult.deposits as any).find(
          (d: any) => d.id === selectedDeposit.id
        );
        if (fresh) setSelectedDeposit(fresh);
      }
    }
  };

  // ── Stats ──
  const stats = {
    total: deposits.length,
    inStorage: deposits.filter((d) => d.status === "IN_STORAGE").length,
    pendingAction: deposits.filter((d) =>
      [
        "KYC_REVIEW",
        "PENDING_VERIFICATION",
        "ASSAY_IN_PROGRESS",
        "RELEASE_REQUESTED",
      ].includes(d.status)
    ).length,
    totalValue: deposits.reduce((s, d) => s + d.declaredValue, 0),
  };

  if (selectedDeposit) {
    return (
      <DepositDetail
        deposit={selectedDeposit}
        adminId={adminId}
        onBack={() => {
          setSelectedDeposit(null);
          loadDeposits();
        }}
        onRefresh={handleRefresh}
      />
    );
  }
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Vault Custody Service
            </h2>
            <p className="text-xs text-gray-500">
              Manage gold deposits, KYC, assay, storage & withdrawals
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadDeposits}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#0a1628] to-[#122041]">
          <CardContent className="p-4">
            <p className="text-gray-400 text-xs">Total Deposits</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <p className="text-amber-700 text-xs">Pending Action</p>
            <p className="text-2xl font-bold text-amber-800">
              {stats.pendingAction}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <p className="text-emerald-700 text-xs">In Storage</p>
            <p className="text-2xl font-bold text-emerald-800">
              {stats.inStorage}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#0a1628] to-[#122041]">
          <CardContent className="p-4">
            <p className="text-gray-400 text-xs">Total Declared Value</p>
            <p className="text-xl font-bold text-emerald-400">
              $
              {stats.totalValue.toLocaleString("en-US", {
                minimumFractionDigits: 0,
              })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="KYC_REVIEW">KYC Under Review</SelectItem>
            <SelectItem value="KYC_APPROVED">KYC Approved</SelectItem>
            <SelectItem value="INTAKE_SCHEDULED">Intake Scheduled</SelectItem>
            <SelectItem value="PENDING_VERIFICATION">
              Pending Verification
            </SelectItem>
            <SelectItem value="ASSAY_IN_PROGRESS">
              Assay In Progress
            </SelectItem>
            <SelectItem value="IN_STORAGE">In Storage</SelectItem>
            <SelectItem value="RELEASE_REQUESTED">
              Release Requested
            </SelectItem>
            <SelectItem value="RELEASED">Released</SelectItem>
            <SelectItem value="LIQUIDATED">Liquidated</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-gray-500">
          {deposits.length} deposit{deposits.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Deposit Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : deposits.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Lock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">
              No Vault Deposits
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Vault deposits will appear here when clients submit gold for
              custody.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {deposits.map((deposit) => (
            <DepositCard
              key={deposit.id}
              deposit={deposit}
              onSelect={() => setSelectedDeposit(deposit)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
