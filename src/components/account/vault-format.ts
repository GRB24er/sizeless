import { ASSET_TYPE_LABELS, STORAGE_TYPE_CONFIG, VAULT_LIFECYCLE_PHASES, VAULT_STATUS_CONFIG } from "@/lib/vault/types";

// Client-facing wording for vault records. The admin tools use the labels in
// lib/vault/types; clients read the same statuses in plainer, second-person terms.

export const CLIENT_STATUS: Record<string, { label: string; text: string }> = {
  KYC_REVIEW: { label: "Identity checks in progress", text: "We're reviewing your ID, proof of address and the source of your metal." },
  KYC_APPROVED: { label: "Identity checks approved", text: "You're cleared to deposit. The next step is the handover of your metal." },
  KYC_REJECTED: { label: "Identity checks not passed", text: "We couldn't approve your identity checks for this deposit. Please contact us." },
  INTAKE_SCHEDULED: { label: "Handover scheduled", text: "An appointment has been booked to receive your metal." },
  INTAKE_IN_PROGRESS: { label: "Being received", text: "Your metal is being received and logged." },
  PENDING_VERIFICATION: { label: "Awaiting inspection", text: "Your metal has been received and is waiting to be inspected and tested." },
  ASSAY_IN_PROGRESS: { label: "Being tested", text: "Weight and purity are being tested." },
  VERIFICATION_COMPLETE: { label: "Verified", text: "Testing is complete and the deposit is ready to go into storage." },
  DOCUMENTED: { label: "Documents issued", text: "Your custody documents have been issued." },
  IN_STORAGE: { label: "In storage", text: "Your metal is held in storage under your account." },
  RELEASE_REQUESTED: { label: "Release requested", text: "We've received your release request and are reviewing it." },
  RELEASE_APPROVED: { label: "Release approved", text: "Your release is approved and being arranged." },
  RELEASED: { label: "Released", text: "This deposit has left the vault." },
  LIQUIDATION_IN_PROGRESS: { label: "Sale in progress", text: "Your metal is being sold through a bullion dealer." },
  LIQUIDATED: { label: "Sold", text: "The sale is complete." },
  SUSPENDED: { label: "Suspended", text: "This deposit is paused pending a review. Contact us if you have questions." },
};

export const statusLabel = (status: string) => CLIENT_STATUS[status]?.label ?? VAULT_STATUS_CONFIG[status]?.label ?? humanize(status);

/** Tone for a status: "done" (green), "attention" (amber), "stopped" (red) or neutral. */
export function statusTone(status: string): "done" | "attention" | "stopped" | "neutral" {
  if (["IN_STORAGE", "RELEASED", "LIQUIDATED", "KYC_APPROVED", "VERIFICATION_COMPLETE"].includes(status)) return "done";
  if (["SUSPENDED"].includes(status)) return "attention";
  if (["KYC_REJECTED"].includes(status)) return "stopped";
  return "neutral";
}

export const TONE_TEXT = {
  done: "text-[#1F7A4D]",
  attention: "text-[#9A4B00]",
  stopped: "text-[#B42318]",
  neutral: "text-ink",
} as const;

export const TONE_BADGE = {
  done: "bg-[#1F7A4D]/10 text-[#1F7A4D]",
  attention: "bg-[#9A4B00]/10 text-[#9A4B00]",
  stopped: "bg-[#B42318]/10 text-[#B42318]",
  neutral: "bg-tint text-ink-2",
} as const;

/** The six stages every deposit moves through, in client wording. */
export const PHASES = ["Identity checks", "Handover", "Testing", "Documents", "Storage", "Release"];

/** 0-based stage of a status, or -1 for statuses outside the normal path (rejected, suspended). */
export function phaseOf(status: string) {
  return VAULT_LIFECYCLE_PHASES.findIndex((p) => p.statuses.includes(status));
}

export const assetLabel = (assetType: string) => ASSET_TYPE_LABELS[assetType] ?? humanize(assetType);
export const storageLabel = (storageType: string) => STORAGE_TYPE_CONFIG[storageType]?.label ?? humanize(storageType);

const TROY_OZ_GRAMS = 31.1034768;

