"use client";

import { useState, type FormEvent } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { adminRequest } from "@/features/admin/api-errors";
import {
  passwordErrorMessage,
  validatePasswordChange,
  type PasswordDraft,
  type PasswordErrors,
} from "@/features/admin/settings/password";
import { SaveBar, SettingsCard, fieldClass, iconButtonClass, useCardStatus } from "./parts";

const emptyDraft: PasswordDraft = { current: "", next: "", confirm: "" };

const fields = [
  { key: "current", id: "current-password", label: "Contraseña actual", autoComplete: "current-password" },
  { key: "next", id: "new-password", label: "Contraseña nueva", autoComplete: "new-password" },
  { key: "confirm", id: "confirm-password", label: "Repetí la contraseña nueva", autoComplete: "new-password" },
] as const;

/** Change-your-own-password card; available to every role. */
export function PasswordCard() {
  const card = useCardStatus();
  const [draft, setDraft] = useState<PasswordDraft>(emptyDraft);
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [visible, setVisible] = useState(false);

  function change(key: keyof PasswordDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    card.reset();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (card.saving) return;

    const found = validatePasswordChange(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      card.fail("Revisá los campos marcados.");
      return;
    }

    card.start();
    const result = await adminRequest("/api/auth/password", {
      method: "POST",
      body: { currentPassword: draft.current, newPassword: draft.next },
    });
    if (!result.ok) {
      if (result.code === "invalid_password") setErrors({ current: "No es la contraseña actual." });
      card.handleFailure(result, passwordErrorMessage(result.code));
      return;
    }
    setDraft(emptyDraft);
    setErrors({});
    setVisible(false);
    card.info("Listo, cambiaste tu contraseña. Cerramos tus otras sesiones.");
  }

  return (
    <SettingsCard
      id="password"
      title="Tu contraseña"
      hint="Es solo tuya: cada persona del equipo puede cambiar la suya."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {fields.map(({ key, id, label, autoComplete }) => (
          <div key={key} className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-semibold text-espresso">
              {label}
            </label>
            <div className="flex items-center gap-1">
              <input
                id={id}
                name={id}
                type={visible ? "text" : "password"}
                value={draft[key]}
                autoComplete={autoComplete}
                maxLength={200}
                disabled={card.saving}
                aria-invalid={errors[key] ? true : undefined}
                aria-describedby={errors[key] ? `${id}-error` : undefined}
                onChange={(event) => change(key, event.target.value)}
                className={`${fieldClass} min-w-0 flex-1`}
              />
              {key === "current" && (
                <button
                  type="button"
                  aria-label={visible ? "Ocultar contraseñas" : "Mostrar contraseñas"}
                  aria-pressed={visible}
                  title={visible ? "Ocultar" : "Mostrar"}
                  onClick={() => setVisible((on) => !on)}
                  className={iconButtonClass}
                >
                  {visible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              )}
            </div>
            {errors[key] && (
              <p id={`${id}-error`} className="text-sm text-roast">
                {errors[key]}
              </p>
            )}
          </div>
        ))}
        <SaveBar status={card.status} readOnly={false} label="Cambiar contraseña" />
      </form>
    </SettingsCard>
  );
}
