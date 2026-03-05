"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/dashboard/shipments/WithdrawalDialogs.tsx
// Vault Withdrawal Dialogs — Request, Approve, Complete
// ═══════════════════════════════════════════════════════════════

import { useState, useTransition } from "react";
import {
  ArrowUpRight,
  Banknote,
  Building2,
  CheckCircle,
  CreditCard,
  DollarSign,
  Loader2,
  Lock,
  Package,
  Shield,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  createWithdrawalRequest,
  approveWithdrawal,
  completeWithdrawal,
} from "@/app/(root)/shipments/vault-actions";

// ─── MODAL WRAPPER ───────────────────────────────────────────

function Modal({
  open,
  onClose,
  title,
  icon: Icon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b border-gray-100 rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0a1628] to-[#122041] flex items-center justify-center">
              <Icon className="w-4.5 h-4.5 text-[#D4A853]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all";

// ═════════════════════════════════════════════════════════════
// 1. WITHDRAWAL REQUEST DIALOG
// ═════════════════════════════════════════════════════════════

export function WithdrawalRequestDialog({
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
  const [withdrawalType, setWithdrawalType] = useState("PHYSICAL");
  const [notes, setNotes] = useState("");
  const [collectionMethod, setCollectionMethod] = useState("CLIENT_DELIVERY");
  const [bullionDealerName, setBullionDealerName] = useState("");
  const [bankAccountRef, setBankAccountRef] = useState("");

  const handleSubmit = () => {
    if (withdrawalType === "LIQUIDATION" && !bullionDealerName) {
      toast.error("Please specify the bullion dealer");
      return;
    }

    startTransition(async () => {
      const res = await createWithdrawalRequest(depositId, adminId, {
        type: withdrawalType,
        notes: notes || undefined,
        collectionMethod: withdrawalType === "PHYSICAL" ? collectionMethod : undefined,
        bullionDealerName: withdrawalType === "LIQUIDATION" ? bullionDealerName : undefined,
        bankAccountRef: withdrawalType === "LIQUIDATION" ? bankAccountRef : undefined,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Withdrawal request created");
        onSuccess();
        onClose();
      }
    });
  };

  const feeMap: Record<string, number> = {
    PHYSICAL: 350,
    LIQUIDATION: declaredValue * 0.005,
    VAULT_TRANSFER: 250,
  };

  return (
    <Modal open={open} onClose={onClose} title="Request Withdrawal" icon={ArrowUpRight}>
      <div className="space-y-5">
        {/* Deposit Summary */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#122041]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Deposit</p>
              <p className="text-sm font-mono font-bold text-white">{depositNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Value</p>
              <p className="text-lg font-bold text-[#D4A853]">
                ${declaredValue.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">{weightGrams}g in custody</div>
        </div>

        {/* Withdrawal Type */}
        <FormField label="Withdrawal Type" required>
          <div className="space-y-2">
            {[
              {
                value: "PHYSICAL",
                label: "Physical Withdrawal",
                desc: "Collect gold from vault facility",
                icon: Package,
                fee: "$350 handling fee",
              },
              {
                value: "LIQUIDATION",
                label: "Liquidation (Sell)",
                desc: "Sell through bullion dealer, receive wire transfer",
                icon: Banknote,
                fee: "0.5% commission",
              },
              {
                value: "VAULT_TRANSFER",
                label: "Vault Transfer",
                desc: "Transfer to another vault facility",
                icon: Lock,
                fee: "$250 transfer fee",
              },
            ].map((type) => (
              <label
                key={type.value}
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  withdrawalType === type.value
                    ? "border-orange-500 bg-orange-50/50"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="withdrawalType"
                  value={type.value}
                  checked={withdrawalType === type.value}
                  onChange={(e) => setWithdrawalType(e.target.value)}
                  className="mt-1 accent-orange-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <type.icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-800">
                        {type.label}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-orange-600">
                      {type.fee}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{type.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </FormField>

        {/* Physical — Collection Method */}
        {withdrawalType === "PHYSICAL" && (
          <FormField label="Collection Method" required>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: "CLIENT_DELIVERY", label: "Client Pickup", icon: Package },
                { value: "ARMORED_TRANSPORT", label: "Armored Delivery", icon: Truck },
              ].map((m) => (
                <label
                  key={m.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    collectionMethod === m.value
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="collection"
                    value={m.value}
                    checked={collectionMethod === m.value}
                    onChange={(e) => setCollectionMethod(e.target.value)}
                    className="accent-blue-600"
                  />
                  <m.icon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">{m.label}</span>
                </label>
              ))}
            </div>
          </FormField>
        )}

        {/* Liquidation — Dealer & Bank */}
        {withdrawalType === "LIQUIDATION" && (
          <>
            <FormField label="Bullion Dealer" required>
              <input
                type="text"
                value={bullionDealerName}
                onChange={(e) => setBullionDealerName(e.target.value)}
                placeholder="e.g. PAMP SA, Metalor, BullionVault"
                className={inputClass}
              />
            </FormField>
            <FormField label="Bank Account / Wire Reference">
              <input
                type="text"
                value={bankAccountRef}
                onChange={(e) => setBankAccountRef(e.target.value)}
                placeholder="e.g. IBAN, SWIFT, or account ref"
                className={inputClass}
              />
            </FormField>
          </>
        )}

        {/* Notes */}
        <FormField label="Request Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions for this withdrawal..."
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </FormField>

        {/* Fee Notice */}
        <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-100">
          <div className="flex gap-2">
            <DollarSign className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
            <div className="text-xs text-orange-700">
              <p className="font-semibold mb-1">Estimated Fees</p>
              <p>
                {withdrawalType === "PHYSICAL" && "Physical withdrawal handling: $350"}
                {withdrawalType === "LIQUIDATION" &&
                  `Liquidation commission (0.5%): $${feeMap.LIQUIDATION.toFixed(2)} + Wire transfer: $35`}
                {withdrawalType === "VAULT_TRANSFER" && "Vault transfer: $250"}
              </p>
              <p className="mt-1 text-orange-600">
                Processing time: 3–5 business days after compliance approval
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || (withdrawalType === "LIQUIDATION" && !bullionDealerName)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors"
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
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════
// 2. WITHDRAWAL APPROVAL DIALOG
// ═════════════════════════════════════════════════════════════

export function WithdrawalApproveDialog({
  open,
  onClose,
  withdrawal,
  adminId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  withdrawal: {
    id: string;
    type: string;
    status: string;
    requestNotes: string | null;
    bullionDealerName: string | null;
    bankAccountRef: string | null;
    collectionMethod: string | null;
    requestDate: string;
  };
  adminId: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [complianceNotes, setComplianceNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  const handleApprove = () => {
    startTransition(async () => {
      const res = await approveWithdrawal(
        withdrawal.id,
        adminId,
        complianceNotes || "Compliance review passed"
      );
      if (res.error) toast.error(res.error);
      else {
        toast.success("Withdrawal approved — ready for release");
        onSuccess();
        onClose();
      }
    });
  };

  const typeLabels: Record<string, string> = {
    PHYSICAL: "Physical Withdrawal",
    LIQUIDATION: "Liquidation (Sell)",
    VAULT_TRANSFER: "Vault Transfer",
  };

  return (
    <Modal open={open} onClose={onClose} title="Review Withdrawal Request" icon={Shield}>
      <div className="space-y-5">
        {/* Request Details */}
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Type</span>
            <span className="font-semibold">{typeLabels[withdrawal.type] || withdrawal.type}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Requested</span>
            <span className="font-medium">
              {new Date(withdrawal.requestDate).toLocaleDateString("en-GB", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </span>
          </div>
          {withdrawal.collectionMethod && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Collection</span>
              <span className="font-medium">
                {withdrawal.collectionMethod === "ARMORED_TRANSPORT"
                  ? "Armored Transport"
                  : "Client Pickup"}
              </span>
            </div>
          )}
          {withdrawal.bullionDealerName && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Bullion Dealer</span>
              <span className="font-medium">{withdrawal.bullionDealerName}</span>
            </div>
          )}
          {withdrawal.bankAccountRef && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Bank Account</span>
              <span className="font-mono text-xs">{withdrawal.bankAccountRef}</span>
            </div>
          )}
          {withdrawal.requestNotes && (
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">Notes</p>
              <p className="text-sm text-gray-700 mt-1">{withdrawal.requestNotes}</p>
            </div>
          )}
        </div>

        {/* Compliance Checklist */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-3">
            Compliance Review
          </p>
          <div className="space-y-2">
            {[
              "Client identity re-verified",
              "Outstanding storage fees cleared",
              "No regulatory holds or liens",
              "AML/KYC status current",
              withdrawal.type === "LIQUIDATION" ? "Bullion dealer KYC verified" : "Collection logistics confirmed",
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                <input type="checkbox" className="accent-blue-600 rounded" />
                {item}
              </label>
            ))}
          </div>
        </div>

        {/* Compliance Notes */}
        <FormField label="Compliance Notes">
          <textarea
            value={complianceNotes}
            onChange={(e) => setComplianceNotes(e.target.value)}
            placeholder="Notes on compliance review..."
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </FormField>

        {/* Approve / Reject */}
        {!showReject ? (
          <div className="flex justify-between pt-2">
            <button
              onClick={() => setShowReject(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {isPending ? "Approving..." : "Approve Withdrawal"}
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <FormField label="Rejection Reason" required>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejecting this withdrawal..."
                rows={2}
                className={`${inputClass} resize-none border-red-200 focus:border-red-400 focus:ring-red-100`}
              />
            </FormField>
            <div className="flex justify-between">
              <button
                onClick={() => setShowReject(false)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                disabled={isPending || !rejectionReason.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Confirm Rejection
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════
// 3. WITHDRAWAL COMPLETION DIALOG (WITH LIQUIDATION)
// ═════════════════════════════════════════════════════════════

export function WithdrawalCompleteDialog({
  open,
  onClose,
  withdrawal,
  adminId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  withdrawal: {
    id: string;
    type: string;
    bullionDealerName: string | null;
    bankAccountRef: string | null;
  };
  adminId: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [spotPrice, setSpotPrice] = useState("");
  const [saleSpread, setSaleSpread] = useState("1.5");
  const [saleAmount, setSaleAmount] = useState("");
  const [wireTransferRef, setWireTransferRef] = useState("");

  const isLiquidation = withdrawal.type === "LIQUIDATION";

  const handleComplete = () => {
    startTransition(async () => {
      const data = isLiquidation
        ? {
            spotPriceAtSale: parseFloat(spotPrice) || undefined,
            saleSpread: parseFloat(saleSpread) || undefined,
            saleAmount: parseFloat(saleAmount) || undefined,
            wireTransferRef: wireTransferRef || undefined,
          }
        : undefined;

      const res = await completeWithdrawal(withdrawal.id, adminId, data);
      if (res.error) toast.error(res.error);
      else {
        toast.success(
          isLiquidation
            ? "Liquidation complete — funds transferred"
            : "Withdrawal complete — asset released"
        );
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isLiquidation ? "Complete Liquidation" : "Complete Withdrawal"}
      icon={isLiquidation ? Banknote : Package}
    >
      <div className="space-y-5">
        {isLiquidation ? (
          <>
            {/* Liquidation Details */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-2">
                Dealer: {withdrawal.bullionDealerName || "N/A"}
              </p>
              {withdrawal.bankAccountRef && (
                <p className="text-xs text-emerald-700">
                  Wire to: <span className="font-mono">{withdrawal.bankAccountRef}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Spot Price (USD/oz)">
                <input
                  type="number"
                  step="0.01"
                  value={spotPrice}
                  onChange={(e) => setSpotPrice(e.target.value)}
                  placeholder="e.g. 2345.50"
                  className={`${inputClass} font-mono`}
                />
              </FormField>
              <FormField label="Spread / Premium (%)">
                <input
                  type="number"
                  step="0.1"
                  value={saleSpread}
                  onChange={(e) => setSaleSpread(e.target.value)}
                  placeholder="e.g. 1.5"
                  className={`${inputClass} font-mono`}
                />
              </FormField>
            </div>

            <FormField label="Total Sale Amount (USD)" required>
              <input
                type="number"
                step="0.01"
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
                placeholder="e.g. 125000.00"
                className={`${inputClass} font-mono text-lg`}
              />
            </FormField>

            <FormField label="Wire Transfer Reference" required>
              <input
                type="text"
                value={wireTransferRef}
                onChange={(e) => setWireTransferRef(e.target.value)}
                placeholder="e.g. WT-2026-034821-PAMP"
                className={`${inputClass} font-mono`}
              />
            </FormField>

            {/* Sale summary */}
            {saleAmount && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#122041]">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                  Liquidation Summary
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Sale Amount</span>
                    <span className="font-bold text-lg text-[#D4A853]">
                      ${parseFloat(saleAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Commission (0.5%)</span>
                    <span className="text-red-400">
                      -${(parseFloat(saleAmount) * 0.005).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Wire Fee</span>
                    <span className="text-red-400">-$35.00</span>
                  </div>
                  <div className="border-t border-gray-600 pt-1.5 flex justify-between text-sm">
                    <span className="text-gray-300 font-semibold">Net to Client</span>
                    <span className="font-bold text-emerald-400">
                      ${(parseFloat(saleAmount) - parseFloat(saleAmount) * 0.005 - 35).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Physical Withdrawal Confirmation */
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex gap-2">
              <Package className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Confirm Physical Release</p>
                <p className="mt-1 text-xs text-amber-600">
                  By completing this withdrawal, you confirm the asset has been physically
                  handed over to the client or their authorized representative. The vault
                  custody record will be permanently closed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={
              isPending ||
              (isLiquidation && (!saleAmount || !wireTransferRef))
            }
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-colors ${
              isLiquidation
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-gray-800 hover:bg-gray-900"
            }`}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLiquidation ? (
              <Banknote className="w-4 h-4" />
            ) : (
              <ArrowUpRight className="w-4 h-4" />
            )}
            {isPending
              ? "Processing..."
              : isLiquidation
              ? "Confirm Liquidation & Wire"
              : "Confirm Asset Released"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
