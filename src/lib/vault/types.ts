// ═══════════════════════════════════════════════════════════════
// src/lib/vault/types.ts
// Vault Custody Service — Types, Labels, Fee Schedule
// ═══════════════════════════════════════════════════════════════

// ─── STATUS LABELS & COLORS ──────────────────────────────────

export const VAULT_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bgColor: string; description: string; phase: string }
> = {
  KYC_REVIEW: {
    label: "KYC Under Review",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
    description: "Client identity and AML screening in progress",
    phase: "Compliance",
  },
  KYC_APPROVED: {
    label: "KYC Approved",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
    description: "Client cleared for vault deposit",
    phase: "Compliance",
  },
  KYC_REJECTED: {
    label: "KYC Rejected",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
    description: "Client did not pass compliance screening",
    phase: "Compliance",
  },
  INTAKE_SCHEDULED: {
    label: "Intake Scheduled",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    description: "Appointment set for secure handover",
    phase: "Intake",
  },
  INTAKE_IN_PROGRESS: {
    label: "Intake In Progress",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
    description: "Asset being received at vault facility",
    phase: "Intake",
  },
  PENDING_VERIFICATION: {
    label: "Pending Verification",
    color: "text-purple-700",
    bgColor: "bg-purple-50 border-purple-200",
    description: "Awaiting physical inspection and assay testing",
    phase: "Verification",
  },
  ASSAY_IN_PROGRESS: {
    label: "Assay In Progress",
    color: "text-purple-700",
    bgColor: "bg-purple-50 border-purple-200",
    description: "XRF / ultrasound / fire assay testing underway",
    phase: "Verification",
  },
  VERIFICATION_COMPLETE: {
    label: "Verification Complete",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
    description: "Asset verified — ready for storage allocation",
    phase: "Verification",
  },
  DOCUMENTED: {
    label: "Documented",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50 border-indigo-200",
    description: "All custody documents issued, insurance active",
    phase: "Documentation",
  },
  IN_STORAGE: {
    label: "In Secure Storage",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
    description: "Asset secured in vault — custody active",
    phase: "Storage",
  },
  RELEASE_REQUESTED: {
    label: "Release Requested",
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200",
    description: "Client has requested withdrawal or liquidation",
    phase: "Withdrawal",
  },
  RELEASE_APPROVED: {
    label: "Release Approved",
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200",
    description: "Compliance cleared, pending physical release",
    phase: "Withdrawal",
  },
  RELEASED: {
    label: "Released",
    color: "text-gray-700",
    bgColor: "bg-gray-50 border-gray-200",
    description: "Asset has left the vault",
    phase: "Closed",
  },
  LIQUIDATION_IN_PROGRESS: {
    label: "Liquidation In Progress",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
    description: "Being sold via authorized bullion dealer",
    phase: "Withdrawal",
  },
  LIQUIDATED: {
    label: "Liquidated",
    color: "text-gray-700",
    bgColor: "bg-gray-50 border-gray-200",
    description: "Sold — funds transferred to client",
    phase: "Closed",
  },
  SUSPENDED: {
    label: "Suspended",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
    description: "Account or asset frozen pending review",
    phase: "Suspended",
  },
};

// ─── ASSET TYPES ─────────────────────────────────────────────

export const ASSET_TYPE_LABELS: Record<string, string> = {
  GOLD_BAR: "Gold Bar / Ingot (LBMA Good Delivery)",
  GOLD_KILOBAR: "Gold Kilobar (1 kg)",
  GOLD_COINS: "Gold Coins / Numismatic",
  GOLD_DUST: "Gold Dust / Granules",
  GOLD_DORE: "Gold Doré (Unrefined)",
  SILVER_BAR: "Silver Bar / Bullion",
  PLATINUM: "Platinum",
  PALLADIUM: "Palladium",
  JEWELRY: "Jewelry / Finished Goods",
  PRECIOUS_STONES: "Precious Stones / Gemstones",
  MIXED: "Mixed Precious Metals",
};

// ─── PURITY OPTIONS ──────────────────────────────────────────

export const PURITY_OPTIONS = [
  { value: "99.99", label: "99.99% — Four Nines Fine (LBMA)" },
  { value: "99.9",  label: "99.9% — Three Nines Fine" },
  { value: "99.5",  label: "99.5% — London Good Delivery Minimum" },
  { value: "99.0",  label: "99.0%" },
  { value: "91.6",  label: "91.6% — 22 Karat" },
  { value: "75.0",  label: "75.0% — 18 Karat" },
  { value: "58.5",  label: "58.5% — 14 Karat" },
  { value: "37.5",  label: "37.5% — 9 Karat" },
  { value: "dore",  label: "Doré / Unrefined (variable)" },
];

// ─── STORAGE TYPE CONFIG ─────────────────────────────────────

