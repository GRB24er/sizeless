// ═══════════════════════════════════════════════════════════════
// src/app/(root)/(protected)/my-vault/withdraw/page.tsx
// Client Vault Withdrawal — Server Component
// ═══════════════════════════════════════════════════════════════

import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { prisma } from "@/constants/config/db";
import WithdrawClient from "./WithdrawClient";

export default async function WithdrawPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Fetch user's deposits that are eligible for withdrawal
  const deposits = await prisma.vaultDeposit.findMany({
    where: {
      clientId: session.user.id,
      status: { in: ["IN_STORAGE"] },
    },
    select: {
      id: true,
      depositNumber: true,
      custodyReferenceId: true,
      assetType: true,
      description: true,
      weightGrams: true,
      declaredValue: true,
      status: true,
      storageUnit: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <WithdrawClient
        deposits={deposits as any}
        userId={session.user.id}
      />
    </div>
  );
}
