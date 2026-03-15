"use server";

import { prisma } from "@/constants/config/db";
import { auth } from "~/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// ═══════════════════════════════════════════
// CHECK ADMIN
// ═══════════════════════════════════════════
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "ADMIN") throw new Error("Admin access required");
  return user;
}

// ═══════════════════════════════════════════
// GET ALL USERS
// ═══════════════════════════════════════════
export async function getAllUsers() {
  await requireAdmin();

  // Each site only sees its own users — hide users from the other company's domain
  const ownDomain = (process.env.ADMIN_EMAIL || "").split("@")[1] || "";
  const hideDomain = ownDomain.includes("aegiscargo") ? "aramexlogistics" : "aegiscargo";

  return prisma.user.findMany({
    where: {
      NOT: {
        email: { contains: hideDomain },
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          shipments: true,
        },
      },
    },
  });
}

// ═══════════════════════════════════════════
// CREATE CLIENT ACCOUNT
// ═══════════════════════════════════════════
export async function createClientAccount(formData: FormData) {
  try {
    await requireAdmin();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const role = (formData.get("role") as string) || "USER";

    if (!name || !email || !phone || !password) {
      return { success: false, message: "All fields are required" };
    }

    if (password.length < 8) {
      return { success: false, message: "Password must be at least 8 characters" };
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, message: "Email already registered" };
    }

    const hash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hash,
        role: role === "ADMIN" ? "ADMIN" : role === "MANAGER" ? "MANAGER" : "USER",
      },
    });

    revalidatePath("/dashboard/users");

    return {
      success: true,
      message: `Account created for ${name}`,
      credentials: { name, email, password, role: user.role },
    };
  } catch (error: any) {
    console.error("Create account error:", error);
    return { success: false, message: error.message || "Failed to create account" };
  }
}

// ═══════════════════════════════════════════
// UPDATE USER ROLE
// ═══════════════════════════════════════════
export async function updateUserRole(formData: FormData) {
  try {
    await requireAdmin();

    const userId = formData.get("userId") as string;
    const role = formData.get("role") as string;

    if (!userId || !role) {
      return { success: false, message: "User ID and role required" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
    });

    revalidatePath("/dashboard/users");
    return { success: true, message: "Role updated" };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to update role" };
  }
}

// ═══════════════════════════════════════════
// RESET USER PASSWORD
// ═══════════════════════════════════════════
export async function resetUserPassword(formData: FormData) {
  try {
    await requireAdmin();

    const userId = formData.get("userId") as string;
    const newPassword = formData.get("newPassword") as string;

    if (!userId || !newPassword) {
      return { success: false, message: "User ID and new password required" };
    }

    if (newPassword.length < 8) {
      return { success: false, message: "Password must be at least 8 characters" };
    }

    const hash = await bcrypt.hash(newPassword, 12);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { password: hash },
    });

    revalidatePath("/dashboard/users");
    return { success: true, message: `Password reset for ${user.name}`, newPassword };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to reset password" };
  }
}

// ═══════════════════════════════════════════
// DELETE USER
// ═══════════════════════════════════════════
export async function deleteUser(formData: FormData) {
  try {
    const admin = await requireAdmin();

    const userId = formData.get("userId") as string;
    if (!userId) return { success: false, message: "User ID required" };

    // Prevent self-deletion
    if (userId === admin.id) {
      return { success: false, message: "Cannot delete your own account" };
    }

    const user = await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/dashboard/users");
    return { success: true, message: `Deleted ${user.name}` };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to delete user" };
  }
}
