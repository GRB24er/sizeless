import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { auth } from "~/auth";
import { getClientShipments } from "@/lib/client-account";
import { SHIPPING_OPTIONS } from "@/app/(root)/shipments/create/type";
import { SHIPMENT_STAGES, shipmentStage, shipmentStatusLabel, shipmentStatusTone } from "@/lib/shipment-status";
import { cn } from "@/lib/utils";
import { AccountShell } from "@/components/account/account-shell";
import { TONE_BADGE } from "@/components/account/vault-format";
import { ButtonLink, buttonClass } from "@/components/landing/primitives";

export const metadata: Metadata = {
  title: "My shipments | Aegis Cargo",
  description: "Every shipment you've booked, with its status and documents.",
};

const serviceLabel = (id: string) => SHIPPING_OPTIONS.find((o) => o.id === id)?.label ?? id.replace(/_/g, " ");

export default async function MyShipmentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/shipments/history");

  const shipments = await getClientShipments(session.user.id);

  return (
    <AccountShell
      active="shipments"
      title="Your shipments"
      intro="Everything you've booked, with the latest handover and the documents for each."
      actions={
        <ButtonLink href="/shipments/create" size="sm" arrow>
          Book a shipment
        </ButtonLink>
      }
    >
      {shipments.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-14 text-center">
          <p className="type-display text-xl font-semibold text-ink">No shipments yet</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-2">
            When you book a shipment it appears here with its tracking number, status and documents.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/shipments/create" size="sm" arrow>
              Book a shipment
            </ButtonLink>
            <ButtonLink href="/services" variant="outline" size="sm">
              Prices and services
            </ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="grid gap-4">
          {shipments.map((s) => {
            const latest = s.TrackingUpdates[0];
            const stage = shipmentStage(latest?.status);
            const weight = s.packages.reduce((sum, p) => sum + (p.weight || 0), 0);
            return (
              <li key={s.id} className="rounded-xl border border-line bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/track/${s.trackingNumber}`}
                      className="figures text-[17px] text-ink underline decoration-transparent underline-offset-4 transition-colors hover:decoration-ink/40"
                    >
                      {s.trackingNumber}
                    </Link>
                    <p className="mt-0.5 text-[15px] text-ink-2">
                      {s.originCity}, {s.originCountry} to {s.destinationCity}, {s.destinationCountry}
                    </p>
                  </div>
                  <span className={cn("self-start whitespace-nowrap rounded-md px-2 py-0.5 text-[13px] font-medium", TONE_BADGE[shipmentStatusTone(latest?.status)])}>
                    {shipmentStatusLabel(latest?.status)}
                  </span>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-[13px] text-ink-3">Service</dt>
                    <dd className="mt-0.5 text-ink">{serviceLabel(s.serviceType)}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-ink-3">Booked</dt>
                    <dd className="mt-0.5 text-ink">{format(s.createdAt, "d MMM yyyy")}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-ink-3">{s.deliveredAt ? "Delivered" : "Estimated delivery"}</dt>
                    <dd className="mt-0.5 text-ink">{format(s.deliveredAt ?? s.estimatedDelivery, "d MMM yyyy")}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-ink-3">Packages</dt>
                    <dd className="mt-0.5 text-ink">
                      {s.packages.length}, <span className="figures">{weight.toFixed(1)} kg</span>
                    </dd>
                  </div>
                </dl>

                {latest?.location && (
                  <p className="mt-4 text-sm text-ink-3">
                    Last handover {format(latest.timestamp, "d MMM yyyy, HH:mm")}, {latest.location}
                  </p>
                )}

                {stage !== undefined && (
                  <ol aria-label="Progress" className="mt-4 grid max-w-xl grid-cols-4 gap-1.5">
                    {SHIPMENT_STAGES.map((label, i) => (
                      <li key={label}>
                        <span aria-hidden className={cn("block h-[3px] rounded-full", i <= stage ? "bg-signal" : "bg-line")} />
                        <span className={cn("mt-1.5 block text-[12px]", i === stage ? "font-medium text-ink" : "text-ink-3")}>
                          {label}
                          {i === stage && <span className="sr-only"> (current)</span>}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}

                <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                  <Link href={`/track/${s.trackingNumber}`} className={buttonClass("dark", "sm")}>
                    View shipment
                  </Link>
                  <a href={`/api/shipments/${s.id}/receipt`} className={buttonClass("outline", "sm")}>
                    Receipt (PDF)
                  </a>
                  <a href={`/api/shipments/${s.id}/label`} className={buttonClass("outline", "sm")}>
                    Label (PDF)
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}

    </AccountShell>
  );
}
