import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { RegistrationForm } from "@/components/features/auth/registration.form";
import { AuthShell } from "@/components/landing/auth-shell";

export const metadata: Metadata = { title: "Open an account | Aegis Cargo" };

const RegisterPage = async () => {
  const session = await auth();
  if (session?.user) redirect(session.user.role === "ADMIN" ? "/dashboard" : "/account");
  return (
    <AuthShell
      title="Open an account"
      intro="One account for booking secure shipments and, after identity checks, storing metal in the vault."
      image="/images/warehouse.jpg"
      imageAlt="Warehouse aisles with racked pallets"
      imagePosition="18% center"
    >
      <RegistrationForm />
    </AuthShell>
  );
};

export default RegisterPage;
