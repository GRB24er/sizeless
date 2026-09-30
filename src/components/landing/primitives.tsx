import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Shared building blocks for the client-facing pages. Colours and type are
// defined in globals.css: canvas / surface / tint backgrounds, ink / ink-2 /
// ink-3 text, line borders, navy dark surfaces and one signal-orange accent.
//
// Shape rule, used everywhere on the public site:
//   controls (buttons, inputs, tabs, badges)  rounded-md  (6px)
//   panels, cards and photos                  rounded-xl  (12px)

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10", className)}>{children}</div>;
}

export function SectionHeading({
  title,
  intro,
  tone = "light",
  className,
  as: Tag = "h2",
}: {
  title: ReactNode;
  intro?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
  as?: "h1" | "h2";
}) {
  const dark = tone === "dark";
  return (
    <div className={cn("max-w-2xl", className)}>
      <Tag
        className={cn(
          "type-display text-balance text-[2rem] font-semibold leading-[1.08] sm:text-[2.5rem]",
          dark ? "text-white" : "text-ink"
        )}
      >
        {title}
      </Tag>
      {intro && (
        <p className={cn("mt-4 max-w-[62ch] text-pretty text-[17px] leading-relaxed", dark ? "text-[#B7C3D1]" : "text-ink-2")}>
          {intro}
        </p>
      )}
    </div>
  );
}

// ─── Buttons & links ────────────────────────────────────────────────────

const BUTTON_BASE =
  "group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:pointer-events-none disabled:opacity-60";

const BUTTON_VARIANTS = {
  /** The one action that matters most in a view. */
  primary: "bg-signal text-white hover:bg-signal-hover",
  dark: "bg-ink text-white hover:bg-navy-2",
  outline: "border border-line-2 bg-surface text-ink hover:border-ink/35",
  /** For navy backgrounds. */
  light: "bg-surface text-ink hover:bg-tint",
  outlineLight: "border border-white/25 text-white hover:border-white/50 hover:bg-white/5",
} as const;

const BUTTON_SIZES = { sm: "h-9 px-3.5 text-sm", md: "h-11 px-5 text-[15px]" } as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export function buttonClass(variant: ButtonVariant = "primary", size: keyof typeof BUTTON_SIZES = "md", className?: string) {
  return cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className);
}

export function Arrow({ className }: { className?: string }) {
  return (
    <ArrowRight
      aria-hidden
      strokeWidth={1.75}
      className={cn("size-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5", className)}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: keyof typeof BUTTON_SIZES; arrow?: boolean }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}

/** Underlined inline link with an optional trailing arrow. */
export function TextLink({
  tone = "light",
  arrow = false,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { tone?: "light" | "dark"; arrow?: boolean }) {
  return (
    <Link
      className={cn(
        "group inline-flex items-center gap-1.5 font-medium underline underline-offset-[5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal",
        tone === "dark" ? "text-white decoration-white/30 hover:decoration-white" : "text-ink decoration-line-2 hover:decoration-ink",
        className
      )}
      {...props}
    >
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}

// ─── Formatting ─────────────────────────────────────────────────────────

/**
 * Sets the figures in a price string ("$3.50 per kg (min $25)") in mono and
 * the words around them in the text face, muted.
 */
export function Amount({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\$?\d[\d,]*(?:\.\d+)?%?)/g);
  return (
    <span className={className}>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} className="figures text-ink">
            {p}
          </span>
        ) : (
          p && (
            <span key={i} className="text-ink-3">
              {p}
            </span>
          )
        )
      )}
    </span>
  );
}

export const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);

export const usdCents = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

/** Money in a given currency (defaults to USD). Falls back to USD if the code is unknown. */
export const money = (n: number, currency = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(n);
  } catch {
    return usdCents(n);
  }
};

/** "3–5 business days" → "3-5 business days" (the rate card uses en dashes). */
export const plainRange = (s: string) => s.replace(/\s*[–—]\s*/g, "-");

/** "+447361617512" → "+44 7361 617512". Other numbers are shown as stored. */
export const formatPhone = (e164: string) => {
  const uk = e164.match(/^\+44(\d{4})(\d{6})$/);
  return uk ? `+44 ${uk[1]} ${uk[2]}` : e164;
};
