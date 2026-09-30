import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import TrackingForm from "@/components/tracking.form";
import { SHIPPING_OPTIONS, FEE_SCHEDULE } from "@/app/(root)/shipments/create/type";
import { STORAGE_TYPE_CONFIG, MIN_MONTHLY_STORAGE_FEE } from "@/lib/vault/types";
import { Container, Eyebrow, SectionHeading, usd } from "./primitives";
import { ExampleQuoteCard } from "./example-quote";
import { Faq, FaqItem } from "./faq";

// ─── HERO ────────────────────────────────────────────────────────────────

export function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy pt-32 pb-20 sm:pt-36 lg:pb-28">
      <Image
        src="/images/port.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-[70%_center] opacity-40"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-navy to-transparent" />

      <Container className="grid items-center gap-14 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Eyebrow tone="dark">Secure shipping · Precious-metals custody</Eyebrow>
          <h1 className="mt-6 font-display text-[2.6rem] font-medium leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-[4.1rem]">
            Secure shipping and custody,{" "}
            <em className="font-normal text-gold">priced before you commit.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
            Insured transport for gold, documents and high-value goods, with vault storage alongside.
            Every charge is itemized before you book, and every handover is logged.
          </p>

          <div className="mt-10 max-w-xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Track a shipment</p>
            <TrackingForm variant="dark" />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
            <Link href="/shipments/create" className="group inline-flex items-center gap-2 font-semibold text-white">
              Get an itemized price
              <ArrowRight className="h-4 w-4 text-gold transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/vault" className="group inline-flex items-center gap-2 text-slate-300 hover:text-white">
              Vault services
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 lg:pl-6">
          <ExampleQuoteCard />
        </div>
      </Container>
    </section>
  );
}

// ─── COMMITMENTS ─────────────────────────────────────────────────────────

const COMMITMENTS = [
  {
    n: "I",
    title: "Fixed at booking",
    text: "Your total comes from our published rate card and is locked when you book. We never add hold, release or clearance fees.",
  },
  {
    n: "II",
    title: "Every handover logged",
    text: "Pickups, departures and arrivals are recorded with time and location, and each update is emailed to you.",
  },
  {
    n: "III",
    title: "Your details stay private",
    text: "A tracking number shows status and route only. Addresses, contacts and declared values are shown to you alone.",
  },
  {
    n: "IV",
    title: "Vault fees on the table",
    text: "Storage, intake, assay, insurance and release fees are listed on the deposit form before you submit.",
  },
];

