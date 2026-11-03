"use client";

import { useRouter } from "next/navigation";
import {
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/ui/icons";
import { adminErrorMessage, adminRequest } from "@/features/admin/api-errors";
import { moveId } from "@/features/admin/reorder";

export type CategoryItem = {
  id: string;
  name: string;
  isVisible: boolean;
  productCount: number;
};

const iconButton =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-roast transition-colors hover:bg-cream hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-30";

const smallButton = "min-h-10 px-4 py-2";

export function CategoriesManager({ categories }: { categories: CategoryItem[] }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const newNameRef = useRef<HTMLInputElement>(null);

  const disabled = busy || refreshing;

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
      setStatus({ kind: "error", text: adminErrorMessage(result.code) });
      setBusy(false);
      return;
    }
    onSuccess?.();
    setStatus({ kind: "ok", text: successText });
    startRefresh(() => router.refresh());
    setBusy(false);
  }

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (disabled || name === "") return;
    void run(
      "/api/admin/categories",
      { method: "POST", body: { name } },
      `Creaste la categoría “${name}”.`,
      () => {
        setNewName("");
        newNameRef.current?.focus();
      },
    );
  }

  function startEdit(category: CategoryItem) {
    setEditingId(category.id);
    setDraft(category.name);
    setConfirmingId(null);
    setStatus(null);
  }

  function saveEdit(category: CategoryItem) {
    const name = draft.trim();
    if (disabled) return;
    if (name === category.name) {
      setEditingId(null);
      return;
    }
    void run(
      `/api/admin/categories/${category.id}`,
      { method: "PATCH", body: { name } },
      `Renombraste la categoría a “${name}”.`,
      () => setEditingId(null),
    );
  }

  function handleEditKey(event: KeyboardEvent, category: CategoryItem) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveEdit(category);
    } else if (event.key === "Escape") {
      setEditingId(null);
    }
  }

  function toggleVisible(category: CategoryItem) {
    void run(
      `/api/admin/categories/${category.id}`,
      { method: "PATCH", body: { isVisible: !category.isVisible } },
      category.isVisible
        ? `“${category.name}” ahora está oculta.`
        : `“${category.name}” ahora es visible en la carta.`,
    );
  }

  function move(index: number, delta: -1 | 1) {
    const ids = moveId(
      categories.map((category) => category.id),
      index,
      delta,
    );
    void run(
      "/api/admin/categories/order",
      { method: "PUT", body: { ids } },
      `Moviste “${categories[index].name}” ${delta === -1 ? "hacia arriba" : "hacia abajo"}.`,
    );
  }

  function remove(category: CategoryItem) {
    void run(
      `/api/admin/categories/${category.id}`,
      { method: "DELETE" },
      `Eliminaste la categoría “${category.name}”.`,
      () => setConfirmingId(null),
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-2">
      <form
        onSubmit={handleCreate}
        className="flex items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-[0_6px_20px_-12px_rgba(36,21,14,0.45)] focus-within:ring-2 focus-within:ring-espresso"
      >
        <label htmlFor="new-category" className="sr-only">
          Nombre de la nueva categoría
        </label>
        <input
          id="new-category"
          ref={newNameRef}
          value={newName}
          maxLength={80}
          autoComplete="off"
          placeholder="Nueva categoría, ej.: Cafés"
          readOnly={busy}
          onChange={(event) => setNewName(event.target.value)}
          className="min-w-0 flex-1 bg-transparent py-2 text-base text-espresso placeholder:text-roast/70 focus:outline-none"
        />
        <AppButton
          type="submit"
          className="shrink-0 px-5"
          disabled={disabled || newName.trim() === ""}
        >
          Crear
        </AppButton>
      </form>

      <p
        role="status"
        aria-live="polite"
        className={`min-h-7 px-5 py-1 text-sm ${
          status?.kind === "error" ? "font-semibold text-[#b45309]" : "text-roast"
        }`}
      >
        {status?.text ?? ""}
      </p>

      {categories.length === 0 ? (
        <p className="rounded-3xl bg-white p-8 text-center text-roast shadow-[0_6px_20px_-12px_rgba(36,21,14,0.35)]">
          Todavía no tenés categorías. Creá la primera para empezar a armar tu carta.
        </p>
      ) : (
        <ol className="flex flex-col gap-1 rounded-3xl bg-white p-2 shadow-[0_10px_30px_-16px_rgba(36,21,14,0.4)] sm:p-3">
          {categories.map((category, index) => {
            const editing = editingId === category.id;
            const confirming = confirmingId === category.id;
            return (
              <li
                key={category.id}
                className={`rounded-2xl px-2 py-2.5 transition-colors sm:px-3 ${
                  confirming ? "bg-cream" : "hover:bg-cream/60"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      className={`${iconButton} size-8`}
                      disabled={disabled || index === 0 || editing}
                      aria-label={`Subir ${category.name}`}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUpIcon />
                    </button>
                    <button
                      type="button"
                      className={`${iconButton} size-8`}
                      disabled={disabled || index === categories.length - 1 || editing}
                      aria-label={`Bajar ${category.name}`}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDownIcon />
                    </button>
                  </div>

                  {editing ? (
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                      <AppInput
                        aria-label={`Nuevo nombre para ${category.name}`}
                        name="categoryName"
                        value={draft}
                        maxLength={80}
                        autoFocus
                        readOnly={busy}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => handleEditKey(event, category)}
                      />
                      <div className="flex gap-2">
                        <AppButton
                          className={smallButton}
                          disabled={disabled || draft.trim() === ""}
                          onClick={() => saveEdit(category)}
                        >
                          Guardar
                        </AppButton>
                        <AppButton
                          variant="secondary"
                          className={smallButton}
                          onClick={() => setEditingId(null)}
                        >
                          Cancelar
                        </AppButton>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <h2
                          className={`break-words text-base font-semibold leading-snug ${
                            category.isVisible ? "text-espresso" : "text-roast"
                          }`}
                        >
                          {category.name}
                        </h2>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={category.isVisible}
                            aria-label={`Mostrar ${category.name} en la carta`}
                            disabled={disabled}
                            onClick={() => toggleVisible(category)}
                            className="group inline-flex items-center gap-2 rounded-full py-0.5 pr-1 text-sm font-medium text-roast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:opacity-60"
                          >
                            <span
                              aria-hidden="true"
                              className={`relative h-5 w-9 rounded-full transition-colors ${
                                category.isVisible ? "bg-coffee-yellow" : "bg-warm-border"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-[0_1px_3px_rgba(36,21,14,0.35)] transition-transform ${
                                  category.isVisible ? "translate-x-4" : ""
                                }`}
                              />
                            </span>
                            {category.isVisible ? "Visible" : "Oculta"}
                          </button>
                          <span className="text-sm text-roast/80">
                            {category.productCount === 1
                              ? "1 producto"
                              : `${category.productCount} productos`}
                          </span>
                        </div>
                      </div>

                      {!confirming && (
                        <div className="flex shrink-0 items-center">
                          <button
                            type="button"
                            className={iconButton}
                            disabled={disabled}
                            aria-label={`Renombrar ${category.name}`}
                            title="Renombrar"
                            onClick={() => startEdit(category)}
                          >
                            <PencilIcon />
                          </button>
                          <button
                            type="button"
                            className={`${iconButton} hover:text-[#b45309]`}
                            disabled={disabled}
                            aria-label={`Eliminar ${category.name}`}
                            title="Eliminar"
                            onClick={() => {
                              setConfirmingId(category.id);
                              setStatus(null);
                            }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {confirming && !editing && (
                  <div className="mt-3 flex flex-col gap-3 pl-10 sm:flex-row sm:items-center sm:justify-between sm:pl-11">
                    <p className="text-sm text-espresso">
                      ¿Eliminar “{category.name}”? No se puede deshacer.
                    </p>
                    <div className="flex shrink-0 gap-2">
                      <AppButton
                        variant="danger"
                        className={smallButton}
                        disabled={disabled}
                        onClick={() => remove(category)}
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
        </ol>
      )}
    </div>
  );
}
