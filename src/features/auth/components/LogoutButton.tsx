"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppButton } from "@/components/ui/AppButton";

export function LogoutButton() {
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

  return (
    <div className="flex flex-col gap-2">
      <AppButton variant="secondary" loading={pending} onClick={handleClick}>
        {pending ? "Cerrando…" : "Cerrar sesión"}
      </AppButton>
      <p aria-live="polite" className="min-h-5 text-sm text-roast">
        {failed ? "No pudimos cerrar la sesión. Intentá de nuevo." : ""}
      </p>
    </div>
  );
}
