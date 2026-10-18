import { createServerFn } from "@tanstack/react-start";
import crypto from "crypto";

export interface ServerUploadResult {
  success: boolean;
  url?: string;
  secureUrl?: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  error?: string;
}

export const uploadAssetServerFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { dataUrl: string; folder?: string; tags?: string[] }) => input,
  )
  .handler(async ({ data }): Promise<ServerUploadResult> => {
    try {
      const cloudName =
        process.env["CLOUDINARY_CLOUD_NAME"] ||
        process.env["VITE_CLOUDINARY_CLOUD_NAME"];
      const apiKey = process.env["CLOUDINARY_API_KEY"];
      const apiSecret = process.env["CLOUDINARY_API_SECRET"];
      const uploadPreset =
        process.env["CLOUDINARY_UPLOAD_PRESET"] ||
        process.env["VITE_CLOUDINARY_UPLOAD_PRESET"];

      if (!cloudName) {
        return {
          success: false,
          error: "Cloudinary cloud name is not set in environment.",
        };
      }

      const folder = data.folder || "medguide-clinical";
      const timestamp = Math.round(Date.now() / 1000);

      const formData = new FormData();
      formData.append("file", data.dataUrl);

      if (apiKey && apiSecret) {
        // Signed upload with Cloudinary HMAC/SHA1
        const paramsToSign: Record<string, string> = {
          folder,
          timestamp: String(timestamp),
        };

        const sortedKeys = Object.keys(paramsToSign).sort();
        const stringToSign =
          sortedKeys.map((k) => `${k}=${paramsToSign[k]}`).join("&") + apiSecret;
        const signature = crypto
          .createHash("sha1")
          .update(stringToSign)
          .digest("hex");

        formData.append("api_key", apiKey);
        formData.append("timestamp", String(timestamp));
        formData.append("folder", folder);
        formData.append("signature", signature);
      } else if (uploadPreset) {
        // Unsigned preset upload
        formData.append("upload_preset", uploadPreset);
        formData.append("folder", folder);
      } else {
        return {
          success: false,
          error: "Neither Cloudinary API Key/Secret nor Upload Preset is configured.",
        };
      }

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        return { success: false, error: `Cloudinary upload error: ${errText}` };
      }

      const json = await uploadRes.json();
      return {
        success: true,
        url: json.url,
        secureUrl: json.secure_url,
        publicId: json.public_id,
        width: json.width,
        height: json.height,
        format: json.format,
        bytes: json.bytes,
      };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });
