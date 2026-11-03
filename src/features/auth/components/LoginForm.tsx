"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { FormField } from "@/components/ui/FormField";
import {
  loginErrorMessage,
  NETWORK_ERROR_MESSAGE,
} from "@/features/auth/login-errors";

export function LoginForm() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") ?? "").trim(),
          password: String(form.get("password") ?? ""),
        }),
      });

      if (response.ok) {
        router.replace("/admin");
        router.refresh();
        return; // keep the pending state while navigating
      }

      const body = (await response.json().catch(() => null)) as {
        error?: { code?: string };
      } | null;
      const code = body?.error?.code;
      setError(loginErrorMessage(code, response.headers.get("Retry-After")));
      setPending(false);
      // Inputs are disabled while pending; focus once they are enabled again.
      requestAnimationFrame(() =>
        (code === "invalid_credentials" ? passwordRef : emailRef).current?.focus(),
      );
    } catch {
      setError(NETWORK_ERROR_MESSAGE);
      setPending(false);
    }
  }

  const hasError = error !== "";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <FormField
        id="email"
        label="Email"
        type="email"
        autoComplete="username"
        inputMode="email"
        required
        readOnly={pending}
        inputRef={emailRef}
      />
      <FormField
        id="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        required
        readOnly={pending}
        inputRef={passwordRef}
      />

      {/* Reserved height so showing an error never shifts the layout. */}
      <p
        aria-live="polite"
        className={`min-h-10 rounded-xl text-sm ${
          hasError
            ? "border border-energy-orange bg-cream px-3 py-2 font-medium text-espresso"
            : ""
        }`}
      >
        {error}
      </p>

      <AppButton type="submit" loading={pending} className="w-full">
        {pending ? "Ingresando…" : "Ingresar"}
      </AppButton>
    </form>
  );
}
