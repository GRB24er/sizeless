"use client";

import { useState } from "react";
import { Vault, Search, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminUpdateVaultStatus } from "@/app/(root)/(protected)/vault/actions";
import { toast } from "sonner";

type Deposit = {
  id: string; depositNumber: string; status: string; assetType: string; description: string;
  weightGrams: number; purity: string | null; quantity: number; declaredValue: number;
  serialNumbers: string | null; vaultLocation: string; storageUnit: string | null;
  insuredValue: number | null; monthlyFee: number | null; depositDate: string;
  verifiedAt: string | null; releasedAt: string | null;
  client: { id: string; name: string; email: string; phone: string };
  activities: { id: string; action: string; description: string; createdAt: string; performedBy: string | null }[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING_VERIFICATION: { label: "Pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  VERIFIED: { label: "Verified", color: "bg-blue-100 text-blue-700 border-blue-200" },
  IN_STORAGE: { label: "In Storage", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  RELEASE_REQUESTED: { label: "Release Req.", color: "bg-orange-100 text-orange-700 border-orange-200" },
  RELEASE_APPROVED: { label: "Approved", color: "bg-purple-100 text-purple-700 border-purple-200" },
  RELEASED: { label: "Released", color: "bg-gray-100 text-gray-600 border-gray-200" },
  SUSPENDED: { label: "Suspended", color: "bg-red-100 text-red-700 border-red-200" },
};

const TRANSITIONS: Record<string, string[]> = {
  PENDING_VERIFICATION: ["VERIFIED", "SUSPENDED"],
  VERIFIED: ["IN_STORAGE", "SUSPENDED"],
  IN_STORAGE: ["RELEASE_REQUESTED", "SUSPENDED"],
  RELEASE_REQUESTED: ["RELEASE_APPROVED", "IN_STORAGE", "SUSPENDED"],
  RELEASE_APPROVED: ["RELEASED", "IN_STORAGE"],
  RELEASED: [],
  SUSPENDED: ["PENDING_VERIFICATION", "IN_STORAGE"],
};

export function AdminVaultTable({ deposits }: { deposits: Deposit[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selected, setSelected] = useState<Deposit | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = deposits.filter(d => {
    const matchSearch = d.depositNumber.toLowerCase().includes(search.toLowerCase()) ||
      d.client.name.toLowerCase().includes(search.toLowerCase()) ||
      d.assetType.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalValue = deposits.filter(d => d.status !== "RELEASED").reduce((s, d) => s + d.declaredValue, 0);

  async function handleUpdate(formData: FormData) {
    setLoading(true);
    const result = await adminUpdateVaultStatus(formData);
    setLoading(false);
    if (result.success) { toast.success("Vault deposit updated."); setSelected(null); }
    else toast.error(result.error);
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-2xl font-bold text-amber-700">${totalValue.toLocaleString()}</p>
          <p className="text-xs text-amber-600">Total Vault Value</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-2xl font-bold text-emerald-700">{deposits.filter(d => d.status === "IN_STORAGE").length}</p>
          <p className="text-xs text-emerald-600">In Storage</p>
        </div>
        <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
          <p className="text-2xl font-bold text-yellow-700">{deposits.filter(d => d.status === "PENDING_VERIFICATION").length}</p>
          <p className="text-xs text-yellow-600">Pending Verification</p>
        </div>
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
          <p className="text-2xl font-bold text-orange-700">{deposits.filter(d => d.status === "RELEASE_REQUESTED").length}</p>
          <p className="text-xs text-orange-600">Release Requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Search deposit #, client, asset..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Deposit #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-gray-500">No deposits found.</TableCell></TableRow>
            ) : filtered.map(dep => {
              const cfg = STATUS_CONFIG[dep.status] || STATUS_CONFIG.PENDING_VERIFICATION;
              return (
                <TableRow key={dep.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm font-medium text-amber-700">{dep.depositNumber}</TableCell>
                  <TableCell><p className="font-medium text-sm">{dep.client.name}</p><p className="text-xs text-gray-500">{dep.client.email}</p></TableCell>
                  <TableCell><p className="text-sm">{dep.quantity}x {dep.assetType}</p>{dep.purity && <p className="text-xs text-gray-500">{dep.purity}</p>}</TableCell>
                  <TableCell className="text-sm">{dep.weightGrams}g</TableCell>
                  <TableCell className="font-semibold text-sm text-amber-700">${dep.declaredValue.toLocaleString()}</TableCell>
                  <TableCell><Badge className={`${cfg.color} border text-xs`}>{cfg.label}</Badge></TableCell>
                  <TableCell className="text-sm text-gray-500">{new Date(dep.depositDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelected(dep)}><Eye className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Detail / Update dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Vault className="w-5 h-5 text-amber-600" /> {selected?.depositNumber}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-6 mt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500">Client</p><p className="font-medium">{selected.client.name}</p></div>
                <div><p className="text-gray-500">Email</p><p className="font-medium">{selected.client.email}</p></div>
                <div><p className="text-gray-500">Asset</p><p className="font-medium">{selected.quantity}x {selected.assetType}</p></div>
                <div><p className="text-gray-500">Weight</p><p className="font-medium">{selected.weightGrams}g ({selected.purity || "N/A"})</p></div>
                <div><p className="text-gray-500">Value</p><p className="font-semibold text-amber-700">${selected.declaredValue.toLocaleString()}</p></div>
                <div><p className="text-gray-500">Storage Unit</p><p className="font-medium">{selected.storageUnit || "Unassigned"}</p></div>
                {selected.serialNumbers && <div className="col-span-2"><p className="text-gray-500">Serial #</p><p className="font-mono text-xs">{selected.serialNumbers}</p></div>}
              </div>

              {TRANSITIONS[selected.status]?.length > 0 && (
                <form action={handleUpdate} className="space-y-4 pt-4 border-t">
                  <input type="hidden" name="depositId" value={selected.id} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Update Status</Label>
                      <Select name="status" required>
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                          {TRANSITIONS[selected.status].map(s => <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Storage Unit</Label><Input name="storageUnit" defaultValue={selected.storageUnit || ""} placeholder="e.g. Vault A - Unit 12" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Monthly Fee ($)</Label><Input name="monthlyFee" type="number" step="0.01" defaultValue={selected.monthlyFee || ""} /></div>
                    <div><Label>Insured Value ($)</Label><Input name="insuredValue" type="number" step="0.01" defaultValue={selected.insuredValue || ""} /></div>
                  </div>
                  <div><Label>Admin Note</Label><Textarea name="note" placeholder="Add a note about this update..." /></div>
                  <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    {loading ? "Updating..." : "Update Deposit"}
                  </Button>
                </form>
              )}

              {selected.activities.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-3">Activity Log</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selected.activities.map(a => (
                      <div key={a.id} className="flex items-start gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                        <div><p className="text-gray-700">{a.description}</p><p className="text-gray-400">{new Date(a.createdAt).toLocaleString()} {a.performedBy && `· ${a.performedBy}`}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
