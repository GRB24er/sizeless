"use server";

import { prisma } from "@/constants/config/db";
import { auth } from "~/auth";
import bcrypt from "bcryptjs";

// ═══════════════════════════════════════════
// UPDATE PROFILE
// ═══════════════════════════════════════════
export async function UpdateProfileAction(
  prevState: unknown,
  formData: FormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const company = formData.get("company") as string;
    const bio = formData.get("bio") as string;

    const street = formData.get("address.street") as string;
    const city = formData.get("address.city") as string;
    const state = formData.get("address.state") as string;
    const postalCode = formData.get("address.postalCode") as string;
    const country = formData.get("address.country") as string;

    // Update user name/phone
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name, phone },
    });

    // Update or create profile
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (existingProfile) {
      await prisma.profile.update({
        where: { userId: session.user.id },
        data: { company, bio },
      });
    } else {
      await prisma.profile.create({
        data: {
          userId: session.user.id,
          company,
          bio,
        },
      });
    }

    // Update or create address
    const existingAddress = await prisma.address.findFirst({
      where: { profileId: existingProfile?.id },
    });

    if (existingAddress) {
      await prisma.address.update({
        where: { id: existingAddress.id },
        data: { street, city, state, postalCode, country },
      });
    } else if (existingProfile) {
      await prisma.address.create({
        data: {
          profileId: existingProfile.id,
          street,
          city,
          state,
          postalCode,
          country,
        },
      });
    }

    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    console.error("Profile update error:", error);
    return { success: false, message: "Failed to update profile" };
  }
}

// ═══════════════════════════════════════════
// UPDATE PASSWORD
// ═══════════════════════════════════════════
export async function UpdatePassword(
  prevState: unknown,
  formData: FormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;

    if (!currentPassword || !newPassword) {
      return { success: false, message: "All fields are required" };
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return { success: false, message: "User not found" };
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return { success: false, message: "Current password is incorrect" };
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return { success: true, message: "Password updated successfully" };
  } catch (error) {
    console.error("Password update error:", error);
    return { success: false, message: "Failed to update password" };
  }
}