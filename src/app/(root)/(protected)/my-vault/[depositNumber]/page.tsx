import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, FileText } from "lucide-react";
import { auth } from "~/auth";
import { COMPANY } from "@/lib/company";
import { getClientDeposit } from "@/lib/client-account";
import { STORAGE_TYPE_CONFIG, calculateMonthlyStorageFee } from "@/lib/vault/types";
import { VAULT_DOCUMENTS } from "@/lib/vault/client-documents";
import { cn } from "@/lib/utils";
import { AccountShell, Field, Panel, PaymentNotice } from "@/components/account/account-shell";
import { PhaseBar } from "@/components/account/vault-bits";
import {
  CLIENT_STATUS,
  INTAKE_LABELS,
  TONE_BADGE,
  TONE_TEXT,
  WITHDRAWAL_LABELS,
  activityTitle,
  assetLabel,
  humanize,
  purityText,
  readableActivity,
  statusLabel,
  statusTone,
  storageLabel,
  weightText,
} from "@/components/account/vault-format";
import { ButtonLink, usdCents } from "@/components/landing/primitives";

export const metadata: Metadata = { title: "Vault deposit | Aegis Cargo" };

const day = (d: Date | null | undefined) => (d ? format(d, "d MMMM yyyy") : null);

const INVOICE_STATUS: Record<string, { label: string; tone: keyof typeof TONE_BADGE }> = {
  SENT: { label: "Due", tone: "neutral" },
  PAID: { label: "Paid", tone: "done" },
  OVERDUE: { label: "Overdue", tone: "attention" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
};

export default async function DepositPage({ params }: { params: Promise<{ depositNumber: string }> }) {
  const { depositNumber } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?next=${encodeURIComponent(`/my-vault/${depositNumber}`)}`);

  const d = await getClientDeposit(session.user.id, decodeURIComponent(depositNumber));
  if (!d) notFound();

  const status = CLIENT_STATUS[d.status];
  const tone = statusTone(d.status);
  const documents = VAULT_DOCUMENTS.filter((doc) => doc.available(d));
  const rate = STORAGE_TYPE_CONFIG[d.storageType]?.monthlyRatePerKg;
  const monthlyStorage = calculateMonthlyStorageFee(d.weightGrams, d.storageType);
  const insured = Boolean(d.insuranceProvider && d.insurancePolicyNo);

  const milestones = [
    { label: "Deposit opened", date: d.depositDate },
    { label: "Identity checks approved", date: d.kycApprovedAt },
    { label: "Metal received", date: d.intakeCompletedAt },
    { label: "Testing completed", date: d.assayCompletedAt ?? d.verifiedAt },
    { label: "Placed in storage", date: d.storedAt ?? d.storageStartDate },
    { label: "Release requested", date: d.releaseRequestedAt },
    { label: "Release approved", date: d.releaseApprovedAt },
    { label: "Released", date: d.releasedAt },
  ].filter((m) => m.date);

  return (
    <AccountShell
      active="vault"
      title={
        <>
          {d.quantity} × {assetLabel(d.assetType)}
        </>
      }
      intro={
        <>
          Deposit <span className="figures text-ink">{d.depositNumber}</span>
          {d.custodyReferenceId && (
            <>
              , custody reference <span className="figures text-ink">{d.custodyReferenceId}</span>
            </>
          )}
        </>
      }
      actions={
        d.status === "IN_STORAGE" ? (
          <ButtonLink href="/my-vault/withdraw" variant="outline" size="sm">
            Request a release
          </ButtonLink>
        ) : undefined
      }
    >
      <Link href="/my-vault" className="group mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink">
        <ArrowLeft aria-hidden strokeWidth={1.75} className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        All deposits
      </Link>

      {/* Where it is now */}
      <section className="rounded-xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[13px] text-ink-3">Status</p>
            <p className={cn("type-display mt-1 text-[1.75rem] font-semibold leading-tight", TONE_TEXT[tone])}>{statusLabel(d.status)}</p>
            {status && <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{status.text}</p>}
            {d.status === "RELEASED" && d.releaseReason && <p className="mt-2 text-sm text-ink-3">Reason: {d.releaseReason}</p>}
          </div>
          <dl className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <dt className="text-[13px] text-ink-3">Opened</dt>
              <dd className="mt-0.5 text-ink">{day(d.depositDate)}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-3">Last update</dt>
              <dd className="mt-0.5 text-ink">{day(d.updatedAt)}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-3">Storage</dt>
              <dd className="mt-0.5 text-ink">{storageLabel(d.storageType)}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-3">{d.verifiedValue ? "Verified value" : "Declared value"}</dt>
              <dd className="figures mt-0.5 text-ink">{usdCents(d.verifiedValue ?? d.declaredValue)}</dd>
            </div>
          </dl>
        </div>
        <div className="mt-8">
          <PhaseBar status={d.status} labels />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Panel title="What you deposited">
            <dl className="divide-y divide-line">
              <Field label="Type">{assetLabel(d.assetType)}</Field>
              <Field label="Description">{d.description}</Field>
              <Field label="Items">{d.quantity}</Field>
              <Field label="Weight">{weightText(d.weightGrams)}</Field>
              <Field label="Purity">{purityText(d.purity, d.fineness)}</Field>
              <Field label="Serial numbers" mono>
                {d.serialNumbers}
              </Field>
              <Field label="Refiner">{d.refinerName}</Field>
              <Field label="Refiner's stamp">{d.refinerStamp}</Field>
              <Field label="LBMA Good Delivery bar">{d.isLBMACertified ? "Yes" : null}</Field>
              <Field label="Document">{d.documentTitle}</Field>
              <Field label="Issued by">{d.documentIssuingAuth}</Field>
              <Field label="Document number" mono>
                {d.documentSerial}
              </Field>
              <Field label="Cash">{d.cashAmount ? `${d.cashAmount.toLocaleString("en-US")} ${d.cashCurrency ?? ""}`.trim() : null}</Field>
              <Field label="Jewelry valuation" mono>
                {d.jewelryValuation ? usdCents(d.jewelryValuation) : null}
              </Field>
              <Field label="Declared value" mono>
                {usdCents(d.declaredValue)}
              </Field>
              <Field label="Verified value" mono>
                {d.verifiedValue ? usdCents(d.verifiedValue) : null}
              </Field>
            </dl>
          </Panel>

          <Panel title="Handover">
            <dl className="divide-y divide-line">
              <Field label="How it reaches us">{INTAKE_LABELS[d.intakeMethod] ?? humanize(d.intakeMethod)}</Field>
              <Field label="Appointment">{d.appointmentDate ? format(d.appointmentDate, "EEEE d MMMM yyyy, HH:mm") : null}</Field>
              <Field label="Notes">{d.appointmentNotes}</Field>
              <Field label="Received">{day(d.intakeCompletedAt) ?? "Not yet"}</Field>
            </dl>
          </Panel>

          <Panel title="Testing">
            <dl className="divide-y divide-line">
              <Field label="Assay">{humanize(d.assayStatus)}</Field>
              <Field label="Method">{d.assayMethod}</Field>
              <Field label="Result">{d.assayResult}</Field>
              <Field label="Tested on">{day(d.assayDate ?? d.assayCompletedAt)}</Field>
              <Field label="Verified weight">{d.weightVerified ? weightText(d.weightVerified) : null}</Field>
              <Field label="Difference from declared">
                {d.weightDiscrepancy ? `${d.weightDiscrepancy > 0 ? "+" : ""}${d.weightDiscrepancy} g` : null}
              </Field>
            </dl>
          </Panel>

          <Panel title="Storage">
            <dl className="divide-y divide-line">
              <Field label="Storage type">
                {storageLabel(d.storageType)}
                {rate ? <span className="text-ink-3"> ({usdCents(rate)} per kg a month)</span> : null}
              </Field>
              <Field label="Monthly storage" mono>
                {usdCents(monthlyStorage)}
              </Field>
              <Field label="Location">{d.vaultLocation}</Field>
              <Field label="Storage unit" mono>
                {d.storageUnit}
              </Field>
              <Field label="In storage since">{day(d.storedAt ?? d.storageStartDate) ?? "Not yet"}</Field>
            </dl>
          </Panel>

          <Panel title="Insurance">
            {insured ? (
              <>
                <dl className="divide-y divide-line">
                  <Field label="Insurer">{d.insuranceProvider}</Field>
                  <Field label="Policy number" mono>
                    {d.insurancePolicyNo}
                  </Field>
                  <Field label="Cover">{d.insuranceCoverage}</Field>
                  <Field label="Insured value" mono>
                    {d.insuredValue ? usdCents(d.insuredValue) : null}
                  </Field>
                  <Field label="Expires">{day(d.insuranceExpiryDate)}</Field>
                </dl>
                <p className="mt-4 text-sm text-ink-3">You can confirm this policy directly with the insurer using the policy number.</p>
              </>
            ) : (
              <p className="text-[15px] text-ink-2">
                This deposit isn&apos;t insured. Cover is optional and priced from the published schedule. Contact us if you&apos;d like to add it.
              </p>
            )}
          </Panel>

          {(d.withdrawals.length > 0 || d.transfers.length > 0) && (
            <Panel title="Releases and transfers">
              <ul className="divide-y divide-line">
                {d.withdrawals.map((w) => (
                  <li key={w.id} className="py-4 first:pt-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="font-medium text-ink">{WITHDRAWAL_LABELS[w.type] ?? humanize(w.type)}</p>
                      <span className={cn("rounded-md px-2 py-0.5 text-[13px] font-medium", TONE_BADGE[w.status === "COMPLETED" ? "done" : w.status === "REJECTED" ? "stopped" : "neutral"])}>
                        {humanize(w.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-3">
                      Requested {day(w.requestDate)}
                      {w.approvedAt && `, approved ${day(w.approvedAt)}`}
                      {w.completedAt && `, completed ${day(w.completedAt)}`}
                    </p>
                    {w.collectionDate && <p className="mt-1 text-sm text-ink-2">Collection: {format(w.collectionDate, "EEEE d MMMM yyyy, HH:mm")}</p>}
                    {w.saleAmount && <p className="mt-1 text-sm text-ink-2">Sale amount: {usdCents(w.saleAmount)}</p>}
                    {w.rejectionReason && <p className="mt-1 text-sm text-[#B42318]">{w.rejectionReason}</p>}
                  </li>
                ))}
                {d.transfers.map((t) => (
                  <li key={t.id} className="py-4 first:pt-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="font-medium text-ink">Transfer to {t.destinationVault}</p>
                      <span className={cn("rounded-md px-2 py-0.5 text-[13px] font-medium", TONE_BADGE[t.status === "COMPLETED" ? "done" : t.status === "CANCELLED" ? "stopped" : "neutral"])}>
                        {humanize(t.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-3">
                      <span className="figures">{t.transferNumber}</span>, {weightText(t.weightTransferred)}, started {day(t.initiatedAt)}
                      {t.completedAt && `, completed ${day(t.completedAt)}`}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="History" action={<span className="text-sm text-ink-3">{d.activities.length} entries</span>}>
            {d.activities.length === 0 ? (
              <p className="text-[15px] text-ink-2">Nothing has been recorded yet.</p>
            ) : (
              <ol className="relative space-y-6 pl-7">
                <span aria-hidden className="absolute bottom-2 left-[5px] top-2 w-px bg-line-2" />
                {d.activities.map((a, i) => (
                  <li key={a.id} className="relative">
                    <span
                      aria-hidden
                      className={cn("absolute -left-7 top-[5px] block size-[11px] rounded-[3px] border-2", i === 0 ? "border-signal bg-signal" : "border-line-2 bg-surface")}
                    />
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                      <p className={cn("text-[15px]", i === 0 ? "font-semibold text-ink" : "font-medium text-ink")}>{activityTitle(a.action)}</p>
                      <p className="figures shrink-0 text-[13px] text-ink-3">{format(a.createdAt, "d MMM yyyy, HH:mm")}</p>
                    </div>
                    <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{readableActivity(a.description)}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <Panel title="Documents">
            {documents.length === 0 ? (
              <p className="text-sm leading-relaxed text-ink-2">Documents appear here as each step is completed, starting with the assay report after testing.</p>
            ) : (
              <ul className="divide-y divide-line">
                {documents.map((doc) => (
                  <li key={doc.type}>
                    <a
                      href={`/api/vault-documents/${d.id}?type=${doc.type}`}
                      target="_blank"
                      rel="noopener"
                      className="group flex items-center gap-3 py-3 text-[15px] font-medium text-ink"
                    >
                      <FileText aria-hidden strokeWidth={1.5} className="size-5 shrink-0 text-ink-3" />
                      <span className="flex-1 underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-ink/40">{doc.label}</span>
                      <span className="text-[13px] font-normal text-ink-3">PDF</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Key dates">
            <ol className="space-y-3">
              {milestones.map((m) => (
                <li key={m.label} className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="text-ink-2">{m.label}</span>
                  <span className="shrink-0 text-ink">{format(m.date as Date, "d MMM yyyy")}</span>
                </li>
              ))}
            </ol>
          </Panel>

          {d.invoices.length > 0 && (
            <Panel title="Invoices">
              <ul className="divide-y divide-line">
                {d.invoices.map((inv) => {
                  const s = INVOICE_STATUS[inv.status] ?? { label: humanize(inv.status), tone: "neutral" as const };
                  return (
                    <li key={inv.id} className="py-4 first:pt-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="figures text-sm text-ink">{inv.invoiceNumber}</p>
                        <span className={cn("rounded-md px-2 py-0.5 text-[13px] font-medium", TONE_BADGE[s.tone])}>{s.label}</span>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {inv.items.map((item) => (
                          <li key={item.id} className="flex justify-between gap-3 text-[13px]">
                            <span className="text-ink-2">{item.description}</span>
                            <span className="figures shrink-0 text-ink">{usdCents(item.amount)}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 flex justify-between gap-3 text-sm">
                        <span className="text-ink-3">
                          Issued {format(inv.issueDate, "d MMM yyyy")}
                          {inv.paidAt ? `, paid ${format(inv.paidAt, "d MMM yyyy")}` : `, due ${format(inv.dueDate, "d MMM yyyy")}`}
                        </span>
                        <span className="figures font-medium text-ink">{usdCents(inv.total)}</span>
                      </p>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[13px] text-ink-3">Invoices are generated only from the published vault fee schedule.</p>
            </Panel>
          )}

          {d.beneficiaries.length > 0 && (
            <Panel title="Beneficiaries">
              <ul className="space-y-3">
                {d.beneficiaries.map((b) => (
                  <li key={b.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span>
                      <span className="font-medium text-ink">{b.name}</span>
                      <span className="text-ink-3">, {b.relationship.toLowerCase()}</span>
                    </span>
                    <span className="shrink-0 text-ink-2">
                      {b.allocationPercent}%{b.status !== "VERIFIED" && <span className="text-ink-3"> ({humanize(b.status).toLowerCase()})</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="Questions about this deposit?">
            <p className="text-sm leading-relaxed text-ink-2">
              Quote <span className="figures text-ink">{d.depositNumber}</span> when you write or call, and we&apos;ll find it straight away.
            </p>
            <ButtonLink href="/contact" variant="outline" size="sm" className="mt-4">
              Contact us
            </ButtonLink>
          </Panel>

          <PaymentNotice email={COMPANY.email} />
        </aside>
      </div>
    </AccountShell>
  );
}
