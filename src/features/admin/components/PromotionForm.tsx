"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { ImageIcon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/Switch";
import { adminRequest } from "@/features/admin/api-errors";
import { promotionErrorMessage, promotionFieldErrors } from "@/features/admin/promotions/errors";
import {
  dayToIso,
  endsBeforeStart,
  isoToDay,
} from "@/features/admin/promotions/schedule";
import { useMounted } from "@/features/admin/promotions/useMounted";
import {
  ACCEPTED_IMAGE_TYPES,
  uploadImage,
  validateImageFile,
} from "@/features/admin/products/upload";

export type PromotionFormValues = {
  id: string;
  imageUrl: string;
  imageAlt: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

type ImageState = { url: string; publicId: string | null };

const fieldClass =
  "w-full rounded-xl border border-warm-border bg-white px-3.5 py-2.5 text-base text-espresso placeholder:text-roast/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:opacity-60";

const card =
  "rounded-3xl bg-white p-5 shadow-[0_10px_30px_-16px_rgba(36,21,14,0.4)] sm:p-6";

/** Dates are read in the browser's time zone, so the edit form waits for hydration. */
export function PromotionForm({ promotion }: { promotion?: PromotionFormValues }) {
  const mounted = useMounted();
  if (promotion && !mounted) {
    return <div className={`${card} mt-8 min-h-64 max-w-2xl`} aria-hidden="true" />;
  }
  return <PromotionFormFields promotion={promotion} />;
}

function PromotionFormFields({ promotion }: { promotion?: PromotionFormValues }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<ImageState | null>(
    promotion ? { url: promotion.imageUrl, publicId: null } : null,
  );
  const [altText, setAltText] = useState(promotion?.imageAlt ?? "");
  const [isActive, setIsActive] = useState(promotion?.isActive ?? true);
  const [startDay, setStartDay] = useState(isoToDay(promotion?.startsAt ?? null));
  const [endDay, setEndDay] = useState(isoToDay(promotion?.endsAt ?? null));

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const busy = saving || uploading;

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const invalid = validateImageFile(file);
    if (invalid) {
      setUploadError(invalid);
      return;
    }

    setUploadError(null);
    setErrors((current) => ({ ...current, image: "" }));
    setProgress(0);
    setUploading(true);

    const outcome = await uploadImage("promotion", file, setProgress);
    if (outcome.ok) {
      setImage({ url: outcome.image.url, publicId: outcome.image.publicId });
    } else if (outcome.code === "unauthorized") {
      router.replace("/login");
      return;
    } else if (outcome.code === "upload_failed") {
      setUploadError("No pudimos subir la imagen. Probá de nuevo.");
    } else {
      setUploadError(promotionErrorMessage(outcome.code));
    }
    setUploading(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;

    const nextErrors: Record<string, string> = {};
    if (!image) nextErrors.image = "Subí la imagen de la promoción.";
    if (altText.trim() === "") {
      nextErrors.imageAlt = "Describí la imagen en pocas palabras (hasta 160 caracteres).";
    }
    if (endsBeforeStart(startDay, endDay)) {
      nextErrors.endsAt = "La fecha de fin tiene que ser posterior a la de inicio.";
    }
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0 || !image) return;

    const schedule = {
      isActive,
      startsAt: dayToIso(startDay, "start"),
      endsAt: dayToIso(endDay, "end"),
    };
    const base = { ...schedule, imageAlt: altText.trim() };
    const imageChanged = !promotion || image.url !== promotion.imageUrl;
    const body = imageChanged
      ? { ...base, imageUrl: image.url, imagePublicId: image.publicId }
      : base;

    setSaving(true);
    const result = await adminRequest(
      promotion ? `/api/admin/promotions/${promotion.id}` : "/api/admin/promotions",
      { method: promotion ? "PATCH" : "POST", body },
    );
    if (!result.ok) {
      if (result.code === "unauthorized") {
        router.replace("/login");
        return;
      }
      const fieldErrors = promotionFieldErrors(result.details);
      setErrors(fieldErrors);
      setFormError(
        Object.keys(fieldErrors).length > 0
          ? "Revisá los campos marcados."
          : promotionErrorMessage(result.code),
      );
      setSaving(false);
      return;
    }

    router.push(`/admin/promotions?saved=${promotion ? "updated" : "created"}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 flex max-w-2xl flex-col gap-5">
      <section className={`${card} flex flex-col gap-4`} aria-labelledby="image-heading">
        <h2 id="image-heading" className="font-accent text-lg text-roast">
          Imagen
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex aspect-[2/3] w-full max-w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cream text-roast/60">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image.url} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon width={32} height={32} />
            )}
            {uploading && (
              <div
                role="progressbar"
                aria-label="Subiendo imagen"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-espresso/70 px-2 text-center text-sm font-semibold text-white"
              >
                Subiendo… {Math.round(progress * 100)}%
                <span className="h-1.5 w-2/3 overflow-hidden rounded-full bg-white/25">
                  <span
                    className="block h-full rounded-full bg-coffee-yellow transition-[width]"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-start gap-3">
            <input
              ref={fileInput}
              id="promotionImage"
              name="promotionImage"
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="sr-only"
              tabIndex={-1}
              aria-label="Elegir imagen de la promoción"
              onChange={handleFile}
            />
            <AppButton
              variant="secondary"
              className="min-h-10 px-4 py-2"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              {image ? "Cambiar imagen" : "Subir imagen"}
            </AppButton>
            <p className="text-sm text-roast">
              En la carta se ve vertical, en proporción 2:3. Lo ideal es 1000 × 1500 px. JPG, PNG
              o WebP, hasta 5 MB.
            </p>
          </div>
        </div>

        <p
          role="status"
          aria-live="polite"
          className="min-h-5 text-sm font-semibold text-[#b45309]"
        >
          {uploadError ?? errors.image ?? ""}
        </p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="imageAlt" className="text-sm font-semibold text-espresso">
            Descripción de la imagen
          </label>
          <input
            id="imageAlt"
            name="imageAlt"
            value={altText}
            maxLength={160}
            autoComplete="off"
            disabled={saving}
            placeholder="Ej.: 2x1 en café con medialunas, de lunes a viernes"
            aria-invalid={errors.imageAlt ? true : undefined}
            aria-describedby="imageAlt-hint"
            onChange={(event) => setAltText(event.target.value)}
            className={fieldClass}
          />
          <p id="imageAlt-hint" className="text-sm text-roast">
            Cuenta lo que dice la promo para quienes no ven la imagen. También la ves en tu lista.
          </p>
          {errors.imageAlt && <p className="text-sm font-semibold text-[#b45309]">{errors.imageAlt}</p>}
        </div>
      </section>

      <section className={`${card} flex flex-col gap-4`} aria-labelledby="schedule-heading">
        <h2 id="schedule-heading" className="font-accent text-lg text-roast">
          En la carta
        </h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-espresso">Activa</p>
            <p className="text-sm text-roast">Pausala para ocultarla sin borrarla.</p>
          </div>
          <Switch
            checked={isActive}
            onChange={setIsActive}
            disabled={saving}
            label="Promoción activa"
            text={isActive ? "Sí" : "No"}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="startsAt" className="text-sm font-semibold text-espresso">
              Desde <span className="font-normal text-roast">(opcional)</span>
            </label>
            <input
              id="startsAt"
              name="startsAt"
              type="date"
              value={startDay}
              disabled={saving}
              onChange={(event) => setStartDay(event.target.value)}
              className={fieldClass}
            />
            {errors.startsAt && (
              <p className="text-sm font-semibold text-[#b45309]">{errors.startsAt}</p>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="endsAt" className="text-sm font-semibold text-espresso">
              Hasta <span className="font-normal text-roast">(opcional)</span>
            </label>
            <input
              id="endsAt"
              name="endsAt"
              type="date"
              value={endDay}
              min={startDay || undefined}
              disabled={saving}
              aria-invalid={errors.endsAt ? true : undefined}
              onChange={(event) => setEndDay(event.target.value)}
              className={fieldClass}
            />
            {errors.endsAt && (
              <p className="text-sm font-semibold text-[#b45309]">{errors.endsAt}</p>
            )}
          </div>
        </div>
        <p className="text-sm text-roast">
          Empieza a las 00:00 del primer día y termina a las 23:59 del último. Sin fechas, se
          muestra siempre que esté activa.
        </p>
      </section>

      <p
        role="status"
        aria-live="polite"
        className="min-h-5 px-1 text-sm font-semibold text-[#b45309]"
      >
        {formError ?? ""}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <AppButton type="submit" loading={saving} disabled={uploading} className="px-7">
          {saving ? "Guardando…" : promotion ? "Guardar cambios" : "Crear promoción"}
        </AppButton>
        <Link
          href="/admin/promotions"
          className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-roast transition-colors hover:bg-white hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
