// ─────────────────────────────────────────────────────────────────────────
// Demo / presentation deposit for Richard William Hiller.
//
// Creates one vault deposit row and links it to a client account, so signing
// into that account shows the record under "My vault". The extra presentation
// fields (depositor, origin, purpose, security/transaction codes, next of kin,
// flat demurrage, currency) are hardcoded in the repo at
// src/lib/vault/demo-deposits.ts, keyed by this deposit number, so no schema
// change is needed.
//
// Run against your database (e.g. Neon):
//   DATABASE_URL="postgresql://…neon…" node prisma/seed-demo.mjs
//
// The account below is created if missing; if it exists, its name and
// password are reset to CLIENT_NAME / DEFAULT_PASSWORD on every run.
// ─────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CLIENT_EMAIL = "mikasasha@aegiscargo.org";
const CLIENT_NAME = " Mika  Sasha";
const DEFAULT_PASSWORD = "Conway15#"; // set on every run (new or existing account)

const DEPOSIT_NUMBER = "VLT-2010-0082496"; // must match the key in demo-deposits.ts

const d2010 = (day) => new Date(Date.UTC(2010, 7, day)); // Aug 2010 (month is 0-based)

async function main() {
  // 1. Create the client account, or update its name/password to match this file.
  const existing = await prisma.user.findUnique({ where: { email: CLIENT_EMAIL } });
  const created = !existing;
  const password = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: CLIENT_EMAIL },
    update: { name: CLIENT_NAME, password },
    create: {
      name: CLIENT_NAME,
      email: CLIENT_EMAIL,
      phone: "+441000000000",
      password,
      role: "USER",
      profile: { create: {} },
    },
  });

  // 2. Replace any previous copy of this demo deposit (idempotent re-runs).
  await prisma.vaultDeposit.deleteMany({ where: { depositNumber: DEPOSIT_NUMBER } });

  // 3. Create the deposit, linked to the account.
  await prisma.vaultDeposit.create({
    data: {
      depositNumber: DEPOSIT_NUMBER,
      clientId: user.id,
      status: "IN_STORAGE",

      assetType: "GOLD_BAR",
      description: "230 gold bars",
      quantity: 230,
      weightGrams: 230000, // 230 × 1 kg bars (illustrative)
      purity: "97.96",
      serialNumbers: "WSC/28865721H",
      isLBMACertified: true,

      declaredValue: 290571880, // shown in GBP via demo-deposits.ts

      storageType: "ALLOCATED",
      vaultLocation: "Bucharest Main Vault",
      storageUnit: "A-01",

      intakeMethod: "CLIENT_DELIVERY",
      depositDate: d2010(18), // 17 August 2010
      kycApprovedAt: d2010(18),
      intakeCompletedAt: d2010(18),
      verifiedAt: d2010(19),
      storedAt: d2010(19),
      storageStartDate: d2010(19),

      // Insurance: the deposit page shows the policy when provider + policy no. are set.
      insuredValue: 290571880,
      insuranceProvider: "Aegis Cargo Underwriting",
      insurancePolicyNo: "ACU-2010-0082496",
      insuranceCoverage: "ALL_RISK",
      insuranceExpiryDate: new Date(Date.UTC(2027, 7, 18)), // 18 August 2027

      activities: {
        create: [
          {
            action: "KYC_SUBMITTED",
            description: `Vault deposit ${DEPOSIT_NUMBER} opened for ${CLIENT_NAME}. Asset: 230 gold bars. Purpose: safe keeping.`,
            performedBy: "Vault",
            createdAt: d2010(17),
          },
          {
            action: "PLACED_IN_STORAGE",
            description: "Asset placed in ALLOCATED storage at London Main Vault, unit A-01.",
            performedBy: "Vault",
            createdAt: d2010(18),
          },
          {
            action: "INSURANCE_ACTIVATED",
            description: "Insurance activated: ALL_RISK coverage via Aegis Cargo Underwriting. Policy: ACU-2010-0082496.",
            performedBy: "Vault",
            createdAt: d2010(18),
          },
        ],
      },
    },
  });

  console.log(`\n✓ Demo deposit ${DEPOSIT_NUMBER} linked to ${CLIENT_EMAIL}`);
  console.log(`  View it at:  /my-vault/${DEPOSIT_NUMBER}   (or My vault → the deposit)`);
  console.log(`\n  ${created ? "New account created" : "Existing account updated"}. Log in with:`);
  console.log(`    email:    ${CLIENT_EMAIL}`);
  console.log(`    password: ${DEFAULT_PASSWORD}`);
  console.log("");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("seed-demo failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