export const STORAGE_TYPE_CONFIG: Record<
  string,
  { label: string; description: string; monthlyRatePerKg: number }
> = {
  ALLOCATED: {
    label: "Allocated Storage",
    description:
      "Specific bars assigned to you. Serial numbers recorded. Your gold is identifiable and legally yours at all times. Most secure and transparent.",
    monthlyRatePerKg: 3.50,
  },
  SEGREGATED: {
    label: "Segregated Storage",
    description:
      "Your gold stored in a separate compartment, physically apart from other clients' holdings. Not bar-specific but isolated.",
    monthlyRatePerKg: 2.75,
  },
  UNALLOCATED: {
    label: "Unallocated Storage",
    description:
      "You own a claim on the gold pool, not specific bars. Lower cost but you are an unsecured creditor of the vault. Used by some bullion banks.",
    monthlyRatePerKg: 1.25,
  },
};

// ─── ASSAY METHODS ───────────────────────────────────────────

export const ASSAY_METHODS = [
  {
    id: "XRF",
    label: "X-Ray Fluorescence (XRF)",
    description: "Non-destructive surface analysis. Fast, accurate to 99.9%. Standard for certified bars.",
    cost: 150,
    turnaround: "Same day",
  },
  {
    id: "ULTRASOUND",
    label: "Ultrasound Density Scan",
    description: "Detects tungsten cores or internal defects. Non-destructive. Used alongside XRF.",
    cost: 200,
    turnaround: "Same day",
  },
  {
    id: "FIRE_ASSAY",
    label: "Fire Assay (Cupellation)",
    description: "Destructive test, gold standard accuracy. Required for doré bars and unverified gold. Takes a small sample.",
    cost: 350,
    turnaround: "2–3 business days",
  },
  {
    id: "ICP_OES",
    label: "ICP-OES Spectroscopy",
    description: "Lab-grade trace element analysis. Used for refinery-grade verification.",
    cost: 500,
    turnaround: "3–5 business days",
  },
];

// ─── REALISTIC FEE SCHEDULE ──────────────────────────────────

export const VAULT_FEE_SCHEDULE = {
  // One-time fees
  kycProcessingFee: 75.00,
  intakeHandlingFee: 250.00,
  securityEscortFee: 450.00,         // Armed collection/delivery
  tamperSealFee: 45.00,              // Per container

  // Assay fees (see ASSAY_METHODS above for per-method costs)
  assayMinimumFee: 150.00,

  // Storage (monthly, per kg) — varies by storage type
  // See STORAGE_TYPE_CONFIG above

  // Insurance (annual rate as % of insured value)
  insuranceRates: {
    ALL_RISK: 0.12,      // 0.12% p.a. — covers theft, fire, fraud, disaster
    THEFT_FIRE: 0.08,    // 0.08% p.a.
    BASIC: 0.05,         // 0.05% p.a.
  },

  // Documentation
  depositReceiptFee: 0,              // Included
  storageAgreementFee: 0,            // Included
  insuranceCertificateFee: 0,        // Included
  custodyTransferFee: 175.00,        // When moving to another vault

  // Withdrawal
  physicalWithdrawalFee: 350.00,     // Handling + security clearance
  liquidationCommission: 0.50,       // 0.5% of sale value
  wireTransferFee: 35.00,
  complianceReReviewFee: 125.00,     // For large withdrawals > $500k

  // Demurrage (late collection). After a withdrawal is approved, collection is
  // free for demurrageFreeDays. Metal still in the vault after that window is
  // charged per kg per day until collected. Distinct from monthly storage; it
  // only applies once a release is approved and the free window has passed.
  demurrageFreeDays: 10,
  demurrageRatePerKgPerDay: 0.75,
  demurrageMinPerDay: 5.00,

  // Audit & Inspection
  clientAuditFee: 0,                 // First annual audit free
  additionalAuditFee: 200.00,
  physicalInspectionFee: 150.00,
};

// ─── INSURANCE COVERAGE OPTIONS ──────────────────────────────

export const INSURANCE_OPTIONS = [
  {
    id: "ALL_RISK",
    label: "All-Risk Coverage",
    description:
      "Comprehensive coverage: theft, fire, internal fraud, natural disasters, transit damage, political risk. Industry gold standard.",
    ratePercent: 0.12,
  },
  {
    id: "THEFT_FIRE",
    label: "Theft & Fire Coverage",
    description:
      "Covers theft (including employee theft), fire, and explosion. Does not cover natural disasters or political risk.",
    ratePercent: 0.08,
  },
  {
    id: "BASIC",
    label: "Basic Storage Coverage",
    description:
      "Basic coverage for loss due to vault facility failure. Limited to storage premises only.",
    ratePercent: 0.05,
  },
];

// ─── KYC DOCUMENT TYPES ─────────────────────────────────────

