import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { SHIPPING_OPTIONS } from "@/app/(root)/shipments/create/type";
import { COMPANY } from "@/lib/company";

const COLUMNS = [
  {
    title: "Shipping",
    links: [
      ...SHIPPING_OPTIONS.map((o) => ({ label: o.label, href: "/services" })),
      { label: "Track a shipment", href: "/track" },
    ],
  },
  {
    title: "Vault",
    links: [
      { label: "Vault services", href: "/vault" },
      { label: "Fee schedule", href: "/vault#fees" },
      { label: "Open an account", href: "/register" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Support", href: "/support" },
      { label: "Contact", href: "/contact" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="bg-navy text-slate-300">
      <div className="h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block">
              <Image src="/images/logo.png" alt={COMPANY.name} width={64} height={64} className="rounded-lg" />
            </Link>
            <p className="mt-6 max-w-xs font-display text-xl leading-snug text-white">
              Secure shipping and custody, <em className="text-gold">priced before you commit.</em>
            </p>
            <div className="mt-8 space-y-3 text-sm">
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>{COMPANY.addressLines.map((l) => <span key={l} className="block">{l}</span>)}</span>
              </p>
              {COMPANY.phone && (
                <p className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-gold" />
                  <a href={`tel:${COMPANY.phone}`} className="hover:text-white">{COMPANY.phone}</a>
                </p>
              )}
              <p className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-gold" />
                <a href={`mailto:${COMPANY.email}`} className="hover:text-white">{COMPANY.email}</a>
              </p>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3 lg:col-span-8">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{col.title}</h3>
                <ul className="mt-5 space-y-3 text-sm">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-slate-400 transition-colors hover:text-white">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved.</p>
          <p>We never ask for release or clearance fees after booking.</p>
        </div>
      </div>
    </footer>
  );
};
