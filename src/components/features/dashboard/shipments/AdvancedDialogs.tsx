"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/dashboard/shipments/AdvancedDialogs.tsx
// Vault Advanced Dialogs — Transfers & Partial Withdrawals
// ═══════════════════════════════════════════════════════════════

import { useState, useTransition } from "react";
import {
  ArrowRight,
  Banknote,
  Building2,
  Globe,
  Loader2,
  Lock,
  Package,
  Scale,
  Shield,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { initiateVaultTransfer } from "@/app/(root)/shipments/vault-advanced-actions";
import { createPartialWithdrawal } from "@/app/(root)/shipments/vault-advanced-actions";

// ─── MODAL WRAPPER ───────────────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  icon: Icon,
  accentColor,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: React.ElementType;
  accentColor?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accentColor || "bg-gradient-to-br from-[#0a1628] to-[#122041]"}`}>
              <Icon className="w-4.5 h-4.5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all";

// ═══════════════════════════════════════════════════════════════
// 1. VAULT TRANSFER DIALOG
// ═══════════════════════════════════════════════════════════════

export function VaultTransferDialog({
  open,
  onClose,
  depositId,
  adminId,
  depositNumber,
  currentVault,
  currentUnit,
  weightGrams,
  declaredValue,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  depositId: string;
  adminId: string;
  depositNumber: string;
  currentVault: string;
  currentUnit: string | null;
  weightGrams: number;
  declaredValue: number;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [transferType, setTransferType] = useState("FULL");
  const [partialWeight, setPartialWeight] = useState("");
  const [destVault, setDestVault] = useState("");
  const [destUnit, setDestUnit] = useState("");
  const [destCustodian, setDestCustodian] = useState("");
  const [destContact, setDestContact] = useState("");
  const [estimatedArrival, setEstimatedArrival] = useState("");
  const [notes, setNotes] = useState("");

  const transferWeight = transferType === "FULL" ? weightGrams : (parseFloat(partialWeight) || 0);
  const transferValue = (transferWeight / weightGrams) * declaredValue;
  const transferFee = 250 + (transferWeight > 5000 ? 150 : 0);
  const insuranceFee = transferValue * 0.001;

  const handleSubmit = () => {
    if (!destVault.trim()) { toast.error("Enter destination vault"); return; }
    if (transferType === "PARTIAL" && (transferWeight <= 0 || transferWeight >= weightGrams)) {
      toast.error("Partial weight must be between 0 and total weight");
      return;
    }

    startTransition(async () => {
      const res = await initiateVaultTransfer(depositId, adminId, {
        destinationVault: destVault,
        destinationUnit: destUnit || undefined,
        destinationCustodian: destCustodian || undefined,
        destinationContact: destContact || undefined,
        transferType,
        weightTransferred: transferWeight,
        estimatedArrival: estimatedArrival || undefined,
        transitInsuredValue: transferValue,
        transferFee,
        notes: notes || undefined,
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success(`Transfer ${res.transferNumber} initiated`);
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Vault-to-Vault Transfer" icon={Globe} accentColor="bg-indigo-600">
      <div className="space-y-5">
        {/* Source → Destination visual */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-indigo-50">
          <div className="flex-1 p-3 rounded-lg bg-white border border-gray-200 text-center">
            <Lock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">From</p>
            <p className="text-sm font-bold text-gray-900">{currentVault}</p>
            {currentUnit && <p className="text-xs text-gray-400">Unit: {currentUnit}</p>}
          </div>
          <ArrowRight className="w-5 h-5 text-indigo-500 shrink-0" />
          <div className="flex-1 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-center">
            <Globe className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
            <p className="text-xs text-indigo-600">To</p>
            <p className="text-sm font-bold text-indigo-800">{destVault || "Select vault"}</p>
          </div>
        </div>

        {/* Transfer type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Type</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "FULL", label: "Full Transfer", desc: `All ${weightGrams}g` },
              { value: "PARTIAL", label: "Partial Transfer", desc: "Select amount" },
            ].map((t) => (
              <label
                key={t.value}
                className={`p-3 rounded-xl border-2 cursor-pointer text-center transition-all ${
                  transferType === t.value ? "border-indigo-500 bg-indigo-50" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <input type="radio" name="tType" value={t.value} checked={transferType === t.value} onChange={(e) => setTransferType(e.target.value)} className="sr-only" />
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-xs text-gray-500">{t.desc}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Partial weight */}
        {transferType === "PARTIAL" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Weight to Transfer (g) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              max={weightGrams - 0.01}
              value={partialWeight}
              onChange={(e) => setPartialWeight(e.target.value)}
              placeholder={`Max: ${(weightGrams - 0.01).toFixed(2)}g`}
              className={`${inputClass} font-mono`}
            />
            {parseFloat(partialWeight) > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Remaining after transfer: {(weightGrams - parseFloat(partialWeight)).toFixed(2)}g
                (${((weightGrams - parseFloat(partialWeight)) / weightGrams * declaredValue).toFixed(2)})
              </p>
            )}
          </div>
        )}

        {/* Destination */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Destination Vault <span className="text-red-500">*</span>
          </label>
          <select value={destVault} onChange={(e) => setDestVault(e.target.value)} className={inputClass}>
            <option value="">Select vault facility...</option>
            <option value="London Main Vault">London Main Vault</option>
            <option value="London Hatton Garden">London Hatton Garden</option>
            <option value="Zurich Vault">Zurich Vault</option>
            <option value="Singapore Freeport">Singapore Freeport</option>
            <option value="Dubai Gold Vault">Dubai Gold Vault</option>
            <option value="New York Federal Reserve">New York Federal Reserve</option>
            <option value="Hong Kong Vault">Hong Kong Vault</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Custodian</label>
            <input type="text" value={destCustodian} onChange={(e) => setDestCustodian(e.target.value)} placeholder="e.g. Brinks, Loomis" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact</label>
            <input type="text" value={destContact} onChange={(e) => setDestContact(e.target.value)} placeholder="Contact person/email" className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimated Arrival</label>
          <input type="date" value={estimatedArrival} onChange={(e) => setEstimatedArrival(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Special handling instructions..." className={`${inputClass} resize-none`} />
        </div>

        {/* Fee Summary */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#122041]">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Transfer Summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">Weight</span><span className="text-white font-semibold">{transferWeight.toFixed(2)}g</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Value</span><span className="text-[#D4A853] font-bold">${transferValue.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Transfer Fee</span><span className="text-gray-300">${transferFee.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Transit Insurance</span><span className="text-gray-300">${insuranceFee.toFixed(2)}</span></div>
            <div className="border-t border-gray-600 pt-2 flex justify-between">
              <span className="text-gray-300 font-semibold">Total Fees</span>
              <span className="text-white font-bold">${(transferFee + insuranceFee).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !destVault || (transferType === "PARTIAL" && transferWeight <= 0)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {isPending ? "Initiating..." : "Initiate Transfer"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. PARTIAL WITHDRAWAL DIALOG
// ═══════════════════════════════════════════════════════════════

export function PartialWithdrawalDialog({
  open,
  onClose,
  depositId,
  adminId,
  depositNumber,
  weightGrams,
  declaredValue,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  depositId: string;
  adminId: string;
  depositNumber: string;
  weightGrams: number;
  declaredValue: number;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [partialWeight, setPartialWeight] = useState("");
  const [withdrawalType, setWithdrawalType] = useState("PHYSICAL");
  const [notes, setNotes] = useState("");
  const [collectionMethod, setCollectionMethod] = useState("CLIENT_DELIVERY");
  const [bullionDealer, setBullionDealer] = useState("");
  const [bankRef, setBankRef] = useState("");

  const weight = parseFloat(partialWeight) || 0;
  const partialValue = weightGrams > 0 ? (weight / weightGrams) * declaredValue : 0;
  const remainWeight = weightGrams - weight;
  const remainValue = declaredValue - partialValue;
  const pct = weightGrams > 0 ? (weight / weightGrams) * 100 : 0;

  const handleSubmit = () => {
    if (weight <= 0 || weight >= weightGrams) {
      toast.error("Enter a valid partial weight (less than total)");
      return;
    }

    startTransition(async () => {
      const res = await createPartialWithdrawal(depositId, adminId, {
        type: withdrawalType,
        partialWeight: weight,
        notes: notes || undefined,
        collectionMethod: withdrawalType === "PHYSICAL" ? collectionMethod : undefined,
        bullionDealerName: withdrawalType === "LIQUIDATION" ? bullionDealer : undefined,
        bankAccountRef: withdrawalType === "LIQUIDATION" ? bankRef : undefined,
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success("Partial withdrawal request created");
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Partial Withdrawal" icon={Scale} accentColor="bg-orange-600">
      <div className="space-y-5">
        {/* Deposit Info */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#122041]">
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-gray-400">Deposit</p>
              <p className="font-mono text-sm font-bold text-white">{depositNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-lg font-bold text-[#D4A853]">{weightGrams}g</p>
              <p className="text-xs text-gray-500">${declaredValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Weight Input with Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Weight to Withdraw (g) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            max={weightGrams - 0.01}
            value={partialWeight}
            onChange={(e) => setPartialWeight(e.target.value)}
            placeholder={`1 — ${(weightGrams - 0.01).toFixed(2)}g`}
            className={`${inputClass} font-mono text-lg`}
          />
          <input
            type="range"
            min={0}
            max={weightGrams}
            step={0.01}
            value={weight}
            onChange={(e) => setPartialWeight(e.target.value)}
            className="w-full mt-2 accent-orange-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0g</span>
            <span className="font-semibold text-orange-600">{pct.toFixed(1)}%</span>
            <span>{weightGrams}g</span>
          </div>
        </div>

        {/* Before / After */}
        {weight > 0 && weight < weightGrams && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-center">
              <p className="text-xs text-orange-600">Withdrawing</p>
              <p className="text-lg font-bold text-orange-800">{weight.toFixed(2)}g</p>
              <p className="text-xs text-orange-600">${partialValue.toFixed(2)}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <p className="text-xs text-emerald-600">Remaining</p>
              <p className="text-lg font-bold text-emerald-800">{remainWeight.toFixed(2)}g</p>
              <p className="text-xs text-emerald-600">${remainValue.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Method</label>
          <div className="space-y-2">
            {[
              { value: "PHYSICAL", label: "Physical Collection", icon: Package },
              { value: "LIQUIDATION", label: "Sell (Liquidation)", icon: Banknote },
            ].map((t) => (
              <label
                key={t.value}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  withdrawalType === t.value ? "border-orange-500 bg-orange-50/50" : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <input type="radio" name="pType" value={t.value} checked={withdrawalType === t.value} onChange={(e) => setWithdrawalType(e.target.value)} className="accent-orange-600" />
                <t.icon className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        {withdrawalType === "LIQUIDATION" && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bullion Dealer <span className="text-red-500">*</span></label>
              <input type="text" value={bullionDealer} onChange={(e) => setBullionDealer(e.target.value)} placeholder="e.g. PAMP SA" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank / IBAN</label>
              <input type="text" value={bankRef} onChange={(e) => setBankRef(e.target.value)} placeholder="e.g. GB29 NWBK 6016..." className={`${inputClass} font-mono`} />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional instructions..." className={`${inputClass} resize-none`} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isPending || weight <= 0 || weight >= weightGrams || (withdrawalType === "LIQUIDATION" && !bullionDealer)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
            {isPending ? "Creating..." : "Submit Partial Withdrawal"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