export const KYC_ID_TYPES = [
  { value: "PASSPORT", label: "Valid Passport" },
  { value: "DRIVERS_LICENSE", label: "Driver's License" },
  { value: "NATIONAL_ID", label: "National Identity Card" },
  { value: "RESIDENCE_PERMIT", label: "Residence Permit" },
];

export const KYC_ADDRESS_DOC_TYPES = [
  { value: "UTILITY_BILL", label: "Utility Bill (< 3 months)" },
  { value: "BANK_STATEMENT", label: "Bank Statement (< 3 months)" },
  { value: "GOV_LETTER", label: "Government Letter" },
  { value: "TAX_ASSESSMENT", label: "Tax Assessment Notice" },
];

export const KYC_SOURCE_OF_GOLD = [
  { value: "MINE_DIRECT", label: "Direct from Mine / Concession" },
  { value: "REFINERY", label: "Purchased from Licensed Refinery" },
  { value: "DEALER", label: "Purchased from Authorized Dealer" },
  { value: "INHERITANCE", label: "Inheritance / Estate" },
  { value: "INVESTMENT", label: "Investment Holdings" },
  { value: "VAULT_TRANSFER", label: "Transfer from Another Vault" },
  { value: "OTHER", label: "Other (provide documentation)" },
];

// ─── LIFECYCLE PHASES (for progress indicator) ───────────────

export const VAULT_LIFECYCLE_PHASES = [
  {
    phase: 1,
    key: "compliance",
    label: "KYC & Compliance",
    statuses: ["KYC_REVIEW", "KYC_APPROVED"],
    icon: "Shield",
  },
  {
    phase: 2,
    key: "intake",
    label: "Secure Intake",
    statuses: ["INTAKE_SCHEDULED", "INTAKE_IN_PROGRESS"],
    icon: "Truck",
  },
  {
    phase: 3,
    key: "verification",
    label: "Verification & Assay",
    statuses: ["PENDING_VERIFICATION", "ASSAY_IN_PROGRESS", "VERIFICATION_COMPLETE"],
    icon: "Search",
  },
  {
    phase: 4,
    key: "documentation",
    label: "Documentation",
    statuses: ["DOCUMENTED"],
    icon: "FileText",
  },
  {
    phase: 5,
    key: "storage",
    label: "Secure Storage",
    statuses: ["IN_STORAGE"],
    icon: "Lock",
  },
  {
    phase: 6,
    key: "withdrawal",
    label: "Withdrawal / Liquidation",
    statuses: [
      "RELEASE_REQUESTED",
      "RELEASE_APPROVED",
      "RELEASED",
      "LIQUIDATION_IN_PROGRESS",
      "LIQUIDATED",
    ],
    icon: "ArrowUpRight",
  },
];

// ─── DEPOSIT NUMBER GENERATOR ────────────────────────────────

export function generateDepositNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `ARL-VLT-${year}-${random}`;
}

export function generateCustodyReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "VLT-CUS-";
  for (let i = 0; i < 8; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

// ─── SUPPORTED CURRENCIES ───────────────────────────────────

export const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", label: "Euro", locale: "de-DE" },
  { code: "GBP", symbol: "£", label: "British Pound", locale: "en-GB" },
  { code: "CHF", symbol: "CHF", label: "Swiss Franc", locale: "de-CH" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham", locale: "ar-AE" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar", locale: "en-SG" },
  { code: "HKD", symbol: "HK$", label: "Hong Kong Dollar", locale: "en-HK" },
  { code: "ZAR", symbol: "R", label: "South African Rand", locale: "en-ZA" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar", locale: "en-AU" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar", locale: "en-CA" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen", locale: "ja-JP" },
  { code: "CNY", symbol: "¥", label: "Chinese Yuan", locale: "zh-CN" },
];

export function getCurrencyConfig(currencyCode: string) {
  return (
    SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) ??
    SUPPORTED_CURRENCIES[0] // Default to USD
  );
}

export function formatCurrencyAmount(amount: number, currencyCode: string = "USD"): string {
  const config = getCurrencyConfig(currencyCode);
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    minimumFractionDigits: 2,
  }).format(amount);
}

// ─── HELPER: Calculate monthly storage fee ───────────────────

export const MIN_MONTHLY_STORAGE_FEE = 25;
export const MIN_ANNUAL_INSURANCE_PREMIUM = 500;

export function calculateMonthlyStorageFee(
  weightGrams: number,
  storageType: string
): number {
  const weightKg = weightGrams / 1000;
  const config = STORAGE_TYPE_CONFIG[storageType];
  if (!config) return 0;
  return Math.max(weightKg * config.monthlyRatePerKg, MIN_MONTHLY_STORAGE_FEE);
}

