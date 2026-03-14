/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { prisma } from "@/constants/config/db";
import { auth } from "~/auth";
import { revalidatePath } from "next/cache";
import transporter from "@/lib/verify-mail";
import {
  generateAirwayBill, generateCommercialInvoice, generatePackingList,
  generateShippingLabel, generateDeliveryNote, generateProofOfDelivery,
  generateInsuranceCertificate, generateVaultCertificate,
  DOCUMENT_TYPES, type DocumentType,
} from "@/lib/documents/pdf-templates";
import { generateTrackingQR, generateVaultQR } from "@/lib/documents/qr-generator";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.aegiscargo.org";
const FROM_EMAIL = process.env.SMTP_USER || "admin@aegiscargo.org";

// ═══════════════════════════════════════════
// GET SHIPMENT DATA
// ═══════════════════════════════════════════
async function getShipmentData(trackingNumber: string) {
  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber },
    include: {
      packages: true,
      recipient: true,
      TrackingUpdates: { orderBy: { timestamp: "asc" } },
      Sender: true,
    },
  });

  if (!shipment) return null;

  return {
    trackingNumber: shipment.trackingNumber,
    serviceType: shipment.serviceType,
    createdAt: shipment.createdAt,
    estimatedDelivery: shipment.estimatedDelivery,
    deliveredAt: shipment.deliveredAt,
    originAddress: shipment.originAddress,
    originCity: shipment.originCity,
    originState: shipment.originState,
    originPostalCode: shipment.originPostalCode,
    originCountry: shipment.originCountry,
    destinationAddress: shipment.destinationAddress,
    destinationCity: shipment.destinationCity,
    destinationState: shipment.destinationState,
    destinationPostalCode: shipment.destinationPostalCode,
    destinationCountry: shipment.destinationCountry,
    specialInstructions: shipment.specialInstructions,
    isPaid: shipment.isPaid,
    packages: shipment.packages.map((p: any) => ({
      packageType: p.packageType,
      weight: p.weight,
      length: p.length,
      width: p.width,
      height: p.height,
      declaredValue: p.declaredValue,
      description: p.description,
      pieces: p.pieces,
      dangerous: p.dangerous,
      insurance: p.insurance,
    })),
    recipient: {
      name: shipment.recipient.name,
      company: shipment.recipient.company,
      email: shipment.recipient.email,
      phone: shipment.recipient.phone,
    },
    Sender: shipment.Sender ? {
      name: shipment.Sender.name,
      email: shipment.Sender.email,
      phone: shipment.Sender.phone || "",
    } : null,
    TrackingUpdates: shipment.TrackingUpdates.map((t: any) => ({
      id: t.id,
      timestamp: t.timestamp,
      location: t.location,
      status: t.status,
      message: t.message,
    })),
    senderEmail: shipment.Sender?.email || null,
    recipientEmail: shipment.recipient.email || null,
  };
}

// ═══════════════════════════════════════════
// GENERATE PDF BY TYPE
// ═══════════════════════════════════════════
async function generatePdf(type: DocumentType, data: any): Promise<Buffer> {
  switch (type) {
    case "airway-bill": return generateAirwayBill(data);
    case "commercial-invoice": return generateCommercialInvoice(data);
    case "packing-list": return generatePackingList(data);
    case "shipping-label": return generateShippingLabel(data);
    case "delivery-note": return generateDeliveryNote(data);
    case "proof-of-delivery": return generateProofOfDelivery(data);
    case "insurance-certificate": return generateInsuranceCertificate(data);
    default: throw new Error(`Unsupported type: ${type}`);
  }
}

