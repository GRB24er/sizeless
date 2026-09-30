import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export type FaqItem = { q: string; a: ReactNode };

export function Faq({ items, tone = "light" }: { items: FaqItem[]; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <Accordion type="single" collapsible className={cn("border-t", dark ? "border-white/15" : "border-line")}>
      {items.map((item, i) => (
        <AccordionItem key={i} value={`q${i}`} className={cn(dark ? "border-white/15" : "border-line")}>
          <AccordionTrigger
            className={cn(
              "items-center rounded-none py-5 text-[17px] font-medium hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal focus-visible:ring-0 [&>svg]:size-5 [&>svg]:translate-y-0",
              dark ? "text-white [&>svg]:text-[#A9B6C6]" : "text-ink [&>svg]:text-ink-3"
            )}
          >
            {item.q}
          </AccordionTrigger>
          <AccordionContent className={cn("max-w-[65ch] pb-6 text-[15px] leading-relaxed", dark ? "text-[#B7C3D1]" : "text-ink-2")}>
            {item.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
