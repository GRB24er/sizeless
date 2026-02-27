"use client";

import { useState } from "react";
import { Vault, Plus, Eye, Clock, Shield, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { requestVaultDeposit, requestVaultRelease } from "@/app/(root)/(protected)/vault/actions";
import { toast } from "sonner";

type VaultDeposit = {
  id: string; depositNumber: string; status: string; assetType: string; description: string;
  weightGrams: number; purity: string | null; quantity: number; declaredValue: number;
  serialNumbers: string | null; vaultLocation: string; storageUnit: string | null;
  insuredValue: number | null; monthlyFee: number | null; depositDate: string;
  verifiedAt: string | null; releasedAt: string | null;
  activities: { id: string; action: string; description: string; createdAt: string }[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING_VERIFICATION: { label: "Pending Verification", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  VERIFIED: { label: "Verified", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  IN_STORAGE: { label: "In Storage", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  RELEASE_REQUESTED: { label: "Release Requested", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  RELEASE_APPROVED: { label: "Release Approved", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  RELEASED: { label: "Released", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  SUSPENDED: { label: "Suspended", color: "bg-red-500/10 text-red-500 border-red-500/20" },
};

export function VaultDashboard({ deposits }: { deposits: VaultDeposit[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<VaultDeposit | null>(null);

  const totalValue = deposits.filter(d => d.status !== "RELEASED").reduce((sum, d) => sum + d.declaredValue, 0);
  const inStorage = deposits.filter(d => d.status === "IN_STORAGE").length;
  const pending = deposits.filter(d => d.status === "PENDING_VERIFICATION" || d.status === "VERIFIED").length;

  async function handleDeposit(formData: FormData) {
    setLoading(true);
    const result = await requestVaultDeposit(formData);
    setLoading(false);
    if (result.success) { toast.success(`Deposit ${result.depositNumber} submitted successfully.`); setOpen(false); }
    else toast.error(result.error);
  }

  async function handleRelease(depositId: string) {
    const result = await requestVaultRelease(depositId);
    if (result.success) toast.success("Release request submitted.");
    else toast.error(result.error);
  }

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-6 rounded-2xl bg-[#D4A853]/5 border border-[#D4A853]/20">
          <Vault className="w-8 h-8 text-[#D4A853] mb-3" />
          <p className="text-2xl font-bold text-white">${totalValue.toLocaleString()}</p>
          <p className="text-sm text-slate-400">Total Vault Value</p>
        </div>
        <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
          <Shield className="w-8 h-8 text-emerald-400 mb-3" />
          <p className="text-2xl font-bold text-white">{inStorage}</p>
          <p className="text-sm text-slate-400">Assets in Storage</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
          <Clock className="w-8 h-8 text-slate-400 mb-3" />
          <p className="text-2xl font-bold text-white">{pending}</p>
          <p className="text-sm text-slate-400">Pending Verification</p>
        </div>
      </div>

      {/* Header + New Deposit button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Your Deposits</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#D4A853] to-[#C09740] text-[#0A1628] font-semibold hover:from-[#F5DEB3] hover:to-[#D4A853]">
              <Plus className="w-4 h-4 mr-2" /> New Deposit
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0D1F35] border-[#D4A853]/20 text-white max-w-lg">
            <DialogHeader><DialogTitle className="text-[#D4A853]">Request Vault Deposit</DialogTitle></DialogHeader>
            <form action={handleDeposit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Asset Type *</Label>
                  <Select name="assetType" required>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent className="bg-[#0D1F35] border-slate-700">
                      {["Gold Bar","Gold Coin","Silver Bar","Silver Coin","Platinum Bar","Palladium"].map(t => (
                        <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">Purity</Label>
                  <Select name="purity">
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-[#0D1F35] border-slate-700">
                      {["999.9 (24K)","995 (23.88K)","916.7 (22K)","750 (18K)","999 (Fine Silver)"].map(p => (
                        <SelectItem key={p} value={p} className="text-white">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Description *</Label>
                <Textarea name="description" required placeholder="e.g. 1kg LBMA-approved gold bar, PAMP Suisse" className="bg-slate-800/50 border-slate-700 text-white" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><Label className="text-slate-300">Weight (g) *</Label><Input name="weightGrams" type="number" step="0.01" required className="bg-slate-800/50 border-slate-700 text-white" /></div>
                <div><Label className="text-slate-300">Quantity *</Label><Input name="quantity" type="number" defaultValue={1} min={1} required className="bg-slate-800/50 border-slate-700 text-white" /></div>
                <div><Label className="text-slate-300">Value (USD) *</Label><Input name="declaredValue" type="number" step="0.01" required className="bg-slate-800/50 border-slate-700 text-white" /></div>
              </div>
              <div>
                <Label className="text-slate-300">Serial Numbers (optional)</Label>
                <Input name="serialNumbers" placeholder="Comma-separated if multiple" className="bg-slate-800/50 border-slate-700 text-white" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#D4A853] to-[#C09740] text-[#0A1628] font-semibold">
                {loading ? "Submitting..." : "Submit Deposit Request"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Deposits list */}
      {deposits.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-slate-800/20 border border-slate-700/30">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">No vault deposits yet.</p>
          <p className="text-sm text-slate-500">Click &quot;New Deposit&quot; to submit your first deposit request.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deposits.map((dep) => {
            const cfg = STATUS_CONFIG[dep.status] || STATUS_CONFIG.PENDING_VERIFICATION;
            return (
              <div key={dep.id} className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-[#D4A853]/20 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#D4A853]/15 flex items-center justify-center"><Vault className="w-5 h-5 text-[#D4A853]" /></div>
                    <div>
                      <p className="font-semibold text-white">{dep.depositNumber}</p>
                      <p className="text-xs text-slate-500">{new Date(dep.depositDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge className={`${cfg.color} border text-xs`}>{cfg.label}</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                  <div><p className="text-slate-500">Asset</p><p className="text-white font-medium">{dep.quantity}x {dep.assetType}</p></div>
                  <div><p className="text-slate-500">Weight</p><p className="text-white font-medium">{dep.weightGrams}g</p></div>
                  <div><p className="text-slate-500">Purity</p><p className="text-white font-medium">{dep.purity || "—"}</p></div>
                  <div><p className="text-slate-500">Value</p><p className="text-[#D4A853] font-semibold">${dep.declaredValue.toLocaleString()}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => setSelectedDeposit(selectedDeposit?.id === dep.id ? null : dep)}>
                    <Eye className="w-3.5 h-3.5 mr-1.5" /> Activity
                  </Button>
                  {dep.status === "IN_STORAGE" && (
                    <Button variant="outline" size="sm" className="border-[#D4A853]/30 text-[#D4A853] hover:bg-[#D4A853]/10" onClick={() => handleRelease(dep.id)}>
                      <ArrowRight className="w-3.5 h-3.5 mr-1.5" /> Request Release
                    </Button>
                  )}
                </div>
                {selectedDeposit?.id === dep.id && dep.activities.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                    {dep.activities.map((a) => (
                      <div key={a.id} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-[#D4A853]/50 mt-1.5 flex-shrink-0" />
                        <div><p className="text-slate-300">{a.description}</p><p className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleString()}</p></div>
                      </div>
                    ))}
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
