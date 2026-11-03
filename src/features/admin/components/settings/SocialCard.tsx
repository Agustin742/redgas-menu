"use client";

import { useRef, useState, type FormEvent } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { adminRequest } from "@/features/admin/api-errors";
import { moveId } from "@/features/admin/reorder";
import { indexedFieldErrors, settingsErrorMessage } from "@/features/admin/settings/errors";
import {
  MAX_SOCIAL_LINKS,
  nextPlatform,
  platformOptions,
  toSocialPayload,
  validateSocial,
  type SocialDraft,
} from "@/features/admin/settings/social";
import type { SocialPlatformName } from "@/server/public-menu/mapper";
import { SaveBar, SettingsCard, fieldClass, iconButtonClass, useCardStatus } from "./parts";

export type SocialLinkValue = { platform: SocialPlatformName; handle: string; url: string | null };

const handleLabels: Partial<Record<SocialPlatformName, { label: string; placeholder: string }>> = {
  INSTAGRAM: { label: "Usuario", placeholder: "@tuusuario" },
  TIKTOK: { label: "Usuario", placeholder: "@tuusuario" },
  X: { label: "Usuario", placeholder: "@tuusuario" },
  WHATSAPP: { label: "Número", placeholder: "+54 387 555 1234" },
  FACEBOOK: { label: "Nombre de la página", placeholder: "Tu negocio" },
  WEBSITE: { label: "Dirección", placeholder: "tunegocio.com" },
};

export function SocialCard({
  initial,
  readOnly,
}: {
  initial: SocialLinkValue[];
  readOnly: boolean;
}) {
  const card = useCardStatus();
  const counter = useRef(0);
  const nextKey = () => `link-${counter.current++}`;
  const [drafts, setDrafts] = useState<SocialDraft[]>(() =>
    initial.map((link) => ({
      key: nextKey(),
      platform: link.platform,
      handle: link.handle,
      url: link.url ?? "",
    })),
  );
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const locked = readOnly || card.saving;

  function change(next: SocialDraft[]) {
    setDrafts(next);
    setErrors({});
    card.reset();
  }

  function patch(key: string, values: Partial<SocialDraft>) {
    change(drafts.map((draft) => (draft.key === key ? { ...draft, ...values } : draft)));
  }

  function move(index: number, delta: -1 | 1) {
    const keys = moveId(
      drafts.map((draft) => draft.key),
      index,
      delta,
    );
    change(keys.map((key) => drafts.find((draft) => draft.key === key)!));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (locked) return;

    const found = validateSocial(drafts);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      card.fail("Revisá los campos marcados.");
      return;
    }

    card.start();
    const result = await adminRequest("/api/admin/business/social-links", {
      method: "PUT",
      body: toSocialPayload(drafts),
    });
    if (!result.ok) {
      const byIndex = indexedFieldErrors(result.details, "links");
      const mapped: Record<string, Record<string, string>> = {};
      for (const [index, fields] of Object.entries(byIndex)) {
        const draft = drafts[Number(index)];
        if (draft) mapped[draft.key] = fields;
      }
      setErrors(mapped);
      card.handleFailure(
        result,
        Object.keys(mapped).length > 0 ? "Revisá los campos marcados." : settingsErrorMessage(result.code),
      );
      return;
    }
    card.succeed();
  }

  return (
    <SettingsCard
      id="social"
      title="Redes"
      hint="Aparecen en el pie de tu carta, en este orden. Una por red, hasta 10."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {drafts.length === 0 && (
          <p className="rounded-2xl bg-cream p-4 text-sm text-roast">
            Todavía no cargaste redes. Sumá la primera para que tus clientes te encuentren.
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {drafts.map((draft, index) => {
            const own = errors[draft.key] ?? {};
            const copy = handleLabels[draft.platform]!;
            return (
              <li key={draft.key} className="flex flex-col gap-3 rounded-2xl bg-cream p-3 sm:p-4">
                <div className="flex items-center gap-1">
                  <select
                    name={`social-${index}-platform`}
                    aria-label={`Red ${index + 1}`}
                    value={draft.platform}
                    disabled={locked}
                    aria-invalid={own.platform ? true : undefined}
                    onChange={(event) =>
                      patch(draft.key, { platform: event.target.value as SocialPlatformName })
                    }
                    className={`${fieldClass} min-w-0 flex-1`}
                  >
                    {platformOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        disabled={locked || index === 0}
                        aria-label={`Subir ${platformOptions.find((o) => o.value === draft.platform)?.label}`}
                        title="Subir"
                        onClick={() => move(index, -1)}
                        className={iconButtonClass}
                      >
                        <ArrowUpIcon />
                      </button>
                      <button
                        type="button"
                        disabled={locked || index === drafts.length - 1}
                        aria-label={`Bajar ${platformOptions.find((o) => o.value === draft.platform)?.label}`}
                        title="Bajar"
                        onClick={() => move(index, 1)}
                        className={iconButtonClass}
                      >
                        <ArrowDownIcon />
                      </button>
                      <button
                        type="button"
                        disabled={locked}
                        aria-label={`Quitar ${platformOptions.find((o) => o.value === draft.platform)?.label}`}
                        title="Quitar"
                        onClick={() => change(drafts.filter((d) => d.key !== draft.key))}
                        className={`${iconButtonClass} hover:text-[#b45309]`}
                      >
                        <TrashIcon />
                      </button>
                    </>
                  )}
                </div>
                {own.platform && <p className="text-sm font-semibold text-[#b45309]">{own.platform}</p>}

                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${draft.key}-handle`} className="text-sm font-semibold text-espresso">
                    {copy.label}
                  </label>
                  <input
                    id={`${draft.key}-handle`}
                    value={draft.handle}
                    maxLength={100}
                    autoComplete="off"
                    disabled={locked}
                    placeholder={copy.placeholder}
                    aria-invalid={own.handle ? true : undefined}
                    onChange={(event) => patch(draft.key, { handle: event.target.value })}
                    className={fieldClass}
                  />
                  {own.handle && <p className="text-sm text-roast">{own.handle}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${draft.key}-url`} className="text-sm font-semibold text-espresso">
                    Enlace <span className="font-normal text-roast">(opcional)</span>
                  </label>
                  <input
                    id={`${draft.key}-url`}
                    value={draft.url}
                    inputMode="url"
                    maxLength={2048}
                    autoComplete="off"
                    disabled={locked}
                    placeholder="https://"
                    aria-invalid={own.url ? true : undefined}
                    onChange={(event) => patch(draft.key, { url: event.target.value })}
                    className={fieldClass}
                  />
                  {own.url && <p className="text-sm text-roast">{own.url}</p>}
                </div>
              </li>
            );
          })}
        </ul>

        {!readOnly && (
          <div>
            <AppButton
              variant="secondary"
              className="min-h-10 gap-2 px-4 py-2"
              disabled={locked || drafts.length >= MAX_SOCIAL_LINKS}
              onClick={() =>
                change([
                  ...drafts,
                  { key: nextKey(), platform: nextPlatform(drafts), handle: "", url: "" },
                ])
              }
            >
              <PlusIcon />
              Agregar red
            </AppButton>
          </div>
        )}

        <SaveBar status={card.status} readOnly={readOnly} label="Guardar redes" />
      </form>
    </SettingsCard>
  );
}
