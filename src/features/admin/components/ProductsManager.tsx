"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { AppButton } from "@/components/ui/AppButton";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CopyIcon,
  ImageIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { Switch } from "@/components/ui/Switch";
import { adminRequest } from "@/features/admin/api-errors";
import { productErrorMessage } from "@/features/admin/products/errors";
import { formatPrice } from "@/features/admin/products/price";
import { moveId } from "@/features/admin/reorder";

export type ProductListItem = {
  id: string;
  name: string;
  priceCents: number;
  imageUrl: string | null;
  imageAlt: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
};

export type ProductGroup = {
  categoryId: string;
  categoryName: string;
  isVisible: boolean;
  products: ProductListItem[];
};

const iconButton =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-roast transition-colors hover:bg-cream hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-30";

const smallButton = "min-h-10 px-4 py-2";

const primaryLink =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-espresso px-5 text-sm font-semibold text-white transition-colors hover:bg-roast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2";

export function ProductsManager({
  groups,
  hasCategories,
  notice,
}: {
  groups: ProductGroup[];
  hasCategories: boolean;
  notice?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
  const total = groups.reduce((sum, group) => sum + group.products.length, 0);

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
      setStatus({ kind: "error", text: productErrorMessage(result.code) });
      setBusy(false);
      return;
    }
    onSuccess?.();
    setStatus({ kind: "ok", text: successText });
    startRefresh(() => router.refresh());
    setBusy(false);
  }

  function toggleAvailable(product: ProductListItem) {
    void run(
      `/api/admin/products/${product.id}`,
      { method: "PATCH", body: { isAvailable: !product.isAvailable } },
      product.isAvailable
        ? `“${product.name}” quedó sin stock.`
        : `“${product.name}” ya está disponible.`,
    );
  }

  function move(group: ProductGroup, index: number, delta: -1 | 1) {
    const ids = moveId(
      group.products.map((product) => product.id),
      index,
      delta,
    );
    void run(
      "/api/admin/products/order",
      { method: "PUT", body: { categoryId: group.categoryId, ids } },
      `Moviste “${group.products[index].name}” ${delta === -1 ? "hacia arriba" : "hacia abajo"}.`,
    );
  }

  function duplicate(product: ProductListItem) {
    void run(
      `/api/admin/products/${product.id}/duplicate`,
      { method: "POST" },
      `Duplicaste “${product.name}”. La copia queda sin stock hasta que la habilites.`,
    );
  }

  function remove(product: ProductListItem) {
    void run(
      `/api/admin/products/${product.id}`,
      { method: "DELETE" },
      `Eliminaste “${product.name}”.`,
      () => setConfirmingId(null),
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-roast">
          {total === 1 ? "1 producto" : `${total} productos`}
        </p>
        {hasCategories && (
          <Link href="/admin/products/new" className={primaryLink}>
            <PlusIcon />
            Nuevo producto
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

      {!hasCategories ? (
        <p className="mt-2 rounded-3xl bg-white p-8 text-center text-roast shadow-[0_6px_20px_-12px_rgba(36,21,14,0.35)]">
          Para cargar productos primero necesitás una categoría.{" "}
          <Link
            href="/admin/categories"
            className="font-semibold text-espresso underline underline-offset-4"
          >
            Crear categorías
          </Link>
        </p>
      ) : total === 0 ? (
        <p className="mt-2 rounded-3xl bg-white p-8 text-center text-roast shadow-[0_6px_20px_-12px_rgba(36,21,14,0.35)]">
          Todavía no cargaste productos. Con “Nuevo producto” armás el primero.
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-8">
          {groups
            .filter((group) => group.products.length > 0)
            .map((group) => (
              <section key={group.categoryId} aria-labelledby={`group-${group.categoryId}`}>
                <h2
                  id={`group-${group.categoryId}`}
                  className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 px-2 font-accent text-xl text-espresso"
                >
                  {group.categoryName}
                  {!group.isVisible && (
                    <span className="rounded-full bg-warm-border px-2.5 py-0.5 font-sans text-xs font-semibold text-espresso">
                      Oculta
                    </span>
                  )}
                </h2>
                <ul className="flex flex-col gap-1 rounded-3xl bg-white p-2 shadow-[0_10px_30px_-16px_rgba(36,21,14,0.4)] sm:p-3">
                  {group.products.map((product, index) => {
                    const confirming = confirmingId === product.id;
                    return (
                      <li
                        key={product.id}
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
                              aria-label={`Subir ${product.name}`}
                              onClick={() => move(group, index, -1)}
                            >
                              <ArrowUpIcon />
                            </button>
                            <button
                              type="button"
                              className={`${iconButton} size-8`}
                              disabled={disabled || index === group.products.length - 1}
                              aria-label={`Bajar ${product.name}`}
                              onClick={() => move(group, index, 1)}
                            >
                              <ArrowDownIcon />
                            </button>
                          </div>

                          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream text-roast/60 sm:size-16">
                            {product.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.imageUrl}
                                alt={product.imageAlt ?? ""}
                                loading="lazy"
                                className="size-full object-cover"
                              />
                            ) : (
                              <ImageIcon width={22} height={22} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3
                              className={`break-words text-base font-semibold leading-snug ${
                                product.isAvailable ? "text-espresso" : "text-roast"
                              }`}
                            >
                              {product.name}
                            </h3>
                            <p className="mt-0.5 text-sm font-semibold text-espresso">
                              {formatPrice(product.priceCents)}
                            </p>
                            {(product.isFeatured || !product.isAvailable) && (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {product.isFeatured && (
                                  <span className="rounded-full bg-coffee-yellow/40 px-2.5 py-0.5 text-xs font-semibold text-espresso">
                                    Destacado
                                  </span>
                                )}
                                {!product.isAvailable && (
                                  <span className="rounded-full bg-[#b45309]/10 px-2.5 py-0.5 text-xs font-semibold text-[#b45309]">
                                    Sin stock
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2 pl-10 sm:pl-11">
                          <Switch
                            checked={product.isAvailable}
                            disabled={disabled}
                            label={`${product.name} disponible`}
                            text={product.isAvailable ? "Disponible" : "No disponible"}
                            onChange={() => toggleAvailable(product)}
                          />
                          {!confirming && (
                            <div className="flex shrink-0 items-center">
                              <button
                                type="button"
                                className={iconButton}
                                disabled={disabled}
                                aria-label={`Duplicar ${product.name}`}
                                title="Duplicar"
                                onClick={() => duplicate(product)}
                              >
                                <CopyIcon />
                              </button>
                              <Link
                                href={`/admin/products/${product.id}`}
                                className={iconButton}
                                aria-label={`Editar ${product.name}`}
                                title="Editar"
                              >
                                <PencilIcon />
                              </Link>
                              <button
                                type="button"
                                className={`${iconButton} hover:text-[#b45309]`}
                                disabled={disabled}
                                aria-label={`Eliminar ${product.name}`}
                                title="Eliminar"
                                onClick={() => {
                                  setConfirmingId(product.id);
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
                              ¿Eliminar “{product.name}”? No se puede deshacer.
                            </p>
                            <div className="flex shrink-0 gap-2">
                              <AppButton
                                variant="danger"
                                className={smallButton}
                                disabled={disabled}
                                onClick={() => remove(product)}
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
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
