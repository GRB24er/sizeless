// Presentation records hardcoded in the repo, keyed by deposit number. These
// add labelled fields to the client's deposit page that are not part of the
// core schema (depositor, origin, purpose, security/transaction codes, next of
// kin, a flat illustrative demurrage figure, and the display currency).
//
// The deposit ROW itself lives in the database and is created by
// `prisma/seed-demo.mjs`, linked to the client's account. This file only
// supplies the extra fields shown alongside it, so no schema change is needed.

export type DemoDeposit = {
  depositorName?: string;
  originCountry?: string;
  depositPurpose?: string;
  securityCode?: string;
  transactionCode?: string;
  nextOfKin?: string;
  /** Illustrative flat demurrage figure shown on the record, in `currencyCode`. */
  flatDemurrage?: number;
  /** ISO 4217 code used to display this deposit's money values (e.g. "GBP"). */
  currencyCode?: string;
};

export const DEMO_DEPOSITS: Record<string, DemoDeposit> = {
  "VLT-2010-0082496": {
    depositorName: "Richard William Hiller",
    originCountry: "Germany",
    depositPurpose: "Safe keeping",
    securityCode: "WSC/47183F",
    transactionCode: "0082496",
    nextOfKin: "Marsha Hiller",
    flatDemurrage: 500,
    currencyCode: "GBP",
  },
};

export const demoDeposit = (depositNumber: string): DemoDeposit | undefined => DEMO_DEPOSITS[depositNumber];

/** Display currency for a deposit: the demo currency if set, otherwise USD. */
export const depositCurrency = (depositNumber: string): string => DEMO_DEPOSITS[depositNumber]?.currencyCode ?? "USD";
