import { notFound } from "next/navigation";
import { MenuHeader } from "@/features/menu/components/MenuHeader";
import { redGasBusiness } from "@/features/menu/mock-business";

export default async function PublicMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug !== "red-gas") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-cream">
      <MenuHeader business={redGasBusiness} />
    </main>
  );
}
