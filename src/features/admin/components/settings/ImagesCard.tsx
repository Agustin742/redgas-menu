"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { ImageIcon } from "@/components/ui/icons";
import { adminRequest } from "@/features/admin/api-errors";
import { businessFieldErrors, settingsErrorMessage } from "@/features/admin/settings/errors";
import {
  ACCEPTED_IMAGE_TYPES,
  uploadImage,
  validateImageFile,
  type UploadTarget,
} from "@/features/admin/products/upload";
import { SaveBar, SettingsCard, useCardStatus } from "./parts";

type ImageState = { url: string; publicId: string | null };

function ImageSlot({
  target,
  title,
  description,
  value,
  shape,
  disabled,
  readOnly,
  error,
  onUploaded,
  onBusy,
  onError,
}: {
  target: Extract<UploadTarget, "logo" | "header">;
  title: string;
  description: string;
  value: ImageState;
  shape: "round" | "wide";
  disabled: boolean;
  readOnly: boolean;
  error?: string;
  onUploaded: (image: ImageState) => void;
  onBusy: (busy: boolean) => void;
  onError: (message: string | null, unauthorized?: boolean) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const invalid = validateImageFile(file);
    if (invalid) {
      onError(invalid);
      return;
    }

    onError(null);
    setProgress(0);
    setUploading(true);
    onBusy(true);
    const outcome = await uploadImage(target, file, setProgress);
    setUploading(false);
    onBusy(false);

    if (!outcome.ok) {
      onError(settingsErrorMessage(outcome.code), outcome.code === "unauthorized");
      return;
    }
    onUploaded({ url: outcome.image.url, publicId: outcome.image.publicId });
  }

  const preview =
    shape === "round"
      ? "size-24 rounded-full sm:size-28"
      : "aspect-[16/7] w-full max-w-md rounded-2xl";

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-semibold text-espresso">{title}</p>
        <p className="text-sm text-roast">{description}</p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-cream text-roast/60 ${preview}`}
        >
          {value.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value.url} alt={`Vista previa: ${title.toLowerCase()}`} className="size-full object-cover" />
          ) : (
            <ImageIcon width={28} height={28} />
          )}
          {uploading && (
            <div
              role="progressbar"
              aria-label={`Subiendo ${title.toLowerCase()}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              className="absolute inset-0 flex items-center justify-center bg-espresso/70 text-sm font-semibold text-white"
            >
              {Math.round(progress * 100)}%
            </div>
          )}
        </div>
        {!readOnly && (
          <div>
            <input
              ref={fileInput}
              type="file"
              name={`${target}-file`}
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="sr-only"
              tabIndex={-1}
              aria-label={`Elegir ${title.toLowerCase()}`}
              onChange={handleFile}
            />
            <AppButton
              variant="secondary"
              className="min-h-10 px-4 py-2"
              disabled={disabled || uploading}
              onClick={() => fileInput.current?.click()}
            >
              {value.url ? "Cambiar" : "Subir"}
            </AppButton>
            <p className="mt-2 text-sm text-roast">JPG, PNG o WebP, hasta 5 MB.</p>
          </div>
        )}
      </div>
      {error && <p className="text-sm font-semibold text-[#b45309]">{error}</p>}
    </div>
  );
}

export function ImagesCard({
  initial,
  readOnly,
}: {
  initial: { logoUrl: string; headerImageUrl: string };
  readOnly: boolean;
}) {
  const card = useCardStatus();
  const [baseline, setBaseline] = useState(initial);
  const [logo, setLogo] = useState<ImageState>({ url: initial.logoUrl, publicId: null });
  const [header, setHeader] = useState<ImageState>({ url: initial.headerImageUrl, publicId: null });
  const [uploads, setUploads] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const logoChanged = logo.url !== baseline.logoUrl;
  const headerChanged = header.url !== baseline.headerImageUrl;
  const dirty = logoChanged || headerChanged;
  const busy = card.saving || uploads > 0;

  function slotError(field: "logo" | "header") {
    return (message: string | null, unauthorized?: boolean) => {
      if (unauthorized) {
        card.fail(settingsErrorMessage("unauthorized"));
        return;
      }
      setErrors((current) => ({ ...current, [field]: message ?? "" }));
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (readOnly || busy || !dirty) return;

    const body: Record<string, unknown> = {};
    if (logoChanged) {
      body.logoUrl = logo.url;
      body.logoPublicId = logo.publicId;
    }
    if (headerChanged) {
      body.headerImageUrl = header.url;
      body.headerImagePublicId = header.publicId;
    }

    card.start();
    const result = await adminRequest("/api/admin/business", { method: "PATCH", body });
    if (!result.ok) {
      const fieldErrors = businessFieldErrors(result.details);
      setErrors(fieldErrors);
      card.handleFailure(
        result,
        Object.keys(fieldErrors).length > 0 ? "Revisá las imágenes marcadas." : undefined,
      );
      return;
    }
    setErrors({});
    setBaseline({ logoUrl: logo.url, headerImageUrl: header.url });
    card.succeed();
  }

  return (
    <SettingsCard
      id="images"
      title="Imágenes"
      hint="El logo redondo y la foto de fondo del encabezado de tu carta."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <ImageSlot
          target="logo"
          title="Logo"
          description="Se muestra redondo, junto al nombre."
          value={logo}
          shape="round"
          disabled={busy}
          readOnly={readOnly}
          error={errors.logo}
          onUploaded={(image) => {
            setLogo(image);
            setErrors((current) => ({ ...current, logo: "" }));
            card.reset();
          }}
          onBusy={(on) => setUploads((count) => count + (on ? 1 : -1))}
          onError={slotError("logo")}
        />
        <ImageSlot
          target="header"
          title="Foto de portada"
          description="Fondo del encabezado. Mejor una imagen horizontal."
          value={header}
          shape="wide"
          disabled={busy}
          readOnly={readOnly}
          error={errors.header}
          onUploaded={(image) => {
            setHeader(image);
            setErrors((current) => ({ ...current, header: "" }));
            card.reset();
          }}
          onBusy={(on) => setUploads((count) => count + (on ? 1 : -1))}
          onError={slotError("header")}
        />
        <SaveBar
          status={card.status}
          readOnly={readOnly}
          disabled={!dirty || uploads > 0}
          label="Guardar imágenes"
        />
      </form>
    </SettingsCard>
  );
}
