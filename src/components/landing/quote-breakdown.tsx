import { QUOTE_GROUPS, ShipmentQuote } from "@/app/(root)/shipments/create/type";
import { cn } from "@/lib/utils";
import { usdCents } from "./primitives";

/** Itemized lines of a quote from calculateShipmentQuote, grouped as on the booking page. */
export function QuoteBreakdown({ quote, className }: { quote: ShipmentQuote; className?: string }) {
  return (
    <div className={cn("text-sm", className)}>
      {QUOTE_GROUPS.map((group) => {
        const lines = quote.lines.filter((l) => l.group === group);
        if (lines.length === 0) return null;
        return (
          <div key={group} className="border-b border-line py-3.5 first:pt-0">
            <p className="text-[13px] font-semibold text-ink">{group}</p>
            <dl className="mt-2 space-y-1.5">
              {lines.map((l) => (
                <div key={l.label} className="flex items-baseline justify-between gap-6">
                  <dt className="text-ink-2">{l.label}</dt>
                  <dd className="figures shrink-0 text-ink">{usdCents(l.amount)}</dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}
      <div className="flex items-baseline justify-between gap-6 pt-3.5">
        <span className="font-semibold text-ink">Total</span>
        <span className="figures text-xl font-medium text-ink">{usdCents(quote.total)}</span>
      </div>
    </div>
  );
}
