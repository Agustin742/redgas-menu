export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Response of POST /api/admin/uploads/signature. */
export type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowedFormats: string;
};

/** Returns a Spanish error message, or null when the file can be uploaded. */
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Elegí una imagen JPG, PNG o WebP.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "La imagen pesa más de 5 MB. Elegí una más liviana.";
  }
  return null;
}

export function cloudinaryUploadUrl(cloudName: string) {
  return `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
}

/**
 * Multipart body of a signed direct upload. Only folder, allowed_formats and
 * timestamp are signed, so they must be sent exactly as the server returned them.
 */
export function buildUploadFormData(file: Blob, signed: UploadSignature) {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signed.apiKey);
  form.append("timestamp", String(signed.timestamp));
  form.append("signature", signed.signature);
  form.append("folder", signed.folder);
  form.append("allowed_formats", signed.allowedFormats);
  return form;
}

export type UploadedImage = { url: string; publicId: string };

/** Uploads to Cloudinary with progress reporting (fetch cannot report upload progress). */
export function uploadToCloudinary(
  file: Blob,
  signed: UploadSignature,
  onProgress: (fraction: number) => void,
): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", cloudinaryUploadUrl(signed.cloudName));
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.onerror = () => reject(new Error("network"));
    request.onload = () => {
      try {
        const body = JSON.parse(request.responseText) as {
          secure_url?: string;
          public_id?: string;
        };
        if (request.status >= 200 && request.status < 300 && body.secure_url && body.public_id) {
          resolve({ url: body.secure_url, publicId: body.public_id });
          return;
        }
      } catch {
        // fall through to the rejection below
      }
      reject(new Error("rejected"));
    };
    request.send(buildUploadFormData(file, signed));
  });
}
