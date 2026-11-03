import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PromotionForm } from "@/features/admin/components/PromotionForm";
import { getSession } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Nueva promoción | Red Gas",
  robots: { index: false },
};

export default async function NewPromotionPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/promotions"
        className="text-sm font-semibold text-roast underline-offset-4 hover:text-espresso hover:underline"
      >
        ← Promociones
      </Link>
      <h1 className="mt-4 font-display text-3xl leading-none tracking-[-0.03em] text-espresso md:text-4xl">
        Nueva promoción
      </h1>
      <PromotionForm />
    </div>
  );
}
