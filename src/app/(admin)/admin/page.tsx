import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { getSession } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Panel | Red Gas",
  robots: { index: false },
};

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <main className="flex min-h-dvh items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-warm-border bg-white p-6 shadow-sm sm:p-8">
        <p className="font-accent text-sm text-roast">{session.business.name}</p>
        <h1 className="mt-1 break-words font-display text-2xl tracking-tight text-espresso">
          Hola, {session.user.name}
        </h1>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
