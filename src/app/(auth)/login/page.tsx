import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { getSession } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Ingresar | Panel de administración",
  robots: { index: false },
};

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-warm-border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl tracking-tight text-espresso">
          Panel de administración
        </h1>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
