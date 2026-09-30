"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow, isAfter } from "date-fns";
import { AlertTriangle, CheckCircle2, Download, Lock, MapPin, Printer, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { SHIPPING_OPTIONS, PACKAGE_TYPES } from "@/app/(root)/shipments/create/type";
import { COMPANY } from "@/lib/company";
import { SHIPMENT_STAGES, shipmentStage, shipmentStatusLabel, shipmentStatusTone } from "@/lib/shipment-status";
import { cn } from "@/lib/utils";
import { buttonClass, plainRange, usdCents } from "@/components/landing/primitives";

interface TrackingEvent {
  id: string;
  timestamp: Date;
  location: string | null;
  status: string | null;
  message: string;
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
}

interface Sender {
  name: string;
  email?: string | null;
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
  /** Public view: contact details, street addresses, values and payment status are withheld. */
  detailsHidden?: boolean;
};

const STAGES = SHIPMENT_STAGES;
const labelFor = shipmentStatusLabel;
const TONE_CLASS = { done: "text-[#1F7A4D]", attention: "text-[#9A4B00]", stopped: "text-[#B42318]", neutral: "text-ink" } as const;
const tone = (status: string | null) => TONE_CLASS[shipmentStatusTone(status)];

const place = (city: string, state: string, country: string) => [city, state, country].filter(Boolean).join(", ");

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3">
      <dt className="text-sm text-ink-3">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

export default function TrackingResult({ data, detailsHidden = false }: TrackingResultProps) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();

  const events = [...data.TrackingUpdates].reverse();
  const latest = events[0];
  const status = latest?.status?.toLowerCase() ?? "pending";
  const isDelivered = status === "delivered";
  const stage = shipmentStage(status);
  const service = SHIPPING_OPTIONS.find((o) => o.id === data.serviceType);

  const totalWeight = data.packages.reduce((sum, p) => sum + p.weight, 0);
  const totalValue = data.packages.reduce((sum, p) => sum + (p.declaredValue || 0), 0);
  const totalPieces = data.packages.reduce((sum, p) => sum + p.pieces, 0);
  const overdue = !isDelivered && isAfter(new Date(), data.estimatedDelivery);

  const downloadAirWaybill = async () => {
    const id = toast.loading("Preparing the air waybill");
    try {
      const response = await fetch(`/api/generate-airway-bill/${data.trackingNumber}`);
      if (response.status === 401 || response.status === 404) {
        toast.error("Sign in with the account that booked this shipment to download the air waybill.", { id });
        return;
      }
      if (!response.ok) throw new Error("Failed to generate air waybill");
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `AWB-${data.trackingNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Air waybill downloaded", { id });
    } catch (error) {
      console.error(error);
      toast.error("The air waybill couldn't be downloaded. Please try again.", { id });
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Shipment ${data.trackingNumber}`, url });
      } catch {
        /* dismissed */
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Tracking link copied");
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <section className="rounded-xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[13px] text-ink-3">Tracking number</p>
            <h1 className="figures mt-1 text-2xl text-ink sm:text-[1.75rem]">{data.trackingNumber}</h1>
            <p className="mt-1 text-[15px] text-ink-2">
              {service ? `${service.label}, ${plainRange(service.transitDays)}` : data.serviceType}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button onClick={() => startRefresh(() => router.refresh())} disabled={refreshing} className={buttonClass("outline", "sm")}>
              <RefreshCw aria-hidden strokeWidth={1.75} className={cn("size-4", refreshing && "animate-spin")} /> Refresh
            </button>
            <button onClick={share} className={buttonClass("outline", "sm")}>
              <Share2 aria-hidden strokeWidth={1.75} className="size-4" /> Share
            </button>
            <button onClick={() => window.print()} className={buttonClass("outline", "sm")}>
              <Printer aria-hidden strokeWidth={1.75} className="size-4" /> Print
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 border-t border-line pt-6 sm:grid-cols-3">
          <div>
            <p className="text-[13px] text-ink-3">Status</p>
            <p className={cn("type-display mt-1 text-[1.75rem] font-semibold leading-tight", tone(status))}>{labelFor(status)}</p>
            {latest && (
              <p className="mt-1 text-sm text-ink-3">
                Updated {formatDistanceToNow(latest.timestamp, { addSuffix: true })}
                {latest.location ? `, ${latest.location}` : ""}
              </p>
            )}
          </div>
          <div>
            <p className="text-[13px] text-ink-3">Route</p>
            <p className="mt-1 text-[17px] font-semibold text-ink">{data.originCity}</p>
            <p className="text-sm text-ink-3">{data.originCountry}</p>
            <p className="mt-2 text-[17px] font-semibold text-ink">{data.destinationCity}</p>
            <p className="text-sm text-ink-3">{data.destinationCountry}</p>
          </div>
          <div>
            <p className="text-[13px] text-ink-3">{isDelivered ? "Delivered" : "Estimated delivery"}</p>
            <p className="mt-1 text-[17px] font-semibold text-ink">{format(data.deliveredAt || data.estimatedDelivery, "EEEE d MMMM yyyy")}</p>
            {overdue && <p className="mt-1 text-sm text-[#9A4B00]">Later than estimated</p>}
          </div>
        </div>

        {stage !== undefined && (
          <ol aria-label="Progress" className="mt-8 grid grid-cols-4 gap-2">
            {STAGES.map((label, i) => (
              <li key={label}>
                <span aria-hidden className={cn("block h-1 rounded-full", i <= stage ? "bg-signal" : "bg-line")} />
                <span className={cn("mt-2 block text-[13px]", i <= stage ? "font-medium text-ink" : "text-ink-3")}>
                  {label}
                  {i === stage && <span className="sr-only"> (current)</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {status === "on_hold" && (
        <section className="flex gap-4 rounded-xl border border-signal/25 bg-signal-soft p-5 sm:p-6">
          <AlertTriangle aria-hidden strokeWidth={1.5} className="mt-0.5 size-6 shrink-0 text-signal-ink" />
          <div>
            <h2 className="font-semibold text-ink">This shipment is on hold. You don&apos;t need to pay anything.</h2>
            <p className="mt-1 max-w-[70ch] text-[15px] leading-relaxed text-ink-2">
              Holds happen for operational reasons, such as a documentation or address check. The price was fixed at booking,
              and we never ask for a payment to release a shipment. If anyone asks you to pay, don&apos;t, and forward the
              message to{" "}
              <a href={`mailto:${COMPANY.email}`} className="font-medium text-ink underline decoration-line-2 underline-offset-4">
                {COMPANY.email}
              </a>
              .
            </p>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {/* Handover log */}
          <section className="rounded-xl border border-line bg-surface p-6 sm:p-8">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold text-ink">Handover log</h2>
              <p className="text-sm text-ink-3">
                {events.length} {events.length === 1 ? "entry" : "entries"}
              </p>
            </div>
            {events.length === 0 ? (
              <p className="mt-6 text-[15px] text-ink-2">
                No handovers yet. The first entry appears when the shipment is picked up, and the sender and recipient are emailed
                with each update.
              </p>
            ) : (
              <ol className="relative mt-6 space-y-6 pl-7">
                <span aria-hidden className="absolute bottom-2 left-[5px] top-2 w-px bg-line-2" />
                {events.map((event, i) => (
                  <li key={event.id} className="relative">
                    <span
                      aria-hidden
                      className={cn(
                        "absolute -left-7 top-[5px] block size-[11px] rounded-[3px] border-2",
                        i === 0 ? "border-signal bg-signal" : "border-line-2 bg-surface"
                      )}
                    />
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                      <p className={cn("text-[15px]", i === 0 ? cn("font-semibold", tone(event.status)) : "font-medium text-ink")}>
                        {labelFor(event.status)}
                      </p>
                      <p className="figures shrink-0 text-[13px] text-ink-3">{format(event.timestamp, "EEE d MMM yyyy, HH:mm")}</p>
                    </div>
                    {event.message && <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{event.message}</p>}
                    {event.location && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-3">
                        <MapPin aria-hidden strokeWidth={1.75} className="size-3.5" />
                        {event.location}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {/* Parties */}
          <section className="rounded-xl border border-line bg-surface p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-ink">Sender and recipient</h2>
            {detailsHidden && (
              <p className="mt-2 flex items-start gap-2 text-sm text-ink-3">
                <Lock aria-hidden strokeWidth={1.75} className="mt-0.5 size-4 shrink-0" />
                Contact details and street addresses are only shown to the account that booked this shipment.
              </p>
            )}
            <div className="mt-6 grid gap-8 sm:grid-cols-2">
              {[
                {
                  title: "Sender",
                  name: data.Sender?.name || "Not given",
                  lines: [data.Sender?.email],
                  address: [data.originAddress, place(data.originCity, data.originState, data.originPostalCode), data.originCountry],
                },
                {
                  title: "Recipient",
                  name: data.recipient.name,
                  lines: [data.recipient.company, data.recipient.email, data.recipient.phone],
                  address: [
                    data.destinationAddress,
                    place(data.destinationCity, data.destinationState, data.destinationPostalCode),
                    data.destinationCountry,
                  ],
                },
              ].map((party) => (
                <div key={party.title}>
                  <p className="text-[13px] text-ink-3">{party.title}</p>
                  <p className="mt-1 font-semibold text-ink">{party.name}</p>
                  {party.lines.filter(Boolean).map((l) => (
                    <p key={l as string} className="text-sm text-ink-2">
                      {l}
                    </p>
                  ))}
                  <p className="mt-3 text-sm leading-relaxed text-ink-2">
                    {party.address.filter(Boolean).map((l) => (
                      <span key={l} className="block">
                        {l}
                      </span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Packages */}
          <section className="rounded-xl border border-line bg-surface p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-ink">Packages</h2>
            <ul className="mt-4 divide-y divide-line">
              {data.packages.map((pkg, i) => (
                <li key={i} className="grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-8">
                  <div>
                    <p className="font-medium text-ink">
                      Package {i + 1}
                      <span className="font-normal text-ink-3">
                        {" "}
                        {PACKAGE_TYPES.find((t) => t.value === pkg.packageType)?.label ?? pkg.packageType.replace(/_/g, " ")}
                      </span>
                    </p>
                    {pkg.description && <p className="mt-1 text-sm text-ink-2">{pkg.description}</p>}
                    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-3">
                      <span>
                        {pkg.length} × {pkg.width} × {pkg.height} cm
                      </span>
                      <span>
                        {pkg.pieces} {pkg.pieces === 1 ? "piece" : "pieces"}
                      </span>
                      {pkg.insurance && <span>Insured</span>}
                      {pkg.dangerous && <span className="text-[#B42318]">Dangerous goods</span>}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="figures text-ink">{pkg.weight} kg</p>
                    {!detailsHidden && pkg.declaredValue != null && (
                      <p className="text-[13px] text-ink-3">Declared {usdCents(pkg.declaredValue)}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="text-[15px] font-semibold text-ink">Shipment details</h2>
            <dl className="mt-2 divide-y divide-line">
              <Detail label="Service">{service?.label ?? data.serviceType}</Detail>
              <Detail label="Packages">
                {data.packages.length} ({totalPieces} {totalPieces === 1 ? "piece" : "pieces"})
              </Detail>
              <Detail label="Total weight">
                <span className="figures">{totalWeight.toFixed(1)} kg</span>
              </Detail>
              {!detailsHidden && (
                <>
                  <Detail label="Declared value">
                    <span className="figures">{usdCents(totalValue)}</span>
                  </Detail>
                  <Detail label="Booking payment">{data.isPaid ? "Paid" : "Not yet paid"}</Detail>
                </>
              )}
              <Detail label="Booked">{format(data.createdAt, "d MMM yyyy")}</Detail>
            </dl>
          </section>

          {data.specialInstructions && (
            <section className="rounded-xl border border-line bg-surface p-6">
              <h2 className="text-[15px] font-semibold text-ink">Special instructions</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{data.specialInstructions}</p>
            </section>
          )}

          <section className="rounded-xl border border-line bg-surface p-6 print:hidden">
            <h2 className="text-[15px] font-semibold text-ink">Documents</h2>
            {detailsHidden ? (
              <p className="mt-2 text-sm leading-relaxed text-ink-2">
                The air waybill is available to the account that booked this shipment.{" "}
                <Link
                  href={`/login?next=${encodeURIComponent(`/track/${data.trackingNumber}`)}`}
                  className="font-medium text-ink underline decoration-line-2 underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            ) : (
              <button onClick={downloadAirWaybill} className={buttonClass("dark", "md", "mt-4 w-full")}>
                <Download aria-hidden strokeWidth={1.75} className="size-4" /> Download air waybill
              </button>
            )}
          </section>

          <section className="rounded-xl border border-line bg-canvas p-6">
            <p className="flex items-start gap-2 text-sm leading-relaxed text-ink-2">
              <CheckCircle2 aria-hidden strokeWidth={1.75} className="mt-0.5 size-4 shrink-0 text-ink-3" />
              The price of this shipment was fixed at booking. No release, clearance or hold fees are ever charged.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
