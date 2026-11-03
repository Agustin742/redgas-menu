"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { LogoutIcon } from "@/components/ui/icons";

type LogoutButtonProps = {
  /** "dark" renders a quiet control for the espresso admin sidebar. */
  tone?: "light" | "dark";
};

export function LogoutButton({ tone = "light" }: LogoutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleClick() {
    setPending(true);
    setFailed(false);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("logout failed");
      router.replace("/login");
      router.refresh();
    } catch {
      setFailed(true);
      setPending(false);
    }
  }

  const label = pending ? "Cerrando…" : "Cerrar sesión";
  const error = failed ? "No pudimos cerrar la sesión. Intentá de nuevo." : "";

  if (tone === "dark") {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={handleClick}
          disabled={pending}
          aria-busy={pending || undefined}
          className="flex min-h-10 w-full items-center gap-2 rounded-full px-3 text-sm font-semibold text-cream/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-espresso disabled:opacity-60 md:px-4"
        >
          <LogoutIcon />
          <span className="sr-only sm:not-sr-only">{label}</span>
        </button>
        <p
          aria-live="polite"
          className={
            failed
              ? "absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white p-3 text-sm text-espresso shadow-lg md:static md:mt-2 md:w-auto md:bg-transparent md:p-0 md:px-4 md:text-cream md:shadow-none"
              : "sr-only"
          }
        >
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <AppButton variant="secondary" loading={pending} onClick={handleClick}>
        {label}
      </AppButton>
      <p aria-live="polite" className="min-h-5 text-sm text-roast">
        {error}
      </p>
    </div>
  );
}
