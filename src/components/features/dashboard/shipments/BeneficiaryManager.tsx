"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/dashboard/shipments/BeneficiaryManager.tsx
// Vault Beneficiary Management — Add, verify, revoke beneficiaries
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useTransition } from "react";
import {
  CheckCircle,
  Clock,
  Loader2,
  Plus,
  Shield,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  addBeneficiary,
  verifyBeneficiary,
  revokeBeneficiary,
  removeBeneficiary,
  getBeneficiaries,
} from "@/app/(root)/shipments/vault-advanced-actions";

type Beneficiary = {
  id: string;
  name: string;
  relationship: string;
  email: string | null;
  phone: string | null;
  allocationPercent: number;
  status: string;
  powerOfAttorney: boolean;
  authorizedActions: string | null;
  verifiedAt: string | null;
  notes: string | null;
  createdAt: string;
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  PENDING: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  VERIFIED: { label: "Verified", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle },
  REVOKED: { label: "Revoked", color: "text-gray-500", bg: "bg-gray-100 border-gray-300", icon: UserMinus },
};

const relationLabels: Record<string, string> = {
  SPOUSE: "Spouse", CHILD: "Child", PARENT: "Parent", SIBLING: "Sibling",
  BUSINESS_PARTNER: "Business Partner", LEGAL_ENTITY: "Legal Entity", OTHER: "Other",
};

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all";

// ═══════════════════════════════════════════════════════════════
// ADD BENEFICIARY DIALOG
// ═══════════════════════════════════════════════════════════════

