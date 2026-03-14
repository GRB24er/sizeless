"use client";

import { useState } from "react";
import { format, parseISO, differenceInHours, isAfter } from "date-fns";
import {
  Clock, Truck, MapPin, Package as PackageIcon, CheckCircle2, AlertCircle,
  Download, Share2, Bell, Calendar, Weight, Ruler, DollarSign, User, Mail,
  Phone, FileText, Barcode, Navigation, Shield, Eye, RefreshCw, Printer,
  ChevronRight, Home, Store, Plane, Globe, ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
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
  height: number;
  width: number;
  length: number;
  packageType: string;
  declaredValue: number | null;
  weight: number;
  description: string;
  pieces: number;
  dangerous: boolean;
  insurance: boolean;
}

interface Recipient {
  name: string;
  company?: string | null;
  email?: string | null;
  phone: string;
  signatureRequired?: boolean;
}

interface Sender {
  name: string;
  email: string;
  phone?: string;
}

interface TrackingData {
  trackingNumber: string;
  estimatedDelivery: Date;
  deliveredAt?: Date | null;
  isPaid: boolean;
  originAddress: string;
  originCity: string;
  originState: string;
  originPostalCode: string;
  originCountry: string;
  destinationAddress: string;
  destinationCity: string;
  destinationState: string;
  destinationPostalCode: string;
  destinationCountry: string;
  serviceType: string;
  specialInstructions?: string | null;
  TrackingUpdates: TrackingEvent[];
  createdAt: Date;
  Sender: Sender | null;
  recipient: Recipient;
  packages: Package[];
}

type TrackingResultProps = {
  data: TrackingData;
};

