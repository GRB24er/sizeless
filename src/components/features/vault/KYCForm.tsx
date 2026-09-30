"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/vault/KYCForm.tsx
// Client-Facing KYC Submission Form — Multi-step wizard
// ═══════════════════════════════════════════════════════════════

import { useState, useRef, useTransition } from "react";
import {
  Shield,
  Upload,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  FileText,
  User,
  MapPin,
  Pickaxe,
  Building2,
  AlertCircle,
  Loader2,
  Eye,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { submitKYC } from "@/app/(root)/(protected)/my-vault/kyc-actions";

// ─── CONSTANTS ───────────────────────────────────────────────

const ID_TYPES = [
  { value: "PASSPORT", label: "Valid Passport" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
  { value: "NATIONAL_ID", label: "National Identity Card" },
  { value: "RESIDENCE_PERMIT", label: "Residence Permit" },
];

const ADDRESS_DOC_TYPES = [
  { value: "UTILITY_BILL", label: "Utility Bill (< 3 months)" },
  { value: "BANK_STATEMENT", label: "Bank Statement (< 3 months)" },
  { value: "GOV_LETTER", label: "Government Letter" },
  { value: "TAX_ASSESSMENT", label: "Tax Assessment Notice" },
];

const SOURCE_OF_GOLD = [
  { value: "MINE_DIRECT", label: "Direct from Mine / Concession" },
  { value: "REFINERY", label: "Purchased from Licensed Refinery" },
  { value: "DEALER", label: "Purchased from Authorized Dealer" },
  { value: "INHERITANCE", label: "Inheritance / Estate" },
  { value: "INVESTMENT", label: "Investment Holdings" },
  { value: "VAULT_TRANSFER", label: "Transfer from Another Vault" },
  { value: "OTHER", label: "Other (provide documentation)" },
];

const STEPS = [
  { id: 1, label: "Identity", icon: User },
  { id: 2, label: "Address", icon: MapPin },
  { id: 3, label: "Source of Gold", icon: Pickaxe },
  { id: 4, label: "Corporate", icon: Building2 },
  { id: 5, label: "Review", icon: Eye },
];

// ─── FILE UPLOAD COMPONENT ───────────────────────────────────

function FileUpload({
  label,
  accept,
  value,
  onChange,
  required,
}: {
  label: string;
  accept?: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum 10MB.");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file: base64,
            fileName: file.name,
            folder: "kyc",
          }),
        });

        const data = await res.json();
        if (data.success) {
          onChange(data.url);
          setFileName(file.name);
          toast.success("Document uploaded");
        } else {
          toast.error(data.error || "Upload failed");
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Upload failed");
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-2">
        {label} {required && <span className="text-[#B42318]">*</span>}
      </label>
      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1F7A4D]/10 border border-[#1F7A4D]/25">
          <CheckCircle className="w-5 h-5 text-[#1F7A4D] shrink-0" />
          <span className="text-sm text-[#1F7A4D] truncate flex-1">
            {fileName || "Document uploaded"}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setFileName("");
            }}
            className="text-ink-2 hover:text-[#B42318] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-line-2 hover:border-ink/30 bg-canvas cursor-pointer transition-all"
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-signal-ink animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-ink-2" />
          )}
          <span className="text-sm text-ink-2">
            {isUploading ? "Uploading..." : "Click to upload (PDF, JPG, PNG — max 10MB)"}
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept || ".pdf,.jpg,.jpeg,.png,.webp"}
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}

// ─── MAIN KYC FORM ───────────────────────────────────────────

