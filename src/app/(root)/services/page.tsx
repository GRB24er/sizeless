import type { Metadata } from "next";
import { X } from "lucide-react";
import { SHIPPING_OPTIONS, FEE_SCHEDULE, QuoteGroup } from "@/app/(root)/shipments/create/type";
import { PageHero } from "@/components/landing/page-hero";
import { Container, SectionHeading, ButtonLink, Amount, usd } from "@/components/landing/primitives";
import { Reveal } from "@/components/landing/reveal";
import { EstimatorCard } from "@/components/landing/task-panel";
import { ServiceLevels, ClosingCta, HomeFaq } from "@/components/landing/home";

export const metadata: Metadata = {
  title: "Shipping Services & Pricing | Aegis Cargo",
  description: "Four levels of secure transport and the full rate card used to price every booking.",
};

const secureTiers = SHIPPING_OPTIONS.filter((o) => o.id === "armored_express" || o.id === "secure_freight").map((o) => o.label);
const range = (values: number[], fmt: (n: number) => string) => `${fmt(Math.min(...values))} to ${fmt(Math.max(...values))}`;
const pct = (n: number) => `${n}%`;

// Every line that can appear on a quote, straight from the rate card, grouped
// the way the quote itself groups them.
const RATE_CARD: { group: QuoteGroup; item: string; amount: string; when: string }[] = [
  { group: "Freight & Handling", item: "Base freight", amount: range(SHIPPING_OPTIONS.map((o) => o.price), usd), when: "Every shipment, set by the service level" },
  { group: "Freight & Handling", item: "Weight rate", amount: `${range(SHIPPING_OPTIONS.map((o) => o.perKgRate), usd)} per kg`, when: "Every shipment: total weight times the service's rate" },
  { group: "Freight & Handling", item: "Armed security escort", amount: usd(FEE_SCHEDULE.securitySurcharge), when: secureTiers.join(" and ") },
  { group: "Freight & Handling", item: "Vault handling", amount: usd(FEE_SCHEDULE.vaultHandlingFee), when: "Every shipment" },
  { group: "Freight & Handling", item: "Tamper-evident seals", amount: `${usd(FEE_SCHEDULE.tamperSealFee)} per package`, when: "Every shipment" },
  { group: "Freight & Handling", item: "Heavy cargo surcharge", amount: `${FEE_SCHEDULE.heavyCargoRate * 100}% of declared value`, when: `Total weight over ${FEE_SCHEDULE.heavyCargoSurchargeKg} kg` },
  { group: "Customs & Compliance", item: "Export permit", amount: usd(FEE_SCHEDULE.exportPermitFee), when: "Every shipment" },
  { group: "Customs & Compliance", item: "Customs brokerage", amount: usd(FEE_SCHEDULE.customsBrokerageFee), when: "Every shipment" },
  { group: "Customs & Compliance", item: "Import duty (estimate)", amount: `${FEE_SCHEDULE.customsDutyRate * 100}% of declared value`, when: "Every shipment, collected once at booking" },
  { group: "Insurance", item: "Full-value cover", amount: `${range(SHIPPING_OPTIONS.map((o) => o.insuranceRate), pct)} of declared value`, when: `Optional, minimum premium ${usd(FEE_SCHEDULE.minInsuranceValue)}` },
];

const GROUPS = Array.from(new Set(RATE_CARD.map((r) => r.group)));

const NEVER_CHARGED = [
  "Hold, release or clearance fees after booking",
  "Duty collected from you or your recipient on arrival",
  "Any change to the total after you accept it",
  "Tracking, email updates or document downloads",
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title="One rate card. Every charge in writing."
        intro="Secure transport for gold, documents and high-value goods. The same published rates price every booking, and you see each line before you commit."
        image="/images/port.jpg"
        imageAlt="Ship-to-shore cranes loading a container ship"
        imagePosition="62% center"
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="#rate-card" arrow>
            See the rate card
          </ButtonLink>
          <ButtonLink href="/shipments/create" variant="outline">
            Book a shipment
          </ButtonLink>
        </div>
      </PageHero>

      <ServiceLevels showRateCardLink={false} />

      <section id="rate-card" className="scroll-mt-20 border-t border-line bg-surface py-20 sm:py-28">
        <Container className="grid items-start gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal>
              <SectionHeading
                title="Everything that can appear on a quote"
                intro="Your quote is built from these lines only. Each one shows as its own entry before you accept the total."
              />
            </Reveal>

            <Reveal delay={80} className="mt-10 space-y-10">
              {GROUPS.map((group) => (
                <div key={group}>
                  <h3 className="border-b border-ink/80 pb-2.5 text-[15px] font-semibold text-ink">{group}</h3>
                  <dl className="divide-y divide-line">
                    {RATE_CARD.filter((r) => r.group === group).map((r) => (
                      <div key={r.item} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-8">
                        <dt>
                          <span className="font-medium text-ink">{r.item}</span>
                          <span className="mt-0.5 block text-[13px] text-ink-3">{r.when}</span>
                        </dt>
                        <dd className="text-[15px] sm:text-right">
                          <Amount text={r.amount} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </Reveal>

            <Reveal delay={120} className="mt-12 rounded-xl border border-line bg-canvas p-6 sm:p-7">
              <h3 className="text-[15px] font-semibold text-ink">Never charged</h3>
              <ul className="mt-4 grid gap-3 text-[15px] text-ink-2 sm:grid-cols-2">
                {NEVER_CHARGED.map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <X aria-hidden strokeWidth={1.75} className="mt-0.5 size-4 shrink-0 text-signal-ink" />
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <div className="lg:sticky lg:top-24 lg:col-span-5">
            <Reveal delay={100}>
              <EstimatorCard />
            </Reveal>
          </div>
        </Container>
      </section>

      <HomeFaq title="About pricing" />
      <ClosingCta />
    </>
  );
}
