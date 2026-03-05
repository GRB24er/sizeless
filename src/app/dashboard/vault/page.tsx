import { auth } from "~/auth";
import { redirect } from "next/navigation";
import VaultDashboard from "@/components/features/dashboard/shipments/VaultDashboard";

export default async function AdminVaultPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return redirect("/");

  return <VaultDashboard adminId={session.user.id} />;
}