// ═══════════════════════════════════════════
// EMAIL HTML TEMPLATE
// ═══════════════════════════════════════════
function buildEmailHTML(params: {
  recipientName: string;
  trackingNumber: string;
  documentLabel: string;
  trackingUrl: string;
  qrBase64: string;
  isRecipient: boolean;
}) {
  const { recipientName, trackingNumber, documentLabel, trackingUrl, qrBase64, isRecipient } = params;
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
          
          <!-- Header -->
          <tr><td style="background:#0A1628;padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td><span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:0.5px;">AEGIS</span><span style="color:#1E3A5F;font-size:20px;font-weight:bold;">CARGO</span></td>
                <td align="right"><span style="color:#D4A853;font-size:11px;letter-spacing:1px;">DOCUMENT DELIVERY</span></td>
              </tr>
            </table>
          </td></tr>
          
          <!-- Gold accent -->
          <tr><td style="background:#D4A853;height:3px;"></td></tr>
          
          <!-- Body -->
          <tr><td style="padding:32px;">
            <h2 style="color:#111827;font-size:20px;margin:0 0 8px 0;">${documentLabel}</h2>
            <p style="color:#6B7280;font-size:14px;line-height:1.6;margin:0 0 24px 0;">
              Dear ${recipientName},<br><br>
              ${isRecipient 
                ? `A shipment document has been prepared for your delivery. Please find the <strong>${documentLabel}</strong> attached to this email.`
                : `Your shipment document has been generated. Please find the <strong>${documentLabel}</strong> attached to this email.`
              }
            </p>
            
            <!-- Tracking Box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin:0 0 24px 0;">
              <tr><td style="padding:20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <p style="color:#1E3A5F;font-size:11px;font-weight:bold;letter-spacing:1px;margin:0 0 4px 0;">TRACKING NUMBER</p>
                      <p style="color:#0A1628;font-size:22px;font-weight:bold;margin:0;font-family:monospace;letter-spacing:2px;">${trackingNumber}</p>
                    </td>
                    <td align="right" width="100">
                      <img src="${qrBase64}" alt="QR Code" width="90" height="90" style="border-radius:8px;border:1px solid #e5e7eb;" />
                      <p style="color:#9CA3AF;font-size:9px;text-align:center;margin:4px 0 0 0;">Scan to track</p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
            
            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px 0;">
              <tr><td align="center">
                <a href="${trackingUrl}" style="display:inline-block;background:#1E3A5F;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">
                  Track Your Shipment →
                </a>
              </td></tr>
            </table>
            
            <p style="color:#9CA3AF;font-size:12px;line-height:1.5;margin:0;">
              The attached PDF contains a QR code for instant verification. If you have questions about this shipment, 
              contact our support team at <a href="mailto:admin@aegiscargo.org" style="color:#1E3A5F;">admin@aegiscargo.org</a> 
              or call <strong>+44 020 1412 251</strong>.
            </p>
          </td></tr>
          
          <!-- Footer -->
          <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td><p style="color:#9CA3AF;font-size:11px;margin:0;">© ${new Date().getFullYear()} Aegis Cargo Ltd.</p>
                <p style="color:#9CA3AF;font-size:10px;margin:4px 0 0 0;">47 Mark Lane, Ipswich, Suffolk IP1 2DA, UK</p></td>
                <td align="right"><p style="color:#9CA3AF;font-size:10px;margin:0;">ISO 9001 Certified | LBMA Approved</p></td>
              </tr>
            </table>
          </td></tr>
          
        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}

