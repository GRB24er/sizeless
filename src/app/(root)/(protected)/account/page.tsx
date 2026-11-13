import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { format } from "date-fns";
import { ArrowRight, FileText, LockKeyhole, Package, Search, UserRound } from "lucide-react";
import { auth } from "~/auth";
import { prisma } from "@/constants/config/db";
import { COMPANY } from "@/lib/company";
import { getClientDeposits, getClientKyc, getClientShipments } from "@/lib/client-account";
import { shipmentStatusLabel, shipmentStatusTone } from "@/lib/shipment-status";
import { AccountShell, Panel, StatTile } from "@/components/account/account-shell";
import { PhaseBar, ShipmentProgress, StatusBadge } from "@/components/account/vault-bits";
import { TONE_BADGE, assetLabel, compactWeight, troyOunces, weightText } from "@/components/account/vault-format";
import { ButtonLink, TextLink } from "@/components/landing/primitives";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My account | Aegis Cargo" };

const KYC_STATE: Record<string, { title: string; text: (date?: string) => string; action?: string; tone: keyof typeof TONE_BADGE }> = {
  NONE: { title: "Not started", text: () => "Identity checks are needed before we can accept a vault deposit.", action: "Start identity checks", tone: "attention" },
  PENDING: { title: "Submitted", text: (d) => `Submitted ${d}. We'll email you once they're reviewed.`, tone: "neutral" },
  UNDER_REVIEW: { title: "In review", text: (d) => `Submitted ${d}. We'll email you once they're reviewed.`, tone: "neutral" },
  APPROVED: { title: "Approved", text: (d) => `Approved ${d}. You can request vault deposits.`, tone: "done" },
  REJECTED: { title: "Not approved", text: () => "Your last submission wasn't approved. You can submit again.", action: "Submit again", tone: "stopped" },
  EXPIRED: { title: "Expired", text: () => "Your identity checks have expired. Please submit them again.", action: "Submit again", tone: "attention" },
};

