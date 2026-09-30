import { auth } from "~/auth";
import { prisma } from "@/constants/config/db";

// Server-side access checks for server actions and API routes.
// The role is read from the database, not the session token, so a user who
// is demoted or deleted loses access immediately.

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Admin access required");
  return user;
}

/** The signed-in user, or null when nobody is signed in. */
export async function currentUser() {
  try {
    return await requireUser();
  } catch {
    return null;
  }
}

/** Admins can see every shipment; everyone else only the ones they booked. */
export function canAccessShipment(
  user: { id: string; role: string },
  shipment: { userId: string }
) {
  return user.role === "ADMIN" || shipment.userId === user.id;
}
