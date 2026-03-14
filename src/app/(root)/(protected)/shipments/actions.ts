/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/constants/config/db";
import { shipmentSchema } from "@/store/schema";
import { auth } from "~/auth";
import transporter from "@/lib/verify-mail";

const FROM_EMAIL = "Aegis Cargo <admin@aegiscargo.org>";

function generateTrackingNumber(): string {
  return "AML-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

function calculateEstimatedDelivery(serviceType: string): Date {
  const now = new Date();
  let daysToAdd = 10;
  switch (serviceType.toLowerCase()) {
    case "express": daysToAdd = 10; break;
    case "economy": daysToAdd = 20; break;
    case "standard": daysToAdd = 40; break;
    default: daysToAdd = 30; break;
  }
  now.setDate(now.getDate() + daysToAdd);
  return now;
}

async function notifySender(email: string, name: string, trackingNumber: string, destination: string) {
  try {
    await transporter.sendMail({
      from: FROM_EMAIL, to: email,
      subject: `Shipment Created — ${trackingNumber} | Aegis Cargo`,
      html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:linear-gradient(135deg,#0A1628 0%,#0D1F35 100%);padding:32px;text-align:center;">
          <img src="https://www.aegiscargo.org/images/logo.png" alt="Aegis Cargo" style="height:48px;margin-bottom:16px;" />
          <h1 style="color:#fff;font-size:22px;margin:0;font-weight:600;">Shipment Confirmation</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#374151;font-size:15px;line-height:1.6;">Dear <strong>${name}</strong>,</p>
          <p style="color:#374151;font-size:15px;line-height:1.6;">Your shipment has been successfully created and is now being processed.</p>
          <div style="background:linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 100%);border:1px solid #a7f3d0;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
            <p style="color:#065F46;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Tracking Number</p>
            <p style="color:#059669;font-size:24px;font-weight:700;margin:0;letter-spacing:1px;">${trackingNumber}</p>
          </div>
          <div style="background:#f9fafb;border-radius:8px;padding:20px;margin:24px 0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Destination</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:500;text-align:right;">${destination}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Status</td><td style="padding:8px 0;color:#059669;font-size:14px;font-weight:500;text-align:right;">Processing</td></tr>
            </table>
          </div>
          <div style="text-align:center;margin:32px 0;"><a href="https://www.aegiscargo.org/track" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:14px;">Track Your Shipment</a></div>
        </div>
        <div style="background:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb;text-align:center;"><p style="color:#9ca3af;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} Aegis Cargo | admin@aegiscargo.org | +44 020 1412 251</p></div>
      </div>`,
    });
  } catch (error) { console.error("Failed to send sender notification:", error); }
}

async function notifyRecipient(email: string, recipientName: string, senderName: string, trackingNumber: string) {
  try {
    await transporter.sendMail({
      from: FROM_EMAIL, to: email,
      subject: `Package Incoming — ${trackingNumber} | Aegis Cargo`,
      html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:linear-gradient(135deg,#0A1628 0%,#0D1F35 100%);padding:32px;text-align:center;">
          <img src="https://www.aegiscargo.org/images/logo.png" alt="Aegis Cargo" style="height:48px;margin-bottom:16px;" />
          <h1 style="color:#fff;font-size:22px;margin:0;font-weight:600;">Package On Its Way!</h1>
        </div>
        <div style="padding:32px;">
          <p style="color:#374151;font-size:15px;line-height:1.6;">Dear <strong>${recipientName}</strong>,</p>
          <p style="color:#374151;font-size:15px;line-height:1.6;">A package from <strong>${senderName}</strong> has been dispatched to you via Aegis Cargo.</p>
          <div style="background:linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 100%);border:1px solid #a7f3d0;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
            <p style="color:#065F46;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px 0;">Tracking Number</p>
            <p style="color:#059669;font-size:24px;font-weight:700;margin:0;letter-spacing:1px;">${trackingNumber}</p>
          </div>
          <div style="text-align:center;margin:32px 0;"><a href="https://www.aegiscargo.org/track" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:14px;">Track Package</a></div>
          <p style="color:#6b7280;font-size:13px;line-height:1.6;">Questions? Contact us at <a href="mailto:admin@aegiscargo.org" style="color:#059669;">admin@aegiscargo.org</a>.</p>
        </div>
        <div style="background:#f9fafb;padding:24px 32px;border-top:1px solid #e5e7eb;text-align:center;"><p style="color:#9ca3af;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} Aegis Cargo | admin@aegiscargo.org | +44 020 1412 251</p></div>
      </div>`,
    });
  } catch (error) { console.error("Failed to send recipient notification:", error); }
}

export async function createShipment(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized. Please sign in to create a shipment." };

    const rawFormData: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (key === "recipient") {
        try { rawFormData.recipient = JSON.parse(value as string); } catch (e) { rawFormData.recipient = value; }
      } else if (key.startsWith("packages[")) {
        const match = key.match(/packages\[(\d+)\]\.(\w+)/);
        if (match) {
          const [, index, field] = match;
          if (!rawFormData.packages) rawFormData.packages = [];
          if (!rawFormData.packages[parseInt(index)]) rawFormData.packages[parseInt(index)] = {};
          if (field === "dangerous" || field === "insurance") { rawFormData.packages[parseInt(index)][field] = value === "true"; }
          else { rawFormData.packages[parseInt(index)][field] = value; }
        }
      } else { rawFormData[key] = value; }
    });

    const validatedData = shipmentSchema.parse(rawFormData);
    const { packages, recipient, ...shipmentData } = validatedData;
    const trackingNumber = generateTrackingNumber();
    const estimatedDelivery = calculateEstimatedDelivery(shipmentData.serviceType);

    const sender = await prisma.user.findUnique({ where: { id: session.user.id } });

    const result = await prisma.shipment.create({
      data: {
        ...shipmentData, recipient: { create: recipient }, trackingNumber, estimatedDelivery, deliveredAt: null, isPaid: false,
        Sender: { connect: { id: session.user.id } },
        TrackingUpdates: { create: { message: "Shipment created and being processed", status: "Proccessing" } },
      },
    });

    await prisma.package.createMany({ data: packages.map((item) => ({ ...item, shipmentId: result.id })) });

    const destination = `${shipmentData.destinationCity}, ${shipmentData.destinationCountry}`;
    if (sender?.email) await notifySender(sender.email, sender.name, trackingNumber, destination);
    if (recipient.email) await notifyRecipient(recipient.email, recipient.name, sender?.name || "A sender", trackingNumber);

    revalidatePath("/shipments");
    return { success: true, shipmentId: result.id, message: "Shipment created successfully" };
  } catch (error: any) {
    console.error("Error creating shipment:", error);
    if (error.name === "ZodError") return { error: "Validation error", issues: error.issues };
    return { error: "Failed to create shipment. Please try again." };
  }
}
