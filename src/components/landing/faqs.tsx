import Link from "next/link";
import { FEE_SCHEDULE } from "@/app/(root)/shipments/create/type";
import { STORAGE_TYPE_CONFIG, VAULT_FEE_SCHEDULE } from "@/lib/vault/types";
import { COMPANY } from "@/lib/company";
import { FaqItem } from "./faq";

// Question-and-answer content shared by the home, services, track, vault and
// support pages.

const link = "font-medium text-ink underline decoration-line-2 underline-offset-4 hover:decoration-ink";

export const TRACKING_FAQ: FaqItem[] = [
  {
    q: "Where do I find my tracking number?",
    a: (
      <>
        It&apos;s in your booking confirmation email and in{" "}
        <Link href="/shipments/history" className={link}>
          My shipments
        </Link>
        . Tracking numbers start with LOX-.
      </>
    ),
  },
  {
    q: "Why can't I see addresses or the declared value?",
    a: "To protect the sender and recipient, those details are only shown to the account that booked the shipment. Sign in with that account to see them.",
  },
  {
    q: "How often is tracking updated?",
    a: "A new entry is logged each time the shipment is picked up, departs or arrives at a facility. The sender and recipient receive an email with each update.",
  },
  {
    q: "My shipment shows “On hold”. Do I need to pay anything?",
    a: (
      <>
        No. Holds happen for operational reasons, such as a documentation or address check. We never ask for a payment to
        release a shipment, because the price was fixed at booking. If anyone asks you to pay, don&apos;t, and write to{" "}
        <a href={`mailto:${COMPANY.email}`} className={link}>
          {COMPANY.email}
        </a>
        .
      </>
    ),
  },
  {
    q: "Can I download the air waybill?",
    a: "Yes. When you're signed in with the account that booked the shipment, open its tracking page and use the Documents tab.",
  },
];

export const PRICING_FAQ: FaqItem[] = [
  {
    q: "Can the price change after I book?",
    a: "No. When you book, we recalculate the total from the rate card, check it matches the one you accepted, and store it with your shipment. We don't add hold, release, clearance or any other charges afterwards.",
  },
  {
    q: "What's included in the quote?",
    a: "Base freight, a per-kilogram rate, a security escort where the service includes one, vault handling, tamper-evident seals, an export permit, customs brokerage, estimated import duty and, if you choose it, insurance. Each appears as its own line before you accept.",
  },
  {
    q: "How is import duty handled?",
    a: `Estimated import duty (${FEE_SCHEDULE.customsDutyRate * 100}% of declared value) is a line in your quote, so we never collect duty from you or your recipient after booking.`,
  },
  {
    q: "Who can see my shipment details?",
    a: "Anyone with the tracking number can see the status and the route. Street addresses, contact details and declared values are shown only to the account that booked the shipment.",
  },
  {
    q: "What if someone asks me to pay to release a shipment?",
    a: (
      <>
        Don&apos;t pay. We never ask for release, clearance or hold fees after booking. Please forward the message to{" "}
        <a href={`mailto:${COMPANY.email}`} className="font-medium text-ink underline decoration-line-2 underline-offset-4 hover:decoration-ink">
          {COMPANY.email}
        </a>
        .
      </>
    ),
  },
  {
    q: "How do vault fees work?",
    a: "Storage is charged monthly per kilogram at the published rate for your storage type. Intake, assay, insurance and release fees are listed on the deposit form before you submit, and invoices are generated only from that list.",
  },
];

export const VAULT_FAQ: FaqItem[] = [
  {
    q: "Who can open a vault account?",
    a: "Anyone who passes our identity and source-of-funds checks. You'll need a government ID, a proof-of-address document and evidence of where the metal came from, such as a purchase invoice.",
  },
  {
    q: "What's the difference between allocated, segregated and unallocated storage?",
    a: (
      <ul className="space-y-2">
        {Object.values(STORAGE_TYPE_CONFIG).map((s) => (
          <li key={s.label}>
            <span className="font-medium text-ink">{s.label}:</span> {s.description}
          </li>
        ))}
      </ul>
    ),
  },
  {
    q: "Is my deposit insured?",
    a: "Insurance is optional and priced from the schedule on this page. When cover is in place, your insurance certificate names the insurer and the policy number so you can verify it with them directly.",
  },
  {
    q: "How do I get my metal back?",
    a: "Request a release from your account: physical collection, sale through a bullion dealer, or transfer to another vault. The fee for each is in the schedule you accepted when you deposited.",
  },
  {
    q: "What is demurrage, and when would I pay it?",
    a: `Demurrage is a late-collection charge. Once we approve a withdrawal, you have ${VAULT_FEE_SCHEDULE.demurrageFreeDays} days to collect at no extra cost. Metal still in the vault after that is charged $${VAULT_FEE_SCHEDULE.demurrageRatePerKgPerDay.toFixed(2)} per kilogram per day (minimum $${VAULT_FEE_SCHEDULE.demurrageMinPerDay.toFixed(2)} a day) until you collect it. It is separate from monthly storage, it is on the fee schedule you accept when you deposit, and your account shows it building up day by day so there is never a surprise.`,
  },
  {
    q: "Will you ever ask me to pay to release my holdings?",
    a: (
      <>
        Only the release fees shown in the published schedule. We never ask for any other payment to release metal. If someone
        does, don&apos;t pay, and write to{" "}
        <a href={`mailto:${COMPANY.email}`} className="font-medium text-ink underline decoration-line-2 underline-offset-4 hover:decoration-ink">
          {COMPANY.email}
        </a>
        .
      </>
    ),
  },
];
