import { calculateShipmentQuote, QUOTE_GROUPS } from "@/app/(root)/shipments/create/type";
import { FixedPriceSeal, usd } from "./primitives";

// An example itemized quote, calculated from the live rate card, so the
// numbers shown on the homepage are exactly what the booking page produces.
const EXAMPLE = {
  service: "secure_freight",
  packages: [
    { weight: 1, declaredValue: 75000, insurance: true },
    { weight: 1, declaredValue: 75000, insurance: true },
  ],
};

export function ExampleQuoteCard() {
  const quote = calculateShipmentQuote(EXAMPLE.packages, EXAMPLE.service);
  if (!quote) return null;

  return (
    <div className="relative">
      <div className="rounded-2xl border border-white/10 bg-ivory p-6 text-ink shadow-2xl shadow-black/40 sm:p-7">
        <div className="border-b border-ink/10 pb-4 pr-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-deep">Example quote</p>
          <p className="mt-1 font-display text-xl">{quote.option.label}</p>
          <p className="mt-1 text-xs text-slate-500">
            2 kg in 2 packages · {usd(quote.totalDeclaredValue)} declared · insured · {quote.option.transitDays}
          </p>
        </div>

        <div className="space-y-4 py-4">
          {QUOTE_GROUPS.map((group) => {
            const lines = quote.lines.filter((l) => l.group === group);
            if (lines.length === 0) return null;
            return (
              <div key={group}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{group}</p>
                <dl className="space-y-1">
                  {lines.map((l) => (
                    <div key={l.label} className="flex items-baseline justify-between gap-4 text-[13px]">
                      <dt className="text-slate-600">{l.label}</dt>
                      <dd className="tabular-nums text-ink">{usd(l.amount)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })}
        </div>

        <div className="flex items-end justify-between border-t border-ink/15 pt-4">
          <div>
            <p className="whitespace-nowrap text-[11px] uppercase tracking-[0.16em] text-slate-500">Total · fixed at booking</p>
            <p className="font-display text-3xl tabular-nums">{usd(quote.total)}</p>
          </div>
          <p className="max-w-[8rem] text-right text-[11px] leading-snug text-slate-500">
            Calculated from our published rate card
          </p>
        </div>
      </div>
      <FixedPriceSeal className="absolute -right-2 -top-10 h-20 w-20 drop-shadow-xl sm:-right-7 sm:-top-9 sm:h-24 sm:w-24" />
    </div>
  );
}
