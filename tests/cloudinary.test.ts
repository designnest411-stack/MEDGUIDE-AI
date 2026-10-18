import { describe, it, expect } from "vitest";
import {
  getCloudinaryThumbnail,
  getCloudinaryOptimized,
  isCloudinaryUrl,
  uploadToCloudinary,
} from "@/lib/cloudinary";

describe("Cloudinary Medical Storage Utility", () => {
  const sampleCloudinaryUrl =
    "https://res.cloudinary.com/medguide-demo/image/upload/v1713400000/medguide-clinical/chest_xray_normal.png";

  describe("getCloudinaryThumbnail", () => {
    it("should inject auto-format, quality, and thumb crop parameters into Cloudinary URL", () => {
      const thumb = getCloudinaryThumbnail(sampleCloudinaryUrl, 150, 150);
      expect(thumb).toContain("c_thumb,w_150,h_150,g_auto,f_auto,q_auto");
      expect(thumb).toContain("medguide-clinical/chest_xray_normal.png");
    });

    it("should return the original URL unmodified if not hosted on Cloudinary", () => {
      const localUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...";
      expect(getCloudinaryThumbnail(localUrl)).toBe(localUrl);
    });
  });

  describe("getCloudinaryOptimized", () => {
    it("should add responsive width limits and auto-format/auto-quality", () => {
      const optimized = getCloudinaryOptimized(sampleCloudinaryUrl, 800);
      expect(optimized).toContain("w_800,c_limit,f_auto,q_auto");
    });

    it("should add auto-format and auto-quality without width if width is omitted", () => {
      const optimized = getCloudinaryOptimized(sampleCloudinaryUrl);
      expect(optimized).toContain("f_auto,q_auto");
      expect(optimized).not.toContain("w_");
    });
  });

  describe("isCloudinaryUrl", () => {
    it("should correctly identify Cloudinary CDN URLs", () => {
      expect(isCloudinaryUrl(sampleCloudinaryUrl)).toBe(true);
      expect(isCloudinaryUrl("https://res.cloudinary.com/my-cloud/image/upload/x.jpg")).toBe(true);
      expect(isCloudinaryUrl("https://storage.googleapis.com/bucket/scan.jpg")).toBe(false);
      expect(isCloudinaryUrl("data:image/jpeg;base64,/9j/4AAQSkZJRg==")).toBe(false);
      expect(isCloudinaryUrl(undefined)).toBe(false);
    });
  });

  describe("uploadToCloudinary live and fallback behavior", () => {
    it("should successfully upload a valid image to Cloudinary CDN using configured preset", async () => {
      // 1x1 transparent PNG data URL
      const validPng =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
      const result = await uploadToCloudinary(validPng, {
        folder: "medguide-clinical",
        tags: ["test", "ci"],
      });

      expect(result).toBeDefined();
      expect(result.secureUrl).toContain("cloudinary.com");
      expect(result.isLocalFallback).toBe(false);
      expect(result.format).toBe("png");
    });
  });
});