export default function KYCForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [formData, setFormData] = useState({
    idType: "",
    idNumber: "",
    idExpiryDate: "",
    idDocumentUrl: "",
    addressDocType: "",
    addressDocUrl: "",
    sourceOfGold: "",
    sourceDocUrl: "",
    sourceNotes: "",
    corporateName: "",
    corporateRegNo: "",
    corporateDocUrl: "",
  });

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Validation per step
  const isStepValid = (s: number) => {
    switch (s) {
      case 1:
        return (
          formData.idType &&
          formData.idNumber &&
          formData.idExpiryDate &&
          formData.idDocumentUrl
        );
      case 2:
        return formData.addressDocType && formData.addressDocUrl;
      case 3:
        return formData.sourceOfGold && formData.sourceDocUrl;
      case 4:
        return true; // Corporate is optional
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const res = await submitKYC(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("KYC application submitted successfully!");
        onSuccess?.();
      }
    });
  };

  // ── Select Component ──

  const SelectField = ({
    label,
    options,
    value,
    onChange,
    required,
  }: {
    label: string;
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
    required?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-ink mb-2">
        {label} {required && <span className="text-[#B42318]">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-md bg-white border border-line-2 text-ink text-sm focus:border-ink focus:outline-none focus:ring-1 focus:ring-signal/15 transition-all appearance-none"
      >
        <option value="" className="bg-white">
          Select...
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-white">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  const InputField = ({
    label,
    type,
    value,
    onChange,
    placeholder,
    required,
  }: {
    label: string;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    required?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium text-ink mb-2">
        {label} {required && <span className="text-[#B42318]">*</span>}
      </label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-md bg-white border border-line-2 text-ink text-sm placeholder:text-ink-3 focus:border-ink focus:outline-none focus:ring-1 focus:ring-signal/15 transition-all"
      />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-10 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const isActive = step === s.id;
          const isComplete = step > s.id;
          return (
            <div key={s.id} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? "bg-signal-soft text-signal-ink border border-signal/30"
                    : isComplete
                    ? "bg-[#1F7A4D]/10 text-[#1F7A4D]"
                    : "text-ink-3"
                }`}
              >
                {isComplete ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
                <span className="hidden sm:inline whitespace-nowrap">
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight
                  className={`w-4 h-4 mx-1 ${
                    isComplete ? "text-[#1F7A4D]/50" : "text-line-2"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-surface rounded-xl border border-line p-8">
        {/* Step 1: Identity */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-signal-soft flex items-center justify-center">
                <User className="w-5 h-5 text-signal-ink" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">
                  Identity Verification
                </h3>
                <p className="text-xs text-ink-2">
                  Government-issued photo ID required
                </p>
              </div>
            </div>

            <SelectField
              label="ID Document Type"
              options={ID_TYPES}
              value={formData.idType}
              onChange={(v) => update("idType", v)}
              required
            />
            <InputField
              label="ID Number"
              value={formData.idNumber}
              onChange={(v) => update("idNumber", v)}
              placeholder="e.g. AB1234567"
              required
            />
            <InputField
              label="ID Expiry Date"
              type="date"
              value={formData.idExpiryDate}
              onChange={(v) => update("idExpiryDate", v)}
              required
            />
            <FileUpload
              label="Upload ID Document (front & back)"
              value={formData.idDocumentUrl}
              onChange={(v) => update("idDocumentUrl", v)}
              required
            />
          </div>
        )}

        {/* Step 2: Address */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-signal-soft flex items-center justify-center">
                <MapPin className="w-5 h-5 text-signal-ink" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">
                  Proof of Address
                </h3>
                <p className="text-xs text-ink-2">
                  Document must be dated within the last 3 months
                </p>
              </div>
            </div>

            <SelectField
              label="Address Document Type"
              options={ADDRESS_DOC_TYPES}
              value={formData.addressDocType}
              onChange={(v) => update("addressDocType", v)}
              required
            />
            <FileUpload
              label="Upload Proof of Address"
              value={formData.addressDocUrl}
              onChange={(v) => update("addressDocUrl", v)}
              required
            />
          </div>
        )}

        {/* Step 3: Source of Gold */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-signal-soft flex items-center justify-center">
                <Pickaxe className="w-5 h-5 text-signal-ink" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">
                  Source of Gold / Funds
                </h3>
                <p className="text-xs text-ink-2">
                  Required for AML compliance — how did you acquire the gold?
                </p>
              </div>
            </div>

            <SelectField
              label="Source of Gold"
              options={SOURCE_OF_GOLD}
              value={formData.sourceOfGold}
              onChange={(v) => update("sourceOfGold", v)}
              required
            />
            <FileUpload
              label="Upload Supporting Document (purchase receipt, mine license, inheritance proof)"
              value={formData.sourceDocUrl}
              onChange={(v) => update("sourceDocUrl", v)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Additional Notes (optional)
              </label>
              <textarea
                value={formData.sourceNotes}
                onChange={(e) => update("sourceNotes", e.target.value)}
                placeholder="e.g. Purchased from ABC Refinery in Accra, Ghana. Invoice #GH-2024-1234."
                rows={3}
                className="w-full px-4 py-3 rounded-md bg-white border border-line-2 text-ink text-sm placeholder:text-ink-3 focus:border-ink focus:outline-none focus:ring-1 focus:ring-signal/15 transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 4: Corporate (Optional) */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-signal-soft flex items-center justify-center">
                <Building2 className="w-5 h-5 text-signal-ink" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">
                  Corporate Information
                </h3>
                <p className="text-xs text-ink-2">
                  Only required if depositing on behalf of a company
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-tint border border-line mb-4">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-ink-3 mt-0.5 shrink-0" />
                <p className="text-sm text-ink-2">
                  Skip this step if you are depositing as an individual. These
                  fields are only for corporate clients.
                </p>
              </div>
            </div>

            <InputField
              label="Company Name"
              value={formData.corporateName}
              onChange={(v) => update("corporateName", v)}
              placeholder="e.g. ABC Mining Ltd."
            />
            <InputField
              label="Registration Number"
              value={formData.corporateRegNo}
              onChange={(v) => update("corporateRegNo", v)}
              placeholder="e.g. RC-2024-12345"
            />
            <FileUpload
              label="Upload Certificate of Incorporation"
              value={formData.corporateDocUrl}
              onChange={(v) => update("corporateDocUrl", v)}
            />
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#1F7A4D]/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-[#1F7A4D]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">
                  Review & Submit
                </h3>
                <p className="text-xs text-ink-2">
                  Please verify all information before submitting
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Identity */}
              <div className="p-4 rounded-xl bg-canvas border border-line">
                <p className="text-xs text-signal-ink font-semibold uppercase tracking-wide mb-3">
                  Identity
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-ink-2">ID Type:</span>{" "}
                    <span className="text-ink font-medium">
                      {ID_TYPES.find((t) => t.value === formData.idType)
                        ?.label || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-2">ID Number:</span>{" "}
                    <span className="text-ink font-medium font-mono">
                      {formData.idNumber || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-2">Expiry:</span>{" "}
                    <span className="text-ink font-medium">
                      {formData.idExpiryDate || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-2">Document:</span>{" "}
                    {formData.idDocumentUrl ? (
                      <span className="text-[#1F7A4D]">✓ Uploaded</span>
                    ) : (
                      <span className="text-[#B42318]">✗ Missing</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="p-4 rounded-xl bg-canvas border border-line">
                <p className="text-xs text-signal-ink font-semibold uppercase tracking-wide mb-3">
                  Proof of Address
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-ink-2">Doc Type:</span>{" "}
                    <span className="text-ink font-medium">
                      {ADDRESS_DOC_TYPES.find(
                        (t) => t.value === formData.addressDocType
                      )?.label || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-2">Document:</span>{" "}
                    {formData.addressDocUrl ? (
                      <span className="text-[#1F7A4D]">✓ Uploaded</span>
                    ) : (
                      <span className="text-[#B42318]">✗ Missing</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Source of Gold */}
              <div className="p-4 rounded-xl bg-canvas border border-line">
                <p className="text-xs text-signal-ink font-semibold uppercase tracking-wide mb-3">
                  Source of Gold
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-ink-2">Source:</span>{" "}
                    <span className="text-ink font-medium">
                      {SOURCE_OF_GOLD.find(
                        (t) => t.value === formData.sourceOfGold
                      )?.label || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-2">Document:</span>{" "}
                    {formData.sourceDocUrl ? (
                      <span className="text-[#1F7A4D]">✓ Uploaded</span>
                    ) : (
                      <span className="text-[#B42318]">✗ Missing</span>
                    )}
                  </div>
                </div>
                {formData.sourceNotes && (
                  <p className="text-xs text-ink-2 mt-2">
                    Notes: {formData.sourceNotes}
                  </p>
                )}
              </div>

              {/* Corporate (if filled) */}
              {formData.corporateName && (
                <div className="p-4 rounded-xl bg-canvas border border-line">
                  <p className="text-xs text-signal-ink font-semibold uppercase tracking-wide mb-3">
                    Corporate
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-ink-2">Company:</span>{" "}
                      <span className="text-ink font-medium">
                        {formData.corporateName}
                      </span>
                    </div>
                    <div>
                      <span className="text-ink-2">Reg. No:</span>{" "}
                      <span className="text-ink font-medium font-mono">
                        {formData.corporateRegNo || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Compliance Notice */}
            <div className="p-4 rounded-xl bg-signal-soft border border-signal/25">
              <div className="flex gap-2">
                <Shield className="w-4 h-4 text-signal-ink mt-0.5 shrink-0" />
                <p className="text-xs text-ink-2">
                  By submitting this application, you confirm that all
                  information and documents provided are accurate and genuine.
                  False or fraudulent submissions will result in permanent
                  account suspension and may be reported to relevant
                  authorities.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-line">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-ink-2 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(5, s + 1))}
              disabled={!isStepValid(step)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-ink text-white text-sm font-semibold hover:bg-navy-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex items-center gap-2 px-8 py-3 rounded-md bg-signal text-white text-sm font-semibold hover:bg-signal-hover disabled:opacity-50 transition-colors"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {isPending ? "Submitting..." : "Submit KYC Application"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
