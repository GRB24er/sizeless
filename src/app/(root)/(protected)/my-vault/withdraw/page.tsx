// Client vault release: choose a deposit in storage, then how it leaves the vault.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { prisma } from "@/constants/config/db";
import WithdrawClient from "./WithdrawClient";
import { AccountShell } from "@/components/account/account-shell";

export const metadata: Metadata = { title: "Request a release | Aegis Cargo" };

export default async function WithdrawPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/my-vault/withdraw");

  // Only deposits in storage can be released.
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
    <AccountShell
      active="vault"
      title="Request a release"
      intro="Collect your metal, sell it through a bullion dealer, or move it to another vault. The fee for each is in the published schedule."
    >
      <WithdrawClient deposits={deposits} userId={session.user.id} />
    </AccountShell>
  );
}
