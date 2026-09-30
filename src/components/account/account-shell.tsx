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

/** Frame for the signed-in client's pages: page title, actions and the account sections. */
export function AccountShell({
  active,
  title,
  intro,
  actions,
  children,
}: {
  active: AccountSection;
  title: ReactNode;
  intro?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-[70vh] bg-canvas pb-20 pt-[var(--header-h)]">
      <div className="border-b border-line bg-surface">
        <Container>
          <div className="flex flex-col gap-5 pt-8 sm:flex-row sm:items-end sm:justify-between sm:pt-10">
            <div className="min-w-0">
              <h1 className="type-display text-balance text-[1.9rem] font-semibold leading-tight text-ink sm:text-[2.35rem]">{title}</h1>
              {intro && <div className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-ink-2">{intro}</div>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap gap-2 sm:pb-1">{actions}</div>}
          </div>
          <nav aria-label="Account" className="-mb-px mt-6 flex gap-1 overflow-x-auto [scrollbar-width:none]">
            {SECTIONS.map((s) => {
              const current = active === s.key;
              return (
                <Link
                  key={s.key}
                  href={s.href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "relative whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-signal",
                    current ? "text-ink" : "text-ink-3 hover:text-ink"
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

/** Bordered white panel used across the account pages. */
export function Panel({ title, action, className, children }: { title?: ReactNode; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-line bg-surface p-6 sm:p-7", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-baseline justify-between gap-4">
          {title && <h2 className="text-[17px] font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
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

/** The payment-safety notice shown on every account page. */
export function PaymentNotice({ email }: { email: string }) {
  return (
    <p className="rounded-xl border border-line bg-canvas p-5 text-sm leading-relaxed text-ink-2">
      <span className="font-semibold text-ink">We only charge the fees in our published schedules.</span> We never ask for a payment to
      release a shipment or your metal, or for taxes, bonds or clearance fees outside those schedules. If anyone asks, don&apos;t pay and
      write to{" "}
      <a href={`mailto:${email}`} className="font-medium text-ink underline decoration-line-2 underline-offset-4">
        {email}
      </a>
      .
    </p>
  );
}
