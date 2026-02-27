"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTrackingStatus } from "@/app/dashboard/shipments/action";
import type { Shipment } from "./shipmane_table";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface TrackingUpdateSheetProps {
  shipment: Shipment;
  trackingUpdateId?: string;
  onClose?: () => void;
}

// Define validation schema
const trackingUpdateSchema = z.object({
  location: z.string().min(1, "Location is required"),
  message: z.string().min(1, "Message is required"),
  status: z.enum([
    "pending",
    "on_hold",
    "in_transit",
    "delivered",
    "returned",
    "picked_up",
    "information_received",
    "failed",
    "arrived",
    "departed",
  ]),
});

type FormValues = z.infer<typeof trackingUpdateSchema>;

export function TrackingUpdateSheet({
  shipment,
  trackingUpdateId,
  onClose,
}: TrackingUpdateSheetProps) {
  const [open, setOpen] = React.useState(true);
  const form = useForm<FormValues>({
    resolver: zodResolver(trackingUpdateSchema),
    defaultValues: {
      status: "pending",
    },
  });

  const handleSubmit = async (data: FormValues) => {
    try {
      const formData = new FormData();
      formData.set("shipmentId", shipment.id);
      formData.set("location", data.location);
      formData.set("message", data.message);
      formData.set("status", data.status);

      if (trackingUpdateId) {
        formData.set("trackingUpdateId", trackingUpdateId);
      }

      await updateTrackingStatus(formData);
      setOpen(false);
      onClose?.();
    } catch (error) {
      console.error("Failed to update tracking status", error);
    }
  };
  return (
    <Sheet
      open={open}
      onOpenChange={(openState) => {
        setOpen(openState);
        if (!openState) onClose?.();
      }}
    >
      <SheetContent className="p-5">
        <SheetHeader>
          <SheetTitle>
            {trackingUpdateId
              ? "Update Tracking Status"
              : "Add Tracking Update"}
          </SheetTitle>
        </SheetHeader>

        {/* Shipment details */}
        <div className="mb-4 p-4 bg-gray-100 rounded space-y-2">
          <p className="text-sm">
            <span className="font-medium">Tracking Number:</span>{" "}
            {shipment.trackingNumber || "N/A"}
          </p>
          <p className="text-sm">
            <span className="font-medium">Service Type:</span>{" "}
            {shipment.serviceType}
          </p>
        </div>

        {/* Update form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current location</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Current location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Message" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {trackingUpdateSchema.shape.status.options.map(
                        (status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace(/_/g, " ").toUpperCase()}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full"
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {trackingUpdateId ? "Update Status" : "Add Update"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}