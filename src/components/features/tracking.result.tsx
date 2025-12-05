"use client";

import { useState } from "react";
import { format, parseISO, differenceInHours, isAfter } from "date-fns";
import {
  Clock,
  Truck,
  MapPin,
  Package as PackageIcon,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  Bell,
  Calendar,
  Weight,
  Ruler,
  DollarSign,
  User,
  Mail,
  Phone,
  FileText,
  Barcode,
  Navigation,
  Shield,
  Eye,
  RefreshCw,
  Printer,
  ChevronRight,
  Home,
  Store,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
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
  trackingNumber?: string;
  referenceNumber?: string;
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
  
  carrier?: string;
  serviceLevel?: string;
  totalPieces?: number;
  requiresSignature?: boolean;
  isInternational?: boolean;
  customsCleared?: boolean;
  deliveryAttempts?: number;
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
    } catch (error) {
      return "Invalid date";
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const currentStatus =
    data.TrackingUpdates.length > 0
      ? data.TrackingUpdates[data.TrackingUpdates.length - 1].status
      : "pending";

  const isDelivered = currentStatus?.toLowerCase() === "delivered";
  const isInTransit = currentStatus?.toLowerCase() === "in_transit";
  const isOutForDelivery = currentStatus?.toLowerCase() === "out_for_delivery";

  // Calculate time since last update
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
      a.download = `Airway-Bill-${data.trackingNumber}.pdf`;
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
    const shareData = {
      title: `Shipment Tracking - ${data.trackingNumber}`,
      text: `Track shipment ${data.trackingNumber}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log("Error sharing", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Tracking link copied to clipboard!");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    toast.success("Tracking information updated");
  };

  const handlePrint = () => {
    window.print();
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

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200";
    
    switch(status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_transit":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "out_for_delivery":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "exception":
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "picked_up":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const statusMap: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline" }> = {
      "delivered": { label: "Delivered", variant: "default" },
      "in_transit": { label: "In Transit", variant: "secondary" },
      "out_for_delivery": { label: "Out for Delivery", variant: "outline" },
      "exception": { label: "Exception", variant: "destructive" },
      "failed": { label: "Failed", variant: "destructive" },
      "picked_up": { label: "Picked Up", variant: "secondary" },
    };

    const mapped = statusMap[status.toLowerCase()] || { label: status, variant: "outline" };
    return <Badge variant={mapped.variant}>{mapped.label}</Badge>;
  };

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Tracking Information Not Found</h2>
              <p className="text-muted-foreground">
                We couldn't find tracking information for this shipment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <Truck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                SHIPMENT TRACKING
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Barcode className="h-5 w-5" />
                <span className="font-mono text-lg font-semibold tracking-wider">
                  {data.trackingNumber}
                </span>
                <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-white/30">
                  {data.serviceType}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Status</p>
                <h3 className="text-xl font-bold mt-1">
                  {currentStatus ? currentStatus.replace(/_/g, " ") : "Pending"}
                </h3>
                <div className="mt-2">
                  {getStatusBadge(currentStatus)}
                </div>
              </div>
              <div className={`p-3 rounded-full ${getStatusColor(currentStatus)}`}>
                {isDelivered ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : isOutForDelivery ? (
                  <Truck className="h-6 w-6 text-purple-600" />
                ) : (
                  <Clock className="h-6 w-6 text-blue-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                <h3 className="text-xl font-bold mt-1">
                  {format(data.estimatedDelivery, "MMM d, yyyy")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAfter(new Date(), data.estimatedDelivery) && !isDelivered ? "Past due" : "Scheduled"}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last Update</p>
                <h3 className="text-xl font-bold mt-1">
                  {lastUpdate ? format(lastUpdate, "h:mm a") : "N/A"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {hoursSinceLastUpdate !== null ? `${hoursSinceLastUpdate}h ago` : "No updates"}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shipment Value</p>
                <h3 className="text-xl font-bold mt-1">
                  {formatCurrency(totalValue)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {totalPieces} piece{totalPieces !== 1 ? 's' : ''}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Timeline & Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Tracking */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Shipment Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                {/* Progress Bar */}
                <div className="relative">
                  <Progress value={calculateProgress()} className="h-2" />
                  <div className="flex justify-between mt-4">
                    {["Created", "In Transit", "Out for Delivery", "Delivered"].map((label, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          idx * 33 <= calculateProgress() 
                            ? "bg-blue-600 text-white" 
                            : "bg-gray-200 text-gray-400"
                        }`}>
                          {idx === 3 ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <span className="text-xs mt-1 font-medium text-center">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Tracking History
                  </h3>
                  
                  {data.TrackingUpdates.map((event, idx) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          idx === 0 ? "bg-green-500" : 
                          idx === data.TrackingUpdates.length - 1 ? "bg-blue-500" : 
                          "bg-gray-300"
                        }`} />
                        {idx !== data.TrackingUpdates.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {event.status ? event.status.replace(/_/g, " ") : "Update"}
                              </span>
                              {event.signedBy && (
                                <Badge variant="outline" className="text-xs">
                                  Signed
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatDate(event.timestamp)}
                            </p>
                            {event.location && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="mt-2 text-sm">{event.message}</p>
                        {event.signedBy && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Signed by: {event.signedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Instructions */}
          {data.specialInstructions && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  Special Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-blue-50 p-4 rounded-lg">
                  {data.specialInstructions}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Details & Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Button 
                onClick={handleDownloadAirwayBill} 
                className="w-full justify-start"
                variant="default"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Airway Bill
              </Button>
              <Button 
                variant="outline" 
                onClick={handleShare}
                className="w-full justify-start"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Tracking
              </Button>
              <Button 
                variant="outline"
                className="w-full justify-start"
              >
                <Bell className="h-4 w-4 mr-2" />
                Get Notifications
              </Button>
              {isDelivered && (
                <Button 
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Proof of Delivery
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Shipment Details */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Shipment Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Service Level</span>
                  <span className="font-semibold">{data.serviceType}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Pieces</span>
                  <span className="font-semibold">{totalPieces}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Weight</span>
                  <span className="font-semibold">{totalWeight} kg</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Value</span>
                  <span className="font-semibold">{formatCurrency(totalValue)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment Status</span>
                  <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                    Paid
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Route Summary */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Route Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Home className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Origin</p>
                    <p className="text-sm text-muted-foreground">
                      {data.originCity}, {data.originState}
                    </p>
                    <p className="text-xs text-muted-foreground">{data.originCountry}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center text-muted-foreground">
                  <ChevronRight className="h-4 w-4 mx-4" />
                  <div className="h-0.5 w-12 bg-gray-300"></div>
                  <ChevronRight className="h-4 w-4 mx-4" />
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Store className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Destination</p>
                    <p className="text-sm text-muted-foreground">
                      {data.destinationCity}, {data.destinationState}
                    </p>
                    <p className="text-xs text-muted-foreground">{data.destinationCountry}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Information */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Detailed Information</CardTitle>
            <div className="text-sm text-muted-foreground">
              Created: {formatDate(data.createdAt)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="timeline">
                <Clock className="h-4 w-4 mr-2" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="details">
                <FileText className="h-4 w-4 mr-2" />
                Details
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <Accordion type="multiple" className="w-full">
                {/* Sender & Recipient Info */}
                <AccordionItem value="parties">
                  <AccordionTrigger className="text-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Sender & Recipient
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid md:grid-cols-2 gap-6 p-4">
                      {/* Sender */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Sender Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-semibold">{data.Sender?.name || "N/A"}</p>
                          </div>
                          {data.Sender?.email && (
                            <div>
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p className="font-semibold">{data.Sender.email}</p>
                            </div>
                          )}
                          {data.Sender?.phone && (
                            <div>
                              <p className="text-sm text-muted-foreground">Phone</p>
                              <p className="font-semibold">{data.Sender.phone}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Recipient */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Recipient Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-semibold">{data.recipient.name}</p>
                          </div>
                          {data.recipient.company && (
                            <div>
                              <p className="text-sm text-muted-foreground">Company</p>
                              <p className="font-semibold">{data.recipient.company}</p>
                            </div>
                          )}
                          {data.recipient.email && (
                            <div>
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p className="font-semibold">{data.recipient.email}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-semibold">{data.recipient.phone}</p>
                          </div>
                          {data.recipient.signatureRequired && (
                            <div className="mt-2">
                              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                                Signature Required
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Package Details */}
                <AccordionItem value="packages">
                  <AccordionTrigger className="text-lg">
                    <div className="flex items-center gap-2">
                      <PackageIcon className="h-5 w-5" />
                      Package Details ({data.packages.length})
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-4">
                      {data.packages.map((pkg, idx) => (
                        <Card key={idx} className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-bold text-lg">Package {idx + 1}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{pkg.packageType}</Badge>
                                {pkg.dangerous && (
                                  <Badge variant="destructive" className="text-xs">
                                    Dangerous Goods
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">{pkg.weight} kg</p>
                              <p className="text-sm text-muted-foreground">Weight</p>
                            </div>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Dimensions</span>
                                <span className="font-semibold">
                                  {pkg.length} × {pkg.width} × {pkg.height} cm
                                </span>
                              </div>
                              <Separator />
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Pieces</span>
                                <span className="font-semibold">{pkg.pieces}</span>
                              </div>
                              <Separator />
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Declared Value</span>
                                <span className="font-semibold">{formatCurrency(pkg.declaredValue || 0)}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Description</p>
                                <p className="font-medium">{pkg.description}</p>
                              </div>
                              {pkg.insurance && (
                                <div className="mt-2">
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Insured
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold">Airway Bill</p>
                        <p className="text-sm text-muted-foreground">Download PDF</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleDownloadAirwayBill} 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
                
                {isDelivered && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Proof of Delivery</p>
                          <p className="text-sm text-muted-foreground">Available</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-4"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}