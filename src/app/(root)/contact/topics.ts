// Topics offered on the contact form. The server action validates against
// the same list.
export const CONTACT_TOPICS = [
  "General question",
  "Booking or quote",
  "Tracking a shipment",
  "Vault services",
  "Billing",
  "Report a suspicious request",
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];
