import type { Metadata } from "next";
import { X } from "lucide-react";
import { SHIPPING_OPTIONS, FEE_SCHEDULE } from "@/app/(root)/shipments/create/type";
import { PageHero } from "@/components/landing/page-hero";
import { Container, SectionHeading, usd } from "@/components/landing/primitives";
import { ExampleQuoteCard } from "@/components/landing/example-quote";
import { ServiceTiers, ClosingCta, PRICING_FAQ } from "@/components/landing/home";
import { Faq } from "@/components/landing/faq";

export const metadata: Metadata = {
  title: "Shipping Services & Pricing | Aegis Cargo",
  description: "Four levels of secure transport and the full rate card used to price every booking.",
};

const secureTiers = SHIPPING_OPTIONS.filter((o) => o.id === "armored_express" || o.id === "secure_freight").map((o) => o.label);

// Every line that can appear on a quote, straight from the rate card.
const RATE_CARD = [
  { item: "Base freight", amount: `${usd(Math.min(...SHIPPING_OPTIONS.map((o) => o.price)))} – ${usd(Math.max(...SHIPPING_OPTIONS.map((o) => o.price)))}`, when: "Every shipment — depends on the service level" },
  { item: "Weight rate", amount: `${usd(Math.min(...SHIPPING_OPTIONS.map((o) => o.perKgRate)))} – ${usd(Math.max(...SHIPPING_OPTIONS.map((o) => o.perKgRate)))} per kg`, when: "Every shipment — total weight × the service's rate" },
  { item: "Armed security escort", amount: usd(FEE_SCHEDULE.securitySurcharge), when: secureTiers.join(" and ") },
  { item: "Vault handling", amount: usd(FEE_SCHEDULE.vaultHandlingFee), when: "Every shipment" },
  { item: "Tamper-evident seals", amount: `${usd(FEE_SCHEDULE.tamperSealFee)} per package`, when: "Every shipment" },
  { item: "Heavy cargo surcharge", amount: `${FEE_SCHEDULE.heavyCargoRate * 100}% of declared value`, when: `Total weight over ${FEE_SCHEDULE.heavyCargoSurchargeKg} kg` },
  { item: "Export permit", amount: usd(FEE_SCHEDULE.exportPermitFee), when: "Every shipment" },
  { item: "Customs brokerage", amount: usd(FEE_SCHEDULE.customsBrokerageFee), when: "Every shipment" },
  { item: "Import duty (estimate)", amount: `${FEE_SCHEDULE.customsDutyRate * 100}% of declared value`, when: "Every shipment — collected once, at booking" },
  { item: "Insurance", amount: `${Math.min(...SHIPPING_OPTIONS.map((o) => o.insuranceRate))}% – ${Math.max(...SHIPPING_OPTIONS.map((o) => o.insuranceRate))}% of declared value`, when: `Optional — minimum premium ${usd(FEE_SCHEDULE.minInsuranceValue)}` },
];

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
        eyebrow="Shipping & pricing"
        title={<>One rate card. <em className="font-normal text-gold">Every charge in writing.</em></>}
        intro="Secure transport for gold, documents and high-value goods. The same published rates price every booking, and you see each line before you commit."
        image="/images/port.jpg"
      />

      <ServiceTiers />

      <section className="bg-ivory py-20 sm:py-24">
        <Container className="grid items-start gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionHeading
              eyebrow="Rate card"
              title="Everything that can appear on a quote."
              intro="Your quote is built from these lines only. Each one shows as its own entry before you accept the total."
            />
            <div className="mt-10 overflow-hidden rounded-2xl border border-ink/10 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-ivory-deep/60 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Charge</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="hidden px-5 py-3 font-semibold sm:table-cell">Applies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {RATE_CARD.map((r) => (
                    <tr key={r.item} className="align-top">
                      <td className="px-5 py-4 font-medium text-ink">
                        {r.item}
                        <span className="mt-1 block text-xs font-normal text-slate-500 sm:hidden">{r.when}</span>
                      </td>
                      <td className="px-5 py-4 tabular-nums text-slate-700">{r.amount}</td>
                      <td className="hidden px-5 py-4 text-slate-500 sm:table-cell">{r.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 rounded-2xl border border-ink/10 bg-white p-6 sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-deep">Never charged</p>
              <ul className="mt-4 grid gap-3 text-[15px] text-slate-700 sm:grid-cols-2">
                {NEVER_CHARGED.map((t) => (
                  <li key={t} className="flex items-start gap-2.5"><X className="mt-0.5 h-4 w-4 shrink-0 text-red-700/70" />{t}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:sticky lg:top-28 lg:col-span-5">
            <p className="mb-6 text-sm text-slate-500">A worked example, calculated from the rate card above:</p>
            <div className="rounded-3xl bg-navy p-6 sm:p-8">
              <ExampleQuoteCard />
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Questions" title="About pricing" />
          </div>
          <div className="lg:col-span-8">
            <Faq items={PRICING_FAQ} />
          </div>
        </Container>
      </section>

      <ClosingCta />
    </>
  );
}