export default function AdvancedTrackingResult({ data }: TrackingResultProps) {
  const [activeTab, setActiveTab] = useState<"timeline" | "details" | "documents">("timeline");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatDate = (input: string | Date): string => {
    try {
      const date = input instanceof Date ? input : parseISO(input);
      return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a");
    } catch {
      return "Invalid date";
    }
  };

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);

  const currentStatus = data.TrackingUpdates.length > 0
    ? data.TrackingUpdates[data.TrackingUpdates.length - 1].status
    : "pending";

  const isDelivered = currentStatus?.toLowerCase() === "delivered";
  const isOutForDelivery = currentStatus?.toLowerCase() === "out_for_delivery";

  const lastUpdate = data.TrackingUpdates[data.TrackingUpdates.length - 1]?.timestamp;
  const hoursSinceLastUpdate = lastUpdate ? differenceInHours(new Date(), lastUpdate) : null;

  const handleDownloadAirwayBill = async () => {
    try {
      toast.loading("Generating Airway Bill...");
      const response = await fetch(`/api/generate-airway-bill/${data.trackingNumber}`);
      if (!response.ok) throw new Error("Failed to generate Airway Bill");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AWB-${data.trackingNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.dismiss();
      toast.success("Airway Bill downloaded successfully!");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to download Airway Bill");
      console.error(error);
    }
  };

  const handleShare = async () => {
    const shareData = { title: `Track Shipment — ${data.trackingNumber}`, text: `Track shipment ${data.trackingNumber} on Aegis Cargo`, url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Tracking link copied to clipboard!");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    toast.success("Tracking information updated");
  };

  const calculateProgress = () => {
    const statusOrder = ["created", "picked_up", "in_transit", "out_for_delivery", "delivered"];
    const current = data.TrackingUpdates[data.TrackingUpdates.length - 1]?.status;
    const currentIndex = statusOrder.findIndex(s => s === current?.toLowerCase());
    return Math.min(((currentIndex + 1) / statusOrder.length) * 100, 100);
  };

  const totalWeight = data.packages.reduce((sum, pkg) => sum + pkg.weight, 0);
  const totalValue = data.packages.reduce((sum, pkg) => sum + (pkg.declaredValue || 0), 0);
  const totalPieces = data.packages.reduce((sum, pkg) => sum + pkg.pieces, 0);

  const getStatusConfig = (status: string | null) => {
    if (!status) return { bg: "bg-slate-800/50", text: "text-slate-300", border: "border-slate-700", dot: "bg-slate-400", label: "Pending" };
    switch (status.toLowerCase()) {
      case "delivered": return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-500", label: "Delivered" };
      case "in_transit": return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", dot: "bg-blue-500", label: "In Transit" };
      case "out_for_delivery": return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", dot: "bg-amber-500", label: "Out for Delivery" };
      case "exception": case "failed": return { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", dot: "bg-red-500", label: "Exception" };
      case "picked_up": return { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30", dot: "bg-violet-500", label: "Picked Up" };
      case "created": return { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30", dot: "bg-slate-400", label: "Created" };
      default: return { bg: "bg-slate-800/50", text: "text-slate-300", border: "border-slate-700", dot: "bg-slate-400", label: status.replace(/_/g, " ") };
    }
  };

  const statusConfig = getStatusConfig(currentStatus);

  if (!data) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Tracking Information Not Found</h2>
        <p className="text-slate-400">We couldn&apos;t find tracking information for this shipment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════
          HERO STATUS BANNER — DHL/FedEx Enterprise Style
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/50">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A1628] via-[#0D2137] to-[#0A1628]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(5,150,105,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,168,83,0.1),transparent_60%)]" />

        <div className="relative p-6 sm:p-8">
          {/* Top Row: Logo + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <Plane className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">SHIPMENT TRACKING</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-mono text-lg text-emerald-400 font-semibold tracking-wider">{data.trackingNumber}</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase">{data.serviceType}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="bg-white/5 text-slate-300 border-slate-700 hover:bg-white/10 hover:text-white" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />Refresh
              </Button>
              <Button variant="outline" size="sm" className="bg-white/5 text-slate-300 border-slate-700 hover:bg-white/10 hover:text-white" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />Print
              </Button>
              <Button variant="outline" size="sm" className="bg-white/5 text-slate-300 border-slate-700 hover:bg-white/10 hover:text-white" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />Share
              </Button>
            </div>
          </div>

          {/* Status + Route Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Status */}
            <div className={`rounded-xl p-5 ${statusConfig.bg} border ${statusConfig.border}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-3 h-3 rounded-full ${statusConfig.dot} animate-pulse`} />
                <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Current Status</span>
              </div>
              <p className={`text-2xl font-bold ${statusConfig.text} capitalize`}>{statusConfig.label}</p>
              {hoursSinceLastUpdate !== null && (
                <p className="text-sm text-slate-500 mt-2">Last updated {hoursSinceLastUpdate}h ago</p>
              )}
            </div>

            {/* Route */}
            <div className="rounded-xl p-5 bg-slate-800/30 border border-slate-700/50">
              <span className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3 block">Route</span>
              <div className="flex items-center gap-3">
                <div className="text-center min-w-0 flex-1">
                  <p className="text-lg font-bold text-white truncate">{data.originCity}</p>
                  <p className="text-xs text-slate-500 truncate">{data.originCountry}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <div className="w-8 h-[2px] bg-gradient-to-r from-emerald-500/50 to-emerald-500" />
                  <Plane className="w-4 h-4 text-emerald-400 -rotate-12" />
                  <div className="w-8 h-[2px] bg-gradient-to-r from-emerald-500 to-emerald-500/50" />
                </div>
                <div className="text-center min-w-0 flex-1">
                  <p className="text-lg font-bold text-white truncate">{data.destinationCity}</p>
                  <p className="text-xs text-slate-500 truncate">{data.destinationCountry}</p>
                </div>
              </div>
            </div>

            {/* Delivery ETA */}
            <div className="rounded-xl p-5 bg-slate-800/30 border border-slate-700/50">
              <span className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3 block">
                {isDelivered ? "Delivered On" : "Estimated Delivery"}
              </span>
              <p className="text-lg font-bold text-white">
                {format(data.deliveredAt || data.estimatedDelivery, "MMMM d, yyyy")}
              </p>
              {!isDelivered && isAfter(new Date(), data.estimatedDelivery) && (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                  <AlertCircle className="w-3 h-3" /> Past Due
                </span>
              )}
              {isDelivered && (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Successfully Delivered
                </span>
              )}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute top-4 left-0 right-0 h-[2px] bg-slate-700/50" />
              <div className="absolute top-4 left-0 h-[2px] bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000" style={{ width: `${calculateProgress()}%` }} />
              <div className="relative flex justify-between">
                {[
                  { label: "Shipment Created", icon: PackageIcon },
                  { label: "Picked Up", icon: Truck },
                  { label: "In Transit", icon: Plane },
                  { label: "Out for Delivery", icon: Navigation },
                  { label: "Delivered", icon: CheckCircle2 },
                ].map((step, idx) => {
                  const isActive = idx * 25 <= calculateProgress();
                  const isCurrent = idx * 25 <= calculateProgress() && (idx + 1) * 25 > calculateProgress();
                  return (
                    <div key={idx} className="flex flex-col items-center z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isActive
                          ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                          : "bg-slate-800 text-slate-500 border border-slate-700"
                      } ${isCurrent ? "ring-4 ring-emerald-500/20" : ""}`}>
                        <step.icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs mt-2 font-medium text-center max-w-[80px] ${isActive ? "text-emerald-400" : "text-slate-500"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          STATS CARDS ROW
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Pieces", value: `${totalPieces}`, sub: `${data.packages.length} package${data.packages.length !== 1 ? "s" : ""}`, icon: PackageIcon, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Total Weight", value: `${totalWeight.toFixed(1)} kg`, sub: `${(totalWeight * 2.205).toFixed(1)} lbs`, icon: Weight, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Declared Value", value: formatCurrency(totalValue), sub: data.isPaid ? "Prepaid" : "Collect", icon: DollarSign, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Updates", value: `${data.TrackingUpdates.length}`, sub: hoursSinceLastUpdate !== null ? `${hoursSinceLastUpdate}h ago` : "No updates", icon: Bell, color: "text-violet-400", bg: "bg-violet-500/10" },
        ].map((stat, idx) => (
          <div key={idx} className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-5 hover:border-slate-600/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN CONTENT: Timeline + Sidebar
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking History */}
          <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" /> Tracking History
              </h3>
              <span className="text-sm text-slate-400">{data.TrackingUpdates.length} events</span>
            </div>
            <div className="p-6">
              <div className="space-y-0">
                {[...data.TrackingUpdates].reverse().map((event, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === data.TrackingUpdates.length - 1;
                  const eventStatus = getStatusConfig(event.status);

                  return (
                    <div key={event.id} className="flex gap-4">
                      {/* Timeline Line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                          isFirst
                            ? `${eventStatus.dot} border-transparent shadow-lg`
                            : "bg-slate-800 border-slate-600"
                        }`} />
                        {!isLast && <div className="w-[2px] flex-1 bg-slate-700/50 my-1" />}
                      </div>

                      {/* Content */}
                      <div className={`flex-1 pb-6 ${isFirst ? "" : "opacity-75"}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold capitalize ${isFirst ? eventStatus.text : "text-slate-300"}`}>
                              {event.status ? event.status.replace(/_/g, " ") : "Update"}
                            </span>
                            {event.signedBy && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">Signed</span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-mono">{formatDate(event.timestamp)}</span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{event.message}</p>
                        {event.location && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span className="text-xs text-slate-500">{event.location}</span>
                          </div>
                        )}
                        {event.signedBy && (
                          <p className="text-xs text-slate-500 mt-1">Signed by: <span className="text-slate-400">{event.signedBy}</span></p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {data.specialInstructions && (
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-amber-300">Special Instructions</h3>
              </div>
              <p className="text-sm text-slate-300">{data.specialInstructions}</p>
            </div>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/50">
              <h3 className="font-semibold text-white">Quick Actions</h3>
            </div>
            <div className="p-5 space-y-3">
              <button onClick={handleDownloadAirwayBill} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-medium hover:from-emerald-500 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-600/20">
                <Download className="w-4 h-4" /> Download Airway Bill
              </button>
              <button onClick={handleShare} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 font-medium hover:bg-slate-700/50 hover:text-white transition-all">
                <Share2 className="w-4 h-4" /> Share Tracking
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 font-medium hover:bg-slate-700/50 hover:text-white transition-all">
                <Bell className="w-4 h-4" /> Get Notifications
              </button>
              {isDelivered && (
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-300 font-medium hover:bg-slate-700/50 hover:text-white transition-all">
                  <Eye className="w-4 h-4" /> Proof of Delivery
                </button>
              )}
            </div>
          </div>

          {/* Route Detail */}
          <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/50">
              <h3 className="font-semibold text-white flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-400" /> Route Detail</h3>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Home className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Origin</p>
                  <p className="font-semibold text-white">{data.originCity}, {data.originState}</p>
                  <p className="text-sm text-slate-400">{data.originAddress}</p>
                  <p className="text-xs text-slate-500">{data.originPostalCode}, {data.originCountry}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pl-5">
                <div className="w-[2px] h-6 bg-gradient-to-b from-emerald-500/50 to-amber-500/50" />
                <ArrowRight className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Destination</p>
                  <p className="font-semibold text-white">{data.destinationCity}, {data.destinationState}</p>
                  <p className="text-sm text-slate-400">{data.destinationAddress}</p>
                  <p className="text-xs text-slate-500">{data.destinationPostalCode}, {data.destinationCountry}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipment Summary */}
          <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700/50">
              <h3 className="font-semibold text-white">Shipment Summary</h3>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: "Service", value: data.serviceType },
                { label: "Total Pieces", value: String(totalPieces) },
                { label: "Total Weight", value: `${totalWeight.toFixed(1)} kg` },
                { label: "Declared Value", value: formatCurrency(totalValue) },
                { label: "Payment", value: data.isPaid ? "Prepaid" : "Collect" },
                { label: "Created", value: format(data.createdAt, "MMM d, yyyy") },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          DETAILED TABS: Parties + Packages + Documents
          ═══════════════════════════════════════════════════════════════ */}
      <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)} className="w-full">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <TabsList className="bg-slate-800/50 border border-slate-700/50">
              <TabsTrigger value="timeline" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <User className="h-4 w-4 mr-2" /> Parties
              </TabsTrigger>
              <TabsTrigger value="details" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <PackageIcon className="h-4 w-4 mr-2" /> Packages
              </TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <FileText className="h-4 w-4 mr-2" /> Documents
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="timeline" className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Sender */}
              <div className="rounded-xl bg-slate-900/50 border border-slate-700/30 p-5">
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><User className="w-4 h-4 text-emerald-400" /></div>
                  Shipper / Sender
                </h4>
                <div className="space-y-3">
                  <div><p className="text-xs text-slate-500 uppercase">Name</p><p className="font-medium text-white">{data.Sender?.name || "N/A"}</p></div>
                  {data.Sender?.email && <div><p className="text-xs text-slate-500 uppercase">Email</p><p className="text-sm text-slate-300">{data.Sender.email}</p></div>}
                  <div className="pt-2 border-t border-slate-700/30">
                    <p className="text-xs text-slate-500 uppercase">Address</p>
                    <p className="text-sm text-slate-300">{data.originAddress}</p>
                    <p className="text-sm text-slate-300">{data.originCity}, {data.originState} {data.originPostalCode}</p>
                    <p className="text-sm text-slate-400">{data.originCountry}</p>
                  </div>
                </div>
              </div>
              {/* Recipient */}
              <div className="rounded-xl bg-slate-900/50 border border-slate-700/30 p-5">
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><User className="w-4 h-4 text-amber-400" /></div>
                  Consignee / Recipient
                </h4>
                <div className="space-y-3">
                  <div><p className="text-xs text-slate-500 uppercase">Name</p><p className="font-medium text-white">{data.recipient.name}</p></div>
                  {data.recipient.company && <div><p className="text-xs text-slate-500 uppercase">Company</p><p className="text-sm text-slate-300">{data.recipient.company}</p></div>}
                  {data.recipient.email && <div><p className="text-xs text-slate-500 uppercase">Email</p><p className="text-sm text-slate-300">{data.recipient.email}</p></div>}
                  <div><p className="text-xs text-slate-500 uppercase">Phone</p><p className="text-sm text-slate-300">{data.recipient.phone}</p></div>
                  <div className="pt-2 border-t border-slate-700/30">
                    <p className="text-xs text-slate-500 uppercase">Address</p>
                    <p className="text-sm text-slate-300">{data.destinationAddress}</p>
                    <p className="text-sm text-slate-300">{data.destinationCity}, {data.destinationState} {data.destinationPostalCode}</p>
                    <p className="text-sm text-slate-400">{data.destinationCountry}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="p-6">
            <div className="space-y-4">
              {data.packages.map((pkg, idx) => (
                <div key={idx} className="rounded-xl bg-slate-900/50 border border-slate-700/30 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-white text-lg">Package {idx + 1}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300">{pkg.packageType}</span>
                        {pkg.dangerous && <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400">Dangerous</span>}
                        {pkg.insurance && <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Insured</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{pkg.weight} <span className="text-sm text-slate-400">kg</span></p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      {[
                        { label: "Dimensions", value: `${pkg.length} × ${pkg.width} × ${pkg.height} cm` },
                        { label: "Pieces", value: String(pkg.pieces) },
                        { label: "Declared Value", value: formatCurrency(pkg.declaredValue || 0) },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between py-1.5 border-b border-slate-700/20">
                          <span className="text-sm text-slate-400">{item.label}</span>
                          <span className="text-sm font-medium text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase mb-1">Description</p>
                      <p className="text-sm text-slate-300">{pkg.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="documents" className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-900/50 border border-slate-700/30 p-5 hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Air Waybill</p>
                    <p className="text-xs text-slate-400">PDF Document</p>
                  </div>
                </div>
                <button onClick={handleDownloadAirwayBill} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-600/20 transition-colors">
                  <Download className="w-4 h-4" /> Download AWB
                </button>
              </div>
              {isDelivered && (
                <div className="rounded-xl bg-slate-900/50 border border-slate-700/30 p-5 hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Proof of Delivery</p>
                      <p className="text-xs text-slate-400">Available</p>
                    </div>
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium hover:bg-amber-500/20 transition-colors">
                    <Eye className="w-4 h-4" /> View POD
                  </button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer Security Badge */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2 text-slate-500">
          <Shield className="w-4 h-4" />
          <span className="text-xs tracking-wider uppercase">Secured by Aegis Cargo — 256-bit Encrypted</span>
        </div>
      </div>
    </div>
  );
}
