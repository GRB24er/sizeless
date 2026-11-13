import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/landing/primitives";

const SECTIONS = [
  { key: "overview", href: "/account", label: "Overview" },
  { key: "vault", href: "/my-vault", label: "Vault" },
  { key: "shipments", href: "/shipments/history", label: "Shipments" },
  { key: "identity", href: "/my-vault/kyc", label: "Identity checks" },
  { key: "profile", href: "/profile", label: "Profile" },
] as const;

export type AccountSection = (typeof SECTIONS)[number]["key"];

/**
 * Frame for the signed-in client's pages: a navy band with the page title,
 * the primary actions, an optional row of summary tiles and the account
 * sections, then the page content on the light canvas.
 */
export function AccountShell({
  active,
  title,
  intro,
  actions,
  summary,
  children,
}: {
  active: AccountSection;
  title: ReactNode;
  intro?: ReactNode;
  actions?: ReactNode;
  /** Tiles shown inside the band, above the section tabs (the overview uses this). */
  summary?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-[70vh] bg-canvas pb-24 pt-[var(--header-h)]">
      <div className="bg-navy">
        <Container>
          <div className="flex flex-col gap-6 pt-9 sm:flex-row sm:items-end sm:justify-between sm:pt-12">
            <div className="min-w-0">
              <h1 className="type-display text-balance text-[1.95rem] font-semibold leading-tight text-white sm:text-[2.5rem]">{title}</h1>
              {intro && <div className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-[#B7C3D1]">{intro}</div>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap gap-2 sm:pb-1">{actions}</div>}
          </div>

          {summary && <div className="mt-9 grid grid-cols-2 gap-3 lg:grid-cols-4">{summary}</div>}

          <nav aria-label="Account" className="mt-8 flex gap-1 overflow-x-auto [scrollbar-width:none]">
            {SECTIONS.map((s) => {
              const current = active === s.key;
              return (
                <Link
                  key={s.key}
                  href={s.href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "relative whitespace-nowrap px-3 py-3.5 text-sm font-medium transition-colors duration-150 first:-ml-3 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white",
                    current ? "text-white" : "text-[#A9B6C6] hover:text-white"
                  )}
                >
                  {s.label}
                  {current && <span aria-hidden className="absolute inset-x-3 bottom-0 h-0.5 bg-signal" />}
                </Link>
              );
            })}
          </nav>
        </Container>
      </div>
      <Container className="pt-8 sm:pt-10">{children}</Container>
    </div>
  );
}

/** Summary figure for the account band. */
export function StatTile({
  label,
  value,
  note,
  href,
  mono = true,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  href?: string;
  /** Figures in the mono face; set false for words. */
  mono?: boolean;
}) {
  const body = (
    <>
      <p className="text-[13px] text-[#A9B6C6]">{label}</p>
      <p className={cn("mt-2 truncate leading-none text-white", mono ? "figures text-[1.45rem] sm:text-[1.65rem]" : "text-[1.3rem] font-semibold sm:text-[1.45rem]")}>
        {value}
      </p>
      {note && <p className="mt-2.5 truncate text-[13px] text-[#A9B6C6]">{note}</p>}
    </>
  );
  const cls =
    "block rounded-xl bg-white/[0.05] p-4 ring-1 ring-white/10 transition-colors duration-150 sm:p-5";
  return href ? (
    <Link href={href} className={cn(cls, "hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** White panel used across the account pages, with an optional divided header. */
export function Panel({
  title,
  action,
  className,
  flush = false,
  children,
}: {
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Let lists run edge to edge inside the panel. */
  flush?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-line bg-surface", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          {title && <h2 className="text-[16px] font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      <div className={flush ? undefined : "p-5 sm:p-6"}>{children}</div>
    </section>
  );
}

/** Label and value row for record details. Renders nothing when the value is empty. */
export function Field({ label, children, mono = false }: { label: string; children: ReactNode; mono?: boolean }) {
  if (children === null || children === undefined || children === "" || children === false) return null;
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:gap-6">
      <dt className="text-sm text-ink-3">{label}</dt>
      <dd className={cn("text-[15px] text-ink", mono && "figures")}>{children}</dd>
    </div>
  );
}

/** Short, neutral pricing note. Shown once in the account area, not repeated on every page. */
export function PaymentNotice({ email }: { email: string }) {
  return (
    <p className="rounded-xl border border-line bg-canvas p-5 text-sm leading-relaxed text-ink-2">
      <span className="font-semibold text-ink">Every charge on your account is set out up front.</span> Storage, demurrage and the release
      options are all on the fee schedule you accept when you deposit. Questions about a charge? Email{" "}
      <a href={`mailto:${email}`} className="font-medium text-ink underline decoration-line-2 underline-offset-4">
        {email}
      </a>
      .
    </p>
  );
}
