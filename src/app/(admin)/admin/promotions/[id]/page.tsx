import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PromotionForm } from "@/features/admin/components/PromotionForm";
import { getSession } from "@/server/auth/session";
import { listPromotions } from "@/server/promotions/service";

export const metadata: Metadata = {
  title: "Editar promoción | Red Gas",
  robots: { index: false },
};

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const promotions = await listPromotions(session.business.id);
  const promotion = promotions.find((item) => item.id === id);
  if (!promotion) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/promotions"
        className="text-sm font-semibold text-roast underline-offset-4 hover:text-espresso hover:underline"
      >
        ← Promociones
      </Link>
      <h1 className="mt-4 font-display text-3xl leading-none tracking-[-0.03em] text-espresso md:text-4xl">
        Editar promoción
      </h1>
      <PromotionForm
        promotion={{
          id: promotion.id,
          imageUrl: promotion.imageUrl,
          imageAlt: promotion.imageAlt,
          isActive: promotion.isActive,
          startsAt: promotion.startsAt?.toISOString() ?? null,
          endsAt: promotion.endsAt?.toISOString() ?? null,
        }}
      />
    </div>
  );
}
