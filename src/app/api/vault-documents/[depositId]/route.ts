// ═══════════════════════════════════════════════════════════════
// src/app/api/vault-documents/[depositId]/route.ts
// Vault Document Generator — Generate & download vault PDFs
// ═══════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/auth";
import { prisma } from "@/constants/config/db";
import {
  generateVaultCertificate,
  generateAssayReport,
  generateStorageAgreement,
  generateVaultInsuranceCertificate,
} from "@/lib/documents/pdf-templates";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ depositId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { depositId } = await params;
    const docType = req.nextUrl.searchParams.get("type");

    if (!docType) {
      return NextResponse.json({ error: "Missing document type" }, { status: 400 });
    }

    // Fetch deposit with client
    const deposit = await prisma.vaultDeposit.findUnique({
      where: { id: depositId },
      include: { client: { select: { name: true, email: true, phone: true } } },
    });

    if (!deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    // Access control: admin or deposit owner
    if (session.user.role !== "ADMIN" && deposit.clientId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    let pdfBuffer: Buffer;
    let filename: string;

    switch (docType) {
      case "vault-certificate": {
        pdfBuffer = await generateVaultCertificate({
          depositNumber: deposit.depositNumber,
          assetType: deposit.assetType,
          description: deposit.description,
          weightGrams: deposit.weightGrams,
          purity: deposit.purity,
          quantity: deposit.quantity,
          declaredValue: deposit.declaredValue,
          serialNumbers: deposit.serialNumbers,
          vaultLocation: deposit.vaultLocation,
          storageUnit: deposit.storageUnit,
          insuredValue: deposit.insuredValue,
          depositDate: deposit.depositDate,
          verifiedAt: deposit.verifiedAt,
          client: deposit.client,
        });
        filename = `Vault-Certificate-${deposit.depositNumber}.pdf`;
        break;
      }

      case "assay-report": {
        pdfBuffer = await generateAssayReport({
          depositNumber: deposit.depositNumber,
          assetType: deposit.assetType,
          description: deposit.description,
          weightGrams: deposit.weightGrams,
          weightVerified: deposit.weightVerified,
          weightDiscrepancy: deposit.weightDiscrepancy,
          purity: deposit.purity,
          quantity: deposit.quantity,
          serialNumbers: deposit.serialNumbers,
          refinerName: deposit.refinerName,
          isLBMACertified: deposit.isLBMACertified,
          assayMethod: deposit.assayMethod,
          assayResult: deposit.assayResult,
          assayPerformedBy: deposit.assayPerformedBy,
          assayStatus: deposit.assayStatus,
          declaredValue: deposit.declaredValue,
          verifiedValue: deposit.verifiedValue,
          vaultLocation: deposit.vaultLocation,
          client: deposit.client,
        });
        filename = `Assay-Report-${deposit.depositNumber}.pdf`;
        break;
      }

      case "storage-agreement": {
        pdfBuffer = await generateStorageAgreement({
          depositNumber: deposit.depositNumber,
          custodyReferenceId: deposit.custodyReferenceId,
          assetType: deposit.assetType,
          description: deposit.description,
          weightGrams: deposit.weightGrams,
          purity: deposit.purity,
          quantity: deposit.quantity,
          serialNumbers: deposit.serialNumbers,
          declaredValue: deposit.declaredValue,
          storageType: deposit.storageType,
          storageUnit: deposit.storageUnit,
          shelfPosition: deposit.shelfPosition,
          vaultLocation: deposit.vaultLocation,
          monthlyStorageFee: deposit.monthlyStorageFee,
          depositDate: deposit.depositDate,
          insuredValue: deposit.insuredValue,
          insuranceProvider: deposit.insuranceProvider,
          insurancePolicyNo: deposit.insurancePolicyNo,
          client: deposit.client,
        });
        filename = `Storage-Agreement-${deposit.depositNumber}.pdf`;
        break;
      }

      case "vault-insurance": {
        pdfBuffer = await generateVaultInsuranceCertificate({
          depositNumber: deposit.depositNumber,
          custodyReferenceId: deposit.custodyReferenceId,
          assetType: deposit.assetType,
          description: deposit.description,
          weightGrams: deposit.weightGrams,
          purity: deposit.purity,
          declaredValue: deposit.declaredValue,
          insuredValue: deposit.insuredValue,
          insuranceProvider: deposit.insuranceProvider,
          insurancePolicyNo: deposit.insurancePolicyNo,
          insuranceCoverage: deposit.insuranceCoverage,
          insuranceExpiryDate: deposit.insuranceExpiryDate,
          storageType: deposit.storageType,
          vaultLocation: deposit.vaultLocation,
          storageUnit: deposit.storageUnit,
          depositDate: deposit.depositDate,
          client: deposit.client,
        });
        filename = `Insurance-Certificate-${deposit.depositNumber}.pdf`;
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown document type: ${docType}` },
          { status: 400 }
        );
    }

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Vault document error:", error);
    return NextResponse.json(
      { error: "Failed to generate document" },
      { status: 500 }
    );
  }
}
