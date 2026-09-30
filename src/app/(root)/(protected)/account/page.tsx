import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { auth } from "~/auth";
import { prisma } from "@/constants/config/db";
import { getClientDeposits, getClientKyc, getClientShipments } from "@/lib/client-account";
import { shipmentStatusLabel, shipmentStatusTone } from "@/lib/shipment-status";
import { AccountShell, Panel } from "@/components/account/account-shell";
import { PhaseBar, StatusBadge } from "@/components/account/vault-bits";
import { TONE_BADGE, assetLabel, weightText } from "@/components/account/vault-format";
import { ButtonLink, TextLink } from "@/components/landing/primitives";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My account | Aegis Cargo" };

const KYC_STATE: Record<string, { title: string; text: (date?: string) => string; action?: string }> = {
  NONE: { title: "Not started", text: () => "Identity checks are needed before we can accept a vault deposit.", action: "Start identity checks" },
  PENDING: { title: "Submitted", text: (d) => `Submitted ${d}. We'll email you once they're reviewed.` },
  UNDER_REVIEW: { title: "In review", text: (d) => `Submitted ${d}. We'll email you once they're reviewed.` },
  APPROVED: { title: "Approved", text: (d) => `Approved ${d}. You can request vault deposits.` },
  REJECTED: { title: "Not approved", text: () => "Your last submission wasn't approved. You can submit again.", action: "Submit again" },
  EXPIRED: { title: "Expired", text: () => "Your identity checks have expired. Please submit them again.", action: "Submit again" },
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/account");
  const userId = session.user.id;

  const [user, kyc, deposits, shipments] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, role: true } }),
    getClientKyc(userId),
    getClientDeposits(userId),
    getClientShipments(userId, 5),
  ]);

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const stored = deposits.filter((d) => d.status === "IN_STORAGE");
  const storedGrams = stored.reduce((sum, d) => sum + d.weightGrams, 0);
  const inProgress = deposits.filter((d) => !["IN_STORAGE", "RELEASED", "LIQUIDATED", "KYC_REJECTED"].includes(d.status)).length;
  const kycKey = kyc?.status ?? "NONE";
  const kycState = KYC_STATE[kycKey] ?? KYC_STATE.NONE;
  const kycDate = kyc ? format(kyc.reviewedAt ?? kyc.createdAt, "d MMM yyyy") : undefined;

  return (
    <AccountShell
      active="overview"
      title={firstName ? `Welcome back, ${firstName}` : "Your account"}
      intro={<>Signed in as {user?.email}</>}
      actions={
        user?.role === "ADMIN" ? (
          <ButtonLink href="/dashboard" variant="dark" size="sm">
            Admin dashboard
          </ButtonLink>
        ) : undefined
      }
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Panel
            title="Vault"
            action={
              deposits.length > 0 && (
                <TextLink href="/my-vault" arrow className="text-sm">
                  All deposits
                </TextLink>
              )
            }
          >
            {deposits.length === 0 ? (
              <div>
                <p className="text-[15px] text-ink-2">You don&apos;t have any vault deposits yet.</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                  <ButtonLink href="/my-vault" size="sm" arrow>
                    Request a deposit
                  </ButtonLink>
                  <TextLink href="/vault#fees" className="text-sm">
                    Vault fees
                  </TextLink>
                </div>
              </div>
            ) : (
              <>
                <dl className="grid grid-cols-2 gap-4 border-b border-line pb-5 sm:grid-cols-3">
                  <div>
                    <dt className="text-[13px] text-ink-3">In storage</dt>
                    <dd className="figures mt-1 text-xl text-ink">{stored.length}</dd>
                  </div>
                  <div>
                    <dt className="text-[13px] text-ink-3">In progress</dt>
                    <dd className="figures mt-1 text-xl text-ink">{inProgress}</dd>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <dt className="text-[13px] text-ink-3">Weight in storage</dt>
                    <dd className="mt-1 text-[15px] text-ink">{storedGrams > 0 ? weightText(storedGrams) : "None yet"}</dd>
                  </div>
                </dl>
                <ul className="divide-y divide-line">
                  {deposits.slice(0, 4).map((d) => (
                    <li key={d.id}>
                      <Link
                        href={`/my-vault/${d.depositNumber}`}
                        className="group grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-ink group-hover:underline group-hover:decoration-line-2 group-hover:underline-offset-4">
                            {d.quantity} × {assetLabel(d.assetType)}
                          </p>
                          <p className="mt-0.5 text-[13px] text-ink-3">
                            <span className="figures">{d.depositNumber}</span>, opened {format(d.depositDate, "d MMM yyyy")}
                          </p>
                          <div className="mt-3 max-w-sm">
                            <PhaseBar status={d.status} />
                          </div>
                        </div>
                        <StatusBadge status={d.status} className="justify-self-start sm:justify-self-end" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>

          <Panel
            title="Shipments"
            action={
              shipments.length > 0 && (
                <TextLink href="/shipments/history" arrow className="text-sm">
                  All shipments
                </TextLink>
              )
            }
          >
            {shipments.length === 0 ? (
              <div>
                <p className="text-[15px] text-ink-2">You haven&apos;t booked a shipment yet.</p>
                <ButtonLink href="/shipments/create" size="sm" arrow className="mt-5">
                  Book a shipment
                </ButtonLink>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {shipments.map((s) => {
                  const latest = s.TrackingUpdates[0];
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/track/${s.trackingNumber}`}
                        className="group grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6"
                      >
                        <div className="min-w-0">
                          <p className="figures text-[15px] text-ink group-hover:underline group-hover:decoration-line-2 group-hover:underline-offset-4">
                            {s.trackingNumber}
                          </p>
                          <p className="mt-0.5 truncate text-[13px] text-ink-3">
                            {s.originCity}, {s.originCountry} to {s.destinationCity}, {s.destinationCountry}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "justify-self-start whitespace-nowrap rounded-md px-2 py-0.5 text-[13px] font-medium sm:justify-self-end",
                            TONE_BADGE[shipmentStatusTone(latest?.status)]
                          )}
                        >
                          {shipmentStatusLabel(latest?.status)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <Panel title="Identity checks">
            <p className="text-[15px] font-medium text-ink">{kycState.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">{kycState.text(kycDate)}</p>
            {kyc?.status === "REJECTED" && kyc.rejectionReason && (
              <p className="mt-3 rounded-md bg-[#B42318]/[0.06] px-3 py-2 text-sm text-[#B42318]">{kyc.rejectionReason}</p>
            )}
            <TextLink href="/my-vault/kyc" arrow className="mt-4 text-sm">
              {kycState.action ?? "View identity checks"}
            </TextLink>
          </Panel>

          <Panel title="Account details">
            <p className="text-sm leading-relaxed text-ink-2">Update your contact details, address or password.</p>
            <TextLink href="/profile" arrow className="mt-4 text-sm">
              Profile and security
            </TextLink>
          </Panel>
        </aside>
      </div>
    </AccountShell>
  );
}
