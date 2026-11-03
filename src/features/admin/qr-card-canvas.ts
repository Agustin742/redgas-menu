// Browser-only: draws the branded printable table card with Canvas 2D.
import QRCode from "qrcode";
import { fitFontSize, shortUrl } from "./qr-card-layout";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 1800;

const COLORS = {
  cream: "#fff7e9",
  espresso: "#24150e",
  roast: "#684021",
  yellow: "#f5b923",
  white: "#ffffff",
} as const;

const DISPLAY = "'Archivo Black', sans-serif";
const ACCENT = "'Bree Serif', serif";
const SANS = "'DM Sans', sans-serif";
const SAMPLE_TEXT = "ÁÉÍÓÚáéíóúñÑ¿?¡!., abcXYZ019";

export type QrCardData = {
  url: string;
  name: string;
  location: string;
  logoUrl: string | null;
};

async function loadFonts() {
  await Promise.all([
    document.fonts.load("64px 'Archivo Black'", SAMPLE_TEXT),
    document.fonts.load("400 64px 'Bree Serif'", SAMPLE_TEXT),
    document.fonts.load("500 40px 'DM Sans'", SAMPLE_TEXT),
    document.fonts.load("700 40px 'DM Sans'", SAMPLE_TEXT),
  ]);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawLogo(ctx: CanvasRenderingContext2D, image: HTMLImageElement, cx: number, cy: number, r: number) {
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const sx = (image.naturalWidth - side) / 2;
  const sy = (image.naturalHeight - side) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(image, sx, sy, side, side, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

function drawCard(ctx: CanvasRenderingContext2D, data: QrCardData, logo: HTMLImageElement | null) {
  const centerX = CARD_WIDTH / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Background and top band.
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.fillStyle = COLORS.espresso;
  ctx.fillRect(0, 0, CARD_WIDTH, 560);
  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(0, 560, 400, 16);

  // Logo (optional).
  const hasLogo = logo !== null;
  if (logo) drawLogo(ctx, logo, centerX, 190, 110);

  // Business name with yellow dot, shrunk to fit.
  const nameWidth = CARD_WIDTH - 160;
  const nameSize = fitFontSize(
    (size) => {
      ctx.font = `${size}px ${DISPLAY}`;
      return ctx.measureText(`${data.name}.`).width;
    },
    nameWidth,
    120,
    40,
  );
  ctx.font = `${nameSize}px ${DISPLAY}`;
  const nameMeasured = ctx.measureText(data.name).width;
  const dotMeasured = ctx.measureText(".").width;
  const nameBaseline = hasLogo ? 440 : 330;
  const startX = centerX - (nameMeasured + dotMeasured) / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.white;
  ctx.fillText(data.name, startX, nameBaseline);
  ctx.fillStyle = COLORS.yellow;
  ctx.fillText(".", startX + nameMeasured, nameBaseline);
  ctx.textAlign = "center";

  // Call to action.
  const ctaText = "Escaneá y mirá la carta";
  const ctaSize = fitFontSize(
    (size) => {
      ctx.font = `${size}px ${ACCENT}`;
      return ctx.measureText(ctaText).width;
    },
    CARD_WIDTH - 160,
    80,
    40,
  );
  ctx.font = `${ctaSize}px ${ACCENT}`;
  ctx.fillStyle = COLORS.espresso;
  ctx.fillText(ctaText, centerX, 710);

  // QR inside a white rounded square.
  const box = 720;
  const boxX = (CARD_WIDTH - box) / 2;
  const boxY = 780;
  ctx.save();
  ctx.shadowColor = "rgba(36, 21, 14, 0.35)";
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = COLORS.white;
  roundedRect(ctx, boxX, boxY, box, box, 64);
  ctx.fill();
  ctx.restore();

  return { qrCanvas: document.createElement("canvas"), box, boxX, boxY, centerX };
}

export async function renderQrCard(data: QrCardData): Promise<HTMLCanvasElement> {
  await loadFonts();
  const logo = data.logoUrl ? await loadImage(data.logoUrl) : null;

  const attempt = async (withLogo: HTMLImageElement | null) => {
    const canvas = document.createElement("canvas");
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D unavailable");

    const { qrCanvas, box, boxX, boxY, centerX } = drawCard(ctx, data, withLogo);
    const qrSize = box - 56;
    await QRCode.toCanvas(qrCanvas, data.url, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: qrSize,
      color: { dark: COLORS.espresso, light: COLORS.white },
    });
    ctx.drawImage(qrCanvas, boxX + 28, boxY + 28, qrSize, qrSize);

    // Footer: location and short URL.
    ctx.textAlign = "center";
    ctx.fillStyle = COLORS.roast;
    if (data.location) {
      ctx.font = `700 44px ${SANS}`;
      ctx.fillText(data.location, centerX, 1640, CARD_WIDTH - 160);
    }
    ctx.font = `500 36px ${SANS}`;
    ctx.fillText(shortUrl(data.url), centerX, 1708, CARD_WIDTH - 160);
    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(0, CARD_HEIGHT - 16, 400, 16);

    // Throws SecurityError if a cross-origin logo tainted the canvas.
    ctx.getImageData(0, 0, 1, 1);
    return canvas;
  };

  try {
    return await attempt(logo);
  } catch (error) {
    if (!logo) throw error;
    return attempt(null);
  }
}