/** 1000 → "1,000 g (1 kg, 32.15 oz t)" */
export function weightText(grams: number) {
  const g = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(grams);
  const oz = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(grams / TROY_OZ_GRAMS);
  const kg = grams >= 1000 ? `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(grams / 1000)} kg, ` : "";
  return `${g} g (${kg}${oz} oz t)`;
}

export function purityText(purity: string | null, fineness?: number | null) {
  if (!purity && !fineness) return null;
  if (purity?.toLowerCase() === "dore") return "Doré (unrefined)";
  const n = Number(purity);
  if (Number.isFinite(n)) return n > 100 ? `${purity} fine` : `${purity}%`;
  return purity ?? `${fineness} fine`;
}

export const INTAKE_LABELS: Record<string, string> = {
  CLIENT_DELIVERY: "You deliver it to the vault",
  ARMORED_TRANSPORT: "We collect it from you",
  VAULT_TRANSFER: "Transfer from another vault",
};

export const WITHDRAWAL_LABELS: Record<string, string> = {
  PHYSICAL: "Physical collection",
  LIQUIDATION: "Sale through a bullion dealer",
  VAULT_TRANSFER: "Transfer to another vault",
};

/** Plain words for enum values: "IN_STORAGE" → "In storage". */
export function humanize(value: string) {
  const s = value.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Turns status codes inside activity text ("from KYC_REVIEW to KYC_APPROVED") into their labels. */
export function readableActivity(text: string) {
  return text.replace(/\b[A-Z]{2,}(?:_[A-Z]+)+\b/g, (code) => (CLIENT_STATUS[code] ? CLIENT_STATUS[code].label.toLowerCase() : humanize(code).toLowerCase()));
}

export const ACTIVITY_TITLES: Record<string, string> = {
  KYC_SUBMITTED: "Deposit opened",
  KYC_UNDER_REVIEW: "Identity checks started",
  KYC_APPROVED: "Identity checks approved",
  KYC_REJECTED: "Identity checks not passed",
  INTAKE_SCHEDULED: "Handover scheduled",
  INTAKE_STARTED: "Handover started",
  INTAKE_COMPLETED: "Metal received",
  PHYSICAL_INSPECTION: "Inspected",
  ASSAY_STARTED: "Testing started",
  ASSAY_COMPLETED: "Testing completed",
  ASSAY_FAILED: "Testing did not pass",
  WEIGHT_VERIFIED: "Weight verified",
  SERIAL_VERIFIED: "Serial numbers verified",
  DEPOSIT_RECEIPT_ISSUED: "Deposit receipt issued",
  STORAGE_AGREEMENT_SIGNED: "Storage agreement signed",
  INSURANCE_CERTIFICATE_ISSUED: "Insurance certificate issued",
  INSURANCE_ACTIVATED: "Insurance in place",
  CUSTODY_REF_ASSIGNED: "Custody reference assigned",
  PLACED_IN_STORAGE: "Placed in storage",
  STORAGE_TYPE_CHANGED: "Storage type changed",
  STORAGE_LOCATION_CHANGED: "Storage location changed",
  INSURANCE_RENEWED: "Insurance renewed",
  INSURANCE_EXPIRED: "Insurance expired",
  FEE_CHARGED: "Fee charged",
  FEE_PAID: "Payment received",
  STATUS_CHANGED: "Status updated",
  WITHDRAWAL_REQUESTED: "Release requested",
  WITHDRAWAL_APPROVED: "Release approved",
  WITHDRAWAL_REJECTED: "Release not approved",
  WITHDRAWAL_COMPLETED: "Released",
  LIQUIDATION_STARTED: "Sale started",
  LIQUIDATION_COMPLETED: "Sale completed",
  FUNDS_TRANSFERRED: "Funds transferred",
  DEPOSIT_SUSPENDED: "Deposit suspended",
  DEPOSIT_REACTIVATED: "Deposit reactivated",
  AUDIT_REQUESTED: "Audit requested",
  AUDIT_COMPLETED: "Audit completed",
  NOTE_ADDED: "Note from the vault team",
};

export const activityTitle = (action: string) => ACTIVITY_TITLES[action] ?? humanize(action);
