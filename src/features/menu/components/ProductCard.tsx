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
  const price = arsFormatter.format(product.priceInArs);

  if (!product.featured) {
    return (
      <article className="flex h-full flex-col border-b border-warm-border py-5 sm:py-6">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-display text-base leading-snug tracking-tight text-espresso sm:text-lg">
            {product.name}
          </h3>
          <p
            className="shrink-0 font-semibold tabular-nums text-espresso"
            aria-label={`Precio ilustrativo: ${price}`}
          >
            {price}
          </p>
        </div>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-roast sm:text-base">
          {product.description}
        </p>
      </article>
    );
  }

  const featuredContent = (
    <div className="flex flex-col justify-center p-5 sm:p-8">
      <p className="mb-3 w-fit bg-coffee-yellow px-3 py-1 font-bold text-xs uppercase tracking-wide text-espresso">
        Destacado
      </p>
      <h3 className="font-display text-2xl leading-tight tracking-[-0.04em] text-espresso sm:text-3xl">
        {product.name}
      </h3>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-roast sm:text-base">
        {product.description}
      </p>
      <p
        className="mt-5 w-fit border-t-2 border-coffee-yellow pt-3 font-semibold tabular-nums text-espresso"
        aria-label={`Precio ilustrativo: ${price}`}
      >
        {price}
      </p>
    </div>
  );

  if (product.image) {
    return (
      <article className="overflow-hidden rounded-2xl border border-warm-border bg-white shadow-sm sm:grid sm:grid-cols-[1.05fr_1fr]">
        <div className="relative aspect-[16/10] w-full bg-cream sm:aspect-auto sm:min-h-64">
          <Image
            src={product.image}
            alt={product.imageAlt}
            fill
            priority
            unoptimized
            sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1279px) 50vw, 560px"
            className="object-cover"
          />
        </div>
        {featuredContent}
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-espresso bg-espresso shadow-sm">
      <div className="sm:max-w-3xl [&_h3]:text-white [&_p:not(:first-child)]:text-white/90">
        {featuredContent}
      </div>
    </article>
  );
}
