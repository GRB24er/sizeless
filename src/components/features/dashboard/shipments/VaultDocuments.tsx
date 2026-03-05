"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/dashboard/shipments/VaultDocuments.tsx
// Document Download Buttons — Generate & download vault PDFs
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import {
  FileText,
  Download,
  FlaskConical,
  Lock,
  Shield,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type DocumentConfig = {
  id: string;
  label: string;
  description: string;
  icon: typeof FileText;
  color: string;
  bgColor: string;
  borderColor: string;
  requiredStatus: string[];
};

const VAULT_DOCUMENTS: DocumentConfig[] = [
  {
    id: "vault-certificate",
    label: "Vault Deposit Certificate",
    description: "Official certificate of deposit with QR verification",
    icon: FileText,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    requiredStatus: [
      "DOCUMENTED",
      "IN_STORAGE",
      "RELEASE_REQUESTED",
      "RELEASE_APPROVED",
      "RELEASED",
    ],
  },
  {
    id: "assay-report",
    label: "Assay Verification Report",
    description: "Laboratory assay results with weight verification",
    icon: FlaskConical,
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    requiredStatus: [
      "VERIFICATION_COMPLETE",
      "DOCUMENTED",
      "IN_STORAGE",
      "RELEASE_REQUESTED",
      "RELEASE_APPROVED",
      "RELEASED",
    ],
  },
  {
    id: "storage-agreement",
    label: "Storage Agreement",
    description: "Terms, fees, and storage location details",
    icon: Lock,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    requiredStatus: [
      "DOCUMENTED",
      "IN_STORAGE",
      "RELEASE_REQUESTED",
      "RELEASE_APPROVED",
      "RELEASED",
    ],
  },
  {
    id: "vault-insurance",
    label: "Vault Insurance Certificate",
    description: "Insurance coverage details and policy information",
    icon: Shield,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    requiredStatus: [
      "VERIFICATION_COMPLETE",
      "DOCUMENTED",
      "IN_STORAGE",
      "RELEASE_REQUESTED",
      "RELEASE_APPROVED",
      "RELEASED",
    ],
  },
];

export default function VaultDocuments({
  depositId,
  depositStatus,
  hasInsurance,
  hasAssay,
}: {
  depositId: string;
  depositStatus: string;
  hasInsurance: boolean;
  hasAssay: boolean;
}) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (docId: string, label: string) => {
    setDownloading(docId);
    try {
      const res = await fetch(
        `/api/vault-documents/${depositId}?type=${docId}`
      );

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to generate document");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${label.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${label} downloaded`);
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(null);
    }
  };

  const availableDocs = VAULT_DOCUMENTS.filter((doc) => {
    if (!doc.requiredStatus.includes(depositStatus)) return false;
    if (doc.id === "vault-insurance" && !hasInsurance) return false;
    if (doc.id === "assay-report" && !hasAssay) return false;
    return true;
  });

  if (availableDocs.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
        <FileText className="w-3.5 h-3.5" /> Available Documents
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {availableDocs.map((doc) => {
          const Icon = doc.icon;
          const isDownloading = downloading === doc.id;

          return (
            <button
              key={doc.id}
              onClick={() => handleDownload(doc.id, doc.label)}
              disabled={isDownloading}
              className={`flex items-start gap-3 p-4 rounded-xl border ${doc.borderColor} ${doc.bgColor} hover:shadow-md disabled:opacity-60 transition-all text-left`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${doc.bgColor} ${doc.color} shrink-0`}
              >
                {isDownloading ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <Icon className="w-4.5 h-4.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${doc.color}`}>
                  {doc.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {doc.description}
                </p>
              </div>
              <Download
                className={`w-4 h-4 ${doc.color} opacity-50 shrink-0 mt-1`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
