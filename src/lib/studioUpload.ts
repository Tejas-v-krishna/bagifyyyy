"use client";

import { upload } from "@vercel/blob/client";
import { isSupportedImageFile, IMAGE_FORMATS_HINT } from "./imageFormats";

export const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit
const VERCEL_PAYLOAD_SAFE_LIMIT = 4 * 1024 * 1024; // 4 MB safety margin for 4.5MB Vercel serverless limit

function isImageFile(file: File): boolean {
  return isSupportedImageFile(file);
}

/**
 * Client-side high-resolution WebP compression fallback.
 * Used when an image is large (e.g. 4MB–10MB) and exceeds Vercel's 4.5MB serverless payload limit.
 * Preserves ultra-high resolution (up to 2560px) and 0.90 quality so visual fidelity stays crisp.
 */
async function compressImageForVercel(file: File): Promise<File> {
  const nameLower = (file.name || "").toLowerCase();
  const mimeLower = (file.type || "").toLowerCase();
  if (
    mimeLower === "image/svg+xml" ||
    mimeLower === "image/gif" ||
    nameLower.endsWith(".svg") ||
    nameLower.endsWith(".gif")
  ) {
    return file;
  }

  const MAX_DIMENSION = 2560;
  const WEBP_QUALITY = 0.90;

  const renderToCompressedBlob = (
    source: CanvasImageSource,
    origWidth: number,
    origHeight: number
  ): Promise<File | null> => {
    return new Promise((resolve) => {
      try {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(origWidth, origHeight));
        const width = Math.max(1, Math.round(origWidth * scale));
        const height = Math.max(1, Math.round(origHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(source, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob && (blob.type === "image/webp" || blob.type === "")) {
              const cleanBase = (file.name || "image").replace(/\.[^.]+$/, "");
              const name = `${cleanBase}.webp`;
              const compressedFile = new File([blob], name, { type: "image/webp" });
              console.log(
                `[Studio Upload] Optimized for Vercel payload "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)} MB) -> "${name}" (${(compressedFile.size / 1024 / 1024).toFixed(1)} MB)`
              );
              resolve(compressedFile);
            } else {
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    const cleanBase = (file.name || "image").replace(/\.[^.]+$/, "");
                    const name = `${cleanBase}.jpg`;
                    const compressedFile = new File([jpegBlob], name, { type: "image/jpeg" });
                    resolve(compressedFile);
                  } else {
                    resolve(null);
                  }
                },
                "image/jpeg",
                WEBP_QUALITY
              );
            }
          },
          "image/webp",
          WEBP_QUALITY
        );
      } catch (err) {
        console.warn("[Studio Upload] Canvas compression fallback error:", err);
        resolve(null);
      }
    });
  };

  try {
    if (typeof createImageBitmap === "function") {
      try {
        let bitmap: ImageBitmap;
        try {
          bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        } catch {
          bitmap = await createImageBitmap(file);
        }
        try {
          const compressed = await renderToCompressedBlob(bitmap, bitmap.width, bitmap.height);
          if (compressed) return compressed;
        } finally {
          bitmap.close();
        }
      } catch {
        // createImageBitmap failed, fallback to Image element below
      }
    }

    return await new Promise<File>((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = async () => {
        URL.revokeObjectURL(url);
        const compressed = await renderToCompressedBlob(img, img.naturalWidth, img.naturalHeight);
        resolve(compressed || file);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  } catch {
    return file;
  }
}

async function sendUploadRequest(fileToSend: File): Promise<{ ok: boolean; url?: string; status?: number; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("file", fileToSend);

    const res = await fetch("/api/studio/upload", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const url: string = data.url || (data.urls && data.urls[0]);
      if (url) return { ok: true, url };
    }
    return {
      ok: false,
      status: res.status,
      error: data?.error || (res.status === 413 ? "Payload exceeds serverless upload limit" : undefined),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Upload a single image file directly to /api/studio/upload, with direct-to-Blob fallback.
 * Sends raw original file untouched if <= 4MB, or falls back to crisp client optimization
 * if the upload hits Vercel's 4.5MB serverless function payload limit (HTTP 413).
 */
async function uploadSingleImage(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_FILE_SIZE) {
    throw new Error(
      `Photo "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the 10 MB limit. Please select an image under 10 MB.`
    );
  }

  let lastError: string | null = null;

  // Primary attempt: send raw file directly to /api/studio/upload
  const primaryResult = await sendUploadRequest(file);
  if (primaryResult.ok && primaryResult.url) {
    return primaryResult.url;
  }

  if (primaryResult.error) {
    lastError = primaryResult.error;
  }

  // Fallback 1: direct-to-Blob (if Vercel Blob is configured)
  try {
    const blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/studio/blob-upload",
    });
    if (blob?.url) return blob.url;
  } catch (blobErr) {
    console.warn("Blob upload fallback failed:", blobErr);
  }

  // Fallback 2: If raw upload failed due to 413 or payload limits (>4MB),
  // optimize client-side to high-res WebP and re-upload to stay within Vercel's 4.5MB limit
  if (file.size > VERCEL_PAYLOAD_SAFE_LIMIT || primaryResult.status === 413) {
    try {
      const compressed = await compressImageForVercel(file);
      if (compressed && compressed !== file && compressed.size < file.size) {
        const retryResult = await sendUploadRequest(compressed);
        if (retryResult.ok && retryResult.url) {
          return retryResult.url;
        }
        if (retryResult.error) lastError = retryResult.error;
      }
    } catch (optErr) {
      console.warn("Client optimization fallback failed:", optErr);
    }
  }

  throw new Error(
    lastError || `Failed to upload image "${file.name}". Please check file format and connection.`
  );
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

  // Validate upfront that no file exceeds the 10 MB limit
  for (const file of valid) {
    if (file.size > MAX_UPLOAD_FILE_SIZE) {
      throw new Error(
        `Photo "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the 10 MB limit. Please select an image under 10 MB.`
      );
    }
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
