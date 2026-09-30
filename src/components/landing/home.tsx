import Image from "next/image";
import Link from "next/link";
import { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { EyeOff, FileText, ListChecks, Mail, MapPin, Phone, Receipt, ShieldAlert } from "lucide-react";
import { SHIPPING_OPTIONS, FEE_SCHEDULE } from "@/app/(root)/shipments/create/type";
import { STORAGE_TYPE_CONFIG, MIN_MONTHLY_STORAGE_FEE } from "@/lib/vault/types";
import { COMPANY } from "@/lib/company";
import { Container, SectionHeading, ButtonLink, TextLink, buttonClass, formatPhone, plainRange, usd, usdCents } from "./primitives";
import { Reveal } from "./reveal";
import { EstimateLink, TaskPanel } from "./task-panel";
import { Faq, FaqItem } from "./faq";
import { PRICING_FAQ } from "./faqs";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

// ─── Hero ───────────────────────────────────────────────────────────────

export function HomeHero() {
  return (
    <section className="bg-canvas pb-6 pt-[calc(var(--header-h)+2.5rem)] sm:pt-[calc(var(--header-h)+3.5rem)] lg:pb-24">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-10">
          <div className="lg:col-span-7 lg:row-start-1 lg:pt-4">
            <h1 className="animate-rise type-display text-balance text-[2.6rem] font-semibold leading-[1.03] text-ink sm:text-[3.25rem] lg:text-[4rem]">
              Secure shipping and storage for valuables.
            </h1>
            <p className="animate-rise mt-6 max-w-[36rem] text-pretty text-lg leading-relaxed text-ink-2" style={delay(90)}>
              Sealed, tracked transport and precious-metals vault custody. Every charge is itemized from our published rate
              card before you book.
            </p>
          </div>

          <div className="order-3 lg:order-none lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
            <div className="animate-unveil relative aspect-[4/3] overflow-hidden rounded-xl bg-tint sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[560px]">
              <Image
                src="/images/port.jpeg"
                alt="Container ship stacked with shipping containers"
                fill
                priority
                sizes="(min-width: 1280px) 500px, (min-width: 1024px) 40vw, 100vw"
                className="animate-settle object-cover object-[62%_center]"
              />
            </div>
          </div>

          <div className="relative z-10 order-2 lg:order-none lg:col-span-8 lg:col-start-1 lg:row-start-2 lg:-mb-8 lg:self-end">
            <div className="animate-rise" style={delay(180)}>
              <TaskPanel />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ─── Service levels ─────────────────────────────────────────────────────

/**
 * The four shipping services and their rates, as rows. Each row's "Estimate"
 * opens the estimator on the same page (the home task panel or the services
 * page estimator) with that service selected.
 */
export function ServiceLevels({ showRateCardLink = true }: { showRateCardLink?: boolean }) {
  const cols = "md:grid-cols-[minmax(0,2.5fr)_repeat(4,minmax(0,1fr))_7.5rem]";
  return (
    <section className="bg-canvas py-20 sm:py-28">
      <Container>
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            title="Four levels of transport security"
            intro="The booking page prices every shipment from these rates. Choose the level your consignment needs."
          />
          {showRateCardLink && (
            <TextLink href="/services" arrow className="shrink-0 text-[15px]">
              Full rate card
            </TextLink>
          )}
        </Reveal>

        <Reveal delay={80} className="mt-12">
          <div aria-hidden className={`hidden gap-x-6 pb-3 text-[13px] text-ink-3 md:grid ${cols}`}>
            <span>Service</span>
            <span>Transit</span>
            <span>Base freight</span>
            <span>Per kg</span>
            <span>Insurance</span>
            <span />
          </div>
          <ul className="border-b border-line">
            {SHIPPING_OPTIONS.map((o) => {
              const transit = plainRange(o.transitDays).match(/^([\d-]+)\s+(.+)$/);
              const figures = [
                { label: "Transit", value: transit ? transit[1] : plainRange(o.transitDays), unit: transit?.[2] },
                { label: "Base freight", value: usd(o.price) },
                { label: "Per kg", value: usd(o.perKgRate) },
                { label: "Insurance", value: `${o.insuranceRate}%`, unit: "of value" },
              ];
              return (
                <li key={o.id} className={`grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line py-7 md:items-baseline ${cols}`}>
                  <div className="col-span-2 md:col-span-1">
                    <h3 className="text-lg font-semibold text-ink">{o.label}</h3>
                    <p className="mt-0.5 text-[13px] font-medium text-signal-ink">{o.securityLevel} security</p>
                    <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">{o.description}</p>
                  </div>
                  {figures.map((f) => (
                    <dl key={f.label}>
                      <dt className="text-[13px] text-ink-3 md:sr-only">{f.label}</dt>
                      <dd className="mt-0.5 md:mt-0">
                        <span className="figures text-[15px] text-ink">{f.value}</span>
                        {f.unit && <span className="text-[13px] text-ink-3"> {f.unit}</span>}
                      </dd>
                    </dl>
                  ))}
                  <div className="col-span-2 md:col-span-1 md:justify-self-end">
                    <EstimateLink service={o.id} className={buttonClass("outline", "sm", "w-full md:w-auto")}>
                      Estimate
                    </EstimateLink>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 max-w-[80ch] text-sm leading-relaxed text-ink-3">
            Every quote also lists vault handling ({usd(FEE_SCHEDULE.vaultHandlingFee)}), tamper-evident seals (
            {usd(FEE_SCHEDULE.tamperSealFee)} per package), an export permit ({usd(FEE_SCHEDULE.exportPermitFee)}), customs
            brokerage ({usd(FEE_SCHEDULE.customsBrokerageFee)}) and estimated import duty ({FEE_SCHEDULE.customsDutyRate * 100}% of
            declared value). The two highest levels add an armed security escort ({usd(FEE_SCHEDULE.securitySurcharge)}).
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

// ─── After booking ──────────────────────────────────────────────────────

const STEPS = [
  { title: "Quote", text: "Enter your packages and route. The price builds line by line from the rate card." },
  { title: "Accept and book", text: "You accept the itemized total. It is stored with your shipment and emailed to you." },
  { title: "Handovers logged", text: "Each pickup, departure and arrival is recorded with the time and place, and emailed to sender and recipient." },
  { title: "Delivered", text: "Delivery is recorded. Your receipt shows the total you accepted, and nothing else." },
];

export function AfterBooking() {
  return (
    <section className="border-y border-line bg-surface py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            title="What happens after you book"
            intro="The total you accept is the total you pay. From there, every step of the journey is written down."
          />
        </Reveal>

        <Reveal delay={60} className="relative mt-12 aspect-[16/9] overflow-hidden rounded-xl bg-tint sm:aspect-[21/8]">
          <Image
            src="/images/warehouse.jpg"
            alt="Warehouse aisles with racked pallets and loading doors"
            fill
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="object-cover object-[center_55%]"
          />
        </Reveal>

        <Reveal delay={120} as="ol" className="relative mt-12 grid gap-9 pl-7 md:grid-cols-4 md:gap-8 md:pl-0">
          <span aria-hidden className="draw-y absolute bottom-2 left-[5px] top-2 w-px bg-line-2 md:hidden" />
          <span aria-hidden className="draw-x absolute left-0 right-0 top-[5px] hidden h-px bg-line-2 md:block" />
          {STEPS.map((s) => (
            <li key={s.title} className="relative">
              <span
                aria-hidden
                className="absolute -left-7 top-[3px] block size-[11px] rounded-[3px] border-2 border-signal bg-surface md:static md:top-0"
              />
              <h3 className="text-[17px] font-semibold text-ink md:mt-6">{s.title}</h3>
              <p className="mt-2 max-w-[36ch] text-[15px] leading-relaxed text-ink-2">{s.text}</p>
            </li>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}

// ─── Vault ──────────────────────────────────────────────────────────────

const STORAGE_SUMMARY: Record<string, string> = {
  ALLOCATED: "Specific bars assigned to you, serials recorded",
  SEGREGATED: "Held apart from other clients' metal",
  UNALLOCATED: "A claim on pooled metal, lowest cost",
};

export function VaultSection() {
  return (
    <section className="bg-navy py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            tone="dark"
            title="Vault custody for gold, silver, platinum and palladium"
            intro="Open an account, pass identity checks and submit a deposit request with the full fee schedule in front of you. Every deposit is weighed, tested and recorded at intake."
          />
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <Reveal className="relative min-h-[300px] overflow-hidden rounded-xl bg-navy-2 sm:min-h-[380px] lg:col-span-7 lg:row-span-2 lg:min-h-0">
            <Image
              src="/images/gold.jpeg"
              alt="One-kilogram fine gold bars and gold bullion coins"
              fill
              sizes="(min-width: 1024px) 700px, 100vw"
              className="object-cover"
            />
          </Reveal>

          <Reveal delay={80} className="rounded-xl bg-white/[0.04] p-6 ring-1 ring-white/10 sm:p-7 lg:col-span-5">
            <h3 className="text-[15px] font-semibold text-white">Storage, per kg a month</h3>
            <dl className="mt-3 divide-y divide-white/10">
              {Object.entries(STORAGE_TYPE_CONFIG).map(([key, s]) => (
                <div key={key} className="flex items-baseline justify-between gap-6 py-3.5">
                  <dt>
                    <span className="font-medium text-white">{s.label}</span>
                    <span className="mt-0.5 block text-[13px] text-[#A9B6C6]">{STORAGE_SUMMARY[key] ?? s.description}</span>
                  </dt>
                  <dd className="figures shrink-0 text-lg text-white">{usdCents(s.monthlyRatePerKg)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-[13px] text-[#A9B6C6]">Minimum {usd(MIN_MONTHLY_STORAGE_FEE)} a month per deposit.</p>
          </Reveal>

          <Reveal delay={140} className="rounded-xl bg-surface p-6 sm:p-7 lg:col-span-5">
            <h3 className="text-[15px] font-semibold text-ink">To open a vault account you&apos;ll need</h3>
            <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
              {["Government-issued photo ID", "A recent proof of address", "Evidence of where the metal came from, such as a purchase invoice"].map((t) => (
                <li key={t} className="flex gap-3">
                  <span aria-hidden className="mt-[9px] block size-1.5 shrink-0 rounded-full bg-ink-3" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <ButtonLink href="/register" arrow>
                Open an account
              </ButtonLink>
              <TextLink href="/vault" className="text-[15px]">
                Vault services and fees
              </TextLink>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

// ─── Commitments ────────────────────────────────────────────────────────

const PROMISES = [
  {
    icon: Receipt,
    title: "Fixed at booking",
    text: "Your total comes from the published rate card and is locked when you accept it. No hold, release or clearance fees are added later.",
  },
  {
    icon: ListChecks,
    title: "Every handover logged",
    text: "Pickups, departures and arrivals are recorded with the time and place, and each update is emailed to you.",
  },
  {
    icon: EyeOff,
    title: "Private by default",
    text: "A tracking number shows status and route only. Addresses, contacts and declared values are shown to the account that booked.",
  },
  {
    icon: FileText,
    title: "Vault fees in writing",
    text: "Storage, intake, assay, insurance and release fees are listed on the deposit form before you submit it.",
  },
];

export function Commitments() {
  return (
    <section className="bg-canvas py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            title="The price you accept is the price you pay"
            intro="Four commitments that apply to every booking and every vault deposit."
          />
        </Reveal>

        <Reveal delay={80} as="ul" className="mt-12 grid gap-x-12 sm:grid-cols-2">
          {PROMISES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4 border-t border-line py-7">
              <Icon aria-hidden strokeWidth={1.5} className="mt-0.5 size-6 shrink-0 text-signal-ink" />
              <div>
                <h3 className="text-[17px] font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 max-w-[46ch] text-[15px] leading-relaxed text-ink-2">{text}</p>
              </div>
            </li>
          ))}
        </Reveal>

        <Reveal delay={120} className="mt-6 flex flex-col gap-4 rounded-xl border border-signal/25 bg-signal-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex gap-4">
            <ShieldAlert aria-hidden strokeWidth={1.5} className="mt-0.5 size-6 shrink-0 text-signal-ink" />
            <div>
              <p className="font-semibold text-ink">If anyone asks you to pay to release a shipment, don&apos;t.</p>
              <p className="mt-1 max-w-[70ch] text-[15px] leading-relaxed text-ink-2">
                We never ask for release, clearance or hold fees after booking. Forward the message to {COMPANY.email} and we
                will look into it.
              </p>
            </div>
          </div>
          <a
            href={`mailto:${COMPANY.email}?subject=${encodeURIComponent("Suspicious payment request")}`}
            className={buttonClass("dark", "md", "shrink-0 self-start sm:self-center")}
          >
            Report a request
          </a>
        </Reveal>
      </Container>
    </section>
  );
}

// ─── FAQ ────────────────────────────────────────────────────────────────

export function HomeFaq({ title = "Questions about price and privacy", items = PRICING_FAQ }: { title?: string; items?: FaqItem[] }) {
  return (
    <section className="border-t border-line bg-surface py-20 sm:py-28">
      <Container className="grid gap-10 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <SectionHeading title={title} />
          <p className="mt-5 text-[15px] text-ink-2">
            Something else?{" "}
            <Link href="/contact" className="font-medium text-ink underline decoration-line-2 underline-offset-4 hover:decoration-ink">
              Contact us
            </Link>
            .
          </p>
        </Reveal>
        <Reveal delay={80} className="lg:col-span-8">
          <Faq items={items} />
        </Reveal>
      </Container>
    </section>
  );
}

// ─── Contact ────────────────────────────────────────────────────────────

/** Phone, email and office address from lib/company.ts. */
export function ContactDetails({ className }: { className?: string }) {
  return (
    <dl className={cn("grid gap-6 text-[15px]", className)}>
      {COMPANY.phone && (
        <div className="flex gap-4">
          <Phone aria-hidden strokeWidth={1.5} className="mt-0.5 size-5 shrink-0 text-ink-3" />
          <div>
            <dt className="text-[13px] text-ink-3">Phone</dt>
            <dd className="mt-0.5">
              <a href={`tel:${COMPANY.phone}`} className="font-medium tabular-nums text-ink hover:underline">
                {formatPhone(COMPANY.phone)}
              </a>
            </dd>
          </div>
        </div>
      )}
      <div className="flex gap-4">
        <Mail aria-hidden strokeWidth={1.5} className="mt-0.5 size-5 shrink-0 text-ink-3" />
        <div>
          <dt className="text-[13px] text-ink-3">Email</dt>
          <dd className="mt-0.5">
            <a href={`mailto:${COMPANY.email}`} className="font-medium text-ink hover:underline">
              {COMPANY.email}
            </a>
          </dd>
        </div>
      </div>
      <div className="flex gap-4">
        <MapPin aria-hidden strokeWidth={1.5} className="mt-0.5 size-5 shrink-0 text-ink-3" />
        <div>
          <dt className="text-[13px] text-ink-3">Office</dt>
          <dd className="mt-0.5 text-ink">
            {COMPANY.addressLines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </dd>
        </div>
      </div>
    </dl>
  );
}

export function ClosingCta() {
  return (
    <section className="bg-canvas py-20 sm:py-28">
      <Container>
        <Reveal className="grid overflow-hidden rounded-xl border border-line bg-surface lg:grid-cols-12">
          <div className="p-7 sm:p-10 lg:col-span-7 lg:p-12">
            <h2 className="type-display text-balance text-[2rem] font-semibold leading-[1.08] text-ink sm:text-[2.5rem]">
              Talk to the team before you book
            </h2>
            <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-ink-2">
              Questions about a consignment, a route or a vault deposit? Call or email, and someone from the team will get back
              to you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/shipments/create" arrow>
                Book a shipment
              </ButtonLink>
              <ButtonLink href="/contact" variant="outline">
                Contact us
              </ButtonLink>
            </div>
          </div>

          <ContactDetails className="content-center border-t border-line bg-tint/50 p-7 sm:p-10 lg:col-span-5 lg:border-l lg:border-t-0 lg:p-12" />
        </Reveal>
      </Container>
    </section>
  );
}
