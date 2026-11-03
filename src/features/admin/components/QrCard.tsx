"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { AppButton } from "@/components/ui/AppButton";
import { CopyIcon } from "@/components/ui/icons";
import { qrFileName } from "@/features/admin/qr";
import { renderQrCard } from "@/features/admin/qr-card-canvas";
import { qrCardFileName } from "@/features/admin/qr-card-layout";

const QR_OPTIONS = {
  errorCorrectionLevel: "M",
  margin: 2,
  color: { dark: "#24150e", light: "#ffffff" },
} as const;

function triggerDownload(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

type Mode = "plain" | "card";

const MODES: { value: Mode; label: string }[] = [
  { value: "plain", label: "Solo QR" },
  { value: "card", label: "Con diseño" },
];

type QrCardProps = {
  url: string;
  slug: string;
  name: string;
  location: string;
  logoUrl: string | null;
};

export function QrCard({ url, slug, name, location, logoUrl }: QrCardProps) {
  const [mode, setMode] = useState<Mode>("plain");
  const [cardPreview, setCardPreview] = useState<string | null>(null);
  const [cardError, setCardError] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { ...QR_OPTIONS, width: 640 })
      .then((dataUrl) => {
        if (!cancelled) setPreview(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    if (mode !== "card" || cardPreview || cardError) return;
    let cancelled = false;
    renderQrCard({ url, name, location, logoUrl })
      .then((canvas) => {
        if (!cancelled) setCardPreview(canvas.toDataURL("image/png"));
      })
      .catch(() => {
        if (!cancelled) setCardError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, cardPreview, cardError, url, name, location, logoUrl]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function downloadPng() {
    try {
      const dataUrl = await QRCode.toDataURL(url, { ...QR_OPTIONS, width: 1024 });
      triggerDownload(dataUrl, qrFileName(slug, "png"));
    } catch {
      setError(true);
    }
  }

  function downloadCard() {
    if (cardPreview) triggerDownload(cardPreview, qrCardFileName(slug));
  }

  async function downloadSvg() {
    try {
      const svg = await QRCode.toString(url, { ...QR_OPTIONS, type: "svg" });
      const blobUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      triggerDownload(blobUrl, qrFileName(slug, "svg"));
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      setError(true);
    }
  }

  return (
    <section
      aria-labelledby="qr-heading"
      className="mt-8 rounded-3xl bg-white p-5 shadow-[0_10px_30px_-16px_rgba(36,21,14,0.4)] sm:p-7"
    >
      <h2 id="qr-heading" className="font-accent text-xl text-espresso">
        QR de tu carta
      </h2>

      <div
        role="group"
        aria-label="Tipo de código"
        className="mt-4 inline-flex gap-1 rounded-full bg-cream p-1"
      >
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 ${
              mode === value ? "bg-espresso text-white" : "text-roast hover:bg-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "card" ? (
        <div className="mx-auto mt-5 aspect-[2/3] w-full max-w-72 overflow-hidden rounded-2xl bg-cream shadow-[0_6px_20px_-12px_rgba(36,21,14,0.5)] sm:max-w-80">
          {cardPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cardPreview}
              alt={`Tarjeta de mesa de ${name} con código QR que abre ${url}`}
              width={1200}
              height={1800}
              className="size-full"
            />
          ) : (
            <div
              role="status"
              className="flex size-full items-center justify-center px-4 text-center text-sm text-roast"
            >
              {cardError ? "No pudimos generar la tarjeta." : "Preparando tarjeta…"}
            </div>
          )}
        </div>
      ) : (
      <div className="mx-auto mt-5 aspect-square w-full max-w-72 overflow-hidden rounded-3xl bg-white shadow-[0_6px_20px_-12px_rgba(36,21,14,0.5)]">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt={`Código QR que abre ${url}`}
            width={640}
            height={640}
            className="size-full"
          />
        ) : (
          <div
            role="status"
            className="flex size-full items-center justify-center text-sm text-roast"
          >
            {error ? "No pudimos generar el código." : "Generando código…"}
          </div>
        )}
      </div>
      )}

      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-cream p-2 pl-4">
        <p className="min-w-0 flex-1 break-all text-sm font-medium text-espresso">{url}</p>
        <button
          type="button"
          onClick={copyUrl}
          aria-label="Copiar enlace de la carta"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-espresso transition-colors hover:bg-[#fffaf1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2"
        >
          <CopyIcon />
        </button>
      </div>
      <p aria-live="polite" className="mt-1.5 min-h-5 pl-4 text-sm font-medium text-roast">
        {copied ? "Copiado" : ""}
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {mode === "card" ? (
          <AppButton onClick={downloadCard} disabled={!cardPreview} className="sm:flex-1">
            Descargar PNG
          </AppButton>
        ) : (
          <>
        <AppButton onClick={downloadPng} disabled={!preview} className="sm:flex-1">
          Descargar PNG
        </AppButton>
        <AppButton
          variant="secondary"
          onClick={downloadSvg}
          disabled={!preview}
          className="border-transparent bg-cream sm:flex-1"
        >
          Descargar SVG
        </AppButton>
          </>
        )}
      </div>

      <p className="mt-5 text-sm text-roast">
        {mode === "card"
          ? "La tarjeta sale en 1200 × 1800 px, lista para imprimir en formato vertical. Probá escanearla antes de imprimir en cantidad."
          : "Imprimilo de al menos 3 cm de lado y probá escanearlo antes de imprimir en cantidad. El SVG sirve para imprenta."}
      </p>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-coffee-yellow px-5 text-sm font-semibold text-espresso transition-colors hover:bg-[#f7c84a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2"
      >
        Ver mi carta
        <span aria-hidden="true">↗</span>
        <span className="sr-only">(se abre en otra pestaña)</span>
      </a>
    </section>
  );
}
