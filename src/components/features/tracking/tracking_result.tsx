"use client";

import { useState } from "react";
import { format, parseISO, differenceInHours, isAfter } from "date-fns";
import {
  Clock, Truck, MapPin, Package as PackageIcon, CheckCircle2, AlertCircle,
  Download, Share2, Bell, Calendar, DollarSign, User, Mail, Phone,
  FileText, Barcode, Navigation, Shield, Eye, RefreshCw, Printer,
  ChevronRight, Home, Store, Plane, ArrowRight, Globe, Warehouse,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface TrackingEvent {
  id: string;
  timestamp: Date;
  location: string | null;
  status: string | null;
  message: string;
  city?: string | null;
  country?: string | null;
  signedBy?: string | null;
}

interface Package {
  height: number; width: number; length: number; packageType: string;
  declaredValue: number | null; weight: number; description: string;
  pieces: number; dangerous: boolean; insurance: boolean;
}

interface Recipient {
  name: string; company?: string | null; email?: string | null; phone: string;
}

interface Sender {
  name: string; email: string; phone?: string;
}

interface TrackingData {
  trackingNumber: string; estimatedDelivery: Date; deliveredAt?: Date | null;
  isPaid: boolean;
  originAddress: string; originCity: string; originState: string;
  originPostalCode: string; originCountry: string;
  destinationAddress: string; destinationCity: string; destinationState: string;
  destinationPostalCode: string; destinationCountry: string;
  serviceType: string; specialInstructions?: string | null;
  TrackingUpdates: TrackingEvent[]; createdAt: Date;
  Sender: Sender | null; recipient: Recipient; packages: Package[];
}

type TrackingResultProps = { data: TrackingData };

const STATUS_STEPS = [
  { key: "created", label: "Shipment Created", icon: PackageIcon },
  { key: "picked_up", label: "Picked Up", icon: Warehouse },
  { key: "in_transit", label: "In Transit", icon: Plane },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

export default function AdvancedTrackingResult({ data }: TrackingResultProps) {
  const [activeTab, setActiveTab] = useState<"timeline" | "details" | "documents">("timeline");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const formatDate = (input: string | Date): string => {
    try {
      const date = input instanceof Date ? input : parseISO(input);
      return format(date, "EEE, MMM d, yyyy · h:mm a");
    } catch { return "Invalid date"; }
  };

  const formatShortDate = (input: string | Date): string => {
    try {
      const date = input instanceof Date ? input : parseISO(input);
      return format(date, "MMM d, h:mm a");
    } catch { return "—"; }
  };

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const currentStatus = data.TrackingUpdates.length > 0
    ? data.TrackingUpdates[data.TrackingUpdates.length - 1].status : "pending";
  const isDelivered = currentStatus?.toLowerCase() === "delivered";
  const lastUpdate = data.TrackingUpdates[data.TrackingUpdates.length - 1]?.timestamp;
  const hoursSinceLastUpdate = lastUpdate ? differenceInHours(new Date(), lastUpdate) : null;
  const totalWeight = data.packages.reduce((s, p) => s + p.weight, 0);
  const totalValue = data.packages.reduce((s, p) => s + (p.declaredValue || 0), 0);
  const totalPieces = data.packages.reduce((s, p) => s + p.pieces, 0);

  const getStepIndex = () => {
    const current = currentStatus?.toLowerCase() || "";
    const idx = STATUS_STEPS.findIndex(s => s.key === current);
    return idx >= 0 ? idx : 0;
  };

  const stepIndex = getStepIndex();
  const progressPercent = Math.min(((stepIndex + 1) / STATUS_STEPS.length) * 100, 100);

  const getStatusStyle = (status: string | null) => {
    if (!status) return { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", label: "Processing" };
    switch (status.toLowerCase()) {
      case "delivered": return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Delivered" };
      case "in_transit": return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "In Transit" };
      case "out_for_delivery": return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Out for Delivery" };
      case "exception": case "failed": return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Exception" };
      case "picked_up": return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Picked Up" };
      default: return { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", label: status.replace(/_/g, " ") };
    }
  };

  const statusStyle = getStatusStyle(currentStatus);

  const getEventIcon = (status: string | null) => {
    if (!status) return MapPin;
    switch (status.toLowerCase()) {
      case "delivered": return CheckCircle2;
      case "in_transit": return Plane;
      case "out_for_delivery": return Truck;
      case "picked_up": return Warehouse;
      case "created": return PackageIcon;
      case "arrived": return MapPin;
      case "departed": return Plane;
      case "customs": return Shield;
      default: return Globe;
    }
  };

  const handleDownloadAirwayBill = async () => {
    try {
      toast.loading("Generating Airway Bill...");
      const response = await fetch(`/api/generate-airway-bill/${data.trackingNumber}`);
      if (!response.ok) throw new Error("Failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `AWB-${data.trackingNumber}.pdf`;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.dismiss(); toast.success("Airway Bill downloaded!");
    } catch { toast.dismiss(); toast.error("Failed to download Airway Bill"); }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: `Track ${data.trackingNumber}`, url: window.location.href }); } catch {}
    } else { navigator.clipboard.writeText(window.location.href); toast.success("Tracking link copied!"); }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsRefreshing(false);
    toast.success("Tracking updated");
  };

  const displayedEvents = showAllEvents ? data.TrackingUpdates : data.TrackingUpdates.slice(0, 5);

  if (!data) return (
    <div className="container mx-auto px-4 py-16 text-center">
      <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">Tracking Not Found</h2>
      <p className="text-muted-foreground">We couldn&apos;t find tracking data for this shipment.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* ═══════════════ TOP HEADER BAR ═══════════════ */}
      <div className="bg-gradient-to-r from-[#0A1628] via-[#0D1F35] to-[#0A1628] border-b-4 border-emerald-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/25">
                <PackageIcon className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 text-xs font-semibold tracking-[0.2em] uppercase mb-1">Shipment Tracking</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono tracking-wider">{data.trackingNumber}</h1>
                  <Badge className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border text-xs font-semibold px-3 py-1`}>
                    {statusStyle.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><Barcode className="w-3.5 h-3.5" /> {data.serviceType}</span>
                  <span>·</span>
                  <span>{totalPieces} pc{totalPieces !== 1 ? "s" : ""} · {totalWeight} kg</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="bg-white/5 text-white border-white/15 hover:bg-white/10" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
              </Button>
              <Button size="sm" variant="outline" className="bg-white/5 text-white border-white/15 hover:bg-white/10" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" /> Share
              </Button>
              <Button size="sm" variant="outline" className="bg-white/5 text-white border-white/15 hover:bg-white/10" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" /> Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ PROGRESS STEPPER ═══════════════ */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {STATUS_STEPS.map((step, i) => {
              const isCompleted = i <= stepIndex;
              const isCurrent = i === stepIndex;
              const StepIcon = step.icon;
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? isCurrent ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-100" : "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}>
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs mt-2 font-medium text-center max-w-[80px] leading-tight ${
                      isCompleted ? "text-emerald-700" : "text-gray-400"
                    }`}>{step.label}</span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded-full mt-[-20px] ${
                      i < stepIndex ? "bg-emerald-500" : "bg-gray-200"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════ ROUTE BANNER ═══════════════ */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="text-center flex-1">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-2">
                <Home className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="font-bold text-sm text-gray-900">{data.originCity}</p>
              <p className="text-xs text-gray-500">{data.originState}, {data.originCountry}</p>
              <p className="text-xs text-gray-400 mt-0.5">{data.originPostalCode}</p>
            </div>

            <div className="flex-1 flex items-center justify-center px-4">
              <div className="flex items-center gap-1 w-full">
                <div className="h-0.5 flex-1 bg-gradient-to-r from-emerald-400 to-emerald-300 rounded" />
                <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                  <Plane className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="h-0.5 flex-1 bg-gradient-to-r from-emerald-300 to-emerald-400 rounded" />
              </div>
            </div>

            <div className="text-center flex-1">
              <div className="w-12 h-12 rounded-full bg-[#D4A853]/10 border-2 border-[#D4A853]/30 flex items-center justify-center mx-auto mb-2">
                <MapPin className="w-5 h-5 text-[#D4A853]" />
              </div>
              <p className="font-bold text-sm text-gray-900">{data.destinationCity}</p>
              <p className="text-xs text-gray-500">{data.destinationState}, {data.destinationCountry}</p>
              <p className="text-xs text-gray-400 mt-0.5">{data.destinationPostalCode}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Est. Delivery</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{format(data.estimatedDelivery, "MMM d, yyyy")}</p>
                  {isAfter(new Date(), data.estimatedDelivery) && !isDelivered && (
                    <p className="text-xs text-red-500 font-medium mt-0.5">Overdue</p>
                  )}
                  {isDelivered && <p className="text-xs text-emerald-600 font-medium mt-0.5">Delivered</p>}
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50"><Calendar className="w-5 h-5 text-emerald-600" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Update</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{lastUpdate ? format(lastUpdate, "h:mm a") : "N/A"}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{hoursSinceLastUpdate !== null ? `${hoursSinceLastUpdate}h ago` : ""}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50"><Clock className="w-5 h-5 text-amber-600" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Shipment Value</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(totalValue)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{totalPieces} piece{totalPieces !== 1 ? "s" : ""}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-[#D4A853]/10"><DollarSign className="w-5 h-5 text-[#D4A853]" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Weight</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{totalWeight} kg</p>
                  <p className="text-xs text-gray-500 mt-0.5">{data.packages.length} package{data.packages.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50"><PackageIcon className="w-5 h-5 text-blue-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ═══════════════ LEFT: TIMELINE ═══════════════ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Latest Location Banner */}
            {data.TrackingUpdates.length > 0 && (
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Current Location</p>
                      <p className="text-white text-lg font-bold">
                        {data.TrackingUpdates[data.TrackingUpdates.length - 1].location || "Processing"}
                      </p>
                    </div>
                    <div className="ml-auto text-right hidden sm:block">
                      <p className="text-emerald-100 text-xs">Last scanned</p>
                      <p className="text-white text-sm font-semibold">{formatShortDate(data.TrackingUpdates[data.TrackingUpdates.length - 1].timestamp)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Timeline */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-emerald-600" /> Shipment History
                  </CardTitle>
                  <span className="text-xs text-gray-500">{data.TrackingUpdates.length} event{data.TrackingUpdates.length !== 1 ? "s" : ""}</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {displayedEvents.map((event, idx) => {
                    const EventIcon = getEventIcon(event.status);
                    const isFirst = idx === 0;
                    const isLatest = idx === data.TrackingUpdates.length - 1;
                    return (
                      <div key={event.id} className={`flex gap-4 px-6 py-4 transition-colors ${isLatest ? "bg-emerald-50/50" : "hover:bg-gray-50/50"}`}>
                        {/* Icon + Line */}
                        <div className="flex flex-col items-center pt-1">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isLatest ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" :
                            isFirst ? "bg-emerald-100 text-emerald-600" :
                            "bg-gray-100 text-gray-500"
                          }`}>
                            <EventIcon className="w-4 h-4" />
                          </div>
                          {idx !== displayedEvents.length - 1 && (
                            <div className="w-0.5 flex-1 bg-gray-200 mt-1 min-h-[20px]" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`font-semibold text-sm ${isLatest ? "text-emerald-700" : "text-gray-900"}`}>
                                {event.status ? event.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "Update"}
                              </p>
                              <p className="text-sm text-gray-600 mt-0.5">{event.message}</p>
                            </div>
                            {event.signedBy && (
                              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0">
                                ✓ Signed
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mt-2 flex-wrap">
                            {event.location && (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                                <MapPin className="w-3 h-3 text-emerald-500" /> {event.location}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {formatDate(event.timestamp)}
                            </span>
                          </div>

                          {event.signedBy && (
                            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                              <User className="w-3 h-3" /> Signed by: <span className="font-medium">{event.signedBy}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {data.TrackingUpdates.length > 5 && (
                  <div className="px-6 py-3 border-t bg-gray-50/50">
                    <button onClick={() => setShowAllEvents(!showAllEvents)}
                      className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                      {showAllEvents ? <><ChevronUp className="w-4 h-4" /> Show less</> : <><ChevronDown className="w-4 h-4" /> Show all {data.TrackingUpdates.length} events</>}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Special Instructions */}
            {data.specialInstructions && (
              <Card className="border-0 shadow-sm border-l-4 border-l-amber-400">
                <CardContent className="p-5 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-1">Special Instructions</p>
                    <p className="text-sm text-gray-600">{data.specialInstructions}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Package Details */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <PackageIcon className="w-4 h-4 text-emerald-600" /> Package Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y">
                {data.packages.map((pkg, idx) => (
                  <div key={idx} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">Package {idx + 1}</h4>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{pkg.packageType}</Badge>
                          {pkg.dangerous && <Badge variant="destructive" className="text-xs">Dangerous</Badge>}
                          {pkg.insurance && <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Insured</Badge>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">{pkg.weight} kg</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div><p className="text-gray-500 text-xs">Dimensions</p><p className="font-medium">{pkg.length} × {pkg.width} × {pkg.height} cm</p></div>
                      <div><p className="text-gray-500 text-xs">Pieces</p><p className="font-medium">{pkg.pieces}</p></div>
                      <div><p className="text-gray-500 text-xs">Declared Value</p><p className="font-medium">{formatCurrency(pkg.declaredValue || 0)}</p></div>
                      <div><p className="text-gray-500 text-xs">Description</p><p className="font-medium">{pkg.description}</p></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Sender & Recipient */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Home className="w-4 h-4 text-emerald-600" /> Sender
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3 text-sm">
                  <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span className="font-medium">{data.Sender?.name || "N/A"}</span></div>
                  {data.Sender?.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span>{data.Sender.email}</span></div>}
                  {data.Sender?.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span>{data.Sender.phone}</span></div>}
                  <Separator />
                  <div className="text-xs text-gray-500">
                    <p>{data.originAddress}</p>
                    <p>{data.originCity}, {data.originState} {data.originPostalCode}</p>
                    <p>{data.originCountry}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#D4A853]" /> Recipient
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-3 text-sm">
                  <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span className="font-medium">{data.recipient.name}</span></div>
                  {data.recipient.company && <div className="flex items-center gap-2"><Store className="w-4 h-4 text-gray-400" /><span>{data.recipient.company}</span></div>}
                  {data.recipient.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span>{data.recipient.email}</span></div>}
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span>{data.recipient.phone}</span></div>
                  <Separator />
                  <div className="text-xs text-gray-500">
                    <p>{data.destinationAddress}</p>
                    <p>{data.destinationCity}, {data.destinationState} {data.destinationPostalCode}</p>
                    <p>{data.destinationCountry}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ═══════════════ RIGHT SIDEBAR ═══════════════ */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b bg-gray-50/50 px-5 py-4">
                <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Button onClick={handleDownloadAirwayBill} className="w-full justify-start bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                  <Download className="h-4 w-4 mr-2" /> Download Airway Bill
                </Button>
                <Button variant="outline" onClick={handleShare} className="w-full justify-start" size="sm">
                  <Share2 className="h-4 w-4 mr-2" /> Share Tracking Link
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Bell className="h-4 w-4 mr-2" /> Get Notifications
                </Button>
                {isDelivered && (
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Eye className="h-4 w-4 mr-2" /> Proof of Delivery
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Shipment Summary */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b bg-gray-50/50 px-5 py-4">
                <CardTitle className="text-sm font-semibold">Shipment Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-semibold">{data.serviceType}</span></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-gray-500">Pieces</span><span className="font-semibold">{totalPieces}</span></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-gray-500">Weight</span><span className="font-semibold">{totalWeight} kg</span></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-gray-500">Value</span><span className="font-semibold">{formatCurrency(totalValue)}</span></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-gray-500">Payment</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs">{data.isPaid ? "Paid" : "Pending"}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="font-medium text-xs">{formatShortDate(data.createdAt)}</span></div>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="border-b bg-gray-50/50 px-5 py-4">
                <CardTitle className="text-sm font-semibold">Documents</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <button onClick={handleDownloadAirwayBill} className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-left">
                  <div className="p-2 rounded-lg bg-emerald-50"><FileText className="w-4 h-4 text-emerald-600" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Airway Bill</p>
                    <p className="text-xs text-gray-500">PDF Document</p>
                  </div>
                  <Download className="w-4 h-4 text-gray-400" />
                </button>
                {isDelivered && (
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-left">
                    <div className="p-2 rounded-lg bg-emerald-50"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Proof of Delivery</p>
                      <p className="text-xs text-gray-500">Signed document</p>
                    </div>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </CardContent>
            </Card>

            {/* Need Help? */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-[#0A1628] to-[#0D1F35] text-white">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-2">Need Help?</h3>
                <p className="text-xs text-gray-400 mb-4">Our logistics team is available 24/7</p>
                <div className="space-y-2">
                  <a href="tel:+440201412251" className="flex items-center gap-2 text-xs text-emerald-300 hover:text-emerald-200">
                    <Phone className="w-3.5 h-3.5" /> +44 020 1412 251
                  </a>
                  <a href="mailto:admin@aramexlogistics.org" className="flex items-center gap-2 text-xs text-emerald-300 hover:text-emerald-200">
                    <Mail className="w-3.5 h-3.5" /> admin@aramexlogistics.org
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
