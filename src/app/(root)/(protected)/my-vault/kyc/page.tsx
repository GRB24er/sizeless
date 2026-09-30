import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { getMyKYCStatus } from "../kyc-actions";
import KYCPageClient from "./KYCPageClient";
import { AccountShell } from "@/components/account/account-shell";

export const metadata: Metadata = { title: "Identity checks | Aegis Cargo" };

export default async function KYCPage() {
  const session = await auth();
  if (!session?.user) return redirect("/login?next=/my-vault/kyc");

  const kyc = await getMyKYCStatus();
  const data = kyc
    ? {
        id: kyc.id,
        status: kyc.status,
        idType: kyc.idType,
        idNumber: kyc.idNumber,
        rejectionReason: kyc.rejectionReason,
        reviewedAt: kyc.reviewedAt ? kyc.reviewedAt.toISOString() : null,
        createdAt: kyc.createdAt.toISOString(),
      }
    : null;

  return (
    <AccountShell
      active="identity"
      title="Identity checks"
      intro="Before we can hold metal for you, we need your ID, a proof of address and evidence of where the metal came from."
    >
      <KYCPageClient kyc={data} />
    </AccountShell>
  );
}
