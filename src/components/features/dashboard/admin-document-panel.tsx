"use client";

import { useState, useTransition } from "react";
import {
  FileText, Send, Download, Mail, User, Package, ChevronRight, Search,
  Plane, Truck, FileCheck, Shield, Receipt, Tag, Vault, CheckCircle,
  Loader2, AlertCircle, X, Printer, QrCode,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { sendShipmentDocuments } from "@/app/dashboard/documents/actions";

type Shipment = {
  id: string;
  trackingNumber: string;
  serviceType: string;
  createdAt: Date;
  originCity: string;
  originCountry: string;
  destinationCity: string;
  destinationCountry: string;
  isPaid: boolean;
  recipient: { name: string; email: string | null };
  Sender: { name: string; email: string } | null;
  packages: { insurance: boolean }[];
  TrackingUpdates: { status: string | null }[];
};

const DOCUMENT_OPTIONS = [
  { key: "airway-bill", label: "Airway Bill (AWB)", icon: Plane, desc: "Main transport document with QR code", color: "emerald" },
  { key: "commercial-invoice", label: "Commercial Invoice", icon: Receipt, desc: "Customs declaration & billing", color: "blue" },
  { key: "packing-list", label: "Packing List", icon: Package, desc: "Detailed package contents list", color: "purple" },
  { key: "shipping-label", label: "Shipping Label", icon: Tag, desc: "Physical package label with QR", color: "amber" },
  { key: "delivery-note", label: "Delivery Note", icon: FileCheck, desc: "Recipient delivery confirmation", color: "teal" },
  { key: "proof-of-delivery", label: "Proof of Delivery", icon: CheckCircle, desc: "Post-delivery signed confirmation", color: "green" },
  { key: "insurance-certificate", label: "Insurance Certificate", icon: Shield, desc: "Shipment coverage proof", color: "rose" },
] as const;

export function AdminDocumentPanel({ shipments }: { shipments: Shipment[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [sendToSender, setSendToSender] = useState(true);
  const [sendToRecipient, setSendToRecipient] = useState(true);
  const [customEmail, setCustomEmail] = useState("");
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = shipments.filter(s =>
    s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.destinationCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.Sender && s.Sender.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline" className="text-xs">Pending</Badge>;
    switch (status.toLowerCase()) {
      case "delivered": return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Delivered</Badge>;
      case "in_transit": return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">In Transit</Badge>;
      case "picked_up": return <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Picked Up</Badge>;
      default: return <Badge variant="outline" className="text-xs capitalize">{status.replace(/_/g, " ")}</Badge>;
    }
  };

  const toggleDoc = (key: string) => {
    setSelectedDocs(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const selectAllDocs = () => {
    if (selectedDocs.length === DOCUMENT_OPTIONS.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(DOCUMENT_OPTIONS.map(d => d.key));
    }
  };

  const handleDownload = async (docType: string) => {
    if (!selectedShipment) return;
    const url = `/api/documents/${docType}/${selectedShipment.trackingNumber}`;
    window.open(url, "_blank");
  };

  const handleSendDocuments = () => {
    if (!selectedShipment || selectedDocs.length === 0) {
      toast.error("Select at least one document type");
      return;
    }
    setShowSendDialog(true);
  };

  const confirmSend = () => {
    if (!selectedShipment) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("trackingNumber", selectedShipment.trackingNumber);
      selectedDocs.forEach(d => formData.append("documentTypes", d));
      formData.set("sendToSender", sendToSender.toString());
      formData.set("sendToRecipient", sendToRecipient.toString());
      if (customEmail) formData.set("customEmail", customEmail);

      const result = await sendShipmentDocuments(formData);

      if (result.success) {
        toast.success(result.message);
        setShowSendDialog(false);
        setSelectedDocs([]);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100">
              <FileText className="w-6 h-6 text-emerald-700" />
            </div>
            Document Center
          </h1>
          <p className="text-gray-500 text-sm mt-1">Generate, preview, and send shipment documents with QR codes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm py-1 px-3">
            <QrCode className="w-3.5 h-3.5 mr-1.5" /> All docs include QR codes
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══ LEFT: Shipment List ═══ */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Select Shipment</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by tracking #, name, city..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto divide-y">
                {filtered.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No shipments found
                  </div>
                ) : (
                  filtered.map(shipment => {
                    const isSelected = selectedShipment?.id === shipment.id;
                    const latestStatus = shipment.TrackingUpdates[0]?.status;
                    return (
                      <button
                        key={shipment.id}
                        onClick={() => { setSelectedShipment(shipment); setSelectedDocs([]); }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                          isSelected ? "bg-emerald-50 border-l-2 border-l-emerald-600" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className={`font-mono text-sm font-semibold truncate ${isSelected ? "text-emerald-700" : "text-gray-900"}`}>
                              {shipment.trackingNumber}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {shipment.originCity} → {shipment.destinationCity}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              To: {shipment.recipient.name}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                            {getStatusBadge(latestStatus)}
                            <span className="text-xs text-gray-400">{shipment.serviceType}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══ RIGHT: Document Panel ═══ */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedShipment ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-16 text-center">
                <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">Select a Shipment</h3>
                <p className="text-sm text-gray-400">Choose a shipment from the list to generate and send documents</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Shipment Info Bar */}
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#0A1628] to-[#0D1F35] px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-emerald-500/15">
                        <Package className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-mono text-lg font-bold text-white">{selectedShipment.trackingNumber}</p>
                        <p className="text-sm text-gray-400">
                          {selectedShipment.originCity}, {selectedShipment.originCountry} → {selectedShipment.destinationCity}, {selectedShipment.destinationCountry}
                        </p>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-gray-400">Sender</p>
                      <p className="text-sm text-white font-medium">
                        {selectedShipment.Sender ? selectedShipment.Sender.name : "—"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Recipient</p>
                      <p className="text-sm text-white font-medium">{selectedShipment.recipient.name}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Document Selection */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Select Documents</CardTitle>
                    <p className="text-xs text-gray-500 mt-0.5">All documents include embedded QR codes for verification</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={selectAllDocs} className="text-xs">
                    {selectedDocs.length === DOCUMENT_OPTIONS.length ? "Deselect All" : "Select All"}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {DOCUMENT_OPTIONS.map(doc => {
                      const isChecked = selectedDocs.includes(doc.key);
                      const DocIcon = doc.icon;
                      return (
                        <div
                          key={doc.key}
                          onClick={() => toggleDoc(doc.key)}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isChecked
                              ? "border-emerald-500 bg-emerald-50/50"
                              : "border-gray-100 hover:border-gray-200 bg-white"
                          }`}
                        >
                          <Checkbox checked={isChecked} className="mt-0.5 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <DocIcon className={`w-4 h-4 ${isChecked ? "text-emerald-600" : "text-gray-400"}`} />
                              <span className={`text-sm font-semibold ${isChecked ? "text-emerald-700" : "text-gray-700"}`}>{doc.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{doc.desc}</p>
                          </div>
                          <Button
                            variant="ghost" size="sm"
                            className="flex-shrink-0 h-7 w-7 p-0"
                            onClick={(e) => { e.stopPropagation(); handleDownload(doc.key); }}
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5 text-gray-400" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Action Bar */}
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className={`w-4 h-4 ${selectedDocs.length > 0 ? "text-emerald-500" : "text-gray-300"}`} />
                      <span className="font-medium">{selectedDocs.length}</span> document{selectedDocs.length !== 1 ? "s" : ""} selected
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedDocs.length === 1 && (
                        <Button variant="outline" size="sm" onClick={() => handleDownload(selectedDocs[0])}>
                          <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                      )}
                      <Button
                        onClick={handleSendDocuments}
                        disabled={selectedDocs.length === 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        size="sm"
                      >
                        <Send className="w-4 h-4 mr-2" /> Send via Email
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* ═══ SEND DIALOG ═══ */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              Send Documents
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Selected documents */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Documents to send:</p>
              <div className="flex flex-wrap gap-2">
                {selectedDocs.map(key => {
                  const doc = DOCUMENT_OPTIONS.find(d => d.key === key);
                  return doc ? (
                    <Badge key={key} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs py-1">
                      <doc.icon className="w-3 h-3 mr-1" /> {doc.label}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>

            <Separator />

            {/* Email recipients */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Send to:</p>

              {selectedShipment?.Sender && (
                <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                  <Checkbox
                    checked={sendToSender}
                    onCheckedChange={(v) => setSendToSender(v as boolean)}
                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Sender: {selectedShipment.Sender.name}</p>
                    <p className="text-xs text-gray-500">{selectedShipment.Sender.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">Sender</Badge>
                </label>
              )}

              {selectedShipment?.recipient.email && (
                <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                  <Checkbox
                    checked={sendToRecipient}
                    onCheckedChange={(v) => setSendToRecipient(v as boolean)}
                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Recipient: {selectedShipment.recipient.name}</p>
                    <p className="text-xs text-gray-500">{selectedShipment.recipient.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Recipient</Badge>
                </label>
              )}

              <div className="space-y-1.5">
                <p className="text-xs text-gray-500">Or send to a custom email:</p>
                <Input
                  type="email"
                  placeholder="custom@email.com"
                  value={customEmail}
                  onChange={e => setCustomEmail(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* QR note */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <QrCode className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-emerald-700">QR Codes Included</p>
                <p className="text-xs text-emerald-600">Each PDF attachment and email body includes a scannable QR code linking to the live tracking page.</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>Cancel</Button>
            <Button
              onClick={confirmSend}
              disabled={isPending || (!sendToSender && !sendToRecipient && !customEmail)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {isPending ? "Sending..." : `Send ${selectedDocs.length} Document${selectedDocs.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}