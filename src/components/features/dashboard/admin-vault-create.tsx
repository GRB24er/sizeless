"use client";

import { useState, useTransition } from "react";
import {
  Vault, Plus, User, Search, CheckCircle, Loader2, Copy, Gem, Scale,
  ShieldCheck, MapPin, DollarSign, Hash, FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { adminCreateVaultDeposit } from "@/app/dashboard/vault/actions";

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

const ASSET_TYPES = [
  "Gold Bar", "Gold Coin", "Gold Bullion", "Gold Jewelry",
  "Silver Bar", "Silver Coin", "Silver Bullion",
  "Platinum Bar", "Platinum Coin",
  "Palladium Bar", "Diamond", "Gemstone",
  "Cash (USD)", "Cash (EUR)", "Cash (GBP)",
  "Documents", "Other",
];

const PURITY_OPTIONS = [
  "999.9 (24K)", "995.0", "990.0", "916.7 (22K)", "750.0 (18K)",
  "585.0 (14K)", "375.0 (9K)", "N/A",
];

const VAULT_LOCATIONS = [
  "Ipswich Main Vault",
  "London Secure Vault",
  "Zurich Vault Facility",
  "Singapore Freeport",
  "Dubai Gold Vault",
];

export function AdminVaultCreate({ clients }: { clients: Client[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdDeposit, setCreatedDeposit] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Form state
  const [selectedClient, setSelectedClient] = useState("");
  const [assetType, setAssetType] = useState("");
  const [description, setDescription] = useState("");
  const [weightGrams, setWeightGrams] = useState("");
  const [purity, setPurity] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [declaredValue, setDeclaredValue] = useState("");
  const [serialNumbers, setSerialNumbers] = useState("");
  const [vaultLocation, setVaultLocation] = useState("Ipswich Main Vault");
  const [storageUnit, setStorageUnit] = useState("");
  const [insuredValue, setInsuredValue] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [status, setStatus] = useState("IN_STORAGE");

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const selectedClientObj = clients.find(c => c.id === selectedClient);

  const resetForm = () => {
    setSelectedClient(""); setAssetType(""); setDescription(""); setWeightGrams("");
    setPurity(""); setQuantity("1"); setDeclaredValue(""); setSerialNumbers("");
    setVaultLocation("Ipswich Main Vault"); setStorageUnit(""); setInsuredValue("");
    setMonthlyFee(""); setStatus("IN_STORAGE"); setClientSearch("");
  };

  const handleCreate = () => {
    if (!selectedClient || !assetType || !description || !weightGrams || !declaredValue) {
      toast.error("Fill in all required fields");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("clientId", selectedClient);
      formData.set("assetType", assetType);
      formData.set("description", description);
      formData.set("weightGrams", weightGrams);
      formData.set("purity", purity);
      formData.set("quantity", quantity);
      formData.set("declaredValue", declaredValue);
      formData.set("serialNumbers", serialNumbers);
      formData.set("vaultLocation", vaultLocation);
      formData.set("storageUnit", storageUnit);
      if (insuredValue) formData.set("insuredValue", insuredValue);
      if (monthlyFee) formData.set("monthlyFee", monthlyFee);
      formData.set("status", status);

      const result = await adminCreateVaultDeposit(formData);

      if (result.success) {
        setCreatedDeposit(result.depositNumber || "");
        setShowCreate(false);
        setShowSuccess(true);
        resetForm();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100">
              <Vault className="w-6 h-6 text-amber-700" />
            </div>
            Vault Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create vault deposits and manage client assets</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Create Vault Deposit
        </Button>
      </div>

      {/* ═══ CREATE DEPOSIT DIALOG ═══ */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Vault className="w-5 h-5 text-amber-600" /> Create Vault Deposit
            </DialogTitle>
            <DialogDescription>Create a new vault deposit for a client. An email notification will be sent.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Client Selection */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" /> Select Client *
              </label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 pb-2">
                    <Input
                      placeholder="Search clients..."
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  {filteredClients.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClientObj && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-sm">
                    {selectedClientObj.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">{selectedClientObj.name}</p>
                    <p className="text-xs text-emerald-600">{selectedClientObj.email} · {selectedClientObj.phone}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Asset Details */}
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Gem className="w-4 h-4 text-amber-600" /> Asset Details
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Asset Type *</label>
                <Select value={assetType} onValueChange={setAssetType}>
                  <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Purity</label>
                <Select value={purity} onValueChange={setPurity}>
                  <SelectTrigger><SelectValue placeholder="Select purity..." /></SelectTrigger>
                  <SelectContent>
                    {PURITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Description *</label>
              <Textarea placeholder="e.g. 1kg Gold Bar, PAMP Suisse, sealed" value={description} onChange={e => setDescription(e.target.value)} rows={2} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Weight (grams) *</label>
                <Input type="number" placeholder="1000" value={weightGrams} onChange={e => setWeightGrams(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Quantity</label>
                <Input type="number" placeholder="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Declared Value (USD) *</label>
                <Input type="number" placeholder="75000" value={declaredValue} onChange={e => setDeclaredValue(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Serial Numbers</label>
              <Input placeholder="SN-001, SN-002 (comma separated)" value={serialNumbers} onChange={e => setSerialNumbers(e.target.value)} />
            </div>

            <Separator />

            {/* Storage Details */}
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" /> Storage & Insurance
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Vault Location</label>
                <Select value={vaultLocation} onValueChange={setVaultLocation}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VAULT_LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Storage Unit</label>
                <Input placeholder="e.g. Vault A - Unit 12" value={storageUnit} onChange={e => setStorageUnit(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Insured Value (USD)</label>
                <Input type="number" placeholder="75000" value={insuredValue} onChange={e => setInsuredValue(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Monthly Fee (USD)</label>
                <Input type="number" placeholder="150" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Initial Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                    <SelectItem value="IN_STORAGE">In Storage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isPending} className="bg-amber-600 hover:bg-amber-700 text-white">
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Vault className="w-4 h-4 mr-2" />}
              Create Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ SUCCESS DIALOG ═══ */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" /> Vault Deposit Created
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 text-center">
              <p className="text-xs text-amber-600 uppercase tracking-widest mb-2">Deposit Number</p>
              <p className="text-2xl font-bold text-amber-800 tracking-wider">{createdDeposit}</p>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600">Email notification has been sent to the client with full deposit details.</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(createdDeposit);
                  toast.success("Deposit number copied");
                }}
              >
                <Copy className="w-4 h-4 mr-2" /> Copy Deposit Number
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuccess(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
