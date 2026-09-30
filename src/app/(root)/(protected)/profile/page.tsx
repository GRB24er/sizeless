import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { prisma } from "@/constants/config/db";
import ProfileForm from "@/components/features/auth/profile.form";
import SecurityForm from "@/components/features/auth/security.form";
import { AccountShell, Panel } from "@/components/account/account-shell";

export const metadata: Metadata = { title: "Profile | Aegis Cargo" };

const PROFILE_SELECT = {
  bio: true,
  id: true,
  company: true,
  Address: { select: { city: true, country: true, state: true, street: true, postalCode: true } },
  User: { select: { email: true, name: true, phone: true } },
} as const;

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/profile");
  const userId = session.user.id;

  // Accounts opened by the team in the dashboard start without a profile row,
  // so create an empty one rather than turning the client away.
  const userData =
    (await prisma.profile.findUnique({ where: { userId }, select: PROFILE_SELECT })) ??
    (await prisma.profile.upsert({ where: { userId }, create: { userId }, update: {}, select: PROFILE_SELECT }));

  return (
    <AccountShell active="profile" title="Profile" intro="Your contact details, address and password.">
      <div className="grid gap-6 lg:grid-cols-12">
        <Panel title="Contact details and address" className="lg:col-span-8">
          <ProfileForm userData={userData} />
        </Panel>
        <div className="lg:col-span-4 [&>[data-slot=card]]:rounded-xl [&>[data-slot=card]]:border-line [&>[data-slot=card]]:bg-surface [&>[data-slot=card]]:shadow-none">
          <SecurityForm />
        </div>
      </div>
    </AccountShell>
  );
}
