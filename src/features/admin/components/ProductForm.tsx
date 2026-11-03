"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { FormField } from "@/components/ui/FormField";
import { ImageIcon, TrashIcon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/Switch";
import { adminRequest } from "@/features/admin/api-errors";
import { productErrorMessage, productFieldErrors } from "@/features/admin/products/errors";
import { formatPrice, parsePriceInput, priceToInput } from "@/features/admin/products/price";
import {
  ACCEPTED_IMAGE_TYPES,
  uploadToCloudinary,
  validateImageFile,
  type UploadSignature,
} from "@/features/admin/products/upload";
import { useUnsavedUpload } from "@/features/admin/uploads/useUnsavedUpload";

export type ProductFormCategory = { id: string; name: string; isVisible: boolean };

export type ProductFormValues = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  categoryId: string;
  imageUrl: string | null;
  imageAlt: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
};

type ImageState = { url: string; publicId: string | null };

const fieldClass =
  "w-full rounded-xl border border-warm-border bg-white px-3.5 py-2.5 text-base text-espresso placeholder:text-roast/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:opacity-60";

const card =
  "rounded-3xl bg-white p-5 shadow-[0_10px_30px_-16px_rgba(36,21,14,0.4)] sm:p-6";

export function ProductForm({
  categories,
  product,
}: {
  categories: ProductFormCategory[];
  product?: ProductFormValues;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const unsaved = useUnsavedUpload();

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [priceText, setPriceText] = useState(
    product ? priceToInput(product.priceCents) : "",
  );
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? "");
  const [image, setImage] = useState<ImageState | null>(
    product?.imageUrl ? { url: product.imageUrl, publicId: null } : null,
  );
  const [altText, setAltText] = useState(product?.imageAlt ?? "");
  const [isAvailable, setIsAvailable] = useState(product?.isAvailable ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const busy = saving || uploading;
  const priceCents = parsePriceInput(priceText);

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

    const signed = await adminRequest<UploadSignature>("/api/admin/uploads/signature", {
      method: "POST",
      body: { target: "product" },
    });
    if (!signed.ok) {
      if (signed.code === "unauthorized") {
        router.replace("/login");
        return;
      }
      setUploadError(productErrorMessage(signed.code));
      setUploading(false);
      return;
    }

    try {
      const uploaded = await uploadToCloudinary(file, signed.data, setProgress);
      unsaved.track(uploaded.publicId);
      setImage({ url: uploaded.url, publicId: uploaded.publicId });
    } catch {
      setUploadError("No pudimos subir la foto. Probá de nuevo.");
    }
    setUploading(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;

    const nextErrors: Record<string, string> = {};
    if (name.trim() === "") nextErrors.name = "Ingresá un nombre de hasta 80 caracteres.";
    if (priceCents === null) {
      nextErrors.price = "Ingresá un precio válido, por ejemplo 2800 o 2.800,50.";
    }
    if (categoryId === "") nextErrors.category = "Elegí una categoría.";
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0 || priceCents === null) return;

    const alt = altText.trim() || name.trim();
    const base = {
      name: name.trim(),
      description: description.trim(),
      priceCents,
      categoryId,
      isAvailable,
      isFeatured,
    };

    let body: Record<string, unknown>;
    if (!product) {
      body = image
        ? { ...base, imageUrl: image.url, imagePublicId: image.publicId, imageAlt: alt }
        : base;
    } else if ((image?.url ?? null) !== product.imageUrl) {
      body = image
        ? { ...base, imageUrl: image.url, imagePublicId: image.publicId, imageAlt: alt }
        : { ...base, imageUrl: null };
    } else if (image && alt !== (product.imageAlt ?? "")) {
      body = { ...base, imageAlt: alt };
    } else {
      body = base;
    }

    setSaving(true);
    const result = await adminRequest(
      product ? `/api/admin/products/${product.id}` : "/api/admin/products",
      { method: product ? "PATCH" : "POST", body },
    );
    if (!result.ok) {
      if (result.code === "unauthorized") {
        router.replace("/login");
        return;
      }
      const fieldErrors = productFieldErrors(result.details);
      setErrors(fieldErrors);
      setFormError(
        Object.keys(fieldErrors).length > 0
          ? "Revisá los campos marcados."
          : productErrorMessage(result.code),
      );
      setSaving(false);
      return;
    }

    unsaved.markSaved();
    router.push(`/admin/products?saved=${product ? "updated" : "created"}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-8 flex max-w-2xl flex-col gap-5">
      <section className={`${card} flex flex-col gap-5`} aria-labelledby="data-heading">
        <h2 id="data-heading" className="font-accent text-lg text-roast">
          Lo básico
        </h2>
        <FormField
          id="name"
          label="Nombre"
          value={name}
          maxLength={80}
          autoComplete="off"
          placeholder="Ej.: Café con leche"
          error={errors.name}
          disabled={saving}
          onChange={(event) => setName(event.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-semibold text-espresso">
            Descripción <span className="font-normal text-roast">(opcional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={300}
            value={description}
            disabled={saving}
            placeholder="Ingredientes, tamaño, algo que ayude a elegir."
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={errors.description ? "description-error" : undefined}
            onChange={(event) => setDescription(event.target.value)}
            className={`${fieldClass} resize-y`}
          />
          {errors.description && (
            <p id="description-error" className="text-sm text-roast">
              {errors.description}
            </p>
          )}
        </div>

        <div>
          <FormField
            id="price"
            label="Precio (ARS)"
            value={priceText}
            inputMode="decimal"
            autoComplete="off"
            placeholder="2800"
            error={errors.price}
            disabled={saving}
            onChange={(event) => setPriceText(event.target.value)}
          />
          {priceCents !== null && (
            <p className="mt-1.5 text-sm text-roast">
              Se muestra como{" "}
              <span className="font-semibold text-espresso">{formatPrice(priceCents)}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm font-semibold text-espresso">
            Categoría
          </label>
          <select
            id="category"
            name="category"
            value={categoryId}
            disabled={saving}
            aria-invalid={errors.category ? true : undefined}
            aria-describedby={errors.category ? "category-error" : undefined}
            onChange={(event) => setCategoryId(event.target.value)}
            className={fieldClass}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.isVisible ? category.name : `${category.name} (oculta)`}
              </option>
            ))}
          </select>
          {errors.category && (
            <p id="category-error" className="text-sm text-roast">
              {errors.category}
            </p>
          )}
          {product && categoryId !== product.categoryId && (
            <p className="text-sm text-roast">
              Al cambiar de categoría, el producto queda al final de la nueva.
            </p>
          )}
        </div>
      </section>

      <section className={`${card} flex flex-col gap-4`} aria-labelledby="photo-heading">
        <h2 id="photo-heading" className="font-accent text-lg text-roast">
          Foto
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex aspect-[4/3] w-full max-w-60 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cream text-roast/60">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image.url} alt="" className="size-full object-cover" />
            ) : (
              <ImageIcon width={32} height={32} />
            )}
            {uploading && (
              <div
                role="progressbar"
                aria-label="Subiendo foto"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-espresso/70 text-sm font-semibold text-white"
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
              id="photo"
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              className="sr-only"
              tabIndex={-1}
              aria-label="Elegir foto del producto"
              onChange={handleFile}
            />
            <div className="flex items-center gap-2">
              <AppButton
                variant="secondary"
                className="min-h-10 px-4 py-2"
                disabled={busy}
                onClick={() => fileInput.current?.click()}
              >
                {image ? "Cambiar foto" : "Subir foto"}
              </AppButton>
              {image && (
                <button
                  type="button"
                  disabled={busy}
                  aria-label="Quitar foto"
                  title="Quitar foto"
                  onClick={() => {
                    unsaved.discard();
                    setImage(null);
                    setAltText("");
                  }}
                  className="inline-flex size-10 items-center justify-center rounded-full text-roast transition-colors hover:bg-cream hover:text-[#b45309] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-30"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
            <p className="text-sm text-roast">JPG, PNG o WebP, hasta 5 MB.</p>
          </div>
        </div>

        <p
          role="status"
          aria-live="polite"
          className="min-h-5 text-sm font-semibold text-[#b45309]"
        >
          {uploadError ?? errors.image ?? ""}
        </p>

        {image && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="imageAlt" className="text-sm font-semibold text-espresso">
              Descripción de la foto <span className="font-normal text-roast">(opcional)</span>
            </label>
            <input
              id="imageAlt"
              name="imageAlt"
              value={altText}
              maxLength={160}
              autoComplete="off"
              disabled={saving}
              placeholder={name.trim() || "Ej.: Taza de café con leche"}
              aria-invalid={errors.imageAlt ? true : undefined}
              onChange={(event) => setAltText(event.target.value)}
              className={fieldClass}
            />
            <p className="text-sm text-roast">
              Ayuda a personas que no ven la imagen. Si la dejás vacía usamos el nombre.
            </p>
            {errors.imageAlt && <p className="text-sm text-roast">{errors.imageAlt}</p>}
          </div>
        )}
      </section>

      <section className={`${card} flex flex-col gap-4`} aria-labelledby="options-heading">
        <h2 id="options-heading" className="font-accent text-lg text-roast">
          En la carta
        </h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-espresso">Disponible</p>
            <p className="text-sm text-roast">Apagalo cuando se te acabe.</p>
          </div>
          <Switch
            checked={isAvailable}
            onChange={setIsAvailable}
            disabled={saving}
            label="Producto disponible"
            text={isAvailable ? "Sí" : "No"}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-espresso">Destacado</p>
            <p className="text-sm text-roast">Para resaltar tus favoritos.</p>
          </div>
          <Switch
            checked={isFeatured}
            onChange={setIsFeatured}
            disabled={saving}
            label="Producto destacado"
            text={isFeatured ? "Sí" : "No"}
          />
        </div>
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
          {saving ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
        </AppButton>
        <Link
          href="/admin/products"
          className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-roast transition-colors hover:bg-white hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
