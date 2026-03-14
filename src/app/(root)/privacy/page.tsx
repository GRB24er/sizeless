import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Aegis Cargo",
  description:
    "Learn how Aegis Cargo collects, uses, and protects your personal data. Your privacy matters to us.",
};

const sections = [
  {
    title: "1. Introduction",
    content:
      'Aegis Cargo ("we", "us", or "the Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our website, shipping, logistics, and vault storage services. By using our services, you consent to the practices described in this policy.',
  },
  {
    title: "2. Information We Collect",
    content:
      "We may collect the following types of personal information: contact details (name, email address, phone number, postal address), identity verification documents for vault and KYC services, shipment details including origin, destination, item descriptions, and declared values, payment and billing information, account credentials, communication records (emails, support tickets, chat messages), and technical data such as IP addresses, browser type, device information, and usage patterns collected through our website.",
  },
  {
    title: "3. How We Use Your Information",
    content:
      "We use your personal information to: process and manage shipments and vault storage services, verify your identity for regulatory compliance (KYC/AML), communicate with you regarding your orders, services, and support inquiries, process payments and invoices, improve our services, website functionality, and user experience, comply with legal and regulatory obligations, send service-related updates and, where you have opted in, marketing communications, and detect and prevent fraud or unauthorized access.",
  },
  {
    title: "4. Cookies and Tracking Technologies",
    content:
      "Our website uses cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and understand user behavior. Essential cookies are required for core website functionality. Analytics cookies help us understand how visitors interact with our site. You can manage cookie preferences through your browser settings. Disabling certain cookies may affect the functionality of our website.",
  },
  {
    title: "5. Third-Party Sharing",
    content:
      "We may share your personal information with: shipping carriers, customs brokers, and logistics partners necessary to fulfill your shipments, payment processors for transaction processing, identity verification providers for KYC and compliance purposes, legal and regulatory authorities when required by law, and professional advisors such as auditors and legal counsel. We do not sell your personal information to third parties. Any third parties with whom we share data are contractually obligated to protect your information and use it solely for the purposes specified.",
  },
  {
    title: "6. Data Security",
    content:
      "We implement industry-standard technical and organizational measures to protect your personal information, including: 256-bit SSL/TLS encryption for data in transit, encrypted storage for sensitive data at rest, role-based access controls limiting data access to authorized personnel, regular security assessments and vulnerability testing, and secure vault facilities with 24/7 monitoring for physical assets. While we strive to protect your data, no method of electronic transmission or storage is completely secure, and we cannot guarantee absolute security.",
  },
  {
    title: "7. Data Retention",
    content:
      "We retain your personal information only for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, resolve disputes, and enforce our agreements. Shipment records are retained for a minimum of seven years in accordance with regulatory requirements. You may request deletion of your account data, subject to our legal retention obligations.",
  },
  {
    title: "8. Your Rights",
    content:
      "Depending on your jurisdiction, you may have the right to: access the personal information we hold about you, request correction of inaccurate or incomplete data, request deletion of your personal data (subject to legal retention requirements), object to or restrict certain processing of your data, request portability of your data in a structured, machine-readable format, and withdraw consent for processing where consent is the legal basis. To exercise any of these rights, please contact us at admin@aegiscargo.org. We will respond to your request within 30 days.",
  },
  {
    title: "9. International Data Transfers",
    content:
      "As a global logistics provider, your personal information may be transferred to and processed in countries outside your country of residence. We ensure that appropriate safeguards are in place for such transfers in accordance with applicable data protection laws, including standard contractual clauses and adequacy decisions recognized by the European Commission.",
  },
  {
    title: "10. Children's Privacy",
    content:
      "Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe we have inadvertently collected data from a minor, please contact us immediately so we can take appropriate action.",
  },
  {
    title: "11. Changes to This Policy",
    content:
      "We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. The updated policy will be posted on this page with a revised date. We encourage you to review this policy periodically. Continued use of our services after changes constitutes acceptance of the updated policy.",
  },
  {
    title: "12. Contact Us",
    content:
      "If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your personal data, please contact our Data Protection team at admin@aegiscargo.org or write to us at Strada Bulevardul Unirii 72, Floor 3, Office 12, 030833 Bucharest, Romania. Phone: +44 020 1412 251.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] via-[#0F1D2F] to-[#0A1628]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#1E3A5F]/8 rounded-full blur-[150px]" />
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
            Privacy Policy
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how Aegis
            Cargo handles your personal data. Last updated: March 2026.
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
