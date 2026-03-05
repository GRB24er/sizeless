"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/dashboard/shipments/KYCReviewPanel.tsx
// Admin KYC Review Panel — Review, approve, reject applications
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useTransition } from "react";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
  FileText,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAllKYCApplications,
  adminApproveKYC,
  adminRejectKYC,
  adminFlagAML,
} from "@/app/(root)/(protected)/my-vault/kyc-actions";

type KYCApplication = {
  id: string;
  clientId: string;
  status: string;
  idType: string | null;
  idNumber: string | null;
  idExpiryDate: string | null;
  idDocumentUrl: string | null;
  addressDocType: string | null;
  addressDocUrl: string | null;
  sourceOfGold: string | null;
  sourceDocUrl: string | null;
  sourceNotes: string | null;
  corporateName: string | null;
  corporateRegNo: string | null;
  corporateDocUrl: string | null;
  sanctionsCheck: string;
  pepCheck: string;
  adverseMediaCheck: string;
  amlNotes: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  client: { id: string; name: string; email: string; phone: string };
};

// ─── STATUS BADGE ────────────────────────────────────────────

function KYCBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; class: string }> = {
    PENDING: {
      label: "Pending Review",
      class: "bg-amber-50 text-amber-700 border-amber-200",
    },
    UNDER_REVIEW: {
      label: "Under Review",
      class: "bg-blue-50 text-blue-700 border-blue-200",
    },
    APPROVED: {
      label: "Approved",
      class: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    REJECTED: {
      label: "Rejected",
      class: "bg-red-50 text-red-700 border-red-200",
    },
    EXPIRED: {
      label: "Expired",
      class: "bg-gray-50 text-gray-700 border-gray-200",
    },
  };
  const c = config[status] || config.PENDING;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.class}`}
    >
      {c.label}
    </span>
  );
}

// ─── AML CHECK INDICATOR ─────────────────────────────────────

function AMLCheck({
  label,
  value,
  onUpdate,
}: {
  label: string;
  value: string;
  onUpdate?: (result: "CLEAR" | "FLAGGED" | "FAILED") => void;
}) {
  const config: Record<string, { icon: typeof CheckCircle; color: string }> = {
    PENDING: { icon: Clock, color: "text-gray-400" },
    CLEAR: { icon: CheckCircle, color: "text-emerald-500" },
    FLAGGED: { icon: AlertTriangle, color: "text-amber-500" },
    FAILED: { icon: XCircle, color: "text-red-500" },
  };
  const c = config[value] || config.PENDING;
  const Icon = c.icon;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${c.color}`} />
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={`text-xs font-medium ${c.color}`}>{value}</span>
        {onUpdate && value === "PENDING" && (
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => onUpdate("CLEAR")}
              className="px-2 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => onUpdate("FLAGGED")}
              className="px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
            >
              Flag
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── KYC DETAIL VIEW ─────────────────────────────────────────

function KYCDetail({
  kyc,
  onBack,
  onRefresh,
}: {
  kyc: KYCApplication;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleApprove = () => {
    startTransition(async () => {
      const res = await adminApproveKYC(kyc.id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("KYC approved — client notified by email");
        onRefresh();
        onBack();
      }
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    startTransition(async () => {
      const res = await adminRejectKYC(kyc.id, rejectReason);
      if (res.error) toast.error(res.error);
      else {
        toast.success("KYC rejected — client notified by email");
        onRefresh();
        onBack();
      }
    });
  };

  const handleAMLUpdate = (
    checkType: "sanctionsCheck" | "pepCheck" | "adverseMediaCheck",
    result: "CLEAR" | "FLAGGED" | "FAILED"
  ) => {
    startTransition(async () => {
      const res = await adminFlagAML(kyc.id, checkType, result);
      if (res.error) toast.error(res.error);
      else {
        toast.success(`${checkType.replace("Check", "")} marked as ${result}`);
        onRefresh();
      }
    });
  };

  const isPendingReview =
    kyc.status === "PENDING" || kyc.status === "UNDER_REVIEW";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              KYC Review — {kyc.client.name}
            </h3>
            <p className="text-xs text-gray-500">
              {kyc.client.email} • Applied {formatDate(kyc.createdAt)}
            </p>
          </div>
        </div>
        <KYCBadge status={kyc.status} />
      </div>

      {/* Client Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
          <User className="w-4 h-4" /> Client Information
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>{" "}
            <span className="font-medium">{kyc.client.name}</span>
          </div>
          <div>
            <span className="text-gray-500">Email:</span>{" "}
            <span className="font-medium">{kyc.client.email}</span>
          </div>
          <div>
            <span className="text-gray-500">Phone:</span>{" "}
            <span className="font-medium">{kyc.client.phone}</span>
          </div>
          <div>
            <span className="text-gray-500">Client ID:</span>{" "}
            <span className="font-mono text-xs">{kyc.clientId}</span>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Identity */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4" /> Identity Document
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="font-medium">
                {kyc.idType?.replace(/_/g, " ") || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Number</span>
              <span className="font-mono font-medium">
                {kyc.idNumber || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Expiry</span>
              <span className="font-medium">
                {formatDate(kyc.idExpiryDate)}
              </span>
            </div>
            {kyc.idDocumentUrl && (
              <a
                href={kyc.idDocumentUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> View Document{" "}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4" /> Proof of Address
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Document Type</span>
              <span className="font-medium">
                {kyc.addressDocType?.replace(/_/g, " ") || "—"}
              </span>
            </div>
            {kyc.addressDocUrl && (
              <a
                href={kyc.addressDocUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> View Document{" "}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Source of Gold */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4" /> Source of Gold
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Source</span>
              <span className="font-medium">
                {kyc.sourceOfGold?.replace(/_/g, " ") || "—"}
              </span>
            </div>
            {kyc.sourceNotes && (
              <div className="mt-2 p-2 rounded-lg bg-gray-50 text-xs text-gray-600">
                {kyc.sourceNotes}
              </div>
            )}
            {kyc.sourceDocUrl && (
              <a
                href={kyc.sourceDocUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> View Document{" "}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Corporate */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4" /> Corporate Documents
          </h4>
          {kyc.corporateName ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Company</span>
                <span className="font-medium">{kyc.corporateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reg. No</span>
                <span className="font-mono font-medium">
                  {kyc.corporateRegNo || "—"}
                </span>
              </div>
              {kyc.corporateDocUrl && (
                <a
                  href={kyc.corporateDocUrl}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View Document{" "}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              Individual depositor — no corporate documents
            </p>
          )}
        </div>
      </div>

      {/* AML Screening */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4" /> AML Screening
        </h4>
        <div className="space-y-2">
          <AMLCheck
            label="Sanctions Screening"
            value={kyc.sanctionsCheck}
            onUpdate={
              isPendingReview
                ? (r) => handleAMLUpdate("sanctionsCheck", r)
                : undefined
            }
          />
          <AMLCheck
            label="Politically Exposed Person (PEP)"
            value={kyc.pepCheck}
            onUpdate={
              isPendingReview
                ? (r) => handleAMLUpdate("pepCheck", r)
                : undefined
            }
          />
          <AMLCheck
            label="Adverse Media Screening"
            value={kyc.adverseMediaCheck}
            onUpdate={
              isPendingReview
                ? (r) => handleAMLUpdate("adverseMediaCheck", r)
                : undefined
            }
          />
        </div>
        {kyc.amlNotes && (
          <div className="mt-3 p-3 rounded-lg bg-gray-50 text-xs text-gray-600">
            <strong>Notes:</strong> {kyc.amlNotes}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isPendingReview && (
        <div className="bg-white rounded-xl border-2 border-dashed border-emerald-200 p-5">
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-4">
            Review Decision
          </p>

          {!showReject ? (
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Approve KYC
              </button>
              <button
                onClick={() => setShowReject(true)}
                disabled={isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 border border-red-200 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (e.g. ID document expired, address proof older than 3 months, source of funds unclear)..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:border-red-300 focus:outline-none focus:ring-1 focus:ring-red-200 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={isPending || !rejectReason.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => {
                    setShowReject(false);
                    setRejectReason("");
                  }}
                  className="px-5 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rejection reason (if already rejected) */}
      {kyc.status === "REJECTED" && kyc.rejectionReason && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-5">
          <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-2">
            Rejection Reason
          </p>
          <p className="text-sm text-red-700">{kyc.rejectionReason}</p>
        </div>
      )}
    </div>
  );
}

// ─── MAIN KYC REVIEW PANEL ───────────────────────────────────

export default function KYCReviewPanel() {
  const [applications, setApplications] = useState<KYCApplication[]>([]);
  const [selected, setSelected] = useState<KYCApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  const loadApplications = async () => {
    setIsLoading(true);
    const data = await getAllKYCApplications(statusFilter);
    setApplications(data as any);
    setIsLoading(false);
  };

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const stats = {
    pending: applications.filter(
      (a) => a.status === "PENDING" || a.status === "UNDER_REVIEW"
    ).length,
    approved: applications.filter((a) => a.status === "APPROVED").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  if (selected) {
    return (
      <KYCDetail
        kyc={selected}
        onBack={() => {
          setSelected(null);
          loadApplications();
        }}
        onRefresh={loadApplications}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              KYC Applications
            </h2>
            <p className="text-xs text-gray-500">
              Review client identity verification submissions
            </p>
          </div>
        </div>
        <button
          onClick={loadApplications}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
          <p className="text-amber-700 text-xs">Pending Review</p>
          <p className="text-2xl font-bold text-amber-800">{stats.pending}</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <p className="text-emerald-700 text-xs">Approved</p>
          <p className="text-2xl font-bold text-emerald-800">
            {stats.approved}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-red-50 border border-red-100">
          <p className="text-red-700 text-xs">Rejected</p>
          <p className="text-2xl font-bold text-red-800">{stats.rejected}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-300"
        >
          <option value="ALL">All Applications</option>
          <option value="PENDING">Pending</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <span className="text-sm text-gray-500">
          {applications.length} application
          {applications.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <Shield className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No KYC applications</p>
          <p className="text-sm text-gray-400 mt-1">
            Applications will appear here when clients submit KYC.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              onClick={() => setSelected(app)}
              className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 hover:shadow-md cursor-pointer transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {app.client.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {app.client.email} •{" "}
                    {app.idType?.replace(/_/g, " ") || "No ID"} •{" "}
                    {formatDate(app.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <KYCBadge status={app.status} />
                <Eye className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