// ═══════════════════════════════════════════
// SEND SHIPMENT DOCUMENTS
// ═══════════════════════════════════════════
export async function sendShipmentDocuments(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  // Check admin
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") return { success: false, message: "Admin only" };

  const trackingNumber = formData.get("trackingNumber") as string;
  const documentTypes = formData.getAll("documentTypes") as DocumentType[];
  const sendToSender = formData.get("sendToSender") === "true";
  const sendToRecipient = formData.get("sendToRecipient") === "true";
  const customEmail = formData.get("customEmail") as string | null;

  if (!trackingNumber || documentTypes.length === 0) {
    return { success: false, message: "Tracking number and at least one document type required" };
  }

  if (!sendToSender && !sendToRecipient && !customEmail) {
    return { success: false, message: "Select at least one email recipient" };
  }

  try {
    const shipmentData = await getShipmentData(trackingNumber);
    if (!shipmentData) return { success: false, message: "Shipment not found" };

    // Generate QR code for email embed
    const qrBase64 = await generateTrackingQR(trackingNumber);
    const trackingUrl = `${BASE_URL}/track/${encodeURIComponent(trackingNumber)}`;

    // Generate all requested PDFs
    const attachments = await Promise.all(
      documentTypes.map(async (type) => {
        const pdf = await generatePdf(type, shipmentData);
        const label = DOCUMENT_TYPES[type].label;
        return {
          filename: `${label.replace(/\s+/g, "-")}-${trackingNumber}.pdf`,
          content: pdf,
          contentType: "application/pdf",
        };
      })
    );

    const documentLabel = documentTypes.length === 1
      ? DOCUMENT_TYPES[documentTypes[0]].label
      : `${documentTypes.length} Shipment Documents`;

    const emailTargets: { email: string; name: string; isRecipient: boolean }[] = [];

    if (sendToSender && shipmentData.senderEmail) {
      emailTargets.push({ email: shipmentData.senderEmail, name: shipmentData.Sender?.name || "Customer", isRecipient: false });
    }
    if (sendToRecipient && shipmentData.recipientEmail) {
      emailTargets.push({ email: shipmentData.recipientEmail, name: shipmentData.recipient.name, isRecipient: true });
    }
    if (customEmail && customEmail.includes("@")) {
      emailTargets.push({ email: customEmail, name: "Valued Customer", isRecipient: true });
    }

    // Send emails
    let sentCount = 0;
    for (const target of emailTargets) {
      try {
        await transporter.sendMail({
          from: `"Aegis Cargo" <${FROM_EMAIL}>`,
          to: target.email,
          subject: `${documentLabel} — ${trackingNumber} | Aegis Cargo`,
          html: buildEmailHTML({
            recipientName: target.name,
            trackingNumber,
            documentLabel,
            trackingUrl,
            qrBase64,
            isRecipient: target.isRecipient,
          }),
          attachments,
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send to ${target.email}:`, err);
      }
    }

    revalidatePath("/dashboard/shipments");
    revalidatePath("/dashboard/documents");

    return {
      success: sentCount > 0,
      message: sentCount > 0
        ? `${documentTypes.length} document(s) sent to ${sentCount} recipient(s)`
        : "Failed to send emails. Check SMTP configuration.",
      sentCount,
      totalTargets: emailTargets.length,
    };
  } catch (error) {
    console.error("Send documents error:", error);
    return { success: false, message: "Failed to generate or send documents" };
  }
}

// ═══════════════════════════════════════════
// SEND VAULT CERTIFICATE
// ═══════════════════════════════════════════
export async function sendVaultCertificate(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") return { success: false, message: "Admin only" };

  const depositNumber = formData.get("depositNumber") as string;
  if (!depositNumber) return { success: false, message: "Deposit number required" };

  try {
    const deposit = await prisma.vaultDeposit.findUnique({
      where: { depositNumber },
      include: { client: true },
    });

    if (!deposit) return { success: false, message: "Deposit not found" };

    const vaultData = {
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
      client: {
        name: deposit.client.name,
        email: deposit.client.email,
        phone: deposit.client.phone || "",
      },
    };

    const pdf = await generateVaultCertificate(vaultData);
    const qrBase64 = await generateVaultQR(depositNumber);

    await transporter.sendMail({
      from: `"Aegis Cargo Vault" <${FROM_EMAIL}>`,
      to: deposit.client.email,
      subject: `Vault Deposit Certificate — ${depositNumber} | Aegis Cargo`,
      html: buildEmailHTML({
        recipientName: vaultData.client.name,
        trackingNumber: depositNumber,
        documentLabel: "Vault Deposit Certificate",
        trackingUrl: `${BASE_URL}/my-vault`,
        qrBase64,
        isRecipient: false,
      }),
      attachments: [{
        filename: `Vault-Certificate-${depositNumber}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      }],
    });

    revalidatePath("/dashboard/vault");
    return { success: true, message: `Vault certificate sent to ${deposit.client.email}` };
  } catch (error) {
    console.error("Send vault certificate error:", error);
    return { success: false, message: "Failed to send vault certificate" };
  }
}

// ═══════════════════════════════════════════
// GET ALL SHIPMENTS (for admin document panel)
// ═══════════════════════════════════════════
export async function getShipmentsForDocuments() {
  const session = await auth();
  if (!session?.user) return [];

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") return [];

  return prisma.shipment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      recipient: { select: { name: true, email: true } },
      Sender: { select: { name: true, email: true } },
      packages: { select: { insurance: true } },
      TrackingUpdates: { orderBy: { timestamp: "desc" }, take: 1 },
    },
  });
}
