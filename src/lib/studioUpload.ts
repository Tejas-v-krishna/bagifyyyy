"use client";

import { upload } from "@vercel/blob/client";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Long edge cap for studio uploads — plenty for 3:4 product shots. */
const MAX_DIMENSION = 1600;
/** WebP quality: visually lossless for product photos at a tenth of PNG size. */
const WEBP_QUALITY = 0.82;

/**
 * Downscale + convert to WebP in the browser (also strips EXIF metadata).
 * A 2MB PNG typically lands around 150–300KB. Falls back to the original
 * file if anything fails, so compression can never block an upload.
 */
async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(bitmap, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
      );
      if (!blob) return file;
      const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
      return new File([blob], name, { type: "image/webp" });
    } finally {
      bitmap.close();
    }
  } catch {
    return file;
  }
}

/**
 * Upload device files and return their public URLs.
 *
 * Production (Vercel) has a read-only filesystem and a ~4.5MB server body
 * limit, so files go straight from the browser to Blob storage via a
 * short-lived token minted by /api/studio/blob-upload. When Blob isn't
 * configured (local dev), it falls back to the legacy /api/studio/upload
 * route that writes into public/uploads.
 */
export async function uploadDeviceImages(files: File[]): Promise<string[]> {
  const valid = files.filter((f) => f instanceof File && IMAGE_TYPES.includes(f.type));
  if (valid.length === 0) {
    throw new Error("Only JPEG, PNG, WebP, and AVIF images are allowed.");
  }

  // Shrink before sending: keeps Blob usage ~10x lower with no visible loss.
  const compressed = await Promise.all(valid.map(compressImage));

  // Preferred path: direct-to-Blob (works on Vercel, no size bottleneck).
  try {
    const blobs = await Promise.all(
      compressed.map((file) =>
        upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/studio/blob-upload",
        })
      )
    );
    return blobs.map((b) => b.url);
  } catch {
    // Fall through to the legacy local route below.
  }

  // Fallback: legacy server-side route (local dev filesystem).
  const formData = new FormData();
  compressed.forEach((file) => formData.append("files", file));

  const res = await fetch("/api/studio/upload", { method: "POST", body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to upload image from device.");

  const urls: string[] = data.urls || (data.url ? [data.url] : []);
  if (urls.length === 0) throw new Error("Failed to upload image from device.");
  return urls;
}
