import Image from "next/image";
import type { CSSProperties } from "react";
import type { MenuBusiness } from "@/features/menu/types";

type MenuHeaderProps = {
  business: MenuBusiness;
};

export function MenuHeader({ business }: MenuHeaderProps) {
  const backgroundStyle = {
    "--header-background": `url("${business.headerBackgroundImage}")`,
  } as CSSProperties;

  return (
    <header
      className="menu-header relative isolate overflow-hidden border-b border-warm-border text-white"
      style={backgroundStyle}
    >
      <div className="menu-header__overlay absolute inset-0 -z-10" aria-hidden="true" />

      <div className="mx-auto flex max-w-6xl flex-col items-start px-4 py-8 sm:px-8 sm:py-12">
        <div className="flex w-full items-center gap-3 text-left">
          <Image
            src={business.logoImage}
            alt={`${business.name} logo`}
            width={1080}
            height={1080}
            priority
            className="size-[clamp(2.5rem,10vw,6.5rem)] shrink-0 rounded-full object-cover"
          />
          <h1 className="min-w-0 whitespace-nowrap font-display text-[clamp(2.5rem,11vw,6.5rem)] leading-[0.92] tracking-[-0.06em] text-white">
            {business.name}
            <span className="text-coffee-yellow">.</span>
          </h1>
        </div>

        <div className="mt-5 w-full max-w-2xl border-t border-white/30 pt-4 text-left sm:mt-7 sm:pt-5">
          <p className="font-accent text-lg leading-snug text-coffee-yellow sm:text-2xl">
            {business.description}
          </p>
          <div className="mt-3 flex flex-col items-start gap-1 text-sm font-medium leading-relaxed text-white sm:mt-4 sm:flex-row sm:gap-6 sm:text-base">
            <p>{business.location}</p>
            <span className="hidden text-coffee-yellow sm:inline" aria-hidden="true">•</span>
            <p>{business.openingHours}</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="h-2 bg-espresso">
        <div className="h-full w-1/3 bg-coffee-yellow" />
      </div>
    </header>
  );
}
