"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { AppButton } from "@/components/ui/AppButton";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { Switch } from "@/components/ui/Switch";
import { adminRequest } from "@/features/admin/api-errors";
import { promotionErrorMessage } from "@/features/admin/promotions/errors";
import {
  formatWindow,
  promotionStatus,
  STATUS_LABELS,
  type PromotionStatus,
} from "@/features/admin/promotions/schedule";
import { useMounted } from "@/features/admin/promotions/useMounted";
import { moveId } from "@/features/admin/reorder";

export type PromotionListItem = {
  id: string;
  imageUrl: string;
  imageAlt: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

const iconButton =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-roast transition-colors hover:bg-cream hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-30";

const smallButton = "min-h-10 px-4 py-2";

const primaryLink =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-espresso px-5 text-sm font-semibold text-white transition-colors hover:bg-roast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2";

const chipClass: Record<PromotionStatus, string> = {
  active: "bg-coffee-yellow/40 text-espresso",
  scheduled: "bg-energy-orange/15 text-espresso",
  expired: "bg-[#b45309]/10 text-[#b45309]",
  paused: "bg-warm-border text-espresso",
};

export function PromotionsManager({
  promotions,
  notice,
}: {
  promotions: PromotionListItem[];
  notice?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useMounted();
  const [refreshing, startRefresh] = useTransition();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(
    notice ? { kind: "ok", text: notice } : null,
  );
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // The notice is already in state: drop `?saved=` so a reload does not repeat it.
  useEffect(() => {
    if (notice) router.replace(pathname, { scroll: false });
  }, [notice, pathname, router]);

  const disabled = busy || refreshing;
  const total = promotions.length;
  const now = new Date();

  /** Runs one mutation; on success refreshes server data, on failure shows the error. */
  async function run(
    url: string,
    init: { method: string; body?: unknown },
    successText: string,
    onSuccess?: () => void,
  ) {
    setBusy(true);
    setStatus(null);
    const result = await adminRequest(url, init);
    if (!result.ok) {
      if (result.code === "unauthorized") {
        router.replace("/login");
        return;
      }
      setStatus({ kind: "error", text: promotionErrorMessage(result.code) });
      setBusy(false);
      return;
    }
    onSuccess?.();
    setStatus({ kind: "ok", text: successText });
    startRefresh(() => router.refresh());
    setBusy(false);
  }

  function toggleActive(promotion: PromotionListItem) {
    void run(
      `/api/admin/promotions/${promotion.id}`,
      { method: "PATCH", body: { isActive: !promotion.isActive } },
      promotion.isActive ? "La promoción quedó pausada." : "La promoción volvió a estar activa.",
    );
  }

  function move(index: number, delta: -1 | 1) {
    const ids = moveId(
      promotions.map((promotion) => promotion.id),
      index,
      delta,
    );
    void run(
      "/api/admin/promotions/order",
      { method: "PUT", body: { ids } },
      `Moviste la promoción ${delta === -1 ? "hacia arriba" : "hacia abajo"}.`,
    );
  }

  function remove(promotion: PromotionListItem) {
    void run(
      `/api/admin/promotions/${promotion.id}`,
      { method: "DELETE" },
      "Eliminaste la promoción.",
      () => setConfirmingId(null),
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-roast">
          {total === 1 ? "1 promoción" : `${total} promociones`}
        </p>
        {total > 0 && (
          <Link href="/admin/promotions/new" className={primaryLink}>
            <PlusIcon />
            Nueva promoción
          </Link>
        )}
      </div>

      <p
        role="status"
        aria-live="polite"
        className={`min-h-7 px-1 py-1 text-sm ${
          status?.kind === "error" ? "font-semibold text-[#b45309]" : "text-roast"
        }`}
      >
        {status?.text ?? ""}
      </p>

      {total === 0 ? (
        <div className="mt-2 flex flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center text-roast shadow-[0_6px_20px_-12px_rgba(36,21,14,0.35)]">
          <p>Todavía no cargaste promociones. Con “Nueva promoción” armás la primera.</p>
          <Link href="/admin/promotions/new" className={primaryLink}>
            <PlusIcon />
            Nueva promoción
          </Link>
        </div>
      ) : (
        <ul className="mt-2 flex flex-col gap-1 rounded-3xl bg-white p-2 shadow-[0_10px_30px_-16px_rgba(36,21,14,0.4)] sm:p-3">
          {promotions.map((promotion, index) => {
            const confirming = confirmingId === promotion.id;
            const state = promotionStatus(promotion, now);
            return (
              <li
                key={promotion.id}
                className={`rounded-2xl px-2 py-2.5 transition-colors sm:px-3 ${
                  confirming ? "bg-cream" : "hover:bg-cream/60"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      className={`${iconButton} size-8`}
                      disabled={disabled || index === 0}
                      aria-label={`Subir promoción ${index + 1}`}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUpIcon />
                    </button>
                    <button
                      type="button"
                      className={`${iconButton} size-8`}
                      disabled={disabled || index === total - 1}
                      aria-label={`Bajar promoción ${index + 1}`}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDownIcon />
                    </button>
                  </div>

                  <div className="aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-xl bg-cream sm:w-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={promotion.imageUrl}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2
                      className={`break-words text-base font-semibold leading-snug ${
                        promotion.isActive ? "text-espresso" : "text-roast"
                      }`}
                    >
                      {promotion.imageAlt}
                    </h2>
                    <div className="mt-1.5 min-h-5">
                      {mounted && (
                        <>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${chipClass[state]}`}
                          >
                            {STATUS_LABELS[state]}
                          </span>
                          <p className="mt-1.5 text-sm text-roast">
                            {formatWindow(promotion.startsAt, promotion.endsAt, now)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 pl-10 sm:pl-11">
                  <Switch
                    checked={promotion.isActive}
                    disabled={disabled}
                    label={`Promoción ${index + 1} activa`}
                    text="Mostrar en la carta"
                    onChange={() => toggleActive(promotion)}
                  />
                  {!confirming && (
                    <div className="flex shrink-0 items-center">
                      <Link
                        href={`/admin/promotions/${promotion.id}`}
                        className={iconButton}
                        aria-label={`Editar promoción ${index + 1}`}
                        title="Editar"
                      >
                        <PencilIcon />
                      </Link>
                      <button
                        type="button"
                        className={`${iconButton} hover:text-[#b45309]`}
                        disabled={disabled}
                        aria-label={`Eliminar promoción ${index + 1}`}
                        title="Eliminar"
                        onClick={() => {
                          setConfirmingId(promotion.id);
                          setStatus(null);
                        }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </div>

                {confirming && (
                  <div className="mt-3 flex flex-col gap-3 pl-10 sm:flex-row sm:items-center sm:justify-between sm:pl-11">
                    <p className="text-sm text-espresso">
                      ¿Eliminar esta promoción? No se puede deshacer.
                    </p>
                    <div className="flex shrink-0 gap-2">
                      <AppButton
                        variant="danger"
                        className={smallButton}
                        disabled={disabled}
                        onClick={() => remove(promotion)}
                      >
                        Eliminar
                      </AppButton>
                      <AppButton
                        variant="secondary"
                        className={smallButton}
                        autoFocus
                        onClick={() => setConfirmingId(null)}
                      >
                        Cancelar
                      </AppButton>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
