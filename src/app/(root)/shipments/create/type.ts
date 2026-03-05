// ═══════════════════════════════════════════════════════
// src/app/shipments/create/type.ts
// Realistic shipping options for gold & precious metals
// ═══════════════════════════════════════════════════════

export type ShippingOption = {
  id: string;
  label: string;
  description: string;
  price: number;           // Base rate
  perKgRate: number;       // Per-kg surcharge for precious cargo
  transitDays: string;     // Estimated transit window
  insuranceRate: number;   // % of declared value
  securityLevel: string;
};

export const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: "armored_express",
    label: "Armored Express Courier",
    description:
      "Armed escort, GPS-tracked armored vehicle, dedicated vault-to-vault transfer. Real-time chain-of-custody reporting. LBMA & ISO 17025 compliant.",
    price: 1250.0,
    perKgRate: 85.0,
    transitDays: "3–5 business days",
    insuranceRate: 1.5,
    securityLevel: "Maximum",
  },
  {
    id: "secure_freight",
    label: "Secure Freight",
    description:
      "Sealed tamper-evident containers, bonded warehouse transfers, armed checkpoint inspections. GPS monitoring with 15-min position updates.",
    price: 750.0,
    perKgRate: 55.0,
    transitDays: "5–8 business days",
    insuranceRate: 1.25,
    securityLevel: "High",
  },
  {
    id: "standard_insured",
    label: "Standard Insured Delivery",
    description:
      "Fully insured standard freight with sealed packaging, customs brokerage included. Suitable for lower-value consignments and refined metals.",
    price: 350.0,
    perKgRate: 32.0,
    transitDays: "8–14 business days",
    insuranceRate: 1.0,
    securityLevel: "Standard",
  },
  {
    id: "economy_secure",
    label: "Economy Secure",
    description:
      "Cost-effective consolidated secure freight. Shared armored transport with verified co-shippers. Best for non-urgent bulk transfers.",
    price: 185.0,
    perKgRate: 18.0,
    transitDays: "14–21 business days",
    insuranceRate: 0.85,
    securityLevel: "Basic",
  },
];

// Realistic gold consignment fee schedule
export const FEE_SCHEDULE = {
  // Customs & Duty (varies by corridor, these are common averages)
  customsDutyRate: 0.05,        // 5% of declared value
  importVATRate: 0.0,           // Gold bullion is typically VAT-exempt in UK/EU
  exportPermitFee: 125.0,       // Export license processing

  // Security & Handling
  securitySurcharge: 250.0,     // Armed escort coordination
  vaultHandlingFee: 175.0,      // Vault loading/unloading
  tamperSealFee: 45.0,          // Per-container tamper-evident seals

  // Compliance & Documentation
  assayVerificationFee: 350.0,  // Independent assay/purity certificate
  lbmaDocumentationFee: 150.0,  // LBMA chain-of-custody paperwork
  customsBrokerageFee: 275.0,   // Broker handling customs clearance
  hazmatDocFee: 0.0,            // Gold is not hazmat but needed for some routes

  // Insurance minimums
  minInsuranceValue: 500.0,     // Minimum insurance premium

  // Weight thresholds
  heavyCargoSurchargeKg: 50,    // Above 50kg = heavy cargo surcharge
  heavyCargoRate: 0.02,         // 2% extra on declared value
};

// Package types specific to gold/precious metals logistics
export const PACKAGE_TYPES = [
  { value: "gold_bar", label: "Gold Bar / Ingot (LBMA Good Delivery)" },
  { value: "gold_kilobar", label: "Gold Kilobar (1kg)" },
  { value: "gold_coins", label: "Gold Coins / Numismatic" },
  { value: "gold_dust", label: "Gold Dust / Granules" },
  { value: "gold_dore", label: "Gold Doré (Unrefined)" },
  { value: "jewelry", label: "Jewelry / Finished Goods" },
  { value: "silver_bar", label: "Silver Bar / Bullion" },
  { value: "platinum", label: "Platinum / Palladium" },
  { value: "precious_stones", label: "Precious Stones / Gemstones" },
  { value: "secure_box", label: "Secure Strongbox (Mixed Valuables)" },
  { value: "custom", label: "Custom / Other High-Value" },
];

// Purity / Fineness options for gold
export const PURITY_OPTIONS = [
  { value: "999.9", label: "999.9 (Four Nines / LBMA)" },
  { value: "999", label: "999 (Three Nines)" },
  { value: "995", label: "995 (London Good Delivery Min)" },
  { value: "990", label: "990" },
  { value: "916", label: "916 (22K)" },
  { value: "750", label: "750 (18K)" },
  { value: "585", label: "585 (14K)" },
  { value: "375", label: "375 (9K)" },
  { value: "dore", label: "Doré / Unrefined (variable)" },
  { value: "other", label: "Other / Mixed" },
];
