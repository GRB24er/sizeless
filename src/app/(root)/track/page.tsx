import type { Metadata } from "next";
import { Check, Lock } from "lucide-react";
import TrackingForm from "@/components/tracking.form";
import { PageHero } from "@/components/landing/page-hero";
import { Container, SectionHeading } from "@/components/landing/primitives";
import { Reveal } from "@/components/landing/reveal";
import { HomeFaq } from "@/components/landing/home";
import { TRACKING_FAQ } from "@/components/landing/faqs";

export const metadata: Metadata = {
  title: "Track a Shipment | Aegis Cargo",
  description: "Track an Aegis Cargo shipment by tracking number: status, route and every logged handover.",
};

const PUBLIC_VIEW = ["Current status and estimated delivery", "Every logged handover, with time and location", "Origin and destination city and country", "Service level and package count"];
const SENDER_VIEW = ["Street addresses for both ends", "Sender and recipient contact details", "Declared values", "Air waybill download"];

// Illustrative record: shows the layout of a tracking page, not a real shipment.
const EXAMPLE_EVENTS = [
  { status: "Arrived at facility", place: "Destination vault, Zurich", time: "Thu 14:20" },
  { status: "Departed facility", place: "Origin hub, London", time: "Wed 09:05" },
  { status: "Picked up", place: "Sender premises, London", time: "Tue 16:40" },
  { status: "Booked, price fixed", place: "Online booking", time: "Tue 10:12" },
];

function ExampleRecord() {
  return (
    <figure className="rounded-xl border border-line bg-surface p-6 shadow-[0_24px_60px_-36px_rgba(15,29,47,0.45)] sm:p-7">
      <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="text-[13px] text-ink-3">Example tracking record</p>
          <p className="figures mt-1 text-[15px] text-ink">LOX-XXXXXXXX</p>
        </div>
        <span className="rounded-md bg-navy px-2.5 py-1 text-[13px] font-medium text-white">In transit</span>
      </div>
      <ol className="relative mt-6 space-y-5 pl-7">
        <span aria-hidden className="absolute bottom-2 left-[5px] top-2 w-px bg-line-2" />
        {EXAMPLE_EVENTS.map((e, i) => (
          <li key={e.status} className="relative">
            <span
              aria-hidden
              className={`absolute -left-7 top-[5px] block size-[11px] rounded-[3px] border-2 ${i === 0 ? "border-signal bg-signal" : "border-line-2 bg-surface"}`}
            />
            <div className="flex items-baseline justify-between gap-4">
              <p className={`text-[15px] ${i === 0 ? "font-semibold text-ink" : "text-ink-2"}`}>{e.status}</p>
              <p className="figures shrink-0 text-[13px] text-ink-3">{e.time}</p>
            </div>
            <p className="text-sm text-ink-3">{e.place}</p>
          </li>
        ))}
      </ol>
      <figcaption className="mt-6 border-t border-line pt-4 text-[13px] text-ink-3">
        An illustration of the layout. Your own shipment shows its real entries.
      </figcaption>
    </figure>
  );
}

export default function TrackingPage() {
  return (
    <>
      <PageHero
        title="Track a shipment"
        intro="Enter your tracking number to see the status, the route and every logged handover."
        aside={<ExampleRecord />}
      >
        <div className="mt-8 max-w-xl rounded-xl border border-line bg-surface p-5 sm:p-6">
          <TrackingForm />
        </div>
      </PageHero>

      <section className="border-t border-line bg-surface py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHeading
              title="Open about progress, private about people"
              intro="Anyone with the tracking number can follow the shipment. Personal details stay with the account that booked it."
            />
          </Reveal>
          <Reveal delay={80} className="mt-12 grid gap-10 sm:grid-cols-2 lg:max-w-4xl">
            <div>
              <h3 className="border-b border-ink/80 pb-2.5 text-[15px] font-semibold text-ink">With a tracking number</h3>
              <ul className="mt-4 space-y-3 text-[15px] text-ink-2">
                {PUBLIC_VIEW.map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <Check aria-hidden strokeWidth={1.75} className="mt-0.5 size-4 shrink-0 text-signal-ink" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="border-b border-ink/80 pb-2.5 text-[15px] font-semibold text-ink">Signed in as the sender, also</h3>
              <ul className="mt-4 space-y-3 text-[15px] text-ink-2">
                {SENDER_VIEW.map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <Lock aria-hidden strokeWidth={1.75} className="mt-0.5 size-4 shrink-0 text-ink-3" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Container>
      </section>

      <HomeFaq title="Tracking questions" items={TRACKING_FAQ} />
    </>
  );
}
