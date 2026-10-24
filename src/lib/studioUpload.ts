"use client";

import { upload } from "@vercel/blob/client";
import { isSupportedImageFile, IMAGE_FORMATS_HINT } from "./imageFormats";

function isImageFile(file: File): boolean {
  return isSupportedImageFile(file);
}

/**
 * Upload a single image file directly to /api/studio/upload, with direct-to-Blob fallback.
 * Sends the raw original file untouched without client-side compression or downscaling.
 */
async function uploadSingleImage(file: File): Promise<string> {
  let lastError: string | null = null;

  // Primary path: /api/studio/upload (streams original image directly to Cloudflare R2 with $0 egress)
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/studio/upload", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const url: string = data.url || (data.urls && data.urls[0]);
      if (url) return url;
    } else {
      if (data?.error) {
        lastError = data.error;
      } else if (res.status === 413) {
        lastError = `Photo "${file.name}" exceeds the server maximum upload size.`;
      } else if (res.status === 401) {
        lastError = "Admin session expired or unauthorized. Please re-login.";
      } else {
        lastError = `Server returned error (${res.status} ${res.statusText})`;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Direct R2 upload failed for single image, trying fallback:", err);
    if (!lastError) lastError = msg;
  }

  // Fallback: direct-to-Blob (if Vercel Blob is configured)
  try {
    const blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/studio/blob-upload",
    });
    if (blob?.url) return blob.url;
  } catch (blobErr) {
    console.warn("Blob upload fallback failed:", blobErr);
  }

  throw new Error(lastError || `Failed to upload image "${file.name}". Please check file format and connection.`);
}

export interface UploadProgress {
  current: number;
  total: number;
  fileName: string;
}

export async function uploadDeviceImages(
  files: File[],
  onProgress?: (progress: UploadProgress) => void
): Promise<string[]> {
  const valid = files.filter(isImageFile);
  if (valid.length === 0) {
    throw new Error(`Only image files are allowed (${IMAGE_FORMATS_HINT}).`);
  }

  // Upload files individually to keep mobile memory low and stay within payload limits
  const uploadedUrls: string[] = [];
  for (let i = 0; i < valid.length; i++) {
    const file = valid[i];
    onProgress?.({ current: i + 1, total: valid.length, fileName: file.name });
    const url = await uploadSingleImage(file);
    uploadedUrls.push(url);
  }

  return uploadedUrls;
}
