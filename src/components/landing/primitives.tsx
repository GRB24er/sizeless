import { cn } from "@/lib/utils";
import { ReactNode } from "react";

// Shared building blocks for the client-facing pages: ivory / navy / gold,
// serif display headings over Inter.

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Eyebrow({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "dark" }) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em]",
        tone === "dark" ? "text-gold" : "text-gold-deep"
      )}
    >
      <span className={cn("h-px w-8", tone === "dark" ? "bg-gold/70" : "bg-gold-deep/60")} />
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  tone = "light",
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  tone?: "light" | "dark";
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center [&>p:first-child]:justify-center")}>
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2
        className={cn(
          "mt-5 font-display text-3xl font-medium leading-[1.12] tracking-tight sm:text-4xl lg:text-[2.75rem]",
          tone === "dark" ? "text-white" : "text-ink"
        )}
      >
        {title}
      </h2>
      {intro && (
        <p className={cn("mt-5 text-base leading-relaxed sm:text-lg", tone === "dark" ? "text-slate-300" : "text-slate-600")}>
          {intro}
        </p>
      )}
    </div>
  );
}

/** Circular "price fixed at booking" stamp. */
export function FixedPriceSeal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={cn("h-24 w-24", className)} aria-label="Price fixed at booking" role="img">
      <defs>
        <path id="seal-ring" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
      </defs>
      <circle cx="60" cy="60" r="57" fill="#0F1D2F" stroke="#C9A24D" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="51" fill="none" stroke="#C9A24D" strokeWidth="0.6" strokeDasharray="1.5 2.5" />
      <text fill="#C9A24D" fontSize="8.4" fontWeight="600" letterSpacing="2.1" fontFamily="Inter, sans-serif">
        <textPath href="#seal-ring">PRICE FIXED AT BOOKING · NO CHARGES ADDED ·</textPath>
      </text>
      <circle cx="60" cy="60" r="30" fill="none" stroke="#C9A24D" strokeWidth="0.8" />
      <path d="M47 61 l9 9 l17 -19" fill="none" stroke="#C9A24D" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);
