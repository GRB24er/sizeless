"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Trash2, Loader2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { TrackingUpdateSheet } from "./TrackingUpdateSheet";
import { deleteShipment, bulkDeleteShipments } from "@/app/dashboard/shipments/action";
import { toast } from "sonner";
import Link from "next/link";

export type TrackingUpdate = {
  id: string;
  shipmentId: string;
  timestamp: Date;
  location: string | null;
  message: string;
  status: string | null;
};

export type Shipment = {
  id: string;
  trackingNumber: string | null;
  originCity: string;
  destinationCity: string;
  serviceType: string;
  estimatedDelivery: string | null;
  isPaid: boolean;
  createdAt: string;
  TrackingUpdates?: TrackingUpdate[];
};

export const columns: ColumnDef<Shipment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "trackingNumber",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Tracking Number
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const tracking = row.getValue("trackingNumber") as string | null;
      return <div className="font-mono text-sm">{tracking ? tracking : "N/A"}</div>;
    },
  },
  {
    accessorKey: "originCity",
    header: "Origin City",
  },
  {
    accessorKey: "destinationCity",
    header: "Destination City",
  },
  {
    accessorKey: "serviceType",
    header: "Service Type",
  },
  {
    accessorKey: "estimatedDelivery",
    header: "Est. Delivery",
    cell: ({ row }) => {
      const value = row.getValue("estimatedDelivery");
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        value instanceof Date
      ) {
        return new Date(value).toLocaleDateString();
      }
      return "N/A";
    },
  },
  {
    accessorKey: "isPaid",
    header: "Paid",
    cell: ({ row }) => (row.getValue("isPaid") ? "Yes" : "No"),
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const value = row.getValue("createdAt");
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        value instanceof Date
      ) {
        return new Date(value).toLocaleDateString();
      }
      return "Invalid date";
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row, table }) => {
      const shipment = row.original;
      const meta = table.options.meta as { onDelete?: (id: string, tracking: string) => void } | undefined;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(shipment.trackingNumber!)
              }
            >
              Copy Tracking ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={`/track/results?id=${shipment.trackingNumber}`}>
                Track Shipment
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/dashboard/shipments/${shipment.id}/detail`}>
                Update Shipment Status
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href={`/dashboard/shipments/${shipment.id}/detail`}>
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={() => meta?.onDelete?.(shipment.id, shipment.trackingNumber || "Unknown")}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Shipment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function ShipmentsDataTable({ data }: { data: Shipment[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [selectedShipment, setSelectedShipment] = React.useState<Shipment | null>(null);

  // Delete states
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; tracking: string } | null>(null);
  const [showBulkDelete, setShowBulkDelete] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleSingleDelete = (id: string, tracking: string) => {
    setDeleteTarget({ id, tracking });
    setShowDeleteDialog(true);
  };

  const confirmSingleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteShipment(deleteTarget.id);
    setIsDeleting(false);
    if (result.success) {
      toast.success(result.message);
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    } else {
      toast.error(result.message);
    }
  };

  const confirmBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const ids = selectedRows.map(r => r.original.id);
    if (!ids.length) return;

    setIsDeleting(true);
    const result = await bulkDeleteShipments(ids);
    setIsDeleting(false);
    if (result.success) {
      toast.success(result.message);
      setShowBulkDelete(false);
      setRowSelection({});
    } else {
      toast.error(result.message);
    }
  };

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta: {
      onDelete: handleSingleDelete,
    },
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="w-full">
      {/* Table Controls */}
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter tracking numbers..."
          value={
            (table.getColumn("trackingNumber")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("trackingNumber")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        {/* Bulk Delete Button */}
        {selectedCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowBulkDelete(true)}
            className="ml-2"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete ({selectedCount})
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Render the sheet when a shipment is selected */}
        {selectedShipment && (
          <TrackingUpdateSheet
            shipment={selectedShipment}
            onClose={() => setSelectedShipment(null)}
          />
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* ═══ SINGLE DELETE DIALOG ═══ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Delete Shipment
            </DialogTitle>
            <DialogDescription>This will permanently delete the shipment and all its tracking updates, packages, and notifications.</DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <p className="text-sm font-mono font-semibold text-red-900">{deleteTarget.tracking}</p>
              <p className="text-xs text-red-500 mt-1">This action cannot be undone.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={confirmSingleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ BULK DELETE DIALOG ═══ */}
      <Dialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Delete {selectedCount} Shipment(s)
            </DialogTitle>
            <DialogDescription>This will permanently delete all selected shipments and their related data.</DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 rounded-lg p-4 border border-red-100 max-h-40 overflow-y-auto">
            {table.getFilteredSelectedRowModel().rows.map(row => (
              <p key={row.id} className="text-sm font-mono text-red-800">
                {row.original.trackingNumber || "No tracking #"}
              </p>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDelete(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={confirmBulkDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete All ({selectedCount})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
