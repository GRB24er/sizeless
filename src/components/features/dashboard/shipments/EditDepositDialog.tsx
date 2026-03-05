"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/dashboard/shipments/EditDepositDialog.tsx
// Edit Vault Deposit + Delete Client — Admin controls
// ═══════════════════════════════════════════════════════════════

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Check,
  DollarSign,
  Gem,
  Hash,
  Loader2,
  MapPin,
  Pencil,
  Scale,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { editVaultDeposit, deleteVaultClient } from "@/app/(root)/shipments/vault-edit-actions";

// ─── CONSTANTS ───────────────────────────────────────────────

const ASSET_TYPES = [
  { value: "GOLD_BAR", label: "Gold Bar (400oz)" },
  { value: "GOLD_KILOBAR", label: "Gold Kilobar (1kg)" },
  { value: "GOLD_COINS", label: "Gold Coins" },
  { value: "GOLD_DUST", label: "Gold Dust / Nuggets" },
  { value: "GOLD_DORE", label: "Gold Doré Bar" },
  { value: "SILVER_BAR", label: "Silver Bar" },
  { value: "PLATINUM", label: "Platinum" },
  { value: "PALLADIUM", label: "Palladium" },
  { value: "JEWELRY", label: "Jewelry" },
  { value: "PRECIOUS_STONES", label: "Precious Stones" },
  { value: "MIXED", label: "Mixed Assets" },
];

const VAULT_LOCATIONS = [
  "London Main Vault",
  "London Hatton Garden",
  "Zurich Vault",
  "Singapore Freeport",
  "Dubai Gold Vault",
  "New York Federal Reserve",
  "Hong Kong Vault",
];

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/20 transition-all";

const labelClass = "block text-xs font-semibold text-gray-600 mb-1";

// ═══════════════════════════════════════════════════════════════
// EDIT DEPOSIT DIALOG
// ═══════════════════════════════════════════════════════════════

