"use client";

// ═══════════════════════════════════════════════════════════════
// src/app/(root)/(protected)/my-vault/withdraw/WithdrawClient.tsx
// Client Vault Withdrawal Request — Multi-step form
// ═══════════════════════════════════════════════════════════════

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  CheckCircle,
  CreditCard,
  Loader2,
  Lock,
  Package,
  Shield,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { createWithdrawalRequest } from "@/app/(root)/shipments/vault-actions";

type ClientDeposit = {
  id: string;
  depositNumber: string;
  custodyReferenceId: string | null;
  assetType: string;
  description: string;
  weightGrams: number;
  declaredValue: number;
  status: string;
  storageUnit: string | null;
};

export default function WithdrawClient({
  deposits,
  userId,
}: {
  deposits: ClientDeposit[];
  userId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [selectedDeposit, setSelectedDeposit] = useState<ClientDeposit | null>(null);
  const [withdrawalType, setWithdrawalType] = useState("PHYSICAL");
  const [collectionMethod, setCollectionMethod] = useState("CLIENT_DELIVERY");
  const [notes, setNotes] = useState("");
  const [bullionDealerName, setBullionDealerName] = useState("");
  const [bankAccountRef, setBankAccountRef] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const eligibleDeposits = deposits.filter((d) => d.status === "IN_STORAGE");

  const handleSubmit = () => {
    if (!selectedDeposit) return;

    startTransition(async () => {
      const res = await createWithdrawalRequest(selectedDeposit.id, userId, {
        type: withdrawalType,
        notes: notes || undefined,
        collectionMethod: withdrawalType === "PHYSICAL" ? collectionMethod : undefined,
        bullionDealerName: withdrawalType === "LIQUIDATION" ? bullionDealerName : undefined,
        bankAccountRef: withdrawalType === "LIQUIDATION" ? bankAccountRef : undefined,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        setSubmitted(true);
      }
    });
  };

  // ─── SUCCESS STATE ─────────────────────────────────────────

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1F7A4D]/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-[#1F7A4D]" />
        </div>
        <h2 className="text-2xl font-bold text-ink mb-3">
          Withdrawal Request Submitted
        </h2>
        <p className="text-ink-2 mb-2">
          Your request for deposit{" "}
          <strong className="font-mono">{selectedDeposit?.depositNumber}</strong>{" "}
          has been submitted for compliance review.
        </p>
        <p className="text-sm text-ink-3 mb-8">
          You will receive an email notification when your request is approved. Processing
          usually takes one to two business days.
        </p>
        <Link
          href="/my-vault"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-ink text-white font-semibold hover:bg-navy-2 transition-colors"
        >
          <Lock className="w-4 h-4" />
          Back to your vault
        </Link>
      </div>
    );
  }

  // ─── STEP 1: SELECT DEPOSIT ────────────────────────────────

  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-ink">Request Withdrawal</h2>
          <p className="text-ink-3 mt-1">Select the deposit you wish to withdraw from</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {["Select Deposit", "Choose Type", "Confirm"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > i + 1
                    ? "bg-[#1F7A4D] text-white"
                    : step === i + 1
                    ? "bg-ink text-white"
                    : "bg-line text-ink-3"
                }`}
              >
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${step === i + 1 ? "font-semibold text-ink" : "text-ink-3"}`}>
                {label}
              </span>
              {i < 2 && <div className="w-8 h-px bg-line" />}
            </div>
          ))}
        </div>

        {eligibleDeposits.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-line-2">
            <Lock className="w-12 h-12 text-line-2 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-ink">No Eligible Deposits</h3>
            <p className="text-sm text-ink-3 mt-1">
              Only deposits with &quot;In Storage&quot; status can be withdrawn.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {eligibleDeposits.map((dep) => (
              <button
                key={dep.id}
                onClick={() => {
                  setSelectedDeposit(dep);
                  setStep(2);
                }}
                className="w-full text-left p-5 rounded-xl border-2 border-line hover:border-ink/40 hover:shadow-md transition-[border-color,box-shadow]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm font-bold text-ink">
                      {dep.depositNumber}
                    </p>
                    {dep.custodyReferenceId && (
                      <p className="text-xs text-ink-3 mt-0.5">
                        Custody: {dep.custodyReferenceId}
                      </p>
                    )}
                    <p className="text-sm text-ink-2 mt-2">{dep.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="figures text-lg font-medium text-ink">
                      ${dep.declaredValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-ink-3">{dep.weightGrams}g</p>
                  </div>
                </div>
                {dep.storageUnit && (
                  <p className="text-xs text-ink-3 mt-2 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Unit: {dep.storageUnit}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── STEP 2: CHOOSE TYPE ───────────────────────────────────

  if (step === 2) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-ink">Withdrawal Type</h2>
          <p className="text-ink-3 mt-1">
            How would you like to withdraw deposit{" "}
            <strong className="font-mono">{selectedDeposit?.depositNumber}</strong>?
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {[
            {
              value: "PHYSICAL",
              label: "Physical Withdrawal",
              desc: "Collect your gold from our vault facility. Available for client pickup or armored transport delivery.",
              icon: Package,
              fee: "$350 handling fee",
              time: "3–5 business days",
            },
            {
              value: "LIQUIDATION",
              label: "Sell (Liquidation)",
              desc: "Sell your gold through an authorized bullion dealer. Proceeds wired to your bank account.",
              icon: Banknote,
              fee: "0.5% commission + $35 wire fee",
              time: "5–7 business days",
            },
            {
              value: "VAULT_TRANSFER",
              label: "Transfer to Another Vault",
              desc: "Transfer custody to another approved vault facility under your name.",
              icon: Lock,
              fee: "$250 transfer fee",
              time: "5–10 business days",
            },
          ].map((type) => (
            <label
              key={type.value}
              className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                withdrawalType === type.value
                  ? "border-ink bg-tint/60 shadow-sm"
                  : "border-line hover:border-line-2"
              }`}
            >
              <input
                type="radio"
                name="wType"
                value={type.value}
                checked={withdrawalType === type.value}
                onChange={(e) => setWithdrawalType(e.target.value)}
                className="mt-1 accent-signal"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <type.icon className="w-4 h-4 text-ink-3" />
                  <span className="text-sm font-bold text-ink">{type.label}</span>
                </div>
                <p className="text-sm text-ink-2">{type.desc}</p>
                <div className="flex gap-4 mt-2 text-xs text-ink-3">
                  <span>Fee: {type.fee}</span>
                  <span>Processing: {type.time}</span>
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Liquidation fields */}
        {withdrawalType === "LIQUIDATION" && (
          <div className="space-y-4 mb-8 p-5 rounded-xl bg-canvas border border-line">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Preferred Bullion Dealer <span className="text-[#B42318]">*</span>
              </label>
              <input
                type="text"
                value={bullionDealerName}
                onChange={(e) => setBullionDealerName(e.target.value)}
                placeholder="e.g. PAMP SA, BullionVault, Metalor"
                className="w-full px-4 py-3 rounded-md border border-line-2 bg-white text-sm focus:border-ink focus:outline-none focus:ring-[3px] focus:ring-signal/15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Bank Account / IBAN for Wire
              </label>
              <input
                type="text"
                value={bankAccountRef}
                onChange={(e) => setBankAccountRef(e.target.value)}
                placeholder="e.g. GB29 NWBK 6016 1331 9268 19"
                className="w-full px-4 py-3 rounded-md border border-line-2 bg-white text-sm focus:border-ink focus:outline-none focus:ring-[3px] focus:ring-signal/15 font-mono"
              />
            </div>
          </div>
        )}

        {/* Physical collection method */}
        {withdrawalType === "PHYSICAL" && (
          <div className="space-y-2 mb-8">
            <p className="text-sm font-medium text-ink mb-2">Collection Method</p>
            {[
              { value: "CLIENT_DELIVERY", label: "I'll collect from the vault", icon: Package },
              { value: "ARMORED_TRANSPORT", label: "Send via armored transport", icon: Truck },
            ].map((m) => (
              <label
                key={m.value}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  collectionMethod === m.value
                    ? "border-ink bg-tint/60"
                    : "border-line hover:border-line-2"
                }`}
              >
                <input
                  type="radio"
                  name="cMethod"
                  value={m.value}
                  checked={collectionMethod === m.value}
                  onChange={(e) => setCollectionMethod(e.target.value)}
                  className="accent-signal"
                />
                <m.icon className="w-4 h-4 text-ink-3" />
                <span className="text-sm font-medium">{m.label}</span>
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={() => setStep(1)}
            className="px-4 py-2 text-sm text-ink-3 hover:text-ink"
          >
            ← Back
          </button>
          <button
            onClick={() => setStep(3)}
            disabled={withdrawalType === "LIQUIDATION" && !bullionDealerName}
            className="px-6 py-2.5 rounded-md bg-ink text-white text-sm font-semibold hover:bg-navy-2 disabled:opacity-50 transition-colors"
          >
            Continue to Review →
          </button>
        </div>
      </div>
    );
  }

  // ─── STEP 3: CONFIRM ───────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-ink">Review & Submit</h2>
        <p className="text-ink-3 mt-1">Please review your withdrawal request before submitting</p>
      </div>

      {/* Summary Card */}
      <div className="rounded-2xl border border-line-2 overflow-hidden mb-6">
        <div className="p-5 bg-navy">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-[#A9B6C6]">Deposit</p>
              <p className="font-mono text-lg font-bold text-white">
                {selectedDeposit?.depositNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#A9B6C6]">Value</p>
              <p className="figures text-xl font-medium text-white">
                ${selectedDeposit?.declaredValue.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-xs text-ink-3 mt-2">
            {selectedDeposit?.description} • {selectedDeposit?.weightGrams}g
          </p>
        </div>

        <div className="p-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-3">Withdrawal Type</span>
            <span className="font-semibold">
              {withdrawalType === "PHYSICAL"
                ? "Physical Withdrawal"
                : withdrawalType === "LIQUIDATION"
                ? "Liquidation (Sell)"
                : "Vault Transfer"}
            </span>
          </div>
          {withdrawalType === "PHYSICAL" && (
            <div className="flex justify-between">
              <span className="text-ink-3">Collection</span>
              <span className="font-medium">
                {collectionMethod === "ARMORED_TRANSPORT"
                  ? "Armored Transport"
                  : "Client Pickup"}
              </span>
            </div>
          )}
          {withdrawalType === "LIQUIDATION" && (
            <>
              <div className="flex justify-between">
                <span className="text-ink-3">Bullion Dealer</span>
                <span className="font-medium">{bullionDealerName}</span>
              </div>
              {bankAccountRef && (
                <div className="flex justify-between">
                  <span className="text-ink-3">Wire To</span>
                  <span className="font-mono text-xs">{bankAccountRef}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-ink mb-1.5">
          Additional Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special instructions..."
          rows={2}
          className="w-full px-4 py-3 rounded-md border border-line-2 bg-white text-sm resize-none focus:border-ink focus:outline-none focus:ring-[3px] focus:ring-signal/15"
        />
      </div>

      {/* Warning */}
      <div className="p-4 rounded-xl bg-signal-soft border border-signal/25 mb-8">
        <div className="flex gap-2">
          <Shield className="w-5 h-5 text-signal-ink shrink-0" />
          <div className="text-xs text-ink-2">
            <p className="font-semibold">Important</p>
            <p className="mt-1">
              Your request will be reviewed by our compliance team. You will need to present
              valid identification and your custody reference number to complete the withdrawal.
              Processing takes 1–2 business days for approval.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep(2)}
          className="px-4 py-2 text-sm text-ink-3 hover:text-ink"
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowUpRight className="w-4 h-4" />
          )}
          {isPending ? "Submitting..." : "Submit Withdrawal Request"}
        </button>
      </div>
    </div>
  );
}
