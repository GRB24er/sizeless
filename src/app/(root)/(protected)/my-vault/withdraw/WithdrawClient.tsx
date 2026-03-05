"use client";

// ═══════════════════════════════════════════════════════════════
// src/app/(root)/(protected)/my-vault/withdraw/WithdrawClient.tsx
// Client Vault Withdrawal Request — Multi-step form
// ═══════════════════════════════════════════════════════════════

import { useState, useTransition } from "react";
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
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Withdrawal Request Submitted
        </h2>
        <p className="text-gray-600 mb-2">
          Your request for deposit{" "}
          <strong className="font-mono">{selectedDeposit?.depositNumber}</strong>{" "}
          has been submitted for compliance review.
        </p>
        <p className="text-sm text-gray-500 mb-8">
          You will receive an email notification when your request is approved. Processing
          typically takes 1–2 business days.
        </p>
        <a
          href="/my-vault"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#122041] text-white font-semibold hover:opacity-90 transition-opacity"
        >
          <Lock className="w-4 h-4" />
          Back to My Vault
        </a>
      </div>
    );
  }

  // ─── STEP 1: SELECT DEPOSIT ────────────────────────────────

  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Request Withdrawal</h2>
          <p className="text-gray-500 mt-1">Select the deposit you wish to withdraw from</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {["Select Deposit", "Choose Type", "Confirm"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > i + 1
                    ? "bg-emerald-500 text-white"
                    : step === i + 1
                    ? "bg-[#0a1628] text-[#D4A853]"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${step === i + 1 ? "font-semibold text-gray-900" : "text-gray-400"}`}>
                {label}
              </span>
              {i < 2 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {eligibleDeposits.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-gray-200">
            <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700">No Eligible Deposits</h3>
            <p className="text-sm text-gray-500 mt-1">
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
                className="w-full text-left p-5 rounded-xl border-2 border-gray-100 hover:border-[#D4A853] hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm font-bold text-gray-900">
                      {dep.depositNumber}
                    </p>
                    {dep.custodyReferenceId && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Custody: {dep.custodyReferenceId}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-2">{dep.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#D4A853]">
                      ${dep.declaredValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">{dep.weightGrams}g</p>
                  </div>
                </div>
                {dep.storageUnit && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
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
          <h2 className="text-2xl font-bold text-gray-900">Withdrawal Type</h2>
          <p className="text-gray-500 mt-1">
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
                  ? "border-[#D4A853] bg-amber-50/30 shadow-sm"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="wType"
                value={type.value}
                checked={withdrawalType === type.value}
                onChange={(e) => setWithdrawalType(e.target.value)}
                className="mt-1 accent-[#D4A853]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <type.icon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-bold text-gray-900">{type.label}</span>
                </div>
                <p className="text-sm text-gray-600">{type.desc}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-400">
                  <span>Fee: {type.fee}</span>
                  <span>Processing: {type.time}</span>
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* Liquidation fields */}
        {withdrawalType === "LIQUIDATION" && (
          <div className="space-y-4 mb-8 p-5 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Preferred Bullion Dealer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bullionDealerName}
                onChange={(e) => setBullionDealerName(e.target.value)}
                placeholder="e.g. PAMP SA, BullionVault, Metalor"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Bank Account / IBAN for Wire
              </label>
              <input
                type="text"
                value={bankAccountRef}
                onChange={(e) => setBankAccountRef(e.target.value)}
                placeholder="e.g. GB29 NWBK 6016 1331 9268 19"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-amber-100 font-mono"
              />
            </div>
          </div>
        )}

        {/* Physical collection method */}
        {withdrawalType === "PHYSICAL" && (
          <div className="space-y-2 mb-8">
            <p className="text-sm font-medium text-gray-700 mb-2">Collection Method</p>
            {[
              { value: "CLIENT_DELIVERY", label: "I'll collect from the vault", icon: Package },
              { value: "ARMORED_TRANSPORT", label: "Send via armored transport", icon: Truck },
            ].map((m) => (
              <label
                key={m.value}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  collectionMethod === m.value
                    ? "border-[#D4A853] bg-amber-50/30"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="cMethod"
                  value={m.value}
                  checked={collectionMethod === m.value}
                  onChange={(e) => setCollectionMethod(e.target.value)}
                  className="accent-[#D4A853]"
                />
                <m.icon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{m.label}</span>
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-between">
          <button
            onClick={() => setStep(1)}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back
          </button>
          <button
            onClick={() => setStep(3)}
            disabled={withdrawalType === "LIQUIDATION" && !bullionDealerName}
            className="px-6 py-2.5 rounded-xl bg-[#0a1628] text-[#D4A853] text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
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
        <h2 className="text-2xl font-bold text-gray-900">Review & Submit</h2>
        <p className="text-gray-500 mt-1">Please review your withdrawal request before submitting</p>
      </div>

      {/* Summary Card */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-5 bg-gradient-to-br from-[#0a1628] to-[#122041]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-gray-400">Deposit</p>
              <p className="font-mono text-lg font-bold text-white">
                {selectedDeposit?.depositNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Value</p>
              <p className="text-xl font-bold text-[#D4A853]">
                ${selectedDeposit?.declaredValue.toLocaleString()}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {selectedDeposit?.description} • {selectedDeposit?.weightGrams}g
          </p>
        </div>

        <div className="p-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Withdrawal Type</span>
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
              <span className="text-gray-500">Collection</span>
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
                <span className="text-gray-500">Bullion Dealer</span>
                <span className="font-medium">{bullionDealerName}</span>
              </div>
              {bankAccountRef && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Wire To</span>
                  <span className="font-mono text-xs">{bankAccountRef}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Additional Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special instructions..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
      </div>

      {/* Warning */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-8">
        <div className="flex gap-2">
          <Shield className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-xs text-amber-700">
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
          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
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
