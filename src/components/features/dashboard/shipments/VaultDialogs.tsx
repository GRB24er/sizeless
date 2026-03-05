"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/dashboard/shipments/VaultDialogs.tsx
// Vault Workflow Dialogs — Intake, Assay, Storage, Insurance
// ═══════════════════════════════════════════════════════════════

import { useState, useTransition } from "react";
import {
  Truck,
  Scale,
  Lock,
  Shield,
  Calendar,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
  FlaskConical,
  Weight,
  MapPin,
  FileText,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

import {
  scheduleIntake,
  recordAssayResult,
  waiveAssay,
  setInsurance,
  placeInStorage,
  updateVaultStatus,
} from "@/app/(root)/shipments/vault-actions";

import {
  ASSAY_METHODS,
  STORAGE_TYPE_CONFIG,
  INSURANCE_OPTIONS,
  VAULT_FEE_SCHEDULE,
  calculateMonthlyStorageFee,
  calculateAnnualInsurance,
} from "@/lib/vault/types";

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

// ─── SHARED FIELD COMPONENTS ─────────────────────────────────

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

const selectClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none bg-white";

// ═════════════════════════════════════════════════════════════
// 1. INTAKE SCHEDULING DIALOG
// ═════════════════════════════════════════════════════════════

export function IntakeDialog({
  open,
  onClose,
  depositId,
  adminId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  depositId: string;
  adminId: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("10:00");
  const [intakeMethod, setIntakeMethod] = useState("CLIENT_DELIVERY");
  const [escortRef, setEscortRef] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!appointmentDate) {
      toast.error("Please select an appointment date");
      return;
    }

    const dateTime = `${appointmentDate}T${appointmentTime}:00`;

    startTransition(async () => {
      const res = await scheduleIntake(
        depositId,
        adminId,
        dateTime,
        intakeMethod,
        escortRef || undefined
      );
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Intake appointment scheduled");
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Schedule Intake Appointment" icon={Calendar}>
      <div className="space-y-5">
        {/* Method */}
        <FormField label="Intake Method" required>
          <div className="grid grid-cols-1 gap-2">
            {[
              {
                value: "CLIENT_DELIVERY",
                label: "Client Delivery",
                desc: "Client delivers under security escort at facility",
                icon: Truck,
              },
              {
                value: "ARMORED_TRANSPORT",
                label: "Armored Transport",
                desc: "Brinks/Loomis collects from client location",
                icon: Shield,
              },
              {
                value: "VAULT_TRANSFER",
                label: "Vault Transfer",
                desc: "Transfer from another vault facility",
                icon: Lock,
              },
            ].map((method) => (
              <label
                key={method.value}
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  intakeMethod === method.value
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="intakeMethod"
                  value={method.value}
                  checked={intakeMethod === method.value}
                  onChange={(e) => setIntakeMethod(e.target.value)}
                  className="mt-1 accent-blue-600"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <method.icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-800">
                      {method.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{method.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </FormField>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date" required>
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className={inputClass}
            />
          </FormField>
          <FormField label="Time" required>
            <select
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className={selectClass}
            >
              {[
                "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
                "11:00", "11:30", "12:00", "13:00", "13:30", "14:00",
                "14:30", "15:00", "15:30", "16:00",
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {/* Escort Reference */}
        {intakeMethod === "ARMORED_TRANSPORT" && (
          <FormField label="Security Escort Reference">
            <input
              type="text"
              value={escortRef}
              onChange={(e) => setEscortRef(e.target.value)}
              placeholder="e.g. BRK-2026-78432"
              className={inputClass}
            />
          </FormField>
        )}

        {/* Notes */}
        <FormField label="Appointment Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Client arriving with 3 sealed containers..."
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </FormField>

        {/* Fee Notice */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100">
          <div className="flex gap-2">
            <DollarSign className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-700">
              <p className="font-semibold mb-1">Applicable Fees</p>
              <p>Intake handling: <strong>${VAULT_FEE_SCHEDULE.intakeHandlingFee}</strong></p>
              {intakeMethod === "ARMORED_TRANSPORT" && (
                <p>Security escort: <strong>${VAULT_FEE_SCHEDULE.securityEscortFee}</strong></p>
              )}
              <p>Tamper seal (per container): <strong>${VAULT_FEE_SCHEDULE.tamperSealFee}</strong></p>
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
            disabled={isPending || !appointmentDate}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4" />
            )}
            {isPending ? "Scheduling..." : "Schedule Appointment"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════
// 2. ASSAY RESULT DIALOG
// ═════════════════════════════════════════════════════════════

export function AssayDialog({
  open,
  onClose,
  depositId,
  adminId,
  declaredWeight,
  isLBMA,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  depositId: string;
  adminId: string;
  declaredWeight: number;
  isLBMA: boolean;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [assayMethod, setAssayMethod] = useState("XRF");
  const [weightVerified, setWeightVerified] = useState(declaredWeight.toString());
  const [assayResult, setAssayResult] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [passed, setPassed] = useState(true);

  const weightDiff = parseFloat(weightVerified) - declaredWeight;
  const weightDiffPercent = ((weightDiff / declaredWeight) * 100).toFixed(3);

  const handleSubmit = () => {
    if (!weightVerified || !performedBy) {
      toast.error("Please fill required fields");
      return;
    }

    startTransition(async () => {
      const res = await recordAssayResult(depositId, adminId, {
        assayMethod,
        assayResult: assayResult || `${assayMethod} analysis ${passed ? "passed" : "failed"}. Weight verified at ${weightVerified}g.`,
        assayPerformedBy: performedBy,
        weightVerified: parseFloat(weightVerified),
        passed,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          passed
            ? "Assay passed — asset verified"
            : "Assay recorded as failed"
        );
        onSuccess();
        onClose();
      }
    });
  };

  const handleWaiveAssay = () => {
    startTransition(async () => {
      const res = await waiveAssay(depositId, adminId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Assay waived — LBMA certification accepted");
        onSuccess();
        onClose();
      }
    });
  };

  const selectedMethod = ASSAY_METHODS.find((m) => m.id === assayMethod);

  return (
    <Modal open={open} onClose={onClose} title="Record Assay Results" icon={FlaskConical}>
      <div className="space-y-5">
        {/* LBMA Waiver Option */}
        {isLBMA && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-start justify-between">
              <div className="flex gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">
                    LBMA Certified Bar(s)
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Assay can be waived. Only serial number and weight confirmation required.
                  </p>
                </div>
              </div>
              <button
                onClick={handleWaiveAssay}
                disabled={isPending}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shrink-0"
              >
                {isPending ? "..." : "Waive Assay"}
              </button>
            </div>
          </div>
        )}

        {/* Assay Method Selection */}
        <FormField label="Assay Method" required>
          <div className="space-y-2">
            {ASSAY_METHODS.map((method) => (
              <label
                key={method.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  assayMethod === method.id
                    ? "border-purple-500 bg-purple-50/50"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="assayMethod"
                  value={method.id}
                  checked={assayMethod === method.id}
                  onChange={(e) => setAssayMethod(e.target.value)}
                  className="mt-1 accent-purple-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      {method.label}
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      ${method.cost}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {method.description}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Turnaround: {method.turnaround}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </FormField>

        {/* Weight Verification */}
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
            <Weight className="w-4 h-4" /> Weight Verification
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Declared Weight
              </label>
              <div className="px-3.5 py-2.5 rounded-lg bg-white border border-gray-200 text-sm font-mono text-gray-700">
                {declaredWeight}g
              </div>
            </div>
            <FormField label="Verified Weight" required>
              <input
                type="number"
                step="0.01"
                value={weightVerified}
                onChange={(e) => setWeightVerified(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </FormField>
          </div>

          {weightVerified && parseFloat(weightVerified) !== declaredWeight && (
            <div
              className={`mt-3 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                Math.abs(weightDiff) > 1
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Discrepancy: {weightDiff > 0 ? "+" : ""}
              {weightDiff.toFixed(2)}g ({weightDiff > 0 ? "+" : ""}
              {weightDiffPercent}%)
              {Math.abs(weightDiff) > 1 && (
                <span className="ml-1 font-bold">— Investigate</span>
              )}
            </div>
          )}
        </div>

        {/* Performed By */}
        <FormField label="Assay Performed By" required>
          <input
            type="text"
            value={performedBy}
            onChange={(e) => setPerformedBy(e.target.value)}
            placeholder="e.g. Dr. Smith, SGS Laboratory, LBMA Ref Lab"
            className={inputClass}
          />
        </FormField>

        {/* Result Notes */}
        <FormField label="Result Notes">
          <textarea
            value={assayResult}
            onChange={(e) => setAssayResult(e.target.value)}
            placeholder="e.g. XRF confirms 999.9 fineness. No tungsten detected. Weight within 0.01g tolerance. Serial number AB-12345 confirmed against refiner records."
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </FormField>

        {/* Pass / Fail */}
        <FormField label="Assay Result" required>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                passed
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-100 text-gray-500 hover:border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="result"
                checked={passed}
                onChange={() => setPassed(true)}
                className="sr-only"
              />
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold text-sm">PASS</span>
            </label>
            <label
              className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                !passed
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-100 text-gray-500 hover:border-gray-200"
              }`}
            >
              <input
                type="radio"
                name="result"
                checked={!passed}
                onChange={() => setPassed(false)}
                className="sr-only"
              />
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold text-sm">FAIL</span>
            </label>
          </div>
        </FormField>

        {/* Fee */}
        {selectedMethod && (
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-700">
            <span className="font-semibold">Assay Fee:</span> $
            {selectedMethod.cost} ({selectedMethod.label})
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
            onClick={handleSubmit}
            disabled={isPending || !weightVerified || !performedBy}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FlaskConical className="w-4 h-4" />
            )}
            {isPending ? "Recording..." : "Record Assay Result"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════
// 3. STORAGE PLACEMENT DIALOG
// ═════════════════════════════════════════════════════════════

export function StorageDialog({
  open,
  onClose,
  depositId,
  adminId,
  weightGrams,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  depositId: string;
  adminId: string;
  weightGrams: number;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [storageType, setStorageType] = useState("ALLOCATED");
  const [storageUnit, setStorageUnit] = useState("");
  const [shelfPosition, setShelfPosition] = useState("");

  const monthlyFee = calculateMonthlyStorageFee(weightGrams, storageType);
  const config = STORAGE_TYPE_CONFIG[storageType];

  const handleSubmit = () => {
    if (!storageUnit) {
      toast.error("Please specify a storage unit/cage ID");
      return;
    }

    startTransition(async () => {
      const res = await placeInStorage(depositId, adminId, {
        storageUnit,
        shelfPosition: shelfPosition || undefined,
        storageType,
        monthlyStorageFee: monthlyFee,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Asset placed in secure storage");
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Assign Storage Location" icon={Lock}>
      <div className="space-y-5">
        {/* Storage Type */}
        <FormField label="Storage Type" required>
          <div className="space-y-2">
            {Object.entries(STORAGE_TYPE_CONFIG).map(([key, cfg]) => (
              <label
                key={key}
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  storageType === key
                    ? "border-emerald-500 bg-emerald-50/50"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="storageType"
                  value={key}
                  checked={storageType === key}
                  onChange={(e) => setStorageType(e.target.value)}
                  className="mt-1 accent-emerald-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      {cfg.label}
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      ${cfg.monthlyRatePerKg}/kg/mo
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {cfg.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </FormField>

        {/* Unit & Position */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Vault Unit / Cage ID" required>
            <input
              type="text"
              value={storageUnit}
              onChange={(e) => setStorageUnit(e.target.value)}
              placeholder="e.g. LV-A3-042"
              className={`${inputClass} font-mono`}
            />
          </FormField>
          <FormField label="Shelf / Position">
            <input
              type="text"
              value={shelfPosition}
              onChange={(e) => setShelfPosition(e.target.value)}
              placeholder="e.g. Bay 2, Shelf C"
              className={inputClass}
            />
          </FormField>
        </div>

        {/* Fee Calculation */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#122041]">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            Monthly Storage Fee
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-gray-400">
                {(weightGrams / 1000).toFixed(3)} kg × $
                {config?.monthlyRatePerKg}/kg
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {config?.label} • Minimum $25/month
              </p>
            </div>
            <p className="text-2xl font-bold text-[#D4A853]">
              ${monthlyFee.toFixed(2)}
              <span className="text-sm font-normal text-gray-400">/mo</span>
            </p>
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
            disabled={isPending || !storageUnit}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {isPending ? "Placing..." : "Place in Storage"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════
// 4. INSURANCE SETUP DIALOG
// ═════════════════════════════════════════════════════════════

export function InsuranceDialog({
  open,
  onClose,
  depositId,
  adminId,
  declaredValue,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  depositId: string;
  adminId: string;
  declaredValue: number;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [coverage, setCoverage] = useState("ALL_RISK");
  const [insuredValue, setInsuredValue] = useState(declaredValue.toString());
  const [policyNo, setPolicyNo] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const selectedOption = INSURANCE_OPTIONS.find((o) => o.id === coverage);
  const annualPremium = calculateAnnualInsurance(
    parseFloat(insuredValue) || 0,
    coverage
  );

  const handleSubmit = () => {
    if (!insuredValue || !policyNo || !expiryDate) {
      toast.error("Please fill all required fields");
      return;
    }

    startTransition(async () => {
      const res = await setInsurance(depositId, adminId, {
        insuredValue: parseFloat(insuredValue),
        insuranceProvider: selectedOption?.provider || "Lloyd's of London",
        insurancePolicyNo: policyNo,
        insuranceCoverage: coverage,
        insuranceExpiryDate: expiryDate,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Insurance activated");
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Activate Insurance Coverage" icon={Shield}>
      <div className="space-y-5">
        {/* Coverage Type */}
        <FormField label="Coverage Level" required>
          <div className="space-y-2">
            {INSURANCE_OPTIONS.map((option) => (
              <label
                key={option.id}
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  coverage === option.id
                    ? "border-blue-500 bg-blue-50/50"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="coverage"
                  value={option.id}
                  checked={coverage === option.id}
                  onChange={(e) => setCoverage(e.target.value)}
                  className="mt-1 accent-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">
                      {option.label}
                    </span>
                    <span className="text-xs font-bold text-blue-700">
                      {option.ratePercent}% p.a.
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {option.description}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Underwriter: {option.provider}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </FormField>

        {/* Insured Value */}
        <FormField label="Insured Value (USD)" required>
          <input
            type="number"
            value={insuredValue}
            onChange={(e) => setInsuredValue(e.target.value)}
            className={`${inputClass} font-mono`}
          />
          <p className="text-xs text-gray-400 mt-1">
            Declared value: ${declaredValue.toLocaleString()}
          </p>
        </FormField>

        {/* Policy Number */}
        <FormField label="Policy Number" required>
          <input
            type="text"
            value={policyNo}
            onChange={(e) => setPolicyNo(e.target.value)}
            placeholder="e.g. LLO-GLD-2026-78432"
            className={`${inputClass} font-mono`}
          />
        </FormField>

        {/* Expiry Date */}
        <FormField label="Policy Expiry Date" required>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className={inputClass}
          />
        </FormField>

        {/* Premium Calculation */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#122041]">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
            Annual Premium
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm text-gray-400">
                ${parseFloat(insuredValue || "0").toLocaleString()} ×{" "}
                {selectedOption?.ratePercent}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedOption?.label} • Minimum $500/year
              </p>
            </div>
            <p className="text-2xl font-bold text-[#D4A853]">
              ${annualPremium.toFixed(2)}
              <span className="text-sm font-normal text-gray-400">/yr</span>
            </p>
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
            disabled={isPending || !insuredValue || !policyNo || !expiryDate}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            {isPending ? "Activating..." : "Activate Insurance"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
