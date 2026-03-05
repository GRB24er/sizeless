"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/dashboard/admin-vault-create.tsx
// Comprehensive Vault Deposit Creation — 7-Step Wizard
// Covers all 13 vault categories from intake documentation
// ═══════════════════════════════════════════════════════════════

import { useState, useTransition, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  Check,
  CheckCircle,
  ChevronDown,
  ClipboardCheck,
  Copy,
  FileText,
  Gem,
  Globe,
  Hash,
  Loader2,
  Lock,
  MapPin,
  Package,
  Plus,
  Scale,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  Users,
  Vault,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { getClientsForVault, createVaultDeposit } from "@/app/dashboard/vault/actions";

// ─── TYPES ───────────────────────────────────────────────────

type Client = { id: string; name: string; email: string; phone: string | null };
type AuthPerson = { name: string; idNumber: string; relationship: string };

// ─── CONSTANTS ───────────────────────────────────────────────

const ASSET_TYPES = [
  { value: "GOLD_BAR", label: "Gold Bar (400oz / Large)", icon: "🥇" },
  { value: "GOLD_KILOBAR", label: "Gold Kilobar (1kg)", icon: "🏅" },
  { value: "GOLD_COINS", label: "Gold Coins", icon: "🪙" },
  { value: "GOLD_DUST", label: "Gold Dust / Nuggets", icon: "✨" },
  { value: "GOLD_DORE", label: "Gold Doré Bar", icon: "🔶" },
  { value: "SILVER_BAR", label: "Silver Bar", icon: "🥈" },
  { value: "PLATINUM", label: "Platinum", icon: "⬜" },
  { value: "PALLADIUM", label: "Palladium", icon: "🔘" },
  { value: "JEWELRY", label: "Jewelry", icon: "💎" },
  { value: "PRECIOUS_STONES", label: "Precious Stones", icon: "💠" },
  { value: "MIXED", label: "Mixed Assets", icon: "📦" },
];

const SOURCE_OF_FUNDS = [
  { value: "BANK_WITHDRAWAL", label: "Bank Withdrawal" },
  { value: "ASSET_SALE", label: "Sale of Asset" },
  { value: "GOLD_PURCHASE", label: "Gold Purchase (with invoice)" },
  { value: "MINING", label: "Mining Certificate" },
  { value: "INVESTMENT", label: "Investment Returns" },
  { value: "INHERITANCE", label: "Inheritance" },
  { value: "BUSINESS_INCOME", label: "Business Income" },
  { value: "OTHER", label: "Other" },
];

const INTAKE_METHODS = [
  { value: "CLIENT_DELIVERY", label: "Client Delivery", desc: "Client delivers to vault facility" },
  { value: "ARMORED_TRANSPORT", label: "Armored Transport", desc: "We collect from client location" },
  { value: "VAULT_TRANSFER", label: "Vault-to-Vault Transfer", desc: "Transfer from another vault" },
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

const WITHDRAWAL_METHODS = [
  { value: "WRITTEN_LETTER", label: "Written Authorization Letter" },
  { value: "PORTAL_REQUEST", label: "Secure Client Portal Request" },
  { value: "NOTARIZED", label: "Notarized Instruction" },
  { value: "DUAL_AUTH", label: "Dual Authentication (Two-person)" },
];

const STEPS = [
  { id: 1, label: "Client", icon: User, shortLabel: "Client" },
  { id: 2, label: "Source of Funds", icon: Banknote, shortLabel: "AML" },
  { id: 3, label: "Asset Details", icon: Gem, shortLabel: "Asset" },
  { id: 4, label: "Valuation", icon: Scale, shortLabel: "Value" },
  { id: 5, label: "Authorization", icon: ShieldCheck, shortLabel: "Auth" },
  { id: 6, label: "Intake & Vault", icon: Vault, shortLabel: "Intake" },
  { id: 7, label: "Review & Submit", icon: ClipboardCheck, shortLabel: "Submit" },
];

// ─── STYLING ─────────────────────────────────────────────────

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#D4A853] focus:outline-none focus:ring-2 focus:ring-[#D4A853]/20 transition-all";

const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

const selectClass = `${inputClass} appearance-none cursor-pointer`;

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function AdminVaultCreate({ clients: initialClients }: { clients?: Client[] }) {
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<Client[]>(initialClients || []);
  const [clientSearch, setClientSearch] = useState("");
  const [showSuccess, setShowSuccess] = useState<{ depositNumber: string; custodyRef: string } | null>(null);

  // ── Form State ──────────────────────────────────────────
  // Step 1: Client
  const [clientId, setClientId] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Step 2: Source of Funds
  const [sourceOfFunds, setSourceOfFunds] = useState("");
  const [sourceOfFundsDetail, setSourceOfFundsDetail] = useState("");
  const [sourceOfWealth, setSourceOfWealth] = useState("");

  // Step 3: Asset Details
  const [assetType, setAssetType] = useState("GOLD_BAR");
  const [description, setDescription] = useState("");
  const [weightGrams, setWeightGrams] = useState("");
  const [purity, setPurity] = useState("999.9");
  const [fineness, setFineness] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [serialNumbers, setSerialNumbers] = useState("");
  const [refinerName, setRefinerName] = useState("");
  const [refinerStamp, setRefinerStamp] = useState("");
  const [isLBMACertified, setIsLBMACertified] = useState(false);

  // Cash-specific
  const [cashCurrency, setCashCurrency] = useState("USD");
  const [cashAmount, setCashAmount] = useState("");
  const [cashSerialTracking, setCashSerialTracking] = useState("");
  const [cashPackaging, setCashPackaging] = useState("");

  // Jewelry-specific
  const [jewelryValuation, setJewelryValuation] = useState("");

  // Document-specific
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentIssuingAuth, setDocumentIssuingAuth] = useState("");
  const [documentSerial, setDocumentSerial] = useState("");
  const [documentEnvelopeSeal, setDocumentEnvelopeSeal] = useState("");

  // Step 4: Valuation
  const [declaredValue, setDeclaredValue] = useState("");
  const [spotPriceAtDeposit, setSpotPriceAtDeposit] = useState("");

  // Step 5: Authorization
  const [authorizedPersons, setAuthorizedPersons] = useState<AuthPerson[]>([]);
  const [newAuthName, setNewAuthName] = useState("");
  const [newAuthId, setNewAuthId] = useState("");
  const [newAuthRel, setNewAuthRel] = useState("SELF");
  const [withdrawalAuthMethod, setWithdrawalAuthMethod] = useState("PORTAL_REQUEST");
  const [securityPin, setSecurityPin] = useState("");

  // Step 6: Intake
  const [intakeMethod, setIntakeMethod] = useState("CLIENT_DELIVERY");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [vaultLocation, setVaultLocation] = useState("London Main Vault");
  const [complianceNotes, setComplianceNotes] = useState("");

  // ── Load clients ──
  useEffect(() => {
    if (!initialClients) {
      getClientsForVault().then((c) => setClients(c as Client[]));
    }
  }, [initialClients]);

  // ── Filtered clients ──
  const filtered = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // ── Asset category helpers ──
  const isMetalType = ["GOLD_BAR", "GOLD_KILOBAR", "GOLD_COINS", "GOLD_DUST", "GOLD_DORE", "SILVER_BAR", "PLATINUM", "PALLADIUM"].includes(assetType);
  const isJewelry = assetType === "JEWELRY";
  const isPreciousStones = assetType === "PRECIOUS_STONES";

  // ── Add authorized person ──
  const addAuthPerson = () => {
    if (!newAuthName.trim()) return;
    setAuthorizedPersons([...authorizedPersons, { name: newAuthName, idNumber: newAuthId, relationship: newAuthRel }]);
    setNewAuthName("");
    setNewAuthId("");
    setNewAuthRel("SELF");
  };

  // ── Validation ──
  const canAdvance = (): boolean => {
    switch (step) {
      case 1: return !!clientId;
      case 2: return !!sourceOfFunds;
      case 3: return !!description && parseFloat(weightGrams) > 0 && parseInt(quantity) > 0;
      case 4: return parseFloat(declaredValue) > 0;
      case 5: return !!withdrawalAuthMethod;
      case 6: return !!intakeMethod && !!vaultLocation;
      case 7: return true;
      default: return false;
    }
  };

  // ── Submit ──
  const handleSubmit = () => {
    startTransition(async () => {
      const res = await createVaultDeposit({
        clientId,
        sourceOfFunds,
        sourceOfFundsDetail: sourceOfFundsDetail || undefined,
        sourceOfWealth: sourceOfWealth || undefined,
        assetType,
        description,
        weightGrams: parseFloat(weightGrams) || 0,
        purity: purity || undefined,
        fineness: parseFloat(fineness) || undefined,
        quantity: parseInt(quantity) || 1,
        serialNumbers: serialNumbers || undefined,
        refinerName: refinerName || undefined,
        refinerStamp: refinerStamp || undefined,
        isLBMACertified,
        cashCurrency: cashCurrency || undefined,
        cashAmount: parseFloat(cashAmount) || undefined,
        cashSerialTracking: cashSerialTracking || undefined,
        cashPackaging: cashPackaging || undefined,
        jewelryValuation: parseFloat(jewelryValuation) || undefined,
        documentTitle: documentTitle || undefined,
        documentIssuingAuth: documentIssuingAuth || undefined,
        documentSerial: documentSerial || undefined,
        documentEnvelopeSeal: documentEnvelopeSeal || undefined,
        declaredValue: parseFloat(declaredValue) || 0,
        spotPriceAtDeposit: parseFloat(spotPriceAtDeposit) || undefined,
        authorizedPersons: authorizedPersons.length > 0 ? JSON.stringify(authorizedPersons) : undefined,
        withdrawalAuthMethod: withdrawalAuthMethod || undefined,
        securityPin: securityPin || undefined,
        intakeMethod,
        appointmentDate: appointmentDate || undefined,
        appointmentNotes: appointmentNotes || undefined,
        vaultLocation,
        complianceNotes: complianceNotes || undefined,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        setShowSuccess({ depositNumber: res.depositNumber!, custodyRef: res.custodyReferenceId! });
        toast.success(`Vault deposit ${res.depositNumber} created`);
      }
    });
  };

  // ── Success Screen ──
  if (showSuccess) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vault Deposit Created</h2>
          <p className="text-gray-500 mt-1">The deposit is now in KYC Review status</p>
        </div>
        <div className="bg-gradient-to-br from-[#0a1628] to-[#122041] rounded-2xl p-6 space-y-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Deposit Number</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-2xl font-mono font-bold text-white">{showSuccess.depositNumber}</p>
              <button onClick={() => { navigator.clipboard.writeText(showSuccess.depositNumber); toast.success("Copied"); }} className="p-1.5 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-gray-400" /></button>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Custody Reference</p>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-lg font-mono font-bold text-[#D4A853]">{showSuccess.custodyRef}</p>
              <button onClick={() => { navigator.clipboard.writeText(showSuccess.custodyRef); toast.success("Copied"); }} className="p-1.5 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-gray-400" /></button>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setShowSuccess(null);
            setStep(1);
            setClientId("");
            setSelectedClient(null);
            setDescription("");
            setWeightGrams("");
            setDeclaredValue("");
            setSourceOfFunds("");
            setAuthorizedPersons([]);
          }}
          className="px-6 py-3 rounded-xl bg-[#D4A853] text-[#0a1628] font-bold hover:bg-[#C09740] transition-colors"
        >
          Create Another Deposit
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Step Indicator ─────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between overflow-x-auto pb-2 scrollbar-hide">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isComplete = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => isComplete && setStep(s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#0a1628] text-[#D4A853] shadow-lg"
                      : isComplete
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    isActive ? "bg-[#D4A853] text-[#0a1628]" : isComplete ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    {isComplete ? <Check className="w-3 h-3" /> : s.id}
                  </div>
                  <span className="hidden md:inline">{s.label}</span>
                  <span className="md:hidden">{s.shortLabel}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 lg:w-12 h-0.5 mx-1 ${step > s.id ? "bg-emerald-300" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step Content ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 lg:p-8">

          {/* ═══ STEP 1: CLIENT SELECTION ═══ */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Select Client</h2>
                <p className="text-sm text-gray-500 mt-1">Choose the depositor. Client must be registered in the system.</p>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className={`${inputClass} pl-10`}
                />
              </div>

              {clients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No clients registered yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Clients must create an account first.</p>
                </div>
              ) : (
                <div className="grid gap-2 max-h-80 overflow-y-auto">
                  {filtered.map((c) => (
                    <label
                      key={c.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        clientId === c.id
                          ? "border-[#D4A853] bg-amber-50/50 shadow-sm"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="client"
                        value={c.id}
                        checked={clientId === c.id}
                        onChange={() => { setClientId(c.id); setSelectedClient(c); }}
                        className="sr-only"
                      />
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${
                        clientId === c.id ? "bg-[#D4A853] text-[#0a1628]" : "bg-gray-100 text-gray-600"
                      }`}>
                        {c.name?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500 truncate">{c.email}</p>
                      </div>
                      {clientId === c.id && <CheckCircle className="w-5 h-5 text-[#D4A853] shrink-0" />}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 2: SOURCE OF FUNDS / AML ═══ */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Source of Funds & AML</h2>
                <p className="text-sm text-gray-500 mt-1">Required for anti-money-laundering compliance. Document where the assets came from.</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">AML Compliance Required</p>
                    <p className="text-xs text-amber-700 mt-0.5">Client will be automatically screened against OFAC, EU, UN sanctions lists, PEP databases, and criminal watchlists.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass}>Source of Funds <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {SOURCE_OF_FUNDS.map((s) => (
                    <label
                      key={s.value}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer text-sm transition-all ${
                        sourceOfFunds === s.value
                          ? "border-[#D4A853] bg-amber-50/50"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <input type="radio" name="sof" value={s.value} checked={sourceOfFunds === s.value} onChange={(e) => setSourceOfFunds(e.target.value)} className="accent-[#D4A853]" />
                      <span className="font-medium">{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Source of Funds Details</label>
                <textarea
                  value={sourceOfFundsDetail}
                  onChange={(e) => setSourceOfFundsDetail(e.target.value)}
                  rows={3}
                  placeholder="Describe specific proof: bank statement showing withdrawal, sale agreement, mining certificate number, etc."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>Source of Wealth</label>
                <textarea
                  value={sourceOfWealth}
                  onChange={(e) => setSourceOfWealth(e.target.value)}
                  rows={2}
                  placeholder="How the client acquired their overall wealth: employment, business ownership, investments, family wealth, etc."
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div>
                <label className={labelClass}>Compliance Notes</label>
                <textarea
                  value={complianceNotes}
                  onChange={(e) => setComplianceNotes(e.target.value)}
                  rows={2}
                  placeholder="Any additional compliance observations, flags, or notes..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          )}

          {/* ═══ STEP 3: ASSET DETAILS ═══ */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Asset Details</h2>
                <p className="text-sm text-gray-500 mt-1">Record exact details of the asset being deposited.</p>
              </div>

              {/* Asset Type Grid */}
              <div>
                <label className={labelClass}>Asset Type <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {ASSET_TYPES.map((a) => (
                    <label
                      key={a.value}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        assetType === a.value
                          ? "border-[#D4A853] bg-amber-50/50 shadow-sm"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <input type="radio" name="at" value={a.value} checked={assetType === a.value} onChange={(e) => setAssetType(e.target.value)} className="sr-only" />
                      <span className="text-lg">{a.icon}</span>
                      <span className="text-xs font-semibold">{a.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Description <span className="text-red-500">*</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. 2x PAMP Suisse 1kg Gold Bars, sealed with assay cards"
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Metal-specific fields */}
              {isMetalType && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Weight (grams) <span className="text-red-500">*</span></label>
                      <input type="number" step="0.01" value={weightGrams} onChange={(e) => setWeightGrams(e.target.value)} placeholder="e.g. 1000" className={`${inputClass} font-mono`} />
                    </div>
                    <div>
                      <label className={labelClass}>Purity</label>
                      <select value={purity} onChange={(e) => setPurity(e.target.value)} className={selectClass}>
                        <option value="999.9">999.9 (24K)</option>
                        <option value="999">999</option>
                        <option value="995">995</option>
                        <option value="990">990</option>
                        <option value="916.7">916.7 (22K)</option>
                        <option value="750">750 (18K)</option>
                        <option value="585">585 (14K)</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Quantity</label>
                      <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" className={`${inputClass} font-mono`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Serial Numbers</label>
                      <input type="text" value={serialNumbers} onChange={(e) => setSerialNumbers(e.target.value)} placeholder="e.g. AA001234, AA001235" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Fineness</label>
                      <input type="number" step="0.01" value={fineness} onChange={(e) => setFineness(e.target.value)} placeholder="e.g. 0.9999" className={`${inputClass} font-mono`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Refiner / Brand</label>
                      <input type="text" value={refinerName} onChange={(e) => setRefinerName(e.target.value)} placeholder="e.g. PAMP Suisse, Metalor" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Refiner Stamp / Hallmark</label>
                      <input type="text" value={refinerStamp} onChange={(e) => setRefinerStamp(e.target.value)} placeholder="Stamp or hallmark reference" className={inputClass} />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input type="checkbox" checked={isLBMACertified} onChange={(e) => setIsLBMACertified(e.target.checked)} className="accent-[#D4A853] w-4 h-4" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">LBMA Certified</p>
                      <p className="text-xs text-gray-500">London Bullion Market Association Good Delivery certified</p>
                    </div>
                  </label>
                </>
              )}

              {/* Jewelry-specific */}
              {(isJewelry || isPreciousStones) && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Weight (grams) <span className="text-red-500">*</span></label>
                      <input type="number" step="0.01" value={weightGrams} onChange={(e) => setWeightGrams(e.target.value)} placeholder="Total weight" className={`${inputClass} font-mono`} />
                    </div>
                    <div>
                      <label className={labelClass}>Quantity</label>
                      <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Number of items" className={`${inputClass} font-mono`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Jewelry Valuation ($)</label>
                    <input type="number" step="0.01" value={jewelryValuation} onChange={(e) => setJewelryValuation(e.target.value)} placeholder="Professional valuation amount" className={`${inputClass} font-mono`} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ STEP 4: VALUATION ═══ */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Valuation & Documentation</h2>
                <p className="text-sm text-gray-500 mt-1">Set the declared value for insurance and custody purposes.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Declared Value (USD) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={declaredValue}
                      onChange={(e) => setDeclaredValue(e.target.value)}
                      placeholder="0.00"
                      className={`${inputClass} pl-8 font-mono text-lg`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Spot Price at Deposit ($/oz)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-400 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={spotPriceAtDeposit}
                      onChange={(e) => setSpotPriceAtDeposit(e.target.value)}
                      placeholder="e.g. 2340.50"
                      className={`${inputClass} pl-8 font-mono`}
                    />
                  </div>
                </div>
              </div>

              {/* Auto-calculate helper */}
              {parseFloat(weightGrams) > 0 && parseFloat(spotPriceAtDeposit) > 0 && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-xs text-blue-600 font-semibold mb-1">Calculated Market Value</p>
                  <p className="text-lg font-mono font-bold text-blue-800">
                    ${((parseFloat(weightGrams) / 31.1035) * parseFloat(spotPriceAtDeposit)).toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    {weightGrams}g ÷ 31.1035 = {(parseFloat(weightGrams) / 31.1035).toFixed(4)} troy oz × ${spotPriceAtDeposit}/oz
                  </p>
                  <button
                    onClick={() => setDeclaredValue(((parseFloat(weightGrams) / 31.1035) * parseFloat(spotPriceAtDeposit)).toFixed(2))}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                  >
                    Use This Value
                  </button>
                </div>
              )}

              {/* Deposit Summary */}
              <div className="p-5 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#122041]">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Deposit Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Client</span><span className="text-white font-medium">{selectedClient?.name || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Asset</span><span className="text-white font-medium">{ASSET_TYPES.find((a) => a.value === assetType)?.label}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Weight</span><span className="text-white font-mono">{weightGrams || "—"}g</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Quantity</span><span className="text-white font-mono">{quantity}</span></div>
                  <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                    <span className="text-gray-300 font-semibold">Declared Value</span>
                    <span className="text-[#D4A853] text-lg font-bold font-mono">${parseFloat(declaredValue || "0").toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 5: ACCESS AUTHORIZATION ═══ */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Access Authorization</h2>
                <p className="text-sm text-gray-500 mt-1">Define who can access or withdraw the deposited assets.</p>
              </div>

              {/* Authorized Persons */}
              <div>
                <label className={labelClass}>Authorized Persons</label>
                <p className="text-xs text-gray-500 mb-3">Add individuals who are authorized to access or withdraw this deposit.</p>

                {authorizedPersons.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {authorizedPersons.map((ap, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                        <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{ap.name}</p>
                          <p className="text-xs text-gray-500">ID: {ap.idNumber || "—"} • {ap.relationship}</p>
                        </div>
                        <button onClick={() => setAuthorizedPersons(authorizedPersons.filter((_, j) => j !== i))} className="p-1 hover:bg-gray-200 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" value={newAuthName} onChange={(e) => setNewAuthName(e.target.value)} placeholder="Full name" className={inputClass} />
                    <input type="text" value={newAuthId} onChange={(e) => setNewAuthId(e.target.value)} placeholder="ID / Passport number" className={inputClass} />
                    <select value={newAuthRel} onChange={(e) => setNewAuthRel(e.target.value)} className={selectClass}>
                      <option value="SELF">Self (Depositor)</option>
                      <option value="SPOUSE">Spouse</option>
                      <option value="CHILD">Child</option>
                      <option value="PARENT">Parent</option>
                      <option value="BUSINESS_PARTNER">Business Partner</option>
                      <option value="LEGAL_REPRESENTATIVE">Legal Representative</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <button
                    onClick={addAuthPerson}
                    disabled={!newAuthName.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0a1628] text-white text-xs font-semibold hover:bg-[#122041] disabled:opacity-40 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Person
                  </button>
                </div>
              </div>

              {/* Withdrawal Method */}
              <div>
                <label className={labelClass}>Withdrawal Authentication Method <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  {WITHDRAWAL_METHODS.map((m) => (
                    <label
                      key={m.value}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        withdrawalAuthMethod === m.value
                          ? "border-[#D4A853] bg-amber-50/50"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <input type="radio" name="wam" value={m.value} checked={withdrawalAuthMethod === m.value} onChange={(e) => setWithdrawalAuthMethod(e.target.value)} className="accent-[#D4A853]" />
                      <Lock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium">{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Security PIN */}
              <div>
                <label className={labelClass}>Security PIN (optional)</label>
                <input
                  type="password"
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value)}
                  maxLength={8}
                  placeholder="4–8 digit PIN for telephone verification"
                  className={`${inputClass} font-mono tracking-widest max-w-xs`}
                />
                <p className="text-xs text-gray-400 mt-1">Used for telephone withdrawal verification. Stored encrypted.</p>
              </div>
            </div>
          )}

          {/* ═══ STEP 6: INTAKE & VAULT ═══ */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Intake Method & Vault Location</h2>
                <p className="text-sm text-gray-500 mt-1">Schedule how assets will be received and where they will be stored.</p>
              </div>

              {/* Intake Method */}
              <div>
                <label className={labelClass}>Intake Method <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  {INTAKE_METHODS.map((m) => (
                    <label
                      key={m.value}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        intakeMethod === m.value
                          ? "border-[#D4A853] bg-amber-50/50 shadow-sm"
                          : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <input type="radio" name="im" value={m.value} checked={intakeMethod === m.value} onChange={(e) => setIntakeMethod(e.target.value)} className="accent-[#D4A853] mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">{m.label}</p>
                        <p className="text-xs text-gray-500">{m.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Appointment Date & Time</label>
                  <input type="datetime-local" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Vault Location <span className="text-red-500">*</span></label>
                  <select value={vaultLocation} onChange={(e) => setVaultLocation(e.target.value)} className={selectClass}>
                    {VAULT_LOCATIONS.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Appointment Notes</label>
                <textarea
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  rows={2}
                  placeholder="Special delivery instructions, escort requirements, access codes..."
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>
          )}

          {/* ═══ STEP 7: REVIEW & SUBMIT ═══ */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Review & Submit</h2>
                <p className="text-sm text-gray-500 mt-1">Verify all details before creating the vault deposit.</p>
              </div>

              {/* Review Cards */}
              <div className="space-y-4">
                {/* Client */}
                <ReviewCard title="Client" icon={User} onEdit={() => setStep(1)}>
                  <ReviewRow label="Name" value={selectedClient?.name || "—"} />
                  <ReviewRow label="Email" value={selectedClient?.email || "—"} />
                </ReviewCard>

                {/* AML */}
                <ReviewCard title="Source of Funds" icon={Shield} onEdit={() => setStep(2)}>
                  <ReviewRow label="Source" value={SOURCE_OF_FUNDS.find((s) => s.value === sourceOfFunds)?.label || "—"} />
                  {sourceOfFundsDetail && <ReviewRow label="Details" value={sourceOfFundsDetail} />}
                  <ReviewRow label="Compliance" value="Auto-screened: OFAC, EU, UN, PEP, Watchlist" highlight />
                </ReviewCard>

                {/* Asset */}
                <ReviewCard title="Asset Details" icon={Gem} onEdit={() => setStep(3)}>
                  <ReviewRow label="Type" value={`${ASSET_TYPES.find((a) => a.value === assetType)?.icon} ${ASSET_TYPES.find((a) => a.value === assetType)?.label}`} />
                  <ReviewRow label="Description" value={description} />
                  <ReviewRow label="Weight" value={`${weightGrams}g`} />
                  <ReviewRow label="Purity" value={purity || "—"} />
                  <ReviewRow label="Quantity" value={quantity} />
                  {serialNumbers && <ReviewRow label="Serial #" value={serialNumbers} />}
                  {refinerName && <ReviewRow label="Refiner" value={refinerName} />}
                  {isLBMACertified && <ReviewRow label="LBMA" value="✓ Certified" highlight />}
                </ReviewCard>

                {/* Valuation */}
                <ReviewCard title="Valuation" icon={Scale} onEdit={() => setStep(4)}>
                  <ReviewRow label="Declared Value" value={`$${parseFloat(declaredValue || "0").toLocaleString()}`} bold />
                  {spotPriceAtDeposit && <ReviewRow label="Spot Price" value={`$${spotPriceAtDeposit}/oz`} />}
                </ReviewCard>

                {/* Authorization */}
                <ReviewCard title="Access Authorization" icon={ShieldCheck} onEdit={() => setStep(5)}>
                  <ReviewRow label="Auth Method" value={WITHDRAWAL_METHODS.find((m) => m.value === withdrawalAuthMethod)?.label || "—"} />
                  <ReviewRow label="Authorized Persons" value={authorizedPersons.length > 0 ? authorizedPersons.map((p) => p.name).join(", ") : "None added"} />
                  {securityPin && <ReviewRow label="Security PIN" value="••••••" />}
                </ReviewCard>

                {/* Intake */}
                <ReviewCard title="Intake & Vault" icon={Vault} onEdit={() => setStep(6)}>
                  <ReviewRow label="Method" value={INTAKE_METHODS.find((m) => m.value === intakeMethod)?.label || "—"} />
                  <ReviewRow label="Vault" value={vaultLocation} />
                  {appointmentDate && <ReviewRow label="Appointment" value={new Date(appointmentDate).toLocaleString("en-GB")} />}
                </ReviewCard>
              </div>

              {/* Agreement */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-sm text-emerald-800">
                  <strong>By creating this deposit:</strong> The asset ownership is confirmed by the client,
                  storage terms and fees apply per the standard agreement, and the deposit will enter
                  KYC Review status for compliance verification.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation Footer ──────────────────────────────── */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <span className="text-xs text-gray-400">Step {step} of {STEPS.length}</span>

          {step < 7 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0a1628] text-white text-sm font-semibold hover:bg-[#122041] disabled:opacity-40 transition-colors"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[#D4A853] to-[#C09740] text-[#0a1628] text-sm font-bold hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Vault className="w-4 h-4" />}
              {isPending ? "Creating Deposit..." : "Create Vault Deposit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── REVIEW HELPERS ──────────────────────────────────────────

function ReviewCard({
  title,
  icon: Icon,
  onEdit,
  children,
}: {
  title: string;
  icon: React.ElementType;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#D4A853]" />
          <span className="text-sm font-bold text-gray-800">{title}</span>
        </div>
        <button onClick={onEdit} className="text-xs text-blue-600 hover:underline font-medium">Edit</button>
      </div>
      <div className="p-4 space-y-1.5">{children}</div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`text-right max-w-[60%] ${bold ? "font-bold text-[#D4A853]" : highlight ? "font-semibold text-emerald-600" : "text-gray-900"}`}>
        {value}
      </span>
    </div>
  );
}
