import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { QrCard } from "@/features/admin/components/QrCard";
import { buildMenuUrl } from "@/features/admin/qr";
import { getSession } from "@/server/auth/session";
import { getBusiness } from "@/server/business/service";

export const metadata: Metadata = {
  title: "Código QR | Red Gas",
  robots: { index: false },
};

export default async function QrPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [requestHeaders, business] = await Promise.all([
    headers(),
    getBusiness(session.business.id),
  ]);
  const url = buildMenuUrl(requestHeaders, business.slug);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl leading-none tracking-[-0.03em] text-espresso md:text-4xl">
        Código QR
      </h1>
      <p className="mt-3 text-roast">
        Imprimilo y ponelo en las mesas: tus clientes abren la carta con la cámara del celular.
      </p>
      <QrCard
        url={url}
        slug={business.slug}
        name={business.name}
        location={business.location}
        logoUrl={business.logoUrl || null}
      />
    </div>
  );
}