export function EditDepositDialog({
  open,
  onClose,
  deposit,
  adminId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  deposit: any;
  adminId: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState("asset");

  // ── Form state pre-filled from deposit ──
  const [description, setDescription] = useState(deposit.description || "");
  const [assetType, setAssetType] = useState(deposit.assetType || "GOLD_BAR");
  const [weightGrams, setWeightGrams] = useState(String(deposit.weightGrams || ""));
  const [purity, setPurity] = useState(deposit.purity || "");
  const [fineness, setFineness] = useState(String(deposit.fineness || ""));
  const [quantity, setQuantity] = useState(String(deposit.quantity || 1));
  const [serialNumbers, setSerialNumbers] = useState(deposit.serialNumbers || "");
  const [refinerName, setRefinerName] = useState(deposit.refinerName || "");
  const [refinerStamp, setRefinerStamp] = useState(deposit.refinerStamp || "");
  const [isLBMACertified, setIsLBMACertified] = useState(deposit.isLBMACertified || false);
  const [declaredValue, setDeclaredValue] = useState(String(deposit.declaredValue || ""));
  const [spotPrice, setSpotPrice] = useState(String(deposit.spotPriceAtDeposit || ""));
  const [vaultLocation, setVaultLocation] = useState(deposit.vaultLocation || "London Main Vault");
  const [storageUnit, setStorageUnit] = useState(deposit.storageUnit || "");
  const [shelfPosition, setShelfPosition] = useState(deposit.shelfPosition || "");
  const [insuredValue, setInsuredValue] = useState(String(deposit.insuredValue || ""));
  const [insuranceProvider, setInsuranceProvider] = useState(deposit.insuranceProvider || "");
  const [insurancePolicyNo, setInsurancePolicyNo] = useState(deposit.insurancePolicyNo || "");
  const [monthlyFee, setMonthlyFee] = useState(String(deposit.monthlyStorageFee || ""));
  const [sourceOfFunds, setSourceOfFunds] = useState(deposit.sourceOfFunds || "");
  const [sourceOfFundsDetail, setSourceOfFundsDetail] = useState(deposit.sourceOfFundsDetail || "");
  const [complianceNotes, setComplianceNotes] = useState(deposit.complianceNotes || "");

  if (!open) return null;

  const sections = [
    { id: "asset", label: "Asset Details", icon: Gem },
    { id: "value", label: "Valuation", icon: DollarSign },
    { id: "vault", label: "Vault & Storage", icon: MapPin },
    { id: "insurance", label: "Insurance", icon: Shield },
    { id: "compliance", label: "Compliance", icon: Shield },
  ];

  const handleSave = () => {
    startTransition(async () => {
      const res = await editVaultDeposit(deposit.id, adminId, {
        description,
        assetType,
        weightGrams: parseFloat(weightGrams) || deposit.weightGrams,
        purity: purity || undefined,
        fineness: parseFloat(fineness) || undefined,
        quantity: parseInt(quantity) || 1,
        serialNumbers: serialNumbers || undefined,
        refinerName: refinerName || undefined,
        refinerStamp: refinerStamp || undefined,
        isLBMACertified,
        declaredValue: parseFloat(declaredValue) || deposit.declaredValue,
        spotPriceAtDeposit: parseFloat(spotPrice) || undefined,
        vaultLocation,
        storageUnit: storageUnit || undefined,
        shelfPosition: shelfPosition || undefined,
        insuredValue: parseFloat(insuredValue) || undefined,
        insuranceProvider: insuranceProvider || undefined,
        insurancePolicyNo: insurancePolicyNo || undefined,
        monthlyStorageFee: parseFloat(monthlyFee) || undefined,
        sourceOfFunds: sourceOfFunds || undefined,
        sourceOfFundsDetail: sourceOfFundsDetail || undefined,
        complianceNotes: complianceNotes || undefined,
      });

      if (res.error) toast.error(res.error);
      else {
        toast.success("Deposit updated");
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0a1628] flex items-center justify-center">
              <Pencil className="w-4 h-4 text-[#D4A853]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Edit Deposit</h3>
              <p className="text-xs text-gray-500 font-mono">{deposit.depositNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 px-5 pt-3 pb-1 border-b overflow-x-auto shrink-0">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeSection === s.id
                    ? "bg-[#0a1628] text-[#D4A853]"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* ASSET DETAILS */}
          {activeSection === "asset" && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Asset Type</label>
                <select value={assetType} onChange={(e) => setAssetType(e.target.value)} className={inputClass}>
                  {ASSET_TYPES.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputClass} resize-none`} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Weight (g)</label>
                  <input type="number" step="0.01" value={weightGrams} onChange={(e) => setWeightGrams(e.target.value)} className={`${inputClass} font-mono`} />
                </div>
                <div>
                  <label className={labelClass}>Purity</label>
                  <input type="text" value={purity} onChange={(e) => setPurity(e.target.value)} placeholder="999.9" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Quantity</label>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={`${inputClass} font-mono`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Serial Numbers</label>
                  <input type="text" value={serialNumbers} onChange={(e) => setSerialNumbers(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Fineness</label>
                  <input type="number" step="0.0001" value={fineness} onChange={(e) => setFineness(e.target.value)} className={`${inputClass} font-mono`} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Refiner / Brand</label>
                  <input type="text" value={refinerName} onChange={(e) => setRefinerName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Refiner Stamp</label>
                  <input type="text" value={refinerStamp} onChange={(e) => setRefinerStamp(e.target.value)} className={inputClass} />
                </div>
              </div>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={isLBMACertified} onChange={(e) => setIsLBMACertified(e.target.checked)} className="accent-[#D4A853] w-4 h-4" />
                <span className="text-sm font-medium">LBMA Certified</span>
              </label>
            </div>
          )}

          {/* VALUATION */}
          {activeSection === "value" && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Declared Value (USD)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-400 text-sm">$</span>
                  <input type="number" step="0.01" value={declaredValue} onChange={(e) => setDeclaredValue(e.target.value)} className={`${inputClass} pl-7 font-mono text-lg`} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Spot Price at Deposit ($/oz)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-400 text-sm">$</span>
                  <input type="number" step="0.01" value={spotPrice} onChange={(e) => setSpotPrice(e.target.value)} className={`${inputClass} pl-7 font-mono`} />
                </div>
              </div>
              {parseFloat(weightGrams) > 0 && parseFloat(spotPrice) > 0 && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-xs text-blue-600 font-semibold">Calculated Market Value</p>
                  <p className="text-lg font-mono font-bold text-blue-800 mt-0.5">
                    ${((parseFloat(weightGrams) / 31.1035) * parseFloat(spotPrice)).toFixed(2)}
                  </p>
                  <button
                    onClick={() => setDeclaredValue(((parseFloat(weightGrams) / 31.1035) * parseFloat(spotPrice)).toFixed(2))}
                    className="mt-1.5 px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                  >
                    Use This Value
                  </button>
                </div>
              )}
              <div>
                <label className={labelClass}>Monthly Storage Fee ($)</label>
                <input type="number" step="0.01" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} className={`${inputClass} font-mono`} />
              </div>
            </div>
          )}

          {/* VAULT & STORAGE */}
          {activeSection === "vault" && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Vault Location</label>
                <select value={vaultLocation} onChange={(e) => setVaultLocation(e.target.value)} className={inputClass}>
                  {VAULT_LOCATIONS.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Storage Unit</label>
                  <input type="text" value={storageUnit} onChange={(e) => setStorageUnit(e.target.value)} placeholder="e.g. A-14" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Shelf Position</label>
                  <input type="text" value={shelfPosition} onChange={(e) => setShelfPosition(e.target.value)} placeholder="e.g. Shelf 3, Row B" className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* INSURANCE */}
          {activeSection === "insurance" && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Insured Value ($)</label>
                <input type="number" step="0.01" value={insuredValue} onChange={(e) => setInsuredValue(e.target.value)} className={`${inputClass} font-mono`} />
              </div>
              <div>
                <label className={labelClass}>Insurance Provider</label>
                <input type="text" value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} placeholder="e.g. Lloyd's of London" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Policy Number</label>
                <input type="text" value={insurancePolicyNo} onChange={(e) => setInsurancePolicyNo(e.target.value)} className={`${inputClass} font-mono`} />
              </div>
            </div>
          )}

          {/* COMPLIANCE */}
          {activeSection === "compliance" && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Source of Funds</label>
                <select value={sourceOfFunds} onChange={(e) => setSourceOfFunds(e.target.value)} className={inputClass}>
                  <option value="">Select...</option>
                  <option value="BANK_WITHDRAWAL">Bank Withdrawal</option>
                  <option value="ASSET_SALE">Sale of Asset</option>
                  <option value="GOLD_PURCHASE">Gold Purchase</option>
                  <option value="MINING">Mining Certificate</option>
                  <option value="INVESTMENT">Investment Returns</option>
                  <option value="INHERITANCE">Inheritance</option>
                  <option value="BUSINESS_INCOME">Business Income</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Source of Funds Details</label>
                <textarea value={sourceOfFundsDetail} onChange={(e) => setSourceOfFundsDetail(e.target.value)} rows={2} className={`${inputClass} resize-none`} placeholder="Proof documentation..." />
              </div>
              <div>
                <label className={labelClass}>Compliance Notes</label>
                <textarea value={complianceNotes} onChange={(e) => setComplianceNotes(e.target.value)} rows={2} className={`${inputClass} resize-none`} placeholder="Screening results, flags..." />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0a1628] text-white text-sm font-semibold hover:bg-[#122041] disabled:opacity-50 transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DELETE CLIENT BUTTON
// ═══════════════════════════════════════════════════════════════

export function DeleteClientButton({
  clientId,
  clientName,
  adminId,
  onSuccess,
}: {
  clientId: string;
  clientName: string;
  adminId: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = () => {
    if (confirmText !== "DELETE") return;
    startTransition(async () => {
      const res = await deleteVaultClient(clientId, adminId);
      if (res.error) toast.error(res.error);
      else {
        toast.success(`${res.name} deleted with ${res.depositCount} deposit(s)`);
        setConfirmOpen(false);
        onSuccess();
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 text-xs font-semibold transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" /> Delete Client
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Client Account</h3>
                <p className="text-sm text-gray-500">{clientName}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
              <p className="text-sm text-red-800">
                This will <strong>permanently delete</strong> the client account and <strong>all vault deposits</strong>,
                withdrawals, invoices, transfers, and beneficiaries associated with this client.
                This action cannot be undone.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className={`${inputClass} font-mono tracking-widest text-center`}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={isPending || confirmText !== "DELETE"}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isPending ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
