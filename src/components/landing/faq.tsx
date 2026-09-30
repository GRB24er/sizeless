import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export type FaqItem = { q: string; a: ReactNode };

export function Faq({ items, tone = "light" }: { items: FaqItem[]; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <Accordion type="single" collapsible className={cn("border-t", dark ? "border-white/15" : "border-ink/15")}>
      {items.map((item, i) => (
        <AccordionItem key={i} value={`q${i}`} className={cn(dark ? "border-white/15" : "border-ink/15")}>
          <AccordionTrigger
            className={cn(
              "py-5 font-display text-lg font-normal hover:no-underline sm:text-xl",
              dark ? "text-white [&>svg]:text-gold" : "text-ink [&>svg]:text-gold-deep"
            )}
          >
            {item.q}
          </AccordionTrigger>
          <AccordionContent className={cn("max-w-3xl pb-6 text-[15px] leading-relaxed", dark ? "text-slate-300" : "text-slate-600")}>
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
