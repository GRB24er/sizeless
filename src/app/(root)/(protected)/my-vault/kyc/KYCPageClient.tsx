"use client";

// ═══════════════════════════════════════════════════════════════
// src/app/(root)/(protected)/my-vault/kyc/KYCPageClient.tsx
// Client-side KYC page — shows form or current status
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import {
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import KYCForm from "@/components/features/vault/KYCForm";

type KYCData = {
  id: string;
  status: string;
  idType: string | null;
  idNumber: string | null;
  sanctionsCheck: string;
  pepCheck: string;
  adverseMediaCheck: string;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
} | null;

export default function KYCPageClient({ kyc }: { kyc: KYCData }) {
  const [showForm, setShowForm] = useState(false);

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // If no KYC exists or rejected (allow resubmission), show form
  if (!kyc || kyc.status === "REJECTED" || kyc.status === "EXPIRED" || showForm) {
    return (
      <div>
        <div className="flex items-center gap-4 mb-10">
          <Link
            href="/my-vault"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#D4A853] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Vault
          </Link>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#D4A853]/15 mb-6">
            <Shield className="w-8 h-8 text-[#D4A853]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            KYC Verification
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Complete your identity verification to access vault services.
            All documents are encrypted and stored securely.
          </p>
        </div>

        {kyc?.status === "REJECTED" && (
          <div className="max-w-2xl mx-auto mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
            <div className="flex gap-3">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-300 mb-1">
                  Previous Application Rejected
                </p>
                <p className="text-sm text-red-400/80">
                  {kyc.rejectionReason ||
                    "Please resubmit with corrected documents."}
                </p>
              </div>
            </div>
          </div>
        )}

        <KYCForm
          onSuccess={() => {
            setShowForm(false);
            window.location.reload();
          }}
        />
      </div>
    );
  }

  // Show status card
  const statusConfig: Record<
    string,
    {
      icon: typeof CheckCircle;
      color: string;
      bg: string;
      label: string;
      description: string;
    }
  > = {
    PENDING: {
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      label: "Under Review",
      description:
        "Your KYC application has been received and is being reviewed by our compliance team. This typically takes 1–2 business days.",
    },
    UNDER_REVIEW: {
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      label: "Under Review",
      description:
        "Our compliance team is actively reviewing your documents. You will be notified once the process is complete.",
    },
    APPROVED: {
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      label: "Verified",
      description:
        "Your identity has been verified. You are cleared to use all vault services including deposits, storage, and withdrawals.",
    },
  };

  const config = statusConfig[kyc.status] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  return (
    <div>
      <div className="flex items-center gap-4 mb-10">
        <Link
          href="/my-vault"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#D4A853] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Vault
        </Link>
      </div>

      <div className="max-w-xl mx-auto text-center">
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${config.bg} border mb-8`}
        >
          <StatusIcon className={`w-10 h-10 ${config.color}`} />
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">{config.label}</h1>
        <p className="text-slate-400 mb-8">{config.description}</p>

        {/* Details Card */}
        <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 text-left">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Application Date</span>
              <span className="text-white font-medium">
                {formatDate(kyc.createdAt)}
              </span>
            </div>
            {kyc.idType && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">ID Type</span>
                <span className="text-white font-medium">
                  {kyc.idType.replace(/_/g, " ")}
                </span>
              </div>
            )}
            {kyc.idNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">ID Number</span>
                <span className="text-white font-medium font-mono">
                  {kyc.idNumber.slice(0, 3)}***{kyc.idNumber.slice(-2)}
                </span>
              </div>
            )}
            {kyc.reviewedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Reviewed</span>
                <span className="text-white font-medium">
                  {formatDate(kyc.reviewedAt)}
                </span>
              </div>
            )}

            {/* AML Checks */}
            {kyc.status === "APPROVED" && (
              <div className="pt-3 mt-3 border-t border-slate-700/30">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">
                  Compliance Checks
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Sanctions", value: kyc.sanctionsCheck },
                    { label: "PEP", value: kyc.pepCheck },
                    { label: "Adverse Media", value: kyc.adverseMediaCheck },
                  ].map((check) => (
                    <div
                      key={check.label}
                      className="text-center p-2 rounded-lg bg-slate-800/50"
                    >
                      {check.value === "CLEAR" ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      )}
                      <p className="text-xs text-slate-400">{check.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {kyc.status === "APPROVED" && (
          <Link
            href="/my-vault"
            className="inline-flex items-center gap-2 mt-8 px-8 py-3 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#C09740] text-[#0A1628] font-semibold text-sm hover:from-[#F5DEB3] hover:to-[#D4A853] transition-all"
          >
            Go to My Vault
          </Link>
        )}
      </div>
    </div>
  );
}
