// Read-only data for the client's own account pages (/account, /my-vault).
// Every query is scoped to the signed-in client, and only fields a client may
// see are selected. Internal fields are never read here: compliance screening
// flags and notes, chain-of-custody records, access controls (security PIN,
// authorized persons), shelf positions, IP addresses and staff identifiers.

import { Prisma } from "@prisma/client";
import { prisma } from "@/constants/config/db";

const ACTIVITY_SELECT = { id: true, action: true, description: true, createdAt: true } satisfies Prisma.VaultActivitySelect;

const DEPOSIT_SUMMARY_SELECT = {
  id: true,
  depositNumber: true,
  status: true,
  assetType: true,
  description: true,
  quantity: true,
  weightGrams: true,
  purity: true,
  declaredValue: true,
  verifiedValue: true,
  storageType: true,
  depositDate: true,
  updatedAt: true,
} satisfies Prisma.VaultDepositSelect;

const DEPOSIT_DETAIL_SELECT = {
  ...DEPOSIT_SUMMARY_SELECT,
  custodyReferenceId: true,
  intakeMethod: true,
  appointmentDate: true,
  appointmentNotes: true,
  fineness: true,
  serialNumbers: true,
  refinerName: true,
  refinerStamp: true,
  isLBMACertified: true,
  cashCurrency: true,
  cashAmount: true,
  jewelryValuation: true,
  documentTitle: true,
  documentIssuingAuth: true,
  documentSerial: true,
  assayStatus: true,
  assayMethod: true,
  assayResult: true,
  assayDate: true,
  weightVerified: true,
  weightDiscrepancy: true,
  vaultLocation: true,
  storageUnit: true,
  storageStartDate: true,
  insuredValue: true,
  insuranceProvider: true,
  insurancePolicyNo: true,
  insuranceCoverage: true,
  insuranceExpiryDate: true,
  kycApprovedAt: true,
  intakeCompletedAt: true,
  assayCompletedAt: true,
  verifiedAt: true,
  storedAt: true,
  releaseRequestedAt: true,
  releaseApprovedAt: true,
  releasedAt: true,
  releaseReason: true,
  createdAt: true,
  activities: { select: ACTIVITY_SELECT, orderBy: { createdAt: "desc" } },
  withdrawals: {
    select: {
      id: true,
      type: true,
      status: true,
      requestDate: true,
      requestNotes: true,
      collectionDate: true,
      approvedAt: true,
      completedAt: true,
      rejectionReason: true,
      saleAmount: true,
      saleCurrency: true,
    },
    orderBy: { requestDate: "desc" },
  },
  transfers: {
    select: {
      id: true,
      transferNumber: true,
      status: true,
      destinationVault: true,
      weightTransferred: true,
      initiatedAt: true,
      estimatedArrival: true,
      completedAt: true,
    },
    orderBy: { initiatedAt: "desc" },
  },
  beneficiaries: {
    select: { id: true, name: true, relationship: true, allocationPercent: true, status: true },
    orderBy: { createdAt: "asc" },
  },
  invoices: {
    // Drafts haven't been issued, so the client doesn't see them yet.
    where: { status: { not: "DRAFT" } },
    select: {
      id: true,
      invoiceNumber: true,
      issueDate: true,
      dueDate: true,
      paidAt: true,
      periodStart: true,
      periodEnd: true,
      subtotal: true,
      taxAmount: true,
      total: true,
      amountPaid: true,
      balanceDue: true,
      status: true,
      items: { select: { id: true, description: true, quantity: true, unitPrice: true, amount: true } },
    },
    orderBy: { issueDate: "desc" },
  },
} satisfies Prisma.VaultDepositSelect;

export type ClientDepositSummary = Prisma.VaultDepositGetPayload<{ select: typeof DEPOSIT_SUMMARY_SELECT }>;
export type ClientDeposit = Prisma.VaultDepositGetPayload<{ select: typeof DEPOSIT_DETAIL_SELECT }>;

export async function getClientDeposits(clientId: string) {
  return prisma.vaultDeposit.findMany({
    where: { clientId },
    select: DEPOSIT_SUMMARY_SELECT,
    orderBy: { depositDate: "desc" },
  });
}

/** One of the client's own deposits, by its deposit number. Null if it isn't theirs. */
export async function getClientDeposit(clientId: string, depositNumber: string) {
  return prisma.vaultDeposit.findFirst({
    where: { clientId, depositNumber },
    select: DEPOSIT_DETAIL_SELECT,
  });
}

export async function getClientKyc(clientId: string) {
  return prisma.vaultKYC.findFirst({
    where: { clientId },
    select: { status: true, reviewedAt: true, rejectionReason: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getClientShipments(userId: string, take?: number) {
  return prisma.shipment.findMany({
    where: { userId },
    select: {
      id: true,
      trackingNumber: true,
      serviceType: true,
      originCity: true,
      originCountry: true,
      destinationCity: true,
      destinationCountry: true,
      createdAt: true,
      estimatedDelivery: true,
      deliveredAt: true,
      packages: { select: { weight: true } },
      TrackingUpdates: { select: { status: true, timestamp: true, location: true }, orderBy: { timestamp: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export type ClientShipment = Awaited<ReturnType<typeof getClientShipments>>[number];
