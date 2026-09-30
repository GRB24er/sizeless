import type { Metadata } from "next";
import { STORAGE_TYPE_CONFIG, MIN_MONTHLY_STORAGE_FEE, VAULT_PUBLISHED_FEES } from "@/lib/vault/types";
import { PageHero } from "@/components/landing/page-hero";
import { Container, SectionHeading, ButtonLink, Amount, usd, usdCents } from "@/components/landing/primitives";
import { Reveal } from "@/components/landing/reveal";
import { VaultEstimate } from "@/components/landing/task-panel";
import { HomeFaq, ClosingCta } from "@/components/landing/home";
import { VAULT_FAQ } from "@/components/landing/faqs";

export const metadata: Metadata = {
  title: "Vault Custody | Aegis Cargo",
  description: "Precious-metals storage with a published fee schedule, documented intake and online access to your holdings.",
};

const STEPS = [
  { title: "Open an account", text: "Register online in a few minutes." },
  { title: "Identity checks", text: "Submit ID, proof of address and the source of your metal for review." },
  { title: "Deposit request", text: "Describe your metal and accept the published fee schedule." },
  { title: "Intake and assay", text: "We weigh, test and record serial numbers when the metal arrives." },
  { title: "In storage", text: "A custody reference is issued and your account shows the deposit as in storage." },
  { title: "Release", text: "Request collection, sale or transfer from your account at any time." },
];

const FEE_GROUPS = Array.from(new Set(VAULT_PUBLISHED_FEES.map((f) => f.group)));

export default function VaultPage() {
  return (
    <>
      <PageHero
        title="Precious-metals custody, with every fee in writing."
        intro="Store gold, silver, platinum and palladium with documented intake, a published fee schedule and online access to your holdings."
        image="/images/gold.jpeg"
        imageAlt="One-kilogram fine gold bars and gold bullion coins"
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/register" arrow>
            Open an account
          </ButtonLink>
          <ButtonLink href="#fees" variant="outline">
            See the fee schedule
          </ButtonLink>
        </div>
      </PageHero>

      {/* Storage types and estimate */}
      <section className="border-t border-line bg-surface py-20 sm:py-28">
        <Container className="grid items-start gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <Reveal>
              <SectionHeading
                title="Choose how your metal is held"
                intro={`Storage is charged monthly per kilogram, with a minimum of ${usd(MIN_MONTHLY_STORAGE_FEE)} per deposit.`}
              />
            </Reveal>
            <Reveal delay={80} as="dl" className="mt-10 border-t border-line">
              {Object.entries(STORAGE_TYPE_CONFIG).map(([key, s]) => (
                <div key={key} className="grid gap-x-8 gap-y-2 border-b border-line py-6 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <dt>
                    <span className="text-[17px] font-semibold text-ink">{s.label}</span>
                    <span className="mt-1.5 block max-w-[52ch] text-[15px] leading-relaxed text-ink-2">{s.description}</span>
                  </dt>
                  <dd className="sm:text-right">
                    <span className="figures text-xl text-ink">{usdCents(s.monthlyRatePerKg)}</span>
                    <span className="block text-[13px] text-ink-3">per kg a month</span>
                  </dd>
                </div>
              ))}
            </Reveal>
          </div>

          <Reveal delay={120} className="lg:sticky lg:top-24 lg:col-span-5 lg:col-start-8">
            <div className="rounded-xl border border-line bg-surface p-5 shadow-[0_24px_60px_-36px_rgba(15,29,47,0.45)] sm:p-7">
              <h2 className="type-display text-xl font-semibold text-ink">Estimate monthly storage</h2>
              <p className="mt-1 text-sm text-ink-3">Uses the same rates as the deposit form.</p>
              <div className="mt-6">
                <VaultEstimate />
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Process */}
      <section className="bg-navy py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHeading tone="dark" title="From account to release, every step recorded" />
          </Reveal>
          <Reveal delay={80} as="ol" className="mt-12 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.title} className="flex gap-4 border-t border-white/15 py-7">
                <span aria-hidden className="mt-[7px] block size-[11px] shrink-0 rounded-[3px] border-2 border-signal" />
                <div>
                  <h3 className="text-[17px] font-semibold text-white">{s.title}</h3>
                  <p className="mt-1.5 max-w-[38ch] text-[15px] leading-relaxed text-[#B7C3D1]">{s.text}</p>
                </div>
              </li>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* Fee schedule */}
      <section id="fees" className="scroll-mt-20 bg-canvas py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHeading
              title="The complete fee schedule"
              intro="These are the only fees we charge for vault custody. You see and accept this schedule on the deposit form, and every invoice is generated from it."
            />
          </Reveal>
          <Reveal delay={80} className="mt-12 gap-x-12 md:columns-2">
            {FEE_GROUPS.map((group) => (
              <div key={group} className="mb-10 break-inside-avoid">
                <h3 className="border-b border-ink/80 pb-2.5 text-[15px] font-semibold text-ink">{group}</h3>
                <dl className="divide-y divide-line">
                  {VAULT_PUBLISHED_FEES.filter((f) => f.group === group).map((f) => (
                    <div key={f.label} className="flex items-baseline justify-between gap-6 py-3.5 text-[15px]">
                      <dt className="text-ink-2">{f.label}</dt>
                      <dd className="shrink-0 text-right">
                        <Amount text={f.price} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </Reveal>
        </Container>
      </section>

      <HomeFaq title="About vault custody" items={VAULT_FAQ} />
      <ClosingCta />
    </>
  );
}
