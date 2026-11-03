import { redirect } from "next/navigation";
import { AdminNav } from "@/features/admin/components/AdminNav";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { getSession } from "@/server/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-dvh bg-cream md:flex">
      <aside className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-espresso px-4 py-3 md:h-dvh md:w-64 md:shrink-0 md:flex-col md:items-stretch md:justify-start md:gap-10 md:px-5 md:py-8">
        <div className="min-w-0 md:px-3">
          <p className="truncate font-display text-2xl leading-none tracking-[-0.04em] text-white md:text-3xl">
            {session.business.name}
            <span className="text-coffee-yellow">.</span>
          </p>
          <p className="mt-1.5 truncate text-sm text-cream/75">
            {session.user.name}
          </p>
        </div>
        <AdminNav />
        <div className="shrink-0 md:mt-auto">
          <LogoutButton tone="dark" />
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 pt-7 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:px-12 md:pt-12 md:pb-16">
        {children}
      </main>
    </div>
  );
}
