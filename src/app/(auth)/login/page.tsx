import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/auth";
import { LoginForm } from "@/components/features/auth/login.form";
import { AuthShell } from "@/components/landing/auth-shell";

export const metadata: Metadata = { title: "Sign in | Aegis Cargo" };

const LoginPage = async () => {
  const session = await auth();
  if (session?.user) redirect(session.user.role === "ADMIN" ? "/dashboard" : "/account");
  return (
    <AuthShell
      title="Sign in"
      intro="Book shipments, follow their handovers and see your vault holdings."
      image="/images/port.jpeg"
      imageAlt="Container ship stacked with shipping containers"
      imagePosition="60% center"
      footer={
        <>
          New to Aegis Cargo?{" "}
          <Link href="/register" className="font-medium text-ink underline decoration-line-2 underline-offset-4 hover:decoration-ink">
            Open an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
};

export default LoginPage;
