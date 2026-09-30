"use client";

// Client-side KYC page: the application form, or the status of the latest submission.

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import KYCForm from "@/components/features/vault/KYCForm";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/landing/primitives";

type KYCData = {
  id: string;
  status: string;
  idType: string | null;
  idNumber: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
} | null;

const STATUS = {
  PENDING: {
    icon: Clock,
    tone: "text-ink",
    title: "Submitted for review",
    text: "We've received your documents. We'll email you once they've been reviewed, usually within two business days.",
  },
  UNDER_REVIEW: {
    icon: Clock,
    tone: "text-ink",
    title: "In review",
    text: "Your documents are being reviewed. We'll email you when it's done.",
  },
  APPROVED: {
    icon: CheckCircle2,
    tone: "text-[#1F7A4D]",
    title: "Approved",
    text: "Your identity checks are approved. You can request deposits, storage and releases.",
  },
} as const;

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

export default function KYCPageClient({ kyc }: { kyc: KYCData }) {
  const [showForm, setShowForm] = useState(false);

  if (!kyc || kyc.status === "REJECTED" || kyc.status === "EXPIRED" || showForm) {
    return (
      <div className="mx-auto max-w-2xl">
        {kyc?.status === "REJECTED" && (
          <div className="mb-8 flex gap-3 rounded-xl border border-[#B42318]/25 bg-[#B42318]/[0.06] p-5">
            <XCircle aria-hidden strokeWidth={1.75} className="mt-0.5 size-5 shrink-0 text-[#B42318]" />
            <div>
              <p className="font-semibold text-ink">Your last submission wasn&apos;t approved</p>
              <p className="mt-1 text-sm text-ink-2">{kyc.rejectionReason || "Please submit again with corrected documents."}</p>
            </div>
          </div>
        )}
        {kyc?.status === "EXPIRED" && (
          <p className="mb-8 rounded-xl border border-line bg-surface p-5 text-sm text-ink-2">
            Your identity checks have expired. Please submit current documents.
          </p>
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

  const state = STATUS[kyc.status as keyof typeof STATUS] ?? STATUS.PENDING;
  const Icon = state.icon;
  const rows = [
    { label: "Submitted", value: formatDate(kyc.createdAt) },
    { label: "ID type", value: kyc.idType?.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) },
    { label: "ID number", value: kyc.idNumber ? `${kyc.idNumber.slice(0, 3)}${"•".repeat(4)}${kyc.idNumber.slice(-2)}` : null },
    { label: "Reviewed", value: formatDate(kyc.reviewedAt) },
  ].filter((r) => r.value);

  return (
    <div className="max-w-2xl rounded-xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <Icon aria-hidden strokeWidth={1.5} className={cn("mt-1 size-7 shrink-0", state.tone)} />
        <div>
          <h2 className={cn("type-display text-2xl font-semibold", state.tone)}>{state.title}</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{state.text}</p>
        </div>
      </div>

      <dl className="mt-6 divide-y divide-line border-t border-line">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-6 py-3 text-sm">
            <dt className="text-ink-3">{r.label}</dt>
            <dd className={cn("text-right text-ink", r.label === "ID number" && "figures")}>{r.value}</dd>
          </div>
        ))}
      </dl>

      {kyc.status === "APPROVED" && (
        <Link href="/my-vault" className={buttonClass("primary", "md", "mt-6")}>
          Go to your vault
        </Link>
      )}
    </div>
  );
}
