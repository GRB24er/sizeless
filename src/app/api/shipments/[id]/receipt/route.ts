import { NextResponse } from "next/server";
import { prisma } from "@/constants/config/db";
import { auth } from "~/auth";
import { generateCommercialInvoice } from "@/lib/documents/pdf-templates";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        TrackingUpdates: { orderBy: { timestamp: "asc" } },
        packages: true,
        recipient: true,
        Sender: true,
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }

    // Generate receipt using commercial invoice template
    // (branded with logo, QR code, watermark, embossed seal)
    const pdfBuffer = await generateCommercialInvoice(shipment as any);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${shipment.trackingNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Generate receipt error:", error);
    return NextResponse.json(
      { error: "Failed to generate receipt" },
      { status: 500 }
    );
  }
}
