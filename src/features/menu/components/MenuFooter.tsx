import type { MenuFooterData } from "@/features/menu/types";

type MenuFooterProps = {
  businessName: string;
  footer: MenuFooterData;
};

export function MenuFooter({ businessName, footer }: MenuFooterProps) {
  return (
    <footer
      aria-label={`Información de ${businessName}`}
      className="relative overflow-hidden border-t-8 border-coffee-yellow bg-espresso text-cream"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full border-[18px] border-energy-orange/30 sm:right-12 sm:top-[-7rem] sm:size-64"
      />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="relative grid gap-9 md:grid-cols-[1.1fr_1fr] md:gap-14">
          <div className="max-w-xl">
            <p className="font-accent text-lg text-coffee-yellow sm:text-xl">
              Una pausa con sabor
            </p>
            <h2 className="mt-2 max-w-lg font-display text-[clamp(2.2rem,9vw,4.5rem)] leading-[0.98] tracking-[-0.055em] text-cream">
              {businessName}
              <span className="text-energy-orange">.</span>
            </h2>
            <div className="mt-6 flex items-center gap-3" aria-hidden="true">
              <span className="h-1.5 w-16 rounded-full bg-coffee-yellow" />
              <span className="size-2.5 rotate-45 bg-energy-orange" />
              <span className="h-px w-12 bg-cream/40" />
            </div>
          </div>

          <div className="grid gap-7 border-t border-cream/20 pt-7 sm:grid-cols-2 md:border-l md:border-t-0 md:pl-10 md:pt-1">
            <section aria-labelledby="footer-contact-heading">
              <h3 id="footer-contact-heading" className="font-display text-sm uppercase tracking-wide text-coffee-yellow">
                Visitanos
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-cream/90">
                <span className="font-semibold text-white">Ubicación</span>
                <br />
                {footer.location}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-cream/90">
                <span className="font-semibold text-white">Horarios</span>
                <br />
                {footer.openingHours}
              </p>
              <p className="mt-4 break-words text-sm leading-relaxed text-cream/90">
                <span className="font-semibold text-white">Contacto</span>
                <br />
                {footer.contactEmail}
              </p>
            </section>

            <section aria-labelledby="footer-social-heading" className="sm:border-l sm:border-cream/20 sm:pl-6">
              <h3 id="footer-social-heading" className="font-display text-sm uppercase tracking-wide text-coffee-yellow">
                Seguinos
              </h3>
              <ul className="mt-3 space-y-3 text-sm leading-relaxed text-cream/90">
                {footer.socials.map((social) => (
                  <li key={social.name}>
                    <span className="block font-semibold text-white">{social.name}</span>
                    <span>{social.handle}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-cream/20 pt-5 text-xs leading-relaxed text-cream/75 sm:flex-row sm:items-center sm:justify-between">
          <p>Datos ilustrativos de contacto y redes; reemplazar antes de publicar.</p>
          <p className="font-accent text-sm text-coffee-yellow">Hecho para disfrutar, sin apuro.</p>
        </div>
      </div>
    </footer>
  );
}