// ─── HELPER: Demurrage (late collection) ─────────────────────
// After a withdrawal is approved, collection is free for DEMURRAGE_FREE_DAYS.
// Metal held past that is charged per kg per day (with a per-day minimum).

export const DEMURRAGE_FREE_DAYS = VAULT_FEE_SCHEDULE.demurrageFreeDays;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Whole days a release has waited past the free collection window. 0 within it. */
export function demurrageChargeableDays(
  releaseApprovedAt: Date | string | null | undefined,
  now: Date = new Date()
): number {
  if (!releaseApprovedAt) return 0;
  const elapsed = Math.floor((now.getTime() - new Date(releaseApprovedAt).getTime()) / MS_PER_DAY);
  return Math.max(0, elapsed - VAULT_FEE_SCHEDULE.demurrageFreeDays);
}

/** Demurrage per day for a weight: per-kg rate, with a per-day minimum. */
export function demurragePerDay(weightGrams: number): number {
  const perDay = (weightGrams / 1000) * VAULT_FEE_SCHEDULE.demurrageRatePerKgPerDay;
  return Math.max(Math.round(perDay * 100) / 100, VAULT_FEE_SCHEDULE.demurrageMinPerDay);
}

/** Total demurrage accrued for a weight over a number of chargeable days. */
export function calculateDemurrage(weightGrams: number, chargeableDays: number): number {
  if (chargeableDays <= 0) return 0;
  return Math.round(demurragePerDay(weightGrams) * chargeableDays * 100) / 100;
}

/** The date free collection ends, DEMURRAGE_FREE_DAYS after the release was approved. */
export function demurrageFreeUntil(releaseApprovedAt: Date | string): Date {
  const d = new Date(releaseApprovedAt);
  d.setDate(d.getDate() + VAULT_FEE_SCHEDULE.demurrageFreeDays);
  return d;
}

// ─── HELPER: Calculate annual insurance premium ──────────────

export function calculateAnnualInsurance(
  insuredValue: number,
  coverageType: string
): number {
  const rates = VAULT_FEE_SCHEDULE.insuranceRates;
  const rate =
    rates[coverageType as keyof typeof rates] ?? rates.ALL_RISK;
  return Math.max(insuredValue * (rate / 100), MIN_ANNUAL_INSURANCE_PREMIUM);
}

// ─── PUBLISHED FEE LIST ──────────────────────────────────────
// Shown to the client on the deposit form before they submit. Every vault
// invoice is generated from these rates; nothing outside this list is charged.

export const VAULT_PUBLISHED_FEES: { group: string; label: string; price: string }[] = [
  ...Object.values(STORAGE_TYPE_CONFIG).map((s) => ({
    group: "Storage (monthly)",
    label: s.label,
    price: `$${s.monthlyRatePerKg.toFixed(2)} per kg (min $${MIN_MONTHLY_STORAGE_FEE})`,
  })),
  { group: "Intake (one-time)", label: "KYC processing", price: `$${VAULT_FEE_SCHEDULE.kycProcessingFee.toFixed(2)}` },
  { group: "Intake (one-time)", label: "Intake handling", price: `$${VAULT_FEE_SCHEDULE.intakeHandlingFee.toFixed(2)}` },
  { group: "Intake (one-time)", label: "Armed escort (if we collect)", price: `$${VAULT_FEE_SCHEDULE.securityEscortFee.toFixed(2)}` },
  ...ASSAY_METHODS.map((a) => ({ group: "Assay (if required)", label: a.label, price: `$${a.cost.toFixed(2)}` })),
  ...INSURANCE_OPTIONS.map((o) => ({
    group: "Insurance (optional, annual)",
    label: o.label,
    price: `${o.ratePercent}% of insured value (min $${MIN_ANNUAL_INSURANCE_PREMIUM})`,
  })),
  { group: "Release", label: "Physical withdrawal", price: `$${VAULT_FEE_SCHEDULE.physicalWithdrawalFee.toFixed(2)}` },
  { group: "Release", label: "Liquidation commission", price: `${VAULT_FEE_SCHEDULE.liquidationCommission}% of sale value` },
  { group: "Release", label: "Wire transfer", price: `$${VAULT_FEE_SCHEDULE.wireTransferFee.toFixed(2)}` },
  { group: "Release", label: "Transfer to another vault", price: `$${VAULT_FEE_SCHEDULE.custodyTransferFee.toFixed(2)}` },
  {
    group: "Release",
    label: `Demurrage for late collection (after ${VAULT_FEE_SCHEDULE.demurrageFreeDays} free days)`,
    price: `$${VAULT_FEE_SCHEDULE.demurrageRatePerKgPerDay.toFixed(2)} per kg per day (min $${VAULT_FEE_SCHEDULE.demurrageMinPerDay.toFixed(2)} a day)`,
  },
];
