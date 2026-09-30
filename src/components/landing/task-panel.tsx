"use client";

import Link from "next/link";
import { ReactNode, RefObject, useEffect, useId, useMemo, useRef, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { motion, MotionConfig } from "motion/react";
import { ChevronDown } from "lucide-react";
import TrackingForm from "@/components/tracking.form";
import { SHIPPING_OPTIONS, calculateShipmentQuote } from "@/app/(root)/shipments/create/type";
import { STORAGE_TYPE_CONFIG, MIN_MONTHLY_STORAGE_FEE, calculateMonthlyStorageFee } from "@/lib/vault/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Arrow, TextLink, buttonClass, plainRange, usd, usdCents } from "./primitives";
import { QuoteBreakdown } from "./quote-breakdown";

// Every figure here comes from the same functions the booking page and the
// deposit form use (calculateShipmentQuote, calculateMonthlyStorageFee).

export const ESTIMATE_EVENT = "aegis:estimate";

/** Switches this page's task panel to the estimate tab with `service` selected. */
export function EstimateLink({ service, className, children }: { service: string; className?: string; children: ReactNode }) {
  return (
    <a
      href="#task-panel"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent(ESTIMATE_EVENT, { detail: service }));
      }}
    >
      {children}
    </a>
  );
}

/**
 * Answers EstimateLink clicks: selects the service, runs `open` (e.g. switch
 * to the estimate tab), scrolls the estimator into view and focuses it.
 */
function useEstimateEvent(
  onService: (id: string) => void,
  rootRef: RefObject<HTMLElement | null>,
  focusRef: RefObject<HTMLElement | null>,
  open?: () => void
) {
  const handlers = useRef({ onService, open });
  handlers.current = { onService, open };

  useEffect(() => {
    const handle = (e: Event) => {
      const next = (e as CustomEvent<string>).detail;
      if (SHIPPING_OPTIONS.some((o) => o.id === next)) handlers.current.onService(next);
      handlers.current.open?.();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      rootRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      requestAnimationFrame(() => focusRef.current?.focus({ preventScroll: true }));
    };
    window.addEventListener(ESTIMATE_EVENT, handle);
    return () => window.removeEventListener(ESTIMATE_EVENT, handle);
  }, [rootRef, focusRef]);
}

const FIELD =
  "h-11 w-full min-w-0 rounded-md border border-line-2 bg-white px-3 text-[15px] text-ink transition-[border-color,box-shadow] duration-150 focus:border-ink focus:outline-none focus:ring-[3px] focus:ring-signal/15";

