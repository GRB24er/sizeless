// Wording for tracking statuses, shared by the tracking page and the
// client's account pages. Values come from the admin tracking form
// (app/dashboard/shipments/action.ts).

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Booked",
  information_received: "Information received",
  picked_up: "Picked up",
  in_transit: "In transit",
  departed: "Departed facility",
  arrived: "Arrived at facility",
  on_hold: "On hold",
  delivered: "Delivered",
  returned: "Returned to sender",
  failed: "Delivery failed",
};

export const shipmentStatusLabel = (status: string | null | undefined) =>
  status ? SHIPMENT_STATUS_LABELS[status.toLowerCase()] ?? status.replace(/_/g, " ") : "Booked";

export const SHIPMENT_STAGES = ["Booked", "Picked up", "In transit", "Delivered"];

const STAGE_OF: Record<string, number> = {
  pending: 0,
  information_received: 0,
  picked_up: 1,
  in_transit: 2,
  departed: 2,
  arrived: 2,
  delivered: 3,
};

/** 0-based stage, or undefined for exceptions (on hold, returned, failed). */
export const shipmentStage = (status: string | null | undefined) => STAGE_OF[(status ?? "pending").toLowerCase()];

export function shipmentStatusTone(status: string | null | undefined): "done" | "attention" | "stopped" | "neutral" {
  switch (status?.toLowerCase()) {
    case "delivered":
      return "done";
    case "on_hold":
      return "attention";
    case "failed":
    case "returned":
      return "stopped";
    default:
      return "neutral";
  }
}
