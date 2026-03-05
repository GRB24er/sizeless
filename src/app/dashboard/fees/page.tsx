import { prisma } from "@/constants/config/db";
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { FeesPageClient } from "./FeesPageClient";

export default async function FeesPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return redirect("/");

  const shipments = await prisma.shipment.findMany({
    include: {
      recipient: true,
      Sender: true,
      packages: true,
      fees: { orderBy: { createdAt: "desc" } },
      TrackingUpdates: { orderBy: { timestamp: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serialized = shipments.map((s) => ({
    id: s.id,
    trackingNumber: s.trackingNumber,
    isPaid: s.isPaid,
    origin: `${s.originCity}, ${s.originCountry}`,
    destination: `${s.destinationCity}, ${s.destinationCountry}`,
    serviceType: s.serviceType,
    recipientName: s.recipient.name,
    recipientEmail: s.recipient.email || "",
    senderName: s.Sender?.name || "N/A",
    status:
      s.TrackingUpdates.length > 0
        ? s.TrackingUpdates[s.TrackingUpdates.length - 1].status || "pending"
        : "pending",
    fees: s.fees.map((f) => ({
      id: f.id,
      type: f.type,
      customType: f.customType,
      amount: f.amount,
      currency: f.currency,
      reason: f.reason,
      status: f.status,
      invoiceNumber: f.invoiceNumber,
      invoiceSentAt: f.invoiceSentAt?.toISOString() || null,
      paidAt: f.paidAt?.toISOString() || null,
      receiptSentAt: f.receiptSentAt?.toISOString() || null,
      createdAt: f.createdAt.toISOString(),
    })),
  }));

  return <FeesPageClient shipments={serialized} />;
}
