import Image from "next/image";
import type { MenuProduct } from "@/features/menu/types";

type ProductCardProps = {
  product: MenuProduct;
};

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-warm-border bg-white shadow-sm">
      <div className="relative aspect-[3/2] w-full bg-cream">
        <Image
          src={product.image}
          alt={product.imageAlt}
          fill
          unoptimized
          sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1279px) 50vw, 384px"
          className="object-cover"
        />
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="font-display text-lg leading-snug tracking-tight text-espresso sm:text-xl">
          {product.name}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-roast sm:text-base">
          {product.description}
        </p>
        <p className="mt-4 font-semibold text-espresso" aria-label={`Precio ilustrativo: ${arsFormatter.format(product.priceInArs)}`}>
          {arsFormatter.format(product.priceInArs)}
        </p>
      </div>
    </article>
  );
}
