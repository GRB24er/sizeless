import TrackingResult from "@/components/features/tracking.result";
import TrackingForm from "@/components/tracking.form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/landing/primitives";
import { COMPANY } from "@/lib/company";
import { prisma } from "@/constants/config/db";
import { Metadata } from "next";
import { currentUser, canAccessShipment } from "@/lib/auth-guards";

export async function generateMetadata({ params }: { params: Promise<{ trackingId: string }> }): Promise<Metadata> {
  const { trackingId } = await params;
  return {
    title: trackingId ? `Track ${trackingId} | Aegis Cargo` : "Tracking Results | Aegis Cargo",
    description: "Status, route and every logged handover for an Aegis Cargo shipment.",
  };
}

async function getTrackingData(trackingNumber: string) {
  try {
    return await prisma.shipment.findUnique({
      where: { trackingNumber },
      select: {
        trackingNumber: true, estimatedDelivery: true, deliveredAt: true, isPaid: true, userId: true,
        originAddress: true, originCity: true, originState: true, originPostalCode: true, originCountry: true,
        destinationAddress: true, destinationCity: true, destinationState: true, destinationPostalCode: true, destinationCountry: true,
        serviceType: true, specialInstructions: true,
        recipient: { select: { name: true, company: true, email: true, phone: true } },
        Sender: { select: { name: true, email: true } },
        TrackingUpdates: { select: { id: true, timestamp: true, location: true, status: true, message: true }, orderBy: { timestamp: "asc" } },
        packages: { select: { height: true, width: true, length: true, packageType: true, declaredValue: true, weight: true, description: true, pieces: true, dangerous: true, insurance: true } },
        createdAt: true,
      },
    });
  } catch (error) {
    console.error("Database query error:", error);
    return null;
  }
}

const ERRORS = {
  "not-found": {
    title: "We can't find that shipment",
    description: "Check the number against your booking confirmation email. Tracking numbers start with LOX- followed by eight letters and digits.",
  },
  error: {
    title: "Tracking is unavailable right now",
    description: "Something went wrong on our side while looking up this shipment. Please try again in a few minutes.",
  },
  missing: {
    title: "Enter a tracking number",
    description: "Your tracking number is in your booking confirmation email.",
  },
} as const;

function TrackingError({ trackingNumber, type }: { trackingNumber?: string; type: keyof typeof ERRORS }) {
  const { title, description } = ERRORS[type];
  return (
    <div className="bg-canvas pb-20 pt-[calc(var(--header-h)+2.5rem)] sm:pt-[calc(var(--header-h)+4rem)]">
      <Container className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          {trackingNumber && <p className="figures text-[15px] text-ink-3">{trackingNumber}</p>}
          <h1 className="type-display mt-2 text-balance text-[2.2rem] font-semibold leading-[1.05] text-ink sm:text-[2.75rem]">{title}</h1>
          <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-ink-2">{description}</p>
          <div className="mt-8 max-w-xl rounded-xl border border-line bg-surface p-5 sm:p-6">
            <TrackingForm help={null} />
          </div>
        </div>
        <aside className="lg:col-span-4 lg:col-start-9 lg:pt-10">
          <h2 className="text-[15px] font-semibold text-ink">Still can&apos;t find it?</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
            Write to{" "}
            <a href={`mailto:${COMPANY.email}`} className="font-medium text-ink underline decoration-line-2 underline-offset-4">
              {COMPANY.email}
            </a>{" "}
            with the number and we&apos;ll look it up. We never ask for payment to release a shipment.
          </p>
          <Link href="/contact" className="mt-4 inline-block text-[15px] font-medium text-ink underline decoration-line-2 underline-offset-4">
            Contact us
          </Link>
        </aside>
      </Container>
    </div>
  );
}

export default async function TrackingResultsPage({ params }: { params: Promise<{ trackingId: string }> }) {
  const { trackingId } = await params;
  if (!trackingId) return <TrackingError type="missing" />;

  const sanitizedTrackingNumber = trackingId.trim().toUpperCase();
  const trackingData = await getTrackingData(sanitizedTrackingNumber);
  if (!trackingData) return <TrackingError type="not-found" trackingNumber={sanitizedTrackingNumber} />;

  // Anyone with the tracking number sees status and route. Contact details,
  // street addresses and declared values go only to the sender and admins.
  const viewer = await currentUser();
  const detailsHidden = !viewer || !canAccessShipment(viewer, trackingData);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { userId: _owner, ...shipment } = trackingData;
  const data = detailsHidden
    ? {
        ...shipment,
        originAddress: "",
        originPostalCode: "",
        destinationAddress: "",
        destinationPostalCode: "",
        specialInstructions: null,
        recipient: { ...shipment.recipient, email: null, phone: "" },
        Sender: shipment.Sender ? { ...shipment.Sender, email: null } : null,
        packages: shipment.packages.map((p) => ({ ...p, declaredValue: null })),
      }
    : shipment;

  try {
    return (
      <div className="bg-canvas pb-20 pt-[calc(var(--header-h)+1.5rem)] sm:pt-[calc(var(--header-h)+2.5rem)]">
        <Container>
          <Link
            href="/track"
            className="group mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink print:hidden"
          >
            <ArrowLeft aria-hidden strokeWidth={1.75} className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Track another shipment
          </Link>
          <TrackingResult data={data} detailsHidden={detailsHidden} />
        </Container>
      </div>
    );
  } catch (error) {
    console.error("Error rendering tracking result:", error);
    return <TrackingError type="error" trackingNumber={sanitizedTrackingNumber} />;
  }
}
