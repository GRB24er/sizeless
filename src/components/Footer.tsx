import Link from "next/link";
import { SHIPPING_OPTIONS } from "@/app/(root)/shipments/create/type";
import { COMPANY } from "@/lib/company";
import { Logo } from "./logo";
import { formatPhone } from "./landing/primitives";

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
    <footer className="bg-navy text-[#B7C3D1]">
      <div className="mx-auto w-full max-w-7xl px-5 pb-10 pt-16 sm:px-8 lg:px-10 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo tone="light" />
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed">
              Secure shipping and precious-metals custody, priced from a published rate card.
            </p>
            <address className="mt-8 text-[15px] not-italic leading-relaxed">
              {COMPANY.addressLines.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </address>
            <div className="mt-4 space-y-1 text-[15px]">
              {COMPANY.phone && (
                <a href={`tel:${COMPANY.phone}`} className="block w-fit tabular-nums text-white hover:underline">
                  {formatPhone(COMPANY.phone)}
                </a>
              )}
              <a href={`mailto:${COMPANY.email}`} className="block w-fit text-white hover:underline">
                {COMPANY.email}
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="grid gap-10 sm:grid-cols-3 lg:col-span-7 lg:col-start-6">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h2 className="text-[13px] font-semibold text-white">{col.title}</h2>
                <ul className="mt-4 space-y-3 text-[15px]">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link href={l.href} className="transition-colors duration-150 hover:text-white">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-[13px] text-[#8E9CAE] sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </p>
          <p>We never ask for payment to release a shipment.</p>
        </div>
      </div>
    </footer>
  );
};