export function Commitments() {
  return (
    <section className="bg-ivory py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Our commitments"
          title={<>Four promises, <em className="font-normal text-gold-deep">built into the software</em> — not just the brochure.</>}
        />
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2 lg:grid-cols-4">
          {COMMITMENTS.map((c) => (
            <div key={c.n} className="bg-ivory p-7 transition-colors hover:bg-white">
              <p className="font-display text-3xl text-gold-deep">{c.n}</p>
              <h3 className="mt-5 text-base font-semibold text-ink">{c.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{c.text}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ─── SERVICE TIERS ───────────────────────────────────────────────────────

const LEVEL_BARS: Record<string, number> = { Maximum: 4, High: 3, Standard: 2, Basic: 1 };

export function ServiceTiers({ compact = false }: { compact?: boolean }) {
  return (
    <section className="bg-white py-20 sm:py-24">
      <Container>
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeading
            eyebrow="Secure transport"
            title="Four levels of security, one transparent rate card."
            intro="These are the same rates the booking page uses to price your shipment. Choose the level your consignment needs."
          />
          {compact && (
            <Link href="/services" className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-navy">
              Full rate card <ArrowUpRight className="h-4 w-4 text-gold-deep" />
            </Link>
          )}
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {SHIPPING_OPTIONS.map((o) => {
            const bars = LEVEL_BARS[o.securityLevel] ?? 1;
            return (
              <article
                key={o.id}
                className="group flex flex-col rounded-2xl border border-ink/10 bg-ivory/60 p-6 transition-all hover:-translate-y-0.5 hover:border-gold-deep/40 hover:bg-white hover:shadow-xl hover:shadow-ink/5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{o.securityLevel} security</p>
                  <div className="flex gap-1" aria-hidden>
                    {[1, 2, 3, 4].map((i) => (
                      <span key={i} className={`h-3 w-1.5 rounded-sm ${i <= bars ? "bg-gold-deep" : "bg-ink/10"}`} />
                    ))}
                  </div>
                </div>
                <h3 className="mt-4 font-display text-2xl leading-tight text-ink">{o.label}</h3>
                <p className="mt-1 text-sm text-slate-500">{o.transitDays}</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">{o.description}</p>
                <dl className="mt-6 space-y-2 border-t border-ink/10 pt-5 text-sm">
                  <div className="flex justify-between"><dt className="text-slate-500">Base freight</dt><dd className="font-medium tabular-nums text-ink">{usd(o.price)}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Per kilogram</dt><dd className="font-medium tabular-nums text-ink">{usd(o.perKgRate)}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Insurance (optional)</dt><dd className="font-medium tabular-nums text-ink">{o.insuranceRate}%</dd></div>
                </dl>
                <Link
                  href="/shipments/create"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-navy/15 py-2.5 text-sm font-semibold text-navy transition-colors group-hover:border-navy group-hover:bg-navy group-hover:text-white"
                >
                  Price a shipment <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Every quote also itemizes vault handling ({usd(FEE_SCHEDULE.vaultHandlingFee)}), tamper-evident seals ({usd(FEE_SCHEDULE.tamperSealFee)} per package),
          export permit ({usd(FEE_SCHEDULE.exportPermitFee)}), customs brokerage ({usd(FEE_SCHEDULE.customsBrokerageFee)}) and estimated import duty
          ({FEE_SCHEDULE.customsDutyRate * 100}% of declared value).
        </p>
      </Container>
    </section>
  );
}

// ─── HOW IT WORKS ────────────────────────────────────────────────────────

const STEPS = [
  { n: "01", title: "Quote", text: "Enter your packages and route. The price is built line by line from the rate card as you type." },
  { n: "02", title: "Accept & book", text: "Review the itemized total and accept it. That total is fixed, stored with your shipment and emailed to you." },
  { n: "03", title: "Handover log", text: "Each pickup, departure and arrival is logged with time and location on your tracking page." },
  { n: "04", title: "Delivered", text: "Delivery is recorded and your receipt shows exactly what you agreed to pay — nothing more." },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden bg-navy py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "28px 28px" }} />
      <Container className="relative">
        <SectionHeading tone="dark" eyebrow="How it works" title="From quote to delivery, with nothing added along the way." />
        <ol className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((s, i) => (
            <li key={s.n} className="relative">
              {i < STEPS.length - 1 && (
                <span className="absolute left-14 right-0 top-5 hidden h-px bg-gradient-to-r from-gold/50 to-gold/0 lg:block" aria-hidden />
              )}
              <p className="font-display text-4xl text-gold">{s.n}</p>
              <h3 className="mt-5 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-300">{s.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

// ─── VAULT ───────────────────────────────────────────────────────────────

const STORAGE_SUMMARY: Record<string, string> = {
  ALLOCATED: "Specific bars assigned to you, serials recorded",
  SEGREGATED: "Held apart from other clients' metal",
  UNALLOCATED: "A claim on pooled metal, lowest cost",
};

export function VaultTeaser() {
  return (
    <section className="bg-ivory py-20 sm:py-24">
      <Container className="grid items-center gap-14 lg:grid-cols-2">
        <div className="relative">
          <div className="absolute -inset-3 rounded-[1.75rem] border border-gold-deep/25" aria-hidden />
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image src="/images/gold.jpeg" alt="Gold bars and coins" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
          </div>
        </div>

        <div>
          <SectionHeading
            eyebrow="Vault custody"
            title={<>Precious-metals storage, <em className="font-normal text-gold-deep">with the fees on the table.</em></>}
            intro="Open an account, pass identity checks, and submit a deposit request with the full fee schedule in front of you. Each deposit is weighed, assayed and recorded at intake."
          />
          <div className="mt-8 divide-y divide-ink/10 border-y border-ink/10">
            {Object.entries(STORAGE_TYPE_CONFIG).map(([key, s]) => (
              <div key={key} className="flex items-baseline justify-between gap-6 py-4">
                <div>
                  <p className="font-semibold text-ink">{s.label}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{STORAGE_SUMMARY[key] ?? s.description}</p>
                </div>
                <p className="shrink-0 text-right">
                  <span className="font-display text-xl tabular-nums text-ink">{usd(s.monthlyRatePerKg)}</span>
                  <span className="block text-xs text-slate-500">per kg / month</span>
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Minimum {usd(MIN_MONTHLY_STORAGE_FEE)} per month per deposit.</p>
          <ul className="mt-8 grid gap-3 text-[15px] text-slate-700 sm:grid-cols-2">
            {["Identity and source-of-funds checks", "Weight, purity and serials recorded", "Optional insurance, named insurer", "Holdings visible in your account"].map((t) => (
              <li key={t} className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />{t}</li>
            ))}
          </ul>
          <Link href="/vault" className="mt-10 inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-soft">
            Explore vault services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────

export const PRICING_FAQ: FaqItem[] = [
  {
    q: "Can the price change after I book?",
    a: "No. When you book, we recalculate the total from the rate card and check it matches the one you accepted, then store it with your shipment. We don't add hold, release, clearance or any other charges afterwards.",
  },
  {
    q: "What's included in the quote?",
    a: "Base freight, a per-kilogram rate, security escort where the service includes one, vault handling, tamper-evident seals, export permit, customs brokerage, estimated import duty and — if you choose it — insurance. Each appears as its own line before you accept.",
  },
  {
    q: "How is import duty handled?",
    a: `Estimated import duty (${FEE_SCHEDULE.customsDutyRate * 100}% of declared value) is a line in your quote, so we never collect duty from you or your recipient after booking.`,
  },
  {
    q: "Who can see my shipment details?",
    a: "Anyone with the tracking number can see the status and the route. Street addresses, contact details and declared values are shown only to the account that booked the shipment.",
  },
  {
    q: "What if someone asks me to pay to release a shipment?",
    a: (
      <>
        Don&apos;t pay. We never ask for release, clearance or hold fees after booking. Please forward the message to{" "}
        <a href="mailto:admin@aegiscargo.org" className="font-medium text-navy underline underline-offset-4">admin@aegiscargo.org</a>.
      </>
    ),
  },
  {
    q: "How do vault fees work?",
    a: "Storage is charged monthly per kilogram at the published rate for your storage type. Intake, assay, insurance and release fees are listed on the deposit form before you submit, and invoices are generated only from that list.",
  },
];

export function HomeFaq() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <Container className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading eyebrow="Questions" title="Straight answers about price and privacy." />
          <p className="mt-6 text-sm text-slate-500">
            Something else? <Link href="/contact" className="font-semibold text-navy underline underline-offset-4">Contact us</Link>.
          </p>
        </div>
        <div className="lg:col-span-8">
          <Faq items={PRICING_FAQ} />
        </div>
      </Container>
    </section>
  );
}

// ─── CLOSING CTA ─────────────────────────────────────────────────────────

export function ClosingCta() {
  return (
    <section className="bg-white pb-20 sm:pb-24">
      <Container>
        <div className="relative isolate overflow-hidden rounded-3xl bg-navy px-6 py-16 sm:px-12 sm:py-20">
          <Image src="/images/box.jpeg" alt="" fill sizes="(min-width: 1152px) 1152px, 100vw" className="-z-20 object-cover opacity-25" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/90 to-navy/50" />
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-medium leading-tight text-white sm:text-5xl">
              Know the full price <em className="font-normal text-gold">before you commit.</em>
            </h2>
            <p className="mt-5 text-lg text-slate-300">Build an itemized quote in your account. Nothing is booked until you accept the total.</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/shipments/create" className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-[#d8b566]">
                Get an itemized price <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
