import type { Metadata } from "next";
import Link from "next/link";
import { ComponentType } from "react";
import { LockKeyhole, MessagesSquare, PackageSearch, Receipt, Send, ShieldAlert } from "lucide-react";
import { COMPANY } from "@/lib/company";
import { PageHero } from "@/components/landing/page-hero";
import { Container } from "@/components/landing/primitives";
import { Reveal } from "@/components/landing/reveal";
import { ChatButton } from "@/components/landing/chat-button";
import { HomeFaq, ClosingCta } from "@/components/landing/home";
import { PRICING_FAQ, TRACKING_FAQ, VAULT_FAQ } from "@/components/landing/faqs";

export const metadata: Metadata = {
  title: "Support | Aegis Cargo",
  description: "Help with tracking, pricing and vault custody, and the quickest ways to reach the Aegis Cargo team.",
};

type Help = { icon: ComponentType<{ className?: string; strokeWidth?: number }>; title: string; text: string } & (
  | { href: string }
  | { chat: true }
);

const HELP: Help[] = [
  { icon: PackageSearch, title: "Track a shipment", text: "Status, route and every logged handover.", href: "/track" },
  { icon: Receipt, title: "Prices and the rate card", text: "Every line that can appear on a quote.", href: "/services#rate-card" },
  { icon: LockKeyhole, title: "Vault fees", text: "The complete custody fee schedule.", href: "/vault#fees" },
  { icon: MessagesSquare, title: "Chat with the team", text: "Opens the chat window on this page.", chat: true },
  { icon: Send, title: "Send a message", text: "Write to the team and get a reply by email.", href: "/contact" },
  {
    icon: ShieldAlert,
    title: "Report a payment request",
    text: "Asked to pay to release a shipment? Don't pay. Tell us.",
    href: `mailto:${COMPANY.email}?subject=${encodeURIComponent("Suspicious payment request")}`,
  },
];

const SUPPORT_FAQ = [TRACKING_FAQ[0], TRACKING_FAQ[3], PRICING_FAQ[0], PRICING_FAQ[1], PRICING_FAQ[3], VAULT_FAQ[3]];

const ROW =
  "group flex w-full gap-4 border-t border-line py-6 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal";

export default function SupportPage() {
  return (
    <>
      <PageHero title="How can we help?" intro="Answers to common questions about tracking, pricing and vault custody, and the quickest ways to reach the team." />

      <section className="bg-canvas pb-20 sm:pb-28">
        <Container>
          <Reveal as="ul" className="grid gap-x-12 border-b border-line sm:grid-cols-2">
            {HELP.map((h) => {
              const Icon = h.icon;
              const body = (
                <>
                  <Icon aria-hidden strokeWidth={1.5} className="mt-0.5 size-6 shrink-0 text-signal-ink" />
                  <span>
                    <span className="block text-[17px] font-semibold text-ink underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-ink/40">
                      {h.title}
                    </span>
                    <span className="mt-1 block text-[15px] text-ink-2">{h.text}</span>
                  </span>
                </>
              );
              return (
                <li key={h.title}>
                  {"chat" in h ? (
                    <ChatButton className={ROW}>{body}</ChatButton>
                  ) : h.href.startsWith("mailto:") ? (
                    <a href={h.href} className={ROW}>
                      {body}
                    </a>
                  ) : (
                    <Link href={h.href} className={ROW}>
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </Reveal>
        </Container>
      </section>

      <HomeFaq title="Common questions" items={SUPPORT_FAQ} />
      <ClosingCta />
    </>
  );
}