function Field({ label, htmlFor, className, children }: { label: string; htmlFor: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectField({
  id,
  value,
  onChange,
  selectRef,
  children,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  selectRef?: RefObject<HTMLSelectElement | null>;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <select id={id} ref={selectRef} value={value} onChange={(e) => onChange(e.target.value)} className={cn(FIELD, "appearance-none pr-9")}>
        {children}
      </select>
      <ChevronDown aria-hidden strokeWidth={1.75} className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
    </div>
  );
}

/** "150,000" or "$150000" → 150000; empty or junk → NaN. */
function parse(v: string) {
  const t = v.replace(/[,$\s]/g, "");
  if (t === "") return NaN;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

// ─── Shipment estimate ──────────────────────────────────────────────────

export function EstimateForm({
  service,
  onServiceChange,
  selectRef,
  inlineBreakdown = false,
}: {
  service: string;
  onServiceChange: (id: string) => void;
  selectRef?: RefObject<HTMLSelectElement | null>;
  /** Show the itemized lines under the form instead of behind a button. */
  inlineBreakdown?: boolean;
}) {
  const id = useId();
  const [packages, setPackages] = useState("1");
  const [weight, setWeight] = useState("1");
  const [value, setValue] = useState("100,000");
  const [insured, setInsured] = useState(true);

  const count = Math.trunc(parse(packages));
  const kg = parse(weight);
  const declared = value.trim() === "" ? 0 : parse(value);

  let problem: string | null = null;
  if (!(count >= 1 && count <= 50)) problem = "Enter between 1 and 50 packages.";
  else if (!(kg > 0 && kg <= 5000)) problem = "Enter a total weight above 0 kg.";
  else if (!(declared >= 0)) problem = "Enter the declared value in US dollars.";

  const quote = useMemo(() => {
    if (problem) return null;
    // Weight and value split evenly: the quote only depends on the totals and the package count.
    const pkgs = Array.from({ length: count }, () => ({ weight: kg / count, declaredValue: declared / count, insurance: insured }));
    return calculateShipmentQuote(pkgs, service);
  }, [problem, count, kg, declared, insured, service]);

  const option = SHIPPING_OPTIONS.find((o) => o.id === service) ?? SHIPPING_OPTIONS[0];
  const summary = quote
    ? `${option.label}, ${quote.totalWeight} kg in ${count} ${count === 1 ? "package" : "packages"}, ${usd(quote.totalDeclaredValue)} declared${insured ? ", insured" : ""}.`
    : "";
  const bookHref = `/shipments/create?service=${service}`;

  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-3 @xl:grid-cols-12">
        <Field label="Service" htmlFor={`${id}-service`} className="col-span-2 @xl:col-span-5">
          <SelectField id={`${id}-service`} value={service} onChange={onServiceChange} selectRef={selectRef}>
            {SHIPPING_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label} ({plainRange(o.transitDays)})
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label="Packages" htmlFor={`${id}-packages`} className="@xl:col-span-2">
          <input id={`${id}-packages`} inputMode="numeric" value={packages} onChange={(e) => setPackages(e.target.value)} className={cn(FIELD, "figures")} />
        </Field>
        <Field label="Weight (kg)" htmlFor={`${id}-weight`} className="@xl:col-span-2">
          <input id={`${id}-weight`} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className={cn(FIELD, "figures")} />
        </Field>
        <Field label="Declared value (USD)" htmlFor={`${id}-value`} className="col-span-2 @xl:col-span-3">
          <input id={`${id}-value`} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className={cn(FIELD, "figures")} />
        </Field>
      </div>

      <label className="mt-3.5 flex w-fit cursor-pointer items-center gap-2.5 text-sm text-ink-2">
        <input type="checkbox" checked={insured} onChange={(e) => setInsured(e.target.checked)} className="size-4 cursor-pointer rounded-sm accent-signal" />
        Insure for the full declared value ({option.insuranceRate}%)
      </label>

      {inlineBreakdown ? (
        <div className="mt-6 border-t border-line pt-5" aria-live="polite">
          {quote ? (
            <>
              <p className="mb-4 text-[13px] text-ink-3">{summary}</p>
              <QuoteBreakdown quote={quote} />
            </>
          ) : (
            <p className="text-sm text-[#B42318]">{problem}</p>
          )}
          <Link href={bookHref} className={buttonClass("primary", "md", "mt-6 w-full")}>
            Book a shipment <Arrow />
          </Link>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-4 border-t border-line pt-4 @lg:flex-row @lg:items-end @lg:justify-between">
          <div aria-live="polite">
            <p className="text-[13px] text-ink-3">Estimated total</p>
            {quote ? (
              <p className="figures mt-1 text-[26px] font-medium leading-none text-ink">{usdCents(quote.total)}</p>
            ) : (
              <p className="mt-1.5 text-sm text-[#B42318]">{problem}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Dialog>
              <DialogTrigger disabled={!quote} className={buttonClass("outline", "md")}>
                Itemized quote
              </DialogTrigger>
              {quote && (
                <DialogContent className="gap-0 rounded-xl border-line bg-surface p-0 sm:max-w-md">
                  <DialogHeader className="border-b border-line px-6 pb-4 pt-6 text-left">
                    <DialogTitle className="type-display text-xl font-semibold text-ink">Itemized estimate</DialogTitle>
                    <DialogDescription className="text-[13px] text-ink-3">{summary}</DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
                    <QuoteBreakdown quote={quote} />
                  </div>
                  <div className="flex flex-col gap-3 border-t border-line px-6 py-5">
                    <p className="text-[13px] leading-relaxed text-ink-3">
                      The booking page prices your shipment from the same rate card. The total is fixed when you accept it.
                    </p>
                    <Link href={bookHref} className={buttonClass("primary", "md", "w-full")}>
                      Book a shipment <Arrow />
                    </Link>
                  </div>
                </DialogContent>
              )}
            </Dialog>
            <Link href={bookHref} className={buttonClass("primary", "md")}>
              Book a shipment <Arrow />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Vault storage estimate ─────────────────────────────────────────────

export function VaultEstimate() {
  const id = useId();
  const [type, setType] = useState("ALLOCATED");
  const [weight, setWeight] = useState("10");

  const kg = parse(weight);
  const valid = kg > 0 && kg <= 100000;
  const rate = STORAGE_TYPE_CONFIG[type].monthlyRatePerKg;
  const monthly = valid ? calculateMonthlyStorageFee(kg * 1000, type) : null;
  const minimumApplies = valid && kg * rate < MIN_MONTHLY_STORAGE_FEE;

  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-3 @xl:grid-cols-12">
        <Field label="Storage type" htmlFor={`${id}-type`} className="col-span-2 @xl:col-span-8">
          <SelectField id={`${id}-type`} value={type} onChange={setType}>
            {Object.entries(STORAGE_TYPE_CONFIG).map(([key, s]) => (
              <option key={key} value={key}>
                {s.label} ({usdCents(s.monthlyRatePerKg)} per kg a month)
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label="Weight (kg)" htmlFor={`${id}-weight`} className="col-span-2 @xl:col-span-4">
          <input id={`${id}-weight`} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className={cn(FIELD, "figures")} />
        </Field>
      </div>

      <div className="mt-5 flex flex-col gap-4 border-t border-line pt-4 @lg:flex-row @lg:items-end @lg:justify-between">
        <div aria-live="polite">
          <p className="text-[13px] text-ink-3">Monthly storage</p>
          {monthly !== null ? (
            <p className="figures mt-1 text-[26px] font-medium leading-none text-ink">{usdCents(monthly)}</p>
          ) : (
            <p className="mt-1.5 text-sm text-[#B42318]">Enter a weight above 0 kg.</p>
          )}
          <p className="mt-2 max-w-sm text-[13px] leading-snug text-ink-3">
            {minimumApplies ? `The ${usd(MIN_MONTHLY_STORAGE_FEE)} monthly minimum applies. ` : ""}
            Intake, assay and insurance are listed in the fee schedule.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <TextLink href="/vault#fees" className="text-sm">
            Fee schedule
          </TextLink>
          <Link href="/register" className={buttonClass("primary", "md")}>
            Open an account <Arrow />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Panel ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "track", label: "Track a shipment", short: "Track" },
  { id: "estimate", label: "Estimate a price", short: "Price" },
  { id: "vault", label: "Vault storage", short: "Vault" },
] as const;

export function TaskPanel({ className }: { className?: string }) {
  const [tab, setTab] = useState<string>("track");
  const [service, setService] = useState("secure_freight");
  const rootRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<HTMLSelectElement>(null);

  useEstimateEvent(setService, rootRef, serviceRef, () => setTab("estimate"));

  return (
    <MotionConfig reducedMotion="user">
      {/* Outer shell radius = inner panel 12px + 6px padding, so the curves stay concentric. */}
      <div
        id="task-panel"
        ref={rootRef}
        className={cn(
          "scroll-mt-28 rounded-[18px] bg-white/55 p-1.5 shadow-[0_28px_70px_-32px_rgba(15,29,47,0.5)] ring-1 ring-ink/10",
          className
        )}
      >
        <Tabs.Root value={tab} onValueChange={setTab} className="rounded-xl bg-surface shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-line">
          <Tabs.List aria-label="What do you need to do?" className="flex gap-1 border-b border-line px-2.5 sm:px-4">
            {TABS.map((t) => (
              <Tabs.Trigger
                key={t.id}
                value={t.id}
                className="relative h-12 rounded-t-md px-2.5 text-sm font-medium text-ink-3 transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-signal data-[state=active]:text-ink sm:px-3"
              >
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.label}</span>
                {tab === t.id && (
                  <motion.span
                    layoutId="task-panel-tab"
                    transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                    className="absolute inset-x-2.5 -bottom-px h-0.5 bg-signal sm:inset-x-3"
                  />
                )}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <div className="p-4 sm:min-h-[238px] sm:p-6">
            <Tabs.Content value="track" forceMount className="focus-visible:outline-none data-[state=inactive]:hidden">
              <TrackingForm />
              <p className="mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-ink-3">
                The tracking page shows status and route. Addresses, contacts and declared values are only shown to the account
                that booked.{" "}
                <Link href="/track" className="font-medium text-ink underline decoration-line-2 underline-offset-4 hover:decoration-ink">
                  Tracking help
                </Link>
              </p>
            </Tabs.Content>
            <Tabs.Content value="estimate" forceMount className="focus-visible:outline-none data-[state=inactive]:hidden">
              <EstimateForm service={service} onServiceChange={setService} selectRef={serviceRef} />
            </Tabs.Content>
            <Tabs.Content value="vault" forceMount className="focus-visible:outline-none data-[state=inactive]:hidden">
              <VaultEstimate />
            </Tabs.Content>
          </div>
        </Tabs.Root>
      </div>
    </MotionConfig>
  );
}

/** Standalone estimator with the itemized lines always visible (services page). */
export function EstimatorCard({ className }: { className?: string }) {
  const [service, setService] = useState("secure_freight");
  const rootRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<HTMLSelectElement>(null);
  useEstimateEvent(setService, rootRef, serviceRef);

  return (
    <div
      id="task-panel"
      ref={rootRef}
      className={cn("scroll-mt-28 rounded-xl border border-line bg-surface p-5 shadow-[0_24px_60px_-36px_rgba(15,29,47,0.45)] sm:p-7", className)}
    >
      <h2 className="type-display text-xl font-semibold text-ink">Estimate a price</h2>
      <p className="mt-1 text-sm text-ink-3">Calculated from the rate card on this page, the same way the booking page does it.</p>
      <div className="mt-6">
        <EstimateForm service={service} onServiceChange={setService} selectRef={serviceRef} inlineBreakdown />
      </div>
    </div>
  );
}
