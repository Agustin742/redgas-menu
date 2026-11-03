"use client";

import { useState, type FormEvent } from "react";
import { FormField } from "@/components/ui/FormField";
import { adminRequest } from "@/features/admin/api-errors";
import { businessFieldErrors } from "@/features/admin/settings/errors";
import { SaveBar, SettingsCard, fieldClass, useCardStatus } from "./parts";

export type BusinessValues = {
  name: string;
  description: string;
  location: string;
  contactEmail: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function BusinessCard({
  initial,
  readOnly,
}: {
  initial: BusinessValues;
  readOnly: boolean;
}) {
  const card = useCardStatus();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(field: keyof BusinessValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    card.reset();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (readOnly || card.saving) return;

    const next: Record<string, string> = {};
    if (values.name.trim() === "") next.name = "Ingresá un nombre de hasta 80 caracteres.";
    if (values.location.trim() === "") next.location = "Ingresá la ubicación de tu local.";
    if (values.contactEmail.trim() !== "" && !EMAIL.test(values.contactEmail.trim())) {
      next.contactEmail = "Revisá el email: tiene que verse como nombre@dominio.com.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      card.fail("Revisá los campos marcados.");
      return;
    }

    card.start();
    const email = values.contactEmail.trim();
    const result = await adminRequest("/api/admin/business", {
      method: "PATCH",
      body: {
        name: values.name.trim(),
        description: values.description.trim(),
        location: values.location.trim(),
        contactEmail: email === "" ? null : email,
      },
    });
    if (!result.ok) {
      const fieldErrors = businessFieldErrors(result.details);
      setErrors(fieldErrors);
      card.handleFailure(
        result,
        Object.keys(fieldErrors).length > 0 ? "Revisá los campos marcados." : undefined,
      );
      return;
    }
    setErrors({});
    card.succeed();
  }

  return (
    <SettingsCard id="business" title="Tu negocio" hint="Lo que ven tus clientes arriba de la carta.">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormField
          id="name"
          label="Nombre"
          value={values.name}
          maxLength={80}
          autoComplete="off"
          error={errors.name}
          disabled={readOnly || card.saving}
          onChange={(event) => update("name", event.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-semibold text-espresso">
            Frase bajo el nombre <span className="font-normal text-roast">(opcional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            maxLength={500}
            value={values.description}
            disabled={readOnly || card.saving}
            placeholder="Ej.: Café de especialidad y algo rico para acompañar."
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={errors.description ? "description-error" : undefined}
            onChange={(event) => update("description", event.target.value)}
            className={`${fieldClass} resize-y`}
          />
          {errors.description && (
            <p id="description-error" className="text-sm text-roast">
              {errors.description}
            </p>
          )}
        </div>

        <FormField
          id="location"
          label="Ubicación"
          value={values.location}
          maxLength={160}
          autoComplete="off"
          placeholder="Ej.: Salta, Argentina"
          error={errors.location}
          disabled={readOnly || card.saving}
          onChange={(event) => update("location", event.target.value)}
        />

        <div>
          <FormField
            id="contactEmail"
            type="email"
            label="Email de contacto (opcional)"
            value={values.contactEmail}
            maxLength={254}
            autoComplete="off"
            placeholder="hola@tunegocio.com"
            error={errors.contactEmail}
            disabled={readOnly || card.saving}
            onChange={(event) => update("contactEmail", event.target.value)}
          />
          <p className="mt-1.5 text-sm text-roast">
            Si lo dejás vacío, no mostramos el bloque de contacto en la carta.
          </p>
        </div>

        <SaveBar status={card.status} readOnly={readOnly} />
      </form>
    </SettingsCard>
  );
}
