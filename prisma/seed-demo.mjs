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
// If the account below already exists it is linked as-is (password unchanged).
// If it does not exist, it is created with DEFAULT_PASSWORD and the script
// prints the login you can use.
// ─────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CLIENT_EMAIL = "richardwhiller@aegiscargo.org";
const CLIENT_NAME = "Richard William Hiller";
const DEFAULT_PASSWORD = "Conway15#"; // only used if the account does not exist yet

const DEPOSIT_NUMBER = "VLT-2010-0082496"; // must match the key in demo-deposits.ts

const d2010 = (day) => new Date(Date.UTC(2010, 7, day)); // Aug 2010 (month is 0-based)

async function main() {
  // 1. Find or create the client account.
  let user = await prisma.user.findUnique({ where: { email: CLIENT_EMAIL } });
  let created = false;
  if (!user) {
    const password = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    user = await prisma.user.create({
      data: {
        name: CLIENT_NAME,
        email: CLIENT_EMAIL,
        phone: "+441000000000",
        password,
        role: "USER",
        profile: { create: {} },
      },
    });
    created = true;
  }

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
      vaultLocation: "London Main Vault",
      storageUnit: "A-01",

      intakeMethod: "CLIENT_DELIVERY",
      depositDate: d2010(17), // 17 August 2010
      kycApprovedAt: d2010(17),
      intakeCompletedAt: d2010(17),
      verifiedAt: d2010(18),
      storedAt: d2010(18),
      storageStartDate: d2010(18),

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
        ],
      },
    },
  });

  console.log(`\n✓ Demo deposit ${DEPOSIT_NUMBER} linked to ${CLIENT_EMAIL}`);
  console.log(`  View it at:  /my-vault/${DEPOSIT_NUMBER}   (or My vault → the deposit)`);
  if (created) {
    console.log(`\n  New account created. Log in with:`);
    console.log(`    email:    ${CLIENT_EMAIL}`);
    console.log(`    password: ${DEFAULT_PASSWORD}`);
  } else {
    console.log(`\n  Linked to the existing ${CLIENT_EMAIL} account (password unchanged).`);
  }
  console.log("");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("seed-demo failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
