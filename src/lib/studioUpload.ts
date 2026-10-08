"use client";

import { upload } from "@vercel/blob/client";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

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

  // Preferred path: direct-to-Blob (works on Vercel, no size bottleneck).
  try {
    const blobs = await Promise.all(
      valid.map((file) =>
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
  valid.forEach((file) => formData.append("files", file));

  const res = await fetch("/api/studio/upload", { method: "POST", body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to upload image from device.");

  const urls: string[] = data.urls || (data.url ? [data.url] : []);
  if (urls.length === 0) throw new Error("Failed to upload image from device.");
  return urls;
}
