"use client";

import { useState, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  Truck,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  File,
  Printer,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import ShipmentLabelModal from "./shipment.modal";
// IMPORTANT: TrackingUpdateSheet.tsx must be in the same folder as this file.
// If it’s in a different folder, just fix this path.
import { TrackingUpdateSheet } from "../dashboard/shipments/TrackingUpdateSheet";

export type ShipmentStatus =
  | "Proccessing"
  | "Pending"
  | "In_transit"
  | "On_hold"
  | "Delivered"
  | "Returned"
  | "Picked_up"
  | "Failed"
  | "Information_received"
  | "Arrived"
  | "Departed";

export type Shipment = {
  id: string;
  tracking_number: string;
  origin: string;
  destination: string;
  date: string;
  eta: string;
  originPostalCode?: string | null;
  destinationPostalCode?: string | null;
  delivered?: string | null;
  items: number;
  weight: string;
  type: string;
  value: string;
  status: ShipmentStatus;
  lastUpdate: string;
  recipient: {
    name: string;
    imageUrl?: string | null;
  };
};

type ShipmentsPageProps = {
  shipments: Shipment[];
};

function getStatusConfig(status: ShipmentStatus) {
  switch (status) {
    case "Delivered":
      return {
        label: "Delivered",
        icon: CheckCircle,
        className: "bg-green-100 text-green-800 border border-green-200",
      };
    case "In_transit":
      return {
        label: "In Transit",
        icon: Truck,
        className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
      };
    case "On_hold":
      return {
        label: "On Hold",
        icon: AlertTriangle,
        className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      };
    case "Returned":
      return {
        label: "Returned",
        icon: Package,
        className: "bg-gray-100 text-gray-800 border border-gray-200",
      };
    case "Picked_up":
      return {
        label: "Picked Up",
        icon: Package,
        className: "bg-indigo-100 text-indigo-800 border border-indigo-200",
      };
    case "Failed":
      return {
        label: "Failed",
        icon: AlertTriangle,
        className: "bg-red-100 text-red-800 border border-red-200",
      };
    case "Information_received":
      return {
        label: "Info Received",
        icon: Clock,
        className: "bg-sky-100 text-sky-800 border border-sky-200",
      };
    case "Arrived":
      return {
        label: "Arrived at Facility",
        icon: MapPin,
        className: "bg-purple-100 text-purple-800 border border-purple-200",
      };
    case "Departed":
      return {
        label: "Departed Facility",
        icon: Truck,
        className: "bg-orange-100 text-orange-800 border border-orange-200",
      };
    case "Pending":
    case "Proccessing":
    default:
      return {
        label: "Processing",
        icon: Clock,
        className: "bg-gray-100 text-gray-800 border border-gray-200",
      };
  }
}

export const ShipmentsPage = ({ shipments }: ShipmentsPageProps) => {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "all">(
    "all"
  );
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "delivered" | "pending"
  >("all");
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null
  );
  const [updateSheetShipment, setUpdateSheetShipment] =
    useState<Shipment | null>(null);

  const activeStatuses: ShipmentStatus[] = [
    "Pending",
    "Proccessing",
    "In_transit",
    "On_hold",
    "Information_received",
    "Arrived",
    "Departed",
  ];

  const totalShipments = shipments.length;
  const activeShipments = shipments.filter((s) =>
    activeStatuses.includes(s.status)
  ).length;
  const deliveredShipments = shipments.filter(
    (s) => s.status === "Delivered"
  ).length;
  const pendingShipments = shipments.filter(
    (s) => s.status === "Pending" || s.status === "Proccessing"
  ).length;

  const handleViewDetails = (
    e: MouseEvent<HTMLDivElement | HTMLButtonElement, globalThis.MouseEvent>,
    shipmentId: string
  ) => {
    e.stopPropagation();
    router.push(`/shipments/${shipmentId}`);
  };

  const handleGenerateLabel = (
    e: MouseEvent<HTMLDivElement | HTMLButtonElement, globalThis.MouseEvent>,
    shipment: Shipment
  ) => {
    e.stopPropagation();
    setSelectedShipment(shipment);
    setLabelModalOpen(true);
  };

  const handleDownloadReceipt = (
    e: MouseEvent<HTMLDivElement | HTMLButtonElement, globalThis.MouseEvent>
  ) => {
    e.stopPropagation();
    // Hook this to real receipt download logic later
    console.log("Download receipt clicked");
  };

  const handleOpenTrackingUpdate = (
    e: MouseEvent<HTMLDivElement | HTMLButtonElement, globalThis.MouseEvent>,
    shipment: Shipment
  ) => {
    e.stopPropagation();
    setUpdateSheetShipment(shipment);
  };

  const filteredShipments = shipments.filter((shipment) => {
    const term = searchTerm.trim().toLowerCase();

    const matchesSearch =
      term.length === 0 ||
      shipment.tracking_number.toLowerCase().includes(term) ||
      shipment.origin.toLowerCase().includes(term) ||
      shipment.destination.toLowerCase().includes(term) ||
      shipment.recipient.name.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" ? true : shipment.status === statusFilter;

    const matchesTab =
      activeTab === "all"
        ? true
        : activeTab === "active"
        ? activeStatuses.includes(shipment.status)
        : activeTab === "delivered"
        ? shipment.status === "Delivered"
        : shipment.status === "Pending" || shipment.status === "Proccessing";

    return matchesSearch && matchesStatus && matchesTab;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Shipments</h1>
          <p className="text-muted-foreground">
            Manage and track all your shipments in one place.
          </p>
        </div>
        <Button
          className="bg-secondary hover:bg-secondary hover:opacity-70"
          onClick={() => router.push("/shipments/create")}
        >
          Create New Shipment
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Shipments</p>
              <p className="text-2xl font-bold">{totalShipments}</p>
            </div>
            <Package className="h-6 w-6 text-secondary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{activeShipments}</p>
            </div>
            <Truck className="h-6 w-6 text-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="text-2xl font-bold">{deliveredShipments}</p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingShipments}</p>
            </div>
            <Clock className="h-6 w-6 text-amber-500" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by tracking number, recipient, or route"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as ShipmentStatus | "all")
              }
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="information_received">
                  Info Received
                </SelectItem>
                <SelectItem value="arrived">Arrived</SelectItem>
                <SelectItem value="departed">Departed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredShipments.length} of {shipments.length} shipments
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) =>
          setActiveTab(val as "all" | "active" | "delivered" | "pending")
        }
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4" />
      </Tabs>

      {/* Shipments Table */}
      {filteredShipments.length > 0 ? (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking No.</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.map((shipment) => {
                const statusConfig = getStatusConfig(shipment.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <TableRow
                    key={shipment.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={(e) => handleViewDetails(e, shipment.id)}
                  >
                    <TableCell className="font-medium">
                      {shipment.tracking_number}
                    </TableCell>
                    <TableCell>{shipment.recipient.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="font-medium">{shipment.origin}</span>
                        <span className="text-muted-foreground text-xs">
                          to {shipment.destination}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{shipment.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusConfig.className}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="text-sm text-gray-700">
                        {shipment.lastUpdate}
                      </span>
                    </TableCell>
                    <TableCell>{shipment.date}</TableCell>
                    <TableCell>{shipment.eta}</TableCell>
                    <TableCell>{shipment.value}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/track/results?id=${shipment.tracking_number}`
                              );
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Track Shipment
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => handleViewDetails(e, shipment.id)}
                          >
                            <File className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => handleDownloadReceipt(e)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Receipt
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => handleGenerateLabel(e, shipment)}
                          >
                            <Printer className="mr-2 h-4 w-4" />
                            Generate Label
                          </DropdownMenuItem>

                          {/* NEW: Update Tracking (uses your TrackingUpdateSheet.tsx) */}
                          <DropdownMenuItem
                            onClick={(e) =>
                              handleOpenTrackingUpdate(e, shipment)
                            }
                          >
                            <Truck className="mr-2 h-4 w-4" />
                            Update Tracking
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-gray-100 p-3 mb-4">
              <Package size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-1">No shipments found</h3>
            <p className="text-gray-500 text-center mb-4">
              {searchTerm
                ? "Try adjusting your search or filters"
                : "You don't have any shipments matching these filters"}
            </p>
            <Button
              className="bg-secondary hover:bg-secondary hover:opacity-70"
              onClick={() => router.push("/shipments/create")}
            >
              Create a New Shipment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination placeholder */}
      {filteredShipments.length > 0 && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" className="mr-2" disabled>
            Previous
          </Button>
          <Button variant="outline" className="bg-secondary text-white mr-2">
            1
          </Button>
          <Button variant="outline" className="mr-2">
            2
          </Button>
          <Button variant="outline">Next</Button>
        </div>
      )}

      {/* Shipment Label Modal */}
      {selectedShipment && (
        <ShipmentLabelModal
          shipment={selectedShipment}
          isOpen={labelModalOpen}
          onClose={() => setLabelModalOpen(false)}
        />
      )}

      {/* Tracking Update Sheet – this is where your admin updates happen */}
      {updateSheetShipment && (
        <TrackingUpdateSheet
          shipment={{
            // Adapt from this page's Shipment shape to TrackingUpdateSheet's Shipment shape
            id: updateSheetShipment.id,
            trackingNumber: updateSheetShipment.tracking_number,
            serviceType: updateSheetShipment.type,
          } as any}
          onClose={() => setUpdateSheetShipment(null)}
        />
      )}
    </div>
  );
};
