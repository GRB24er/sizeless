import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Aegis Cargo",
  description:
    "Read the Terms of Service for Aegis Cargo shipping and vault storage services. Governing law: Romania.",
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    content:
      'By accessing or using the services provided by Aegis Cargo ("the Company"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our services. These terms apply to all users, clients, and any parties engaging with Aegis Cargo for shipping, logistics, or vault storage services.',
  },
  {
    title: "2. Services Overview",
    content:
      "Aegis Cargo provides international and domestic shipping, freight forwarding, customs clearance, warehousing, and secure vault storage services. The availability, pricing, and scope of specific services may vary by region and are subject to change at the Company's discretion. Service-level agreements, where applicable, will be outlined in separate contractual documents.",
  },
  {
    title: "3. Shipping Terms",
    content:
      "All shipments are subject to applicable local and international regulations, including customs and import/export laws. The sender is responsible for ensuring that all items shipped comply with the laws of the origin, transit, and destination countries. Aegis Cargo reserves the right to inspect, hold, or refuse any shipment that is suspected of containing prohibited, restricted, or hazardous materials. Delivery timelines are estimates and are not guaranteed. Delays caused by customs, weather, force majeure, or carrier-related issues are beyond the Company's control.",
  },
  {
    title: "4. Vault Storage Services",
    content:
      "Aegis Cargo offers secure vault storage for precious metals, documents, and other high-value items. Access to vault services requires identity verification and completion of applicable Know Your Customer (KYC) procedures. Stored items must be lawfully owned and declared accurately. The Company is not responsible for verifying the provenance of items deposited into vault storage. Withdrawal of vault items is subject to processing times and applicable verification steps.",
  },
  {
    title: "5. Limitation of Liability",
    content:
      "To the maximum extent permitted by law, Aegis Cargo shall not be held liable for any indirect, incidental, special, consequential, or punitive damages arising from the use of our services. Our total liability for any claim related to a shipment or vault storage is limited to the declared value of the goods at the time of service engagement, or the applicable insurance coverage, whichever is lower. The Company is not liable for losses due to incorrect or incomplete information provided by the client.",
  },
  {
    title: "6. Insurance",
    content:
      "Aegis Cargo offers optional insurance coverage for shipments and vault-stored items. Insurance terms, premiums, and coverage limits are outlined in the applicable insurance policy documents. Claims must be filed within the time limits specified in the policy. Failure to declare accurate values may result in reduced or denied claims. Insurance is subject to standard exclusions including, but not limited to, acts of war, natural disasters, and governmental actions.",
  },
  {
    title: "7. Payment Terms",
    content:
      "All fees and charges for services rendered are due in accordance with the payment terms specified in the service agreement or invoice. Late payments may be subject to interest charges and service suspension. Aegis Cargo reserves the right to hold shipments or vault-stored items until all outstanding balances are settled. Pricing is subject to change; however, any price changes will not affect services already in progress under an existing agreement.",
  },
  {
    title: "8. Privacy",
    content:
      "Your use of our services is also governed by our Privacy Policy, which outlines how we collect, use, and protect your personal data. By using our services, you consent to the data practices described in the Privacy Policy. For full details, please refer to the Privacy Policy page on our website.",
  },
  {
    title: "9. Governing Law",
    content:
      "These Terms of Service are governed by and construed in accordance with the laws of Romania. Any disputes arising from or related to these terms or the use of Aegis Cargo services shall be subject to the exclusive jurisdiction of the courts located in Bucharest, Romania. If any provision of these terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.",
  },
  {
    title: "10. Changes to Terms",
    content:
      "Aegis Cargo reserves the right to update or modify these Terms of Service at any time. Changes will be effective upon posting on our website. Continued use of our services after any modifications constitutes your acceptance of the revised terms. We encourage you to review this page periodically for the latest information.",
  },
  {
    title: "11. Contact",
    content:
      "If you have questions or concerns regarding these Terms of Service, please contact us at admin@aegiscargo.org or write to us at Strada Bulevardul Unirii 72, Floor 3, Office 12, 030833 Bucharest, Romania.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] via-[#0F1D2F] to-[#0A1628]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#1E3A5F]/8 rounded-full blur-[150px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(140,158,175,0.4) 1px, transparent 0)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E3A5F]/20 border border-[#1E3A5F]/30 mb-6">
            <span className="text-sm font-medium text-[#B3C7DB]">Legal</span>
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Please read these terms carefully before using Aegis Cargo services.
            Last updated: March 2026.
          </p>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 sm:p-12">
            <div className="space-y-10">
              {sections.map((section) => (
                <div key={section.title}>
                  <h2 className="text-xl font-semibold text-white mb-3">
                    {section.title}
                  </h2>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
