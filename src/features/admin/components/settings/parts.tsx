"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AppButton } from "@/components/ui/AppButton";
import type { AdminResult } from "@/features/admin/api-errors";
import { settingsErrorMessage } from "@/features/admin/settings/errors";

export const cardClass =
  "rounded-3xl bg-white p-5 shadow-[0_10px_30px_-16px_rgba(36,21,14,0.4)] sm:p-6";

export const fieldClass =
  "w-full rounded-xl border border-warm-border bg-white px-3.5 py-2.5 text-base text-espresso placeholder:text-roast/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:opacity-60";

/** Compact round icon button used for row actions. */
export const iconButtonClass =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-roast transition-colors hover:bg-white hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-30";

export type CardStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

/** Per-card save status plus the shared "session expired" redirect. */
export function useCardStatus() {
  const router = useRouter();
  const [status, setStatus] = useState<CardStatus>({ kind: "idle" });

  return {
    status,
    saving: status.kind === "saving",
    reset: () => setStatus((current) => (current.kind === "idle" ? current : { kind: "idle" })),
    start: () => setStatus({ kind: "saving" }),
    info: (message: string) => setStatus({ kind: "ok", message }),
    fail: (message: string) => setStatus({ kind: "error", message }),
    /** Handles a failed request; returns true when the caller should stop. */
    handleFailure(result: Extract<AdminResult<unknown>, { ok: false }>, fallback?: string) {
      if (result.code === "unauthorized") {
        router.replace("/login");
        return;
      }
      setStatus({ kind: "error", message: fallback ?? settingsErrorMessage(result.code) });
    },
    succeed(message = "Guardado. Ya se ve en tu carta.") {
      setStatus({ kind: "ok", message });
      router.refresh();
    },
  };
}

export function SettingsCard({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className={`${cardClass} flex flex-col gap-5`}>
      <div>
        <h2 id={`${id}-heading`} className="font-accent text-xl text-espresso">
          {title}
        </h2>
        {hint && <p className="mt-1 text-sm text-roast">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** Save button and aria-live status of one card; renders nothing in read-only mode. */
export function SaveBar({
  status,
  readOnly,
  disabled,
  label = "Guardar",
}: {
  status: CardStatus;
  readOnly: boolean;
  disabled?: boolean;
  label?: string;
}) {
  if (readOnly) return null;
  const saving = status.kind === "saving";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <AppButton type="submit" loading={saving} disabled={disabled} className="px-7">
        {saving ? "Guardando…" : label}
      </AppButton>
      <p
        role="status"
        aria-live="polite"
        className={`min-h-5 text-sm font-semibold ${
          status.kind === "error" ? "text-[#b45309]" : "text-roast"
        }`}
      >
        {status.kind === "ok" || status.kind === "error" ? status.message : ""}
      </p>
    </div>
  );
}
