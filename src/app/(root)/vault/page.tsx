import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { STORAGE_TYPE_CONFIG, MIN_MONTHLY_STORAGE_FEE, VAULT_PUBLISHED_FEES } from "@/lib/vault/types";
import { PageHero } from "@/components/landing/page-hero";
import { Container, SectionHeading, usd } from "@/components/landing/primitives";
import { Faq, FaqItem } from "@/components/landing/faq";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Vault Custody | Aegis Cargo",
  description: "Precious-metals storage with a published fee schedule, documented intake and online access to your holdings.",
};

const STEPS = [
  { title: "Open an account", text: "Register online in a few minutes." },
  { title: "Identity checks", text: "Submit ID, proof of address and the source of your metal for review." },
  { title: "Deposit request", text: "Describe your metal and accept the published fee schedule." },
  { title: "Intake & assay", text: "We weigh, test and record serial numbers when the metal arrives." },
  { title: "In storage", text: "A custody reference is issued and your account shows the deposit as in storage." },
  { title: "Release", text: "Request collection, sale or transfer from your account at any time." },
];

const FEE_GROUPS = Array.from(new Set(VAULT_PUBLISHED_FEES.map((f) => f.group)));

const VAULT_FAQ: FaqItem[] = [
  {
    q: "Who can open a vault account?",
    a: "Anyone who passes our identity and source-of-funds checks. You'll need a government ID, a proof-of-address document and evidence of where the metal came from, such as a purchase invoice.",
  },
  {
    q: "What's the difference between allocated, segregated and unallocated storage?",
    a: (
      <ul className="space-y-2">
        {Object.values(STORAGE_TYPE_CONFIG).map((s) => (
          <li key={s.label}><span className="font-medium text-ink">{s.label}:</span> {s.description}</li>
        ))}
      </ul>
    ),
  },
  {
    q: "Is my deposit insured?",
    a: "Insurance is optional and priced from the schedule below. When cover is in place, your insurance certificate names the insurer and the policy number so you can verify it with them directly.",
  },
  {
    q: "How do I get my metal back?",
    a: "Request a release from your account: physical collection, sale through a bullion dealer, or transfer to another vault. The fee for each is in the schedule you accepted when you deposited.",
  },
  {
    q: "Will you ever ask me to pay to release my holdings?",
    a: (
      <>
        Only the release fees shown in the published schedule. We never ask for any other payment to release metal — if someone does, don&apos;t pay, and write to{" "}
        <a href={`mailto:${COMPANY.email}`} className="font-medium text-navy underline underline-offset-4">{COMPANY.email}</a>.
      </>
    ),
  },
];

export default function VaultPage() {
  return (
    <>
      <PageHero
        eyebrow="Vault custody"
        title={<>Precious-metals custody, <em className="font-normal text-gold">with the fees on the table.</em></>}
        intro="Store gold, silver, platinum and palladium with documented intake, a published fee schedule, and online access to your holdings."
        image="/images/gold.jpeg"
      >
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-[#d8b566]">
            Open an account <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#fees" className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
            See the fee schedule
          </a>
        </div>
      </PageHero>

      {/* Storage types */}
      <section className="bg-ivory py-20 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Storage"
            title="Choose how your metal is held."
            intro={`Storage is charged monthly per kilogram, with a minimum of ${usd(MIN_MONTHLY_STORAGE_FEE)} per deposit.`}
          />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {Object.entries(STORAGE_TYPE_CONFIG).map(([key, s]) => (
              <article key={key} className="flex flex-col rounded-2xl border border-ink/10 bg-white p-7">
                <h3 className="font-display text-2xl text-ink">{s.label}</h3>
                <p className="mt-4 flex-1 text-[15px] leading-relaxed text-slate-600">{s.description}</p>
                <p className="mt-8 border-t border-ink/10 pt-5">
                  <span className="font-display text-4xl tabular-nums text-ink">{usd(s.monthlyRatePerKg)}</span>
                  <span className="ml-2 text-sm text-slate-500">per kg / month</span>
                </p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* Process */}
      <section className="bg-navy py-20 sm:py-24">
        <Container>
          <SectionHeading tone="dark" eyebrow="How it works" title="From account to release, every step recorded." />
          <ol className="mt-16 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="bg-navy p-7">
                <p className="font-display text-3xl text-gold">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-300">{s.text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Fee schedule */}
      <section id="fees" className="scroll-mt-24 bg-white py-20 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading
              eyebrow="Fee schedule"
              title="The complete list."
              intro="These are the only fees we charge for vault custody. You see and accept this schedule on the deposit form, and every invoice is generated from it."
            />
          </div>
          <div className="space-y-8 lg:col-span-8">
            {FEE_GROUPS.map((group) => (
              <div key={group}>
                <h3 className="border-b border-ink/15 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-deep">{group}</h3>
                <dl className="divide-y divide-ink/10">
                  {VAULT_PUBLISHED_FEES.filter((f) => f.group === group).map((f) => (
                    <div key={f.label} className="flex items-baseline justify-between gap-6 py-3.5 text-[15px]">
                      <dt className="text-slate-700">{f.label}</dt>
                      <dd className="text-right tabular-nums text-ink">{f.price}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="bg-ivory py-20 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeading eyebrow="Questions" title="About vault custody" />
            <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-soft">
              Open an account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="lg:col-span-8">
            <Faq items={VAULT_FAQ} />
          </div>
        </Container>
      </section>
    </>
  );
}
