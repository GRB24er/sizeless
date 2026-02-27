import { auth } from "~/auth";
import { redirect } from "next/navigation";
import { getUserVaultDeposits } from "./actions";
import { VaultDashboard } from "@/components/features/vault/vault-dashboard";

export default async function UserVaultPage() {
  const session = await auth();
  if (!session?.user) return redirect("/login");

  const deposits = await getUserVaultDeposits();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-slate-950 pt-28 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">My Vault</h1>
          <p className="text-slate-400">Manage your precious metals deposits and storage.</p>
        </div>
        <VaultDashboard deposits={JSON.parse(JSON.stringify(deposits))} />
      </div>
    </div>
  );
}
