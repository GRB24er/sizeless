import type { Metadata } from "next";
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import TrackingForm from "@/components/tracking.form";
import { PageHero } from "@/components/landing/page-hero";
import { Container, SectionHeading } from "@/components/landing/primitives";
import { Faq, FaqItem } from "@/components/landing/faq";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Track a Shipment | Aegis Cargo",
  description: "Track an Aegis Cargo shipment by tracking number: status, route and every logged handover.",
};

const PUBLIC_VIEW = ["Current status and estimated delivery", "Every logged handover, with time and location", "Origin and destination city and country", "Service level and package count"];
const SENDER_VIEW = ["Street addresses for both ends", "Sender and recipient contact details", "Declared values", "Air waybill download"];

// Illustrative record — shows the layout of a tracking page, not a real shipment.
const EXAMPLE_EVENTS = [
  { status: "Arrived at facility", place: "Destination vault, Zurich", time: "Thu 14:20" },
  { status: "Departed facility", place: "Origin hub, London", time: "Wed 09:05" },
  { status: "Picked up", place: "Sender premises, London", time: "Tue 16:40" },
  { status: "Booked · price fixed", place: "Online booking", time: "Tue 10:12" },
];

const TRACKING_FAQ: FaqItem[] = [
  {
    q: "Where do I find my tracking number?",
    a: (
      <>
        It&apos;s in your booking confirmation email and in{" "}
        <Link href="/shipments/history" className="font-medium text-navy underline underline-offset-4">My Shipments</Link>. Tracking numbers start with LOX-.
      </>
    ),
  },
  {
    q: "Why can't I see addresses or the declared value?",
    a: "To protect the sender and recipient, those details are only shown to the account that booked the shipment. Sign in with that account to see them.",
  },
  {
    q: "How often is tracking updated?",
    a: "A new entry is logged each time the shipment is picked up, departs or arrives at a facility. The sender and recipient receive an email with each update.",
  },
  {
    q: "My shipment shows “On hold”. Do I need to pay anything?",
    a: (
      <>
        No. Holds happen for operational reasons, such as a documentation or address check. We never ask for a payment to release a shipment — the price was fixed at booking. If anyone asks you to pay, don&apos;t, and write to{" "}
        <a href={`mailto:${COMPANY.email}`} className="font-medium text-navy underline underline-offset-4">{COMPANY.email}</a>.
      </>
    ),
  },
  {
    q: "Can I download the air waybill?",
    a: "Yes. When you're signed in with the account that booked the shipment, open its tracking page and use the Documents tab.",
  },
];

export default function TrackingPage() {
  return (
    <>
      <PageHero
        eyebrow="Tracking"
        title={<>Track a shipment</>}
        intro="Enter your tracking number to see the status, the route and every logged handover."
        image="/images/box.jpeg"
      >
        <div className="mt-10 max-w-xl">
          <TrackingForm variant="dark" />
          <p className="mt-3 text-sm text-slate-400">Your tracking number is in your booking confirmation email.</p>
        </div>
      </PageHero>

      <section className="bg-ivory py-20 sm:py-24">
        <Container className="grid items-start gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="What you'll see"
              title={<>Open about progress, <em className="font-normal text-gold-deep">private about people.</em></>}
              intro="Anyone with the tracking number can follow the shipment. Personal details stay with the account that booked it."
            />
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">With a tracking number</p>
                <ul className="mt-4 space-y-3 text-[15px] text-slate-700">
                  {PUBLIC_VIEW.map((t) => (
                    <li key={t} className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Signed in as the sender, also</p>
                <ul className="mt-4 space-y-3 text-[15px] text-slate-700">
                  {SENDER_VIEW.map((t) => (
                    <li key={t} className="flex items-start gap-2.5"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-navy-soft" />{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <figure className="rounded-2xl border border-ink/10 bg-white p-6 shadow-xl shadow-ink/5 sm:p-8">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-deep">Example tracking record</p>
                <p className="mt-1 font-mono text-sm text-slate-500">LOX-XXXXXXXX</p>
              </div>
              <span className="rounded-full bg-navy px-3 py-1 text-xs font-medium text-white">In transit</span>
            </div>
            <ol className="relative mt-6 space-y-6 border-l border-ink/15 pl-6">
              {EXAMPLE_EVENTS.map((e, i) => (
                <li key={e.status} className="relative">
                  <span className={`absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 ${i === 0 ? "border-gold-deep bg-gold" : "border-ink/20 bg-white"}`} />
                  <div className="flex items-baseline justify-between gap-4">
                    <p className={`text-[15px] ${i === 0 ? "font-semibold text-ink" : "text-slate-700"}`}>{e.status}</p>
                    <p className="shrink-0 text-xs tabular-nums text-slate-400">{e.time}</p>
                  </div>
                  <p className="text-sm text-slate-500">{e.place}</p>
                </li>
              ))}
            </ol>
            <figcaption className="mt-6 border-t border-ink/10 pt-4 text-xs text-slate-400">
              Illustration of the tracking page layout. Your own shipment shows its real entries.
            </figcaption>
          </figure>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Help" title="Tracking questions" />
          </div>
          <div className="lg:col-span-8">
            <Faq items={TRACKING_FAQ} />
          </div>
        </Container>
      </section>
    </>
  );
}
