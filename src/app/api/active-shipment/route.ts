import { NextResponse } from "next/server";
import { prisma } from "@/constants/config/db";
import { auth } from "~/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  // Look up the user by email
  const user = await prisma.user.findUnique({
    where: { id: session?.user.id },
  });
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Invalid verification link." },
      { status: 400 }
    );
  }

  // Undelivered shipments: all of them for admins, only their own for clients
  const activeShipmentCount = await prisma.shipment.count({
    where: {
      deliveredAt: null,
      ...(user.role === "ADMIN" ? {} : { userId: user.id }),
    },
  });

  return NextResponse.json(activeShipmentCount);
}
