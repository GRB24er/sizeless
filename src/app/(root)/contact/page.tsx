import type { Metadata } from "next";
import { PageHero } from "@/components/landing/page-hero";
import { Container, SectionHeading, TextLink } from "@/components/landing/primitives";
import { Reveal } from "@/components/landing/reveal";
import { ContactDetails } from "@/components/landing/home";
import { ContactForm } from "@/components/landing/contact-form";

export const metadata: Metadata = {
  title: "Contact | Aegis Cargo",
  description: "Contact the Aegis Cargo team about a booking, a tracking number or a vault deposit.",
};

const BEFORE_YOU_WRITE = [
  {
    title: "Following a shipment?",
    text: "The tracking page shows its status and every logged handover, usually faster than an email.",
    link: { href: "/track", label: "Track a shipment" },
  },
  {
    title: "Asked to pay a release fee?",
    text: "Don't pay. Choose “Report a suspicious request” and paste in the message you received.",
  },
  {
    title: "Vault client?",
    text: "Include your deposit number so we can find your account straight away.",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contact us"
        intro="Questions about a booking, a tracking number or a vault deposit? Send a message and the team will reply by email."
        aside={
          <div className="rounded-xl border border-line bg-surface p-6 sm:p-8">
            <ContactDetails />
          </div>
        }
      />

      <section className="border-t border-line bg-surface py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal>
              <SectionHeading title="Send a message" />
            </Reveal>
            <Reveal delay={80} className="mt-8">
              <ContactForm />
            </Reveal>
          </div>

          <Reveal delay={140} as="aside" className="lg:col-span-4 lg:col-start-9 lg:pt-20">
            <h2 className="text-[15px] font-semibold text-ink">Before you write</h2>
            <ul className="mt-4 border-t border-line">
              {BEFORE_YOU_WRITE.map((item) => (
                <li key={item.title} className="border-b border-line py-5">
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{item.text}</p>
                  {item.link && (
                    <TextLink href={item.link.href} arrow className="mt-3 text-sm">
                      {item.link.label}
                    </TextLink>
                  )}
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
