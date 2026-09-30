"use server";

import { prisma } from "@/constants/config/db";
import { auth } from "~/auth";
import { revalidatePath } from "next/cache";
import { sendFeeReceiptEmail } from "@/lib/emails/fee-emails";
import { generateFeeReceiptPDF } from "@/lib/documents/fee-receipt";

// Shipment charges are created only at booking, from the quote the customer
// accepted (see shipments/create/actions.ts). Admins can record payment,
// waive, or remove a charge — never add one.

// ═══════════════════════════════════════════
// MARK FEE AS PAID — generates receipt PDF + emails it
// ═══════════════════════════════════════════
export async function markFeePaid(feeId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, message: "Admin access required" };
  }

  try {
    const fee = await prisma.shipmentFee.findUnique({
      where: { id: feeId },
      include: {
        shipment: {
          include: { recipient: true, Sender: true },
        },
      },
    });

    if (!fee) {
      return { success: false, message: "Fee not found" };
    }

    if (fee.status === "PAID") {
      return { success: false, message: "Fee is already paid" };
    }

    const paidAt = new Date();

    // Update fee status
    await prisma.shipmentFee.update({
      where: { id: feeId },
      data: {
        status: "PAID",
        paidAt,
        receiptSentAt: new Date(),
      },
    });

    const payer = fee.shipment.Sender;

    // Generate receipt PDF
    const receiptPdf = await generateFeeReceiptPDF({
      invoiceNumber: fee.invoiceNumber,
      feeType: fee.type,
      customType: fee.customType,
      amount: fee.amount,
      currency: fee.currency,
      reason: fee.reason,
      paidAt,
      trackingNumber: fee.shipment.trackingNumber,
      shipmentOrigin: `${fee.shipment.originCity}, ${fee.shipment.originCountry}`,
      shipmentDestination: `${fee.shipment.destinationCity}, ${fee.shipment.destinationCountry}`,
      payerName: payer?.name || "—",
      payerEmail: payer?.email,
      payerPhone: payer?.phone || "—",
      recipientName: fee.shipment.recipient.name,
    });

    if (payer?.email) {
      await sendFeeReceiptEmail({
        recipientEmail: payer.email,
        recipientName: payer.name,
        trackingNumber: fee.shipment.trackingNumber,
        feeType: fee.type,
        customType: fee.customType,
        amount: fee.amount,
        currency: fee.currency,
        reason: fee.reason,
        invoiceNumber: fee.invoiceNumber,
        shipmentOrigin: `${fee.shipment.originCity}, ${fee.shipment.originCountry}`,
        shipmentDestination: `${fee.shipment.destinationCity}, ${fee.shipment.destinationCountry}`,
        paidAt,
        receiptPdf,
      });
    }

    // Check if ALL fees for this shipment are now paid
    const unpaidFees = await prisma.shipmentFee.count({
      where: { shipmentId: fee.shipmentId, status: "UNPAID" },
    });

    // If all fees are paid, mark shipment as paid
    if (unpaidFees === 0) {
      await prisma.shipment.update({
        where: { id: fee.shipmentId },
        data: { isPaid: true },
      });
    }

    revalidatePath(`/dashboard/shipments/${fee.shipmentId}/detail`);
    return {
      success: true,
      message: `Payment confirmed. Receipt emailed to ${fee.shipment.Sender?.email || "the customer"}.`,
    };
  } catch (error: any) {
    console.error("Mark fee paid error:", error);
    return { success: false, message: error.message || "Failed to process payment" };
  }
}

// ═══════════════════════════════════════════
// WAIVE FEE — admin can waive a fee
// ═══════════════════════════════════════════
export async function waiveFee(feeId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, message: "Admin access required" };
  }

  try {
    const fee = await prisma.shipmentFee.findUnique({ where: { id: feeId } });
    if (!fee) return { success: false, message: "Fee not found" };

    await prisma.shipmentFee.update({
      where: { id: feeId },
      data: { status: "WAIVED" },
    });

    revalidatePath(`/dashboard/shipments/${fee.shipmentId}/detail`);
    return { success: true, message: "Fee waived" };
  } catch (error: any) {
    console.error("Waive fee error:", error);
    return { success: false, message: error.message || "Failed to waive fee" };
  }
}

// ═══════════════════════════════════════════
// DELETE FEE
// ═══════════════════════════════════════════
export async function deleteFee(feeId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, message: "Admin access required" };
  }

  try {
    const fee = await prisma.shipmentFee.findUnique({ where: { id: feeId } });
    if (!fee) return { success: false, message: "Fee not found" };

    await prisma.shipmentFee.delete({ where: { id: feeId } });

    revalidatePath(`/dashboard/shipments/${fee.shipmentId}/detail`);
    return { success: true, message: "Fee deleted" };
  } catch (error: any) {
    console.error("Delete fee error:", error);
    return { success: false, message: error.message || "Failed to delete fee" };
  }
}