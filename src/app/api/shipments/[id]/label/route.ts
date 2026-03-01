import { NextResponse } from "next/server";
import { prisma } from "@/constants/config/db";
import { auth } from "~/auth";
import { generateAirwayBill } from "@/lib/documents/pdf-templates";

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

    // Generate professional label using the airway bill template
    // (logo, QR code, watermark, embossed seal, full branding)
    const pdfBuffer = await generateAirwayBill(shipment as any);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="label-${shipment.trackingNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Generate label error:", error);
    return NextResponse.json(
      { error: "Failed to generate label" },
      { status: 500 }
    );
  }
}
