/**
 * Cloudinary asset storage and transformation utility.
 * Designed for Firebase Free Tier compliance to avoid base64 document bloat.
 */

import { uploadAssetServerFn } from "./cloudinary.functions";

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width?: number | undefined;
  height?: number | undefined;
  format?: string | undefined;
  bytes?: number | undefined;
  isLocalFallback?: boolean | undefined;
}

export interface UploadOptions {
  folder?: string;
  tags?: string[];
  transformation?: string;
}

/**
 * Returns whether Cloudinary is configured via environment variables.
 */
export function isCloudinaryConfigured(): boolean {
  const cloudName =
    typeof import.meta !== "undefined" && import.meta.env
      ? (import.meta.env["VITE_CLOUDINARY_CLOUD_NAME"] as string | undefined)
      : undefined;
  return Boolean(cloudName && cloudName !== "demo" && cloudName.trim().length > 0);
}

/**
 * Uploads an image (File, Blob, or base64 Data URL) to Cloudinary.
 * Falls back gracefully to local data URL if Cloudinary is not configured.
 */
export async function uploadToCloudinary(
  fileOrDataUrl: File | Blob | string,
  options: UploadOptions = {},
): Promise<CloudinaryUploadResult> {
  const cloudName =
    typeof import.meta !== "undefined" && import.meta.env
      ? (import.meta.env["VITE_CLOUDINARY_CLOUD_NAME"] as string | undefined)
      : undefined;
  const uploadPreset =
    typeof import.meta !== "undefined" && import.meta.env
      ? (import.meta.env["VITE_CLOUDINARY_UPLOAD_PRESET"] as string | undefined)
      : undefined;

  // Check if we can do client-side direct unsigned upload
  const canDirectUpload =
    cloudName &&
    cloudName !== "demo" &&
    uploadPreset &&
    uploadPreset !== "medguide_unsigned";

  if (canDirectUpload) {
    try {
      const formData = new FormData();
      if (typeof fileOrDataUrl === "string") {
        formData.append("file", fileOrDataUrl);
      } else {
        formData.append("file", fileOrDataUrl);
      }
      formData.append("upload_preset", uploadPreset);
      if (options.folder) {
        formData.append("folder", options.folder);
      }
      if (options.tags && options.tags.length > 0) {
        formData.append("tags", options.tags.join(","));
      }

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        return {
          url: json.url,
          secureUrl: json.secure_url,
          publicId: json.public_id,
          width: json.width,
          height: json.height,
          format: json.format,
          bytes: json.bytes,
          isLocalFallback: false,
        };
      }
      console.warn("Direct Cloudinary upload failed:", await res.text());
    } catch (err) {
      console.warn("Direct Cloudinary upload network error:", err);
    }
  }

  // Next try server-side upload function if Cloudinary credentials are configured
  if (isCloudinaryConfigured()) {
    try {
      const payload =
        typeof fileOrDataUrl === "string"
          ? fileOrDataUrl
          : await fileToDataUrl(fileOrDataUrl);

      const serverRes = await uploadAssetServerFn({
        data: {
          dataUrl: payload,
          folder: options.folder || "medguide-clinical",
          tags: options.tags || ["clinical", "patient-record"],
        },
      });

      if (serverRes.success && serverRes.secureUrl) {
        return {
          url: serverRes.url || serverRes.secureUrl,
          secureUrl: serverRes.secureUrl,
          publicId: serverRes.publicId || `cld_${Date.now()}`,
          width: serverRes.width,
          height: serverRes.height,
          format: serverRes.format,
          bytes: serverRes.bytes,
          isLocalFallback: false,
        };
      }
    } catch (err) {
      console.warn("Server upload function error:", err);
    }
  }

  // Graceful fallback for local development or when credentials are not yet entered
  const fallbackUrl =
    typeof fileOrDataUrl === "string"
      ? fileOrDataUrl
      : await fileToDataUrl(fileOrDataUrl);

  const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    url: fallbackUrl,
    secureUrl: fallbackUrl,
    publicId: localId,
    isLocalFallback: true,
  };
}

/**
 * Generates an optimized Cloudinary thumbnail URL with auto format and smart face/center cropping.
 */
export function getCloudinaryThumbnail(url: string, width = 200, height = 200): string {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace(
    /\/upload\/(?:v\d+\/)?/,
    (match) => `${match}c_thumb,w_${width},h_${height},g_auto,f_auto,q_auto/`,
  );
}

/**
 * Generates an optimized responsive Cloudinary image URL.
 */
export function getCloudinaryOptimized(url: string, width?: number): string {
  if (!url || !url.includes("cloudinary.com")) return url;
  const transform = width
    ? `w_${width},c_limit,f_auto,q_auto/`
    : `f_auto,q_auto/`;
  return url.replace(/\/upload\/(?:v\d+\/)?/, (match) => `${match}${transform}`);
}

/**
 * Checks if a URL is hosted on Cloudinary CDN.
 */
export function isCloudinaryUrl(url?: string): boolean {
  return Boolean(url && url.includes("res.cloudinary.com"));
}

function fileToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
