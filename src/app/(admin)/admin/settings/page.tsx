import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BusinessCard } from "@/features/admin/components/settings/BusinessCard";
import { HoursCard } from "@/features/admin/components/settings/HoursCard";
import { ImagesCard } from "@/features/admin/components/settings/ImagesCard";
import { PasswordCard } from "@/features/admin/components/settings/PasswordCard";
import { SocialCard } from "@/features/admin/components/settings/SocialCard";
import { getSession } from "@/server/auth/session";
import {
  getBusiness,
  listOpeningHours,
  listSocialLinks,
} from "@/server/business/service";

export const metadata: Metadata = {
  title: "Configuración | Red Gas",
  robots: { index: false },
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const readOnly = session.user.role !== "OWNER";
  const [business, hours, links] = await Promise.all([
    getBusiness(session.business.id),
    listOpeningHours(session.business.id),
    listSocialLinks(session.business.id),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl leading-none tracking-[-0.03em] text-espresso md:text-4xl">
        Configuración
      </h1>
      <p className="mt-3 text-roast">
        {readOnly
          ? "Solo el dueño puede cambiar estos datos. Acá podés verlos."
          : "Los datos de tu negocio, tal como los ve tu carta."}
      </p>

      <div className="mt-8 flex flex-col gap-5">
        <BusinessCard
          readOnly={readOnly}
          initial={{
            name: business.name,
            description: business.description,
            location: business.location,
            contactEmail: business.contactEmail ?? "",
          }}
        />
        <ImagesCard
          readOnly={readOnly}
          initial={{ logoUrl: business.logoUrl, headerImageUrl: business.headerImageUrl }}
        />
        <HoursCard
          readOnly={readOnly}
          initial={hours.map(({ dayOfWeek, opensAt, closesAt }) => ({
            dayOfWeek,
            opensAt,
            closesAt,
          }))}
        />
        <SocialCard
          readOnly={readOnly}
          initial={links.map(({ platform, handle, url }) => ({ platform, handle, url }))}
        />
        <PasswordCard />
      </div>
    </div>
  );
}
