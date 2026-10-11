// ─────────────────────────────────────────────────────────────────────────
// Demo / presentation deposits for Mika Sasha and Richard William Hiller.
//
// Creates vault deposit rows and links them to their client accounts, so signing
// into an account shows ONLY that specific record under "My vault". The extra presentation
// fields (depositor, origin, purpose, security/transaction codes, next of kin,
// flat demurrage, currency) are hardcoded in the repo at
// src/lib/vault/demo-deposits.ts, keyed by these deposit numbers, so no schema
// change is needed.
//
// Run against your database (e.g. Neon):
//   DATABASE_URL="postgresql://…neon…" node prisma/seed-demo.mjs
// ─────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Helper date utilities
const d2010 = (day) => new Date(Date.UTC(2010, 7, day)); // Aug 2010
const d2026 = (day) => new Date(Date.UTC(2026, 9, day)); // Oct 2026

async function main() {
  const hashedPassword = await bcrypt.hash("Conway15#", 12);

  // ==========================================
  // USER 1: MIKA SASHA
  // ==========================================
  const EMAIL_1 = "mikasasha@aegiscargo.org";
  const NAME_1 = " Mika  Sasha Aleksandr";
  const DEPOSIT_NUMBER_1 = "VLT-2010-0082496";

  const user1 = await prisma.user.upsert({
    where: { email: EMAIL_1 },
    update: { name: NAME_1, password: hashedPassword },
    create: {
      name: NAME_1,
      email: EMAIL_1,
      phone: "+441000000000",
      password: hashedPassword,
      role: "USER",
      profile: { create: {} },
    },
  });

  await prisma.vaultDeposit.deleteMany({ where: { depositNumber: DEPOSIT_NUMBER_1 } });
  await prisma.vaultDeposit.create({
    data: {
      depositNumber: DEPOSIT_NUMBER_1,
      clientId: user1.id,
      status: "IN_STORAGE",
      assetType: "GOLD_BAR",
      description: "80 gold bars",
      quantity: 80,
      weightGrams: 80000,
      purity: "97.96",
      serialNumbers: "WSC/28865721H",
      isLBMACertified: true,
      declaredValue: 170000000,
      storageType: "ALLOCATED",
      vaultLocation: "Bucharest Main Vault",
      storageUnit: "A-01",
      intakeMethod: "CLIENT_DELIVERY",
      depositDate: d2010(17),
      kycApprovedAt: d2010(17),
      intakeCompletedAt: d2010(18),
      verifiedAt: d2010(18),
      storedAt: d2010(18),
      storageStartDate: d2010(18),
      insuredValue: 170000000,
      insuranceProvider: "Aegis Cargo Underwriting",
      insurancePolicyNo: "ACU-2010-0082496",
      insuranceCoverage: "ALL_RISK",
      insuranceExpiryDate: new Date(Date.UTC(2028, 7, 18)),
      activities: {
        create: [
          {
            action: "KYC_SUBMITTED",
            description: `Vault deposit ${DEPOSIT_NUMBER_1} opened for ${NAME_1}. Asset: 80 gold bars. Purpose: safe keeping.`,
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
            description: `Insurance activated: ALL_RISK coverage via Aegis Cargo Underwriting. Policy: ACU-2010-0082496.`,
            performedBy: "Vault",
            createdAt: d2010(18),
          },
        ],
      },
    },
  });

  console.log(`✓ Demo deposit ${DEPOSIT_NUMBER_1} linked to ${EMAIL_1}`);

  // ==========================================
  // USER 2: RICHARD WILLIAM HILLER (New UK/Pounds Account)
  // ==========================================
  const EMAIL_2 = "richard.hiller@aegiscargo.org";
  const NAME_2 = "Richard William Hiller";
  const DEPOSIT_NUMBER_2 = "VLT-2026-0041295"; // Unique deposit number for Richard

  const user2 = await prisma.user.upsert({
    where: { email: EMAIL_2 },
    update: { name: NAME_2, password: hashedPassword },
    create: {
      name: NAME_2,
      email: EMAIL_2,
      phone: "+442079460192",
      password: hashedPassword,
      role: "USER",
      profile: { create: {} },
    },
  });

  await prisma.vaultDeposit.deleteMany({ where: { depositNumber: DEPOSIT_NUMBER_2 } });
  await prisma.vaultDeposit.create({
    data: {
      depositNumber: DEPOSIT_NUMBER_2,
      clientId: user2.id, // Linked strictly to Richard's login session
      status: "IN_STORAGE",
      assetType: "Gold Bars",
      description: "230 Gold bars",
      quantity: 230,
      weightGrams: 230000, 
      purity: "97.96",
      serialNumbers: "WSC/28865721H",
      isLBMACertified: true,
      declaredValue: 291694280, // Evaluated in GBP display
      storageType: "ALLOCATED",
      vaultLocation: "London Main Vault",
      storageUnit: "B-12",
      intakeMethod: "CLIENT_DELIVERY",
      depositDate: d2010(17),
      kycApprovedAt: d2010(17),
      intakeCompletedAt: d2010(18),
      verifiedAt: d20210(18),
      storedAt: d2010(18),
      storageStartDate: d2010(18),
      insuredValue: 291694280,
      insuranceProvider: "Aegis Cargo Underwriting",
      insurancePolicyNo: "ACU-2026-0041295",
      insuranceCoverage: "ALL_RISK",
      insuranceExpiryDate: new Date(Date.UTC(2027, 9, 2)), 
      activities: {
        create: [
          {
            action: "KYC_SUBMITTED",
            description: `Vault deposit ${DEPOSIT_NUMBER_2} opened for ${NAME_2}. Asset: 500 silver bars. Purpose: Asset Protection.`,
            performedBy: "Vault",
            createdAt: d2010(17),
          },
          {
            action: "PLACED_IN_STORAGE",
            description: "Asset placed in ALLOCATED storage at London Main Vault, unit B-12.",
            performedBy: "Vault",
            createdAt: d2010(18),
          },
          {
            action: "INSURANCE_ACTIVATED",
            description: `Insurance activated: ALL_RISK coverage via Aegis Cargo Underwriting. Policy: ACU-2026-0041295.`,
            performedBy: "Vault",
            createdAt: d2010(18),
          },
        ],
      },
    },
  });

  console.log(`✓ Demo deposit ${DEPOSIT_NUMBER_2} linked to ${EMAIL_2}`);
  console.log(`\nAll demo accounts are ready. Logins use password: Conway15#`);
}

main()
  .then(() => prisma.\$disconnect())
  .catch(async (e) => {
    console.error("seed-demo failed:", e);
    await prisma.\$disconnect();
    process.exit(1);
  });