const QUICK_ACTIONS = [
  { href: "/track", label: "Track a shipment", note: "Status and route by tracking number", icon: Search },
  { href: "/shipments/create", label: "Book a shipment", note: "Priced line by line from the rate card", icon: Package },
  { href: "/my-vault", label: "Request a vault deposit", note: "With the fee schedule in front of you", icon: LockKeyhole },
  { href: "/profile", label: "Profile and security", note: "Contact details, address and password", icon: UserRound },
];

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/account");
  const userId = session.user.id;

  const [user, kyc, deposits, shipments] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, role: true, createdAt: true } }),
    getClientKyc(userId),
    getClientDeposits(userId),
    getClientShipments(userId, 5),
  ]);

  const firstName = user?.name?.trim().split(/\s+/)[0];
  const stored = deposits.filter((d) => d.status === "IN_STORAGE");
  const storedGrams = stored.reduce((sum, d) => sum + d.weightGrams, 0);
  const inProgress = deposits.filter((d) => !["IN_STORAGE", "RELEASED", "LIQUIDATED", "KYC_REJECTED"].includes(d.status));
  const active = shipments.filter((s) => !s.deliveredAt && s.TrackingUpdates[0]?.status?.toLowerCase() !== "delivered");
  const nextDue = active.map((s) => s.estimatedDelivery).sort((a, b) => +a - +b)[0];
  const kycKey = kyc?.status ?? "NONE";
  const kycState = KYC_STATE[kycKey] ?? KYC_STATE.NONE;
  const kycDate = kyc ? format(kyc.reviewedAt ?? kyc.createdAt, "d MMM yyyy") : undefined;

  return (
    <AccountShell
      active="overview"
      title={firstName ? `Welcome back, ${firstName}` : "Your account"}
      intro={
        <>
          {user?.email}
          {user?.createdAt && <> · Client since {format(user.createdAt, "MMMM yyyy")}</>}
        </>
      }
      actions={
        <>
          {user?.role === "ADMIN" && (
            <ButtonLink href="/dashboard" variant="outlineLight" size="sm">
              Admin dashboard
            </ButtonLink>
          )}
          <ButtonLink href="/my-vault" variant="outlineLight" size="sm">
            Request a deposit
          </ButtonLink>
          <ButtonLink href="/shipments/create" size="sm" arrow>
            Book a shipment
          </ButtonLink>
        </>
      }
      summary={
        <>
          <StatTile
            label="Metal in storage"
            value={storedGrams > 0 ? compactWeight(storedGrams) : "None yet"}
            mono={storedGrams > 0}
            note={stored.length ? `${troyOunces(storedGrams)} · ${stored.length} deposit${stored.length === 1 ? "" : "s"}` : "Nothing in storage"}
            href="/my-vault"
          />
          <StatTile
            label="Deposits in progress"
            value={inProgress.length}
            note={inProgress.length ? "Moving through intake" : "None at the moment"}
            href="/my-vault"
          />
          <StatTile
            label="Shipments on the way"
            value={active.length}
            note={nextDue ? `Next due ${format(nextDue, "d MMM")}` : "None at the moment"}
            href="/shipments/history"
          />
          <StatTile
            label="Identity checks"
            value={kycState.title}
            mono={false}
            note={kycDate ? `Updated ${kycDate}` : "Needed for vault deposits"}
            href="/my-vault/kyc"
          />
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Panel
            flush
            title="Vault holdings"
            action={
              deposits.length > 0 && (
                <TextLink href="/my-vault" arrow className="text-sm">
                  All deposits
                </TextLink>
              )
            }
          >
            {deposits.length === 0 ? (
              <EmptyState
                icon={LockKeyhole}
                title="No vault deposits yet"
                text="Request a deposit and we'll take you through identity checks, handover, testing and storage, with every fee shown before you submit."
                action={
                  <ButtonLink href="/my-vault" size="sm" arrow>
                    Request a deposit
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {deposits.slice(0, 4).map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/my-vault/${d.depositNumber}`}
                      className="group block px-5 py-5 transition-colors duration-150 hover:bg-canvas sm:px-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                        <div className="min-w-0">
                          <p className="font-medium text-ink">
                            {d.quantity} × {assetLabel(d.assetType)}
                          </p>
                          <p className="mt-1 text-[13px] text-ink-3">
                            <span className="figures text-ink-2">{d.depositNumber}</span>
                            <span aria-hidden> · </span>
                            {weightText(d.weightGrams)}
                            <span aria-hidden> · </span>
                            opened {format(d.depositDate, "d MMM yyyy")}
                          </p>
                        </div>
                        <StatusBadge status={d.status} />
                      </div>
                      <div className="mt-4 flex items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <PhaseBar status={d.status} />
                        </div>
                        <ArrowRight
                          aria-hidden
                          strokeWidth={1.75}
                          className="size-4 shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-ink"
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            flush
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
              <EmptyState
                icon={Package}
                title="No shipments yet"
                text="Book a shipment and the price builds line by line from the published rate card. You'll see every handover here."
                action={
                  <ButtonLink href="/shipments/create" size="sm" arrow>
                    Book a shipment
                  </ButtonLink>
                }
              />
            ) : (
              <ul className="divide-y divide-line">
                {shipments.map((s) => {
                  const latest = s.TrackingUpdates[0];
                  const delivered = Boolean(s.deliveredAt) || latest?.status?.toLowerCase() === "delivered";
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/track/${s.trackingNumber}`}
                        className="group block px-5 py-5 transition-colors duration-150 hover:bg-canvas sm:px-6"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                          <div className="min-w-0">
                            <p className="figures text-[15px] text-ink">{s.trackingNumber}</p>
                            <p className="mt-1 text-[14px] text-ink-2">
                              {s.originCity}, {s.originCountry} <span className="text-ink-3">to</span> {s.destinationCity}, {s.destinationCountry}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "whitespace-nowrap rounded-md px-2 py-0.5 text-[13px] font-medium",
                              TONE_BADGE[shipmentStatusTone(latest?.status)]
                            )}
                          >
                            {shipmentStatusLabel(latest?.status)}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
                          <ShipmentProgress status={latest?.status} />
                          <p className="text-[13px] text-ink-3">
                            {delivered
                              ? `Delivered ${format(s.deliveredAt ?? latest?.timestamp ?? s.estimatedDelivery, "d MMM yyyy")}`
                              : `Due ${format(s.estimatedDelivery, "d MMM yyyy")}`}
                            {latest?.location && !delivered && <> · Last scan {latest.location}</>}
                          </p>
                        </div>
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
            <div className="flex items-center gap-2.5">
              <span className={cn("rounded-md px-2 py-0.5 text-[13px] font-medium", TONE_BADGE[kycState.tone])}>{kycState.title}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">{kycState.text(kycDate)}</p>
            {kyc?.status === "REJECTED" && kyc.rejectionReason && (
              <p className="mt-3 rounded-md bg-[#B42318]/[0.06] px-3 py-2 text-sm text-[#B42318]">{kyc.rejectionReason}</p>
            )}
            <TextLink href="/my-vault/kyc" arrow className="mt-4 text-sm">
              {kycState.action ?? "View identity checks"}
            </TextLink>
          </Panel>

          <Panel flush title="Quick actions">
            <ul className="divide-y divide-line">
              {QUICK_ACTIONS.map(({ href, label, note, icon: Icon }) => (
                <li key={href}>
                  <Link href={href} className="group flex items-center gap-3.5 px-5 py-3.5 transition-colors duration-150 hover:bg-canvas sm:px-6">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-tint text-ink-2 transition-colors group-hover:bg-navy group-hover:text-white">
                      <Icon aria-hidden strokeWidth={1.75} className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium text-ink">{label}</span>
                      <span className="block truncate text-[13px] text-ink-3">{note}</span>
                    </span>
                    <ArrowRight aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Your account team">
            <p className="text-sm leading-relaxed text-ink-2">
              Questions about a deposit, a charge or a shipment? Write to us and someone from the team will reply.
            </p>
            <a
              href={`mailto:${COMPANY.email}`}
              className="mt-4 flex items-center gap-3 rounded-md border border-line px-3.5 py-3 text-[15px] font-medium text-ink transition-colors hover:border-line-2 hover:bg-canvas"
            >
              <FileText aria-hidden strokeWidth={1.75} className="size-4 text-ink-3" />
              {COMPANY.email}
            </a>
          </Panel>
        </aside>
      </div>
    </AccountShell>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: typeof Package;
  title: string;
  text: string;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-4 px-5 py-8 sm:flex-row sm:px-6">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-tint text-ink-2">
        <Icon aria-hidden strokeWidth={1.75} className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        <p className="mt-1 max-w-[52ch] text-sm leading-relaxed text-ink-2">{text}</p>
        <div className="mt-4">{action}</div>
      </div>
    </div>
  );
}
