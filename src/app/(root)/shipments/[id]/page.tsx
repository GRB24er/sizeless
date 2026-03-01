// src/app/(root)/shipments/[id]/page.tsx
import { prisma } from "@/constants/config/db";
import { format } from "date-fns";
import { notFound, redirect } from "next/navigation";
import { auth } from "~/auth";

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user) {
    return redirect("/login");
  }

  // Fetch the shipment along with related data
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      TrackingUpdates: {
        orderBy: { timestamp: "asc" },
      },
      packages: true,
      recipient: true,
      Sender: true,
    },
  });

  if (!shipment) {
    notFound();
  }

  // Use the last tracking update as the current status (if available)
  const currentStatus =
    shipment.TrackingUpdates.length > 0
      ? shipment.TrackingUpdates[shipment.TrackingUpdates.length - 1].status
      : "No updates";

  const totalWeight = shipment.packages.reduce((s, p) => s + p.weight, 0);
  const totalValue = shipment.packages.reduce(
    (s, p) => s + (p.declaredValue || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Hero Section ─── */}
      {/* pt-28 prevents overlap with the fixed navbar */}
      <div className="bg-gradient-to-br from-[#0a1628] via-[#122041] to-[#0a1628] pt-28 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <p className="text-emerald-400 text-sm font-medium tracking-wide uppercase mb-2">
                Shipment Details
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {shipment.trackingNumber}
              </h1>
              <p className="text-gray-400 text-sm">
                {shipment.originCity}, {shipment.originCountry}
                <span className="mx-2 text-emerald-500">→</span>
                {shipment.destinationCity}, {shipment.destinationCountry}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                  currentStatus
                )}`}
              >
                {currentStatus}
              </span>
              <span className="text-gray-400 text-xs">
                {shipment.serviceType}
              </span>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/10">
              <p className="text-gray-400 text-xs uppercase tracking-wide">
                Packages
              </p>
              <p className="text-white text-lg font-bold mt-1">
                {shipment.packages.length}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/10">
              <p className="text-gray-400 text-xs uppercase tracking-wide">
                Weight
              </p>
              <p className="text-white text-lg font-bold mt-1">
                {totalWeight} kg
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/10">
              <p className="text-gray-400 text-xs uppercase tracking-wide">
                Value
              </p>
              <p className="text-white text-lg font-bold mt-1">
                ${totalValue.toFixed(2)}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/10">
              <p className="text-gray-400 text-xs uppercase tracking-wide">
                Payment
              </p>
              <p
                className={`text-lg font-bold mt-1 ${
                  shipment.isPaid ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {shipment.isPaid ? "Paid" : "Unpaid"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="container mx-auto max-w-5xl px-4 -mt-4 pb-12 space-y-6">
        {/* Shipment Info Card */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
          <div className="px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Shipment Information
            </h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Created At
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(shipment.createdAt, "PPP p")}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Estimated Delivery
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(shipment.estimatedDelivery, "PPP p")}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Payment Status
                </dt>
                <dd className="mt-1 text-sm">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      shipment.isPaid
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {shipment.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Service Type
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {shipment.serviceType}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">
                  Origin Address
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {shipment.originAddress}, {shipment.originCity},{" "}
                  {shipment.originState} {shipment.originPostalCode},{" "}
                  {shipment.originCountry}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">
                  Destination Address
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {shipment.destinationAddress}, {shipment.destinationCity},{" "}
                  {shipment.destinationState} {shipment.destinationPostalCode},{" "}
                  {shipment.destinationCountry}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Sender</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {shipment.Sender?.name || "N/A"}
                </dd>
              </div>
              {shipment.Sender?.email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Sender Email
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {shipment.Sender.email}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Recipient
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {shipment.recipient.name}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Package Details Card */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
          <div className="px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Package Details
            </h2>
            <div className="space-y-3">
              {shipment.packages.map((pkg, idx) => (
                <div
                  key={pkg.id}
                  className="border border-gray-100 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#0a1628] text-white text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {pkg.packageType}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Dimensions
                      </p>
                      <p className="text-sm text-gray-900">
                        {pkg.height} × {pkg.length} × {pkg.width} cm
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Weight
                      </p>
                      <p className="text-sm text-gray-900 font-semibold">
                        {pkg.weight} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Declared Value
                      </p>
                      <p className="text-sm text-gray-900">
                        ${pkg.declaredValue || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        Pieces
                      </p>
                      <p className="text-sm text-gray-900">{pkg.pieces}</p>
                    </div>
                  </div>
                  {pkg.description && (
                    <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200">
                      {pkg.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tracking Timeline Card */}
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
          <div className="px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Tracking Timeline
            </h2>
            {shipment.TrackingUpdates.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gray-200" />

                <ul className="space-y-6">
                  {[...shipment.TrackingUpdates]
                    .reverse()
                    .map((update, idx) => (
                      <li key={update.id} className="relative pl-8">
                        {/* Timeline dot */}
                        <div
                          className={`absolute left-0 top-1 w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center ${
                            idx === 0
                              ? "bg-emerald-500 border-emerald-500"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              idx === 0 ? "bg-white" : "bg-gray-300"
                            }`}
                          />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(
                                update.status
                              )}`}
                            >
                              {update.status}
                            </span>
                            <span className="text-xs text-gray-400">
                              {format(update.timestamp, "PPP p")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {update.message}
                          </p>
                          {update.location && (
                            <p className="text-xs text-gray-500 mt-1">
                              📍 {update.location}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">
                  No tracking updates yet
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to determine status color styles
function getStatusColor(status: string | null): string {
  switch (status?.toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-800";
    case "in_transit":
      return "bg-blue-100 text-blue-800";
    case "arrived":
      return "bg-purple-100 text-purple-800";
    case "departed":
      return "bg-indigo-100 text-indigo-800";
    case "picked_up":
      return "bg-amber-100 text-amber-800";
    case "on_hold":
      return "bg-orange-100 text-orange-800";
    case "information_received":
      return "bg-gray-100 text-gray-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}