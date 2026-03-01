"use client";

import { useState, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Search,
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
  Trash2,
  Loader2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
        className: "bg-blue-100 text-blue-800 border border-blue-200",
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

export const ShipmentsPage = ({
  shipments: initialShipments,
}: ShipmentsPageProps) => {
  const router = useRouter();

  const [shipments, setShipments] = useState<Shipment[]>(initialShipments);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "all">(
    "all"
  );
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "delivered" | "pending"
  >("all");
  const [updateSheetShipment, setUpdateSheetShipment] =
    useState<Shipment | null>(null);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shipmentToDelete, setShipmentToDelete] = useState<Shipment | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  // Loading states for PDF downloads
  const [downloadingLabel, setDownloadingLabel] = useState<string | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState<string | null>(
    null
  );

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

  // ─── ACTION HANDLERS ───

  const handleViewDetails = (
    e: MouseEvent<HTMLDivElement | HTMLButtonElement, globalThis.MouseEvent>,
    shipmentId: string
  ) => {
    e.stopPropagation();
    router.push(`/shipments/${shipmentId}`);
  };

  /** Generate Label — calls the API which uses generateAirwayBill from pdf-templates */
  const handleGenerateLabel = async (
    e: MouseEvent<HTMLDivElement | HTMLButtonElement, globalThis.MouseEvent>,
    shipment: Shipment
  ) => {
    e.stopPropagation();
    setDownloadingLabel(shipment.id);
    try {
      const res = await fetch(`/api/shipments/${shipment.id}/label`);
      if (!res.ok) throw new Error("Failed to generate label");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `label-${shipment.tracking_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Label download error:", error);
      alert("Failed to generate label. Please try again.");
    } finally {
      setDownloadingLabel(null);
    }
  };

  /** Download Receipt — calls the API which uses generateCommercialInvoice from pdf-templates */
  const handleDownloadReceipt = async (
    e: MouseEvent<HTMLDivElement | HTMLButtonElement, globalThis.MouseEvent>,
    shipment: Shipment
  ) => {
    e.stopPropagation();
    setDownloadingReceipt(shipment.id);
    try {
      const res = await fetch(`/api/shipments/${shipment.id}/receipt`);
      if (!res.ok) throw new Error("Failed to generate receipt");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${shipment.tracking_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Receipt download error:", error);
      alert("Failed to download receipt. Please try again.");
    } finally {
      setDownloadingReceipt(null);
    }
  };

  const handleOpenTrackingUpdate = (
    e: MouseEvent<HTMLDivElement | HTMLButtonElement, globalThis.MouseEvent>,
    shipment: Shipment
  ) => {
    e.stopPropagation();
    setUpdateSheetShipment(shipment);
  };

  /** Delete — opens confirmation dialog first */
  const handleDeleteClick = (
    e: MouseEvent<HTMLDivElement | HTMLButtonElement, globalThis.MouseEvent>,
    shipment: Shipment
  ) => {
    e.stopPropagation();
    setShipmentToDelete(shipment);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!shipmentToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/shipments/${shipmentToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      // Remove from local state immediately
      setShipments((prev) =>
        prev.filter((s) => s.id !== shipmentToDelete.id)
      );
      setDeleteDialogOpen(false);
      setShipmentToDelete(null);
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(error.message || "Failed to delete shipment");
    } finally {
      setDeleting(false);
    }
  };

  // ─── FILTERING ───

  const filteredShipments = shipments.filter((shipment) => {
    const term = searchTerm.trim().toLowerCase();

    const matchesSearch =
      term.length === 0 ||
      shipment.tracking_number.toLowerCase().includes(term) ||
      shipment.recipient.name.toLowerCase().includes(term) ||
      shipment.origin.toLowerCase().includes(term) ||
      shipment.destination.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" ||
      shipment.status.toLowerCase() === statusFilter.toLowerCase();

    let matchesTab = true;
    if (activeTab === "active") {
      matchesTab = activeStatuses.includes(shipment.status);
    } else if (activeTab === "delivered") {
      matchesTab = shipment.status === "Delivered";
    } else if (activeTab === "pending") {
      matchesTab =
        shipment.status === "Pending" || shipment.status === "Proccessing";
    }

    return matchesSearch && matchesStatus && matchesTab;
  });

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
          <p className="text-sm text-gray-500">
            Manage and track all shipments
          </p>
        </div>
        <Button
          className="bg-secondary hover:bg-secondary hover:opacity-70"
          onClick={() => router.push("/shipments/create")}
        >
          <Package className="mr-2 h-4 w-4" />
          New Shipment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalShipments}</p>
              </div>
              <Package className="h-8 w-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-blue-600">
                  {activeShipments}
                </p>
              </div>
              <Truck className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold text-green-600">
                  {deliveredShipments}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {pendingShipments}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tracking no., recipient, route..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
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
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In_transit">In Transit</SelectItem>
              <SelectItem value="On_hold">On Hold</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Returned">Returned</SelectItem>
              <SelectItem value="Picked_up">Picked Up</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
              <SelectItem value="Information_received">
                Info Received
              </SelectItem>
              <SelectItem value="Arrived">Arrived</SelectItem>
              <SelectItem value="Departed">Departed</SelectItem>
            </SelectContent>
          </Select>
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
                            onClick={(e) =>
                              handleDownloadReceipt(e, shipment)
                            }
                            disabled={downloadingReceipt === shipment.id}
                          >
                            {downloadingReceipt === shipment.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="mr-2 h-4 w-4" />
                            )}
                            Download Receipt
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) =>
                              handleGenerateLabel(e, shipment)
                            }
                            disabled={downloadingLabel === shipment.id}
                          >
                            {downloadingLabel === shipment.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Printer className="mr-2 h-4 w-4" />
                            )}
                            Generate Label
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) =>
                              handleOpenTrackingUpdate(e, shipment)
                            }
                          >
                            <Truck className="mr-2 h-4 w-4" />
                            Update Tracking
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={(e) => handleDeleteClick(e, shipment)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Shipment
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

      {/* Tracking Update Sheet */}
      {updateSheetShipment && (
        <TrackingUpdateSheet
          shipment={{
            id: updateSheetShipment.id,
            trackingNumber: updateSheetShipment.tracking_number,
            serviceType: updateSheetShipment.type,
          } as any}
          onClose={() => setUpdateSheetShipment(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shipment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete shipment{" "}
              <span className="font-semibold text-gray-900">
                {shipmentToDelete?.tracking_number}
              </span>
              ? This will permanently remove the shipment and all its tracking
              updates. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};