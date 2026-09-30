import type { Metadata } from "next";
import { LegalDocument } from "@/components/landing/legal-document";

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
      "Shipment charges are calculated from our published rate card and shown to you, itemized, before you book. The total you accept at booking is the full price of that shipment and is payable before dispatch; we do not add hold, release, clearance, or any other charges afterwards. Vault fees are charged only at the rates in the published vault fee schedule shown to you before you deposit. We will never ask you to pay an additional fee to release a shipment or a vault-stored item. If anyone asks you to, do not pay and contact us at admin@aegiscargo.org. Price changes apply only to new bookings and deposits.",
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
    <LegalDocument
      title="Terms of Service"
      intro="Please read these terms carefully before using Aegis Cargo services. Last updated: March 2026."
      sections={sections}
    />
  );
}
