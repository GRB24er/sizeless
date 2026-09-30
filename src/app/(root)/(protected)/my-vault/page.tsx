import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { auth } from "~/auth";
import { getClientDeposits, getClientKyc } from "@/lib/client-account";
import { AccountShell } from "@/components/account/account-shell";
import { DepositRequest } from "@/components/account/deposit-request";
import { PhaseBar, StatusBadge } from "@/components/account/vault-bits";
import { assetLabel, storageLabel, weightText } from "@/components/account/vault-format";
import { depositCurrency } from "@/lib/vault/demo-deposits";
import { ButtonLink, TextLink, money } from "@/components/landing/primitives";

export const metadata: Metadata = { title: "My vault | Aegis Cargo" };

export default async function MyVaultPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/my-vault");

  const [deposits, kyc] = await Promise.all([getClientDeposits(session.user.id), getClientKyc(session.user.id)]);
  const canRelease = deposits.some((d) => d.status === "IN_STORAGE");

  return (
    <AccountShell
      active="vault"
      title="Your vault"
      intro="Every deposit held for you, where it is in the process, and the records behind it."
      actions={
        <>
          {canRelease && (
            <ButtonLink href="/my-vault/withdraw" variant="outline" size="sm">
              Request a release
            </ButtonLink>
          )}
          <DepositRequest />
        </>
      }
    >
      {kyc?.status !== "APPROVED" && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="font-semibold text-ink">
              {kyc ? "Your identity checks are still being reviewed" : "Complete your identity checks"}
            </p>
            <p className="mt-1 text-sm text-ink-2">
              {kyc
                ? "We'll email you when they're reviewed. Deposits wait at the identity checks stage until then."
                : "We need your ID, proof of address and the source of your metal before we can accept a deposit."}
            </p>
          </div>
          <TextLink href="/my-vault/kyc" arrow className="shrink-0 text-sm">
            {kyc ? "View identity checks" : "Start identity checks"}
          </TextLink>
        </div>
      )}

      {deposits.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-6 py-14 text-center">
          <p className="type-display text-xl font-semibold text-ink">No deposits yet</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-2">
            When you request a deposit, or when we record one for you at the vault, it appears here with every step of its progress.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <DepositRequest />
            <ButtonLink href="/vault#fees" variant="outline" size="sm">
              Vault fees
            </ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="grid gap-4">
          {deposits.map((d) => (
            <li key={d.id}>
              <Link
                href={`/my-vault/${d.depositNumber}`}
                className="group block rounded-xl border border-line bg-surface p-5 transition-[border-color,box-shadow] duration-200 hover:border-line-2 hover:shadow-[0_16px_40px_-28px_rgba(15,29,47,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal sm:p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[17px] font-semibold text-ink">
                      {d.quantity} × {assetLabel(d.assetType)}
                    </p>
                    <p className="mt-0.5 text-[13px] text-ink-3">
                      <span className="figures">{d.depositNumber}</span>, opened {format(d.depositDate, "d MMMM yyyy")}
                    </p>
                  </div>
                  <StatusBadge status={d.status} className="self-start" />
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-[13px] text-ink-3">Weight</dt>
                    <dd className="mt-0.5 text-ink">{weightText(d.weightGrams)}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-ink-3">Storage</dt>
                    <dd className="mt-0.5 text-ink">{storageLabel(d.storageType)}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-ink-3">{d.verifiedValue ? "Verified value" : "Declared value"}</dt>
                    <dd className="figures mt-0.5 text-ink">{money(d.verifiedValue ?? d.declaredValue, depositCurrency(d.depositNumber))}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-ink-3">Last update</dt>
                    <dd className="mt-0.5 text-ink">{format(d.updatedAt, "d MMM yyyy")}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex items-center gap-6">
                  <div className="min-w-0 flex-1">
                    <PhaseBar status={d.status} labels />
                  </div>
                  <span className="hidden shrink-0 text-sm font-medium text-ink underline decoration-line-2 underline-offset-4 group-hover:decoration-ink sm:inline">
                    View details
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 max-w-3xl">
        <p className="rounded-xl border border-line bg-canvas p-5 text-sm leading-relaxed text-ink-2">
          Storage is charged monthly from the published rate for your storage type. The full list of fees is on the{" "}
          <Link href="/vault#fees" className="font-medium text-ink underline decoration-line-2 underline-offset-4">
            vault fee schedule
          </Link>
          .
        </p>
      </div>
    </AccountShell>
  );
}
