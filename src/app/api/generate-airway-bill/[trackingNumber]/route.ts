import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/constants/config/db";
import { generateAirwayBill } from "@/lib/documents/pdf-templates";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params;

    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber },
      include: {
        recipient: true,
        Sender: true,
        packages: { orderBy: { id: "asc" } },
        TrackingUpdates: { orderBy: { timestamp: "asc" } },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
    }

    // Generate using the enterprise jsPDF template system
    // Includes: QR code, embossed seal, watermark, branded header/footer
    const pdfBuffer = await generateAirwayBill(shipment as any);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="AWB-${shipment.trackingNumber}.pdf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("AWB Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate Air Waybill", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}