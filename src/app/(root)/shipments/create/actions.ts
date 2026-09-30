/* eslint-disable @typescript-eslint/no-explicit-any */
// app/actions/shipment.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/constants/config/db";
import { shipmentSchema } from "@/store/schema";
import { auth } from "~/auth";
import { calculateShipmentQuote, QUOTE_CURRENCY } from "./type";
import { sendBookingConfirmationEmail, BOOKING_FEE_LABEL, formatQuoteLines } from "@/lib/emails/fee-emails";

// Helper function to generate a tracking number
function generateTrackingNumber(): string {
  // Example: Generate a random alphanumeric string prefixed with 'TRK-'
  return "LOX-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Helper function to calculate estimated delivery based on serviceType
function calculateEstimatedDelivery(serviceType: string): Date {
  const now = new Date();
  let daysToAdd = 10; // default for "standard"
  switch (serviceType.toLowerCase()) {
    case "express":
      daysToAdd = 10;
      break;
    case "economy":
      daysToAdd = 20;
      break;
    case "standard":
      daysToAdd = 40;
    default:
      daysToAdd = 30;
      break;
  }
  now.setDate(now.getDate() + daysToAdd);
  return now;
}

export async function createShipment(formData: FormData) {
  try {
    // Get the current user
    const session = await auth();
    if (!session?.user?.id) {
      return {
        error: "Unauthorized. Please sign in to create a shipment.",
      };
    }

    // Parse formData into an object
    const rawFormData: Record<string, any> = {};
    formData.forEach((value, key) => {
      // Handle recipient specially: expect a JSON string
      if (key === "recipient") {
        try {
          rawFormData.recipient = JSON.parse(value as string);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          rawFormData.recipient = value;
        }
      }
      // Handle packages as a special case
      else if (key.startsWith("packages[")) {
        const match = key.match(/packages\[(\d+)\]\.(\w+)/);
        if (match) {
          const [, index, field] = match;
          if (!rawFormData.packages) {
            rawFormData.packages = [];
          }
          if (!rawFormData.packages[parseInt(index)]) {
            rawFormData.packages[parseInt(index)] = {};
          }
          // Convert boolean values for fields like dangerous or insurance
          if (field === "dangerous" || field === "insurance") {
            rawFormData.packages[parseInt(index)][field] = value === "true";
          } else {
            rawFormData.packages[parseInt(index)][field] = value;
          }
        }
      } else {
        rawFormData[key] = value;
      }
    });

    // Validate using Zod schema
    const validatedData = shipmentSchema.parse(rawFormData);
    const { packages, recipient, ...shipmentData } = validatedData;

    // Recalculate the price from the rate card and only book if the customer
    // accepted exactly this total. This is the only place shipment charges are created.
    const quote = calculateShipmentQuote(packages, shipmentData.serviceType);
    if (!quote) {
      return { error: "Unknown service type." };
    }
    const acceptedTotal = Number(formData.get("acceptedTotal"));
    if (!Number.isFinite(acceptedTotal) || Math.abs(acceptedTotal - quote.total) > 0.005) {
      return {
        error: "The price has changed since you accepted it. Please review the total and accept it again.",
      };
    }

    // Generate server-side fields
    const trackingNumber = generateTrackingNumber();
    // Calculate estimatedDelivery based on the serviceType from shipmentData
    const estimatedDelivery = calculateEstimatedDelivery(
      shipmentData.serviceType
    );
    const deliveredAt = null; // not delivered yet
    const isPaid = false; // default payment status

    // Create shipment record with server-generated fields
    const result = await prisma.shipment.create({
      data: {
        ...shipmentData,
        recipient: { create: recipient },
        trackingNumber,
        estimatedDelivery,
        deliveredAt,
        isPaid,
        Sender: { connect: { id: session.user.id } },
        TrackingUpdates: {
          create: {
            message: "Shipment created",
            status: "Proccessing",
            // You can optionally include location or other fields here if needed.
          },
        },
        // Packages and the accepted charge are created in the same write as the shipment
        packages: { create: packages },
        fees: {
          create: {
            type: "SHIPPING_FREIGHT",
            customType: BOOKING_FEE_LABEL,
            amount: quote.total,
            currency: QUOTE_CURRENCY,
            reason: formatQuoteLines(quote.lines, QUOTE_CURRENCY),
            status: "UNPAID",
            invoiceSentAt: new Date(),
          },
        },
      },
      include: { Sender: true },
    });

    if (result.Sender?.email) {
      await sendBookingConfirmationEmail({
        email: result.Sender.email,
        name: result.Sender.name,
        trackingNumber,
        serviceLabel: quote.option.label,
        route: `${shipmentData.originCity}, ${shipmentData.originCountry} → ${shipmentData.destinationCity}, ${shipmentData.destinationCountry}`,
        lines: quote.lines,
        total: quote.total,
        currency: QUOTE_CURRENCY,
      });
    }

    revalidatePath("/shipments");

    return {
      success: true,
      shipmentId: result.id,
      message: "Shipment created successfully",
    };
  } catch (error: any) {
    console.error("Error creating shipment:", error);
    if (error.name === "ZodError") {
      return {
        error: "Validation error",
        issues: error.issues,
      };
    }
    return {
      error: "Failed to create shipment. Please try again.",
    };
  }

  revalidatePath("/shipments");
}
