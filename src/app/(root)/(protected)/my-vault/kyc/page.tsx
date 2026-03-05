import { auth } from "~/auth";
import { redirect } from "next/navigation";
import { getMyKYCStatus } from "../kyc-actions";
import KYCPageClient from "./KYCPageClient";

export default async function KYCPage() {
  const session = await auth();
  if (!session?.user) return redirect("/login");

  const kyc = await getMyKYCStatus();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-slate-950 pt-28 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <KYCPageClient kyc={JSON.parse(JSON.stringify(kyc))} />
      </div>
    </div>
  );
}
