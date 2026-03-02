"use server";

import { prisma } from "@/constants/config/db";
import { auth } from "~/auth";
import { revalidatePath } from "next/cache";
import { sendFeeInvoiceEmail, sendFeeReceiptEmail } from "@/lib/emails/fee-emails";
import { generateFeeReceiptPDF } from "@/lib/documents/fee-receipt";

// ═══════════════════════════════════════════
// ADD FEE — creates fee + emails invoice to receiver
// ═══════════════════════════════════════════
export async function addShipmentFee(formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, message: "Admin access required" };
  }

  const shipmentId = formData.get("shipmentId") as string;
  const type = formData.get("type") as string;
  const customType = formData.get("customType") as string | null;
  const amount = parseFloat(formData.get("amount") as string);
  const currency = (formData.get("currency") as string) || "USD";
  const reason = formData.get("reason") as string;

  if (!shipmentId || !type || !amount || !reason) {
    return { success: false, message: "All fields are required" };
  }

  if (amount <= 0) {
    return { success: false, message: "Amount must be greater than 0" };
  }

  try {
    // Get shipment with recipient details
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { recipient: true, Sender: true },
    });

    if (!shipment) {
      return { success: false, message: "Shipment not found" };
    }

    // Create the fee
    const fee = await prisma.shipmentFee.create({
      data: {
        shipmentId,
        type: type as any,
        customType: type === "CUSTOM" ? customType : null,
        amount,
        currency,
        reason,
        status: "UNPAID",
        invoiceSentAt: new Date(),
      },
    });

    // Send invoice email to recipient
    if (shipment.recipient.email) {
      await sendFeeInvoiceEmail({
        recipientEmail: shipment.recipient.email,
        recipientName: shipment.recipient.name,
        trackingNumber: shipment.trackingNumber,
        feeType: type,
        amount,
        currency,
        reason,
        invoiceNumber: fee.invoiceNumber,
        shipmentOrigin: `${shipment.originCity}, ${shipment.originCountry}`,
        shipmentDestination: `${shipment.destinationCity}, ${shipment.destinationCountry}`,
      });
    }

    // Also send to sender if they have an email
    if (shipment.Sender?.email) {
      await sendFeeInvoiceEmail({
        recipientEmail: shipment.Sender.email,
        recipientName: shipment.Sender.name,
        trackingNumber: shipment.trackingNumber,
        feeType: type,
        amount,
        currency,
        reason,
        invoiceNumber: fee.invoiceNumber,
        shipmentOrigin: `${shipment.originCity}, ${shipment.originCountry}`,
        shipmentDestination: `${shipment.destinationCity}, ${shipment.destinationCountry}`,
      });
    }

    revalidatePath(`/dashboard/shipments/${shipmentId}/detail`);
    return {
      success: true,
      message: `Fee added and invoice emailed to ${shipment.recipient.email || "recipient"}`,
    };
  } catch (error: any) {
    console.error("Add fee error:", error);
    return { success: false, message: error.message || "Failed to add fee" };
  }
}

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
      recipientName: fee.shipment.recipient.name,
      recipientEmail: fee.shipment.recipient.email,
      recipientPhone: fee.shipment.recipient.phone,
      senderName: fee.shipment.Sender?.name,
    });

    // Email receipt to recipient
    if (fee.shipment.recipient.email) {
      await sendFeeReceiptEmail({
        recipientEmail: fee.shipment.recipient.email,
        recipientName: fee.shipment.recipient.name,
        trackingNumber: fee.shipment.trackingNumber,
        feeType: fee.type,
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

    // Also email sender
    if (fee.shipment.Sender?.email) {
      await sendFeeReceiptEmail({
        recipientEmail: fee.shipment.Sender.email,
        recipientName: fee.shipment.Sender.name,
        trackingNumber: fee.shipment.trackingNumber,
        feeType: fee.type,
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
      message: `Payment confirmed. Receipt emailed to ${fee.shipment.recipient.email || "recipient"}.`,
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