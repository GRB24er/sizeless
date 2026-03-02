import { NextResponse } from "next/server";
import { prisma } from "@/constants/config/db";
import { auth } from "~/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Delete related records first (including fees), then the shipment
    await prisma.$transaction([
      prisma.shipmentFee.deleteMany({ where: { shipmentId: id } }),
      prisma.trackingUpdate.deleteMany({ where: { shipmentId: id } }),
      prisma.notification.deleteMany({ where: { shipmentId: id } }),
      prisma.package.deleteMany({ where: { shipmentId: id } }),
      prisma.shipment.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, message: "Shipment deleted" });
  } catch (error: any) {
    console.error("Delete shipment error:", error);
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete shipment" },
      { status: 500 }
    );
  }
}