function AddBeneficiaryDialog({
  open,
  onClose,
  depositId,
  adminId,
  currentAllocation,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  depositId: string;
  adminId: string;
  currentAllocation: number;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("SPOUSE");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [allocation, setAllocation] = useState(String(100 - currentAllocation));
  const [poa, setPoa] = useState(false);
  const [actions, setActions] = useState<string[]>(["VIEW"]);
  const [notes, setNotes] = useState("");

  if (!open) return null;

  const maxAllocation = 100 - currentAllocation;

  const toggleAction = (a: string) => {
    setActions((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  };

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("Enter beneficiary name"); return; }
    if (parseFloat(allocation) > maxAllocation) { toast.error(`Max allocation: ${maxAllocation}%`); return; }

    startTransition(async () => {
      const res = await addBeneficiary(depositId, adminId, {
        name,
        relationship,
        email: email || undefined,
        phone: phone || undefined,
        allocationPercent: parseFloat(allocation) || 0,
        powerOfAttorney: poa,
        authorizedActions: actions,
        notes: notes || undefined,
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success(`Beneficiary ${name} added`);
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center">
              <UserPlus className="w-4.5 h-4.5 text-white" />
            </div>
            <h3 className="text-lg font-bold">Add Beneficiary</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full legal name" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Relationship</label>
              <select value={relationship} onChange={(e) => setRelationship(e.target.value)} className={inputClass}>
                {Object.entries(relationLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Allocation %</label>
              <input type="number" min={1} max={maxAllocation} value={allocation} onChange={(e) => setAllocation(e.target.value)} className={`${inputClass} font-mono`} />
              <p className="text-xs text-gray-400 mt-0.5">Available: {maxAllocation}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={inputClass} />
            </div>
          </div>

          {/* Authorized Actions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Authorized Actions</label>
            <div className="flex flex-wrap gap-2">
              {["VIEW", "WITHDRAW", "TRANSFER"].map((a) => (
                <label
                  key={a}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
                    actions.includes(a)
                      ? "bg-purple-100 border-purple-300 text-purple-700"
                      : "bg-gray-50 border-gray-200 text-gray-500"
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={actions.includes(a)} onChange={() => toggleAction(a)} />
                  {a}
                </label>
              ))}
            </div>
          </div>

          {/* Power of Attorney */}
          <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={poa} onChange={(e) => setPoa(e.target.checked)} className="accent-purple-600 w-4 h-4" />
            <div>
              <p className="text-sm font-medium text-gray-800">Power of Attorney</p>
              <p className="text-xs text-gray-500">Beneficiary can act on behalf of depositor</p>
            </div>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`${inputClass} resize-none`} placeholder="Additional notes..." />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={isPending || !name.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {isPending ? "Adding..." : "Add Beneficiary"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN BENEFICIARY MANAGER
// ═══════════════════════════════════════════════════════════════

export default function BeneficiaryManager({
  depositId,
  adminId,
}: {
  depositId: string;
  adminId: string;
}) {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    setLoading(true);
    const res = await getBeneficiaries(depositId);
    setBeneficiaries(res.beneficiaries as any);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [depositId]);

  const activeBens = beneficiaries.filter((b) => ["PENDING", "VERIFIED"].includes(b.status));
  const currentAllocation = activeBens.reduce((s, b) => s + b.allocationPercent, 0);

  const handleVerify = (id: string, approved: boolean) => {
    startTransition(async () => {
      const res = await verifyBeneficiary(id, adminId, approved, approved ? undefined : "Identity not verified");
      if (res.error) toast.error(res.error);
      else { toast.success(approved ? "Beneficiary verified" : "Beneficiary rejected"); loadData(); }
    });
  };

  const handleRevoke = (id: string) => {
    startTransition(async () => {
      const res = await revokeBeneficiary(id, adminId);
      if (res.error) toast.error(res.error);
      else { toast.success("Access revoked"); loadData(); }
    });
  };

  const handleRemove = (id: string) => {
    startTransition(async () => {
      const res = await removeBeneficiary(id, adminId);
      if (res.error) toast.error(res.error);
      else { toast.success("Beneficiary removed"); loadData(); }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <Users className="w-3.5 h-3.5" /> Beneficiaries
          {activeBens.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
              {activeBens.length}
            </span>
          )}
        </p>
        <button
          onClick={() => setAddDialogOpen(true)}
          disabled={currentAllocation >= 100}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* Allocation Bar */}
      {activeBens.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Allocation</span>
            <span className="font-semibold">{currentAllocation}% assigned</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
            {activeBens.map((b, i) => {
              const colors = ["bg-purple-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500"];
              return (
                <div
                  key={b.id}
                  className={`h-full ${colors[i % colors.length]} transition-all`}
                  style={{ width: `${b.allocationPercent}%` }}
                  title={`${b.name}: ${b.allocationPercent}%`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <AddBeneficiaryDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        depositId={depositId}
        adminId={adminId}
        currentAllocation={currentAllocation}
        onSuccess={loadData}
      />

      {/* List */}
      {loading ? (
        <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
      ) : beneficiaries.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-3">No beneficiaries designated for this deposit.</p>
      ) : (
        <div className="space-y-2">
          {beneficiaries.map((b) => {
            const cfg = statusConfig[b.status] || statusConfig.PENDING;
            const StatusIcon = cfg.icon;
            const actions = b.authorizedActions ? JSON.parse(b.authorizedActions) : [];

            return (
              <div key={b.id} className={`rounded-xl border ${cfg.bg} overflow-hidden`}>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/80 flex items-center justify-center text-sm font-bold text-gray-600">
                        {b.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{b.name}</p>
                        <p className="text-xs text-gray-500">
                          {relationLabels[b.relationship] || b.relationship} • {b.allocationPercent}%
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" /> {cfg.label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {actions.map((a: string) => (
                      <span key={a} className="px-2 py-0.5 rounded-full bg-white/80 border border-gray-200 text-xs text-gray-600">
                        {a}
                      </span>
                    ))}
                    {b.powerOfAttorney && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 border border-purple-200 text-xs text-purple-700 font-semibold">
                        POA
                      </span>
                    )}
                  </div>

                  {b.email && <p className="text-xs text-gray-400 mt-2">{b.email}</p>}
                </div>

                {/* Actions */}
                {b.status !== "REVOKED" && (
                  <div className="px-4 py-2 bg-white/50 border-t border-gray-200/30 flex justify-end gap-2">
                    {b.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleVerify(b.id, true)}
                          disabled={isPending}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <UserCheck className="w-3 h-3" /> Verify
                        </button>
                        <button
                          onClick={() => handleVerify(b.id, false)}
                          disabled={isPending}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 disabled:opacity-50"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </>
                    )}
                    {b.status === "VERIFIED" && (
                      <button
                        onClick={() => handleRevoke(b.id)}
                        disabled={isPending}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 disabled:opacity-50"
                      >
                        <UserMinus className="w-3 h-3" /> Revoke
                      </button>
                    )}
                    {["REJECTED", "PENDING"].includes(b.status) && (
                      <button
                        onClick={() => handleRemove(b.id)}
                        disabled={isPending}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 text-xs disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
