import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PromotionsManager } from "@/features/admin/components/PromotionsManager";
import { getSession } from "@/server/auth/session";
import { listPromotions } from "@/server/promotions/service";

export const metadata: Metadata = {
  title: "Promociones | Red Gas",
  robots: { index: false },
};

const notices: Record<string, string> = {
  created: "Promoción creada.",
  updated: "Cambios guardados.",
};

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { saved } = await searchParams;
  const promotions = await listPromotions(session.business.id);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl leading-none tracking-[-0.03em] text-espresso md:text-4xl">
        Promociones
      </h1>
      <p className="mt-3 max-w-prose text-roast">
        Los banners que tus clientes ven arriba de la carta. Podés programarlos con fechas y
        ordenarlos como quieras.
      </p>
      <PromotionsManager
        promotions={promotions.map((promotion) => ({
          id: promotion.id,
          imageUrl: promotion.imageUrl,
          imageAlt: promotion.imageAlt,
          isActive: promotion.isActive,
          startsAt: promotion.startsAt?.toISOString() ?? null,
          endsAt: promotion.endsAt?.toISOString() ?? null,
        }))}
        notice={saved ? notices[saved] : undefined}
      />
    </div>
  );
}
